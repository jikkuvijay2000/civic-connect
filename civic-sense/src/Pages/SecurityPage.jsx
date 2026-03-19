import React, { useState } from 'react';
import {
    FaLock, FaEye, FaEyeSlash, FaShieldAlt, FaSignOutAlt,
    FaCheckCircle, FaExclamationTriangle, FaKey, FaUserShield,
    FaInfoCircle, FaDatabase, FaTerminal
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { notify } from '../utils/notify';
import { useNavigate } from 'react-router-dom';

/* ── Helper ── */
const strengthInfo = (pw) => {
    if (!pw) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[@$!%*?&#]/.test(pw)) score++;
    const map = [
        { label: '', color: '' },
        { label: 'CRITICAL', color: 'var(--accent-red)' },
        { label: 'WEAK', color: '#f97316' },
        { label: 'STABLE', color: '#f59e0b' },
        { label: 'SECURE', color: 'var(--neon-green)' },
    ];
    return { score, ...map[score] };
};

const PasswordField = ({ label, value, onChange, placeholder }) => {
    const [show, setShow] = useState(false);
    return (
        <div>
            <label className="fw-bold tech-font mb-2 d-flex align-items-center gap-2 tracking-widest text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.15em', color: '#c4c4d4' }}>
                <FaTerminal size={10} /> {label}
            </label>
            <div className="d-flex align-items-center border px-3 transition-all" style={{ background: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.1) !important', gap: '8px' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary-color) !important'; e.currentTarget.style.boxShadow = '0 0 10px rgba(170,0,255,0.2)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1) !important'; e.currentTarget.style.boxShadow = 'none'; }}>
                <FaKey size={13} className="flex-shrink-0" style={{ color: '#7c7ca8' }} />
                <input
                    type={show ? 'text' : 'password'}
                    className="form-control border-0 shadow-none bg-transparent py-3 text-white font-monospace"
                    placeholder={placeholder}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    style={{ fontSize: '0.9rem', letterSpacing: show ? 'normal' : '0.2em' }}
                />
                <button type="button" className="border-0 bg-transparent p-0 hover-scale" onClick={() => setShow(s => !s)}>
                    {show ? <FaEyeSlash size={14} style={{ color: '#9090b8' }} /> : <FaEye size={14} style={{ color: '#9090b8' }} />}
                </button>
            </div>
        </div>
    );
};

const SecurityPage = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    /* Change password state */
    const [current, setCurrent] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirm, setConfirm] = useState('');
    const [saving, setSaving] = useState(false);
    const [pwDone, setPwDone] = useState(false);

    /* Delete account */
    const [showDelete, setShowDelete] = useState(false);
    const [deleteInput, setDeleteInput] = useState('');

    const strength = strengthInfo(newPw);
    const match = newPw && confirm && newPw === confirm;
    const canSave = current && newPw.length >= 8 && match && strength.score >= 2;

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!canSave) return;
        setSaving(true);
        try {
            await api.put('/user/change-password', { currentPassword: current, newPassword: newPw });
            notify('success', 'ENCRYPTION KEY UPDATED.');
            setCurrent(''); setNewPw(''); setConfirm('');
            setPwDone(true);
            setTimeout(() => setPwDone(false), 4000);
        } catch (err) {
            notify('error', err?.response?.data?.message || 'SYSTEM ERROR: KEY UPDATE FAILED.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear(); sessionStorage.clear();
        document.cookie.split(';').forEach(c => {
            document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
        });
        notify('success', 'COM-LINK SEVERED. LOGGED OUT.');
        navigate('/');
    };

    return (
        <div style={{ background: 'transparent', minHeight: '100vh', position: 'relative' }}>

            {/* Background Map Overlay */}
            <div className="position-absolute top-0 start-0 w-100 h-100 pointer-events-none opacity-25"
                style={{
                    backgroundImage: 'radial-gradient(circle at center, rgba(170,0,255,0.05) 0%, transparent 70%), linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                    backgroundSize: '100% 100%, 30px 30px, 30px 30px',
                    zIndex: 0
                }}
            />

            {/* ── Top bar ── */}
            <div className="px-4 px-md-5 py-4 border-bottom" style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10, borderColor: 'rgba(255,255,255,0.1) !important' }}>
                <div className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center justify-content-center border border-primary rounded" style={{ width: '48px', height: '48px', background: 'rgba(170,0,255,0.1)', color: 'var(--primary-color)', boxShadow: '0 0 10px rgba(170,0,255,0.2)' }}>
                        <FaShieldAlt size={20} />
                    </div>
                    <div>
                        <h4 className="fw-bold text-white tech-font mb-1 text-uppercase tracking-widest">SECURITY PROTOCOLS</h4>
                        <small className="tech-font font-monospace text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.1em', color: '#a0a0b8' }}>
                            // MANAGE ENCRYPTION KEYS & DATA PRIVACY
                        </small>
                    </div>
                </div>
            </div>

            <div className="px-4 px-md-5 py-5 z-1 position-relative">
                <div style={{ maxWidth: '760px', margin: '0 auto' }}>

                    {/* ── Account info banner ── */}
                    <div className="glass-card d-flex align-items-center gap-4 p-4 mb-5"
                        style={{ border: '1px solid var(--primary-color)', boxShadow: '0 0 20px rgba(170,0,255,0.1)' }}>
                        <div className="d-flex align-items-center justify-content-center border tech-font fw-bold flex-shrink-0"
                            style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'rgba(170,0,255,0.2)', color: 'var(--primary-color)', fontSize: '1.5rem', borderColor: 'var(--primary-color) !important', boxShadow: 'inset 0 0 15px rgba(170,0,255,0.3)' }}>
                            {user.userName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'OP'}
                        </div>
                        <div className="flex-grow-1">
                            <div className="fw-bold text-white font-monospace text-uppercase" style={{ fontSize: '1.2rem', letterSpacing: '0.05em' }}>{user.userName || 'UNKNOWN ALIAS'}</div>
                            <small className="tech-font text-uppercase tracking-widest" style={{ fontSize: '0.75rem', color: '#c4c4d4' }}>{user.userEmail || '—'}</small>
                        </div>
                        <div className="d-flex align-items-center gap-2 px-3 py-2 border tech-font text-uppercase" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'var(--neon-green) !important', boxShadow: '0 0 10px rgba(16,185,129,0.2)' }}>
                            <FaCheckCircle size={14} className="text-neon-green" />
                            <small className="fw-bold text-neon-green tracking-widest" style={{ fontSize: '0.7rem' }}>VERIFIED_OP</small>
                        </div>
                    </div>

                    {/* ── Change Password ── */}
                    <div className="glass-card mb-5 overflow-hidden border-secondary">
                        <div className="px-4 py-4 border-bottom d-flex align-items-center gap-3" style={{ background: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.1) !important' }}>
                            <FaLock size={16} className="text-primary" />
                            <div>
                                <div className="fw-bold text-white tech-font text-uppercase tracking-widest" style={{ fontSize: '1rem' }}>ENCRYPTION KEY MANAGEMENT</div>
                                <small className="tech-font font-monospace text-uppercase" style={{ fontSize: '0.7rem', color: '#a0a0b8' }}>// RECYCLE KEYS PERIODICALLY TO MAINTAIN SECURITY CLEARANCE</small>
                            </div>
                        </div>
                        <form onSubmit={handleChangePassword} className="p-4 p-md-5">
                            <div className="d-flex flex-column gap-4">
                                <PasswordField label="CURRENT ENCRYPTION KEY" value={current} onChange={setCurrent} placeholder="ENTER CURRENT KEY" />
                                <div>
                                    <PasswordField label="NEW ENCRYPTION KEY" value={newPw} onChange={setNewPw} placeholder="INITIATE NEW KEY" />
                                    {/* Strength bar */}
                                    {newPw && (
                                        <div className="mt-3">
                                            <div className="d-flex gap-2 mb-2">
                                                {[1, 2, 3, 4].map(i => (
                                                    <div key={i} style={{ flex: 1, height: '4px', background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.1)', transition: 'all 0.3s', boxShadow: i <= strength.score ? `0 0 5px ${strength.color}` : 'none' }} />
                                                ))}
                                            </div>
                                            <small className="tech-font text-uppercase fw-bold pb-1 d-block" style={{ color: strength.color, fontSize: '0.75rem', letterSpacing: '0.1em' }}>&gt; INTEGRITY: {strength.label}</small>
                                        </div>
                                    )}
                                    <div className="mt-3 d-flex flex-wrap gap-3">
                                        {[
                                            { rule: newPw.length >= 8, text: '8+ BYTES' },
                                            { rule: /[A-Z]/.test(newPw), text: 'UPPERCASE_CHAR' },
                                            { rule: /[0-9]/.test(newPw), text: 'NUMERIC_VAL' },
                                            { rule: /[@$!%*?&#]/.test(newPw), text: 'SYMBOLIC_CHAR' },
                                        ].map((r, i) => (
                                            <span key={i} className="d-flex align-items-center gap-2 tech-font text-uppercase"
                                                style={{ fontSize: '0.7rem', color: r.rule ? 'var(--neon-green)' : '#8888aa', letterSpacing: '0.1em' }}>
                                                {r.rule ? <FaCheckCircle size={10} /> : <div style={{ width: '4px', height: '4px', background: '#8888aa', borderRadius: '50%' }} />}
                                                <span style={{ opacity: 1 }}>{r.text}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <PasswordField label="VERIFY NEW ENCRYPTION KEY" value={confirm} onChange={setConfirm} placeholder="REPEAT NEW KEY" />
                                    {confirm && (
                                        <div className="mt-2 d-flex align-items-center gap-2 tech-font text-uppercase" style={{ color: match ? 'var(--neon-green)' : 'var(--accent-red)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
                                            <FaTerminal size={10} /> {match ? 'CHECKSUM VERIFIED' : 'CHECKSUM MISMATCH'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <AnimatePresence>
                                {pwDone && (
                                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className="d-flex align-items-center gap-3 mt-4 p-3 border tech-font"
                                        style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'var(--neon-green) !important', boxShadow: '0 0 10px rgba(16,185,129,0.2)' }}>
                                        <FaCheckCircle className="text-neon-green" size={16} />
                                        <span className="fw-bold text-neon-green text-uppercase tracking-widest" style={{ fontSize: '0.8rem' }}>ENCRYPTION KEY OVERWRITTEN SUCCESSFULLY.</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="mt-5 d-flex justify-content-end">
                                <button type="submit" disabled={!canSave || saving}
                                    className="btn fw-bold px-5 py-3 tech-font text-uppercase tracking-widest d-flex align-items-center gap-2 hover-scale transition-all"
                                    style={{
                                        background: canSave ? 'rgba(170,0,255,0.2)' : 'rgba(255,255,255,0.05)',
                                        color: canSave ? 'var(--primary-color)' : 'var(--text-muted)',
                                        border: `1px solid ${canSave ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)'}`,
                                        boxShadow: canSave ? '0 0 15px rgba(170,0,255,0.3)' : 'none',
                                        fontSize: '0.85rem'
                                    }}>
                                    {saving ? <><span className="spinner-border spinner-border-sm" /> OVERWRITING...</> : <><FaKey size={14} /> COMMIT NEW KEY</>}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* ── Privacy Data Summary ── */}
                    <div className="glass-card mb-5 overflow-hidden border-secondary">
                        <div className="px-4 py-4 border-bottom d-flex align-items-center gap-3" style={{ background: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.1) !important' }}>
                            <FaDatabase size={16} className="text-secondary" />
                            <div>
                                <div className="fw-bold text-white tech-font text-uppercase tracking-widest" style={{ fontSize: '1rem' }}>DATA CLASSIFICATION & PROTOCOLS</div>
                                <small className="tech-font font-monospace text-uppercase" style={{ fontSize: '0.7rem', color: '#a0a0b8' }}>// HOW YOUR INTEL IS STORED AND PROCESSED</small>
                            </div>
                        </div>
                        <div className="p-4 p-md-5">
                            {[
                                { title: 'OPERATIVE INTEL', desc: 'Alias, datalink (email), and coordinates verify your clearance and route anomalies to the correct sector command.', icon: FaUserShield },
                                { title: 'ANOMALY REPORTS', desc: 'Visual records and encrypted text submitted to authority terminals. Your digital signature remains attached during triage.', icon: FaInfoCircle },
                                { title: 'NEURAL NET PROCESSING', desc: 'Submissions parsed by central AI for threat assessment and duplication scanning. Data is strictly internal.', icon: FaShieldAlt },
                                { title: 'DATA PERSISTENCE', desc: 'Records held in deep archive until account termination. Post-termination, anomaly records are permanently stripped of identifying markers.', icon: FaDatabase },
                            ].map((item, i) => {
                                const Icon = item.icon;
                                return (
                                    <div key={i} className="d-flex align-items-start gap-4 mb-4 pb-4 border-bottom" style={{ borderColor: i === 3 ? 'transparent' : 'rgba(255,255,255,0.12) !important', margin: i === 3 ? '0 0 -1rem 0' : '0' }}>
                                        <div className="border d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '42px', height: '42px', background: 'rgba(100,80,160,0.15)', borderColor: 'rgba(170,0,255,0.25) !important', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.6)' }}>
                                            <Icon size={16} style={{ color: '#9a80d4' }} />
                                        </div>
                                        <div>
                                            <div className="fw-bold tech-font text-uppercase tracking-widest mb-2" style={{ fontSize: '0.8rem', color: '#c4b8e8' }}>&gt; {item.title}</div>
                                            <p className="font-monospace mb-0" style={{ fontSize: '0.8rem', lineHeight: 1.7, color: '#d0cee0' }}>{item.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Active Session ── */}
                    <div className="glass-card mb-5 overflow-hidden border-secondary">
                        <div className="px-4 py-4 border-bottom d-flex align-items-center gap-3" style={{ background: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.1) !important' }}>
                            <FaSignOutAlt size={16} className="text-neon-green" />
                            <div>
                                <div className="fw-bold text-white tech-font text-uppercase tracking-widest" style={{ fontSize: '1rem' }}>COM-LINK STATUS</div>
                                <small className="tech-font font-monospace text-uppercase" style={{ fontSize: '0.7rem', color: '#a0a0b8' }}>// ACTIVE CONNECTIONS TO CENTRAL SERVER</small>
                            </div>
                        </div>
                        <div className="p-4 p-md-5">
                            <div className="d-flex align-items-center justify-content-between p-4 border" style={{ background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.2) !important', boxShadow: 'inset 0 0 20px rgba(16,185,129,0.05)' }}>
                                <div className="d-flex align-items-center gap-4">
                                    <div className="d-flex align-items-center justify-content-center border"
                                        style={{ width: '48px', height: '48px', background: 'rgba(16,185,129,0.1)', borderColor: 'var(--neon-green) !important', boxShadow: '0 0 10px rgba(16,185,129,0.2)' }}>
                                        <FaCheckCircle size={18} className="text-neon-green" />
                                    </div>
                                    <div>
                                        <div className="fw-bold text-neon-green tech-font text-uppercase tracking-widest mb-1" style={{ fontSize: '0.85rem' }}>LINK: SECURE / ACTIVE</div>
                                        <small className="font-monospace d-block" style={{ fontSize: '0.75rem', color: '#a0a0b8' }}>
                                            OPERATIVE: <span className="text-white">{user.userEmail}</span>
                                        </small>
                                        <small className="font-monospace d-block mt-1" style={{ fontSize: '0.7rem', color: '#9090b8' }}>
                                            ESTABLISHED: {new Date().toLocaleDateString('en-US', { dateStyle: 'long' }).toUpperCase()}
                                        </small>
                                    </div>
                                </div>
                                <button onClick={handleLogout}
                                    className="btn fw-bold tech-font text-uppercase px-4 py-2 hover-scale transition-all d-flex align-items-center gap-2"
                                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', fontSize: '0.8rem', letterSpacing: '0.1em', boxShadow: '0 0 10px rgba(239,68,68,0.2)' }}>
                                    <FaSignOutAlt size={12} /> SEVER LINK
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Danger Zone ── */}
                    <div className="glass-card overflow-hidden" style={{ borderColor: 'var(--accent-red)', boxShadow: '0 0 20px rgba(239,68,68,0.15)' }}>
                        <div className="px-4 py-4 border-bottom d-flex align-items-center gap-3" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3) !important' }}>
                            <FaExclamationTriangle size={18} className="text-accent-red" />
                            <div>
                                <div className="fw-bold tech-font text-uppercase tracking-widest blink-slow" style={{ color: 'var(--accent-red)', fontSize: '1rem' }}>RESTRICTED SECTOR [ DANGER ]</div>
                                <small className="font-monospace text-uppercase" style={{ color: '#fcc5c5', fontSize: '0.7rem' }}>// CRITICAL ACTIONS ARE IRREVERSIBLE</small>
                            </div>
                        </div>
                        <div className="p-4 p-md-5">
                            <div className="d-flex align-items-start justify-content-between gap-4 flex-wrap">
                                <div>
                                    <div className="fw-bold text-white tech-font text-uppercase tracking-widest mb-2" style={{ fontSize: '0.9rem' }}>&gt; PURGE OPERATIVE DATA</div>
                                    <p className="font-monospace mb-0" style={{ fontSize: '0.8rem', lineHeight: 1.7, maxWidth: '400px', color: '#c8c0d8' }}>
                                        Complete erasure of profile from Central Servers. Anomalies filed will be decoupled and permanently grouped as "ARCHIVED_ORPHAN". This data cannot be recovered.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowDelete(true)}
                                    className="btn fw-bold flex-shrink-0 tech-font text-uppercase tracking-widest px-4 py-3 hover-scale transition-all"
                                    style={{ background: 'transparent', color: 'var(--accent-red)', border: '1px solid var(--accent-red)', fontSize: '0.85rem' }}>
                                    INITIATE PURGE
                                </button>
                            </div>

                            <AnimatePresence>
                                {showDelete && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                        animate={{ opacity: 1, height: 'auto', marginTop: '2rem' }}
                                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-4 border" style={{ background: 'rgba(0,0,0,0.8)', borderColor: 'var(--accent-red) !important', boxShadow: 'inset 0 0 20px rgba(239,68,68,0.1)' }}>
                                            <p className="fw-bold text-white tech-font text-uppercase tracking-widest mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.85rem' }}>
                                                <FaTerminal size={12} className="text-accent-red" /> TYPE "<span className="text-accent-red">PURGE</span>" TO OVERRIDE SAFETY PROTOCOL
                                            </p>
                                            <input
                                                type="text"
                                                className="form-control text-uppercase font-monospace mb-4"
                                                placeholder='AWAITING COMMAND...'
                                                value={deleteInput}
                                                onChange={e => setDeleteInput(e.target.value.toUpperCase())}
                                                style={{ background: 'rgba(239,68,68,0.05)', color: 'var(--accent-red)', border: '1px solid rgba(239,68,68,0.4)', fontSize: '0.9rem', padding: '12px 16px', letterSpacing: '0.2em' }}
                                            />
                                            <div className="d-flex gap-3">
                                                <button
                                                    disabled={deleteInput !== 'PURGE'}
                                                    className="btn fw-bold px-5 py-2 tech-font text-uppercase tracking-widest transition-all"
                                                    style={{ background: deleteInput === 'PURGE' ? 'var(--accent-red)' : 'rgba(255,255,255,0.05)', color: deleteInput === 'PURGE' ? 'white' : 'var(--text-muted)', border: 'none', fontSize: '0.8rem', boxShadow: deleteInput === 'PURGE' ? '0 0 15px rgba(239,68,68,0.4)' : 'none' }}
                                                    onClick={() => notify('info', 'PURGE PROTOCOL UNAVAILABLE — CONTACT SYSTEM ADMIN.')}>
                                                    EXECUTE
                                                </button>
                                                <button onClick={() => { setShowDelete(false); setDeleteInput(''); }}
                                                    className="btn fw-bold px-5 py-2 tech-font text-uppercase tracking-widest hover-scale"
                                                    style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>
                                                    ABORT
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SecurityPage;
