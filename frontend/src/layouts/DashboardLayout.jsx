import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Upload,
    Sliders,
    BarChart2,
    Cpu,
    Scale,
    Trophy,
    Zap,
    BookOpen,
    Shield,
    FileText,
    LifeBuoy,
    Heart,
    CheckCircle2,
    ChevronRight,
    Search
} from 'lucide-react';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import RobotAvatar from '../components/AIAssistant/RobotAvatar';
import ChatWindow from '../components/AIAssistant/ChatWindow';
import '../components/AIAssistant/index.css';
import { useAuth } from '../context/AuthContext';
import './DashboardLayout.css';

const DashboardLayout = () => {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const { user, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const workflowSteps = [
        { key: 'upload', label: 'Dataset Upload', icon: Upload },
        { key: 'missing', label: 'Missing Value Handling', icon: Search },
        { key: 'encoding', label: 'Feature Encoding', icon: Zap },
        { key: 'eda', label: 'Exploratory Data Analysis', icon: BarChart2 },
        { key: 'train', label: 'Model Training', icon: Cpu },
        { key: 'evaluation', label: 'Model Evaluation', icon: Trophy },
    ];

    const getActiveStepKey = () => {
        const path = location.pathname;
        if (path.startsWith('/upload')) return 'upload';
        if (path.startsWith('/preview')) return 'missing';
        if (path.startsWith('/eda')) return 'eda';
        if (path.startsWith('/train')) return 'train';
        if (path.startsWith('/results') || path.startsWith('/comparison') || path.startsWith('/best-model')) return 'evaluation';
        return 'upload';
    };

    const activeStepKey = getActiveStepKey();

    const NavItems = () => (
        <nav className="nav-menu">
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                <LayoutDashboard size={20} />
                <span>Dashboard Overview</span>
            </NavLink>
            <NavLink to="/upload" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                <Upload size={20} />
                <span>Dataset Upload</span>
            </NavLink>
            {user?.email === 'priyantshah3001@gmail.com' && (
                <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                    <Shield size={20} />
                    <span>Admin Panel</span>
                </NavLink>
            )}
            <NavLink to="/blog" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                <BookOpen size={20} />
                <span>Blog</span>
            </NavLink>
            <NavLink to="/report" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                <FileText size={20} />
                <span>Analysis Report</span>
            </NavLink>
        </nav>
    );

    return (
        <div className={`dashboard-layout ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
            {/* Desktop Sidebar */}
            <aside className="sidebar desktop-sidebar">
                <div className="logo">
                    <div className="logo-icon-wrapper">
                        <LayoutDashboard size={26} />
                    </div>
                    <span className="logo-text">Visual & Predictive Analytics</span>
                </div>

                <NavItems />

                <div className="sidebar-footer">
                    <div className="theme-switcher-wrapper">
                        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                        <span className="theme-label">{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
                    </div>

                    <button onClick={handleLogout} className="logout-button">
                        <span>Logout Session</span>
                    </button>

                    <p className="sidebar-footer-meta">© {new Date().getFullYear()} Visual & Predictive Analytics</p>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="mobile-sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}>
                    <aside className="mobile-sidebar" onClick={e => e.stopPropagation()}>
                        <div className="mobile-sidebar-header">
                            <div className="logo-icon-wrapper mini">
                                <LayoutDashboard size={20} />
                            </div>
                            <button className="close-menu-btn" onClick={() => setIsMobileMenuOpen(false)}>×</button>
                        </div>
                        <NavItems />
                        <div className="mobile-sidebar-footer">
                             <div className="theme-switcher-wrapper">
                                <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                            </div>
                            <button onClick={handleLogout} className="logout-button mini">
                                Logout
                            </button>
                        </div>
                    </aside>
                </div>
            )}

            <div className="main-wrapper">
                <header className="topbar">
                    <div className="topbar-left">
                        <button className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(true)}>
                            <div className="hamburger-line"></div>
                            <div className="hamburger-line"></div>
                            <div className="hamburger-line"></div>
                        </button>
                        <div className="topbar-context">
                            <span className="topbar-badge">Intelligent AutoML</span>
                            <h2 className="topbar-title">Visual & Predictive Analytics</h2>
                        </div>
                    </div>
                    <div className="topbar-right">
                        <div className="topbar-user">
                            <span className="topbar-avatar">
                                {(user?.email || 'A')[0].toUpperCase()}
                            </span>
                            <span className="topbar-user-email desktop-only">{user?.email}</span>
                        </div>
                    </div>
                </header>

                <div className="dashboard-content-area">
                    {/* Workflow Indicator - More compact for mobile */}
                    <div className="workflow-indicator-container">
                        <div className="workflow-track"></div>
                        {workflowSteps.map((step, index) => {
                            const isActive = step.key === activeStepKey;
                            const isCompleted = workflowSteps.findIndex((s) => s.key === activeStepKey) > index;
                            const StepIcon = step.icon;

                            return (
                                <React.Fragment key={step.key}>
                                    <div className={`workflow-step-node ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                                        <div className="step-icon-box">
                                            {isCompleted ? <CheckCircle2 size={20} /> : <StepIcon size={20} />}
                                        </div>
                                        <span className="step-label">{step.label}</span>
                                    </div>
                                    {index < workflowSteps.length - 1 && (
                                        <div className={`workflow-bridge ${isCompleted ? 'completed' : ''}`}>
                                            {isCompleted && <div className="bridge-glow-pulse"></div>}
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    <main className="main-content">
                        <Outlet />

                        <footer className="dashboard-footer-modern">
                            <div className="footer-premium-glass">
                                <div className="footer-top-row">
                                    <div className="footer-brand-signature">
                                        <div className="brand-icon-poly">
                                            <Zap size={22} fill="currentColor" />
                                        </div>
                                        <div className="brand-text-stack">
                                            <span className="brand-name">Visual & Predictive Analytics</span>
                                            <span className="brand-tagline">Leaderboard Performance via EDA & AutoML</span>
                                        </div>
                                    </div>
                                    <nav className="footer-nav-links">
                                        <a href="/docs" className="footer-link-item"><BookOpen size={16} /> Docs</a>
                                        <a href="/support" className="footer-link-item"><LifeBuoy size={16} /> Support</a>
                                        <a href="/privacy" className="footer-link-item"><Shield size={16} /> Privacy</a>
                                    </nav>
                                </div>
                                <div className="footer-divider-glow"></div>
                                <div className="footer-bottom-row">
                                    <span className="copyright-text">© {new Date().getFullYear()} Visual & Predictive Analytics.</span>
                                    <div className="system-status-indicator">
                                        <div className="status-dot-pulse"></div>
                                        <span>Operational</span>
                                    </div>
                                </div>
                            </div>
                        </footer>
                    </main>
                </div>

                {/* Floating AI assistant */}
                <div className="ai-assistant-launcher">
                    <button
                        type="button"
                        className="ai-assistant-button"
                        onClick={() => setChatOpen(true)}
                        aria-label="Neural Analysis Engine"
                    >
                        <RobotAvatar size={64} />
                        <div className="ai-assistant-tooltip">Automated Intelligence Engine</div>
                    </button>
                    <ChatWindow
                        open={chatOpen}
                        onClose={() => setChatOpen(false)}
                        onMinimize={() => setChatOpen(false)}
                    />
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
