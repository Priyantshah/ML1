import React, { useState, useEffect } from 'react';
import {
    Users,
    Database,
    Cpu,
    BrainCircuit,
    Shield,
    ShieldAlert,
    MessageSquare,
    Activity,
    BarChart2,
    AlertTriangle,
    Monitor,
    MoreVertical,
    CheckCircle2,
    XCircle,
    TrendingUp,
    Clock,
    Download,
    Search,
    Lock,
    MessageSquareQuote,
    BookOpen,
    PenLine,
    Trash2,
    Eye,
    EyeOff,
    Plus,
    Tag,
    RefreshCw,
    FileText
} from 'lucide-react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, ComposedChart, Legend
} from 'recharts';
import './AdminPage.css';

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

const AdminPage = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const [users, setUsers] = useState([]);
    const [datasets, setDatasets] = useState([]);
    const [models, setModels] = useState([]);
    const [predictions, setPredictions] = useState([]);
    const [chats, setChats] = useState([]);
    const [securityLogs, setSecurityLogs] = useState([]);

    // Blog state
    const [blogPosts, setBlogPosts] = useState([]);
    const [blogLoading, setBlogLoading] = useState(false);
    const [blogForm, setBlogForm] = useState({ title: '', excerpt: '', content: '', tags: '', author: 'AutoML Team', published: false, cover_image: '' });
    const [editingPost, setEditingPost] = useState(null);
    const [showBlogForm, setShowBlogForm] = useState(false);
    const [blogSaving, setBlogSaving] = useState(false);

    // Chart stats
    const [overviewData, setOverviewData] = useState([]);
    const [modelPieData, setModelPieData] = useState([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalDatasets: 0,
        totalModels: 0,
        avgSessionTime: '0s',
        chartData: [],
        userActivity: []
    });

    const [loadingConfig, setLoadingConfig] = useState(true);
    const imageInputRef = React.useRef(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch(`${API_BASE}/api/blog/upload`, {
                method: 'POST',
                body: formData
            });
            const json = await res.json();
            if (json.status === 'success') {
                setBlogForm(prev => ({ ...prev, cover_image: json.data.url }));
            } else {
                console.error('Upload Error Details:', json);
                alert('Upload failed: ' + (json.message || 'Check console for details'));
            }
        } catch (err) {
            console.error('Image upload catch error:', err);
            alert('Error uploading image.');
        } finally {
            setUploadingImage(false);
        }
    };

    const [lastUpdated, setLastUpdated] = useState(new Date());

    // Helper to convert decimal hours to human readable Hh Mm
    const formatHours = (hours) => {
        if (hours === undefined || hours === null || isNaN(hours)) return "0h 0m";
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h ${m}m`;
    };

    useEffect(() => {
        const API = `${API_BASE}/api/admin`;

        const fetchAdminData = async (isPoll = false) => {
            if (!isPoll) setLoadingConfig(true);
            try {
                // Parallel fetch for speed
                const [usersRes, datasetsRes, modelsRes, statsRes] = await Promise.all([
                    fetch(`${API}/users`),
                    fetch(`${API}/datasets`),
                    fetch(`${API}/models`),
                    fetch(`${API}/overview-stats`)
                ]);

                if (usersRes.ok) {
                    const usersJson = await usersRes.json();
                    if (usersJson.status === 'success') setUsers(usersJson.data);
                }

                if (datasetsRes.ok) {
                    const datasetsJson = await datasetsRes.json();
                    if (datasetsJson.status === 'success') setDatasets(datasetsJson.data);
                }

                if (modelsRes.ok) {
                    const modelsJson = await modelsRes.json();
                    if (modelsJson.status === 'success') setModels(modelsJson.data);
                }

                if (statsRes.ok) {
                    const statsJson = await statsRes.json();
                    if (statsJson.status === 'success') {
                        setStats(statsJson.data);
                        setLastUpdated(new Date());
                    }
                }
            } catch (err) {
                console.warn("Admin fetch error:", err);
            } finally {
                if (!isPoll) setLoadingConfig(false);
            }
        };

        fetchAdminData();

        // Setup Polling for "Dynamic" Live Updates
        const pollInterval = setInterval(() => {
            fetchAdminData(true);
        }, 30000); // 30 second refresh

        return () => clearInterval(pollInterval);
    }, []);

    const handleDownload = async (bucket, filename) => {
        try {
            const url = `${API_BASE}/api/admin/download?bucket=${bucket}&file=${encodeURIComponent(filename)}`;
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Download error:', err);
            alert('Failed to initiate download.');
        }
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart2 },
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'datasets', label: 'Datasets', icon: Database },
        { id: 'blog', label: 'Blog Manager', icon: BookOpen },
        { id: 'feedback', label: 'Feedback / Support', icon: MessageSquareQuote }
    ];

    const renderOverview = () => (
        <div className="admin-overview animate-fade-in-up">
            {/* DYNAMIC SYNC HEADER */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.7)',
                backdropFilter: 'blur(10px)',
                padding: '12px 20px',
                borderRadius: '16px',
                marginBottom: '1.5rem',
                border: '1px solid rgba(255,255,255,0.3)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                width: '100%'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="live-pulse"></div>
                    <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px', letterSpacing: '0.05em' }}>DYNAMIC LIVE STREAMING</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <RefreshCw size={12} className="spin-slow" />
                    Last Updated: {lastUpdated.toLocaleTimeString()} (Auto-sync 30s)
                </div>
            </div>

            {/* SECTION 1: PLATFORM STATISTICS */}
            <div className="admin-stats-grid">
                <div className="admin-stat-card modern-stat">
                    <div className="stat-icon b-blue"><Users size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.totalUsers || users.length}</span>
                        <span className="stat-label">Total Users</span>
                    </div>
                </div>
                <div className="admin-stat-card modern-stat">
                    <div className="stat-icon b-green"><Database size={24} /></div>
                    <div className="stat-info">
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span className="stat-value">{stats.totalDatasets}</span>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>({stats.historicalTotalDatasets} ever)</span>
                        </div>
                        <span className="stat-label">Datasets Uploaded</span>
                    </div>
                </div>
                <div className="admin-stat-card modern-stat">
                    <div className="stat-icon b-orange"><Clock size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-value">{formatHours(stats.avgSessionTime)}</span>
                        <span className="stat-label">Avg Session Time</span>
                    </div>
                </div>
                <div className="admin-stat-card modern-stat">
                    <div className="stat-icon b-purple"><Cpu size={24} /></div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.totalModels || models.length}</span>
                        <span className="stat-label">Models Trained</span>
                    </div>
                </div>
            </div>

            {/* SECTION 2 & 3: CHARTS */}
            <div className="admin-charts-column">
                <div className="admin-chart-card modern-chart-card">
                    <h3 className="chart-title" style={{ color: '#4f46e5' }}>User Growth & Growth Velocity</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={stats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }}
                                    tickFormatter={(val) => val === 'No Data' ? val : new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '12px' }}
                                    labelFormatter={(val) => `Date: ${val}`}
                                />
                                <Area type="monotone" dataKey="users" name="Active Sessions" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" isAnimationActive={true} animationDuration={1500} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} color="#16a34a" /> Historical activity data is preserved across system state resets.
                    </p>
                </div>

                <div className="admin-chart-card modern-chart-card">
                    <h3 className="chart-title" style={{ color: '#10b981' }}>Dataset Upload Velocity</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={stats.chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }}
                                    tickFormatter={(val) => val === 'No Data' ? val : new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="uploads" name="Files Uploaded" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} isAnimationActive={true} animationDuration={1200} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="admin-chart-card modern-chart-card">
                    <h3 className="chart-title" style={{ color: '#f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Daily User Engagement & Volume</span>
                    </h3>
                    <div className="chart-wrapper" style={{ marginTop: '1rem' }}>
                        <ResponsiveContainer width="100%" height={260}>
                            <ComposedChart data={stats.userActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorUsersVol" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} tickFormatter={(val) => val === 'No Data' ? val : new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                                <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(val) => `${val}h`} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 600, zIndex: 100 }}
                                    formatter={(value, name) => [
                                        name === 'Avg Engagement' ? formatHours(value) : `${value} Users`,
                                        name
                                    ]}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#475569', paddingTop: '10px' }} />
                                <Area yAxisId="left" type="monotone" dataKey="userCount" name="Active Users" fill="url(#colorUsersVol)" stroke="#3b82f6" strokeWidth={3} isAnimationActive={true} animationDuration={1500} />
                                <Line yAxisId="right" type="monotone" dataKey="avgTime" name="Avg Engagement" stroke="#f59e0b" strokeWidth={4} activeDot={{ r: 8, strokeWidth: 0, fill: '#f59e0b' }} isAnimationActive={true} animationDuration={2000} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderUsers = () => (
        <div className="admin-panel fadeIn" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
            {/* Premium Header */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.8)',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
                borderRadius: '20px',
                padding: '1.5rem 2rem',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Shield color="#4f46e5" size={22} /> User Management
                    </h2>
                    <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Monitor and manage registered users.</p>
                </div>
            </div>

            {/* Modern Table Layout */}
            <div style={{ background: '#fff', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div className="table-responsive" style={{ margin: 0, padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>User Config</th>
                                <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Email Address</th>
                                <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Signup Details</th>
                                <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Status</th>
                                <th style={{ padding: '1.25rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '5rem 2rem', color: '#64748b', background: '#fafafa' }}>
                                    <div style={{ display: 'inline-flex', padding: '1rem', background: '#f1f5f9', borderRadius: '50%', marginBottom: 16 }}><Shield size={32} color="#94a3b8" /></div>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#334155' }}>No Tracked Users</h4>
                                    <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem' }}>Users will instantly appear here upon successful Google Authentication routing.</p>
                                </td></tr>
                            ) : users.map((u, idx) => (
                                <tr key={u.id} style={{ borderBottom: idx === users.length - 1 ? 'none' : '1px solid #f1f5f9', transition: 'background 0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        {u.picture ? (
                                            <img src={u.picture} alt={u.name} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e0e7ff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} />
                                        ) : (
                                            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #4338ca)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.1rem', fontWeight: 800, boxShadow: '0 4px 10px rgba(79, 70, 229, 0.2)' }}>
                                                {(u.name || 'U')[0].toUpperCase()}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{u.name}</strong>
                                            <span className="monospace" style={{ fontSize: '0.7rem', color: '#94a3b8', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', width: 'fit-content' }}>ID: {String(u.id).substring(0, 8)}...</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.5rem', color: '#334155', fontSize: '0.9rem', fontWeight: 500 }}>
                                        {u.email}
                                    </td>
                                    <td style={{ padding: '1.5rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 600 }}>Registered: {u.signupDate}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock size={12} /> Last active: {u.lastLogin}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.5rem' }}>
                                        <div align="left">
                                            {u.status.toLowerCase() === 'active' ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#dcfce7', color: '#166534', padding: '6px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }}></div> Active
                                                </span>
                                            ) : (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fee2e2', color: '#991b1b', padding: '6px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#dc2626' }}></div> {u.status}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.5rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', color: '#64748b', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Reset Password"
                                                onMouseOver={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}
                                                onMouseOut={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}>
                                                <Lock size={16} />
                                            </button>

                                            {u.status === 'Blocked' ? (
                                                <button style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px', color: '#16a34a', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Unblock User"
                                                    onMouseOver={e => e.currentTarget.style.background = '#dcfce7'} onMouseOut={e => e.currentTarget.style.background = '#f0fdf4'}>
                                                    <CheckCircle2 size={16} />
                                                </button>
                                            ) : (
                                                <button style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px', color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Block User"
                                                    onMouseOver={e => e.currentTarget.style.background = '#fee2e2'} onMouseOut={e => e.currentTarget.style.background = '#fef2f2'}>
                                                    <XCircle size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const handleDeleteDataset = async (datasetName) => {
        if (!window.confirm(`Are you sure you want to delete dataset: ${datasetName}?`)) return;
        try {
            const res = await fetch(`${API_BASE}/api/admin/dataset/${datasetName}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                // Remove dataset from local state
                setDatasets(datasets.filter(d => d.name !== datasetName));
            } else {
                const data = await res.json();
                alert('Failed to delete dataset: ' + (data.message || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            alert('Error deleting dataset.');
        }
    };

    const handleDeleteAllDatasets = async () => {
        if (!window.confirm('🚨 HIGH ALERT: Are you sure you want to delete ALL datasets from history? This cannot be undone.')) return;
        try {
            const res = await fetch(`${API_BASE}/api/admin/datasets/all`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setDatasets([]);
                alert('All datasets have been cleared from storage.');
            } else {
                const data = await res.json();
                alert('Failed to clear datasets: ' + (data.message || 'Unknown error'));
            }
        } catch (err) {
            console.error(err);
            alert('Error clearing datasets.');
        }
    };

    const renderDatasets = () => (
        <div className="admin-panel fadeIn" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
            {/* Premium Header */}
            <div style={{
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.8)',
                boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
                borderRadius: '20px',
                padding: '1.5rem 2rem',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Database size={22} color="#4f46e5" /> Dataset Management
                    </h2>
                    <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Monitor system storage and uploaded user data files.</p>
                </div>
                <div>
                    <button
                        onClick={handleDeleteAllDatasets}
                        disabled={datasets.length === 0}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: datasets.length === 0 ? '#f8fafc' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                            color: datasets.length === 0 ? '#94a3b8' : '#fff',
                            border: datasets.length === 0 ? '1px solid #e2e8f0' : 'none',
                            padding: '10px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem',
                            cursor: datasets.length === 0 ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease',
                            boxShadow: datasets.length === 0 ? 'none' : '0 6px 16px rgba(239, 68, 68, 0.3)'
                        }}
                        onMouseOver={(e) => { if (datasets.length > 0) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(239, 68, 68, 0.4)' } }}
                        onMouseOut={(e) => { if (datasets.length > 0) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.3)' } }}
                    >
                        <Trash2 size={16} />
                        Delete All History
                    </button>
                </div>
            </div>

            {/* Modern Table Layout */}
            <div style={{ background: '#fff', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div className="table-responsive" style={{ margin: 0, padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Dataset Name</th>
                                <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Uploaded By</th>
                                <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Size</th>
                                <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Upload Date</th>
                                <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {datasets.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '5rem 2rem', color: '#64748b', background: '#fafafa' }}>
                                    <div style={{ display: 'inline-flex', padding: '1rem', background: '#f1f5f9', borderRadius: '50%', marginBottom: 16 }}><Database size={32} color="#94a3b8" /></div>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#334155' }}>No Datasets Available</h4>
                                    <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem' }}>Users have not uploaded any datasets to the storage yet.</p>
                                </td></tr>
                            ) : datasets.map((d, idx) => {
                                // Extract readable name from unix timeline (e.g. 1774203082308_classification_data.csv)
                                const nameChunks = d.name.split('_');
                                const isSupabaseTimestamp = !isNaN(nameChunks[0]) && nameChunks.length > 1;
                                const displayName = isSupabaseTimestamp ? nameChunks.slice(1).join('_') : d.name;
                                const fileId = isSupabaseTimestamp ? nameChunks[0] : 'RAW';

                                return (
                                    <tr key={d.name || d.id} style={{ borderBottom: idx === datasets.length - 1 ? 'none' : '1px solid #f1f5f9', transition: 'background 0.2s' }}
                                        onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <FileText size={20} color="#4f46e5" />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '300px' }}>
                                                    <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.9rem', marginBottom: '2px', lineHeight: '1.3', wordBreak: 'break-all' }}>{displayName}</strong>
                                                    <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontFamily: 'monospace' }}>ID: {fileId}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                                                    {d.owner ? d.owner.charAt(0).toUpperCase() : 'S'}
                                                </div>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#334155' }}>{d.owner || 'System User'}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <span style={{ display: 'inline-flex', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600 }}>{d.size}</span>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', color: '#475569', fontSize: '0.85rem', fontWeight: 500 }}>
                                            {d.date}
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px', color: '#16a34a', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Download Dataset"
                                                    onMouseOver={e => e.currentTarget.style.background = '#dcfce7'} onMouseOut={e => e.currentTarget.style.background = '#f0fdf4'}
                                                    onClick={() => handleDownload('csv-uploads', d.name)}>
                                                    <Download size={16} />
                                                </button>
                                                <button style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px', color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Delete Dataset"
                                                    onMouseOver={e => e.currentTarget.style.background = '#fee2e2'} onMouseOut={e => e.currentTarget.style.background = '#fef2f2'}
                                                    onClick={() => handleDeleteDataset(d.name)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderModels = () => (
        <div className="admin-panel fadeIn">
            <div className="panel-header">
                <div>
                    <h2>Model Monitoring</h2>
                    <p>Track trained ML models across the platform.</p>
                </div>
            </div>
            <div className="table-responsive">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Model File</th>
                            <th>Algorithm</th>
                            <th>File Size</th>
                            <th>Saved Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {models.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No models trained yet.</td></tr>
                        ) : models.map(m => (
                            <tr key={m.id}>
                                <td><strong>{m.name}</strong></td>
                                <td><span className="algo-badge">{m.type}</span></td>
                                <td><span className="size-badge">{m.size}</span></td>
                                <td>{m.savedAt}</td>
                                <td><span className="status-badge active">{m.status}</span></td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="icon-btn primary"
                                            title="Download Model"
                                            onClick={() => handleDownload('models', m.name)}
                                        >
                                            <Download size={16} />
                                        </button>
                                        <button className="icon-btn danger" title="Delete Model"><XCircle size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderPredictions = () => (
        <div className="admin-panel fadeIn">
            <div className="panel-header">
                <div>
                    <h2>Prediction Activity Logs</h2>
                    <p>Monitor live model inference requests and APIs.</p>
                </div>
            </div>
            <div className="table-responsive">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Request ID</th>
                            <th>User Email</th>
                            <th>Model Target</th>
                            <th>Time</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {predictions.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No prediction logs available.</td></tr>
                        ) : predictions.map(p => (
                            <tr key={p.id}>
                                <td><span className="monospace">{p.id}</span></td>
                                <td>{p.user}</td>
                                <td><strong>{p.model}</strong></td>
                                <td><Clock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />{p.date}</td>
                                <td><span className={`status-badge ${p.status.toLowerCase() === 'success' ? 'active' : 'blocked'}`}>{p.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderChatbot = () => (
        <div className="admin-panel fadeIn">
            <div className="panel-header">
                <div>
                    <h2>AI Chatbot Logs</h2>
                    <p>Review user interactions with the AI assistant.</p>
                </div>
            </div>
            <div className="table-responsive">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Chat Session ID</th>
                            <th>User Email</th>
                            <th>Total Messages</th>
                            <th>Inferred Intent</th>
                            <th>Last Message</th>
                        </tr>
                    </thead>
                    <tbody>
                        {chats.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No AI Chat logs available.</td></tr>
                        ) : chats.map(c => (
                            <tr key={c.id}>
                                <td><span className="monospace">{c.id}</span></td>
                                <td>{c.user}</td>
                                <td><span className="size-badge">{c.msgs} Msgs</span></td>
                                <td>{c.intent}</td>
                                <td>{c.time}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderSecurity = () => (
        <div className="admin-panel fadeIn">
            <div className="panel-header">
                <div>
                    <h2>Security & Audit Logs</h2>
                    <p>Review system security alerts and login attempts.</p>
                </div>
            </div>
            <div className="table-responsive">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Event ID</th>
                            <th>IP Address</th>
                            <th>Event Type</th>
                            <th>Target User</th>
                            <th>Severity</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {securityLogs.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No recent security alerts.</td></tr>
                        ) : securityLogs.map(s => (
                            <tr key={s.id}>
                                <td><span className="monospace">{s.id}</span></td>
                                <td><span className="monospace" style={{ color: '#0f172a' }}>{s.ip}</span></td>
                                <td><strong>{s.event}</strong></td>
                                <td>{s.user}</td>
                                <td><span className={`status-badge ${s.severity === 'High' ? 'blocked' : s.severity === 'Medium' ? 'inactive' : 'active'}`}>{s.severity}</span></td>
                                <td>{s.time}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const fetchBlogPosts = async () => {
        setBlogLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/blog/all`);
            if (res.ok) {
                const json = await res.json();
                setBlogPosts(json.data || []);
            }
        } catch (e) {
            console.warn('Blog fetch error:', e);
        }
        setBlogLoading(false);
    };

    const handleBlogSave = async () => {
        if (!blogForm.title || !blogForm.content) return alert('Title and content are required.');
        setBlogSaving(true);
        try {
            const payload = {
                ...blogForm,
                tags: blogForm.tags ? blogForm.tags.split(',').map(t => t.trim()).filter(Boolean) : []
            };
            const url = editingPost
                ? `${API_BASE}/api/blog/${editingPost.id}`
                : `${API_BASE}/api/blog`;
            const method = editingPost ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setShowBlogForm(false);
                setEditingPost(null);
                setBlogForm({ title: '', excerpt: '', content: '', tags: '', author: 'AutoML Team', published: false });
                fetchBlogPosts();
            }
        } catch (e) {
            alert('Error saving post: ' + e.message);
        }
        setBlogSaving(false);
    };

    const handleBlogEdit = (post) => {
        setEditingPost(post);
        setBlogForm({
            title: post.title || '',
            excerpt: post.excerpt || '',
            content: post.content || '',
            tags: (post.tags || []).join(', '),
            author: post.author || 'AutoML Team',
            published: post.published || false,
            cover_image: post.cover_image || ''
        });
        setShowBlogForm(true);
    };

    const handleBlogDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;
        try {
            await fetch(`${API_BASE}/api/blog/${id}`, { method: 'DELETE' });
            fetchBlogPosts();
        } catch (e) {
            alert('Delete error: ' + e.message);
        }
    };

    const handleTogglePublish = async (post) => {
        try {
            await fetch(`${API_BASE}/api/blog/${post.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...post, published: !post.published })
            });
            fetchBlogPosts();
        } catch (e) {
            alert('Toggle error: ' + e.message);
        }
    };

    const renderBlog = () => {
        // Auto-fetch when this tab renders
        if (blogPosts.length === 0 && !blogLoading) fetchBlogPosts();
        return (
            <div className="admin-panel fadeIn" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
                {/* Premium Header */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.8)',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
                    borderRadius: '20px',
                    padding: '1.5rem 2rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BookOpen size={22} color="#4f46e5" /> Blog Manager
                        </h2>
                        <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '0.85rem', fontWeight: 500 }}>Create, publish, and manage blog articles gracefully.</p>
                    </div>
                    <div>
                        <button style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: showBlogForm ? '#f8fafc' : 'linear-gradient(135deg, #4f46e5, #4338ca)',
                            color: showBlogForm ? '#475569' : '#fff',
                            border: showBlogForm ? '1px solid #e2e8f0' : 'none',
                            padding: '10px 20px', borderRadius: '12px', fontWeight: 600, fontSize: '0.85rem',
                            cursor: 'pointer', transition: 'all 0.2s ease',
                            boxShadow: showBlogForm ? 'none' : '0 6px 16px rgba(79, 70, 229, 0.3)'
                        }}
                            onMouseOver={(e) => { if (!showBlogForm) e.currentTarget.style.transform = 'translateY(-2px)' }}
                            onMouseOut={(e) => { if (!showBlogForm) e.currentTarget.style.transform = 'translateY(0)' }}
                            onClick={() => { setShowBlogForm(!showBlogForm); setEditingPost(null); setBlogForm({ title: '', excerpt: '', content: '', tags: '', author: 'AutoML Team', published: false, cover_image: '' }); }}>
                            {showBlogForm ? <XCircle size={16} /> : <Plus size={16} />}
                            {showBlogForm ? 'Close Editor' : 'Create New Post'}
                        </button>
                    </div>
                </div>

                {/* Highly Stylized Blog Post Form */}
                {showBlogForm && (
                    <div className="fadeIn" style={{
                        background: '#ffffff',
                        border: '1px solid #f1f5f9',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.06)',
                        borderRadius: '20px',
                        padding: '2rem',
                        marginBottom: '2rem'
                    }}>
                        <h3 style={{ marginBottom: '1.5rem', color: '#0f172a', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                            {editingPost ? <PenLine size={18} color="#f59e0b" /> : <PenLine size={18} color="#10b981" />}
                            {editingPost ? 'Edit Existing Post' : 'Draft New Publication'}
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Post Title <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input type="text" value={blogForm.title} onChange={e => setBlogForm(p => ({ ...p, title: e.target.value }))}
                                        placeholder="E.g., The Future of AutoML..."
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem', outline: 'none', transition: 'box-shadow 0.2s' }}
                                        onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.1)'} onBlur={e => e.target.style.boxShadow = 'none'} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Author Name</label>
                                        <input type="text" value={blogForm.author} onChange={e => setBlogForm(p => ({ ...p, author: e.target.value }))}
                                            style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Tags</label>
                                        <input type="text" value={blogForm.tags} onChange={e => setBlogForm(p => ({ ...p, tags: e.target.value }))}
                                            placeholder="AI, Dataset, Guide"
                                            style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '0.9rem' }} />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Hero Cover Image</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                                        {blogForm.cover_image && (
                                            <div style={{ position: 'relative' }}>
                                                <img src={blogForm.cover_image} alt="Preview" style={{ height: '60px', width: '90px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                                                <button onClick={() => setBlogForm(prev => ({ ...prev, cover_image: '' }))}
                                                    style={{ position: 'absolute', top: -8, right: -8, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', fontSize: '10px', cursor: 'pointer' }}>✕</button>
                                            </div>
                                        )}
                                        <input type="file" ref={imageInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageUpload} />
                                        <button style={{ padding: '8px 16px', borderRadius: '8px', background: '#fff', border: '1px solid #e2e8f0', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', color: '#475569', transition: 'all 0.2s' }}
                                            onClick={() => imageInputRef.current.click()} disabled={uploadingImage}
                                            onMouseOver={e => e.target.style.borderColor = '#94a3b8'} onMouseOut={e => e.target.style.borderColor = '#e2e8f0'}>
                                            {uploadingImage ? 'Uploading...' : (blogForm.cover_image ? 'Replace Image' : 'Select Hero Image')}
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px' }}>
                                    <label className="switch" style={{ margin: 0 }}>
                                        <input type="checkbox" checked={blogForm.published} onChange={e => setBlogForm(p => ({ ...p, published: e.target.checked }))} />
                                        <span className="slider round"></span>
                                    </label>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#166534' }}>{blogForm.published ? 'Publish Immediately' : 'Save as Draft'}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Excerpt / Summary</label>
                                    <textarea value={blogForm.excerpt} onChange={e => setBlogForm(p => ({ ...p, excerpt: e.target.value }))}
                                        placeholder="Hook your readers with a compelling short description..."
                                        rows={2} style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.9rem', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc', outline: 'none' }} />
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Blog Content (HTML Supported) <span style={{ color: '#ef4444' }}>*</span></label>
                                    <textarea value={blogForm.content} onChange={e => setBlogForm(p => ({ ...p, content: e.target.value }))}
                                        placeholder="<p>Craft your masterpiece here...</p>"
                                        style={{ width: '100%', flex: 1, minHeight: '200px', resize: 'vertical', fontFamily: 'JetBrains Mono, Courier New, monospace', fontSize: '0.85rem', padding: '14px', border: '1px solid #cbd5e1', borderRadius: '10px', background: '#1e293b', color: '#f8fafc', outline: 'none' }} />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                            <button onClick={() => { setShowBlogForm(false); setEditingPost(null); }}
                                style={{ padding: '10px 24px', border: '1px solid #cbd5e1', borderRadius: '10px', background: '#fff', color: '#475569', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.2s' }}
                                onMouseOver={e => e.target.style.background = '#f8fafc'} onMouseOut={e => e.target.style.background = '#fff'}>
                                Cancel
                            </button>
                            <button onClick={handleBlogSave} disabled={blogSaving}
                                style={{ padding: '10px 28px', border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                                onMouseOver={e => e.target.style.transform = 'translateY(-1px)'} onMouseOut={e => e.target.style.transform = 'translateY(0)'}>
                                {blogSaving ? 'Processing...' : (editingPost ? 'Update Entry' : 'Publish Blog Post')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Modern Blog Posts Table Layout */}
                <div style={{ background: '#fff', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <div className="table-responsive" style={{ margin: 0, padding: 0 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Headline</th>
                                    <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Author</th>
                                    <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Tags</th>
                                    <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Status</th>
                                    <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Published On</th>
                                    <th style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {blogLoading ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8' }}><RefreshCw className="spin-slow" size={24} style={{ marginBottom: 12, opacity: 0.5 }} /><br />Fetching articles...</td></tr>
                                ) : blogPosts.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '5rem 2rem', color: '#64748b', background: '#fafafa' }}>
                                        <div style={{ display: 'inline-flex', padding: '1rem', background: '#f1f5f9', borderRadius: '50%', marginBottom: 16 }}><BookOpen size={32} color="#94a3b8" /></div>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#334155' }}>Your Blog is Empty</h4>
                                        <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem' }}>Create insightful articles to engage your community.</p>
                                    </td></tr>
                                ) : blogPosts.map((post, idx) => (
                                    <tr key={post.id} style={{ borderBottom: idx === blogPosts.length - 1 ? 'none' : '1px solid #f1f5f9', transition: 'background 0.2s' }}
                                        onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                {post.cover_image ?
                                                    <img src={post.cover_image} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }} /> :
                                                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={18} color="#94a3b8" /></div>
                                                }
                                                <div style={{ maxWidth: '300px' }}>
                                                    <strong style={{ display: 'block', color: '#0f172a', fontSize: '0.95rem', marginBottom: '4px', lineHeight: '1.3' }}>{post.title}</strong>
                                                    <span style={{ color: '#64748b', fontSize: '0.8rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.excerpt || 'No description provided...'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                                                    {post.author ? post.author.charAt(0).toUpperCase() : 'A'}
                                                </div>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#334155' }}>{post.author}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {(post.tags || []).map(tag => (
                                                    <span key={tag} style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600 }}>{tag}</span>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            {post.published ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }}></div> Published
                                                </span>
                                            ) : (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#94a3b8' }}></div> Draft
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', color: '#475569', fontSize: '0.85rem', fontWeight: 500 }}>
                                            {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px', color: post.published ? '#64748b' : '#3b82f6', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title={post.published ? 'Hide from public' : 'Publish to public'}
                                                    onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'} onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}
                                                    onClick={() => handleTogglePublish(post)}>
                                                    {post.published ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                                <button style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '6px', color: '#16a34a', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Edit Post"
                                                    onMouseOver={e => e.currentTarget.style.background = '#dcfce7'} onMouseOut={e => e.currentTarget.style.background = '#f0fdf4'}
                                                    onClick={() => handleBlogEdit(post)}>
                                                    <PenLine size={16} />
                                                </button>
                                                <button style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '6px', color: '#ef4444', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    title="Delete Post"
                                                    onMouseOver={e => e.currentTarget.style.background = '#fee2e2'} onMouseOut={e => e.currentTarget.style.background = '#fef2f2'}
                                                    onClick={() => handleBlogDelete(post.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };



    return (
        <div className="admin-layout-wrapper">
            <div className="admin-layout">
                <aside className="admin-sidebar">
                    <div className="admin-sidebar-header">
                        <Monitor className="admin-brand-icon" />
                        <div>
                            <h3>Admin Center</h3>
                            <span>AutoML Platform</span>
                        </div>
                    </div>
                    <nav className="admin-nav">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                className={`admin-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                <main className="admin-content-area">
                    <header className="admin-topbar">
                        <h2>{tabs.find(t => t.id === activeTab)?.label}</h2>
                        <div className="admin-topbar-right">
                            <span className="sys-status online"><span className="pulse"></span> System Online</span>
                            <div className="admin-avatar">A</div>
                        </div>
                    </header>

                    <div className="admin-scrollable-content">
                        {activeTab === 'overview' && renderOverview()}
                        {activeTab === 'users' && renderUsers()}
                        {activeTab === 'datasets' && renderDatasets()}
                        {activeTab === 'blog' && renderBlog()}

                        {/* Fallback for completely inactive/empty tabs */}
                        {['feedback'].includes(activeTab) && (() => {
                            const activeObj = tabs.find(t => t.id === activeTab);
                            const Icon = activeObj?.icon || MessageSquareQuote;
                            return (
                                <div className="admin-panel fadeIn empty-state">
                                    <Icon size={48} className="empty-icon" />
                                    <h3>{activeObj?.label} Module Active</h3>
                                    <p>All logs and activities are currently clear. System is operating normally.</p>
                                </div>
                            );
                        })()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminPage;
