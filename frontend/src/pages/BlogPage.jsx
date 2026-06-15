import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen, Search, ArrowRight, Calendar, User, Tag, Rss,
    ChevronLeft, Clock, Sparkles
} from 'lucide-react';
import './BlogPage.css';

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
const API = `${API_BASE}/api/blog`;

const TAG_COLORS = {
    'Machine Learning': 'tag-ml',
    'Artificial Intelligence': 'tag-ai',
    'AI': 'tag-ai',
    'ML': 'tag-ml',
    'Data Science': 'tag-data',
    'Data': 'tag-data',
    'Guide': 'tag-guide',
    'Tutorial': 'tag-guide',
    'News': 'tag-news',
};

const getTagClass = (tag) => {
    for (const [key, cls] of Object.entries(TAG_COLORS)) {
        if (tag?.toLowerCase().includes(key.toLowerCase())) return cls;
    }
    return 'tag-default';
};

const COVER_EMOJIS = ['🤖', '📊', '🧠', '🔬', '⚡', '🎯', '💡', '🚀'];
const getEmoji = (id) => COVER_EMOJIS[id % COVER_EMOJIS.length];

const formatDate = (iso) => {
    try {
        return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return iso;
    }
};

/* ===========================
   BLOG LIST PAGE
   =========================== */
