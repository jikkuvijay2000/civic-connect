import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { notify } from '../utils/notify';
import axios from 'axios';
import { BASE_URL } from '../services/baseUrl';
import {
    FaEye, FaEyeSlash, FaUserAstronaut, FaEnvelope, FaLock,
    FaMapMarkerAlt, FaArrowRight, FaShieldAlt, FaCheckCircle, FaTerminal
} from 'react-icons/fa';

/* ── Tactical Shared Input ── */
const Field = ({ icon: Icon, label, id, type = 'text', placeholder, value, onChange, onBlur, error, autoComplete, rows }) => {
    const [show, setShow] = useState(false);
    const isPw = type === 'password';
    
    const inputClasses = "form-control tech-font w-100 bg-transparent text-white";
    const baseStyle = {
        padding: `14px ${isPw ? '44px' : '16px'} 14px ${Icon ? '44px' : '16px'}`,
        border: `1px solid ${error ? 'var(--accent-red)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 'var(--radius-md)',
        fontSize: '0.9rem', outline: 'none', transition: 'all 0.3s'
    };
    
    return (
        <div className="mb-3">
            <label htmlFor={id} className="tech-font d-block text-muted mb-2 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.15em' }}>
                {label}
            </label>
            <div className="position-relative d-flex align-items-center">
                {Icon && <Icon size={14} className="position-absolute" style={{ left: '16px', top: rows ? '16px' : '50%', transform: rows ? 'none' : 'translateY(-50%)', color: error ? 'var(--accent-red)' : 'var(--primary-color)', pointerEvents: 'none' }} />}
                {rows ? (
                    <textarea id={id} rows={rows} placeholder={placeholder} value={value} onChange={onChange} onBlur={onBlur} 
                        className={inputClasses} style={{ ...baseStyle, padding: `14px ${Icon ? '44px' : '16px'}`, resize: 'vertical' }}
                        onFocus={e => {
                            e.currentTarget.style.borderColor = 'var(--primary-color)';
                            e.currentTarget.style.boxShadow = '0 0 10px rgba(170,0,255,0.15)';
                            e.currentTarget.style.background = 'rgba(170,0,255,0.03)';
                        }}
                        onBlurCapture={e => {
                            e.currentTarget.style.borderColor = error ? 'var(--accent-red)' : 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.background = 'transparent';
                        }}
                    />
                ) : (
                    <input id={id} type={isPw ? (show ? 'text' : 'password') : type} placeholder={placeholder} value={value} onChange={onChange} onBlur={onBlur} autoComplete={autoComplete} 
                        className={inputClasses} style={baseStyle}
                        onFocus={e => {
                            e.currentTarget.style.borderColor = 'var(--primary-color)';
                            e.currentTarget.style.boxShadow = '0 0 10px rgba(170,0,255,0.15)';
                            e.currentTarget.style.background = 'rgba(170,0,255,0.03)';
                        }}
                        onBlurCapture={e => {
                            e.currentTarget.style.borderColor = error ? 'var(--accent-red)' : 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.background = 'transparent';
                        }}
                    />
                )}
                {isPw && (
                    <button type="button" onClick={() => setShow(s => !s)}
                        className="position-absolute border-0 bg-transparent"
                        style={{ right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                    >
                        {show ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                )}
            </div>
            {error && <p className="tech-font mt-1 mb-0" style={{ color: 'var(--accent-red)', fontSize: '0.7rem', letterSpacing: '0.05em' }}>ERR: {error}</p>}
        </div>
    );
};

/* ── Tactical Password Engine ── */
const PwRules = ({ pw }) => {
    const rules = [
        { ok: pw.length >= 8, text: '8+ CHARS' },
        { ok: /[A-Z]/.test(pw), text: 'UPPERCASE' },
        { ok: /[0-9]/.test(pw), text: 'NUMERIC' },
        { ok: /[@$!%*?&#]/.test(pw), text: 'SYMBOL' },
    ];
    if (!pw) return null;

    const strengthCount = rules.filter(r => r.ok).length;
    let strengthColor = 'var(--accent-red)'; 
    if (strengthCount === 4) strengthColor = 'var(--secondary-color)';
    else if (strengthCount >= 2) strengthColor = '#f59e0b'; 

    return (
        <div className="mt-2 mb-3">
            <div className="d-flex gap-1 mb-2" style={{ height: '3px' }}>
                {[1, 2, 3, 4].map(level => (
                    <div key={level} style={{
                        flex: 1, background: strengthCount >= level ? strengthColor : 'rgba(255,255,255,0.1)',
                        boxShadow: strengthCount >= level ? `0 0 5px ${strengthColor}` : 'none',
                        transition: 'all 0.3s ease-in-out'
                    }} />
                ))}
            </div>
            <div className="d-flex flex-wrap gap-2">
                {rules.map((r, i) => (
                    <span key={i} className="tech-font d-flex align-items-center gap-1" style={{ 
                        fontSize: '0.65rem', fontWeight: 600, 
                        color: r.ok ? 'var(--secondary-color)' : 'var(--text-muted)', 
                        background: r.ok ? 'rgba(163, 230, 53, 0.1)' : 'rgba(255,255,255,0.05)', 
                        borderRadius: '2px', padding: '2px 6px', 
                        border: `1px solid ${r.ok ? 'var(--secondary-color)' : 'transparent'}` 
                    }}>
                        <FaCheckCircle size={8} /> {r.text}
                    </span>
                ))}
            </div>
        </div>
    );
};

/* ── Tactical OTP Screen ── */
const OtpScreen = ({ email, onVerify, isVerifying }) => {
    const [otp, setOtp] = useState('');
    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
            <div className="text-center mb-5">
                <div className="d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(170,0,255,0.1)', border: '1px solid var(--primary-color)', boxShadow: '0 0 20px rgba(170,0,255,0.3)' }}>
                    <FaShieldAlt size={26} className="text-neon-purple" />
                </div>
                <h2 className="tech-font text-white fw-bold mb-2">VERIFY ORIGIN</h2>
                <p className="tech-font text-muted" style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                    SECURE COMM-LINK DELIVERED TO<br /><strong className="text-neon-purple mt-1 d-block">{email.toUpperCase()}</strong>
                </p>
            </div>

            <div className="mb-4">
                <input type="text" maxLength="6" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="------" className="form-control tech-font text-center bg-transparent text-white"
                    style={{
                        letterSpacing: '0.8rem', fontSize: '1.8rem', fontWeight: 700,
                        border: '1px solid var(--primary-color)', borderRadius: 'var(--radius-md)',
                        boxShadow: 'inset 0 0 10px rgba(170,0,255,0.1)', padding: '20px 0'
                    }}
                    onFocus={e => e.currentTarget.style.boxShadow = 'inset 0 0 15px rgba(170,0,255,0.3)'}
                    onBlur={e => e.currentTarget.style.boxShadow = 'inset 0 0 10px rgba(170,0,255,0.1)'}
                />
            </div>
            <motion.button type="button" onClick={() => onVerify(otp)} disabled={otp.length !== 6 || isVerifying}
                whileTap={otp.length === 6 ? { scale: 0.98 } : {}}
                className={`btn w-100 py-3 rounded-custom mb-4 tech-font fw-bold ${otp.length === 6 ? 'btn-primary-custom' : ''}`}
                style={{
                    background: otp.length !== 6 ? 'rgba(255,255,255,0.05)' : '', color: otp.length !== 6 ? 'rgba(255,255,255,0.2)' : 'white',
                    border: otp.length !== 6 ? '1px solid rgba(255,255,255,0.1)' : '', letterSpacing: '0.15em',
                    cursor: otp.length === 6 ? 'pointer' : 'not-allowed',
                }}>
                {isVerifying ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                {isVerifying ? 'VERIFYING DATA...' : 'ESTABLISH LINK'}
            </motion.button>
        </motion.div>
    );
};

const Register = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [touched, setTouched] = useState({});
    const [userDetails, setUserDetails] = useState({
        userName: '', userEmail: '', userAddress: '', userPassword: '', userConfirmPassword: '', termsChecked: false,
    });

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
        if (!isFormValid) { notify('error', 'SYSTEM REJECTED: INVALID PARAMETERS'); return; }
        setIsLoading(true);
        try {
            const res = await axios.post(`${BASE_URL}/user/register`, userDetails);
            if (res.status === 200) { notify('success', 'IDENTITY REGISTERED. AWAITING VERIFICATION.'); setShowOtp(true); }
        } catch (err) { notify('error', err.response?.data?.message || 'CRITICAL FAILURE'); }
        finally { setIsLoading(false); }
    };

    const handleVerifyOtp = async (otp) => {
        setIsVerifying(true);
        try {
            await axios.post(`${BASE_URL}/user/verify-email`, { userEmail: userDetails.userEmail, otp });
            notify('success', 'CLEARANCE GRANTED. INITIATING LOGIN.');
            setTimeout(() => navigate('/'), 1500);
        } catch (err) { notify('error', err.response?.data?.message || 'INVALID OVERRIDE CODE'); }
        finally { setIsVerifying(false); }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 position-relative" style={{ backgroundColor: 'var(--bg-body)', overflow: 'hidden', padding: '2rem 1rem' }}>
            
            {/* Cyber Grid Background */}
            <div className="position-absolute w-100 h-100" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.5 }} />
            
            {/* Neon Glow Spots */}
            <div className="position-absolute rounded-circle" style={{ width: '400px', height: '400px', background: 'var(--primary-color)', filter: 'blur(100px)', opacity: 0.15, top: '-10%', left: '-10%' }} />
            <div className="position-absolute rounded-circle" style={{ width: '300px', height: '300px', background: 'var(--secondary-color)', filter: 'blur(100px)', opacity: 0.1, bottom: '-5%', right: '-5%' }} />

            {/* Registration Glass Card */}
            <div className="glass-card position-relative z-index-1 p-4 shadow-custom-lg mx-auto" style={{ width: '100%', maxWidth: '540px' }}>
                
                <div className="text-center mb-4">
                    <div className="d-flex align-items-center justify-content-center gap-2 mb-3 text-neon-purple">
                        <FaTerminal size={24} />
                        <span className="tech-font fw-bold fs-5 tracking-widest" style={{ letterSpacing: '0.2em' }}>CIVIC SENSE</span>
                    </div>
                    {!showOtp && (
                        <h4 className="tech-font text-white mb-2" style={{ letterSpacing: '0.1em' }}>NEW ALIAS REGISTRATION</h4>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {!showOtp ? (
                        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                            <form onSubmit={handleRegister}>
                                
                                <Field icon={FaUserAstronaut} label="OPERATIVE DESIGNATION" id="name" placeholder="JOHN_DOE_88"
                                    value={userDetails.userName} onChange={e => set('userName', e.target.value)} />
                                
                                <Field icon={FaEnvelope} label="NETWORK ADDRESS" id="email" type="email" placeholder="alias@network.gov"
                                    value={userDetails.userEmail} autoComplete="username"
                                    onChange={e => set('userEmail', e.target.value)} onBlur={() => touch('userEmail')}
                                    error={touched.userEmail && !isEmailValid ? 'UNRECOGNIZED NODE FORMAT' : null} />
                                
                                <Field icon={FaMapMarkerAlt} label="POSTING SECTOR / ADDRESS" id="address" rows={2} placeholder="SECTOR 7G, NEW AVALON"
                                    value={userDetails.userAddress} onChange={e => set('userAddress', e.target.value)} />
                                
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <Field icon={FaLock} label="ENCRYPTION KEY" id="password" type="password" placeholder="••••••••"
                                            value={userDetails.userPassword} autoComplete="new-password"
                                            onChange={e => set('userPassword', e.target.value)} onBlur={() => touch('userPassword')}
                                            error={touched.userPassword && !isPasswordValid ? 'WEAK ENCRYPTION' : null} />
                                    </div>
                                    <div className="col-md-6">
                                        <Field icon={FaLock} label="CONFIRM KEY" id="confirm" type="password" placeholder="••••••••"
                                            value={userDetails.userConfirmPassword} autoComplete="new-password"
                                            onChange={e => set('userConfirmPassword', e.target.value)} onBlur={() => touch('userConfirmPassword')}
                                            error={touched.userConfirmPassword && !doPasswordsMatch ? "KEY MISMATCH" : null} />
                                    </div>
                                </div>
                                <PwRules pw={userDetails.userPassword} />

                                {/* Terms */}
                                <label className="d-flex align-items-start gap-2 mt-3 mb-4 cursor-pointer">
                                    <input type="checkbox" checked={userDetails.termsChecked} onChange={e => set('termsChecked', e.target.checked)}
                                        style={{ marginTop: '3px', accentColor: 'var(--primary-color)', flexShrink: 0 }} />
                                    <span className="tech-font text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                                        AGREE TO <a href="/documentation" className="text-neon-purple text-decoration-none">NETWORK PROTOCOLS</a> &amp; <a href="/documentation" className="text-neon-purple text-decoration-none">DATA POLICIES</a>
                                    </span>
                                </label>

                                <motion.button type="submit" disabled={!isFormValid || isLoading}
                                    whileTap={isFormValid ? { scale: 0.98 } : {}}
                                    className={`btn w-100 py-3 rounded-custom tech-font fw-bold d-flex align-items-center justify-content-center gap-2 ${isFormValid ? 'btn-primary-custom' : ''}`}
                                    style={{
                                        background: isFormValid ? '' : 'rgba(255,255,255,0.05)', color: isFormValid ? 'white' : 'rgba(255,255,255,0.2)',
                                        border: isFormValid ? '' : '1px solid rgba(255,255,255,0.1)', cursor: isFormValid ? 'pointer' : 'not-allowed',
                                        letterSpacing: '0.15em'
                                    }}>
                                    {isLoading ? <><span className="spinner-border spinner-border-sm" /> CREATING INSTANCE...</> : <>INITIALIZE ALIAS <FaArrowRight size={12} /></>}
                                </motion.button>
                            </form>

                            <p className="text-center mt-4 mb-0 tech-font" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                                EXISTING OPERATIVE?{' '}
                                <Link to="/" className="text-neon-purple fw-bold text-decoration-none ms-1">ACCESS TERMINAL</Link>
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