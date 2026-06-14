import React from 'react';
import { LifeBuoy, Mail, User, Users, ClipboardCheck, AlertCircle, HelpCircle, ArrowRight } from 'lucide-react';
import './SupportPage.css';

const SupportPage = () => {
    return (
        <div className="support-page-container animate-fade-in">
            <header className="support-header">
                <div className="support-badge">
                    <LifeBuoy size={14} />
                    <span>Help Center</span>
                </div>
                <h1>System Support</h1>
                <p>Assistance for the Predictive and Visual Analytics of Leaderboard Performance Using EDA and AutoML.</p>
            </header>

            <article className="support-article">
                <section className="support-intro card-premium">
                    <p>
                        If you experience any issues while using the platform, you can contact the development team for assistance.
                        We are here to help you navigate the machine learning lifecycle smoothly.
                    </p>
                </section>

                <div className="support-grid">
                    <section className="support-card help-topics">
                        <h3><HelpCircle size={20} /> How we can help</h3>
                        <p>The platform support team can help with issues related to:</p>
                        <ul className="support-list">
                            <li>Account access or login problems</li>
                            <li>Dataset upload errors</li>
                            <li>Model training or prediction issues</li>
                            <li>Result download problems</li>
                            <li>General platform usage guidance</li>
                        </ul>
                    </section>

                    <section className="support-card check-list">
                        <h3><ClipboardCheck size={20} /> Before you contact us</h3>
                        <p>Please ensure the following to speed up the resolution process:</p>
                        <ul className="support-list">
                            <li>Ensure datasets are in supported formats (<strong>CSV or Excel</strong>).</li>
                            <li>Check your internet connectivity for large dataset uploads.</li>
                            <li>Verify that your target column is correctly selected.</li>
                        </ul>
                    </section>
                </div>

                <section className="contact-main card-premium">
                    <div className="contact-header-row">
                        <div className="contact-icon-shell">
                            <Mail size={24} />
                        </div>
                        <div>
                            <h2>Contact Technical Support</h2>
                            <p>Direct line to the Visual & Predictive Analytics development team.</p>
                        </div>
                    </div>

                    <div className="contact-grid-info">
                        <div className="info-item">
                            <User size={18} />
                            <span><strong>Developer:</strong> Priyant Snehal Shah</span>
                        </div>
                        <div className="info-item">
                            <Users size={18} />
                            <span><strong>Team:</strong> Visual & Predictive Analytics</span>
                        </div>
                        <div className="info-item">
                            <Mail size={18} />
                            <span><strong>Email:</strong> <a href="mailto:automlbuilder@gmail.com">automlbuilder@gmail.com</a></span>
                        </div>
                    </div>
                </section>

                <section className="support-request-guide">
                    <h3><AlertCircle size={20} /> Request Requirements</h3>
                    <p>Please include the following details when requesting support for a faster response:</p>
                    <div className="req-pills">
                        <div className="req-pill">Your registered email address</div>
                        <div className="req-pill">Detailed description of the issue</div>
                        <div className="req-pill">Screenshot or error message (if available)</div>
                    </div>
                </section>
            </article>

            <footer className="support-footer-note">
                <p>The support team will try to respond as soon as possible to help resolve the issue.</p>
            </footer>
        </div>
    );
};

export default SupportPage;
