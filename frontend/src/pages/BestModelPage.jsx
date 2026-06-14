import React from 'react';
import { useAutoML } from '../context/AutoMLContext';

const BestModelPage = () => {
  const { trainResults } = useAutoML();

  if (!trainResults) {
    return (
      <div className="page-container flex-center">
        <p>No training results available yet. Train models to view the best model summary.</p>
      </div>
    );
  }

  const { best_model, best_score, task_type, results } = trainResults;
  const bestMetrics = results?.[best_model] || {};

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Best Model</h1>
        <p>Deep dive into the champion model selected by the AutoML training pipeline.</p>
      </header>

      <div className="best-model-layout">
        <div className="card best-model-main">
          <h3>Model Overview</h3>
          <div className="best-model-core">
            <div>
              <span className="best-model-label">Best Model</span>
              <div className="best-model-name">{best_model}</div>
            </div>
            <div>
              <span className="best-model-label">
                {task_type === 'Regression' ? 'R²' : 'Accuracy'}
              </span>
              <div className="best-model-score">
                {best_score !== undefined ? best_score.toFixed(4) : '—'}
              </div>
            </div>
            <div>
              <span className="best-model-label">Task Type</span>
              <div className="best-model-pill">{task_type}</div>
            </div>
          </div>

          <div className="best-model-metrics">
            {task_type === 'Regression' ? (
              <>
                <div>
                  <span className="best-model-label">MAE</span>
                  <div>{bestMetrics.MAE?.toFixed(4) ?? '—'}</div>
                </div>
                <div>
                  <span className="best-model-label">MSE</span>
                  <div>{bestMetrics.MSE?.toFixed(4) ?? '—'}</div>
                </div>
                <div>
                  <span className="best-model-label">RMSE</span>
                  <div>{bestMetrics.RMSE?.toFixed(4) ?? '—'}</div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span className="best-model-label">Precision</span>
                  <div>{bestMetrics.Precision?.toFixed(4) ?? '—'}</div>
                </div>
                <div>
                  <span className="best-model-label">Recall</span>
                  <div>{bestMetrics.Recall?.toFixed(4) ?? '—'}</div>
                </div>
                <div>
                  <span className="best-model-label">F1 Score</span>
                  <div>{bestMetrics.F1?.toFixed(4) ?? '—'}</div>
                </div>
              </>
            )}
          </div>

          <div className="best-model-actions">
            <button className="btn btn-primary">Download Model (.pkl)</button>
            <button className="btn btn-secondary">Download Report (.txt)</button>
          </div>
        </div>

        <div className="card best-model-viz">
          <h3>Explainability & Diagnostics</h3>
          <div className="cleaning-placeholder-grid">
            <div className="mini-chart-placeholder">
              <span className="mini-title">Feature Importance</span>
            </div>
            <div className="mini-chart-placeholder">
              <span className="mini-title">SHAP Summary Plot</span>
            </div>
            <div className="mini-chart-placeholder">
              <span className="mini-title">Learning Curve</span>
            </div>
            <div className="mini-chart-placeholder">
              <span className="mini-title">Confidence Distribution</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BestModelPage;

