import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaBullhorn, FaPen, FaTags, FaImage, FaTimes, FaCheckCircle,
    FaTerminal
} from 'react-icons/fa';
import api from '../api/axios';
import { notify } from '../utils/notify';

const TAG_OPTIONS = ['Update', 'Alert', 'Event', 'News', 'Notice'];

const TAG_META = {
    Update: { color: '#00f0ff', bg: 'rgba(0, 240, 255, 0.1)', border: '#00f0ff' },
    Alert: { color: 'var(--accent-red)', bg: 'rgba(239, 68, 68, 0.1)', border: 'var(--accent-red)' },
    Event: { color: 'var(--secondary-color)', bg: 'rgba(163, 230, 53, 0.1)', border: 'var(--secondary-color)' },
    News: { color: 'var(--primary-color)', bg: 'rgba(170, 0, 255, 0.1)', border: 'var(--primary-color)' },
    Notice: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b' },
};

const CommunityPost = () => {
    const imageInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        tag: 'Update',
        image: null
    });

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFormData(prev => ({ ...prev, image: file }));
        setImagePreview(URL.createObjectURL(file));
    };

    const removeImage = () => {
        setFormData(prev => ({ ...prev, image: null }));
        setImagePreview(null);
        if (imageInputRef.current) imageInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            notify('error', 'AUTHORIZATION FAILED.');
            setLoading(false);
            return;
        }
        const data = new FormData();
        data.append('title', formData.title);
        data.append('content', formData.content);
        data.append('tag', formData.tag);
        data.append('author', user.userName || 'AUTHORITY');
        data.append('role', user.role || 'ADMIN');
        if (formData.image) data.append('image', formData.image);

        try {
            const res = await api.post('/community-post/create', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.status === 201) {
                notify('success', 'BROADCAST TRANSMITTED ACROSS NETWORK.');
                setFormData({ title: '', content: '', tag: 'Update', image: null });
                setImagePreview(null);
            }
        } catch (err) {
            console.error('Transmission error:', err);
            notify('error', 'TRANSMISSION FAILURE.');
        } finally {
            setLoading(false);
        }
    };

    const tagMeta = TAG_META[formData.tag] || TAG_META.Update;
    const charCount = formData.content.length;

    return (
        <div style={{ minHeight: '100vh', background: 'transparent' }}>
            {/* Page Header */}
            <div className="px-4 px-md-5 pt-4 pb-4">
                <div className="d-flex align-items-center gap-3">
                    <FaTerminal size={28} className="text-neon-purple d-none d-md-block" />
                    <div>
                        <h2 className="tech-font fw-bold text-white ls-tight mb-0 text-uppercase" style={{ letterSpacing: '0.15em' }}>COMMAND BROADCAST</h2>
                        <p className="tech-font text-muted mb-0 text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.1em' }}>TRANSMIT ALERTS, LOGS, AND DIRECTIVES ACROSS THE NETWORK.</p>
                    </div>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="px-4 px-md-5 pb-5 d-flex flex-column flex-xl-row gap-5 align-items-start">
                {/* Left: Form */}
                <div className="w-100" style={{ flex: '1 1 0' }}>
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-4 p-md-5">
                        <form onSubmit={handleSubmit}>
                            {/* Title */}
                            <div className="mb-4">
                                <label className="tech-font fw-bold text-white mb-2 d-block text-uppercase" style={{ letterSpacing: '0.15em' }}>
                                    BROADCAST TITLE <span className="text-neon-red">*</span>
                                </label>
                                <div className="input-group">
                                    <span className="input-group-text bg-transparent" style={{ borderRadius: '8px 0 0 8px', border: '1px solid rgba(255,255,255,0.2)', borderRight: 'none' }}>
                                        <FaPen size={13} className="text-muted" />
                                    </span>
                                    <input type="text" name="title" value={formData.title} onChange={handleChange}
                                        className="form-control tech-font text-white bg-transparent shadow-none border-start-0"
                                        placeholder="INPUT DESIGNATION..." required
                                        style={{ borderRadius: '0 8px 8px 0', border: '1px solid rgba(255,255,255,0.2)', borderLeft: 'none', fontSize: '0.9rem' }}
                                        onFocus={e => e.currentTarget.parentNode.style.boxShadow = '0 0 10px rgba(170,0,255,0.1)'}
                                        onBlur={e => e.currentTarget.parentNode.style.boxShadow = 'none'}
                                    />
                                </div>
                            </div>

                            {/* Tag selector */}
                            <div className="mb-4">
                                <label className="tech-font fw-bold text-white mb-2 d-block text-uppercase" style={{ letterSpacing: '0.15em' }}>CATEGORIZE SIGNAL</label>
                                <div className="d-flex flex-wrap gap-2">
                                    {TAG_OPTIONS.map(tag => {
                                        const m = TAG_META[tag];
                                        const active = formData.tag === tag;
                                        return (
                                            <button key={tag} type="button" onClick={() => setFormData(prev => ({ ...prev, tag }))}
                                                className="btn tech-font fw-bold text-uppercase"
                                                style={{
                                                    borderRadius: '4px', padding: '7px 16px',
                                                    background: active ? m.bg : 'transparent',
                                                    color: active ? m.color : 'var(--text-muted)',
                                                    border: `1px solid ${active ? m.border : 'rgba(255,255,255,0.1)'}`,
                                                    boxShadow: active ? `0 0 10px ${m.bg}` : 'none',
                                                    fontSize: '0.75rem', letterSpacing: '0.1em', transition: 'all 0.15s ease'
                                                }}>
                                                {tag}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="tech-font fw-bold text-white mb-0 text-uppercase" style={{ letterSpacing: '0.15em' }}>
                                        MESSAGE PAYLOAD <span className="text-neon-red">*</span>
                                    </label>
                                    <small className="tech-font text-muted fw-bold">{charCount} BYTES</small>
                                </div>
                                <textarea name="content" value={formData.content} onChange={handleChange}
                                    className="form-control font-monospace text-white bg-transparent shadow-none" rows={7}
                                    placeholder="COMPILE TRANSMISSION LOGS..." required
                                    style={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.85rem', resize: 'none', lineHeight: 1.7 }}
                                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary-color)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(170,0,255,0.1)'; }}
                                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
                                />
                            </div>

                            {/* Image Upload */}
                            <div className="mb-5">
                                <label className="tech-font fw-bold text-white mb-2 d-block text-uppercase" style={{ letterSpacing: '0.15em' }}>
                                    ATTACH INTEL
                                    <span className="ms-2 badge rounded" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.1)' }}>(OPTIONAL)</span>
                                </label>
                                <input type="file" ref={imageInputRef} onChange={handleImageChange} className="d-none" id="postImage" accept="image/*" />
                                {!imagePreview ? (
                                    <label htmlFor="postImage" className="d-flex align-items-center gap-3 cursor-pointer hover-bg-light"
                                        style={{ border: '1px dashed rgba(255,255,255,0.3)', borderRadius: '8px', padding: '20px 28px', background: 'transparent', transition: 'all 0.2s' }}>
                                        <div style={{ width: '44px', height: '44px', borderRadius: '8px', background: 'rgba(170,0,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <FaImage size={18} className="text-neon-purple" />
                                        </div>
                                        <div>
                                            <p className="tech-font fw-bold text-white mb-0 text-uppercase" style={{ letterSpacing: '0.1em' }}>UPLOAD ENCRYPTED IMAGE</p>
                                        </div>
                                    </label>
                                ) : (
                                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="position-relative rounded overflow-hidden border" style={{ maxHeight: '260px', borderColor: 'var(--primary-color) !important' }}>
                                        <img src={imagePreview} alt="Intel Preview" className="w-100 object-fit-cover" style={{ maxHeight: '260px', filter: 'brightness(0.8) contrast(1.1)' }} />
                                        <div className="position-absolute bottom-0 start-0 end-0 d-flex align-items-center justify-content-between px-3 py-2" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                                            <small className="tech-font text-white fw-bold text-truncate" style={{ maxWidth: '240px', letterSpacing: '0.1em' }}>{formData.image?.name}</small>
                                            <button type="button" onClick={removeImage} className="btn btn-sm rounded d-flex align-items-center justify-content-center" style={{ width: '26px', height: '26px', background: 'rgba(239,68,68,0.2)', border: '1px solid var(--accent-red)' }}>
                                                <FaTimes size={10} className="text-neon-red" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Submit */}
                            <div className="d-flex justify-content-end gap-3 flex-wrap">
                                <button type="button" onClick={() => { setFormData({ title: '', content: '', tag: 'Update', image: null }); setImagePreview(null); }}
                                    className="btn tech-font fw-bold text-uppercase" style={{ borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
                                    WIPE
                                </button>
                                <button type="submit" disabled={loading} className="btn tech-font fw-bold text-uppercase d-flex align-items-center gap-2"
                                    style={{ borderRadius: '4px', background: 'rgba(170,0,255,0.1)', color: 'var(--primary-color)', border: '1px solid var(--primary-color)', letterSpacing: '0.1em' }}>
                                    {loading ? <><span className="spinner-border spinner-border-sm" /> TRANSMITTING...</> : <><FaBullhorn size={14} /> TRANSMIT LOG</>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>

                {/* Right: Preview Card */}
                <div style={{ flex: '0 0 320px', width: '320px', position: 'sticky', top: '80px' }} className="d-none d-xl-block">
                    <label className="tech-font fw-bold text-secondary text-uppercase mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.72rem', letterSpacing: '0.15em' }}>
                        <FaTerminal /> INITIATE PREVIEW
                    </label>
                    <motion.div layout className="glass-card overflow-hidden" style={{ borderLeft: `3px solid ${tagMeta.border}` }}>
                        {/* Image preview */}
                        {imagePreview ? (
                            <div style={{ height: '160px', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <img src={imagePreview} alt="Preview" className="w-100 h-100 object-fit-cover" style={{ filter: 'brightness(0.85) sepia(0.2)' }} />
                            </div>
                        ) : (
                            <div className="d-flex align-items-center justify-content-center" style={{ height: '120px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <FaImage size={32} style={{ color: 'rgba(255,255,255,0.1)' }} />
                            </div>
                        )}

                        <div className="p-4">
                            {/* Tag badge */}
                            <span className="badge tech-font fw-bold mb-3 px-3 py-1 text-uppercase" style={{ background: tagMeta.bg, color: tagMeta.color, border: `1px solid ${tagMeta.border}`, fontSize: '0.65rem', letterSpacing: '0.1em' }}>{formData.tag}</span>
                            <h6 className="tech-font fw-bold text-white mb-2 text-uppercase tracking-widest" style={{ fontSize: '0.9rem' }}>
                                {formData.title || <span className="text-muted fst-italic fw-normal">AWAITING DESIGNATION</span>}
                            </h6>
                            <p className="text-muted font-monospace small mb-3" style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6, fontSize: '0.75rem' }}>
                                {formData.content || <span className="fst-italic">AWAITING PAYLOAD...</span>}
                            </p>
                            <div className="d-flex align-items-center gap-2 pt-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.1) !important' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: 'rgba(170,0,255,0.1)', border: '1px solid var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FaTerminal size={12} className="text-neon-purple" />
                                </div>
                                <small className="tech-font text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.1em' }}>AUTHORITY · T-MINUS 00:00</small>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default CommunityPost;
