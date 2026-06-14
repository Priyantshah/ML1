import React from 'react';
import PredictPage from './PredictPage';

const PredictionCenterPage = () => {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Prediction Center</h1>
        <p>Run manual and batch predictions using your best-performing model.</p>
      </header>

      {/* Manual prediction (reuse existing PredictPage UI) */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Manual Prediction</h3>
        <PredictPage />
      </div>

      {/* Batch prediction shell (UI only) */}
      <div className="card">
        <h3>Batch Prediction</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Upload a CSV file to generate predictions at scale. Results will be available to
          download.
        </p>
        <div className="file-drop-area">
          <p>Drag &amp; drop CSV file here or click to browse</p>
        </div>
        <div className="cleaning-placeholder-grid" style={{ marginTop: '1.25rem' }}>
          <div className="mini-chart-placeholder">
            <span className="mini-title">Prediction Distribution</span>
          </div>
          <div className="mini-chart-placeholder">
            <span className="mini-title">Confidence Histogram</span>
          </div>
        </div>
        <button className="btn btn-secondary" type="button" style={{ marginTop: '1.25rem' }}>
          Download Predictions
        </button>
      </div>
    </div>
  );
};

export default PredictionCenterPage;

