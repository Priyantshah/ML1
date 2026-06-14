import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutoML } from '../context/AutoMLContext';
import { Sliders, ChevronRight } from 'lucide-react';
import './DataCleaningPage.css';

const DataCleaningPage = () => {
  const { metadata } = useAutoML();
  const navigate = useNavigate();

  const handleApply = () => {
    // In a real app, logic to apply cleaning would go here
    navigate('/preview');
  };

  const stats = {
    rows: metadata?.rowCount ?? '—',
    columns: metadata?.columnCount ?? '—',
    missing: metadata?.totalMissing ?? '—',
    memory: metadata?.memoryUsage ?? '—',
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Data Cleaning</h1>
        <p>
          Configure missing value handling, outlier removal, encoding, and scaling before training
          models.
        </p>
      </header>

      <div className="cleaning-layout">
        <div className="card cleaning-controls">
          <h3>Cleaning Strategy</h3>


          <div className="cleaning-toggle-row">
            <label className="toggle-label">
              <input type="checkbox" defaultChecked />
              <span>Remove duplicates</span>
            </label>
            <label className="toggle-label">
              <input type="checkbox" />
              <span>Remove outliers</span>
            </label>
          </div>

          <div className="form-group">
            <label>Scaling</label>
            <select>
              <option>StandardScaler</option>
              <option>MinMaxScaler</option>
              <option>RobustScaler</option>
              <option>None</option>
            </select>
          </div>

          <div className="form-group">
            <label>Encoding</label>
            <select>
              <option>One-Hot Encoding</option>
              <option>Target Encoding</option>
              <option>Ordinal Encoding</option>
            </select>
          </div>

          <button
            className="btn btn-primary btn-block"
            type="button"
            onClick={handleApply}
          >
            Apply Configurations & Proceed <ChevronRight size={18} />
          </button>
        </div>

        <div className="card cleaning-summary">
          <h3>Dataset Summary</h3>
          <div className="cleaning-summary-grid">
            <div className="summary-item">
              <span className="summary-label">Rows</span>
              <span className="summary-value">{stats.rows}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Columns</span>
              <span className="summary-value">{stats.columns}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Missing</span>
              <span className="summary-value">{stats.missing}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Memory Usage</span>
              <span className="summary-value">{stats.memory}</span>
            </div>
          </div>

          <div className="cleaning-placeholder-grid">
            <div className="mini-chart-placeholder">
              <span className="mini-title">Missing Value Heatmap</span>
            </div>
            <div className="mini-chart-placeholder">
              <span className="mini-title">Before vs After Missing Values</span>
            </div>
            <div className="mini-chart-placeholder">
              <span className="mini-title">Outlier Boxplot</span>
            </div>
            <div className="mini-chart-placeholder">
              <span className="mini-title">Z-Score Distribution</span>
            </div>
            <div className="mini-chart-placeholder">
              <span className="mini-title">Skewness Distribution</span>
            </div>
            <div className="mini-chart-placeholder">
              <span className="mini-title">Duplicate Records</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataCleaningPage;

