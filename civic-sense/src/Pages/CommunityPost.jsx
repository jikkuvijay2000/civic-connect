import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaBullhorn, FaPen, FaTags, FaImage, FaTimes, FaCheckCircle,
    FaAlignLeft, FaChevronDown
} from 'react-icons/fa';
import api from '../api/axios';
import { notify } from '../utils/notify';

const TAG_OPTIONS = ['Update', 'Alert', 'Event', 'News', 'Notice'];

const TAG_META = {
    Update: { color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd' },
    Alert: { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
    Event: { color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7' },
    News: { color: '#6366f1', bg: '#eef2ff', border: '#a5b4fc' },
    Notice: { color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
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
            notify('error', 'You must be logged in.');
            setLoading(false);
            return;
        }
        const data = new FormData();
        data.append('title', formData.title);
        data.append('content', formData.content);
        data.append('tag', formData.tag);
        data.append('author', user.userName || 'Authority');
        data.append('role', user.role || 'Admin');
        if (formData.image) data.append('image', formData.image);

        try {
            const res = await api.post('/community-post/create', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.status === 201) {
                notify('success', 'Community post published successfully!');
                setFormData({ title: '', content: '', tag: 'Update', image: null });
                setImagePreview(null);
            }
        } catch (err) {
            console.error('Error creating post:', err);
            notify('error', 'Failed to publish post.');
        } finally {
            setLoading(false);
        }
    };

    const tagMeta = TAG_META[formData.tag] || TAG_META.Update;
    const charCount = formData.content.length;

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>

            {/* ── Page Header ── */}
            <div className="px-5 pt-5 pb-4">
                <h2 className="fw-bold text-dark ls-tight mb-1">Community Posts</h2>
                <p className="text-muted mb-0">Publish updates, alerts, and announcements to citizens.</p>
            </div>

            {/* ── Two-column layout ── */}
            <div className="px-5 pb-5 d-flex gap-5 align-items-start">

                {/* ── Left: Form ── */}
                <div style={{ flex: '1 1 0' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-4 border p-5"
                        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                    >
                        <form onSubmit={handleSubmit}>

                            {/* Title */}
                            <div className="mb-4">
                                <label className="fw-bold text-dark small mb-2 d-block">
                                    Post Title <span className="text-danger">*</span>
                                </label>
                                <div className="input-group">
                                    <span className="input-group-text bg-white" style={{ borderRadius: '12px 0 0 12px', border: '1.5px solid #e2e8f0', borderRight: 'none' }}>
                                        <FaPen size={13} className="text-muted" />
                                    </span>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className="form-control shadow-none border-start-0"
                                        placeholder="e.g., City Clean-up Drive this Saturday"
                                        required
                                        style={{ borderRadius: '0 12px 12px 0', border: '1.5px solid #e2e8f0', borderLeft: 'none', fontSize: '0.93rem' }}
                                    />
                                </div>
                            </div>

                            {/* Tag selector */}
                            <div className="mb-4">
                                <label className="fw-bold text-dark small mb-2 d-block">Tag / Category</label>
                                <div className="d-flex flex-wrap gap-2">
                                    {TAG_OPTIONS.map(tag => {
                                        const m = TAG_META[tag];
                                        const active = formData.tag === tag;
                                        return (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, tag }))}
                                                className="btn btn-sm fw-medium"
                                                style={{
                                                    borderRadius: '10px',
                                                    padding: '7px 16px',
                                                    background: active ? m.bg : 'white',
                                                    color: active ? m.color : '#64748b',
                                                    border: `1.5px solid ${active ? m.border : '#e2e8f0'}`,
                                                    boxShadow: active ? `0 0 0 3px ${m.bg}` : 'none',
                                                    transform: active ? 'scale(1.04)' : 'scale(1)',
                                                    transition: 'all 0.15s ease',
                                                    fontSize: '0.83rem',
                                                }}
                                            >
                                                {tag}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="fw-bold text-dark small mb-0">
                                        Content <span className="text-danger">*</span>
                                    </label>
                                    <small className="text-muted">{charCount} chars</small>
                                </div>
                                <textarea
                                    name="content"
                                    value={formData.content}
                                    onChange={handleChange}
                                    className="form-control shadow-none"
                                    rows={7}
                                    placeholder="Write your announcement, event details, or community update here..."
                                    required
                                    style={{ borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '0.93rem', resize: 'none', lineHeight: 1.7 }}
                                />
                            </div>

                            {/* Image Upload */}
                            <div className="mb-5">
                                <label className="fw-bold text-dark small mb-2 d-block">
                                    Attach Image
                                    <span className="ms-2 text-muted fw-normal" style={{ fontSize: '0.78rem' }}>Optional</span>
                                </label>
                                <input type="file" ref={imageInputRef} onChange={handleImageChange} className="d-none" id="postImage" accept="image/*" />
                                {!imagePreview ? (
                                    <label
                                        htmlFor="postImage"
                                        className="d-flex align-items-center gap-3 cursor-pointer"
                                        style={{
                                            border: '2px dashed #e2e8f0',
                                            borderRadius: '14px',
                                            padding: '20px 28px',
                                            background: '#fafafa',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#fafafa'}
                                    >
                                        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <FaImage size={18} className="text-muted" />
                                        </div>
                                        <div>
                                            <p className="fw-bold text-dark mb-0 small">Click to upload image</p>
                                            <small className="text-muted">JPG, PNG up to 5MB</small>
                                        </div>
                                    </label>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="position-relative rounded-3 overflow-hidden border"
                                        style={{ maxHeight: '260px' }}
                                    >
                                        <img src={imagePreview} alt="Preview" className="w-100 object-fit-cover" style={{ maxHeight: '260px' }} />
                                        <div
                                            className="position-absolute bottom-0 start-0 end-0 d-flex align-items-center justify-content-between px-3 py-2"
                                            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)' }}
                                        >
                                            <small className="text-white fw-medium text-truncate" style={{ maxWidth: '240px' }}>
                                                {formData.image?.name}
                                            </small>
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
                                                style={{ width: '26px', height: '26px', background: 'rgba(239,68,68,0.9)', border: 'none' }}
                                            >
                                                <FaTimes size={10} className="text-white" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Submit */}
                            <div className="d-flex justify-content-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setFormData({ title: '', content: '', tag: 'Update', image: null }); setImagePreview(null); }}
                                    className="btn btn-light border fw-medium px-4"
                                    style={{ borderRadius: '10px' }}
                                >
                                    Clear
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn fw-bold px-5 py-2 d-flex align-items-center gap-2"
                                    style={{ borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}
                                >
                                    {loading
                                        ? <><span className="spinner-border spinner-border-sm" /> Publishing...</>
                                        : <><FaBullhorn size={14} /> Publish Post</>
                                    }
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>

                {/* ── Right: Preview Card ── */}
                <div style={{ flex: '0 0 320px', width: '320px', position: 'sticky', top: '24px' }}>
                    <label className="fw-bold text-muted text-uppercase mb-3 d-block" style={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>Post Preview</label>
                    <motion.div
                        layout
                        className="bg-white rounded-4 border overflow-hidden"
                        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                    >
                        {/* Image preview */}
                        {imagePreview ? (
                            <div style={{ height: '160px', overflow: 'hidden' }}>
                                <img src={imagePreview} alt="Preview" className="w-100 h-100 object-fit-cover" />
                            </div>
                        ) : (
                            <div className="d-flex align-items-center justify-content-center" style={{ height: '120px', background: '#f8fafc' }}>
                                <FaImage size={32} style={{ color: '#cbd5e1', opacity: 0.6 }} />
                            </div>
                        )}

                        <div className="p-4">
                            {/* Tag badge */}
                            <span
                                className="badge rounded-pill fw-medium mb-3 px-3 py-1"
                                style={{ background: tagMeta.bg, color: tagMeta.color, border: `1px solid ${tagMeta.border}`, fontSize: '0.75rem' }}
                            >
                                {formData.tag}
                            </span>

                            <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '0.95rem' }}>
                                {formData.title || <span className="text-muted fst-italic fw-normal">Post title will appear here</span>}
                            </h6>

                            <p className="text-muted small mb-3" style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 4,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.6
                            }}>
                                {formData.content || <span className="fst-italic">Content preview...</span>}
                            </p>

                            <div className="d-flex align-items-center gap-2 pt-3 border-top">
                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FaBullhorn size={12} style={{ color: '#6366f1' }} />
                                </div>
                                <small className="text-muted">Authority · Just now</small>
                            </div>
                        </div>
                    </motion.div>

                    {/* Tips */}
                    <div className="mt-4 p-4 rounded-3 border" style={{ background: '#f8fafc' }}>
                        <p className="fw-bold small text-dark mb-2">Tips for a good post</p>
                        <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                            {[
                                'Keep titles short and specific',
                                'Use the right tag for visibility',
                                'Add an image to increase engagement',
                                'Proofread before publishing',
                            ].map((tip, i) => (
                                <li key={i} className="d-flex align-items-start gap-2">
                                    <FaCheckCircle size={11} style={{ color: '#10b981', marginTop: '3px', flexShrink: 0 }} />
                                    <small className="text-muted">{tip}</small>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunityPost;
