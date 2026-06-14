import React from 'react';
import {
    Book,
    ShieldCheck,
    Cpu,
    Database,
    BarChart3,
    Zap,
    BrainCircuit,
    Info,
    FileText,
    Layers,
    Activity,
    Download,
    Eye
} from 'lucide-react';
import './DocumentationPage.css';

const DocumentationPage = () => {
    return (
        <div className="docs-page-container animate-fade-in">
            <header className="docs-header">
                <div className="docs-badge">
                    <Book size={14} />
                    <span>User Manual & Specification</span>
                </div>
                <h1>Platform Documentation</h1>
                <p>Predictive and Visual Analytics of Leaderboard Performance Using EDA and AutoML</p>
            </header>

            <article className="docs-article">
                <section className="docs-intro card-premium">
                    <h3>Platform Overview</h3>
                    <p>
                        Predictive and Visual Analytics of Leaderboard Performance Using EDA and AutoML is an automated machine learning platform designed to help users analyze datasets, train machine learning models, and generate predictions through an interactive web interface.
                    </p>
                    <p>
                        The platform simplifies the machine learning workflow by automatically handling data preprocessing, model training, performance evaluation, and result visualization.
                    </p>
                    <div className="project-credit-box">
                        <Info size={18} />
                        <span>This system is developed as part of a <strong>Final Year Engineering Project</strong> by <strong>Priyant Snehal Shah</strong> under the team <strong>Visual & Predictive Analytics</strong>.</span>
                    </div>
                </section>

                <section className="docs-chapter">
                    <h2><Layers size={22} /> System Workflow</h2>
                    <p>The platform follows a structured machine learning workflow to transform raw data into intelligent insights:</p>

                    <div className="workflow-detailed-list">
                        <div className="workflow-item">
                            <div className="item-number">01</div>
                            <div className="item-body">
                                <h3>User Login</h3>
                                <p>Users create an account and log in to access the platform features securely.</p>
                            </div>
                        </div>
                        <div className="workflow-item">
                            <div className="item-number">02</div>
                            <div className="item-body">
                                <h3>Dataset Upload</h3>
                                <p>Users upload their datasets in supported formats such as CSV or Excel.</p>
                            </div>
                        </div>
                        <div className="workflow-item">
                            <div className="item-number">03</div>
                            <div className="item-body">
                                <h3>Data Preprocessing</h3>
                                <p>The system automatically cleans and prepares the dataset by handling missing values and encoding categorical variables.</p>
                            </div>
                        </div>
                        <div className="workflow-item">
                            <div className="item-number">04</div>
                            <div className="item-body">
                                <h3>Feature Selection</h3>
                                <p>Users select input features that will be used to train the machine learning model.</p>
                            </div>
                        </div>
                        <div className="workflow-item">
                            <div className="item-number">05</div>
                            <div className="item-body">
                                <h3>Model Training</h3>
                                <p>The platform automatically trains multiple machine learning regression models simultaneously.</p>
                            </div>
                        </div>
                        <div className="workflow-item">
                            <div className="item-number">06</div>
                            <div className="item-body">
                                <h3>Model Evaluation</h3>
                                <p>Each trained model is evaluated using rigorous performance metrics to ensure accuracy.</p>
                            </div>
                        </div>
                        <div className="workflow-item">
                            <div className="item-number">07</div>
                            <div className="item-body">
                                <h3>Best Model Selection</h3>
                                <p>The system automatically selects the best-performing model based on cross-validated evaluation results.</p>
                            </div>
                        </div>
                        <div className="workflow-item">
                            <div className="item-number">08</div>
                            <div className="item-body">
                                <h3>Prediction Generation</h3>
                                <p>Users can generate predictions on new data using the highly-optimized trained model.</p>
                            </div>
                        </div>
                        <div className="workflow-item">
                            <div className="item-number">09</div>
                            <div className="item-body">
                                <h3>Results Visualization</h3>
                                <p>Model performance and predictions are displayed through interactive charts and graphs.</p>
                            </div>
                        </div>
                        <div className="workflow-item">
                            <div className="item-number">10</div>
                            <div className="item-body">
                                <h3>Download Results</h3>
                                <p>Users can export prediction results, trained models, and detailed evaluation reports.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="docs-dual-grid">
                    <section className="docs-chapter">
                        <h2><FileText size={22} /> Supported File Formats</h2>
                        <div className="format-pills">
                            <div className="format-pill"><strong>CSV files</strong> (.csv)</div>
                            <div className="format-pill"><strong>Excel files</strong> (.xlsx)</div>
                        </div>
                        <p className="mt-2 text-sm text-secondary">Datasets should contain relevant feature columns and a explicitly defined target column for prediction.</p>
                    </section>

                    <section className="docs-chapter">
                        <h2><Cpu size={22} /> Machine Learning Models</h2>
                        <ul className="model-bullet-list">
                            <li>Linear Regression</li>
                            <li>Ridge Regression</li>
                            <li>Lasso Regression</li>
                            <li>Random Forest Regression</li>
                            <li>Gradient Boosting Regression</li>
                            <li>Support Vector Regression (SVR)</li>
                            <li>XGBoost Regression</li>
                        </ul>
                    </section>
                </div>

                <section className="docs-chapter">
                    <h2><Activity size={22} /> Performance Metrics</h2>
                    <div className="metrics-grid">
                        <div className="metric-box">
                            <h4>R² Score</h4>
                            <p>Measures how well the model explains the variance in the data.</p>
                        </div>
                        <div className="metric-box">
                            <h4>MAE</h4>
                            <p>Mean Absolute Error: Average absolute difference between predicted and actual values.</p>
                        </div>
                        <div className="metric-box">
                            <h4>MSE</h4>
                            <p>Mean Squared Error: Average squared difference between predicted and actual values.</p>
                        </div>
                        <div className="metric-box">
                            <h4>RMSE</h4>
                            <p>Root Mean Squared Error: Square root of MSE for better interpretability.</p>
                        </div>
                        <div className="metric-box">
                            <h4>Adjusted R²</h4>
                            <p>Version of R² that considers the number of features to prevent overfitting.</p>
                        </div>
                    </div>
                </section>

                <section className="docs-chapter">
                    <h2><Eye size={22} /> Visualization and Results</h2>
                    <p>The platform provides visual insights to help users understand model performance effortlessly.</p>
                    <div className="visualization-list card-premium">
                        <div className="viz-item"><BarChart3 size={16} /> <span>Model comparison charts</span></div>
                        <div className="viz-item"><Activity size={16} /> <span>Performance evaluation graphs</span></div>
                        <div className="viz-item"><Zap size={16} /> <span>Prediction results display</span></div>
                        <div className="viz-item"><Database size={16} /> <span>Data insights through interactive visualizations</span></div>
                    </div>
                </section>

                <section className="docs-chapter">
                    <h2><Download size={22} /> Downloadable Outputs</h2>
                    <div className="tech-comparison-grid">
                        <div className="tech-card-glass">
                            <h5>Predictions</h5>
                            <p>Download your generated prediction results in CSV format.</p>
                        </div>
                        <div className="tech-card-glass">
                            <h5>Best Model</h5>
                            <p>Export the optimized machine learning model for external use.</p>
                        </div>
                        <div className="tech-card-glass">
                            <h5>Reports</h5>
                            <p>Get a comprehensive model evaluation report for documentation.</p>
                        </div>
                    </div>
                </section>

                <div className="docs-dual-grid">
                    <section className="docs-chapter">
                        <h2><Zap size={22} /> System Requirements</h2>
                        <ul className="req-list">
                            <li>Modern web browser (Chrome, Edge, Firefox, etc.)</li>
                            <li>Stable internet connection</li>
                            <li>Dataset in supported format (CSV or Excel)</li>
                        </ul>
                        <p className="no-exp-badge">No prior machine learning expertise required</p>
                    </section>

                    <section className="docs-chapter">
                        <h2><ShieldCheck size={22} /> Limitations</h2>
                        <div className="limitations-box">
                            <p>Model accuracy depends on the quality and structure of the uploaded dataset.</p>
                            <p>Poorly structured or incomplete datasets may lead to lower prediction accuracy.</p>
                            <p className="edu-tag">The system is primarily intended for educational and experimental use.</p>
                        </div>
                    </section>
                </div>
            </article>

            <footer className="footer-doc-end">
                <p>&copy; {new Date().getFullYear()} Visual & Predictive Analytics Team. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default DocumentationPage;
