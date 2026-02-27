import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FaExclamationTriangle, FaCalendarAlt, FaCheckCircle,
    FaHourglassHalf, FaBan, FaMapMarkerAlt, FaPencilAlt,
    FaClipboardList, FaArrowRight
} from 'react-icons/fa';
import api from '../api/axios';
import ComplaintDetailsModal from '../components/ComplaintDetailsModal';

const STATUS_META = {
    Resolved: { color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7', icon: FaCheckCircle, label: 'Resolved' },
    Pending: { color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d', icon: FaHourglassHalf, label: 'Pending' },
    'In Progress': { color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd', icon: FaHourglassHalf, label: 'In Progress' },
    Rejected: { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5', icon: FaBan, label: 'Rejected' },
    Closed: { color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7', icon: FaCheckCircle, label: 'Closed' },
};

const getStatusMeta = (s) => STATUS_META[s] || { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', icon: FaExclamationTriangle, label: s };

const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const getTitle = (desc) => {
    if (!desc) return 'Issue Report';
    const m = desc.match(/^\*\*(.*?)\*\*/);
    return m ? m[1] : desc.split('\n')[0].slice(0, 60) || 'Issue Report';
};

const getDescription = (desc) =>
    desc ? desc.replace(/^\*\*(.*?)\*\*\n?/, '').trim() : '';

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
            console.error('Error fetching contributions:', e);
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
    const filtered = filter === 'All'
        ? contributions
        : contributions.filter(c => c.complaintStatus === filter);

    const stats = [
        { label: 'Total Filed', value: total, color: '#6366f1', bg: '#eef2ff' },
        { label: 'Resolved', value: resolved, color: '#10b981', bg: '#ecfdf5' },
        { label: 'In Progress', value: pending, color: '#f59e0b', bg: '#fffbeb' },
        { label: 'Impact Points', value: impact, color: '#8b5cf6', bg: '#f5f3ff' },
    ];

    return (
        <div className="p-5" style={{ background: '#f8fafc', minHeight: '100vh' }}>

            {/* ── Header ── */}
            <div className="mb-5">
                <h2 className="fw-bold text-dark ls-tight mb-1">My Contributions</h2>
                <p className="text-muted mb-0">Track the civic issues you've reported and their current status.</p>
            </div>

            {/* ── Stats Row ── */}
            <div className="row g-4 mb-5">
                {stats.map((s, i) => (
                    <div className="col-md-3" key={i}>
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="bg-white rounded-4 border p-4 d-flex align-items-center gap-4"
                            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                        >
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <FaClipboardList size={20} style={{ color: s.color }} />
                            </div>
                            <div>
                                <h3 className="fw-bold mb-0" style={{ color: s.color }}>{s.value.toLocaleString()}</h3>
                                <small className="text-muted fw-medium">{s.label}</small>
                            </div>
                        </motion.div>
                    </div>
                ))}
            </div>

            {/* ── Filter Tabs ── */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <h5 className="fw-bold text-dark mb-0">Activity Log</h5>
                <div className="d-flex gap-2">
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className="btn btn-sm fw-medium"
                            style={{
                                borderRadius: '10px',
                                padding: '6px 16px',
                                background: filter === f ? '#1e293b' : 'white',
                                color: filter === f ? 'white' : '#64748b',
                                border: `1.5px solid ${filter === f ? '#1e293b' : '#e2e8f0'}`,
                                fontSize: '0.82rem',
                                transition: 'all 0.15s'
                            }}
                        >
                            {f}
                            {f !== 'All' && (
                                <span className="ms-2 badge rounded-pill" style={{ background: filter === f ? 'rgba(255,255,255,0.2)' : '#f1f5f9', color: filter === f ? 'white' : '#64748b', fontSize: '0.7rem' }}>
                                    {contributions.filter(c => c.complaintStatus === f).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── List ── */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-5 bg-white rounded-4 border">
                    <FaClipboardList size={40} className="text-muted mb-3" style={{ opacity: 0.3 }} />
                    <h6 className="text-dark fw-bold">No complaints found</h6>
                    <p className="text-muted small mb-0">
                        {filter === 'All' ? "You haven't filed any complaints yet." : `No ${filter} complaints.`}
                    </p>
                </div>
            ) : (
                <div className="d-flex flex-column gap-3">
                    {filtered.map((item, idx) => {
                        const sm = getStatusMeta(item.complaintStatus);
                        const StatusIcon = sm.icon;
                        return (
                            <motion.div
                                key={item._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => setSelected(item)}
                                className="bg-white rounded-4 border d-flex align-items-center gap-4 px-4 py-4 cursor-pointer"
                                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'all 0.15s', cursor: 'pointer' }}
                                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'}
                            >
                                {/* Image or placeholder */}
                                <div
                                    className="rounded-3 overflow-hidden flex-shrink-0"
                                    style={{ width: '64px', height: '64px', background: '#f1f5f9' }}
                                >
                                    {item.complaintImage
                                        ? <img src={item.complaintImage} alt="" className="w-100 h-100 object-fit-cover" />
                                        : <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                                            <FaExclamationTriangle size={20} className="text-muted" style={{ opacity: 0.4 }} />
                                        </div>
                                    }
                                </div>

                                {/* Main info */}
                                <div className="flex-grow-1 min-width-0">
                                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                                        <h6 className="fw-bold text-dark mb-0 text-truncate">
                                            {getTitle(item.complaintDescription)}
                                        </h6>
                                        {item.isEdited && (
                                            <span className="badge d-flex align-items-center gap-1" style={{ background: '#fff3cd', color: '#92400e', border: '1px solid #fcd34d', fontSize: '0.65rem', padding: '2px 7px', borderRadius: '20px' }}>
                                                <FaPencilAlt size={7} /> Edited
                                            </span>
                                        )}
                                    </div>
                                    <div className="d-flex align-items-center gap-3 text-muted" style={{ fontSize: '0.8rem' }}>
                                        <span className="d-flex align-items-center gap-1">
                                            <FaMapMarkerAlt size={11} className="text-danger" />
                                            <span className="text-truncate" style={{ maxWidth: '200px' }}>{item.complaintLocation}</span>
                                        </span>
                                        <span className="d-flex align-items-center gap-1">
                                            <FaCalendarAlt size={11} />
                                            {formatDate(item.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="d-flex align-items-center gap-3 flex-shrink-0">
                                    <span
                                        className="badge rounded-pill fw-medium px-3 py-2 d-flex align-items-center gap-2"
                                        style={{ background: sm.bg, color: sm.color, border: `1px solid ${sm.border}`, fontSize: '0.78rem' }}
                                    >
                                        <StatusIcon size={10} />
                                        {sm.label}
                                    </span>
                                    <FaArrowRight size={13} className="text-muted" />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            <ComplaintDetailsModal
                isOpen={!!selected}
                onClose={() => setSelected(null)}
                complaint={selected}
                onUpdate={() => {
                    fetchContributions().then(() => {
                        if (selected) {
                            setContributions(prev => {
                                const updated = prev.find(c => c.complaintId === selected.complaintId || c._id === selected._id);
                                if (updated) setSelected(updated);
                                return prev;
                            });
                        }
                    });
                }}
            />
        </div>
    );
};

export default Contributions;
