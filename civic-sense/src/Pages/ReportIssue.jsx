import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaArrowLeft, FaCamera, FaVideo, FaMapMarkerAlt, FaRobot,
    FaCloudUploadAlt, FaTimes, FaCheckCircle, FaExclamationTriangle,
    FaFire, FaTint, FaBroom, FaHardHat, FaShieldAlt, FaEllipsisH
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { notify } from '../utils/notify';
import LocationPicker from '../components/LocationPicker';
import api from '../api/axios';

/* ── Department icon map ─────────────────────────────────────────── */
const DEPT_META = {
    'Fire Department': { icon: FaFire, color: '#ef4444', bg: '#fef2f2' },
    'Water Department': { icon: FaTint, color: '#3b82f6', bg: '#eff6ff' },
    'Cleaning Department': { icon: FaBroom, color: '#10b981', bg: '#ecfdf5' },
    'Public Works Department': { icon: FaHardHat, color: '#f59e0b', bg: '#fffbeb' },
    'Police Department': { icon: FaShieldAlt, color: '#6366f1', bg: '#eef2ff' },
    'Others': { icon: FaEllipsisH, color: '#6b7280', bg: '#f9fafb' },
};

const PRIORITY_META = {
    'Low': { color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7', label: '🟢 Low' },
    'Medium': { color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d', label: '🟡 Medium' },
    'High': { color: '#f97316', bg: '#fff7ed', border: '#fed7aa', label: '🟠 High' },
    'Emergency': { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5', label: '🔴 Emergency' },
};

const departmentMapping = {
    'Cleaning Department': 'Cleaning Department',
    'Electricity Department': 'Public Works Department',
    'Public Works Department': 'Public Works Department',
    'Water Department': 'Water Department',
    'Fire Department': 'Fire Department',
};

/* ════════════════════════════════════════════════════════════════════
   ReportIssue Page
════════════════════════════════════════════════════════════════════ */
const ReportIssue = () => {
    const navigate = useNavigate();
    const imageInputRef = useRef(null);
    const videoInputRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '', description: '', category: '', priority: '',
        location: '', image: null, video: null, aiScore: 0
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [isCaptioning, setIsCaptioning] = useState(false);
    const [isVideoAnalyzing, setIsVideoAnalyzing] = useState(false);
    const [isThinking, setIsThinking] = useState(false);

    /* ── AI text prediction (debounced) ── */
    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.description.length > 10 && !isCaptioning) {
                predictCategoryAndPriority();
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [formData.description]);

    const predictCategoryAndPriority = async () => {
        setIsThinking(true);
        const minDelay = new Promise(r => setTimeout(r, 2000));
        try {
            const res = await api.post('/complaint/predict', { text: formData.description });
            await minDelay;
            if (res.data) {
                const cat = departmentMapping[res.data.department] || 'Others';
                setFormData(prev => ({ ...prev, category: cat, priority: res.data.priority, aiScore: res.data.confidence }));
            }
        } catch (e) {
            console.error('Prediction failed', e);
        } finally {
            setIsThinking(false);
        }
    };

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

    /* ── Image upload + captioning ── */
    const handleImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFormData(prev => ({ ...prev, image: file }));
        setImagePreview(URL.createObjectURL(file));

        setIsCaptioning(true);
        const data = new FormData();
        data.append('image', file);
        try {
            const minDelay = new Promise(r => setTimeout(r, 3000));
            const res = await api.post('/complaint/caption', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            await minDelay;
            if (res.data?.description) {
                setFormData(prev => ({ ...prev, description: res.data.description }));
            }
        } catch (e) {
            notify('error', e.response?.data?.message || 'Could not analyze image');
        } finally {
            setIsCaptioning(false);
        }
    };

    const removeImage = () => {
        setFormData(prev => ({ ...prev, image: null }));
        setImagePreview(null);
        if (imageInputRef.current) imageInputRef.current.value = '';
    };

    /* ── Video upload + analysis ── */
    const handleVideoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFormData(prev => ({ ...prev, video: file }));
        setIsVideoAnalyzing(true);
        const data = new FormData();
        data.append('video', file);
        try {
            const minDelay = new Promise(r => setTimeout(r, 3000));
            const res = await api.post('/complaint/analyze-video', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            await minDelay;
            if (res.data?.description) {
                setFormData(prev => ({
                    ...prev,
                    description: (prev.description ? prev.description + '\n\n' : '') + res.data.description
                }));
            }
        } catch (e) {
            notify('error', e.response?.data?.message || 'Could not analyze video');
        } finally {
            setIsVideoAnalyzing(false);
        }
    };

    const removeVideo = () => {
        setFormData(prev => ({ ...prev, video: null }));
        if (videoInputRef.current) videoInputRef.current.value = '';
    };

    const handleLocationSelect = ({ address }) => setFormData(prev => ({ ...prev, location: address }));

    /* ── Submit ── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.category || !formData.location || !formData.description || !formData.image || !formData.priority) {
            notify('error', 'Please fill in all required fields and upload an image.');
            return;
        }
        setLoading(true);
        const data = new FormData();
        data.append('title', formData.title);
        data.append('category', formData.category);
        data.append('location', formData.location);
        data.append('description', formData.description);
        data.append('priority', formData.priority);
        data.append('aiScore', formData.aiScore);
        data.append('image', formData.image);
        if (formData.video) data.append('video', formData.video);
        try {
            const res = await api.post('/complaint/create', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (res.status === 201) {
                notify('success', 'Issue reported successfully!');
                navigate('/dashboard');
            } else {
                notify('error', res.data.message || 'Failed to report issue');
            }
        } catch (e) {
            notify('error', e.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const isAiActive = isThinking || isCaptioning || isVideoAnalyzing;
    const deptMeta = formData.category ? DEPT_META[formData.category] : null;
    const prioMeta = formData.priority ? PRIORITY_META[formData.priority] : null;

    /* ══════════════════════════════════════════════════════════════ */
    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc' }}>

            {/* ── Top Bar ── */}
            <div
                className="d-flex align-items-center justify-content-between px-5 py-3 border-bottom"
                style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}
            >
                <div className="d-flex align-items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center border"
                        style={{ width: '36px', height: '36px', background: 'white' }}
                    >
                        <FaArrowLeft size={13} className="text-secondary" />
                    </button>
                    <div>
                        <h5 className="fw-bold mb-0 text-dark">Report an Issue</h5>
                        <small className="text-muted">Help us keep your community clean and safe</small>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setFormData({ title: '', description: '', category: '', priority: '', location: '', image: null, video: null, aiScore: 0 })}
                    className="btn btn-sm btn-light border rounded-pill px-3 text-secondary"
                >
                    Clear Form
                </button>
            </div>

            {/* ── Two-column layout ── */}
            <form onSubmit={handleSubmit}>
                <div className="d-flex" style={{ minHeight: 'calc(100vh - 65px)' }}>

                    {/* ─── LEFT: Form Fields (scrollable) ─────────────────────── */}
                    <div className="overflow-auto px-5 py-5" style={{ flex: '1 1 60%', maxHeight: 'calc(100vh - 65px)' }}>

                        {/* Issue Title */}
                        <div className="mb-5">
                            <label className="fw-bold text-dark mb-2 d-block">
                                Issue Title <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="form-control form-control-lg shadow-none"
                                placeholder="e.g., Deep pothole on Main Street near the park"
                                required
                                style={{ borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem', background: 'white' }}
                            />
                        </div>

                        {/* Description */}
                        <div className="mb-5">
                            <label className="fw-bold text-dark mb-2 d-block">
                                Description <span className="text-danger">*</span>
                                <span className="ms-2 text-muted fw-normal" style={{ fontSize: '0.8rem' }}>
                                    — AI auto-fills this from your photo
                                </span>
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="form-control shadow-none"
                                rows={5}
                                placeholder="Describe the issue in detail. What's wrong? Since when? Any safety risk?"
                                required
                                style={{ borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', resize: 'none', lineHeight: 1.7, background: 'white' }}
                            />
                            <div className="d-flex justify-content-end mt-1">
                                <small className="text-muted">{formData.description.length} characters</small>
                            </div>

                            {/* AI Thinking Banner */}
                            <AnimatePresence>
                                {isAiActive && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        className="mt-3 p-4 rounded-3 d-flex align-items-center gap-4"
                                        style={{ background: 'linear-gradient(135deg, #eef2ff, #f0fdf4)', border: '1px solid #c7d2fe' }}
                                    >
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                        >
                                            <FaRobot size={26} style={{ color: '#6366f1' }} />
                                        </motion.div>
                                        <div>
                                            <p className="fw-bold mb-0" style={{ background: 'linear-gradient(to right, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                                {isCaptioning ? 'Analyzing your photo...' : isVideoAnalyzing ? 'Analyzing video...' : 'AI is classifying your issue...'}
                                            </p>
                                            <p className="small text-muted mb-0 mt-1">
                                                {isCaptioning ? 'Generating description from image using AI vision...' : isVideoAnalyzing ? 'Extracting key frames and description...' : 'Detecting department and priority level...'}
                                            </p>
                                        </div>
                                        <div className="ms-auto d-flex gap-1">
                                            {[0, 0.3, 0.6].map((delay, i) => (
                                                <motion.span
                                                    key={i}
                                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                                    transition={{ duration: 1.2, repeat: Infinity, delay }}
                                                    style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', display: 'inline-block' }}
                                                />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Location */}
                        <div className="mb-5">
                            <label className="fw-bold text-dark mb-2 d-block">
                                Location <span className="text-danger">*</span>
                            </label>
                            <div className="input-group mb-3">
                                <span className="input-group-text bg-white" style={{ borderRadius: '12px 0 0 12px', border: '1.5px solid #e2e8f0', borderRight: 'none' }}>
                                    <FaMapMarkerAlt className="text-danger" />
                                </span>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="form-control shadow-none border-start-0"
                                    placeholder="Enter address or pick on map below"
                                    required
                                    style={{ borderRadius: '0 12px 12px 0', border: '1.5px solid #e2e8f0', borderLeft: 'none', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div className="rounded-3 overflow-hidden border shadow-sm">
                                <LocationPicker onLocationSelect={handleLocationSelect} />
                            </div>
                        </div>

                        {/* Photo Upload */}
                        <div className="mb-5">
                            <label className="fw-bold text-dark mb-2 d-block">
                                Photo Evidence <span className="text-danger">*</span>
                                <span className="ms-2 text-muted fw-normal" style={{ fontSize: '0.8rem' }}>— AI will auto-fill description from your photo</span>
                            </label>
                            <input type="file" ref={imageInputRef} onChange={handleImageChange} className="d-none" id="imageUpload" accept="image/*" />
                            {!formData.image ? (
                                <label
                                    htmlFor="imageUpload"
                                    className="d-flex flex-column align-items-center justify-content-center gap-3 cursor-pointer"
                                    style={{
                                        border: '2px dashed #c7d2fe',
                                        borderRadius: '16px',
                                        padding: '40px',
                                        background: '#fafbff',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#fafbff'}
                                >
                                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FaCloudUploadAlt size={26} style={{ color: '#6366f1' }} />
                                    </div>
                                    <div className="text-center">
                                        <p className="fw-bold text-dark mb-1">Click to upload photo</p>
                                        <small className="text-muted">JPG, PNG up to 5MB · AI will analyze it automatically</small>
                                    </div>
                                </label>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="position-relative rounded-3 overflow-hidden border shadow-sm"
                                    style={{ maxHeight: '340px' }}
                                >
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-100 object-fit-cover"
                                        style={{ maxHeight: '340px' }}
                                    />
                                    {/* Overlay with filename + remove button */}
                                    <div
                                        className="position-absolute bottom-0 start-0 end-0 d-flex align-items-center justify-content-between px-3 py-2"
                                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}
                                    >
                                        <div className="d-flex align-items-center gap-2 text-white">
                                            <FaCamera size={13} />
                                            <small className="fw-medium text-truncate" style={{ maxWidth: '260px' }}>{formData.image.name}</small>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
                                            style={{ width: '28px', height: '28px', background: 'rgba(239,68,68,0.9)', border: 'none', flexShrink: 0 }}
                                        >
                                            <FaTimes size={11} className="text-white" />
                                        </button>
                                    </div>
                                    {/* AI analyzing overlay */}
                                    {isCaptioning && (
                                        <div className="position-absolute top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center" style={{ background: 'rgba(99,102,241,0.15)', backdropFilter: 'blur(4px)' }}>
                                            <div className="text-white text-center">
                                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                                                    <FaRobot size={32} />
                                                </motion.div>
                                                <p className="mt-2 fw-bold small mb-0">Analyzing image...</p>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>

                        {/* Video Upload (optional) */}
                        <div className="mb-5">
                            <label className="fw-bold text-dark mb-2 d-block">
                                Video Evidence
                                <span className="ms-2 badge rounded-pill" style={{ background: '#f1f5f9', color: '#64748b', fontSize: '0.72rem', fontWeight: 500 }}>Optional</span>
                            </label>
                            <input type="file" ref={videoInputRef} onChange={handleVideoChange} className="d-none" id="videoUpload" accept="video/*" />
                            {!formData.video ? (
                                <label
                                    htmlFor="videoUpload"
                                    className="d-flex align-items-center gap-4 cursor-pointer"
                                    style={{
                                        border: '2px dashed #e2e8f0',
                                        borderRadius: '16px',
                                        padding: '24px 32px',
                                        background: '#fafafa',
                                        transition: 'all 0.2s',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#fafafa'}
                                >
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <FaVideo size={20} style={{ color: '#64748b' }} />
                                    </div>
                                    <div>
                                        <p className="fw-bold text-dark mb-0">Click to upload video</p>
                                        <small className="text-muted">MP4, MOV up to 10MB · AI extracts description</small>
                                    </div>
                                </label>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="d-flex align-items-center justify-content-between p-3 rounded-3 border"
                                    style={{ background: isVideoAnalyzing ? '#fafbff' : '#f0fdf4', borderColor: isVideoAnalyzing ? '#c7d2fe' : '#bbf7d0' }}
                                >
                                    <div className="d-flex align-items-center gap-3">
                                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isVideoAnalyzing ? '#eef2ff' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {isVideoAnalyzing
                                                ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}><FaRobot size={18} style={{ color: '#6366f1' }} /></motion.div>
                                                : <FaVideo size={18} style={{ color: '#16a34a' }} />
                                            }
                                        </div>
                                        <div>
                                            <p className="fw-bold small mb-0 text-dark text-truncate" style={{ maxWidth: '200px' }}>{formData.video.name}</p>
                                            <small className="text-muted">{isVideoAnalyzing ? 'Analyzing...' : '✓ Ready'}</small>
                                        </div>
                                    </div>
                                    {!isVideoAnalyzing && (
                                        <button type="button" onClick={removeVideo} className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', background: '#fee2e2', border: 'none' }}>
                                            <FaTimes size={11} className="text-danger" />
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </div>

                    </div>

                    {/* ─── RIGHT: Sticky Preview + AI Results + CTA ────────────── */}
                    <div
                        className="px-4 py-5 d-flex flex-column gap-4"
                        style={{
                            flex: '0 0 380px',
                            width: '380px',
                            background: 'white',
                            borderLeft: '1px solid #e2e8f0',
                            position: 'sticky',
                            top: '65px',
                            height: 'calc(100vh - 65px)',
                            overflowY: 'auto',
                        }}
                    >
                        {/* Image preview in sidebar */}
                        <div>
                            <label className="fw-bold text-muted text-uppercase mb-2 d-block" style={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>Photo Preview</label>
                            {imagePreview ? (
                                <div className="rounded-3 overflow-hidden border shadow-sm" style={{ height: '180px' }}>
                                    <img src={imagePreview} alt="Preview" className="w-100 h-100 object-fit-cover" />
                                </div>
                            ) : (
                                <div
                                    className="rounded-3 d-flex align-items-center justify-content-center"
                                    style={{ height: '180px', background: '#f8fafc', border: '2px dashed #e2e8f0' }}
                                >
                                    <div className="text-center text-muted">
                                        <FaCamera size={28} className="mb-2" style={{ opacity: 0.3 }} />
                                        <p className="small mb-0">No photo uploaded yet</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* AI Detection Card */}
                        <div>
                            <label className="fw-bold text-muted text-uppercase mb-3 d-block" style={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>
                                <FaRobot className="me-1" style={{ color: '#6366f1' }} /> AI Detection
                            </label>

                            {/* Department */}
                            <div className="mb-3 p-3 rounded-3 border d-flex align-items-center gap-3" style={{ background: deptMeta ? deptMeta.bg : '#f8fafc', borderColor: deptMeta ? 'transparent' : '#e2e8f0', transition: 'all 0.3s' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: deptMeta ? `${deptMeta.color}20` : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {deptMeta
                                        ? <deptMeta.icon size={18} style={{ color: deptMeta.color }} />
                                        : <FaRobot size={16} style={{ color: '#94a3b8' }} />
                                    }
                                </div>
                                <div>
                                    <p className="fw-bold small mb-0" style={{ color: deptMeta ? deptMeta.color : '#94a3b8' }}>
                                        {formData.category || 'Waiting for input...'}
                                    </p>
                                    <small className="text-muted">Department</small>
                                </div>
                                {formData.category && <FaCheckCircle className="ms-auto" style={{ color: '#10b981' }} />}
                            </div>

                            {/* Priority */}
                            <div className="p-3 rounded-3 border d-flex align-items-center gap-3" style={{ background: prioMeta ? prioMeta.bg : '#f8fafc', borderColor: prioMeta ? prioMeta.border : '#e2e8f0', transition: 'all 0.3s' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: prioMeta ? `${prioMeta.color}20` : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <FaExclamationTriangle size={16} style={{ color: prioMeta ? prioMeta.color : '#94a3b8' }} />
                                </div>
                                <div>
                                    <p className="fw-bold small mb-0" style={{ color: prioMeta ? prioMeta.color : '#94a3b8' }}>
                                        {prioMeta ? prioMeta.label : 'Waiting for input...'}
                                    </p>
                                    <small className="text-muted">Priority Level</small>
                                </div>
                                {formData.priority && <FaCheckCircle className="ms-auto" style={{ color: '#10b981' }} />}
                            </div>

                            {formData.aiScore > 0 && (
                                <div className="mt-3 p-3 rounded-3" style={{ background: 'linear-gradient(135deg, #eef2ff, #f0fdf4)', border: '1px solid #c7d2fe' }}>
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <small className="fw-bold text-muted">AI Confidence</small>
                                        <small className="fw-bold" style={{ color: '#6366f1' }}>{Math.round(formData.aiScore)}%</small>
                                    </div>
                                    <div className="progress rounded-pill" style={{ height: '6px' }}>
                                        <div
                                            className="progress-bar rounded-pill"
                                            style={{ width: `${formData.aiScore}%`, background: 'linear-gradient(to right, #6366f1, #8b5cf6)' }}
                                        />
                                    </div>
                                </div>
                            )}

                            {isAiActive && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-3 text-center py-2"
                                >
                                    <small className="text-muted d-flex align-items-center justify-content-center gap-2">
                                        <motion.span
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                            style={{ display: 'inline-block' }}
                                        >
                                            <FaRobot size={12} style={{ color: '#6366f1' }} />
                                        </motion.span>
                                        AI is processing...
                                    </small>
                                </motion.div>
                            )}
                        </div>

                        {/* Checklist */}
                        <div>
                            <label className="fw-bold text-muted text-uppercase mb-3 d-block" style={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>Checklist</label>
                            {[
                                { label: 'Title added', done: !!formData.title },
                                { label: 'Description added', done: formData.description.length > 10 },
                                { label: 'Location set', done: !!formData.location },
                                { label: 'Photo uploaded', done: !!formData.image },
                                { label: 'Department detected', done: !!formData.category },
                                { label: 'Priority detected', done: !!formData.priority },
                            ].map((item, i) => (
                                <div key={i} className="d-flex align-items-center gap-2 mb-2">
                                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: item.done ? '#ecfdf5' : '#f1f5f9', border: `1.5px solid ${item.done ? '#6ee7b7' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {item.done && <FaCheckCircle size={10} style={{ color: '#10b981' }} />}
                                    </span>
                                    <small className={item.done ? 'text-dark fw-medium' : 'text-muted'}>{item.label}</small>
                                </div>
                            ))}
                        </div>

                        {/* Submit Button */}
                        <div className="mt-auto">
                            <button
                                type="submit"
                                disabled={loading || isAiActive}
                                className="btn w-100 fw-bold py-3 rounded-3"
                                style={{
                                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                    color: 'white',
                                    border: 'none',
                                    fontSize: '1rem',
                                    boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                                    opacity: loading || isAiActive ? 0.7 : 1,
                                    transition: 'all 0.2s'
                                }}
                            >
                                {loading ? (
                                    <span className="d-flex align-items-center justify-content-center gap-2">
                                        <span className="spinner-border spinner-border-sm" /> Submitting Report...
                                    </span>
                                ) : isAiActive ? (
                                    <span className="d-flex align-items-center justify-content-center gap-2">
                                        <span className="spinner-border spinner-border-sm" /> AI Processing...
                                    </span>
                                ) : 'Submit Report'}
                            </button>
                            <p className="text-center text-muted mt-2 mb-0" style={{ fontSize: '0.75rem' }}>
                                Your report will be reviewed by the relevant authority within 24 hours.
                            </p>
                        </div>
                    </div>

                </div>
            </form>
        </div>
    );
};

export default ReportIssue;
