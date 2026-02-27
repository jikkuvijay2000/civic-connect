import React, { useState } from 'react';
import {
    FaLock, FaEye, FaEyeSlash, FaShieldAlt, FaSignOutAlt,
    FaCheckCircle, FaExclamationTriangle, FaKey, FaUserShield,
    FaInfoCircle, FaDatabase
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
        { label: 'Weak', color: '#ef4444' },
        { label: 'Fair', color: '#f97316' },
        { label: 'Good', color: '#f59e0b' },
        { label: 'Strong', color: '#10b981' },
    ];
    return { score, ...map[score] };
};

const PasswordField = ({ label, value, onChange, placeholder }) => {
    const [show, setShow] = useState(false);
    return (
        <div>
            <label className="fw-semibold text-dark mb-2 d-block" style={{ fontSize: '0.85rem' }}>{label}</label>
            <div className="d-flex align-items-center rounded-3 border px-3" style={{ background: '#f8fafc', gap: '8px' }}>
                <FaKey size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
                <input
                    type={show ? 'text' : 'password'}
                    className="form-control border-0 shadow-none bg-transparent py-3"
                    placeholder={placeholder}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    style={{ fontSize: '0.9rem' }}
                />
                <button type="button" className="border-0 bg-transparent p-0" onClick={() => setShow(s => !s)}>
                    {show ? <FaEyeSlash size={14} style={{ color: '#94a3b8' }} /> : <FaEye size={14} style={{ color: '#94a3b8' }} />}
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
            notify('success', 'Password updated successfully');
            setCurrent(''); setNewPw(''); setConfirm('');
            setPwDone(true);
            setTimeout(() => setPwDone(false), 4000);
        } catch (err) {
            notify('error', err?.response?.data?.message || 'Failed to update password');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear(); sessionStorage.clear();
        document.cookie.split(';').forEach(c => {
            document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
        });
        notify('success', 'Logged out successfully');
        navigate('/');
    };

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh' }}>

            {/* ── Top bar ── */}
            <div className="px-4 px-md-5 py-4 border-bottom" style={{ background: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
                <div className="d-flex align-items-center gap-3">
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#eef2ff', border: '1px solid #a5b4fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FaShieldAlt size={15} style={{ color: '#6366f1' }} />
                    </div>
                    <div>
                        <h4 className="fw-bold text-dark mb-0">Security &amp; Privacy</h4>
                        <small className="text-muted">Manage your account credentials and privacy settings</small>
                    </div>
                </div>
            </div>

            <div className="px-4 px-md-5 py-5">
                <div style={{ maxWidth: '720px' }}>

                    {/* ── Account info banner ── */}
                    <div className="d-flex align-items-center gap-4 p-4 rounded-4 mb-5 border"
                        style={{ background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                        <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                            style={{ width: '52px', height: '52px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', fontSize: '1.1rem' }}>
                            {user.userName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                        </div>
                        <div className="flex-grow-1">
                            <div className="fw-bold text-dark" style={{ fontSize: '1rem' }}>{user.userName || '—'}</div>
                            <small className="text-muted">{user.userEmail || '—'}</small>
                        </div>
                        <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3" style={{ background: '#ecfdf5', border: '1px solid #6ee7b7' }}>
                            <FaCheckCircle size={12} style={{ color: '#10b981' }} />
                            <small className="fw-bold" style={{ color: '#065f46', fontSize: '0.75rem' }}>Email Verified</small>
                        </div>
                    </div>

                    {/* ── Change Password ── */}
                    <div className="bg-white rounded-4 border mb-4 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                        <div className="px-4 py-4 border-bottom d-flex align-items-center gap-3" style={{ background: '#f8fafc' }}>
                            <FaLock size={14} style={{ color: '#6366f1' }} />
                            <div>
                                <div className="fw-bold text-dark" style={{ fontSize: '0.93rem' }}>Change Password</div>
                                <small className="text-muted" style={{ fontSize: '0.78rem' }}>Use a strong password you don't use elsewhere</small>
                            </div>
                        </div>
                        <form onSubmit={handleChangePassword} className="p-4">
                            <div className="d-flex flex-column gap-4">
                                <PasswordField label="Current Password" value={current} onChange={setCurrent} placeholder="Enter current password" />
                                <div>
                                    <PasswordField label="New Password" value={newPw} onChange={setNewPw} placeholder="Enter new password" />
                                    {/* Strength bar */}
                                    {newPw && (
                                        <div className="mt-2">
                                            <div className="d-flex gap-1 mb-1">
                                                {[1, 2, 3, 4].map(i => (
                                                    <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i <= strength.score ? strength.color : '#e2e8f0', transition: 'background 0.3s' }} />
                                                ))}
                                            </div>
                                            <small style={{ color: strength.color, fontSize: '0.75rem', fontWeight: 600 }}>{strength.label}</small>
                                        </div>
                                    )}
                                    <div className="mt-2 d-flex flex-wrap gap-2">
                                        {[
                                            { rule: newPw.length >= 8, text: '8+ chars' },
                                            { rule: /[A-Z]/.test(newPw), text: 'Uppercase' },
                                            { rule: /[0-9]/.test(newPw), text: 'Number' },
                                            { rule: /[@$!%*?&#]/.test(newPw), text: 'Special char' },
                                        ].map((r, i) => (
                                            <span key={i} className="d-flex align-items-center gap-1 fw-medium"
                                                style={{ fontSize: '0.72rem', color: r.rule ? '#10b981' : '#94a3b8' }}>
                                                <FaCheckCircle size={9} /> {r.text}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <PasswordField label="Confirm New Password" value={confirm} onChange={setConfirm} placeholder="Repeat new password" />
                                    {confirm && (
                                        <small className="mt-1 d-block" style={{ color: match ? '#10b981' : '#ef4444', fontSize: '0.75rem' }}>
                                            {match ? '✓ Passwords match' : '✗ Passwords do not match'}
                                        </small>
                                    )}
                                </div>
                            </div>

                            <AnimatePresence>
                                {pwDone && (
                                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className="d-flex align-items-center gap-2 mt-4 p-3 rounded-3"
                                        style={{ background: '#ecfdf5', border: '1px solid #6ee7b7' }}>
                                        <FaCheckCircle style={{ color: '#10b981' }} size={14} />
                                        <small className="fw-bold" style={{ color: '#065f46' }}>Password changed successfully!</small>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="mt-4 d-flex justify-content-end">
                                <button type="submit" disabled={!canSave || saving}
                                    className="btn fw-bold px-5 py-2"
                                    style={{
                                        borderRadius: '10px',
                                        background: canSave ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : '#e2e8f0',
                                        color: canSave ? 'white' : '#94a3b8',
                                        border: 'none',
                                        boxShadow: canSave ? '0 4px 14px rgba(99,102,241,0.3)' : 'none',
                                        transition: 'all 0.2s',
                                        fontSize: '0.88rem',
                                    }}>
                                    {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* ── Privacy Data Summary ── */}
                    <div className="bg-white rounded-4 border mb-4 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                        <div className="px-4 py-4 border-bottom d-flex align-items-center gap-3" style={{ background: '#f8fafc' }}>
                            <FaDatabase size={14} style={{ color: '#6366f1' }} />
                            <div>
                                <div className="fw-bold text-dark" style={{ fontSize: '0.93rem' }}>Your Data &amp; Privacy</div>
                                <small className="text-muted" style={{ fontSize: '0.78rem' }}>What Civic Connect collects and how it's used</small>
                            </div>
                        </div>
                        <div className="p-4">
                            {[
                                { title: 'Profile Information', desc: 'Name, email, and address are used to identify your account and route complaints to the relevant authority.', icon: FaUserShield },
                                { title: 'Complaint Data', desc: 'Reports and images you submit are shared with the relevant municipal authority to action. Your identity is linked to each complaint.', icon: FaInfoCircle },
                                { title: 'AI Processing', desc: 'Your complaint text and images are processed by our AI models for severity scoring and fake-detection. No data is sent to third parties.', icon: FaShieldAlt },
                                { title: 'Data Retention', desc: 'Your account and complaint data are retained while your account is active. Deletion requests result in anonymisation of complaint records.', icon: FaDatabase },
                            ].map((item, i) => {
                                const Icon = item.icon;
                                return (
                                    <div key={i} className="d-flex align-items-start gap-3 mb-3 pb-3 border-bottom" style={{ borderColor: i === 3 ? 'transparent' : '#f1f5f9' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: '#eef2ff', border: '1px solid #a5b4fc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                                            <Icon size={13} style={{ color: '#6366f1' }} />
                                        </div>
                                        <div>
                                            <div className="fw-semibold text-dark mb-1" style={{ fontSize: '0.87rem' }}>{item.title}</div>
                                            <p className="text-muted mb-0" style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>{item.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Session ── */}
                    <div className="bg-white rounded-4 border mb-4 overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                        <div className="px-4 py-4 border-bottom d-flex align-items-center gap-3" style={{ background: '#f8fafc' }}>
                            <FaSignOutAlt size={14} style={{ color: '#6366f1' }} />
                            <div>
                                <div className="fw-bold text-dark" style={{ fontSize: '0.93rem' }}>Active Session</div>
                                <small className="text-muted" style={{ fontSize: '0.78rem' }}>You're currently logged in on this device</small>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="d-flex align-items-center justify-content-between p-3 rounded-3 border" style={{ background: '#f8fafc' }}>
                                <div className="d-flex align-items-center gap-3">
                                    <div className="d-flex align-items-center justify-content-center"
                                        style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', border: '1px solid #6ee7b7' }}>
                                        <FaCheckCircle size={14} style={{ color: '#10b981' }} />
                                    </div>
                                    <div>
                                        <div className="fw-semibold text-dark" style={{ fontSize: '0.87rem' }}>Current session</div>
                                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                            Logged in as <strong>{user.userEmail}</strong> &nbsp;·&nbsp; {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}
                                        </small>
                                    </div>
                                </div>
                                <button onClick={handleLogout}
                                    className="btn btn-sm fw-medium"
                                    style={{ borderRadius: '8px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', fontSize: '0.8rem', padding: '6px 14px' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}>
                                    Sign out
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── Danger Zone ── */}
                    <div className="bg-white rounded-4 border overflow-hidden" style={{ borderColor: '#fca5a5', boxShadow: '0 1px 4px rgba(239,68,68,0.08)' }}>
                        <div className="px-4 py-4 border-bottom d-flex align-items-center gap-3" style={{ background: '#fef2f2', borderColor: '#fca5a5' }}>
                            <FaExclamationTriangle size={14} style={{ color: '#ef4444' }} />
                            <div>
                                <div className="fw-bold" style={{ color: '#991b1b', fontSize: '0.93rem' }}>Danger Zone</div>
                                <small style={{ color: '#b91c1c', fontSize: '0.78rem' }}>These actions are permanent and cannot be undone</small>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="d-flex align-items-start justify-content-between gap-4 flex-wrap">
                                <div>
                                    <div className="fw-semibold text-dark mb-1" style={{ fontSize: '0.88rem' }}>Delete Account</div>
                                    <small className="text-muted" style={{ fontSize: '0.78rem' }}>Permanently delete your account. All personal data will be anonymised and complaints will be retained for civic records.</small>
                                </div>
                                <button
                                    onClick={() => setShowDelete(true)}
                                    className="btn btn-sm fw-bold flex-shrink-0"
                                    style={{ borderRadius: '8px', background: '#fef2f2', color: '#ef4444', border: '1.5px solid #fca5a5', fontSize: '0.8rem', padding: '7px 16px', whiteSpace: 'nowrap' }}>
                                    Delete Account
                                </button>
                            </div>

                            <AnimatePresence>
                                {showDelete && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        className="mt-4 p-4 rounded-3 border"
                                        style={{ background: '#fef2f2', borderColor: '#fca5a5' }}
                                    >
                                        <p className="fw-semibold text-danger mb-2" style={{ fontSize: '0.87rem' }}>
                                            Type <strong>DELETE</strong> to confirm account deletion
                                        </p>
                                        <input
                                            type="text"
                                            className="form-control shadow-none mb-3"
                                            placeholder='Type "DELETE"'
                                            value={deleteInput}
                                            onChange={e => setDeleteInput(e.target.value)}
                                            style={{ borderRadius: '8px', border: '1.5px solid #fca5a5', fontSize: '0.87rem' }}
                                        />
                                        <div className="d-flex gap-2">
                                            <button
                                                disabled={deleteInput !== 'DELETE'}
                                                className="btn btn-sm fw-bold px-4"
                                                style={{ borderRadius: '8px', background: deleteInput === 'DELETE' ? '#ef4444' : '#e2e8f0', color: deleteInput === 'DELETE' ? 'white' : '#94a3b8', border: 'none', fontSize: '0.83rem' }}
                                                onClick={() => notify('info', 'Account deletion is not available yet — contact support.')}>
                                                Confirm Delete
                                            </button>
                                            <button onClick={() => { setShowDelete(false); setDeleteInput(''); }}
                                                className="btn btn-sm fw-medium px-4"
                                                style={{ borderRadius: '8px', background: 'white', border: '1px solid #e2e8f0', fontSize: '0.83rem' }}>
                                                Cancel
                                            </button>
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
