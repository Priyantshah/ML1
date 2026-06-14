import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useParams,
} from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import UploadPage from './pages/UploadPage';
import PreviewPage from './pages/PreviewPage';
import EDAPage from './pages/EDAPage';
import TrainPage from './pages/TrainPage';
import ResultsPage from './pages/ResultsPage';
import PredictPage from './pages/PredictPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DataCleaningPage from './pages/DataCleaningPage';
import BestModelPage from './pages/BestModelPage';
import PredictionCenterPage from './pages/PredictionCenterPage';
import AnalysisReportPage from './pages/AnalysisReportPage';

import AdminPage from './pages/AdminPage';
import DocumentationPage from './pages/DocumentationPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import SupportPage from './pages/SupportPage';
import { BlogPage, BlogPostPage } from './pages/BlogPage';
import { AutoMLProvider } from './context/AutoMLContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Wrapper to pass :id param to BlogPostPage
const BlogPostWrapper = () => {
  const { id } = useParams();
  return <BlogPostPage postId={id} />;
};

// Simple wrapper that checks Supabase auth state before rendering dashboard area
const RequireAuth = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="page-container">Checking authentication…</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

// Admin authentication wrapper
const RequireAdmin = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="page-container">Verifying admin access…</div>;
  }

  // Only allow specifically this email
  if (user?.email !== 'priyantshah3001@gmail.com') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <AutoMLProvider>
        <Router>
          <Routes>
            {/* Public Blog Routes - accessible without login */}
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:id" element={<BlogPostWrapper />} />

            {/* Public login route at root */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<Navigate to="/" replace />} />

            {/* Protected dashboard routes */}
            <Route element={<RequireAuth />}>

              {/* Secure Admin Portal */}
              <Route element={<RequireAdmin />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>

              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* Workflow routes */}
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/preview" element={<PreviewPage />} />
                <Route path="/clean" element={<DataCleaningPage />} />
                <Route path="/eda" element={<EDAPage />} />
                <Route path="/train" element={<TrainPage />} />

                {/* Model comparison & best model */}
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/comparison" element={<ResultsPage />} />
                <Route path="/best-model" element={<BestModelPage />} />

                {/* Prediction center */}
                <Route path="/predict" element={<PredictPage />} />
                <Route path="/prediction" element={<PredictionCenterPage />} />
                <Route path="/report" element={<AnalysisReportPage />} />

                {/* Settings */}


                {/* Documentation */}
                <Route path="/docs" element={<DocumentationPage />} />

                {/* Privacy */}
                <Route path="/privacy" element={<PrivacyPage />} />

                {/* Terms */}
                <Route path="/terms" element={<TermsPage />} />

                {/* Support */}
                <Route path="/support" element={<SupportPage />} />

                {/* Backwards-compatible default */}
                <Route
                  path=""
                  element={<Navigate to="/dashboard" replace />}
                />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AutoMLProvider>
    </AuthProvider>
  );
}

export default App;
