import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FaExclamationTriangle, FaCalendarAlt, FaCheckCircle,
    FaHourglassHalf, FaBan, FaMapMarkerAlt, FaPencilAlt,
    FaClipboardList, FaArrowRight, FaTerminal
} from 'react-icons/fa';
import api from '../api/axios';
import ComplaintDetailsModal from '../components/ComplaintDetailsModal';

const STATUS_META = {
    Resolved: { color: 'var(--secondary-color)', bg: 'rgba(163, 230, 53, 0.1)', border: 'var(--secondary-color)', icon: FaCheckCircle, label: 'RESOLVED' },
    Pending: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', icon: FaHourglassHalf, label: 'PENDING' },
    'In Progress': { color: '#00f0ff', bg: 'rgba(0, 240, 255, 0.1)', border: '#00f0ff', icon: FaHourglassHalf, label: 'IN PROGRESS' },
    Rejected: { color: 'var(--accent-red)', bg: 'rgba(239, 68, 68, 0.1)', border: 'var(--accent-red)', icon: FaBan, label: 'REJECTED' },
    Closed: { color: 'var(--secondary-color)', bg: 'rgba(163, 230, 53, 0.1)', border: 'var(--secondary-color)', icon: FaCheckCircle, label: 'CLOSED' },
};

const getStatusMeta = (s) => STATUS_META[s] || { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', border: 'rgba(255,255,255,0.2)', icon: FaExclamationTriangle, label: s?.toUpperCase() || 'UNKNOWN' };

const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();

const getTitle = (desc) => {
    if (!desc) return 'ISSUE REPORT';
    const m = desc.match(/^\*\*(.*?)\*\*/);
    return m ? m[1].toUpperCase() : desc.split('\n')[0].slice(0, 60).toUpperCase() || 'ISSUE REPORT';
};

const Contributions = () => {
    const [contributions, setContributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [filter, setFilter] = useState('All');

    const fetchContributions = async () => {
        try {
            const res = await api.get('/complaint/my-contributions');
            if (res.data.status === 'success') setContributions(res.data.data);
        } catch (e) {
            console.error('Data retrieval failed:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchContributions(); }, []);

    const total = contributions.length;
    const resolved = contributions.filter(c => c.complaintStatus === 'Resolved' || c.complaintStatus === 'Closed').length;
    const pending = contributions.filter(c => c.complaintStatus === 'Pending' || c.complaintStatus === 'In Progress').length;
    const impact = (total * 10) + (resolved * 20);

    const FILTERS = ['All', 'Pending', 'In Progress', 'Resolved', 'Rejected'];
    const filtered = filter === 'All' ? contributions : contributions.filter(c => c.complaintStatus === filter);

    const stats = [
        { label: 'TOTAL LOGGED', value: total, color: 'var(--primary-color)' },
        { label: 'RESOLVED', value: resolved, color: 'var(--secondary-color)' },
        { label: 'IN PROGRESS', value: pending, color: '#f59e0b' },
        { label: 'IMPACT RECORD', value: impact, color: '#00f0ff' },
    ];

    return (
        <div className="p-4 p-md-5" style={{ background: 'transparent', minHeight: '100vh' }}>
            {/* Header */}
            <div className="mb-5 d-flex align-items-center gap-3">
                <FaTerminal size={28} className="text-neon-purple" />
                <div>
                    <h2 className="tech-font fw-bold text-white ls-tight mb-0 text-uppercase" style={{ letterSpacing: '0.15em' }}>MY CONTRIBUTIONS</h2>
                    <p className="tech-font text-muted mb-0 text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.1em' }}>TRACK ISSUES REPORTED BY YOUR LOCAL NODE</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="row g-4 mb-5">
                {stats.map((s, i) => {
                    const rgb = s.color === 'var(--primary-color)' ? '170,0,255' : s.color === 'var(--secondary-color)' ? '163,230,53' : s.color === '#f59e0b' ? '245,158,11' : '0,240,255';
                    return (
                        <div className="col-md-3" key={i}>
                            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                                className="glass-card p-4 d-flex align-items-center gap-4 hover-scale"
                                style={{ borderLeft: `3px solid ${s.color}` }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: `rgba(${rgb}, 0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${s.color}` }}>
                                    <FaClipboardList size={20} style={{ color: s.color }} />
                                </div>
                                <div>
                                    <h3 className="tech-font fw-bold mb-0 text-white" style={{ letterSpacing: '0.1em' }}>{s.value.toLocaleString()}</h3>
                                    <small className="tech-font text-muted fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.15em' }}>{s.label}</small>
                                </div>
                            </motion.div>
                        </div>
                    );
                })}
            </div>

            {/* Filter Tabs */}
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
                <div className="d-flex align-items-center gap-2">
                    <FaTerminal className="text-neon-purple" size={14} />
                    <h5 className="tech-font fw-bold text-white mb-0 text-uppercase" style={{ letterSpacing: '0.15em' }}>ACTIVITY LOG</h5>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    {FILTERS.map(f => (
                        <button key={f} onClick={() => setFilter(f)} className="btn tech-font fw-bold text-uppercase"
                            style={{
                                borderRadius: '4px', padding: '6px 14px',
                                background: filter === f ? 'rgba(170,0,255,0.2)' : 'transparent',
                                color: filter === f ? 'white' : 'var(--text-muted)',
                                border: `1px solid ${filter === f ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)'}`,
                                fontSize: '0.75rem', letterSpacing: '0.1em', transition: 'all 0.15s'
                            }}>
                            {f}
                            {f !== 'All' && (
                                <span className="ms-2 badge rounded" style={{ background: filter === f ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.6rem', padding: '3px 6px' }}>
                                    {contributions.filter(c => c.complaintStatus === f).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-5">
                    <span className="spinner-border text-neon-purple" role="status" />
                    <p className="tech-font mt-3 text-muted text-uppercase" style={{ letterSpacing: '0.2em', fontSize: '0.8rem' }}>FETCHING NETWORK LOGS...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-5 glass-card">
                    <FaClipboardList size={40} className="text-muted mb-3" style={{ opacity: 0.3 }} />
                    <h6 className="tech-font text-white fw-bold text-uppercase" style={{ letterSpacing: '0.15em' }}>NO LOGS FOUND</h6>
                    <p className="tech-font text-muted small mb-0 text-uppercase" style={{ letterSpacing: '0.1em' }}>
                        {filter === 'All' ? "NO INCIDENTS FILED." : `NO ${filter} INCIDENTS MATCH.`}
                    </p>
                </div>
            ) : (
                <div className="d-flex flex-column gap-3">
                    {filtered.map((item, idx) => {
                        const sm = getStatusMeta(item.complaintStatus);
                        const StatusIcon = sm.icon;
                        return (
                            <motion.div key={item._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} onClick={() => setSelected(item)}
                                className="glass-card d-flex align-items-center gap-4 px-4 py-4 cursor-pointer hover-bg-light"
                                style={{ borderLeft: `3px solid ${sm.border}`, transition: 'all 0.15s', cursor: 'pointer' }}>
                                
                                {/* Image or placeholder */}
                                <div className="rounded overflow-hidden flex-shrink-0" style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    {item.complaintImage ? <img src={item.complaintImage} alt="Intel" className="w-100 h-100 object-fit-cover" style={{ filter: 'brightness(0.9) contrast(1.1)' }} />
                                        : <div className="w-100 h-100 d-flex align-items-center justify-content-center"><FaExclamationTriangle size={20} className="text-muted" style={{ opacity: 0.4 }} /></div>}
                                </div>

                                {/* Main info */}
                                <div className="flex-grow-1 min-width-0">
                                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                                        <h6 className="tech-font fw-bold text-white mb-0 text-truncate tracking-widest">{getTitle(item.complaintDescription)}</h6>
                                        {item.isEdited && (
                                            <span className="badge tech-font d-flex align-items-center gap-1 text-uppercase" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid #f59e0b', fontSize: '0.55rem', padding: '2px 6px', letterSpacing: '0.1em' }}>
                                                <FaPencilAlt size={7} /> EDITED
                                            </span>
                                        )}
                                    </div>
                                    <div className="d-flex align-items-center gap-3 text-muted tech-font text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>
                                        <span className="d-flex align-items-center gap-1">
                                            <FaMapMarkerAlt size={10} className="text-neon-red" />
                                            <span className="text-truncate" style={{ maxWidth: '200px' }}>{item.complaintLocation}</span>
                                        </span>
                                        <span className="d-flex align-items-center gap-1">
                                            <FaCalendarAlt size={10} />
                                            {formatDate(item.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="d-flex align-items-center gap-3 flex-shrink-0">
                                    <span className="badge tech-font fw-bold px-3 py-2 d-flex align-items-center gap-2 text-uppercase"
                                        style={{ background: sm.bg, color: sm.color, border: `1px solid ${sm.border}`, fontSize: '0.7rem', letterSpacing: '0.1em' }}>
                                        <StatusIcon size={10} /> {sm.label}
                                    </span>
                                    <FaArrowRight size={13} className="text-muted" />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            <ComplaintDetailsModal isOpen={!!selected} onClose={() => setSelected(null)} complaint={selected} onUpdate={() => {
                fetchContributions().then(() => {
                    if (selected) {
                        setContributions(prev => {
                            const updated = prev.find(c => c.complaintId === selected.complaintId || c._id === selected._id);
                            if (updated) setSelected(updated);
                            return prev;
                        });
                    }
                });
            }} />
        </div>
    );
};

export default Contributions;
