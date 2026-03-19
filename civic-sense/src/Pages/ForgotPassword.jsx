import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { notify } from '../utils/notify';
import api from '../api/axios';
import { FaEnvelope, FaArrowRight, FaArrowLeft, FaCheckCircle, FaTerminal } from 'react-icons/fa';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const isValid = emailRegex.test(email);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isValid) { notify('error', 'INVALID NODE ADDRESS DETECTED'); return; }
        setIsLoading(true);
        try {
            await api.post('/user/forgot-password', { userEmail: email });
            notify('success', 'OVERRIDE LINK TRANSMITTED');
            setSent(true);
        } catch (err) {
            notify('error', err.response?.data?.message || 'TRANSMISSION FAILURE');
        } finally { setIsLoading(false); }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 position-relative" style={{ backgroundColor: 'var(--bg-body)', overflow: 'hidden' }}>

            {/* Cyber Grid Background */}
            <div className="position-absolute w-100 h-100" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.5 }} />
            
            {/* Neon Glow Spots */}
            <div className="position-absolute rounded-circle" style={{ width: '400px', height: '400px', background: 'var(--primary-color)', filter: 'blur(100px)', opacity: 0.15, top: '-10%', left: '-10%' }} />
            <div className="position-absolute rounded-circle" style={{ width: '300px', height: '300px', background: 'var(--secondary-color)', filter: 'blur(100px)', opacity: 0.1, bottom: '-5%', right: '-5%' }} />

            <motion.div
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
                className="glass-card position-relative z-index-1 p-5 shadow-custom-lg mx-auto" style={{ width: '100%', maxWidth: '440px' }}
            >
                {/* Logo */}
                <div className="d-flex align-items-center gap-2 mb-4 text-neon-purple justify-content-center">
                    <FaTerminal size={20} />
                    <span className="tech-font fw-bold" style={{ fontSize: '0.9rem', letterSpacing: '0.15em' }}>CIVIC SENSE</span>
                </div>

                <AnimatePresence mode="wait">
                    {!sent ? (
                        <motion.div key="form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.2 }}>
                            {/* Header */}
                            <div className="text-center mb-4">
                                <div className="d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(170,0,255,0.1)', border: '1px solid var(--primary-color)', boxShadow: '0 0 20px rgba(170,0,255,0.3)' }}>
                                    <FaEnvelope size={20} className="text-neon-purple" />
                                </div>
                                <h1 className="tech-font text-white fw-bold mb-2" style={{ fontSize: '1.4rem', letterSpacing: '0.1em' }}>KEY RECOVERY</h1>
                                <p className="tech-font text-muted" style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                                    INPUT REGISTERED NETWORK ADDRESS TO TRANSMIT OVERRIDE LINK
                                </p>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <label className="tech-font d-block text-muted mb-2 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.15em' }}>
                                    NETWORK ADDRESS
                                </label>
                                <div className="position-relative mb-4">
                                    <FaEnvelope size={13} className="position-absolute" style={{ left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color)', pointerEvents: 'none' }} />
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                        placeholder="alias@network.gov"
                                        className="form-control tech-font w-100 bg-transparent text-white"
                                        style={{
                                            padding: '14px 16px 14px 44px',
                                            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)',
                                            fontSize: '0.9rem', outline: 'none', transition: 'all 0.3s'
                                        }}
                                        onFocus={e => {
                                            e.currentTarget.style.borderColor = 'var(--primary-color)';
                                            e.currentTarget.style.boxShadow = '0 0 10px rgba(170,0,255,0.15)';
                                            e.currentTarget.style.background = 'rgba(170,0,255,0.03)';
                                        }}
                                        onBlur={e => {
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                            e.currentTarget.style.boxShadow = 'none';
                                            e.currentTarget.style.background = 'transparent';
                                        }}
                                    />
                                </div>

                                <motion.button type="submit" disabled={!isValid || isLoading}
                                    whileTap={isValid ? { scale: 0.98 } : {}}
                                    className={`btn w-100 py-3 rounded-custom tech-font fw-bold d-flex align-items-center justify-content-center gap-2 mb-4 ${isValid ? 'btn-primary-custom' : ''}`}
                                    style={{
                                        background: isValid ? '' : 'rgba(255,255,255,0.05)', color: isValid ? 'white' : 'rgba(255,255,255,0.2)',
                                        border: isValid ? '' : '1px solid rgba(255,255,255,0.1)', cursor: isValid ? 'pointer' : 'not-allowed',
                                        letterSpacing: '0.15em'
                                    }}>
                                    {isLoading ? <><span className="spinner-border spinner-border-sm" /> TRANSMITTING...</> : <>TRANSMIT OVERRIDE <FaArrowRight size={12} /></>}
                                </motion.button>
                            </form>

                            <button type="button" onClick={() => navigate('/')}
                                className="btn btn-link text-muted text-decoration-none d-flex align-items-center gap-2 mx-auto tech-font hover-scale"
                                style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>
                                <FaArrowLeft size={11} /> ABORT RECOVERY
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div key="sent" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="text-center">
                            <div className="d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(163,230,53,0.1)', border: '1px solid var(--secondary-color)', boxShadow: '0 0 20px rgba(163,230,53,0.3)' }}>
                                <FaCheckCircle size={28} className="text-neon-green" />
                            </div>
                            <h2 className="tech-font text-white fw-bold mb-2" style={{ fontSize: '1.4rem', letterSpacing: '0.1em' }}>TRANSMISSION SUCCESS</h2>
                            <p className="tech-font text-muted mb-4" style={{ fontSize: '0.85rem', lineHeight: 1.6, letterSpacing: '0.05em' }}>
                                OVERRIDE LINK DETECTED AT<br /><strong className="text-neon-green d-block mt-1">{email.toUpperCase()}</strong><br />
                                LINK DEGRADES IN 1 HOUR.
                            </p>
                            <button onClick={() => navigate('/')} className="btn w-100 py-3 rounded-custom tech-font fw-bold"
                                style={{
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white', letterSpacing: '0.15em', cursor: 'pointer', transition: 'all 0.3s'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            >
                                RETURN TO LOGIN
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
