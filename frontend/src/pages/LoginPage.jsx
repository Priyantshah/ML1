import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, 
  LineChart, 
  Cpu, 
  BrainCircuit, 
  Database, 
  Zap,
  TrendingUp,
  PieChart,
  Activity
} from 'lucide-react';
import './LoginPage.css';

const LoginPage = () => {
  const { user, loading, signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('neutral');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Track Mouse Position for Parallax and Interaction
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!loading && user) {
    // Already logged in → go to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // Calculate Parallax Shifts (Directional pull toward cursor)
  const calculateShift = (factor) => ({
    transform: `translate(${(mousePos.x - window.innerWidth / 2) * factor}px, ${(mousePos.y - window.innerHeight / 2) * factor}px)`
  });

  const setStatusMessage = (message, type = 'neutral') => {
    setStatus(message);
    setStatusType(type);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setStatusMessage('Email and password are required', 'error');
      return;
    }

    setSubmitting(true);
    setStatusMessage(isSignUp ? 'Signing up…' : 'Signing in…', 'neutral');

    try {
      if (isSignUp) {
        await signUp({ email: email.trim(), password: password.trim() });
        setStatusMessage('Sign up successful! Redirecting…', 'success');
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 600);
      } else {
        await signIn({ email: email.trim(), password: password.trim() });
        setStatusMessage('Login successful. Redirecting…', 'success');
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 600);
      }
    } catch (err) {
      setStatusMessage(err.message || 'Unable to sign in. Please try again.', 'error');
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setStatusMessage('Redirecting to Google...', 'neutral');
      await signInWithGoogle();
    } catch (err) {
      setStatusMessage(err.message || 'Google sign-in failed.', 'error');
    }
  };

  return (
    <div className="login-page-root" onMouseMove={(e) => {
      const x = e.clientX;
      const y = e.clientY;
      document.documentElement.style.setProperty('--mouse-x', `${x}px`);
      document.documentElement.style.setProperty('--mouse-y', `${y}px`);
    }}>
      {/* Magical Interactive Energy Aura */}
      <div className="energy-aura"></div>
      
      {/* Extra floating sparks for magical feel */}
      <div className="magical-sparks">
        {[...Array(12)].map((_, i) => (
          <div key={i} className={`spark spark-${i % 4}`} style={{ 
            left: `${Math.random() * 100}%`, 
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`
          }} />
        ))}
      </div>

      {/* Background Decorative Blobs with Parallax */}
      <div className="bg-blobs" style={calculateShift(0.04)}>
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Dynamic ML Pipeline Background with Deep Parallax */}
      <div className="ml-pipeline-flow" style={calculateShift(-0.025)}>
        {/* Stage 1: Raw Data (Left side) */}
        <div className="pipeline-stage stage-data">
          <div className="stage-label">RAW DATA</div>
          <div className="icon-wrapper">
            <Database className="pipeline-icon p1" />
            <Database className="pipeline-icon p2" />
            <Activity className="pipeline-icon p3" />
          </div>
          <div className="energy-pulse-emitter"></div>
        </div>

        {/* Path Data -> Prep */}
        <svg className="flow-path path1"><path d="M150,300 C250,300 250,300 350,300" className="path-line" /></svg>
        <div className="data-packet packet-1 energy-pulse"></div>

        {/* Stage 2: Preprocessing (Mid-left) */}
        <div className="pipeline-stage stage-prep">
          <div className="stage-label">PREPROCESSING</div>
          <div className="icon-wrapper">
            <Cpu className="pipeline-icon p4" />
            <Zap className="pipeline-icon p5" />
          </div>
        </div>

        {/* Path Prep -> EDA */}
        <svg className="flow-path path2"><path d="M450,300 C550,300 550,300 650,300" className="path-line" /></svg>
        <div className="data-packet packet-2 energy-pulse"></div>

        {/* Stage 3: EDA (Center) */}
        <div className="pipeline-stage stage-eda highlighted" style={calculateShift(0.015)}>
          <div className="stage-label">EXPLORATORY ANALYSIS</div>
          <div className="icon-wrapper">
            <BarChart3 className="pipeline-icon p6" />
            <PieChart className="pipeline-icon p7" />
          </div>
        </div>

        {/* Path EDA -> Models */}
        <svg className="flow-path path3"><path d="M750,300 C850,300 850,300 950,300" className="path-line" /></svg>
        <div className="data-packet packet-3 energy-pulse"></div>

        {/* Stage 4: Model Training (Mid-right) */}
        <div className="pipeline-stage stage-models highlighted">
          <div className="stage-label">AutoML CORE</div>
          <div className="icon-wrapper core-highlight">
            <BrainCircuit className="pipeline-icon p8" />
            <Cpu className="pipeline-icon p9" />
            {/* Glowing Energy Core for AutoML */}
            <div className="energy-core"></div>
          </div>
        </div>

        {/* Path Models -> Predictions */}
        <svg className="flow-path path4"><path d="M1050,300 C1150,300 1150,300 1250,300" className="path-line" /></svg>
        <div className="data-packet packet-4 energy-pulse"></div>

        {/* Stage 5: Prediction & Insights (Right side) */}
        <div className="pipeline-stage stage-results">
          <div className="stage-label">INSIGHTS</div>
          <div className="icon-wrapper">
            <LineChart className="pipeline-icon p10" />
            <TrendingUp className="pipeline-icon p11" />
          </div>
        </div>

        {/* Gradient Definitions */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <filter id="energyGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
        </svg>
      </div>

      {/* Title Section with light parallax */}
      <div className="login-title-container" style={calculateShift(-0.01)}>
        <h1 className="main-app-title">
          Predictive and Visual Analytics of Leaderboard Performance Using EDA and AutoML
        </h1>
        <div className="title-underline"></div>
      </div>

      <div className="login-card">
        <div className="login-accent-bar" />
        <div className="login-header">
          <div className="login-logo-circle">
            <span className="login-logo-initials">AI</span>
          </div>
        </div>

        <h2 className="login-title">{isSignUp ? 'Create your account' : 'Sign in to your workspace'}</h2>
        <p className="login-subtitle">
          {isSignUp
            ? 'Join the platform to build and deploy ML models in minutes.'
            : 'Access your environment to start making data-driven predictions.'}
        </p>

        <button type="button" className="login-google-btn" onClick={handleGoogleSignIn}>
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <div className="login-divider">
          <span>or use your email</span>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="email" className="login-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="login-input"
              placeholder="you@company.com"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password" className="login-label">
              Password
            </label>
            <div className="login-password-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="login-input"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="login-row">
            <label className="login-remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />{' '}
              Remember session
            </label>
            {!isSignUp && (
              <button
                type="button"
                className="login-link-button"
                onClick={() => {
                  if (!email) {
                    setStatusMessage('Enter your email to reset password.', 'error');
                    return;
                  }
                  window.supabaseResetPassword?.(email);
                  setStatusMessage('If this email exists, a reset link has been sent.', 'success');
                }}
              >
                Forgot password?
              </button>
            )}
          </div>

          <button type="submit" className="login-submit" disabled={submitting || loading}>
            {submitting || loading ? (
              <span className="login-submit-content">
                <span className="login-spinner" />
                {isSignUp ? 'Creating account…' : 'Processing…'}
              </span>
            ) : (
              <span className="login-submit-content">
                {isSignUp ? 'Create account' : 'Sign in'}
              </span>
            )}
          </button>

          <div className="login-switch-auth">
            <span>
              {isSignUp ? 'Already have an account?' : "Don’t have an account yet?"}{' '}
            </span>
            <button
              type="button"
              className="login-link-button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setStatus('');
              }}
            >
              {isSignUp ? 'Sign in' : 'Get started for free'}
            </button>
          </div>

          <div className={`login-status login-status-${statusType}`}>{status}</div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

