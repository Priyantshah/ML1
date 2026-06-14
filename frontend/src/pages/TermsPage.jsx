import React from 'react';
import { FileText, ShieldAlert, Scale, GraduationCap, Gavel, Mail, Info, CheckCircle } from 'lucide-react';
import './TermsPage.css';

const TermsPage = () => {
    return (
        <div className="terms-page-container animate-fade-in">
            <header className="terms-header">
                <div className="terms-badge">
                    <Gavel size={14} />
                    <span>Legal Agreement</span>
                </div>
                <h1>Terms of Service</h1>
                <p>Rules and guidelines for using the Visual & Predictive Analytics Workstation.</p>
            </header>

            <article className="terms-article">
                <section className="terms-intro card-premium">
                    <div className="section-icon-shell">
                        <Info size={24} />
                    </div>
                    <div>
                        <p>
                            The <strong>Predictive and Visual Analytics of Leaderboard Performance Using EDA and AutoML</strong> allows users to upload datasets and train machine learning models.
                            This system is developed for <strong>educational and research purposes</strong> as a final year engineering project.
                        </p>
                    </div>
                </section>

                <div className="terms-grid">
                    <section className="terms-card">
                        <h3><ShieldAlert size={18} /> User Responsibility</h3>
                        <ul className="terms-list">
                            <li>The platform must be used only for <strong>legal and ethical purposes</strong>.</li>
                            <li>Users are required to create an <strong>account</strong> to access the platform features.</li>
                            <li>Users are responsible for maintaining the <strong>security of their login credentials</strong>.</li>
                            <li>Any activity performed using a user account is the <strong>responsibility of that user</strong>.</li>
                        </ul>
                    </section>

                    <section className="terms-card">
                        <h3><Scale size={18} /> Data & Processing</h3>
                        <ul className="terms-list">
                            <li>Users can upload <strong>CSV and Excel datasets</strong> for machine learning analysis.</li>
                            <li>Uploaded datasets must <strong>not contain sensitive, illegal, or unauthorized data</strong>.</li>
                            <li>Uploaded datasets are used for <strong>data preprocessing, model training, performance evaluation, and prediction generation</strong>.</li>
                            <li>Datasets may be <strong>temporarily processed and stored for model training history</strong>.</li>
                            <li>Users can <strong>delete their datasets from the platform when needed</strong>.</li>
                        </ul>
                    </section>

                    <section className="terms-card">
                        <h3><GraduationCap size={18} /> System Capabilities</h3>
                        <ul className="terms-list">
                            <li>The platform allows users to <strong>view model results and download prediction outputs or trained models</strong>.</li>
                            <li>The system may use <strong>third-party APIs and open-source libraries, including Grok API</strong>.</li>
                            <li>Predictions generated <strong>may not always be fully accurate</strong>; the platform is for <strong>learning and experimentation</strong>.</li>
                        </ul>
                    </section>

                    <section className="terms-card">
                        <h3><FileText size={18} /> Intellectual Property</h3>
                        <ul className="terms-list">
                            <li>The platform design and system architecture belong to <strong>Priyant Snehal Shah and Team Visual & Predictive Analytics</strong>.</li>
                            <li>Unauthorized copying or redistribution of the platform without permission is <strong>not permitted</strong>.</li>
                        </ul>
                    </section>
                </div>

                <section className="support-box card-premium">
                    <div className="support-content">
                        <Mail size={24} className="support-icon" />
                        <div>
                            <h3>Support & Questions</h3>
                            <p>For questions or support, users can contact: <a href="mailto:automlbuilder@gmail.com">automlbuilder@gmail.com</a></p>
                        </div>
                    </div>
                </section>
            </article>

            <footer className="terms-footer-note">
                <CheckCircle size={16} />
                <span>By using this platform, you acknowledge that you have read and agreed to these terms.</span>
            </footer>
        </div>
    );
};

export default TermsPage;
