import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { notify } from '../utils/notify';
import api from '../api/axios';
import civicLogo from '../assets/civic_sense_symbolic_logo.png';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            notify("error", "Please enter your email address");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(email)) {
            notify("error", "Invalid email address");
            return;
        }

        setIsLoading(true);

        try {
            const response = await api.post('/user/forgot-password', { userEmail: email });
            if (response.status === 200) {
                notify("success", "Password reset link sent to your email!");
                // Clear field or redirect after delay?
                // Let's keep them here in case they need to resend.
            } else {
                notify("error", response.data.message || "Failed to send reset link");
            }
        } catch (error) {
            notify("error", error.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container-fluid min-vh-100 d-flex flex-column align-items-center justify-content-center bg-light position-relative overflow-hidden">
            {/* Background Decoration */}
            <div className="position-absolute top-0 start-0 w-100 h-100 opacity-10"
                style={{ background: 'radial-gradient(circle at 10% 20%, rgb(37, 99, 235) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgb(236, 72, 153) 0%, transparent 40%)' }}>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="card shadow-lg border-0 rounded-custom-xl p-4 p-md-5 position-relative z-1"
                style={{ maxWidth: '500px', width: '100%', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}
            >
                <div className="text-center mb-4">
                    {/* <img src={civicLogo} alt="Civic Sense Logo" height="80" className="mb-3" /> */}
                    <h2 className="fw-bold text-dark">Forgot Password?</h2>
                    <p className="text-muted">Enter your registered email address and we'll send you a link to reset your password.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="emailInput" className="form-label fw-semibold text-secondary small text-uppercase ls-1">Email Address</label>
                        <input
                            type="email"
                            className="form-control form-control-lg bg-surface border-light shadow-sm"
                            id="emailInput"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-100 btn-lg mb-3 shadow-sm hover-scale"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span><span className="spinner-border spinner-border-sm me-2"></span> Sending...</span>
                        ) : 'Send Reset Link'}
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="btn btn-link text-decoration-none text-muted fw-semibold"
                        >
                            <span className="me-2">←</span> Back to Login
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
