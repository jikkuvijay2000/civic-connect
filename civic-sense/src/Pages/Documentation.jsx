import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaFileContract, FaArrowLeft, FaLock, FaUserShield } from 'react-icons/fa';

const Documentation = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('terms');

    const fadeIn = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    };

    return (
        <div className="min-vh-100 bg-light">
            {/* Header */}
            <header className="bg-white shadow-sm sticky-top z-3">
                <div className="container py-3">
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3">
                            <button onClick={() => navigate(-1)} className="btn btn-light rounded-circle p-2 hover-scale text-secondary">
                                <FaArrowLeft />
                            </button>
                            <h4 className="fw-bold mb-0 text-dark ls-tight">Legal Documentation</h4>
                        </div>
                        {/* <div className="d-none d-md-block">
                             <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-3 py-2">Updated Feb 2026</span>
                        </div> */}
                    </div>
                </div>
            </header>

            <main className="container py-5">
                <div className="row g-4">
                    {/* Sidebar Navigation */}
                    <div className="col-lg-3">
                        <div className="card border-0 shadow-sm rounded-custom overflow-hidden sticky-top" style={{ top: '100px' }}>
                            <div className="list-group list-group-flush">
                                <button
                                    className={`list-group-item list-group-item-action p-4 d-flex align-items-center gap-3 border-0 ${activeTab === 'terms' ? 'bg-primary-subtle text-primary fw-bold' : 'text-secondary hover-bg-light'}`}
                                    onClick={() => setActiveTab('terms')}
                                >
                                    <FaFileContract size={20} />
                                    Terms of Service
                                </button>
                                <button
                                    className={`list-group-item list-group-item-action p-4 d-flex align-items-center gap-3 border-0 ${activeTab === 'privacy' ? 'bg-primary-subtle text-primary fw-bold' : 'text-secondary hover-bg-light'}`}
                                    onClick={() => setActiveTab('privacy')}
                                >
                                    <FaUserShield size={20} />
                                    Privacy Policy
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="col-lg-9">
                        <AnimatePresence mode="wait">
                            {activeTab === 'terms' ? (
                                <motion.div
                                    key="terms"
                                    initial="hidden" animate="visible" exit={{ opacity: 0 }} variants={fadeIn}
                                    className="card border-0 shadow-sm rounded-custom p-5"
                                >
                                    <div className="d-flex align-items-center gap-3 mb-5 border-bottom pb-4">
                                        <div className="bg-blue-100 p-3 rounded-circle text-primary">
                                            <FaFileContract size={32} />
                                        </div>
                                        <div>
                                            <h2 className="fw-bold mb-1">Terms of Service</h2>
                                            <p className="text-muted mb-0">Please read these terms carefully before using Civic Sense.</p>
                                        </div>
                                    </div>

                                    <div className="typography">
                                        <h5 className="fw-bold text-dark mt-4 mb-3">1. Acceptance of Terms</h5>
                                        <p className="text-secondary">By accessing and using Civic Sense ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement.</p>

                                        <h5 className="fw-bold text-dark mt-4 mb-3">2. User Conduct</h5>
                                        <p className="text-secondary">Users agree to use the platform only for lawful purposes. You are prohibited from posting content that is:</p>
                                        <ul className="text-secondary mb-4">
                                            <li>False, misleading, or deceptive.</li>
                                            <li>Defamatory, obscene, or offensive.</li>
                                            <li>Violating intellectual property rights.</li>
                                            <li>Generated by AI purely for spamming purposes (Fake content is actively monitored).</li>
                                        </ul>

                                        <h5 className="fw-bold text-dark mt-4 mb-3">3. Account Responsibility</h5>
                                        <p className="text-secondary">You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>

                                        <h5 className="fw-bold text-dark mt-4 mb-3">4. Content Ownership</h5>
                                        <p className="text-secondary">By submitting complaints, images, or videos, you grant Civic Sense a license to use, display, and share this content with relevant municipal authorities for the purpose of issue resolution.</p>

                                        <h5 className="fw-bold text-dark mt-4 mb-3">5. Termination</h5>
                                        <p className="text-secondary">We reserve the right to terminate your access to the platform without notice if you violate these Terms of Service.</p>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="privacy"
                                    initial="hidden" animate="visible" exit={{ opacity: 0 }} variants={fadeIn}
                                    className="card border-0 shadow-sm rounded-custom p-5"
                                >
                                    <div className="d-flex align-items-center gap-3 mb-5 border-bottom pb-4">
                                        <div className="bg-green-100 p-3 rounded-circle text-success">
                                            <FaUserShield size={32} />
                                        </div>
                                        <div>
                                            <h2 className="fw-bold mb-1">Privacy Policy</h2>
                                            <p className="text-muted mb-0">How we collect, use, and protect your data.</p>
                                        </div>
                                    </div>

                                    <div className="typography">
                                        <h5 className="fw-bold text-dark mt-4 mb-3">1. Information Collection</h5>
                                        <p className="text-secondary">We collect information you provide directly to us, such as when you create an account, report an issue, or communicate with us. This includes:</p>
                                        <ul className="text-secondary mb-4">
                                            <li>Name, email address, and contact details.</li>
                                            <li>Location data associated with reported issues.</li>
                                            <li>Uploaded media (photos/videos).</li>
                                        </ul>

                                        <h5 className="fw-bold text-dark mt-4 mb-3">2. Use of Information</h5>
                                        <p className="text-secondary">We use the information to:</p>
                                        <ul className="text-secondary mb-4">
                                            <li>Facilitate the reporting and resolution of civic issues.</li>
                                            <li>Coordinate with municipal authorities.</li>
                                            <li>Identify and prevent fraud or spam.</li>
                                        </ul>

                                        <h5 className="fw-bold text-dark mt-4 mb-3">3. Data Security</h5>
                                        <p className="text-secondary">We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.</p>

                                        <h5 className="fw-bold text-dark mt-4 mb-3">4. Third-Party Sharing</h5>
                                        <p className="text-secondary">We do not sell your personal data. We verify and share complaint details with relevant government departments solely for the purpose of resolving the issue.</p>

                                        <h5 className="fw-bold text-dark mt-4 mb-3">5. Cookies</h5>
                                        <p className="text-secondary">We use cookies to maintain your session and improve your experience. You can control cookie settings through your browser.</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Documentation;
