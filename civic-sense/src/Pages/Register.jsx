import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import civicCleaning from '../assets/realistic_cleaning.png';
import civicRecycling from '../assets/realistic_recycling.png';
import civicTraffic from '../assets/realistic_traffic.png';
import civicCommunity from '../assets/realistic_community.png';
import civicLogo from '../assets/civic_logo_dark.png';
import { notify } from '../utils/notify';
import axios from 'axios';
import { BASE_URL } from '../services/baseUrl';
import {
    FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock,
    FaMapMarkerAlt, FaArrowRight, FaShieldAlt, FaCheckCircle
} from 'react-icons/fa';

const SLIDES = [
    { src: civicCleaning, caption: 'Community Clean-Up', description: 'Together we keep our city clean and vibrant' },
    { src: civicRecycling, caption: 'Waste Segregation', description: 'Recycle today for a greener tomorrow' },
    { src: civicTraffic, caption: 'Follow Traffic Rules', description: 'Safe streets create happy communities' },
    { src: civicCommunity, caption: 'Help Each Other', description: 'Compassion is what builds strong communities' },
];

/* Shared input */
const Field = ({ icon: Icon, label, id, type = 'text', placeholder, value, onChange, onBlur, error, autoComplete, rows }) => {
    const [show, setShow] = useState(false);
    const isPw = type === 'password';
    const inputStyle = {
        width: '100%', background: '#f8fafc', border: `1.5px solid ${error ? 'rgba(239,68,68,0.6)' : '#e2e8f0'}`,
        borderRadius: '12px', padding: `12px ${isPw ? '44px' : '14px'} 12px ${Icon ? '42px' : '14px'}`,
        color: '#0f172a', fontSize: '0.88rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit',
    };
    return (
        <div style={{ marginBottom: '16px' }}>
            <label htmlFor={id} style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '7px' }}>{label}</label>
            <div style={{ position: 'relative' }}>
                {Icon && <Icon size={13} style={{ position: 'absolute', left: '14px', top: rows ? '14px' : '50%', transform: rows ? 'none' : 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />}
                {rows
                    ? <textarea id={id} rows={rows} placeholder={placeholder} value={value} onChange={onChange} onBlur={onBlur} style={{ ...inputStyle, padding: `12px ${Icon ? '42px' : '14px'}` }} onFocus={e => e.currentTarget.style.borderColor = '#6366f1'} />
                    : <input id={id} type={isPw ? (show ? 'text' : 'password') : type} placeholder={placeholder} value={value} onChange={onChange} onBlur={onBlur} autoComplete={autoComplete} style={inputStyle}
                        onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                        onBlur2={e => e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.6)' : '#e2e8f0'}
                    />
                }
                {isPw && (
                    <button type="button" onClick={() => setShow(s => !s)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                        {show ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                    </button>
                )}
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: '0.72rem', marginTop: '5px', marginBottom: 0 }}>{error}</p>}
        </div>
    );
};

/* Password rule pills */
const PwRules = ({ pw }) => {
    const rules = [
        { ok: pw.length >= 8, text: '8+ chars' },
        { ok: /[A-Z]/.test(pw), text: 'Uppercase' },
        { ok: /[0-9]/.test(pw), text: 'Number' },
        { ok: /[@$!%*?&#]/.test(pw), text: 'Special' },
    ];
    if (!pw) return null;
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
            {rules.map((r, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 600, color: r.ok ? '#6ee7b7' : 'rgba(255,255,255,0.3)', background: r.ok ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '2px 8px', border: `1px solid ${r.ok ? 'rgba(16,185,129,0.3)' : 'transparent'}` }}>
                    <FaCheckCircle size={8} /> {r.text}
                </span>
            ))}
        </div>
    );
};

