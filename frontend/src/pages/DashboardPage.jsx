import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  Eraser,
  Wand2,
  BadgePercent,
  BarChart2 as BarChartIcon,
  BrainCircuit,
  Activity,
  MousePointerClick,
  ChevronDown,
  Sparkles,
  BookOpen
} from 'lucide-react';
import './DashboardPage.css';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(null);

  const pipelineSteps = [
    { id: 1, icon: <UploadCloud />, title: 'Dataset Upload', desc: 'Securely upload your CSV or Excel files for instant deep-learning analysis.', color: '#4ADE80', gradient: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)' },
    { id: 2, icon: <Wand2 />, title: 'Missing Value Handling', desc: 'Smart imputation using advanced statistical modes and predictive modeling.', color: '#FB923C', gradient: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)' },
    { id: 3, icon: <BadgePercent />, title: 'Feature Encoding', desc: 'Converts complex categorical strings into optimized numerical vector representations.', color: '#A78BFA', gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)' },
    { id: 4, icon: <BarChartIcon />, title: 'Exploratory Analysis', desc: 'Deep dive into patterns with interactive heatmaps and correlation matrices.', color: '#F472B6', gradient: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)' },
    { id: 5, icon: <BrainCircuit />, title: 'Model Training', desc: 'Ensemble learning across multiple architectures to find the theoretical optimum.', color: '#2DD4BF', gradient: 'linear-gradient(135deg, #2dd4bf 0%, #14b8a6 100%)' },
    { id: 6, icon: <Activity />, title: 'Model Evaluation', desc: 'Cross-validation and performance benchmarking with precision-recall curves.', color: '#FACC15', gradient: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)' }
  ];

  return (
    <div className="dashboard-wrapper">

      {/* Premium Header */}
      <header className="dashboard-header">
        <h1 className="dashboard-title">
          Predictive and Visual Analytics of Leaderboard Performance Using EDA and AutoML
        </h1>
        <p className="dashboard-subtitle">
          Seamless automated machine learning architecture bridging complex data analytics and visual inference.
        </p>
      </header>

      {/* Main Layout Area */}
      <div className="dashboard-container">

        {/* Core Actions Sidebar */}
        <aside className="dashboard-sidebar">
          <h4 className="sidebar-section-title">
            CORE ACTIONS
          </h4>

          <div
            onClick={() => navigate('/upload')}
            className="sidebar-action-card"
          >
            <div className="nav-icon-container">
              <UploadCloud size={22} />
            </div>
            <span>Upload Hub</span>
          </div>
        </aside>

        {/* Pipeline Main Section */}
        <section className="dashboard-main">
          <div className="pipeline-title-row">
            <h2 className="pipeline-title">
              <Sparkles className="sparkle-icon" size={28} /> End-to-End Pipeline
            </h2>
            <div className="pipeline-status-badge">
              <div className="status-dot"></div> 6 Active Stages
            </div>
          </div>

          {/* Existing Dropdown Cascade CSS Retained Intact */}
          <div className="dynamic-pipeline-container">
            <div className="pipeline-glow-ribbon"></div>

            <div className="panoramic-steps-list">
              {pipelineSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`panoramic-step-card ${activeStep === step.id ? 'expanded' : ''}`}
                  onMouseEnter={() => setActiveStep(step.id)}
                  onMouseLeave={() => setActiveStep(null)}
                  style={{ '--accent-color': step.color, '--accent-gradient': step.gradient }}
                >
                  <div className="step-card-header">
                    <div className="step-index">0{step.id}</div>
                    <div className="step-icon-sphere">
                      {React.cloneElement(step.icon, { size: 24 })}
                    </div>
                  </div>

                  <h4 className="step-card-title">{step.title}</h4>

                  <div className="step-dropdown-trigger">
                    <ChevronDown size={16} className={activeStep === step.id ? 'rotate' : ''} />
                  </div>

                  <div className="step-description-cascade">
                    <div className="cascade-content">
                      <p>{step.desc}</p>
                    </div>
                  </div>

                  {/* Connecting Line Segment */}
                  {index < pipelineSteps.length - 1 && (
                    <div className="logic-bridge">
                      <div className="bridge-pulse"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;

