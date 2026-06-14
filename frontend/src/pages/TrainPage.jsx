import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutoML } from '../context/AutoMLContext';
import client from '../api/client';
import {
    Play,
    Loader,
    AlertCircle,
    CheckCircle,
    Zap,
    Cpu,
    TrendingUp,
    Layers,
    ShieldCheck,
    Rocket,
    Clock
} from 'lucide-react';
import './TrainPage.css';

const TrainPage = () => {
    const { fileUrl, targetColumn, setModelUrl, setTrainResults, edaResults } = useAutoML();
    const [training, setTraining] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [trainingTime, setTrainingTime] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        let interval;
        if (training) {
            interval = setInterval(() => {
                setTrainingTime((prev) => prev + 1);
            }, 1000);
        } else {
            setTrainingTime(0);
        }
        return () => clearInterval(interval);
    }, [training]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    useEffect(() => {
        if (!targetColumn) {
            navigate('/eda');
        }
    }, [targetColumn, navigate]);

    const handleTrain = async () => {
        if (!targetColumn) return;

        setTraining(true);
        setError(null);
        setProgress(0);

        try {
            const response = await fetch(`${client.defaults.baseURL}/train/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fileUrl,
                    targetColumn,
                    eda_config: edaResults
                })
            });

            if (!response.ok) {
                let message = 'Connection lost during model optimization.';
                try {
                    const errJson = await response.json();
                    message = errJson.error || message;
                } catch {
                    // ignore JSON parse errors
                }
                throw new Error(message);
            }

            if (!response.body) {
                throw new Error('Streaming is not supported by your browser.');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let gotFinalResult = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const rawLine of lines) {
                    const line = rawLine.trim();
                    if (!line) continue;

                    let event;
                    try {
                        event = JSON.parse(line);
                    } catch {
                        continue;
                    }

                    if (event.type === 'progress' && Number.isFinite(event.progress)) {
                        setProgress(Math.max(0, Math.min(99, event.progress)));
                    } else if (event.type === 'error') {
                        throw new Error(event.error || 'The training engine encountered an unexpected error.');
                    } else if (event.type === 'result' && event.status === 'success') {
                        gotFinalResult = true;
                        setProgress(100);
                        setTrainResults(event.data);
                        setModelUrl(event.data.model_url || event.data.model_path);
                        setTimeout(() => navigate('/results'), 400);
                    }
                }
            }

            if (!gotFinalResult) {
                throw new Error('Training stream ended before returning final result.');
            }
        } catch (err) {
            console.error("Training error:", err);
            setError(err.message || "Connection lost during model optimization.");
        } finally {
            setTraining(false);
        }
    };

    if (!targetColumn) return null;

    return (
        <div className="train-page-container animate-fade-in">
            <header className="train-header">
                <h1>Model Training Lab</h1>
                <p>Deploying advanced ensemble architectures to find the theoretical optimum for your dataset.</p>
            </header>

            <div className="train-layout">
                {/* Main Training Console */}
                <div className="control-hub-card">
                    {!training ? (
                        <div className="ready-box animate-fade-in-up">
                            <div className="ready-aura" onClick={handleTrain} title="Start Training">
                                <Play size={56} className="play-icon" fill="currentColor" fillOpacity={0.2} />
                            </div>
                            <div className="text-center">
                                <h2 className="mb-2 font-bold text-2xl">Awaiting Deployment</h2>
                                <div className="target-pill">
                                    <Cpu size={18} /> Target Feature: <strong>{targetColumn}</strong>
                                </div>
                            </div>
                            <button
                                className="btn-train-vibrant"
                                onClick={handleTrain}
                            >
                                <Rocket size={24} /> Train All Models
                            </button>
                        </div>
                    ) : (
                        <div className="training-lab-view animate-fade-in">
                            <div className="lab-spinner-box">
                                <div className="spinner-glow"></div>
                                <Loader size={120} className="spinner text-primary" strokeWidth={1.5} />
                            </div>

                            <div className="progress-dashboard">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <div className="percentage-text" style={{ margin: 0 }}>{progress}%</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Clock size={18} />
                                        {formatTime(trainingTime)}
                                    </div>
                                </div>
                                <div className="progress-track" style={{ marginTop: 0 }}>
                                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="status-log">
                                    {progress < 30 && "⚡ Initializing Neural Architectures..."}
                                    {progress >= 30 && progress < 60 && "🔄 Cross-Validating Performance..."}
                                    {progress >= 60 && progress < 90 && "🎯 Optimizing Hyperparameters..."}
                                    {progress >= 90 && "🏆 Finalizing Champion Model..."}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error Section */}
                {error && (
                    <div className="train-error-alert">
                        <AlertCircle size={48} color="#ef4444" />
                        <div className="error-info">
                            <h3>Engine Malfunction</h3>
                            <p>{error}</p>
                            <div className="flex gap-4 mt-4">
                                <button className="btn btn-primary" onClick={() => setError(null)}>Re-initialize</button>
                                <button className="btn btn-secondary" onClick={() => navigate('/upload')}>Re-upload Data</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Training Stats/Tips (Only visible when not training) */}
                {!training && !error && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <div className="card text-center p-6">
                            <Zap size={32} className="text-yellow-500 mx-auto mb-3" />
                            <h4 className="font-bold">7+ Algorithms</h4>
                            <p className="text-sm text-secondary">Broad testing across multiple model families.</p>
                        </div>
                        <div className="card text-center p-6">
                            <ShieldCheck size={32} className="text-green-500 mx-auto mb-3" />
                            <h4 className="font-bold">Cross-Validated</h4>
                            <p className="text-sm text-secondary">Robust evaluation to prevent overfitting.</p>
                        </div>
                        <div className="card text-center p-6">
                            <TrendingUp size={32} className="text-blue-500 mx-auto mb-3" />
                            <h4 className="font-bold">Auto-Tuned</h4>
                            <p className="text-sm text-secondary">Intelligent hyperparameter search enabled.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrainPage;

