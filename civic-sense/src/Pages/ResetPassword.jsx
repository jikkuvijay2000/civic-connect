import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { notify } from '../utils/notify';
import api from '../api/axios';
import { FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaArrowRight, FaTerminal } from 'react-icons/fa';

const PwField = ({ label, name, value, onChange, placeholder }) => {
    const [show, setShow] = useState(false);
    return (
        <div className="mb-3">
            <label className="tech-font d-block text-muted mb-2 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.15em' }}>
                {label}
            </label>
            <div className="position-relative d-flex align-items-center">
                <FaLock size={13} className="position-absolute" style={{ left: '16px', color: 'var(--primary-color)' }} />
                <input type={show ? 'text' : 'password'} name={name} value={value} onChange={onChange}
                    placeholder={placeholder}
                    className="form-control tech-font w-100 bg-transparent text-white"
                    style={{
                        padding: '14px 44px 14px 44px',
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
                <button type="button" onClick={() => setShow(s => !s)}
                    className="position-absolute border-0 bg-transparent"
                    style={{ right: '16px', color: 'var(--text-muted)' }}>
                    {show ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
            </div>
        </div>
    );
};

const PwRulePills = ({ pw }) => {
    const rules = [
        { ok: pw.length >= 8, text: '8+ CHARS' },
        { ok: /[A-Z]/.test(pw), text: 'UPPERCASE' },
        { ok: /[0-9]/.test(pw), text: 'NUMERIC' },
        { ok: /[@$!%*?&#]/.test(pw), text: 'SYMBOL' },
    ];
    if (!pw) return null;
    return (
        <div className="d-flex flex-wrap gap-2 mt-2 mb-4">
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
    );
};

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [done, setDone] = useState(false);
    const [formData, setFormData] = useState({ userPassword: '', userConfirmPassword: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    const isValid = passwordRegex.test(formData.userPassword) && formData.userPassword === formData.userConfirmPassword;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.userPassword !== formData.userConfirmPassword) { notify('error', 'KEY MISMATCH'); return; }
        if (!passwordRegex.test(formData.userPassword)) { notify('error', 'WEAK ENCRYPTION LEVEL'); return; }
        setIsLoading(true);
        try {
            await api.put(`/user/reset-password/${token}`, formData);
            notify('success', 'KEY OVERRIDE SUCCESSFUL');
            setDone(true);
            setTimeout(() => navigate('/'), 2500);
        } catch (err) {
            notify('error', err.response?.data?.message || 'CORRUPT OR EXPIRED LINK');
        } finally { setIsLoading(false); }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 position-relative" style={{ backgroundColor: 'var(--bg-body)', overflow: 'hidden' }}>

            {/* Cyber Grid Background */}
            <div className="position-absolute w-100 h-100" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.5 }} />
            
            {/* Neon Glow Spots */}
            <div className="position-absolute rounded-circle" style={{ width: '380px', height: '380px', background: 'var(--primary-color)', filter: 'blur(100px)', opacity: 0.14, top: '-5%', right: '-5%' }} />
            <div className="position-absolute rounded-circle" style={{ width: '300px', height: '300px', background: 'var(--primary-color)', filter: 'blur(100px)', opacity: 0.1, bottom: '-10%', left: '-10%' }} />

            <motion.div
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
                className="glass-card position-relative z-index-1 p-5 shadow-custom-lg mx-auto" style={{ width: '100%', maxWidth: '440px' }}>

                {/* Logo */}
                <div className="d-flex align-items-center gap-2 mb-4 text-neon-purple justify-content-center">
                    <FaTerminal size={20} />
                    <span className="tech-font fw-bold" style={{ fontSize: '0.9rem', letterSpacing: '0.15em' }}>CIVIC SENSE</span>
                </div>

                {!done ? (
                    <>
                        <div className="text-center mb-4">
                            <div className="d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(170,0,255,0.1)', border: '1px solid var(--primary-color)', boxShadow: '0 0 20px rgba(170,0,255,0.3)' }}>
                                <FaLock size={20} className="text-neon-purple" />
                            </div>
                            <h1 className="tech-font text-white fw-bold mb-2" style={{ fontSize: '1.4rem', letterSpacing: '0.1em' }}>NEW ENCRYPTION KEY</h1>
                            <p className="tech-font text-muted" style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>INPUT A HIGH-GRADE ENCRYPTION SEQUENCE</p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <PwField label="NEW KEY" name="userPassword" value={formData.userPassword} onChange={handleChange} placeholder="••••••••" />
                            <PwRulePills pw={formData.userPassword} />
                            <PwField label="VERIFY KEY" name="userConfirmPassword" value={formData.userConfirmPassword} onChange={handleChange} placeholder="••••••••" />
                            {formData.userConfirmPassword && formData.userPassword !== formData.userConfirmPassword && (
                                <p className="tech-font mt-1 mb-3" style={{ color: 'var(--accent-red)', fontSize: '0.7rem', letterSpacing: '0.05em' }}>ERR: KEY MISMATCH</p>
                            )}

                            <button type="submit" disabled={!isValid || isLoading}
                                className={`btn w-100 py-3 rounded-custom tech-font fw-bold d-flex align-items-center justify-content-center gap-2 my-4 ${isValid ? 'btn-primary-custom' : ''}`}
                                style={{
                                    background: isValid ? '' : 'rgba(255,255,255,0.05)', color: isValid ? 'white' : 'rgba(255,255,255,0.2)',
                                    border: isValid ? '' : '1px solid rgba(255,255,255,0.1)', cursor: isValid ? 'pointer' : 'not-allowed',
                                    letterSpacing: '0.15em', transition: 'all 0.2s'
                                }}>
                                {isLoading ? <><span className="spinner-border spinner-border-sm" /> OVERWRITING...</> : <>CONFIRM OVERWRITE <FaArrowRight size={12} /></>}
                            </button>
                        </form>
                    </>
                ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="text-center">
                        <div className="d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(163,230,53,0.1)', border: '1px solid var(--secondary-color)', boxShadow: '0 0 20px rgba(163,230,53,0.3)' }}>
                            <FaCheckCircle size={28} className="text-neon-green" />
                        </div>
                        <h2 className="tech-font text-white fw-bold mb-2" style={{ fontSize: '1.4rem', letterSpacing: '0.1em' }}>KEY SECURED</h2>
                        <p className="tech-font text-muted mb-4" style={{ fontSize: '0.85rem', lineHeight: 1.6, letterSpacing: '0.05em' }}>
                            ENCRYPTION OVERRIDE SUCCESSFUL.<br />INITIATING LOGIN SEQUENCE...
                        </p>
                        <div className="spinner-border text-neon-purple mt-2" style={{ width: '24px', height: '24px', borderWidth: '3px' }} />
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default ResetPassword;
