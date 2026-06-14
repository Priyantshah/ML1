import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutoML } from '../context/AutoMLContext';
import client from '../api/client';
import { UploadCloud, FileText, AlertCircle, Loader } from 'lucide-react';
import './UploadPage.css';

const UploadPage = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const { setFileUrl, setMetadata, setTargetColumn, setEdaResults, setTrainResults, setModelUrl } = useAutoML();
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const uploadedFile = e.dataTransfer.files[0];
            if (!uploadedFile.name.endsWith('.csv')) {
                setError("Please upload a valid CSV file.");
                return;
            }
            setFile(uploadedFile);
            setError(null);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setError("Please select a dataset first.");
            return;
        }

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await client.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.status === 'success') {
                setFileUrl(response.data.data.fileUrl);
                setMetadata(response.data.data.metadata);
                setTargetColumn(null);
                setEdaResults(null);
                setTrainResults(null);
                setModelUrl(null);
                navigate('/preview');
            } else {
                setError(response.data.message || "Upload sequence failed.");
            }
        } catch (err) {
            console.error("Upload error:", err);
            setError(err.response?.data?.error || "Failed to establish upload logic. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="upload-container">
            <header className="page-header text-center" style={{ textAlign: 'center', marginBottom: '3rem', maxWidth: '600px' }}>
                <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 1rem 0' }}>
                    Upload Dataset
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: '1.6', margin: 0 }}>
                    Start by uploading your CSV dataset to begin the automated machine learning workflow.
                </p>
            </header>

            <div className="card upload-card">
                <form onSubmit={handleUpload} className="upload-form">

                    {/* Interactive Drop Zone */}
                    <label
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`file-drop-area ${isDragging ? 'active' : ''}`}
                    >
                        <UploadCloud size={64} className="upload-icon" />
                        <h3>
                            {isDragging ? "Drop to Upload" : "Click or Drag & Drop to Upload"}
                        </h3>
                        <p>Supported formats: CSV</p>

                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </label>

                    {/* File Info Card */}
                    {file && (
                        <div className="file-info fadeIn">
                            <div className="file-info-left">
                                <div className="file-icon-wrapper">
                                    <FileText size={24} />
                                </div>
                                <div className="file-details">
                                    <span className="file-name">{file.name}</span>
                                    <span className="file-size-text">{(file.size / 1024).toFixed(2)} KB</span>
                                </div>
                            </div>
                            <button type="button" className="file-remove-btn" onClick={() => setFile(null)} title="Remove file">✕</button>
                        </div>
                    )}

                    {/* Error Banner */}
                    {error && (
                        <div className="error-message fadeIn">
                            <AlertCircle size={20} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!file || uploading}
                        className="btn btn-primary btn-block"
                    >
                        {uploading ? (
                            <><Loader className="spinner" size={20} /> Uploading logic stream...</>
                        ) : 'Upload Dataset & Run Initial Analysis'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UploadPage;