export const BlogPage = () => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTag, setActiveTag] = useState('All');

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API}`);
                if (res.ok) {
                    const json = await res.json();
                    if (json.status === 'success') {
                        setPosts(json.data || []);
                    } else {
                        setPosts([]);
                    }
                } else {
                    setPosts([]);
                }
            } catch {
                setPosts([]);
            }
            setLoading(false);
        };
        fetchPosts();
    }, []);

    const tagSet = new Set();
    posts.forEach(p => {
        if (p.tags && Array.isArray(p.tags)) {
            p.tags.forEach(t => tagSet.add(t));
        } else if (p.tags && typeof p.tags === 'string') {
            p.tags.split(',').forEach(t => tagSet.add(t.trim()));
        }
    });
    const allTags = ['All', ...Array.from(tagSet)];

    const isFiltering = activeTag !== 'All' || searchQuery.trim().length > 0;

    const filtered = posts.filter(p => {
        let postTags = [];
        if (p.tags && Array.isArray(p.tags)) postTags = p.tags;
        else if (p.tags && typeof p.tags === 'string') postTags = p.tags.split(',').map(t => t.trim());

        const matchesTag = activeTag === 'All' || postTags.some(t => t.toLowerCase() === activeTag.toLowerCase());
        const matchesSearch = !searchQuery ||
            p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTag && matchesSearch;
    });

    const featured = !isFiltering && filtered.length > 0 ? filtered[0] : null;
    const rest = featured ? filtered.slice(1) : filtered;

    return (
        <div className="blog-page">
            {/* Navbar */}
            <nav className="blog-navbar">
                <div className="blog-nav-logo" onClick={() => navigate('/dashboard')}>
                    <BookOpen size={22} />
                    AutoML Blog
                </div>
                <div className="blog-nav-links">
                    <span className="blog-nav-link" onClick={() => navigate('/dashboard')}>← Back to App</span>
                </div>
                <button className="blog-nav-btn" onClick={() => navigate('/')}>
                    Get Started Free
                </button>
            </nav>

            {/* Hero */}
            <section className="blog-hero">
                <div className="blog-hero-content">
                    <div className="blog-hero-badge">
                        <Rss size={12} /> Latest from the AutoML Blog
                    </div>
                    <h1>
                        Insights on <span>AI & Machine Learning</span>
                    </h1>
                    <p>Tutorials, research, and updates from the team building the future of automated ML.</p>
                </div>
            </section>

            {/* Content */}
            <div className="blog-container">
                {/* Filter Bar */}
                <div className="blog-filter-bar">
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            className={`blog-filter-btn ${activeTag === tag ? 'active' : ''}`}
                            onClick={() => setActiveTag(tag)}
                        >
                            {tag}
                        </button>
                    ))}
                    <div className="blog-search-box">
                        <Search size={15} />
                        <input
                            type="text"
                            placeholder="Search articles..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="blog-loading">
                        <div className="blog-spinner"></div>
                        Loading articles…
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="blog-empty">
                        <div className="blog-empty-icon">📭</div>
                        <h3>No articles found</h3>
                        <p>Try a different search term or filter.</p>
                    </div>
                ) : (
                    <>
                        {/* Featured Post */}
                        {featured && (
                            <div className="blog-featured">
                                <div className="blog-section-title">
                                    <Sparkles size={18} style={{ color: '#f59e0b' }} />
                                    Featured Article
                                </div>
                                <div className="blog-featured-card" onClick={() => navigate(`/blog/${featured.id}`)}>
                                    <div className="blog-featured-img" style={{
                                        background: `linear-gradient(135deg, ${['#1c39bb', '#7c3aed', '#0891b2', '#059669'][featured.id % 4] || '#1c39bb'}, ${['#4f46e5', '#9333ea', '#0e7490', '#047857'][featured.id % 4] || '#4f46e5'})`
                                    }}>
                                        {featured.cover_image
                                            ? <img src={featured.cover_image} alt={featured.title} />
                                            : <span className="blog-featured-img-placeholder">{getEmoji(typeof featured.id === 'number' ? featured.id : 0)}</span>
                                        }
                                    </div>
                                    <div className="blog-featured-body">
                                        <div className="blog-featured-label">
                                            <Tag size={10} />
                                            {(featured.tags || ['Article'])[0]}
                                        </div>
                                        <h2>{featured.title}</h2>
                                        <p>{featured.excerpt?.replace(/<[^>]+>/g, '')}</p>
                                        <div className="blog-featured-meta">
                                            <span><User size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{featured.author}</span>
                                            <span><Calendar size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />{formatDate(featured.created_at)}</span>
                                        </div>
                                        <br />
                                        <button className="read-more-btn">
                                            Read Article <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Rest of Posts */}
                        {rest.length > 0 && (
                            <>
                                <div className="blog-section-title">
                                    <BookOpen size={18} style={{ color: '#1c39bb' }} />
                                    All Articles
                                </div>
                                <div className="blog-grid">
                                    {rest.map((post, i) => (
                                        <div
                                            key={post.id}
                                            className="blog-card"
                                            onClick={() => navigate(`/blog/${post.id}`)}
                                        >
                                            <div className="blog-card-img" style={{
                                                background: `linear-gradient(135deg, ${['#1c39bb', '#7c3aed', '#0891b2', '#059669', '#dc2626'][i % 5]}, ${['#4f46e5', '#9333ea', '#0e7490', '#047857', '#b91c1c'][i % 5]})`
                                            }}>
                                                {post.cover_image
                                                    ? <img src={post.cover_image} alt={post.title} />
                                                    : getEmoji(i + 1)
                                                }
                                            </div>
                                            <div className="blog-card-body">
                                                <span className={`blog-card-tag ${getTagClass((post.tags || [])[0])}`}>
                                                    {(post.tags || ['Article'])[0]}
                                                </span>
                                                <h3>{post.title}</h3>
                                                <p>{post.excerpt?.replace(/<[^>]+>/g, '')}</p>
                                                <div className="blog-card-footer">
                                                    <div className="blog-card-author">
                                                        <div className="blog-author-avatar">
                                                            {(post.author || 'A')[0].toUpperCase()}
                                                        </div>
                                                        {post.author}
                                                    </div>
                                                    <span className="blog-card-date">
                                                        <Clock size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                                                        {formatDate(post.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

/* ===========================
   BLOG POST DETAIL PAGE
   =========================== */
export const BlogPostPage = ({ postId }) => {
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API}/${postId}`);
                if (res.ok) {
                    const json = await res.json();
                    // Block access to drafts on the public individual post page
                    if (json.data && !json.data.published) {
                        setPost(null);
                    } else {
                        setPost(json.data);
                    }
                } else {
                    setPost(null);
                }
            } catch {
                setPost(null);
            }
            setLoading(false);
        };
        fetchPost();
    }, [postId]);

    if (loading) {
        return (
            <div className="blog-page">
                <div className="blog-loading"><div className="blog-spinner"></div> Loading article…</div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="blog-page">
                <div className="blog-empty" style={{ paddingTop: '8rem' }}>
                    <div className="blog-empty-icon">😕</div>
                    <h3>Article not found</h3>
                    <button className="read-more-btn" style={{ margin: '1.5rem auto' }} onClick={() => navigate('/blog')}>
                        <ChevronLeft size={16} /> Back to Blog
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="blog-page">
            <nav className="blog-navbar">
                <div className="blog-nav-logo" onClick={() => navigate('/blog')}>
                    <BookOpen size={22} />
                    AutoML Blog
                </div>
                <button className="blog-nav-btn" onClick={() => navigate('/')}>Get Started Free</button>
            </nav>

            <div className="blog-post-page">
                <button className="blog-post-back" onClick={() => navigate('/blog')}>
                    <ChevronLeft size={16} /> Back to Blog
                </button>

                <div className="blog-post-header">
                    <h1>{post.title}</h1>
                    <div className="blog-post-meta-bar">
                        <span><User size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />{post.author || 'AutoML Team'}</span>
                        <span><Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />{formatDate(post.created_at)}</span>
                        {(post.tags || []).map(tag => (
                            <span key={tag} className={`blog-card-tag ${getTagClass(tag)}`} style={{ padding: '3px 10px', borderRadius: '100px', fontSize: '0.72rem' }}>
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="blog-post-cover">
                    {post.cover_image
                        ? <img src={post.cover_image} alt={post.title} />
                        : '🤖'
                    }
                </div>

                <div
                    className="blog-post-content"
                    dangerouslySetInnerHTML={{
                        __html: post.content || `<p>${post.excerpt || 'Full article content coming soon...'}</p>`
                    }}
                />
            </div>
        </div>
    );
};

export default BlogPage;
