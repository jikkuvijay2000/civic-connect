import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { notify } from '../utils/notify';
import api from '../api/axios';
import civicLogo from '../assets/civic_logo_dark.png';
import { FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaArrowRight } from 'react-icons/fa';

const PwField = ({ label, name, value, onChange, placeholder }) => {
    const [show, setShow] = useState(false);
    return (
        <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</label>
            <div style={{ position: 'relative' }}>
                <FaLock size={13} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
                <input type={show ? 'text' : 'password'} name={name} value={value} onChange={onChange}
                    placeholder={placeholder}
                    style={{
                        width: '100%', background: '#f8fafc', border: '1.5px solid #e2e8f0',
                        borderRadius: '12px', padding: '13px 44px 13px 42px', color: '#0f172a', fontSize: '0.9rem', outline: 'none',
                    }}
                    onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                    onBlur={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                />
                <button type="button" onClick={() => setShow(s => !s)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                    {show ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                </button>
            </div>
        </div>
    );
};

const PwRulePills = ({ pw }) => {
    const rules = [
        { ok: pw.length >= 8, text: '8+ chars' },
        { ok: /[A-Z]/.test(pw), text: 'Uppercase' },
        { ok: /[0-9]/.test(pw), text: 'Number' },
        { ok: /[@$!%*?&#]/.test(pw), text: 'Special' },
    ];
    if (!pw) return null;
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px', marginBottom: '16px' }}>
            {rules.map((r, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 600, color: r.ok ? '#6ee7b7' : 'rgba(255,255,255,0.3)', background: r.ok ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '2px 8px', border: `1px solid ${r.ok ? 'rgba(16,185,129,0.3)' : 'transparent'}` }}>
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
        if (formData.userPassword !== formData.userConfirmPassword) { notify('error', 'Passwords do not match'); return; }
        if (!passwordRegex.test(formData.userPassword)) { notify('error', 'Password does not meet the requirements'); return; }
        setIsLoading(true);
        try {
            await api.put(`/user/reset-password/${token}`, formData);
            notify('success', 'Password reset successfully!');
            setDone(true);
            setTimeout(() => navigate('/'), 2500);
        } catch (err) {
            notify('error', err.response?.data?.message || 'Invalid or expired link');
        } finally { setIsLoading(false); }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden' }}>

            {/* Blobs */}
            <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '380px', height: '380px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <motion.div
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
                style={{ width: '100%', maxWidth: '420px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '44px 40px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>

                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '36px' }}>
                    <img src={civicLogo} alt="" width="22" />
                    <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.04em' }}>CIVIC CONNECT</span>
                </div>

                {!done ? (
                    <>
                        <div style={{ marginBottom: '28px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#eef2ff', border: '1px solid #a5b4fc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                <FaLock size={20} style={{ color: '#6366f1' }} />
                            </div>
                            <h1 style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.6rem', marginBottom: '8px' }}>Set new password</h1>
                            <p style={{ color: '#64748b', fontSize: '0.87rem', lineHeight: 1.6 }}>Choose a strong password you haven't used before.</p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <PwField label="New password" name="userPassword" value={formData.userPassword} onChange={handleChange} placeholder="••••••••" />
                            <PwRulePills pw={formData.userPassword} />
                            <PwField label="Confirm password" name="userConfirmPassword" value={formData.userConfirmPassword} onChange={handleChange} placeholder="••••••••" />
                            {formData.userConfirmPassword && formData.userPassword !== formData.userConfirmPassword && (
                                <p style={{ color: '#f87171', fontSize: '0.72rem', marginTop: '-10px', marginBottom: '16px' }}>Passwords do not match</p>
                            )}

                            <button type="submit" disabled={!isValid || isLoading}
                                style={{
                                    width: '100%', padding: '13px', borderRadius: '12px', border: 'none', marginTop: '8px',
                                    background: isValid ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : '#f1f5f9',
                                    color: isValid ? 'white' : '#94a3b8',
                                    fontWeight: 700, fontSize: '0.9rem', cursor: isValid ? 'pointer' : 'not-allowed',
                                    boxShadow: isValid ? '0 8px 24px rgba(99,102,241,0.3)' : 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    transition: 'all 0.2s',
                                }}>
                                {isLoading ? <><span className="spinner-border spinner-border-sm" /> Saving…</> : <>Reset Password <FaArrowRight size={13} /></>}
                            </button>
                        </form>
                    </>
                ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} style={{ textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', border: '1px solid #6ee7b7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <FaCheckCircle size={28} style={{ color: '#10b981' }} />
                        </div>
                        <h2 style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.4rem', marginBottom: '10px' }}>Password updated!</h2>
                        <p style={{ color: '#64748b', fontSize: '0.87rem', marginBottom: '28px', lineHeight: 1.6 }}>
                            Your password has been changed.<br />Redirecting to login…
                        </p>
                        <div className="spinner-border text-primary" style={{ width: '24px', height: '24px', borderWidth: '2px' }} />
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default ResetPassword;
