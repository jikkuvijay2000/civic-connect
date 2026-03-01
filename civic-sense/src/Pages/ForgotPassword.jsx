import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { notify } from '../utils/notify';
import api from '../api/axios';
import civicLogo from '../assets/civic_logo_dark.png';
import { FaEnvelope, FaArrowRight, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const isValid = emailRegex.test(email);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isValid) { notify('error', 'Enter a valid email address'); return; }
        setIsLoading(true);
        try {
            await api.post('/user/forgot-password', { userEmail: email });
            notify('success', 'Password reset link sent!');
            setSent(true);
        } catch (err) {
            notify('error', err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally { setIsLoading(false); }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Outfit', sans-serif", position: 'relative', overflow: 'hidden' }}>

            {/* Background blobs */}
            <div style={{ position: 'absolute', top: '-120px', left: '-120px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-80px', right: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <motion.div
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
                style={{ width: '100%', maxWidth: '420px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '44px 40px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
            >
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '36px' }}>
                    <img src={civicLogo} alt="Civic Connect" width="22" />
                    <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.04em' }}>CIVIC CONNECT</span>
                </div>

                <AnimatePresence mode="wait">
                    {!sent ? (
                        <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                            {/* Header */}
                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#eef2ff', border: '1px solid #a5b4fc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                    <FaEnvelope size={20} style={{ color: '#6366f1' }} />
                                </div>
                                <h1 style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.6rem', marginBottom: '8px' }}>Forgot password?</h1>
                                <p style={{ color: '#64748b', fontSize: '0.87rem', lineHeight: 1.6 }}>
                                    No worries. Enter your registered email and we'll send you a reset link.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    Email address
                                </label>
                                <div style={{ position: 'relative', marginBottom: '24px' }}>
                                    <FaEnvelope size={13} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        style={{
                                            width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0',
                                            borderRadius: '12px', padding: '13px 14px 13px 42px', color: '#0f172a', fontSize: '0.9rem', outline: 'none',
                                        }}
                                        onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                                        onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                                    />
                                </div>

                                <button type="submit" disabled={!isValid || isLoading}
                                    style={{
                                        width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
                                        background: isValid ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : '#f1f5f9',
                                        color: isValid ? 'white' : '#94a3b8',
                                        fontWeight: 700, fontSize: '0.9rem', cursor: isValid ? 'pointer' : 'not-allowed',
                                        boxShadow: isValid ? '0 8px 24px rgba(99,102,241,0.3)' : 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        marginBottom: '20px', transition: 'all 0.2s',
                                    }}>
                                    {isLoading ? <><span className="spinner-border spinner-border-sm" /> Sending…</> : <>Send reset link <FaArrowRight size={13} /></>}
                                </button>
                            </form>

                            <button type="button" onClick={() => navigate('/')}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.82rem', padding: 0, margin: '0 auto' }}>
                                <FaArrowLeft size={11} /> Back to login
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div key="sent" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} style={{ textAlign: 'center' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', border: '1px solid #6ee7b7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <FaCheckCircle size={28} style={{ color: '#10b981' }} />
                            </div>
                            <h2 style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.4rem', marginBottom: '10px' }}>Email sent!</h2>
                            <p style={{ color: '#64748b', fontSize: '0.87rem', marginBottom: '28px', lineHeight: 1.6 }}>
                                Check your inbox at <strong style={{ color: '#334155' }}>{email}</strong>.<br />
                                The link expires in 1 hour.
                            </p>
                            <button onClick={() => navigate('/')}
                                style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#334155', fontWeight: 600, fontSize: '0.88rem', padding: '11px 28px', cursor: 'pointer' }}>
                                Back to Login
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
