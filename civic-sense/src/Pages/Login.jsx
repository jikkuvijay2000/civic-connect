import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { notify } from '../utils/notify';
import api from '../api/axios';
import { FaEye, FaEyeSlash, FaUserAstronaut, FaLock, FaArrowRight, FaShieldAlt, FaTerminal } from 'react-icons/fa';

/* ── Shared Tactical Input Component ── */
const Field = ({ icon: Icon, label, id, type, placeholder, value, onChange, extra, autoComplete }) => {
    const [show, setShow] = useState(false);
    const isPw = type === 'password';
    return (
        <div className="mb-4">
            <label htmlFor={id} className="tech-font d-block text-muted mb-2 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.15em' }}>
                {label}
            </label>
            <div className="position-relative d-flex align-items-center">
                {Icon && <Icon size={14} className="position-absolute" style={{ left: '16px', color: 'var(--primary-color)', pointerEvents: 'none' }} />}
                <input
                    id={id}
                    type={isPw ? (show ? 'text' : 'password') : type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    className="form-control tech-font w-100 bg-transparent text-white"
                    style={{
                        padding: `14px ${isPw ? '44px' : '16px'} 14px ${Icon ? '44px' : '16px'}`,
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 'var(--radius-md)',
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
                {isPw && (
                    <button type="button" onClick={() => setShow(s => !s)}
                        className="position-absolute border-0 bg-transparent"
                        style={{ right: '16px', color: 'var(--text-muted)' }}
                    >
                        {show ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                )}
            </div>
            {extra}
        </div>
    );
};

/* ── Tactical OTP Screen ── */
const OtpScreen = ({ email, onVerify, onResend, onBack, isVerifying, isResending }) => {
    const [otp, setOtp] = useState('');
    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
            <div className="text-center mb-5">
                <div className="d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(170,0,255,0.1)', border: '1px solid var(--primary-color)', boxShadow: '0 0 20px rgba(170,0,255,0.3)' }}>
                    <FaShieldAlt size={26} className="text-neon-purple" />
                </div>
                <h2 className="tech-font text-white fw-bold mb-2">IDENTITY VERIFICATION</h2>
                <p className="tech-font text-muted" style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                    SECURE 6-DIGIT COMM-LINK SENT TO<br /><strong className="text-neon-purple mt-1 d-block">{email.toUpperCase()}</strong>
                </p>
            </div>

            <div className="mb-4">
                <input
                    type="text" maxLength="6" value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="------"
                    className="form-control tech-font text-center bg-transparent text-white"
                    style={{
                        letterSpacing: '0.8rem', fontSize: '1.8rem', fontWeight: 700,
                        border: '1px solid var(--primary-color)', borderRadius: 'var(--radius-md)',
                        boxShadow: 'inset 0 0 10px rgba(170,0,255,0.1)',
                        padding: '20px 0'
                    }}
                    onFocus={e => e.currentTarget.style.boxShadow = 'inset 0 0 15px rgba(170,0,255,0.3)'}
                    onBlur={e => e.currentTarget.style.boxShadow = 'inset 0 0 10px rgba(170,0,255,0.1)'}
                />
            </div>

            <motion.button
                type="button"
                onClick={() => onVerify(otp)}
                disabled={otp.length !== 6 || isVerifying}
                whileTap={otp.length === 6 ? { scale: 0.98 } : {}}
                className={`btn w-100 py-3 rounded-custom mb-4 tech-font fw-bold ${otp.length === 6 ? 'btn-primary-custom' : ''}`}
                style={{
                    background: otp.length !== 6 ? 'rgba(255,255,255,0.05)' : '',
                    color: otp.length !== 6 ? 'rgba(255,255,255,0.2)' : 'white',
                    border: otp.length !== 6 ? '1px solid rgba(255,255,255,0.1)' : '',
                    letterSpacing: '0.15em',
                    cursor: otp.length === 6 ? 'pointer' : 'not-allowed',
                }}
            >
                {isVerifying ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                {isVerifying ? 'VERIFYING...' : 'CONFIRM ACCESS'}
            </motion.button>

            <div className="d-flex justify-content-between align-items-center tech-font" style={{ fontSize: '0.75rem' }}>
                <button type="button" onClick={onBack} className="btn btn-link text-muted text-decoration-none p-0">
                    &lt; ABORT
                </button>
                <button type="button" onClick={onResend} disabled={isResending} className="btn btn-link text-neon-purple text-decoration-none p-0 fw-bold">
                    {isResending ? 'RESENDING...' : 'RESEND SIGNAL'}
                </button>
            </div>
        </motion.div>
    );
};

const Login = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [unverifiedEmail, setUnverifiedEmail] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [loginDetails, setLoginDetails] = useState({ userEmail: '', userPassword: '' });

    useEffect(() => { api.get('/user/csrf-token'); }, []);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const isFormValid = loginDetails.userEmail && loginDetails.userPassword && emailRegex.test(loginDetails.userEmail);

    const getCsrfToken = () => document.cookie.split('; ').find(r => r.startsWith('csrfToken='))?.split('=')[1];

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
                notify('success', 'ACCESS GRANTED');
                setTimeout(() => navigate(user.role === 'Authority' ? '/authority' : '/dashboard'), 800);
            }
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.unverified) {
                setUnverifiedEmail(loginDetails.userEmail);
                setShowOtp(true);
                notify('warning', 'VERIFICATION REQUIRED');
            } else {
                notify('error', err.response?.data?.message || 'SYSTEM ERROR');
            }
        } finally { setIsLoading(false); }
    };

    const handleVerifyOtp = async (otp) => {
        setIsVerifying(true);
        try {
            await api.post('/user/verify-email', { userEmail: unverifiedEmail, otp });
            notify('success', 'IDENTITY VERIFIED. PROCEED TO LOGIN.');
            setShowOtp(false);
        } catch (err) {
            notify('error', err.response?.data?.message || 'INVALID COMM-LINK');
        } finally { setIsVerifying(false); }
    };

    const handleResendOtp = async () => {
        setIsResending(true);
        try {
            await api.post('/user/resend-otp', { userEmail: unverifiedEmail });
            notify('success', 'SIGNAL RESENT');
        } catch (err) {
            notify('error', err.response?.data?.message || 'TRANSMISSION FAILED');
        } finally { setIsResending(false); }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 position-relative" style={{ backgroundColor: 'var(--bg-body)', overflow: 'hidden' }}>
            
            {/* Cyber Grid Background */}
            <div className="position-absolute w-100 h-100" style={{ 
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', 
                backgroundSize: '40px 40px', 
                opacity: 0.5 
            }} />
            
            {/* Neon Glow Spots */}
            <div className="position-absolute rounded-circle" style={{ width: '400px', height: '400px', background: 'var(--primary-color)', filter: 'blur(100px)', opacity: 0.15, top: '-10%', left: '-10%' }} />
            <div className="position-absolute rounded-circle" style={{ width: '300px', height: '300px', background: 'var(--secondary-color)', filter: 'blur(100px)', opacity: 0.1, bottom: '-5%', right: '-5%' }} />

            {/* Auth Glass Card */}
            <div className="glass-card position-relative z-index-1 p-5 shadow-custom-lg" style={{ width: '100%', maxWidth: '440px' }}>
                
                <div className="text-center mb-5">
                    <div className="d-flex align-items-center justify-content-center gap-2 mb-3 text-neon-purple">
                        <FaTerminal size={24} />
                        <span className="tech-font fw-bold fs-5 tracking-widest" style={{ letterSpacing: '0.2em' }}>CIVIC SENSE</span>
                    </div>
                    {!showOtp && (
                        <h4 className="tech-font text-white mb-2" style={{ letterSpacing: '0.1em' }}>SYSTEM ACCESS</h4>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {!showOtp ? (
                        <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                            <form onSubmit={handleLogin}>
                                <Field icon={FaUserAstronaut} label="OPERATIVE ALIAS" id="email" type="email" placeholder="alias@network.gov"
                                    value={loginDetails.userEmail} autoComplete="username"
                                    onChange={e => setLoginDetails({ ...loginDetails, userEmail: e.target.value })} />

                                <Field icon={FaLock} label="ENCRYPTION KEY" id="password" type="password" placeholder="••••••••"
                                    value={loginDetails.userPassword} autoComplete="current-password"
                                    onChange={e => setLoginDetails({ ...loginDetails, userPassword: e.target.value })}
                                    extra={
                                        <div className="text-end mt-2">
                                            <a href="/forgot-password" className="tech-font text-decoration-none text-muted hover-scale d-inline-block" style={{ fontSize: '0.7rem', letterSpacing: '0.1em' }}>RECOVER KEY?</a>
                                        </div>
                                    }
                                />

                                <motion.button type="submit" disabled={!isFormValid || isLoading}
                                    whileTap={isFormValid ? { scale: 0.98 } : {}}
                                    className={`btn w-100 py-3 mt-3 rounded-custom tech-font fw-bold d-flex align-items-center justify-content-center gap-2 ${isFormValid ? 'btn-primary-custom' : ''}`}
                                    style={{
                                        background: isFormValid ? '' : 'rgba(255,255,255,0.05)',
                                        color: isFormValid ? 'white' : 'rgba(255,255,255,0.2)',
                                        border: isFormValid ? '' : '1px solid rgba(255,255,255,0.1)',
                                        cursor: isFormValid ? 'pointer' : 'not-allowed',
                                        letterSpacing: '0.15em'
                                    }}>
                                    {isLoading ? <><span className="spinner-border spinner-border-sm" /> ESTABLISHING LINK...</> : <>INITIALIZE CONNECTION <FaArrowRight size={12} /></>}
                                </motion.button>
                            </form>

                            <p className="text-center mt-4 mb-0 tech-font" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                                NO ALIAS AUTHORIZATION?{' '}
                                <a href="/register" className="text-neon-purple fw-bold text-decoration-none ms-1">REQUEST ACCESS</a>
                            </p>
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