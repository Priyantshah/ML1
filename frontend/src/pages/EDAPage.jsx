import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutoML } from '../context/AutoMLContext';
import client from '../api/client';
import {
    ArrowRight, Target, Sparkles, Database, Activity,
    TrendingUp, Lightbulb, AlertTriangle, CheckCircle, Info
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip as RTooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, Legend
} from 'recharts';
import './EDAPage.css';

/* ─── tiny helpers ─────────────────────────────────────────────────── */
const severityColor = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };
const severityBg = { High: 'rgba(239,68,68,.07)', Medium: 'rgba(245,158,11,.07)', Low: 'rgba(16,185,129,.07)' };

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
    <div className="eda-section-header">
        <div className="eda-section-icon"><Icon size={22} /></div>
        <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
        </div>
    </div>
);

const DataTable = ({ columns, rows }) => (
    <div className="eda-table-wrap">
        <table className="eda-table">
            <thead><tr>{columns.map(c => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>
                {rows.map((row, i) => (
                    <tr key={i}>{columns.map(c => <td key={c}>{row[c] ?? '—'}</td>)}</tr>
                ))}
            </tbody>
        </table>
    </div>
);

/* ─── correlation colour palette ────────────────────────────────────── */
const corrColor = v => {
    if (v === null || v === undefined) return 'transparent';
    const a = Math.abs(v);
    return v > 0 ? `rgba(37,99,235,${0.08 + a * 0.82})` : `rgba(239,68,68,${0.08 + a * 0.82})`;
};

/* ─── Graphical Boxplot ───────────────────────────────────────────── */
const GraphicalBoxplot = ({ min, q1, median, q3, max, lower_whisker, upper_whisker, globalMin, globalMax }) => {
    const range = (globalMax - globalMin) || 1;
    const toPct = val => `${((Math.max(globalMin, Math.min(globalMax, val)) - globalMin) / range) * 100}%`;
    const safeLW = Math.max(lower_whisker, min, globalMin);
    const safeUW = Math.min(upper_whisker, max, globalMax);

    return (
        <div className="eda-boxplot-container" title={`Min: ${min.toFixed(2)}, Q1: ${q1.toFixed(2)}, Median: ${median.toFixed(2)}, Q3: ${q3.toFixed(2)}, Max: ${max.toFixed(2)}`}>
            {/* Background track */}
            <div className="eda-boxplot-track" />

            {/* Whiskers */}
            <div className="eda-boxplot-whisker" style={{ left: toPct(safeLW), width: `${((safeUW - safeLW) / range) * 100}%` }} />

            {/* IQR Box */}
            <div className="eda-boxplot-iqr" style={{ left: toPct(q1), width: `${((q3 - q1) / range) * 100}%` }} />

            {/* Median Line */}
            <div className="eda-boxplot-median" style={{ left: toPct(median) }} />

            {/* Outlier Dots */}
            {min < safeLW && <div className="eda-boxplot-outlier" style={{ left: toPct(min) }} />}
            {max > safeUW && <div className="eda-boxplot-outlier" style={{ left: toPct(max) }} />}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════════════ */
const EDAPage = () => {
    const { fileUrl, setEdaResults, edaResults, metadata, setTargetColumn, targetColumn } = useAutoML();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selCol, setSelCol] = useState(targetColumn || '');
    const [activeDistCol, setActiveDistCol] = useState(null);
    const navigate = useNavigate();

    useEffect(() => { if (!fileUrl) navigate('/upload'); }, [fileUrl, navigate]);

    const handleAnalyze = async () => {
        if (!selCol) {
            alert("Please select a target column first.");
            return;
        }
        setTargetColumn(selCol); // Lock it in
        setLoading(true); setError(null);
        try {
            const res = await client.post('/eda', { fileUrl, targetColumn: selCol });
            if (res.data.status === 'success') {
                const payload = res.data.data ?? res.data;
                if (payload.status === 'error') throw new Error(payload.error);
                setEdaResults(payload);
                // default first numeric column for distribution view
                const first = payload.feature_distributions?.distributions?.[0]?.column;
                if (first) setActiveDistCol(first);
            } else {
                setError('Analysis failed — server returned an error.');
            }
        } catch (e) {
            setError('Unable to complete analysis. Check the console.');
            console.error(e);
        } finally { setLoading(false); }
    };

    const handleProceed = () => {
        if (!selCol) { alert('Please select a target column first.'); return; }
        setTargetColumn(selCol);
        navigate('/train');
    };

    if (error) return (
        <div className="page-container flex-center">
            <AlertTriangle size={56} className="text-error mb-4" />
            <h2>Analysis Failed</h2>
            <p className="text-secondary mb-6">{error}</p>
            <button className="btn btn-primary" onClick={() => setError(null)}>Try Again</button>
        </div>
    );

    /* ── derived data -------------------------------------------------- */
    const ov = edaResults?.data_overview || {};
    const fd = edaResults?.feature_distributions || {};
    const cr = edaResults?.correlations || {};
    const ir = edaResults?.insights_recommendations || {};

    const corrKeys = Object.keys(cr.matrix || {});
    const dists = fd.distributions || [];
    const activeDist = dists.find(d => d.column === activeDistCol) || dists[0];

    return (
        <div className="page-container animate-fade-in">

            {/* ── Page Header ───────────────────────────────────────── */}
            <header className="eda-page-header">
                <h1>Exploratory Data Analysis</h1>
                <p>A structured 4-section deep-dive into your dataset — from raw structure to actionable intelligence.</p>
            </header>

            {/* ── Target Selector ───────────────────────────────────── */}
            <section className="target-selection-hero">
                <div className="target-hero-content">
                    <h3><Target size={24} /> Select Target Variable</h3>
                    <p>Define the outcome column to anchor correlation and model recommendations.</p>
                </div>
                <div className="target-hero-action">
                    <select
                        value={selCol}
                        onChange={e => {
                            const val = e.target.value;
                            setSelCol(val);
                            if (val !== targetColumn) {
                                setEdaResults(null);
                                setTargetColumn(null);
                            }
                        }}
                        className="vibrant-select"
                    >
                        <option value="">-- Choose Target Column --</option>
                        {metadata?.columns?.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button className="btn-vibrant" onClick={handleAnalyze} disabled={!selCol || loading}>
                        {loading ? <span className="eda-spinner" /> : <><Sparkles size={18} /> Run EDA Analysis</>}
                    </button>
                </div>
            </section>

            {targetColumn && edaResults && (
                <div className="eda-sections">

                    {/* ══════════════════════════════════════════════════
                        SECTION 1 — DATA OVERVIEW
                    ══════════════════════════════════════════════════ */}
                    <section className="eda-section animate-fade-in-up">
                        <SectionHeader icon={Database} title="1 — Data Overview"
                            subtitle="Dataset shape, column types, summary statistics, and missing value landscape." />

                        {/* Shape cards */}
                        <div className="shape-cards">
                            <div className="shape-card">
                                <span>{ov.shape?.rows?.toLocaleString()}</span>
                                <label>Rows</label>
                            </div>
                            <div className="shape-card">
                                <span>{ov.shape?.columns}</span>
                                <label>Columns</label>
                            </div>
                            <div className="shape-card">
                                <span>{ov.dtype_table?.filter(d => d.category === 'Numerical').length}</span>
                                <label>Numerical</label>
                            </div>
                            <div className="shape-card">
                                <span>{ov.dtype_table?.filter(d => d.category === 'Categorical').length}</span>
                                <label>Categorical</label>
                            </div>
                            <div className="shape-card">
                                <span>{ov.missing_table?.length || 0}</span>
                                <label>Cols w/ Nulls</label>
                            </div>
                        </div>

                        <div className="eda-two-col">
                            {/* Data Types Table */}
                            <div className="eda-card">
                                <h4 className="eda-card-title">Column Types</h4>
                                <DataTable
                                    columns={['column', 'dtype', 'category']}
                                    rows={ov.dtype_table || []}
                                />
                            </div>

                            {/* Summary Stats Table */}
                            <div className="eda-card">
                                <h4 className="eda-card-title">Summary Statistics</h4>
                                <DataTable
                                    columns={['column', 'mean', 'median', 'std', 'min', 'max']}
                                    rows={ov.stats_table || []}
                                />
                            </div>
                        </div>

                        {/* Missing Values */}
                        {(ov.missing_table?.length > 0) && (
                            <div className="eda-card">
                                <h4 className="eda-card-title">Missing Values</h4>
                                <div className="eda-two-col" style={{ alignItems: 'flex-start' }}>
                                    {/* Table */}
                                    <DataTable
                                        columns={['column', 'count', 'percentage', 'severity']}
                                        rows={ov.missing_table}
                                    />
                                    {/* Bar chart */}
                                    <div style={{ width: '100%', minHeight: 260 }}>
                                        {ov.missing_table && ov.missing_table.length > 0 && (
                                            <ResponsiveContainer width="100%" height={260}>
                                                <BarChart data={ov.missing_table} layout="vertical" margin={{ left: 10 }}>
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                                                    <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                                                    <YAxis type="category" dataKey="column" tick={{ fontSize: 11, fill: 'var(--text-main)' }} width={110} />
                                                    <RTooltip formatter={v => [`${v}%`, 'Missing']}
                                                        contentStyle={{ background: 'var(--bg-card)', borderRadius: 8 }} />
                                                    <Bar dataKey="percentage" barSize={18} radius={[0, 4, 4, 0]}>
                                                        {ov.missing_table.map((e, i) => (
                                                            <Cell key={i} fill={severityColor[e.severity]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {(!ov.missing_table?.length) && (
                            <div className="eda-card eda-ok-banner">
                                <CheckCircle size={20} /> No missing values detected — dataset is complete.
                            </div>
                        )}
                    </section>

                    {/* ══════════════════════════════════════════════════
                        SECTION 2 — FEATURE DISTRIBUTION & OUTLIERS
                    ══════════════════════════════════════════════════ */}
                    <section className="eda-section animate-fade-in-up">
                        <SectionHeader icon={Activity} title="2 — Feature Distribution & Outliers"
                            subtitle="Histograms, boxplot summaries, skewness scores, and IQR-based outlier reporting." />

                        {dists.length > 0 ? (
                            <>
                                {/* Column Selector Tabs */}
                                <div className="dist-tabs">
                                    {dists.map(d => (
                                        <button key={d.column}
                                            className={`dist-tab ${activeDistCol === d.column ? 'active' : ''}`}
                                            onClick={() => setActiveDistCol(d.column)}>
                                            {d.column}
                                        </button>
                                    ))}
                                </div>

                                {/* Charts for active column */}
                                {activeDist && (
                                    <div className="dist-charts-grid">
                                        {/* Histogram */}
                                        <div className="eda-card">
                                            <h4 className="eda-card-title">
                                                Histogram — {activeDist.column}
                                                <span className="skew-badge">Skew: {activeDist.skewness}</span>
                                            </h4>
                                            <div style={{ width: '100%', minHeight: 240 }}>
                                                {activeDist.histogram && activeDist.histogram.length > 0 && (
                                                    <ResponsiveContainer width="100%" height={240}>
                                                        <BarChart data={activeDist.histogram}>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                                            <XAxis dataKey="range" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} label={{ value: 'Value Range', position: 'insideBottom', offset: -2, fill: 'var(--text-secondary)', fontSize: 11 }} />
                                                            <YAxis tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)', fontSize: 11 }} />
                                                            <RTooltip contentStyle={{ background: 'var(--bg-card)', borderRadius: 8 }} />
                                                            <Bar dataKey="count" fill="var(--primary-color, #2563eb)" radius={[4, 4, 0, 0]} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                )}
                                            </div>
                                        </div>

                                        {/* Boxplot summary card */}
                                        {activeDist.boxplot && (
                                            <div className="eda-card">
                                                <h4 className="eda-card-title">Boxplot Summary — {activeDist.column}</h4>
                                                <div className="boxplot-summary">
                                                    {[
                                                        ['Min', activeDist.boxplot.min],
                                                        ['Q1', activeDist.boxplot.q1],
                                                        ['Median', activeDist.boxplot.median],
                                                        ['Q3', activeDist.boxplot.q3],
                                                        ['Max', activeDist.boxplot.max],
                                                        ['Lower Whisker', activeDist.boxplot.lower_whisker],
                                                        ['Upper Whisker', activeDist.boxplot.upper_whisker],
                                                    ].map(([label, val]) => (
                                                        <div key={label} className="boxplot-row">
                                                            <span className="boxplot-label">{label}</span>
                                                            <span className="boxplot-value">{typeof val === 'number' ? val.toFixed(4) : '—'}</span>
                                                        </div>
                                                    ))}
                                                    <GraphicalBoxplot
                                                        {...activeDist.boxplot}
                                                        globalMin={activeDist.boxplot.min}
                                                        globalMax={activeDist.boxplot.max}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Skewness Table */}
                                <div className="eda-card">
                                    <h4 className="eda-card-title">Skewness Summary</h4>
                                    <DataTable
                                        columns={['column', 'skewness', 'kurtosis', 'interpretation']}
                                        rows={fd.skewness_table || []}
                                    />
                                </div>

                                {/* Outlier Table */}
                                <div className="eda-card">
                                    <h4 className="eda-card-title">Outlier Report (IQR Method)</h4>
                                    {fd.outlier_table?.length > 0 ? (
                                        <DataTable
                                            columns={['column', 'count', 'percentage']}
                                            rows={fd.outlier_table}
                                        />
                                    ) : (
                                        <div className="eda-ok-banner"><CheckCircle size={18} /> No significant outliers detected.</div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="eda-card eda-ok-banner"><Info size={18} /> No numeric features to analyze distributions for.</div>
                        )}
                    </section>

                    {/* ══════════════════════════════════════════════════
                        SECTION 3 — RELATIONSHIPS & CORRELATION
                    ══════════════════════════════════════════════════ */}
                    <section className="eda-section animate-fade-in-up">
                        <SectionHeader icon={TrendingUp} title="3 — Relationships & Correlation"
                            subtitle="Color-coded correlation heatmap, strong pair table, and feature-vs-target scatter plots." />

                        {/* Correlation Heatmap + Legend */}
                        {corrKeys.length > 1 ? (
                            <div className="eda-card">
                                <div className="corr-header">
                                    <h4 className="eda-card-title" style={{ margin: 0 }}>Correlation Heatmap</h4>
                                    <div className="corr-legend">
                                        <span style={{ background: 'rgba(239,68,68,0.7)' }} />Negative
                                        <span style={{ background: 'rgba(37,99,235,0.7)', marginLeft: 12 }} />Positive
                                    </div>
                                </div>
                                <div className="matrix-scroll-wrapper" style={{ marginTop: 16 }}>
                                    <table className="correlation-table">
                                        <thead><tr>
                                            <th style={{ position: 'sticky', left: 0, zIndex: 10 }}>Feature</th>
                                            {corrKeys.map(k => <th key={k}>{k}</th>)}
                                        </tr></thead>
                                        <tbody>
                                            {corrKeys.map(row => (
                                                <tr key={row}>
                                                    <td style={{ position: 'sticky', left: 0, zIndex: 5, background: 'var(--bg-secondary)', fontWeight: 700, fontSize: 12 }}>{row}</td>
                                                    {corrKeys.map(col => {
                                                        const v = cr.matrix[row]?.[col];
                                                        const textClr = Math.abs(v ?? 0) > 0.4 ? '#fff' : 'var(--text-main)';
                                                        return (
                                                            <td key={col} className="matrix-cell"
                                                                style={{ backgroundColor: corrColor(v), color: textClr, fontSize: 12, fontWeight: 600 }}
                                                                title={`${row} × ${col}: ${v?.toFixed(3) ?? 'N/A'}`}>
                                                                {v !== null && v !== undefined ? v.toFixed(2) : '—'}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="eda-card eda-ok-banner"><Info size={18} /> Need at least 2 numeric columns for a correlation matrix.</div>
                        )}

                        {/* Strong Correlation Pairs Table */}
                        <div className="eda-card">
                            <h4 className="eda-card-title">Strong Correlations (|r| &gt; 0.7)</h4>
                            {cr.strong_pairs?.length > 0 ? (
                                <DataTable
                                    columns={['feature_a', 'feature_b', 'correlation']}
                                    rows={cr.strong_pairs}
                                />
                            ) : (
                                <div className="eda-ok-banner"><CheckCircle size={18} /> No feature pairs exceed the 0.7 correlation threshold.</div>
                            )}
                        </div>

                        {/* Feature vs Target Scatter Plots */}
                        {cr.target_relationships?.length > 0 && (
                            <div className="eda-card">
                                <h4 className="eda-card-title">Feature vs Target Scatter Plots</h4>
                                <div className="scatter-grid">
                                    {cr.target_relationships.map(rel => (
                                        <div key={rel.feature} className="scatter-box">
                                            <p className="scatter-label">{rel.feature} vs {selCol}</p>
                                            <div style={{ width: '100%', minHeight: 200 }}>
                                                {rel.points && rel.points.length > 0 && (
                                                    <ResponsiveContainer width="100%" height={200}>
                                                        <ScatterChart margin={{ top: 5, right: 5, bottom: 20, left: 5 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                                            <XAxis dataKey="x" name={rel.feature} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }}
                                                                label={{ value: rel.feature, position: 'insideBottom', offset: -12, fontSize: 10, fill: 'var(--text-secondary)' }} />
                                                            <YAxis dataKey="y" name={selCol} tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} />
                                                            <RTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: 'var(--bg-card)', borderRadius: 8, fontSize: 12 }} />
                                                            <Scatter data={rel.points} fill="var(--primary-color, #2563eb)" fillOpacity={0.6} r={3} />
                                                        </ScatterChart>
                                                    </ResponsiveContainer>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Categorical vs Target Analysis */}
                        {cr.target_relationships_cat?.length > 0 && (
                            <div className="eda-card">
                                <h4 className="eda-card-title">Categorical vs Target relationships</h4>
                                <div className="scatter-grid" style={{ gridTemplateColumns: '1fr' }}>
                                    {cr.target_relationships_cat.map(rel => (
                                        <div key={rel.feature} className="scatter-box" style={{ padding: '1.5rem' }}>
                                            <p className="scatter-label">{rel.feature} vs {selCol}</p>

                                            {rel.type === 'regression' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                                                    {(() => {
                                                        const globalMin = Math.min(...rel.data.map(d => d.min));
                                                        const globalMax = Math.max(...rel.data.map(d => d.max));
                                                        return rel.data.map(d => (
                                                            <div key={d.category} className="cat-relo-row">
                                                                <span className="cat-relo-label" title={d.category}>{d.category}</span>
                                                                <div className="cat-relo-viz">
                                                                    <GraphicalBoxplot {...d} globalMin={globalMin} globalMax={globalMax} />
                                                                </div>
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>
                                            )}

                                            {rel.type === 'classification' && (
                                                <div style={{ width: '100%', minHeight: 300, marginTop: '1rem' }}>
                                                    {rel.data && rel.data.length > 0 && (
                                                        <ResponsiveContainer width="100%" height={300}>
                                                            <BarChart data={rel.data}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                                                                <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                                                                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                                                                <RTooltip contentStyle={{ background: 'var(--bg-card)', borderRadius: 8, fontSize: 12 }} />
                                                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                                                {rel.classes.map((cls, idx) => (
                                                                    <Bar key={cls} dataKey={cls} stackId="a" fill={['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][idx % 6]} />
                                                                ))}
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* ══════════════════════════════════════════════════
                        SECTION 4 — INSIGHTS & RECOMMENDATIONS
                    ══════════════════════════════════════════════════ */}
                    <section className="eda-section animate-fade-in-up">
                        <SectionHeader icon={Lightbulb} title="4 — Insights & Recommendations"
                            subtitle="Automatically generated findings and actionable data science recommendations." />

                        <div className="insights-reco-grid">
                            {/* Insights panel */}
                            <div className="eda-card">
                                <h4 className="eda-card-title">Automated Insights</h4>
                                <div className="insights-list">
                                    {ir.insights?.length > 0 ? ir.insights.map((ins, i) => (
                                        <div key={i} className="insight-pill"
                                            style={{ borderLeftColor: severityColor[ins.severity], background: severityBg[ins.severity] }}>
                                            <AlertTriangle size={15} style={{ color: severityColor[ins.severity], flexShrink: 0 }} />
                                            <span>{ins.text}</span>
                                        </div>
                                    )) : (
                                        <div className="eda-ok-banner"><CheckCircle size={18} /> No major anomalies detected. Dataset looks healthy.</div>
                                    )}
                                </div>
                            </div>

                            {/* Recommendations panel */}
                            <div className="eda-card">
                                <h4 className="eda-card-title">Recommendations</h4>

                                {/* Model recommendation highlight */}
                                {ir.model_recommendation?.model && (
                                    <div className="model-reco-banner">
                                        <div className="model-pill">{ir.model_recommendation.task} Task</div>
                                        <h3 className="model-winner">{ir.model_recommendation.model}</h3>
                                        <p className="reason-text">{ir.model_recommendation.reason}</p>
                                    </div>
                                )}

                                <div className="reco-list">
                                    {ir.recommendations?.map((r, i) => (
                                        <div key={i} className="reco-item">
                                            <span className="reco-action">{r.action}</span>
                                            <span className="reco-detail">{r.detail}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
            )}

            {/* ── Proceed Button ──────────────────────────────────── */}
            <div className="eda-final-action">
                <button className="btn-proceed" onClick={handleProceed} disabled={!selCol || !edaResults}>
                    Proceed to Model Training <ArrowRight size={22} />
                </button>
            </div>
        </div>
    );
};

export default EDAPage;
