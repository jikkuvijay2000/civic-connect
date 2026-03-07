import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaGift, FaPlus, FaTimes, FaTrash, FaCopy, FaCheck,
    FaToggleOn, FaToggleOff, FaStar, FaUsers,
    FaEye, FaEyeSlash, FaUpload, FaTag, FaEdit,
    FaEnvelope, FaMapMarkerAlt, FaCalendarAlt, FaChevronRight
} from 'react-icons/fa';
import api from '../api/axios';
import { notify } from '../utils/notify';

const fmt = (n) => Number(n).toLocaleString();

/* ── Promo Code Cell ── */
const PromoCodeCell = ({ code }) => {
    const [copied, setCopied] = useState(false);
    const [visible, setVisible] = useState(false);
    return (
        <div className="d-flex align-items-center gap-2">
            <span className="fw-bold px-3 py-1 rounded-2" style={{
                fontFamily: 'monospace', fontSize: '0.85rem', background: '#1e293b',
                color: visible ? '#f59e0b' : 'transparent', letterSpacing: '0.12em',
                filter: visible ? 'none' : 'blur(5px)', transition: 'all 0.25s',
                userSelect: visible ? 'text' : 'none', cursor: 'default',
            }}>{code}</span>
            <button onClick={() => setVisible(v => !v)} className="btn btn-sm p-1 border-0" style={{ color: '#64748b' }}>
                {visible ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
            </button>
            {visible && (
                <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="btn btn-sm p-1 border-0" style={{ color: copied ? '#10b981' : '#6366f1' }}>
                    {copied ? <FaCheck size={13} /> : <FaCopy size={13} />}
                </button>
            )}
        </div>
    );
};

/* ── Claimants Drawer ── */
const ClaimantsDrawer = ({ reward, onClose }) => {
    const [claimants, setClaimants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get(`/reward/${reward._id}/claimants`);
                if (res.data.status === 'success') setClaimants(res.data.data);
            } catch { notify('error', 'Failed to load claimants'); }
            finally { setLoading(false); }
        })();
    }, [reward._id]);

    const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="position-fixed top-0 end-0 h-100 d-flex flex-column"
            style={{ width: '460px', background: 'white', zIndex: 999, boxShadow: '-8px 0 40px rgba(0,0,0,0.14)', borderLeft: '1px solid #e2e8f0' }}
        >
            {/* Header */}
            <div className="px-5 py-4 border-bottom flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', position: 'sticky', top: 0 }}>
                <div className="d-flex align-items-center justify-content-between mb-1">
                    <div className="d-flex align-items-center gap-2">
                        <FaUsers size={16} style={{ color: '#6ee7b7' }} />
                        <h6 className="fw-bold mb-0" style={{ color: 'white' }}>Claimants</h6>
                    </div>
                    <button onClick={onClose} className="btn btn-sm d-flex align-items-center justify-content-center border-0"
                        style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                        <FaTimes size={13} />
                    </button>
                </div>
                <p className="mb-0" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }}>
                    {reward.title} &nbsp;·&nbsp;
                    <span style={{ color: '#fbbf24', fontWeight: 600 }}>
                        <FaStar size={9} className="me-1" />{fmt(reward.pointsRequired)} pts
                    </span>
                </p>
            </div>

            {/* Count pill */}
            {!loading && (
                <div className="px-5 py-3 border-bottom" style={{ background: '#f8fafc' }}>
                    <span className="badge rounded-pill px-3 py-2 fw-bold d-inline-flex align-items-center gap-2"
                        style={{ background: '#eef2ff', color: '#6366f1', border: '1px solid #a5b4fc', fontSize: '0.8rem' }}>
                        <FaUsers size={11} /> {claimants.length} {claimants.length === 1 ? 'person' : 'people'} claimed
                    </span>
                </div>
            )}

            {/* List */}
            <div className="flex-grow-1 overflow-auto px-4 py-3" style={{ scrollbarWidth: 'none' }}>
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center py-5">
                        <div className="spinner-border" style={{ color: '#6366f1' }} role="status" />
                    </div>
                ) : claimants.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center py-5">
                        <FaUsers size={36} style={{ color: '#e2e8f0', marginBottom: '12px' }} />
                        <p className="fw-bold text-dark mb-1 small">No Claims Yet</p>
                        <p className="text-muted" style={{ fontSize: '0.8rem' }}>No one has claimed this reward yet.</p>
                    </motion.div>
                ) : (
                    <div className="d-flex flex-column gap-2 py-1">
                        {claimants.map((c, idx) => (
                            <motion.div
                                key={c.claimId}
                                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white rounded-4 border p-3"
                                style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
                            >
                                <div className="d-flex align-items-start gap-3">
                                    {/* Avatar */}
                                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                        style={{ width: '40px', height: '40px', background: '#eef2ff', color: '#6366f1', fontSize: '0.95rem', border: '2px solid #a5b4fc' }}>
                                        {c.user?.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-grow-1 min-width-0">
                                        <p className="fw-bold text-dark mb-1 text-truncate" style={{ fontSize: '0.9rem' }}>
                                            {c.user?.name || 'Unknown User'}
                                        </p>
                                        <div className="d-flex flex-column gap-1">
                                            <span className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.77rem' }}>
                                                <FaEnvelope size={10} style={{ color: '#6366f1', flexShrink: 0 }} />
                                                <span className="text-truncate">{c.user?.email || '—'}</span>
                                            </span>
                                            {c.user?.address && (
                                                <span className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.77rem' }}>
                                                    <FaMapMarkerAlt size={10} style={{ color: '#10b981', flexShrink: 0 }} />
                                                    <span className="text-truncate">{c.user.address}</span>
                                                </span>
                                            )}
                                            <span className="d-flex align-items-center gap-2" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                                <FaCalendarAlt size={9} style={{ flexShrink: 0 }} />
                                                {fmtDate(c.claimedAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="badge rounded-pill px-2 py-1 flex-shrink-0"
                                        style={{ background: '#ecfdf5', color: '#10b981', border: '1px solid #a7f3d0', fontSize: '0.65rem', fontWeight: 700 }}>
                                        <FaCheck size={8} className="me-1" /> Claimed
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

/* ── Reward Card ── */
const RewardCard = ({ reward, onDelete, onToggle, onEdit, onViewClaimants }) => {
    const [deleting, setDeleting] = useState(false);
    const handleDelete = async () => {
        if (!window.confirm(`Delete "${reward.title}"? This cannot be undone.`)) return;
        setDeleting(true);
        try { await onDelete(reward._id); } finally { setDeleting(false); }
    };

    return (
        <motion.div layout initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94, y: -10 }} transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="bg-white rounded-4 border overflow-hidden"
            style={{ boxShadow: reward.isActive ? '0 4px 20px rgba(99,102,241,0.10)' : '0 2px 8px rgba(0,0,0,0.04)', opacity: reward.isActive ? 1 : 0.6, transition: 'box-shadow 0.2s, opacity 0.2s' }}
        >
            {/* Image */}
            <div className="position-relative overflow-hidden"
                style={{ height: '170px', background: reward.image ? 'transparent' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)' }}>
                {reward.image ? <img src={reward.image} alt={reward.title} className="w-100 h-100 object-fit-cover" />
                    : <div className="w-100 h-100 d-flex align-items-center justify-content-center"><FaGift size={52} style={{ color: 'rgba(255,255,255,0.4)' }} /></div>}
                <div className="position-absolute d-flex align-items-center gap-1 px-3 py-1 rounded-pill fw-bold"
                    style={{ top: '12px', right: '12px', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', color: '#fbbf24', fontSize: '0.8rem', border: '1px solid rgba(251,191,36,0.3)' }}>
                    <FaStar size={10} /> {fmt(reward.pointsRequired)} pts
                </div>
                <button onClick={() => onToggle(reward._id)}
                    className="position-absolute d-flex align-items-center gap-1 px-2 py-1 rounded-pill border-0 fw-bold"
                    style={{ top: '12px', left: '12px', background: reward.isActive ? 'rgba(16,185,129,0.9)' : 'rgba(100,116,139,0.9)', color: 'white', fontSize: '0.68rem', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                    {reward.isActive ? <><FaToggleOn size={12} /> Active</> : <><FaToggleOff size={12} /> Inactive</>}
                </button>
            </div>

            {/* Body */}
            <div className="p-4">
                <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                    <h6 className="fw-bold text-dark mb-0" style={{ fontSize: '0.97rem' }}>{reward.title}</h6>
                    <div className="d-flex align-items-center gap-1 flex-shrink-0">
                        <button onClick={() => onEdit(reward)} className="btn btn-sm d-flex align-items-center justify-content-center border-0"
                            style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#eef2ff', color: '#6366f1' }} title="Edit">
                            <FaEdit size={11} />
                        </button>
                        <button onClick={handleDelete} disabled={deleting} className="btn btn-sm d-flex align-items-center justify-content-center border-0"
                            style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#fef2f2', color: '#ef4444' }} title="Delete">
                            {deleting ? <span className="spinner-border spinner-border-sm" /> : <FaTrash size={11} />}
                        </button>
                    </div>
                </div>
                <p className="text-muted mb-3" style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>
                    {reward.description.length > 100 ? reward.description.slice(0, 100) + '…' : reward.description}
                </p>

                {/* Promo row */}
                <div className="mb-3 p-3 rounded-3" style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <FaTag size={10} style={{ color: '#64748b' }} />
                        <small className="text-uppercase fw-bold" style={{ fontSize: '0.6rem', color: '#475569', letterSpacing: '0.1em' }}>Promo Code</small>
                    </div>
                    <PromoCodeCell code={reward.promoCode} />
                </div>

                {/* Stats + view claimants */}
                <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                        <span className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.76rem' }}>
                            <FaUsers size={11} style={{ color: '#6366f1' }} />
                            <strong style={{ color: '#6366f1' }}>{reward.claimCount}</strong> claimed
                        </span>
                        <span className="d-flex align-items-center gap-1 text-muted" style={{ fontSize: '0.76rem' }}>
                            <FaStar size={10} style={{ color: '#f59e0b' }} /> {fmt(reward.pointsRequired)} pts
                        </span>
                    </div>
                    {reward.claimCount > 0 && (
                        <button onClick={() => onViewClaimants(reward)}
                            className="btn btn-sm fw-bold d-flex align-items-center gap-1 border-0"
                            style={{ fontSize: '0.74rem', color: '#6366f1', background: '#eef2ff', borderRadius: '8px', padding: '4px 10px' }}>
                            View all <FaChevronRight size={9} />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

/* ── Add / Edit Reward Slide-in Panel ── */
const RewardPanel = ({ onClose, onSaved, editReward }) => {
    const isEdit = !!editReward;
    const [form, setForm] = useState({ title: editReward?.title || '', description: editReward?.description || '', pointsRequired: editReward?.pointsRequired || '', promoCode: editReward?.promoCode || '' });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(editReward?.image || '');
    const [saving, setSaving] = useState(false);
    const fileRef = useRef();

    const accentColor = isEdit ? '#f59e0b' : '#6366f1';
    const accentGradient = isEdit ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #6366f1, #4f46e5)';
    const inputStyle = { borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', padding: '10px 14px', transition: 'border-color 0.15s', outline: 'none' };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.description || !form.pointsRequired || !form.promoCode) { notify('warning', 'Please fill in all fields'); return; }
        setSaving(true);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => fd.append(k, v));
            if (imageFile) fd.append('image', imageFile);
            if (isEdit) { await api.put(`/reward/${editReward._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); notify('success', 'Reward updated!'); }
            else { await api.post('/reward/create', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); notify('success', 'Reward created!'); }
            onSaved();
        } catch (err) { notify('error', err?.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    return (
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="position-fixed top-0 end-0 h-100 overflow-auto"
            style={{ width: '440px', background: 'white', zIndex: 999, boxShadow: '-8px 0 40px rgba(0,0,0,0.14)', borderLeft: '1px solid #e2e8f0' }}>
            <div className="px-5 py-4 d-flex align-items-center justify-content-between border-bottom" style={{ background: accentGradient, position: 'sticky', top: 0, zIndex: 1 }}>
                <div>
                    <h6 className="fw-bold mb-0" style={{ color: 'white' }}>{isEdit ? 'Edit Reward' : 'Create Reward'}</h6>
                    <small style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.76rem' }}>{isEdit ? `Editing: ${editReward.title}` : 'Add a new gift card reward'}</small>
                </div>
                <button onClick={onClose} className="btn btn-sm d-flex align-items-center justify-content-center border-0"
                    style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                    <FaTimes size={14} />
                </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5">
                {/* Image */}
                <div className="mb-4">
                    <label className="fw-bold text-muted text-uppercase mb-2 d-block" style={{ fontSize: '0.68rem', letterSpacing: '0.1em' }}>Reward Image</label>
                    <div onClick={() => fileRef.current.click()} className="rounded-4 d-flex align-items-center justify-content-center overflow-hidden"
                        style={{ height: '160px', cursor: 'pointer', border: '2px dashed #e2e8f0', background: imagePreview ? 'transparent' : '#f8fafc', transition: 'border-color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = accentColor}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}>
                        {imagePreview ? <img src={imagePreview} alt="Preview" className="w-100 h-100 object-fit-cover" />
                            : <div className="text-center"><FaUpload size={24} style={{ color: '#94a3b8', marginBottom: '8px' }} /><p className="text-muted mb-0" style={{ fontSize: '0.82rem' }}>Click to upload</p></div>}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" className="d-none" onChange={e => { const f = e.target.files[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} />
                    {imagePreview && <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); }} className="btn btn-sm mt-2 border-0 d-flex align-items-center gap-1" style={{ fontSize: '0.77rem', background: '#fef2f2', borderRadius: '8px', color: '#ef4444' }}><FaTimes size={10} /> Remove</button>}
                </div>
                {/* Fields */}
                {[
                    { label: 'Title', key: 'title', type: 'text', placeholder: 'e.g. 50% Off Gift Card' },
                ].map(f => (
                    <div className="mb-3" key={f.key}>
                        <label className="fw-bold text-muted text-uppercase mb-2 d-block" style={{ fontSize: '0.68rem', letterSpacing: '0.1em' }}>{f.label}</label>
                        <input type={f.type} className="form-control shadow-none" style={inputStyle} placeholder={f.placeholder}
                            value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                            onFocus={e => e.target.style.borderColor = accentColor} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    </div>
                ))}
                <div className="mb-3">
                    <label className="fw-bold text-muted text-uppercase mb-2 d-block" style={{ fontSize: '0.68rem', letterSpacing: '0.1em' }}>Description</label>
                    <textarea className="form-control shadow-none" rows={3} style={{ ...inputStyle, resize: 'none' }} placeholder="Describe the reward and terms..."
                        value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                        onFocus={e => e.target.style.borderColor = accentColor} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
                <div className="mb-3">
                    <label className="fw-bold text-muted text-uppercase mb-2 d-block" style={{ fontSize: '0.68rem', letterSpacing: '0.1em' }}>Points Required</label>
                    <div className="input-group">
                        <span className="input-group-text bg-white border-end-0 fw-bold" style={{ borderRadius: '12px 0 0 12px', border: '1.5px solid #e2e8f0', color: '#f59e0b' }}><FaStar size={13} /></span>
                        <input type="number" min="1" className="form-control shadow-none border-start-0" style={{ ...inputStyle, borderRadius: '0 12px 12px 0' }} placeholder="e.g. 100"
                            value={form.pointsRequired} onChange={e => setForm(p => ({ ...p, pointsRequired: e.target.value }))}
                            onFocus={e => e.target.style.borderColor = accentColor} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    </div>
                    <small className="text-muted mt-1 d-block" style={{ fontSize: '0.74rem' }}>Formula: (Reports × 10) + (Resolved × 20)</small>
                </div>
                <div className="mb-5">
                    <label className="fw-bold text-muted text-uppercase mb-2 d-block" style={{ fontSize: '0.68rem', letterSpacing: '0.1em' }}>Promo Code</label>
                    <div className="input-group">
                        <span className="input-group-text bg-white border-end-0" style={{ borderRadius: '12px 0 0 12px', border: '1.5px solid #e2e8f0' }}><FaTag size={12} style={{ color: '#64748b' }} /></span>
                        <input type="text" className="form-control shadow-none border-start-0" style={{ ...inputStyle, borderRadius: '0 12px 12px 0', fontFamily: 'monospace', letterSpacing: '0.1em' }} placeholder="e.g. CIVIC50"
                            value={form.promoCode} onChange={e => setForm(p => ({ ...p, promoCode: e.target.value.toUpperCase() }))}
                            onFocus={e => e.target.style.borderColor = accentColor} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    </div>
                    <small className="text-muted mt-1 d-block" style={{ fontSize: '0.74rem' }}>Sent via email when a citizen claims this reward.</small>
                </div>
                <button type="submit" disabled={saving} className="btn w-100 fw-bold py-3 rounded-3 d-flex align-items-center justify-content-center gap-2"
                    style={{ background: accentGradient, color: 'white', border: 'none', fontSize: '0.95rem', boxShadow: `0 6px 20px ${isEdit ? 'rgba(245,158,11,0.35)' : 'rgba(99,102,241,0.35)'}`, transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                    {saving ? <><span className="spinner-border spinner-border-sm" /> {isEdit ? 'Saving…' : 'Creating…'}</>
                        : isEdit ? <><FaEdit size={14} /> Save Changes</> : <><FaGift size={15} /> Create Reward</>}
                </button>
            </form>
        </motion.div>
    );
};

/* ── Main Page ── */
const AuthorityRewards = () => {
    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [panelOpen, setPanelOpen] = useState(false);
    const [editingReward, setEditingReward] = useState(null);
    const [claimantsReward, setClaimantsReward] = useState(null); // which reward's claimants to show

    const fetchRewards = async () => {
        try {
            const res = await api.get('/reward/authority-list');
            if (res.data.status === 'success') setRewards(res.data.data);
        } catch { notify('error', 'Failed to load rewards'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchRewards(); }, []);

    const openCreate = () => { setClaimantsReward(null); setEditingReward(null); setPanelOpen(true); };
    const openEdit = (r) => { setClaimantsReward(null); setEditingReward(r); setPanelOpen(true); };
    const closePanel = () => { setPanelOpen(false); setEditingReward(null); };
    const onSaved = () => { closePanel(); fetchRewards(); };
    const handleDelete = async (id) => { await api.delete(`/reward/${id}`); notify('success', 'Reward deleted'); setRewards(prev => prev.filter(r => r._id !== id)); };
    const handleToggle = async (id) => { const res = await api.patch(`/reward/${id}/toggle`); if (res.data.status === 'success') setRewards(prev => prev.map(r => r._id === id ? { ...r, isActive: res.data.data.isActive } : r)); };

    const totalClaimed = rewards.reduce((s, r) => s + (r.claimCount || 0), 0);
    const activeCount = rewards.filter(r => r.isActive).length;

    const anyDrawerOpen = panelOpen || !!claimantsReward;

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
            {/* Sticky header */}
            <div className="px-5 py-4 border-bottom" style={{ background: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h4 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2"><FaGift style={{ color: '#6366f1' }} /> Rewards Management</h4>
                        <small className="text-muted">{rewards.length} rewards &nbsp;·&nbsp; {activeCount} active &nbsp;·&nbsp; {totalClaimed} total claims</small>
                    </div>
                    <motion.button whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }} whileTap={{ scale: 0.97 }}
                        onClick={openCreate} className="btn fw-bold d-flex align-items-center gap-2 px-4 py-2"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '0.88rem', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
                        <FaPlus size={13} /> Add Reward
                    </motion.button>
                </div>
            </div>

            {/* Stats */}
            <div className="px-5 pt-4 pb-2">
                <div className="row g-3 mb-4">
                    {[
                        { label: 'Total Rewards', value: rewards.length, color: '#6366f1', bg: '#eef2ff' },
                        { label: 'Active', value: activeCount, color: '#10b981', bg: '#ecfdf5' },
                        { label: 'Inactive', value: rewards.length - activeCount, color: '#64748b', bg: '#f1f5f9' },
                        { label: 'Total Claims', value: totalClaimed, color: '#f59e0b', bg: '#fffbeb' },
                    ].map((s, i) => (
                        <div className="col-md-3" key={i}>
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                                className="bg-white rounded-4 border p-4 d-flex align-items-center gap-3" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FaGift size={18} style={{ color: s.color }} />
                                </div>
                                <div>
                                    <div className="fw-bold" style={{ fontSize: '1.5rem', color: s.color, lineHeight: 1 }}>{s.value}</div>
                                    <small className="text-muted fw-medium">{s.label}</small>
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Card grid */}
            <div className="px-5 pb-5">
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '40vh' }}>
                        <div className="spinner-border" style={{ color: '#6366f1' }} role="status"><span className="visually-hidden">Loading…</span></div>
                    </div>
                ) : rewards.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-5 bg-white rounded-4 border" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <div className="mb-3" style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                            <FaGift size={30} style={{ color: '#6366f1' }} />
                        </div>
                        <h5 className="fw-bold text-dark mb-1">No Rewards Yet</h5>
                        <p className="text-muted small mb-4">Create your first reward for citizens to claim with impact points.</p>
                        <button onClick={openCreate} className="btn fw-bold px-5 py-2" style={{ borderRadius: '12px', background: '#6366f1', color: 'white', border: 'none' }}>
                            <FaPlus size={12} className="me-2" /> Create First Reward
                        </button>
                    </motion.div>
                ) : (
                    <div className="row g-4">
                        <AnimatePresence>
                            {rewards.map(r => (
                                <div className="col-md-6 col-xl-4" key={r._id}>
                                    <RewardCard reward={r} onDelete={handleDelete} onToggle={handleToggle} onEdit={openEdit} onViewClaimants={(rw) => { setPanelOpen(false); setClaimantsReward(rw); }} />
                                </div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Backdrop + drawers */}
            <AnimatePresence>
                {anyDrawerOpen && (
                    <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => { closePanel(); setClaimantsReward(null); }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 998 }} />
                )}
                {panelOpen && (
                    <RewardPanel key={editingReward?._id || 'new'} editReward={editingReward} onClose={closePanel} onSaved={onSaved} />
                )}
                {claimantsReward && (
                    <ClaimantsDrawer key={claimantsReward._id + '-claimants'} reward={claimantsReward} onClose={() => setClaimantsReward(null)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AuthorityRewards;
