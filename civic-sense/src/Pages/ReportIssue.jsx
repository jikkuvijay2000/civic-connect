import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaArrowLeft, FaCamera, FaVideo, FaMapMarkerAlt, FaRobot,
    FaCloudUploadAlt, FaTimes, FaCheckCircle, FaExclamationTriangle,
    FaFire, FaTint, FaBroom, FaHardHat, FaShieldAlt, FaEllipsisH, FaTerminal
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { notify } from '../utils/notify';
import LocationPicker from '../components/LocationPicker';
import api from '../api/axios';

const DEPT_META = {
    'Fire Department': { icon: FaFire, color: 'var(--accent-red)', bg: 'rgba(239, 68, 68, 0.1)' },
    'Water Department': { icon: FaTint, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    'Cleaning Department': { icon: FaBroom, color: 'var(--secondary-color)', bg: 'rgba(163, 230, 53, 0.1)' },
    'Public Works Department': { icon: FaHardHat, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    'Police Department': { icon: FaShieldAlt, color: 'var(--primary-color)', bg: 'rgba(170, 0, 255, 0.1)' },
    'Others': { icon: FaEllipsisH, color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' },
};

const PRIORITY_META = {
    'Low': { color: 'var(--secondary-color)', bg: 'rgba(163, 230, 53, 0.1)', border: 'var(--secondary-color)', label: 'LOW' },
    'Medium': { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', label: 'ELEVATED' },
    'High': { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', border: '#f97316', label: 'CRITICAL' },
    'Emergency': { color: 'var(--accent-red)', bg: 'rgba(239, 68, 68, 0.1)', border: 'var(--accent-red)', label: 'EMERGENCY' },
};

const departmentMapping = {
    'Cleaning Department': 'Cleaning Department',
    'Sanitation Department': 'Cleaning Department',
    'Electricity Department': 'Public Works Department',
    'Public Works Department': 'Public Works Department',
    'Water Department': 'Water Department',
    'Fire Department': 'Fire Department',
};

const ReportIssue = () => {
    const navigate = useNavigate();
    const imageInputRef = useRef(null);
    const videoInputRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '', description: '', category: '', priority: '',
        location: '', lat: null, lng: null, image: null, video: null, aiScore: 0
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [isCaptioning, setIsCaptioning] = useState(false);
    const [isVideoAnalyzing, setIsVideoAnalyzing] = useState(false);
    const [isThinking, setIsThinking] = useState(false);

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
                setFormData(prev => ({ ...prev, category: cat, priority: res.data.priority, aiScore: res.data.severity_score }));
            }
        } catch (e) {
            console.error('Prediction failed', e);
        } finally {
            setIsThinking(false);
        }
    };

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

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
            notify('error', e.response?.data?.message || 'ANALYSIS FAILURE');
        } finally {
            setIsCaptioning(false);
        }
    };

    const removeImage = () => {
        setFormData(prev => ({ ...prev, image: null }));
        setImagePreview(null);
        if (imageInputRef.current) imageInputRef.current.value = '';
    };

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
                setFormData(prev => ({ ...prev, description: (prev.description ? prev.description + '\n\n' : '') + res.data.description }));
            }
        } catch (e) {
            notify('error', e.response?.data?.message || 'VIDEO ANALYSIS FAILURE');
        } finally {
            setIsVideoAnalyzing(false);
        }
    };

    const removeVideo = () => {
        setFormData(prev => ({ ...prev, video: null }));
        if (videoInputRef.current) videoInputRef.current.value = '';
    };

    const handleLocationSelect = ({ address, lat, lng }) => setFormData(prev => ({
        ...prev,
        location: address,
        lat: lat || null,
        lng: lng || null,
    }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.category || !formData.location || !formData.description || !formData.image || !formData.priority) {
            notify('error', 'AUTHORIZATION DENIED: MISSING PARAMETERS.');
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
        if (formData.lat != null) data.append('lat', formData.lat);
        if (formData.lng != null) data.append('lng', formData.lng);
        try {
            const res = await api.post('/complaint/create', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (res.status === 201) {
                notify('success', 'INCIDENT TRANSMITTED');
                navigate('/dashboard');
            } else {
                notify('error', res.data.message || 'TRANSMISSION FAILURE');
            }
        } catch (e) {
            notify('error', e.response?.data?.message || 'NETWORK INTERRUPTION');
        } finally {
            setLoading(false);
        }
    };

    const isAiActive = isThinking || isCaptioning || isVideoAnalyzing;
    const deptMeta = formData.category ? DEPT_META[formData.category] : null;
    const prioMeta = formData.priority ? PRIORITY_META[formData.priority] : null;

    return (
        <div style={{ minHeight: '100vh', background: 'transparent' }}>
            {/* Top Bar */}
            <div className="d-flex align-items-center justify-content-between px-4 py-3 glass-sticky">
                <div className="d-flex align-items-center gap-3">
                    <button onClick={() => navigate(-1)} className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                        <FaArrowLeft size={13} className="text-white" />
                    </button>
                    <div>
                        <h5 className="tech-font fw-bold mb-0 text-white" style={{ letterSpacing: '0.15em' }}>REPORT INCIDENT</h5>
                        <small className="tech-font text-muted text-uppercase" style={{ letterSpacing: '0.1em' }}>INITIATE CRISIS UPLINK</small>
                    </div>
                </div>
                <button type="button" onClick={() => setFormData({ title: '', description: '', category: '', priority: '', location: '', lat: null, lng: null, image: null, video: null, aiScore: 0 })}
                    className="btn btn-sm tech-font fw-bold text-uppercase" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', border: '1px solid var(--accent-red)', letterSpacing: '0.1em' }}>
                    ABORT
                </button>
            </div>

            {/* Two-column layout */}
            <form onSubmit={handleSubmit}>
                <div className="d-flex flex-column flex-lg-row" style={{ minHeight: 'calc(100vh - 65px)' }}>
                    {/* LEFT: Form Fields */}
                    <div className="px-4 py-5 w-100" style={{ flex: '1 1 60%' }}>
                        
                        {/* Title */}
                        <div className="mb-5">
                            <label className="tech-font fw-bold text-white mb-2 d-block text-uppercase" style={{ letterSpacing: '0.15em' }}>
                                INCIDENT DESIGNATION <span className="text-neon-red">*</span>
                            </label>
                            <input type="text" name="title" value={formData.title} onChange={handleChange}
                                className="form-control form-control-lg tech-font bg-transparent text-white shadow-none"
                                placeholder="e.g Sector 7 Power Failure" required
                                style={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.95rem' }}
                                onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary-color)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(170,0,255,0.15)'; e.currentTarget.style.background = 'rgba(170,0,255,0.05)'; }}
                                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'transparent'; }}
                            />
                        </div>

                        {/* Description */}
                        <div className="mb-5">
                            <label className="tech-font fw-bold text-white mb-2 d-block text-uppercase" style={{ letterSpacing: '0.15em' }}>
                                SITUATION LOG <span className="text-neon-red">*</span>
                            </label>
                            <textarea name="description" value={formData.description} onChange={handleChange}
                                className="form-control tech-font bg-transparent text-white shadow-none font-monospace" rows={5}
                                placeholder="INPUT SYSTEM LOGS..." required
                                style={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.85rem', resize: 'none' }}
                                onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary-color)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(170,0,255,0.15)'; e.currentTarget.style.background = 'rgba(170,0,255,0.05)'; }}
                                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = 'transparent'; }}
                            />
                            
                            <AnimatePresence>
                                {isAiActive && (
                                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                        className="mt-3 p-4 rounded d-flex align-items-center gap-4"
                                        style={{ background: 'rgba(170,0,255,0.1)', border: '1px solid var(--primary-color)' }}>
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
                                            <FaRobot size={26} className="text-neon-purple" />
                                        </motion.div>
                                        <div>
                                            <p className="tech-font fw-bold mb-0 text-white text-uppercase" style={{ letterSpacing: '0.1em' }}>
                                                {isCaptioning ? 'ANALYZING VISUAL DATA...' : isVideoAnalyzing ? 'DECODING FEED...' : 'PROCESSING VECTORS...'}
                                            </p>
                                        </div>
                                        <div className="ms-auto d-flex gap-1">
                                            {[0, 0.3, 0.6].map((delay, i) => (
                                                <motion.span key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay }}
                                                    style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)', display: 'inline-block' }} />
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Location */}
                        <div className="mb-5">
                            <label className="tech-font fw-bold text-white mb-2 d-block text-uppercase" style={{ letterSpacing: '0.15em' }}>
                                COORDINATES <span className="text-neon-red">*</span>
                            </label>
                            <div className="input-group mb-3">
                                <span className="input-group-text bg-transparent" style={{ borderRadius: '8px 0 0 8px', border: '1px solid rgba(255,255,255,0.2)', borderRight: 'none' }}>
                                    <FaMapMarkerAlt className="text-neon-red" />
                                </span>
                                <input type="text" name="location" value={formData.location} onChange={handleChange}
                                    className="form-control tech-font bg-transparent text-white shadow-none border-start-0"
                                    placeholder="INPUT COORDS..." required
                                    style={{ borderRadius: '0 8px 8px 0', border: '1px solid rgba(255,255,255,0.2)', borderLeft: 'none', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div className="rounded overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                                <LocationPicker onLocationSelect={handleLocationSelect} />
                            </div>
                        </div>

                        {/* Photo Upload */}
                        <div className="mb-5">
                            <label className="tech-font fw-bold text-white mb-2 d-block text-uppercase" style={{ letterSpacing: '0.15em' }}>
                                VISUAL INTEL <span className="text-neon-red">*</span>
                            </label>
                            <input type="file" ref={imageInputRef} onChange={handleImageChange} className="d-none" id="imageUpload" accept="image/*" />
                            {!formData.image ? (
                                <label htmlFor="imageUpload" className="d-flex flex-column align-items-center justify-content-center gap-3 cursor-pointer hover-bg-light"
                                    style={{ border: '1px dashed rgba(255,255,255,0.3)', borderRadius: '8px', padding: '40px', background: 'transparent' }}>
                                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(170,0,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FaCloudUploadAlt size={26} className="text-neon-purple" />
                                    </div>
                                    <div className="text-center">
                                        <p className="tech-font fw-bold text-white mb-1 text-uppercase">UPLOAD FEED</p>
                                    </div>
                                </label>
                            ) : (
                                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="position-relative rounded overflow-hidden" style={{ maxHeight: '340px', border: '1px solid var(--primary-color)' }}>
                                    <img src={imagePreview} alt="Intel" className="w-100 object-fit-cover" style={{ maxHeight: '340px', filter: 'brightness(0.85)' }} />
                                    <div className="position-absolute bottom-0 start-0 end-0 d-flex align-items-center justify-content-between px-3 py-2" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}>
                                        <div className="d-flex align-items-center gap-2 text-white">
                                            <FaCamera size={13} className="text-neon-purple" />
                                            <small className="tech-font fw-bold text-truncate" style={{ maxWidth: '260px' }}>{formData.image.name}</small>
                                        </div>
                                        <button type="button" onClick={removeImage} className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', background: 'rgba(239,68,68,0.2)', border: '1px solid var(--accent-red)' }}>
                                            <FaTimes size={11} className="text-neon-red" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Validation Panel */}
                    <div className="px-4 py-5 d-flex flex-column gap-4 glass-card border-end-0 border-top-0 border-bottom-0" style={{ flex: '0 0 380px', width: '380px', position: 'sticky', top: '65px', height: 'calc(100vh - 65px)', overflowY: 'auto', borderRadius: 0, borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                        <div>
                            <label className="tech-font fw-bold text-muted text-uppercase mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.72rem', letterSpacing: '0.15em' }}>
                                <FaTerminal className="text-neon-purple" /> AUTO-DIAGNOSTICS
                            </label>

                            {/* Department */}
                            <div className="mb-3 p-3 rounded border d-flex align-items-center gap-3" style={{ background: deptMeta ? deptMeta.bg : 'rgba(255,255,255,0.05)', borderColor: deptMeta ? deptMeta.color : 'rgba(255,255,255,0.2)' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: deptMeta ? 'transparent' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {deptMeta ? <deptMeta.icon size={18} style={{ color: deptMeta.color }} /> : <FaRobot size={16} className="text-muted" />}
                                </div>
                                <div>
                                    <p className="tech-font fw-bold small mb-0 text-uppercase" style={{ color: deptMeta ? deptMeta.color : 'var(--text-muted)' }}>
                                        {formData.category || 'PENDING...'}
                                    </p>
                                </div>
                                {formData.category && <FaCheckCircle className="ms-auto text-neon-green" />}
                            </div>

                            {/* Priority */}
                            <div className="p-3 rounded border d-flex align-items-center gap-3" style={{ background: prioMeta ? prioMeta.bg : 'rgba(255,255,255,0.05)', borderColor: prioMeta ? prioMeta.color : 'rgba(255,255,255,0.2)' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: prioMeta ? 'transparent' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FaExclamationTriangle size={16} style={{ color: prioMeta ? prioMeta.color : 'var(--text-muted)' }} />
                                </div>
                                <div>
                                    <p className="tech-font fw-bold small mb-0 text-uppercase" style={{ color: prioMeta ? prioMeta.color : 'var(--text-muted)' }}>
                                        {prioMeta ? prioMeta.label : 'PENDING...'}
                                    </p>
                                </div>
                                {formData.priority && <FaCheckCircle className="ms-auto text-neon-green" />}
                            </div>

                            {formData.aiScore > 0 && (
                                <div className="mt-3 p-3 rounded" style={{ background: 'rgba(163,230,53,0.05)', border: '1px solid var(--secondary-color)' }}>
                                    <div className="d-flex align-items-center justify-content-between mb-2">
                                        <small className="tech-font fw-bold text-muted text-uppercase" style={{ letterSpacing: '0.1em' }}>THREAT LEVEL</small>
                                        <small className="tech-font fw-bold text-neon-green">{Math.round(formData.aiScore)}%</small>
                                    </div>
                                    <div className="progress rounded-pill bg-dark" style={{ height: '4px' }}>
                                        <div className="progress-bar" style={{ width: `${formData.aiScore}%`, background: 'var(--secondary-color)' }} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="tech-font fw-bold text-muted text-uppercase mb-3 d-flex align-items-center gap-2" style={{ fontSize: '0.72rem', letterSpacing: '0.15em' }}>
                                SUBMISSION PARAMS
                            </label>
                            {[
                                { label: 'DESIGNATION', done: !!formData.title },
                                { label: 'LOGS', done: formData.description.length > 10 },
                                { label: 'COORDS', done: !!formData.location },
                                { label: 'INTEL', done: !!formData.image },
                                { label: 'ROUTING', done: !!formData.category },
                                { label: 'PRIORITY', done: !!formData.priority },
                            ].map((item, i) => (
                                <div key={i} className="d-flex align-items-center gap-2 mb-2">
                                    <span style={{ width: '16px', height: '16px', background: item.done ? 'rgba(163,230,53,0.2)' : 'rgba(255,255,255,0.1)', border: `1px solid ${item.done ? 'var(--secondary-color)' : 'transparent'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {item.done && <FaCheckCircle size={8} className="text-neon-green" />}
                                    </span>
                                    <small className={`tech-font fw-bold ${item.done ? 'text-white' : 'text-muted'} text-uppercase`} style={{ letterSpacing: '0.1em' }}>{item.label}</small>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto">
                            <button type="submit" disabled={loading || isAiActive}
                                className="btn w-100 fw-bold py-3 text-uppercase tech-font"
                                style={{
                                    background: (loading || isAiActive) ? 'rgba(255,255,255,0.1)' : 'var(--primary-color)',
                                    color: 'white', border: '1px solid ' + ((loading || isAiActive) ? 'rgba(255,255,255,0.2)' : 'var(--primary-color)'),
                                    letterSpacing: '0.2em'
                                }}>
                                {loading || isAiActive ? <span className="spinner-border spinner-border-sm" /> : 'TRANSMIT LOG'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ReportIssue;
