import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaGift, FaPlus, FaTimes, FaTrash, FaCopy, FaCheck,
    FaToggleOn, FaToggleOff, FaStar, FaUsers,
    FaEye, FaEyeSlash, FaUpload, FaTag, FaEdit,
    FaEnvelope, FaMapMarkerAlt, FaCalendarAlt, FaChevronRight, FaTerminal
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
            <span className="fw-bold px-3 py-1 text-uppercase tech-font" style={{
                fontSize: '0.85rem', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--primary-color)',
                color: visible ? 'var(--neon-green)' : 'transparent', letterSpacing: '0.15em',
                filter: visible ? 'none' : 'blur(5px)', transition: 'all 0.25s',
                userSelect: visible ? 'text' : 'none', cursor: 'default', boxShadow: visible ? 'inset 0 0 10px rgba(16,185,129,0.2)' : 'none'
            }}>{code}</span>
            <button onClick={() => setVisible(v => !v)} className="btn btn-sm p-1 border-0 hover-scale" style={{ color: 'var(--text-muted)' }}>
                {visible ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
            </button>
            {visible && (
                <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="btn btn-sm p-1 border-0 hover-scale" style={{ color: copied ? 'var(--neon-green)' : 'var(--primary-color)' }}>
                    {copied ? <FaCheck size={14} /> : <FaCopy size={14} />}
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
            } catch { notify('error', 'SYSTEM ERROR: FAILED TO LOAD CLAIMANTS'); }
            finally { setLoading(false); }
        })();
    }, [reward._id]);

    const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="position-fixed top-0 end-0 h-100 d-flex flex-column"
            style={{ width: '460px', background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)', zIndex: 999, boxShadow: '-10px 0 40px rgba(170,0,255,0.1)', borderLeft: '1px solid var(--primary-color)' }}
        >
            {/* Header */}
            <div className="px-5 py-4 border-bottom flex-shrink-0"
                style={{ background: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1) !important', position: 'sticky', top: 0 }}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center justify-content-center border" style={{ width: '36px', height: '36px', background: 'rgba(16,185,129,0.1)', borderColor: 'var(--neon-green) !important', color: 'var(--neon-green)', boxShadow: '0 0 10px rgba(16,185,129,0.2)' }}>
                            <FaUsers size={16} />
                        </div>
                        <h6 className="fw-bold mb-0 text-white tech-font text-uppercase tracking-widest">CLAIMANT_REGISTRY</h6>
                    </div>
                    <button onClick={onClose} className="btn d-flex align-items-center justify-content-center border border-secondary text-secondary hover-bg-light"
                        style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                        <FaTimes size={14} />
                    </button>
                </div>
                <p className="mb-0 font-monospace text-uppercase" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                    [ REWARD_ID: <span className="text-white">{reward.title}</span> ] &nbsp;//&nbsp; 
                    <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                        <FaStar size={10} className="me-1" />{fmt(reward.pointsRequired)} PTS
                    </span>
                </p>
            </div>

            {/* Count pill */}
            {!loading && (
                <div className="px-5 py-3 border-bottom" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05) !important' }}>
                    <span className="badge px-3 py-2 fw-bold d-inline-flex align-items-center gap-2 tech-font text-uppercase tracking-widest"
                        style={{ background: 'rgba(170,0,255,0.1)', color: 'var(--primary-color)', border: '1px solid var(--primary-color)', fontSize: '0.75rem' }}>
                        <FaUsers size={12} /> {claimants.length} OPERATIVE{claimants.length !== 1 ? 'S' : ''} DETECTED
                    </span>
                </div>
            )}

            {/* List */}
            <div className="flex-grow-1 overflow-auto px-4 py-4 custom-scrollbar">
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center py-5">
                        <div className="spinner-border text-primary" role="status" />
                    </div>
                ) : claimants.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center py-5 border border-secondary" style={{ background: 'rgba(0,0,0,0.3)' }}>
                        <FaUsers size={36} className="text-secondary opacity-50 mb-3" />
                        <p className="fw-bold text-white tech-font text-uppercase tracking-widest mb-1">NO CLAIMS DETECTED</p>
                        <p className="text-muted font-monospace" style={{ fontSize: '0.75rem' }}>// REGISTRY REMAINS EMPTY.</p>
                    </motion.div>
                ) : (
                    <div className="d-flex flex-column gap-3 py-1">
                        {claimants.map((c, idx) => (
                            <motion.div
                                key={c.claimId}
                                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="glass-card p-3 d-flex align-items-start gap-3 hover-scale"
                                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                {/* Avatar */}
                                <div className="d-flex align-items-center justify-content-center fw-bold flex-shrink-0 tech-font border"
                                    style={{ width: '42px', height: '42px', background: 'rgba(170,0,255,0.1)', color: 'var(--primary-color)', fontSize: '1rem', borderColor: 'var(--primary-color) !important', boxShadow: '0 0 10px rgba(170,0,255,0.2)' }}>
                                    {c.user?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="flex-grow-1 min-width-0">
                                    <p className="fw-bold text-white font-monospace text-uppercase mb-1 text-truncate" style={{ fontSize: '0.85rem' }}>
                                        {c.user?.name || 'UNKNOWN OPERATIVE'}
                                    </p>
                                    <div className="d-flex flex-column gap-1">
                                        <span className="d-flex align-items-center gap-2 text-muted font-monospace" style={{ fontSize: '0.7rem' }}>
                                            <FaEnvelope size={10} className="text-primary flex-shrink-0" />
                                            <span className="text-truncate">{c.user?.email || '—'}</span>
                                        </span>
                                        {c.user?.address && (
                                            <span className="d-flex align-items-center gap-2 text-muted font-monospace" style={{ fontSize: '0.7rem' }}>
                                                <FaMapMarkerAlt size={10} className="text-neon-green flex-shrink-0" />
                                                <span className="text-truncate">{c.user.address}</span>
                                            </span>
                                        )}
                                        <span className="d-flex align-items-center gap-2 text-secondary font-monospace" style={{ fontSize: '0.65rem' }}>
                                            <FaCalendarAlt size={9} className="flex-shrink-0" />
                                            {fmtDate(c.claimedAt)}
                                        </span>
                                    </div>
                                </div>
                                <span className="badge px-2 py-1 flex-shrink-0 tech-font text-uppercase"
                                    style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--neon-green)', border: '1px solid var(--neon-green)', fontSize: '0.65rem', letterSpacing: '0.1em', boxShadow: '0 0 5px rgba(16,185,129,0.2)' }}>
                                    <FaCheck size={8} className="me-1" /> SECURED
                                </span>
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
        if (!window.confirm(`TERMINATE "${reward.title}"? THIS CANNOT BE UNDONE.`)) return;
        setDeleting(true);
        try { await onDelete(reward._id); } finally { setDeleting(false); }
    };

    return (
        <motion.div layout initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94, y: -10 }} transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="glass-card overflow-hidden position-relative"
            style={{ border: reward.isActive ? '1px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.1)', opacity: reward.isActive ? 1 : 0.6, transition: 'all 0.3s', boxShadow: reward.isActive ? '0 0 15px rgba(170,0,255,0.15)' : 'none' }}
        >
            {/* Background Grid */}
            <div className="position-absolute top-0 start-0 w-100 h-100 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '15px 15px', zIndex: 0 }}></div>

            {/* Image */}
            <div className="position-relative overflow-hidden z-1"
                style={{ height: '180px', background: reward.image ? 'transparent' : 'rgba(0,0,0,0.8)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {reward.image ? <img src={reward.image} alt={reward.title} className="w-100 h-100 object-fit-cover" style={{ filter: reward.isActive ? 'contrast(1.1)' : 'grayscale(1)' }} />
                    : <div className="w-100 h-100 d-flex align-items-center justify-content-center"><FaGift size={48} className="text-secondary opacity-50" /></div>}
                
                <div className="position-absolute top-0 start-0 w-100 h-100 pointer-events-none" style={{ background: reward.isActive ? 'rgba(170,0,255,0.1)' : 'rgba(0,0,0,0.5)' }}></div>
                
                <div className="position-absolute d-flex align-items-center gap-1 px-3 py-1 font-monospace fw-bold"
                    style={{ top: '12px', right: '12px', background: 'rgba(0,0,0,0.8)', color: '#f59e0b', fontSize: '0.75rem', border: '1px solid #f59e0b', boxShadow: '0 0 10px rgba(245,158,11,0.2)' }}>
                    <FaStar size={10} /> {fmt(reward.pointsRequired)} PTS
                </div>
                
                <button onClick={() => onToggle(reward._id)}
                    className="position-absolute d-flex align-items-center gap-2 px-3 py-1 border-0 tech-font text-uppercase hover-scale"
                    style={{ top: '12px', left: '12px', background: reward.isActive ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)', border: `1px solid ${reward.isActive ? 'var(--neon-green)' : 'var(--text-muted)'} !important`, color: reward.isActive ? 'var(--neon-green)' : 'var(--text-muted)', fontSize: '0.7rem', cursor: 'pointer', backdropFilter: 'blur(4px)', letterSpacing: '0.1em' }}>
                    {reward.isActive ? <><FaToggleOn size={14} /> ONLINE</> : <><FaToggleOff size={14} /> STANDBY</>}
                </button>
            </div>

            {/* Body */}
            <div className="p-4 z-1 position-relative">
                <div className="d-flex align-items-start justify-content-between gap-3 mb-2">
                    <h6 className="fw-bold text-white font-monospace text-uppercase lh-sm" style={{ fontSize: '0.9rem' }}>{reward.title}</h6>
                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                        <button onClick={() => onEdit(reward)} className="btn d-flex align-items-center justify-content-center border border-primary hover-scale transition-all"
                            style={{ width: '32px', height: '32px', background: 'rgba(170,0,255,0.1)', color: 'var(--primary-color)' }} title="MODIFY">
                            <FaEdit size={12} />
                        </button>
                        <button onClick={handleDelete} disabled={deleting} className="btn d-flex align-items-center justify-content-center border border-danger hover-scale transition-all"
                            style={{ width: '32px', height: '32px', background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)' }} title="TERMINATE">
                            {deleting ? <span className="spinner-border spinner-border-sm" /> : <FaTrash size={12} />}
                        </button>
                    </div>
                </div>
                <p className="text-secondary font-monospace" style={{ fontSize: '0.75rem', lineHeight: '1.6' }}>
                    {reward.description.length > 90 ? reward.description.slice(0, 90) + '[...]' : reward.description}
                </p>

                {/* Promo row */}
                <div className="mb-4 p-3 border" style={{ background: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.05) !important' }}>
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <FaTerminal size={10} className="text-secondary" />
                        <small className="tech-font text-uppercase text-muted tracking-widest" style={{ fontSize: '0.65rem' }}>ENCRYPTED_KEY</small>
                    </div>
                    <PromoCodeCell code={reward.promoCode} />
                </div>

                {/* Stats + view claimants */}
                <div className="d-flex align-items-center justify-content-between border-top pt-3" style={{ borderColor: 'rgba(255,255,255,0.1) !important' }}>
                    <div className="d-flex align-items-center gap-4">
                        <span className="d-flex align-items-center gap-2 text-muted tech-font text-uppercase tracking-widest" style={{ fontSize: '0.7rem' }}>
                            <FaUsers size={12} className="text-primary" />
                            <span className="text-white fw-bold">{reward.claimCount}</span> LOADED
                        </span>
                        <span className="d-flex align-items-center gap-2 text-muted tech-font text-uppercase tracking-widest" style={{ fontSize: '0.7rem' }}>
                            <FaStar size={11} style={{ color: '#f59e0b' }} /> <span className="text-white fw-bold">{fmt(reward.pointsRequired)}</span>
                        </span>
                    </div>
                    {reward.claimCount > 0 && (
                        <button onClick={() => onViewClaimants(reward)}
                            className="btn btn-sm fw-bold d-flex align-items-center gap-2 border border-primary tech-font text-uppercase hover-scale"
                            style={{ fontSize: '0.7rem', color: 'var(--primary-color)', background: 'rgba(170,0,255,0.1)', letterSpacing: '0.1em' }}>
                            EXTRACT <FaChevronRight size={10} />
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

    const accentColor = isEdit ? '#f59e0b' : 'var(--primary-color)';
    const accentClass = isEdit ? 'text-warning' : 'text-primary';
    const inputStyle = { background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem', padding: '12px 16px', transition: 'all 0.2s', outline: 'none', fontFamily: 'Share Tech Mono' };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.description || !form.pointsRequired || !form.promoCode) { notify('warning', 'SYS ERROR: ALL PARAMETERS REQUIRED.'); return; }
        setSaving(true);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => fd.append(k, v));
            if (imageFile) fd.append('image', imageFile);
            if (isEdit) { await api.put(`/reward/${editReward._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); notify('success', 'REWARD REGISTRY UPDATED.'); }
            else { await api.post('/reward/create', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); notify('success', 'NEW REWARD INITIALIZED.'); }
            onSaved();
        } catch (err) { notify('error', err?.response?.data?.message || 'TRANSACTION FAILED'); }
        finally { setSaving(false); }
    };

    return (
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="position-fixed top-0 end-0 h-100 overflow-auto form-scrollbar"
            style={{ width: '460px', background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)', zIndex: 999, boxShadow: '-10px 0 40px rgba(0,0,0,0.8)', borderLeft: '1px solid var(--primary-color)' }}>
            
            <div className="px-5 py-4 d-flex align-items-center justify-content-between border-bottom" style={{ background: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1) !important', position: 'sticky', top: 0, zIndex: 10 }}>
                <div className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center justify-content-center border" style={{ width: '36px', height: '36px', background: isEdit ? 'rgba(245,158,11,0.1)' : 'rgba(170,0,255,0.1)', borderColor: `${accentColor} !important`, color: accentColor, boxShadow: `0 0 10px ${accentColor}` }}>
                        {isEdit ? <FaEdit size={16} /> : <FaPlus size={16} />}
                    </div>
                    <div>
                        <h6 className="fw-bold mb-1 text-white tech-font text-uppercase tracking-widest">{isEdit ? 'MODIFY_REWARD' : 'INITIALIZE_REWARD'}</h6>
                        <small className="font-monospace text-muted" style={{ fontSize: '0.7rem' }}>{isEdit ? `ID: ${editReward.title}` : 'DEFINE NEW PARAMETERS'}</small>
                    </div>
                </div>
                <button onClick={onClose} className="btn border border-secondary text-secondary hover-bg-light d-flex align-items-center justify-content-center"
                    style={{ width: '36px', height: '36px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
                    <FaTimes size={14} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5">
                {/* Image */}
                <div className="mb-4">
                    <label className="fw-bold text-secondary tech-font text-uppercase mb-2 d-flex align-items-center gap-2" style={{ fontSize: '0.7rem', letterSpacing: '0.15em' }}><FaTerminal size={10} /> VISUAL_ASSET</label>
                    <div onClick={() => fileRef.current.click()} className="d-flex align-items-center justify-content-center overflow-hidden position-relative hover-scale cursor-pointer"
                        style={{ height: '180px', border: '1px dashed rgba(255,255,255,0.2)', background: imagePreview ? 'transparent' : 'rgba(0,0,0,0.5)', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.boxShadow = `inset 0 0 20px ${isEdit ? 'rgba(245,158,11,0.1)' : 'rgba(170,0,255,0.1)'}` }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.boxShadow = 'none' }}>
                        
                        <div className="position-absolute top-0 start-0 w-100 h-100 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '15px 15px', zIndex: 0 }}></div>

                        {imagePreview ? <img src={imagePreview} alt="Preview" className="w-100 h-100 object-fit-cover z-1 position-relative" style={{ filter: 'contrast(1.1)' }} />
                            : <div className="text-center z-1 position-relative"><FaUpload size={28} className="text-secondary opacity-50 mb-3" /><p className="tech-font text-muted mb-0 tracking-widest text-uppercase" style={{ fontSize: '0.75rem' }}>CLICK TO UPLOAD</p></div>}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" className="d-none" onChange={e => { const f = e.target.files[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} />
                    {imagePreview && <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); }} className="btn btn-sm mt-3 border border-danger text-accent-red hover-scale d-flex align-items-center gap-2 tech-font text-uppercase" style={{ fontSize: '0.7rem', background: 'rgba(239,68,68,0.1)' }}><FaTimes size={10} /> PURGE ASSET</button>}
                </div>

                {/* Fields */}
                {[
                    { label: 'IDENTIFIER', key: 'title', type: 'text', placeholder: 'e.g. 50% SUPPLY DROP' },
                ].map(f => (
                    <div className="mb-4" key={f.key}>
                        <label className="fw-bold text-secondary tech-font text-uppercase mb-2 d-flex align-items-center gap-2" style={{ fontSize: '0.7rem', letterSpacing: '0.15em' }}><FaTerminal size={10} /> {f.label}</label>
                        <input type={f.type} className="form-control" style={inputStyle} placeholder={f.placeholder}
                            value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                            onFocus={e => { e.target.style.borderColor = accentColor; e.target.style.boxShadow = `0 0 10px ${isEdit ? 'rgba(245,158,11,0.2)' : 'rgba(170,0,255,0.2)'}` }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }} />
                    </div>
                ))}

                <div className="mb-4">
                    <label className="fw-bold text-secondary tech-font text-uppercase mb-2 d-flex align-items-center gap-2" style={{ fontSize: '0.7rem', letterSpacing: '0.15em' }}><FaTerminal size={10} /> DESCRIPTION_LOG</label>
                    <textarea className="form-control text-white" rows={4} style={{ ...inputStyle, resize: 'none' }} placeholder="Detail specifications and rules of engagement..."
                        value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                        onFocus={e => { e.target.style.borderColor = accentColor; e.target.style.boxShadow = `0 0 10px ${isEdit ? 'rgba(245,158,11,0.2)' : 'rgba(170,0,255,0.2)'}` }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }} />
                </div>

                <div className="mb-4">
                    <label className="fw-bold text-secondary tech-font text-uppercase mb-2 d-flex align-items-center gap-2" style={{ fontSize: '0.7rem', letterSpacing: '0.15em' }}><FaTerminal size={10} /> REQUIRED_POINTS</label>
                    <div className="input-group">
                        <span className="input-group-text border-0" style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRight: 'none', color: '#f59e0b' }}><FaStar size={14} /></span>
                        <input type="number" min="1" className="form-control border-start-0" style={{ ...inputStyle, borderRadius: '0 4px 4px 0' }} placeholder="e.g. 100"
                            value={form.pointsRequired} onChange={e => setForm(p => ({ ...p, pointsRequired: e.target.value }))}
                            onFocus={e => { e.target.style.borderColor = accentColor; e.target.style.boxShadow = `0 0 10px ${isEdit ? 'rgba(245,158,11,0.2)' : 'rgba(170,0,255,0.2)'}` }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }} />
                    </div>
                    <small className="text-secondary font-monospace mt-2 d-block" style={{ fontSize: '0.65rem' }}>// RATE: (REPORTS × 10) + (RESOLVED × 20)</small>
                </div>

                <div className="mb-5">
                    <label className="fw-bold text-secondary tech-font text-uppercase mb-2 d-flex align-items-center gap-2" style={{ fontSize: '0.7rem', letterSpacing: '0.15em' }}><FaTerminal size={10} /> ENCRYPTED_PROMO_CODE</label>
                    <div className="input-group">
                        <span className="input-group-text border-0" style={{ background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRight: 'none' }}><FaTag size={12} className="text-secondary" /></span>
                        <input type="text" className="form-control border-start-0 text-uppercase" style={{ ...inputStyle, borderRadius: '0 4px 4px 0', letterSpacing: '0.15em' }} placeholder="e.g. ALPHA50"
                            value={form.promoCode} onChange={e => setForm(p => ({ ...p, promoCode: e.target.value.toUpperCase() }))}
                            onFocus={e => { e.target.style.borderColor = accentColor; e.target.style.boxShadow = `0 0 10px ${isEdit ? 'rgba(245,158,11,0.2)' : 'rgba(170,0,255,0.2)'}` }} onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }} />
                    </div>
                    <small className="text-secondary font-monospace mt-2 d-block" style={{ fontSize: '0.65rem' }}>// AUTO-TRANSMITTED TO OPERATIVE COM-LINK UPON ACQUISITION.</small>
                </div>

                <button type="submit" disabled={saving} className="btn w-100 fw-bold py-3 text-uppercase tech-font tracking-widest border border-primary hover-scale transition-all d-flex justify-content-center align-items-center gap-3"
                    style={{ background: isEdit ? 'rgba(245,158,11,0.2)' : 'rgba(170,0,255,0.2)', color: isEdit ? '#f59e0b' : 'var(--primary-color)', borderColor: `${accentColor} !important`, fontSize: '0.9rem', boxShadow: `0 0 20px ${isEdit ? 'rgba(245,158,11,0.2)' : 'rgba(170,0,255,0.2)'}` }}>
                    {saving ? <><span className="spinner-border spinner-border-sm" /> {isEdit ? 'UPDATING...' : 'INITIALIZING...'}</>
                        : isEdit ? <><FaEdit size={14} /> COMMIT MODIFICATION</> : <><FaTerminal size={14} /> EXECUTE CREATION</>}
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
        } catch { notify('error', 'SYSTEM ERROR: FAILED TO LOAD REWARDS'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchRewards(); }, []);

    const openCreate = () => { setClaimantsReward(null); setEditingReward(null); setPanelOpen(true); };
    const openEdit = (r) => { setClaimantsReward(null); setEditingReward(r); setPanelOpen(true); };
    const closePanel = () => { setPanelOpen(false); setEditingReward(null); };
    const onSaved = () => { closePanel(); fetchRewards(); };
    const handleDelete = async (id) => { await api.delete(`/reward/${id}`); notify('success', 'REWARD TERMINATED.'); setRewards(prev => prev.filter(r => r._id !== id)); };
    const handleToggle = async (id) => { const res = await api.patch(`/reward/${id}/toggle`); if (res.data.status === 'success') setRewards(prev => prev.map(r => r._id === id ? { ...r, isActive: res.data.data.isActive } : r)); };

    const totalClaimed = rewards.reduce((s, r) => s + (r.claimCount || 0), 0);
    const activeCount = rewards.filter(r => r.isActive).length;

    const anyDrawerOpen = panelOpen || !!claimantsReward;

    return (
        <div style={{ background: 'transparent', minHeight: '100vh', position: 'relative' }}>
            
            {/* Sticky header */}
            <div className="px-5 py-4 border-bottom" style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10, borderColor: 'rgba(255,255,255,0.1) !important' }}>
                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center justify-content-center border border-primary rounded" style={{ width: '48px', height: '48px', background: 'rgba(170,0,255,0.1)', color: 'var(--primary-color)', boxShadow: '0 0 10px rgba(170,0,255,0.2)' }}>
                            <FaGift size={20} />
                        </div>
                        <div>
                            <h4 className="fw-bold mb-1 text-white tech-font text-uppercase tracking-widest">REWARD ALLOCATION</h4>
                            <small className="tech-font text-muted font-monospace text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>
                                {rewards.length} INDEXED &nbsp;//&nbsp; <span style={{ color: 'var(--neon-green)' }}>{activeCount} ONLINE</span> &nbsp;//&nbsp; <span style={{ color: '#f59e0b' }}>{totalClaimed} CLAIMED</span>
                            </small>
                        </div>
                    </div>
                    <button onClick={openCreate} className="btn fw-bold d-flex align-items-center gap-2 px-4 py-2 border border-primary tech-font text-uppercase hover-scale transition-all"
                        style={{ background: 'rgba(170,0,255,0.2)', color: 'var(--primary-color)', fontSize: '0.8rem', letterSpacing: '0.1em', boxShadow: '0 0 15px rgba(170,0,255,0.2)' }}>
                        <FaPlus size={12} /> ADD REWARD
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="px-3 px-md-5 pt-4 pb-2">
                <div className="row g-4 mb-5">
                    {[
                        { label: 'TOTAL_REWARDS', value: rewards.length, color: 'var(--primary-color)', bg: 'rgba(170,0,255,0.1)', border: 'var(--primary-color)' },
                        { label: 'ACTIVE_NODES', value: activeCount, color: 'var(--neon-green)', bg: 'rgba(16,185,129,0.1)', border: 'var(--neon-green)' },
                        { label: 'OFFLINE_NODES', value: rewards.length - activeCount, color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)', border: 'var(--text-muted)' },
                        { label: 'TOTAL_CLAIMS', value: totalClaimed, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: '#f59e0b' },
                    ].map((s, i) => (
                        <div className="col-md-6 col-xl-3" key={i}>
                            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                                className="glass-card p-4 d-flex align-items-center gap-4 position-relative overflow-hidden" style={{ border: `1px solid ${s.border}` }}>
                                <div className="position-absolute top-0 end-0 w-50 h-100" style={{ background: `linear-gradient(90deg, transparent, ${s.bg})`, zIndex: 0, pointerEvents: 'none', opacity: 0.5 }} />
                                <div className="z-1 d-flex align-items-center justify-content-center border" style={{ width: '48px', height: '48px', background: 'rgba(0,0,0,0.5)', borderColor: `${s.border} !important`, flexShrink: 0 }}>
                                    <FaTerminal size={18} style={{ color: s.color }} />
                                </div>
                                <div className="z-1">
                                    <div className="fw-bold text-white tech-font mb-1" style={{ fontSize: '1.8rem', lineHeight: 1 }}>{s.value}</div>
                                    <small className="tech-font text-secondary text-uppercase tracking-widest" style={{ fontSize: '0.7rem' }}>{s.label}</small>
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Card grid */}
            <div className="px-3 px-md-5 pb-5">
                {loading ? (
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '40vh' }}>
                        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">LOADING...</span></div>
                    </div>
                ) : rewards.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card text-center py-5 border border-secondary" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <div className="mb-4 d-flex align-items-center justify-content-center border border-primary" style={{ width: '80px', height: '80px', background: 'rgba(170,0,255,0.1)', color: 'var(--primary-color)', margin: '0 auto', boxShadow: '0 0 20px rgba(170,0,255,0.2)' }}>
                            <FaGift size={32} />
                        </div>
                        <h5 className="fw-bold text-white tech-font mb-2 text-uppercase tracking-widest">NO REWARDS DETECTED</h5>
                        <p className="text-muted font-monospace text-uppercase" style={{ fontSize: '0.8rem' }}>INITIALIZE A NEW REWARD TO INCENTIVIZE CITIZENS.</p>
                        <button onClick={openCreate} className="btn mt-3 fw-bold px-4 py-2 border border-primary tech-font text-uppercase hover-scale" style={{ background: 'var(--primary-color)', color: 'white', letterSpacing: '0.1em', boxShadow: '0 0 15px rgba(170,0,255,0.4)' }}>
                            <FaTerminal size={12} className="me-2" /> EXECUTE CREATION
                        </button>
                    </motion.div>
                ) : (
                    <div className="row g-4 mb-5">
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
                        style={{ position: 'fixed', inset: 0, background: 'rgba(9,9,11,0.8)', backdropFilter: 'blur(5px)', zIndex: 998 }} />
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
