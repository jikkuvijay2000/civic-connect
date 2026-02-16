import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { notify } from '../utils/notify';
import api from '../api/axios';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        userPassword: '',
        userConfirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.userPassword !== formData.userConfirmPassword) {
            notify("error", "Passwords do not match");
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
        if (!passwordRegex.test(formData.userPassword)) {
            notify("error", "Password must contain at least one uppercase, lowercase, number and special char (@$!%*?&#)");
            return;
        }

        setIsLoading(true);

        try {
            const response = await api.put(`/user/reset-password/${token}`, {
                userPassword: formData.userPassword,
                userConfirmPassword: formData.userConfirmPassword
            });

            if (response.status === 200) {
                notify("success", "Password reset successfully! Redirecting to login...");
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            } else {
                notify("error", response.data.message || "Failed to reset password");
            }
        } catch (error) {
            notify("error", error.response?.data?.message || "Invalid or expired token");
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="card shadow-lg border-0 rounded-custom-xl p-4 p-md-5 position-relative z-1"
                style={{ maxWidth: '500px', width: '100%', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}
            >
                <div className="text-center mb-4">
                    <h2 className="fw-bold text-dark">Reset Password</h2>
                    <p className="text-muted">Enter your new password below.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="form-label fw-semibold text-secondary small text-uppercase ls-1">New Password</label>
                        <input
                            type="password"
                            name="userPassword"
                            className="form-control form-control-lg bg-surface border-light shadow-sm"
                            placeholder="••••••••"
                            value={formData.userPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="form-label fw-semibold text-secondary small text-uppercase ls-1">Confirm Password</label>
                        <input
                            type="password"
                            name="userConfirmPassword"
                            className="form-control form-control-lg bg-surface border-light shadow-sm"
                            placeholder="••••••••"
                            value={formData.userConfirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-100 btn-lg mb-3 shadow-sm hover-scale"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span><span className="spinner-border spinner-border-sm me-2"></span> Updating...</span>
                        ) : 'Reset Password'}
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="btn btn-link text-decoration-none text-muted fw-semibold"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
