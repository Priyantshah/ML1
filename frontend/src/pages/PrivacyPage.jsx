import React from 'react';
import { Shield, Mail, Landmark, GraduationCap, CheckCircle, Info } from 'lucide-react';
import './PrivacyPage.css';

const PrivacyPage = () => {
    return (
        <div className="privacy-page-container animate-fade-in">
            <header className="privacy-header">
                <div className="privacy-badge">
                    <Shield size={14} />
                    <span>Compliance & Project Disclosure</span>
                </div>
                <h1>Privacy Policy</h1>
                <p className="last-updated">Last Updated: March 2026</p>
            </header>

            <article className="privacy-article">
                <section className="privacy-intro card-premium">
                    <p>
                        This Privacy Policy explains how <strong>Visual & Predictive Analytics</strong>, developed by <strong>Priyant Snehal Shah</strong>, collects, uses, and protects user information when using the <strong>Predictive and Visual Analytics of Leaderboard Performance Using EDA and AutoML</strong> platform.
                    </p>
                    <div className="institutional-box">
                        <Landmark size={20} className="inst-icon" />
                        <div>
                            <p>This platform is developed as part of a <strong>Final Year Engineering Project</strong> at:</p>
                            <strong>Gokhale Education Society's R. H. Sapat College of Engineering, Management Studies And Research, Nashik – 422005, India.</strong>
                        </div>
                    </div>
                </section>

                <div className="policy-grid">
                    <section className="policy-section">
                        <h3><CheckCircle size={18} /> Data Collection & Usage</h3>
                        <ul className="policy-list">
                            <li>The platform may collect <strong>account information</strong> such as email address and login credentials when users create an account.</li>
                            <li>Users can upload datasets for machine learning analysis including <strong>CSV files and Excel files</strong>.</li>
                            <li>Uploaded datasets are used only for <strong>machine learning processing, data analysis, and model training</strong> within the platform.</li>
                            <li>Collected data may be used for <strong>preprocessing, training models, evaluating performance, generating predictions, and improving platform functionality</strong>.</li>
                        </ul>
                    </section>

                    <section className="policy-section">
                        <h3><GraduationCap size={18} /> Storage & Control</h3>
                        <ul className="policy-list">
                            <li>Uploaded datasets may be <strong>temporarily processed and stored for model training history</strong>.</li>
                            <li>Datasets remain stored <strong>until the user deletes them from the platform</strong>.</li>
                            <li>Users maintain control and can <strong>delete datasets whenever required</strong>.</li>
                            <li>The system is intended mainly for <strong>educational, research, and demonstration purposes</strong>.</li>
                        </ul>
                    </section>

                    <section className="policy-section">
                        <h3><Shield size={18} /> Security & Third-Parties</h3>
                        <ul className="policy-list">
                            <li>Security measures include <strong>controlled system access, secure storage, and account protection</strong>.</li>
                            <li>The platform uses <strong>third-party APIs and open-source libraries</strong>, including <strong>Grok API</strong>, to support ML features.</li>
                            <li>While we take reasonable steps to protect data, no online system can guarantee <strong>complete security</strong>.</li>
                            <li>Users must ensure datasets do not contain <strong>sensitive or confidential personal information</strong>.</li>
                        </ul>
                    </section>
                </div>

                <section className="contact-box card-premium">
                    <h3>Contact Information</h3>
                    <div className="contact-details">
                        <div className="contact-item">
                            <Mail size={16} />
                            <span><strong>Email:</strong> <a href="mailto:automlbuilder@gmail.com">automlbuilder@gmail.com</a></span>
                        </div>
                        <div className="developer-info">
                            <p><strong>Developer:</strong> Priyant Snehal Shah</p>
                            <p><strong>Team:</strong> Visual & Predictive Analytics</p>
                            <p><strong>Institution:</strong> Gokhale Education Society's R. H. Sapat College of Engineering, Nashik, India</p>
                        </div>
                    </div>
                </section>
            </article>

            <footer className="privacy-footer-note">
                <Info size={16} />
                <span>By using this platform, users agree to the practices described in this Privacy Policy.</span>
            </footer>
        </div>
    );
};

export default PrivacyPage;
