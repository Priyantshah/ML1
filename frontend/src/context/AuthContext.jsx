import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useGoogleLogin } from '@react-oauth/google';

const getApiBaseUrl = () => {
  const buildUrl = import.meta.env.VITE_API_URL;
  if (buildUrl && buildUrl !== '/api' && !buildUrl.startsWith('http://localhost:3002')) {
    return buildUrl.endsWith('/api') ? buildUrl.slice(0, -4) : buildUrl;
  }
  if (typeof window !== 'undefined' && (window.location.hostname.includes('pages.dev') || window.location.hostname.includes('automl-builder-frontend'))) {
    return 'https://automl-backend-copy-copy-copy-production.up.railway.app';
  }
  return 'http://localhost:3002';
};

const API_BASE = getApiBaseUrl();

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);

        const localUserStr = localStorage.getItem('localUser');
        let localUserObj = null;
        try { if (localUserStr) localUserObj = JSON.parse(localUserStr); } catch (e) { }

        // Give priority to Supabase session, otherwise fallback to local
        // Google session if they authenticated directly without Supabase OAuth.
        if (session && session.user) {
          setUser(session.user);
        } else if (localUserObj) {
          setUser(localUserObj);
        } else {
          setUser(null);
        }

        setLoading(false);
      }
    });

    // Listen for Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setSession(session);
          if (session && session.user) {
            setUser(session.user);
          } else {
            // Check if there is a local user before nullifying completely
            const localUser = localStorage.getItem('localUser');
            if (!localUser) {
              setUser(null);
            }
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // NEW: Sync user activity with backend to track 'Active' status
  useEffect(() => {
    if (user && user.email) {
      const syncUser = async () => {
        try {
          await fetch(`${API_BASE}/api/auth/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              name: user.user_metadata?.full_name || user.name || user.email.split('@')[0],
              picture: user.user_metadata?.avatar_url || user.picture || null
            })
          });
        } catch (err) {
          console.warn('Activity sync failed:', err);
        }
      };

      syncUser();

      // Heartbeat interval to track session time accurately
      const heartbeat = async () => {
        try {
          await fetch(`${API_BASE}/api/auth/heartbeat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email })
          });
        } catch (e) { }
      };

      const syncInterval = setInterval(syncUser, 5 * 60 * 1000); // sync profile every 5 mins
      const heartbeatInterval = setInterval(heartbeat, 30 * 1000); // heartbeat every 30s

      return () => {
        clearInterval(syncInterval);
        clearInterval(heartbeatInterval);
      };
    }
  }, [user]);

  // Security & Config Diagnostic
  useEffect(() => {
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (key) {
      try {
        const payload = JSON.parse(atob(key.split('.')[1]));
        if (payload.role === 'service_role') {
          console.warn('⚠️ SECURITY ALERT: Your frontend is using a SUPABASE_SERVICE_ROLE_KEY instead of an ANON_KEY. This will cause 400 errors during login and is a major security risk.');
        }
      } catch (e) {
        // Not a JWT or malformed
      }
    }
  }, []);

  const signIn = async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Supabase SignIn Error:', error);
        // Special diagnostic for common 400 errors
        if (error.status === 400) {
          if (error.message.toLowerCase().includes('confirmed')) {
            throw new Error('Please confirm your email address before signing in.');
          }
          if (error.message.toLowerCase().includes('invalid')) {
            throw new Error('Invalid email or password. Please check your credentials.');
          }
        }
        throw error;
      }
      return data;
    } catch (err) {
      console.error('SignIn Trace:', err);
      throw err;
    }
  };

  const signUp = async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/dashboard'
        }
      });
      if (error) {
        console.error('Supabase SignUp Error:', error);
        throw error;
      }
      // If user is created but identities are empty, they might already exist
      if (data?.user && data.user.identities?.length === 0) {
        throw new Error('This email is already registered. Please sign in instead.');
      }
      return data;
    } catch (err) {
      console.error('SignUp Trace:', err);
      throw err;
    }
  };

  const executeGoogleLogin = useGoogleLogin({
    flow: 'auth-code',
    ux_mode: 'popup',
    onSuccess: async (codeResponse) => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: codeResponse.code })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errText}`);
        }

        const result = await response.json();

        if (result.status === 'success') {
          const userObj = result.data.user;
          localStorage.setItem('localUser', JSON.stringify(userObj));
          setUser(userObj);
          window.location.href = '/dashboard';
        } else {
          throw new Error(result.message || 'Google Auth Error');
        }
      } catch (err) {
        console.error('Registration/Login error:', err);
        throw err;
      }
    },
    onError: (error) => {
      console.error('Google Sign In failed:', error);
      throw error;
    }
  });

  const signInWithGoogle = () => {
    executeGoogleLogin();
  };

  const signOut = async () => {
    // Attempt standard Supabase sign out
    const { error } = await supabase.auth.signOut();
    // Clear local stored Google token
    localStorage.removeItem('localUser');
    setUser(null);
    setSession(null);

    // Redirect to login
    window.location.href = '/';
    if (error) throw error;
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