/* OTP screen */
const OtpScreen = ({ email, onVerify, isVerifying }) => {
    const [otp, setOtp] = useState('');
    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: '#eef2ff', border: '1px solid #a5b4fc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                    <FaShieldAlt size={24} style={{ color: '#6366f1' }} />
                </div>
                <h2 style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.5rem', marginBottom: '8px' }}>Verify your email</h2>
                <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6 }}>
                    We've sent a 6-digit code to<br /><strong style={{ color: '#334155' }}>{email}</strong>
                </p>
            </div>
            <input type="text" maxLength="6" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000" style={{
                    width: '100%', textAlign: 'center', letterSpacing: '0.6rem', fontSize: '1.6rem', fontWeight: 700,
                    background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '14px',
                    padding: '16px', color: '#0f172a', outline: 'none', marginBottom: '20px',
                }}
                onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
            <button type="button" onClick={() => onVerify(otp)} disabled={otp.length !== 6 || isVerifying}
                style={{
                    width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                    background: otp.length === 6 ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : '#f1f5f9',
                    color: otp.length === 6 ? 'white' : '#94a3b8',
                    fontWeight: 700, fontSize: '0.9rem', cursor: otp.length === 6 ? 'pointer' : 'not-allowed',
                    boxShadow: otp.length === 6 ? '0 8px 24px rgba(99,102,241,0.3)' : 'none',
                }}>
                {isVerifying ? <><span className="spinner-border spinner-border-sm me-2" />Verifying…</> : 'Verify & Continue'}
            </button>
        </motion.div>
    );
};

