import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import civicCleaning from '../assets/realistic_cleaning.png';
import civicRecycling from '../assets/realistic_recycling.png';
import civicTraffic from '../assets/realistic_traffic.png';
import civicCommunity from '../assets/realistic_community.png';
import civicLogo from '../assets/civic_logo_dark.png';
import { notify } from '../utils/notify';
import api from '../api/axios';
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaArrowRight, FaShieldAlt } from 'react-icons/fa';

const SLIDES = [
    { src: civicCleaning, caption: 'Community Clean-Up', description: 'Together we keep our city clean and vibrant' },
    { src: civicRecycling, caption: 'Waste Segregation', description: 'Recycle today for a greener tomorrow' },
    { src: civicTraffic, caption: 'Follow Traffic Rules', description: 'Safe streets create happy communities' },
    { src: civicCommunity, caption: 'Help Each Other', description: 'Compassion is what builds strong communities' },
];

/* ── Shared input component ── */
const Field = ({ icon: Icon, label, id, type, placeholder, value, onChange, extra, autoComplete }) => {
    const [show, setShow] = useState(false);
    const isPw = type === 'password';
    return (
        <div className="mb-4">
            <label htmlFor={id} style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                {label}
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                {Icon && <Icon size={14} style={{ position: 'absolute', left: '14px', color: '#94a3b8', pointerEvents: 'none' }} />}
                <input
                    id={id}
                    type={isPw ? (show ? 'text' : 'password') : type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    style={{
                        width: '100%',
                        background: '#f8fafc',
                        border: '1.5px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: `13px ${isPw ? '44px' : '14px'} 13px ${Icon ? '42px' : '14px'}`,
                        color: '#0f172a',
                        fontSize: '0.9rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                />
                {isPw && (
                    <button type="button" onClick={() => setShow(s => !s)}
                        style={{ position: 'absolute', right: '14px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                        {show ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                )}
            </div>
            {extra}
        </div>
    );
};

/* ── OTP Screen ── */
const OtpScreen = ({ email, onVerify, onResend, onBack, isVerifying, isResending }) => {
    const [otp, setOtp] = useState('');
    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: '#eef2ff', border: '1px solid #a5b4fc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <FaShieldAlt size={24} style={{ color: '#6366f1' }} />
                </div>
                <h2 style={{ color: '#0f172a', fontWeight: 700, fontSize: '1.5rem', marginBottom: '10px' }}>Check your email</h2>
                <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.6 }}>
                    We've sent a 6-digit OTP to<br /><strong style={{ color: '#334155' }}>{email}</strong>
                </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
                <input
                    type="text" maxLength="6" value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    style={{
                        width: '100%', textAlign: 'center', letterSpacing: '0.5rem',
                        fontSize: '1.6rem', fontWeight: 700,
                        background: '#f8fafc', border: '1.5px solid #e2e8f0',
                        borderRadius: '14px', padding: '16px', color: '#0f172a', outline: 'none',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                />
            </div>

            <motion.button
                type="button"
                onClick={() => onVerify(otp)}
                disabled={otp.length !== 6 || isVerifying}
                whileTap={otp.length === 6 ? { scale: 0.98 } : {}}
                style={{
                    width: '100%', padding: '14px', borderRadius: '12px', border: 'none', cursor: otp.length === 6 ? 'pointer' : 'not-allowed',
                    background: otp.length === 6 ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : '#f1f5f9',
                    color: otp.length === 6 ? 'white' : '#94a3b8',
                    fontWeight: 700, fontSize: '0.9rem',
                    boxShadow: otp.length === 6 ? '0 8px 24px rgba(99,102,241,0.3)' : 'none',
                    marginBottom: '16px', transition: 'all 0.2s',
                }}
            >
                {isVerifying ? <><span className="spinner-border spinner-border-sm me-2" />Verifying…</> : 'Verify Email'}
            </motion.button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" onClick={onBack}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.82rem', padding: 0 }}>
                    ← Back to login
                </button>
                <button type="button" onClick={onResend} disabled={isResending}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontWeight: 600, fontSize: '0.82rem', padding: 0 }}>
                    {isResending ? 'Resending…' : 'Resend OTP'}
                </button>
            </div>
        </motion.div>
    );
};

const Login = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [unverifiedEmail, setUnverifiedEmail] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [loginDetails, setLoginDetails] = useState({ userEmail: '', userPassword: '' });

    useEffect(() => {
        const t = setInterval(() => setCurrentSlide(p => (p + 1) % SLIDES.length), 4000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => { api.get('/user/csrf-token'); }, []);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const isFormValid = loginDetails.userEmail && loginDetails.userPassword && emailRegex.test(loginDetails.userEmail);

    const getCsrfToken = () =>
        document.cookie.split('; ').find(r => r.startsWith('csrfToken='))?.split('=')[1];

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;
        setIsLoading(true);
        try {
            const res = await api.post('user/login', loginDetails, { headers: { 'x-csrf-token': getCsrfToken() } });
            if (res.status === 200) {
                const { user, accessToken } = res.data;
                localStorage.setItem('user', JSON.stringify(user));
                if (accessToken) localStorage.setItem('accessToken', accessToken);
                notify('success', 'Login successful!');
                setTimeout(() => navigate(user.role === 'Authority' ? '/authority' : '/dashboard'), 800);
            }
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.unverified) {
                setUnverifiedEmail(loginDetails.userEmail);
                setShowOtp(true);
                notify('warning', err.response.data.message);
            } else {
                notify('error', err.response?.data?.message || 'Something went wrong');
            }
        } finally { setIsLoading(false); }
    };

    const handleVerifyOtp = async (otp) => {
        setIsVerifying(true);
        try {
            await api.post('/user/verify-email', { userEmail: unverifiedEmail, otp });
            notify('success', 'Email verified! Please log in.');
            setShowOtp(false);
        } catch (err) {
            notify('error', err.response?.data?.message || 'Invalid OTP');
        } finally { setIsVerifying(false); }
    };

    const handleResendOtp = async () => {
        setIsResending(true);
        try {
            await api.post('/user/resend-otp', { userEmail: unverifiedEmail });
            notify('success', 'New OTP sent!');
        } catch (err) {
            notify('error', err.response?.data?.message || 'Failed to resend');
        } finally { setIsResending(false); }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'white', fontFamily: "'Outfit', sans-serif" }}>

            {/* ── Left panel: image carousel ── */}
            <div className="d-none d-lg-block" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <AnimatePresence mode="wait">
                    <motion.img key={currentSlide}
                        src={SLIDES[currentSlide].src}
                        initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.04 }}
                        transition={{ duration: 1.2 }}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </AnimatePresence>
                {/* Gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.85) 100%)' }} />

                {/* Top logo */}
                <div style={{ position: 'absolute', top: '32px', left: '36px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={civicLogo} alt="Civic Connect" width="28" style={{ opacity: 0.9 }} />
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.5px' }}>Civic Connect</span>
                </div>

                {/* Bottom caption */}
                <div style={{ position: 'absolute', bottom: '48px', left: '36px', right: '36px' }}>
                    <AnimatePresence mode="wait">
                        <motion.div key={currentSlide + '-txt'}
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.5, delay: 0.2 }}>
                            <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1.8rem', marginBottom: '8px' }}>{SLIDES[currentSlide].caption}</h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', marginBottom: '20px' }}>{SLIDES[currentSlide].description}</p>
                        </motion.div>
                    </AnimatePresence>
                    {/* Dots */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {SLIDES.map((_, i) => (
                            <button key={i} onClick={() => setCurrentSlide(i)}
                                style={{ border: 'none', borderRadius: '4px', cursor: 'pointer', padding: 0, height: '4px', width: i === currentSlide ? '28px' : '8px', background: i === currentSlide ? 'white' : 'rgba(255,255,255,0.35)', transition: 'all 0.3s' }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right panel: form ── */}
            <div style={{ flex: '0 0 480px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 48px', overflowY: 'auto', maxWidth: '100%', background: 'white' }}>
                {/* Mobile logo */}
                <div className="d-lg-none mb-5 d-flex align-items-center gap-2">
                    <img src={civicLogo} alt="Civic Connect" width="24" />
                    <span style={{ color: '#0f172a', fontWeight: 700, fontSize: '0.95rem' }}>Civic Connect</span>
                </div>

                <AnimatePresence mode="wait">
                    {!showOtp ? (
                        <motion.div key="login" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
                            <div style={{ marginBottom: '36px' }}>
                                <h1 style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.9rem', marginBottom: '8px' }}>Welcome back</h1>
                                <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Sign in to your Civic Connect account</p>
                            </div>

                            <form onSubmit={handleLogin}>
                                <Field icon={FaEnvelope} label="Email address" id="email" type="email" placeholder="name@example.com"
                                    value={loginDetails.userEmail} autoComplete="username"
                                    onChange={e => setLoginDetails({ ...loginDetails, userEmail: e.target.value })} />

                                <Field icon={FaLock} label="Password" id="password" type="password" placeholder="••••••••"
                                    value={loginDetails.userPassword} autoComplete="current-password"
                                    onChange={e => setLoginDetails({ ...loginDetails, userPassword: e.target.value })}
                                    extra={
                                        <div style={{ textAlign: 'right', marginTop: '6px' }}>
                                            <a href="/forgot-password" style={{ color: '#6366f1', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>Forgot password?</a>
                                        </div>
                                    }
                                />

                                <motion.button type="submit" disabled={!isFormValid || isLoading}
                                    whileTap={isFormValid ? { scale: 0.98 } : {}}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                                        background: isFormValid ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : '#f1f5f9',
                                        color: isFormValid ? 'white' : '#94a3b8',
                                        fontWeight: 700, fontSize: '0.9rem', cursor: isFormValid ? 'pointer' : 'not-allowed',
                                        boxShadow: isFormValid ? '0 8px 24px rgba(99,102,241,0.3)' : 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        marginBottom: '24px', transition: 'all 0.2s',
                                    }}>
                                    {isLoading ? <><span className="spinner-border spinner-border-sm" />Signing in…</> : <>Sign In <FaArrowRight size={13} /></>}
                                </motion.button>
                            </form>

                            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                                Don't have an account?{' '}
                                <a href="/register" style={{ color: '#6366f1', fontWeight: 700, textDecoration: 'none' }}>Create one</a>
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '20px' }}>
                                <a href="/documentation" style={{ color: '#cbd5e1', fontSize: '0.75rem', textDecoration: 'none' }}>Terms</a>
                                <span style={{ color: '#e2e8f0' }}>·</span>
                                <a href="/documentation" style={{ color: '#cbd5e1', fontSize: '0.75rem', textDecoration: 'none' }}>Privacy Policy</a>
                            </div>
                        </motion.div>
                    ) : (
                        <OtpScreen key="otp"
                            email={unverifiedEmail}
                            onVerify={handleVerifyOtp}
                            onResend={handleResendOtp}
                            onBack={() => setShowOtp(false)}
                            isVerifying={isVerifying}
                            isResending={isResending}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Login;