const Register = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [touched, setTouched] = useState({});
    const [userDetails, setUserDetails] = useState({
        userName: '', userEmail: '', userAddress: '', userPassword: '', userConfirmPassword: '', termsChecked: false,
    });

    useEffect(() => {
        const t = setInterval(() => setCurrentSlide(p => (p + 1) % SLIDES.length), 4000);
        return () => clearInterval(t);
    }, []);

    const touch = field => setTouched(p => ({ ...p, [field]: true }));
    const set = (field, val) => setUserDetails(p => ({ ...p, [field]: val }));

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

    const isEmailValid = emailRegex.test(userDetails.userEmail);
    const isPasswordValid = passwordRegex.test(userDetails.userPassword);
    const doPasswordsMatch = userDetails.userPassword === userDetails.userConfirmPassword;
    const isFormValid = userDetails.userName && userDetails.userAddress && isEmailValid && isPasswordValid && doPasswordsMatch && userDetails.termsChecked;

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!isFormValid) { notify('error', 'Please fix the errors in the form.'); return; }
        setIsLoading(true);
        try {
            const res = await axios.post(`${BASE_URL}/user/register`, userDetails);
            if (res.status === 200) { notify('success', 'Account created! Check your email for the OTP.'); setShowOtp(true); }
        } catch (err) { notify('error', err.response?.data?.message || 'Something went wrong'); }
        finally { setIsLoading(false); }
    };

    const handleVerifyOtp = async (otp) => {
        setIsVerifying(true);
        try {
            await axios.post(`${BASE_URL}/user/verify-email`, { userEmail: userDetails.userEmail, otp });
            notify('success', 'Email verified! Redirecting to login…');
            setTimeout(() => navigate('/'), 1500);
        } catch (err) { notify('error', err.response?.data?.message || 'Invalid OTP'); }
        finally { setIsVerifying(false); }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'white', fontFamily: "'Inter', sans-serif" }}>

            {/* ── Left carousel ── */}
            <div className="d-none d-lg-block" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <AnimatePresence mode="wait">
                    <motion.img key={currentSlide} src={SLIDES[currentSlide].src}
                        initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.04 }}
                        transition={{ duration: 1.2 }} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                </AnimatePresence>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(15,23,42,0.3) 0%, rgba(15,23,42,0.85) 100%)' }} />
                <div style={{ position: 'absolute', top: '32px', left: '36px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={civicLogo} alt="" width="28" style={{ opacity: 0.9 }} />
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>Civic Connect</span>
                </div>
                <div style={{ position: 'absolute', bottom: '48px', left: '36px', right: '36px' }}>
                    <AnimatePresence mode="wait">
                        <motion.div key={currentSlide + 't'} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.5, delay: 0.2 }}>
                            <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1.8rem', marginBottom: '8px' }}>{SLIDES[currentSlide].caption}</h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', marginBottom: '20px' }}>{SLIDES[currentSlide].description}</p>
                        </motion.div>
                    </AnimatePresence>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {SLIDES.map((_, i) => (
                            <button key={i} onClick={() => setCurrentSlide(i)}
                                style={{ border: 'none', borderRadius: '4px', cursor: 'pointer', padding: 0, height: '4px', width: i === currentSlide ? '28px' : '8px', background: i === currentSlide ? 'white' : 'rgba(255,255,255,0.35)', transition: 'all 0.3s' }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right form ── */}
            <div style={{ flex: '0 0 500px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '36px 44px', overflowY: 'auto', maxWidth: '100%', background: 'white' }}>
                <AnimatePresence mode="wait">
                    {!showOtp ? (
                        <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
                            <div style={{ marginBottom: '28px' }}>
                                <h1 style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.8rem', marginBottom: '6px' }}>Create account</h1>
                                <p style={{ color: '#94a3b8', fontSize: '0.87rem' }}>Join Civic Connect and make a difference</p>
                            </div>

                            <form onSubmit={handleRegister}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <Field icon={FaUser} label="Full Name" id="name" placeholder="John Doe"
                                            value={userDetails.userName} onChange={e => set('userName', e.target.value)} />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <Field icon={FaEnvelope} label="Email address" id="email" type="email" placeholder="name@example.com"
                                            value={userDetails.userEmail} autoComplete="username"
                                            onChange={e => set('userEmail', e.target.value)}
                                            onBlur={() => touch('userEmail')}
                                            error={touched.userEmail && !isEmailValid ? 'Enter a valid email address' : null} />
                                    </div>
                                    <div style={{ gridColumn: '1 / -1' }}>
                                        <Field icon={FaMapMarkerAlt} label="Address" id="address" rows={2} placeholder="Street, City, State, ZIP"
                                            value={userDetails.userAddress} onChange={e => set('userAddress', e.target.value)} />
                                    </div>
                                    <div>
                                        <Field icon={FaLock} label="Password" id="password" type="password" placeholder="••••••••"
                                            value={userDetails.userPassword} autoComplete="new-password"
                                            onChange={e => set('userPassword', e.target.value)}
                                            onBlur={() => touch('userPassword')}
                                            error={touched.userPassword && !isPasswordValid ? 'Password too weak' : null} />
                                        <PwRules pw={userDetails.userPassword} />
                                    </div>
                                    <div>
                                        <Field icon={FaLock} label="Confirm password" id="confirm" type="password" placeholder="••••••••"
                                            value={userDetails.userConfirmPassword} autoComplete="new-password"
                                            onChange={e => set('userConfirmPassword', e.target.value)}
                                            onBlur={() => touch('userConfirmPassword')}
                                            error={touched.userConfirmPassword && !doPasswordsMatch ? "Passwords don't match" : null} />
                                    </div>
                                </div>

                                {/* Terms */}
                                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginBottom: '20px', marginTop: '4px' }}>
                                    <input type="checkbox" checked={userDetails.termsChecked} onChange={e => set('termsChecked', e.target.checked)}
                                        style={{ marginTop: '3px', accentColor: '#6366f1', flexShrink: 0 }} />
                                    <span style={{ color: '#64748b', fontSize: '0.78rem', lineHeight: 1.5 }}>
                                        I agree to the <a href="/documentation" style={{ color: '#6366f1', textDecoration: 'none' }}>Terms of Service</a> &amp; <a href="/documentation" style={{ color: '#6366f1', textDecoration: 'none' }}>Privacy Policy</a>
                                    </span>
                                </label>

                                <motion.button type="submit" disabled={!isFormValid || isLoading}
                                    whileTap={isFormValid ? { scale: 0.98 } : {}}
                                    style={{
                                        width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
                                        background: isFormValid ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : '#f1f5f9',
                                        color: isFormValid ? 'white' : '#94a3b8',
                                        fontWeight: 700, fontSize: '0.9rem', cursor: isFormValid ? 'pointer' : 'not-allowed',
                                        boxShadow: isFormValid ? '0 8px 24px rgba(99,102,241,0.3)' : 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        marginBottom: '20px', transition: 'all 0.2s',
                                    }}>
                                    {isLoading ? <><span className="spinner-border spinner-border-sm" />Creating account…</> : <>Create Account <FaArrowRight size={13} /></>}
                                </motion.button>
                            </form>

                            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                                Already have an account?{' '}
                                <Link to="/" style={{ color: '#6366f1', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
                            </p>
                        </motion.div>
                    ) : (
                        <OtpScreen key="otp" email={userDetails.userEmail} onVerify={handleVerifyOtp} isVerifying={isVerifying} />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Register;