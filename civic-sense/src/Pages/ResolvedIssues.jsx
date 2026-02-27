import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FaSearch, FaCheckCircle, FaMapMarkerAlt, FaEye,
    FaCalendarAlt, FaFilter
} from 'react-icons/fa';
import api from '../api/axios';
import { notify } from '../utils/notify';
import ComplaintDetailsModal from '../components/ComplaintDetailsModal';

const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const ResolvedIssues = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get('/complaint/resolved');
                if (res.data?.data) setComplaints(res.data.data);
            } catch (e) {
                notify('error', 'Failed to fetch resolved issues');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const filtered = complaints.filter(c =>
        (c.complaintType?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (c.complaintLocation?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (c.complaintId?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-5" style={{ background: '#f8fafc', minHeight: '100vh' }}>

            {/* ── Header ── */}
            <div className="d-flex justify-content-between align-items-start mb-5">
                <div>
                    <h2 className="fw-bold text-dark ls-tight mb-1">Resolved Issues</h2>
                    <p className="text-muted mb-0">
                        Transparency portal — civic issues addressed and closed by authorities.
                    </p>
                </div>

                {/* Summary badge */}
                {!loading && (
                    <div
                        className="d-flex align-items-center gap-2 px-4 py-3 rounded-3 border"
                        style={{ background: '#ecfdf5', borderColor: '#6ee7b7' }}
                    >
                        <FaCheckCircle style={{ color: '#10b981' }} />
                        <div>
                            <span className="fw-bold text-dark">{complaints.length}</span>
                            <span className="text-muted small ms-1">issues resolved</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Toolbar ── */}
            <div className="d-flex align-items-center justify-content-between mb-4 gap-3">
                <div className="d-flex align-items-center bg-white rounded-3 border px-3 py-2" style={{ width: '340px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <FaSearch className="text-muted me-2" size={13} />
                    <input
                        type="text"
                        className="form-control border-0 p-0 shadow-none bg-transparent"
                        placeholder="Search by type, location or ID..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ fontSize: '0.87rem' }}
                    />
                    {searchTerm && (
                        <button className="btn btn-sm p-0 text-muted ms-2" onClick={() => setSearchTerm('')}>
                            &times;
                        </button>
                    )}
                </div>

                {/* View toggle */}
                <div className="d-flex gap-1 bg-white border rounded-3 p-1">
                    {[['grid', 'Grid'], ['list', 'List']].map(([mode, label]) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className="btn btn-sm fw-medium px-3"
                            style={{
                                borderRadius: '8px',
                                background: viewMode === mode ? '#1e293b' : 'transparent',
                                color: viewMode === mode ? 'white' : '#64748b',
                                border: 'none',
                                fontSize: '0.82rem',
                                transition: 'all 0.15s'
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Content ── */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-5 bg-white rounded-4 border">
                    <FaCheckCircle size={40} className="text-muted mb-3" style={{ opacity: 0.25 }} />
                    <h6 className="fw-bold text-dark">No resolved issues found</h6>
                    <p className="text-muted small mb-0">
                        {searchTerm ? 'Try adjusting your search.' : 'No issues have been resolved yet.'}
                    </p>
                </div>
            ) : viewMode === 'grid' ? (
                /* ── Grid View ── */
                <div className="row g-4">
                    {filtered.map((c, i) => (
                        <div className="col-lg-4 col-md-6" key={c._id || c.complaintId}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                onClick={() => setSelected(c)}
                                className="bg-white rounded-4 border overflow-hidden d-flex flex-column h-100 cursor-pointer"
                                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)', transition: 'all 0.18s', cursor: 'pointer' }}
                                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                {/* Image */}
                                {c.complaintImage ? (
                                    <div style={{ height: '190px', overflow: 'hidden', flexShrink: 0 }}>
                                        <img src={c.complaintImage} alt={c.complaintType} className="w-100 h-100 object-fit-cover" />
                                    </div>
                                ) : (
                                    <div className="d-flex align-items-center justify-content-center" style={{ height: '130px', background: '#f0fdf4', flexShrink: 0 }}>
                                        <FaCheckCircle size={44} style={{ color: '#6ee7b7' }} />
                                    </div>
                                )}

                                <div className="p-4 d-flex flex-column flex-grow-1">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <span
                                            className="badge rounded-pill fw-medium px-3 py-1"
                                            style={{ background: '#ecfdf5', color: '#10b981', border: '1px solid #6ee7b7', fontSize: '0.75rem' }}
                                        >
                                            {c.complaintStatus}
                                        </span>
                                        <small className="text-muted fw-medium">#{c.complaintId?.substring(0, 8) || 'N/A'}</small>
                                    </div>

                                    <h6 className="fw-bold text-dark mb-2 text-truncate">{c.complaintType}</h6>
                                    <p
                                        className="text-muted mb-3"
                                        style={{
                                            fontSize: '0.83rem',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        {c.complaintDescription?.replace(/^\*\*(.*?)\*\*\n?/, '').trim() || 'No description.'}
                                    </p>

                                    <div className="mt-auto pt-3 border-top">
                                        <div className="d-flex align-items-center gap-2 text-muted mb-2" style={{ fontSize: '0.8rem' }}>
                                            <FaMapMarkerAlt className="text-danger" size={11} />
                                            <span className="text-truncate">{c.complaintLocation}</span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center text-muted" style={{ fontSize: '0.78rem' }}>
                                            <span className="d-flex align-items-center gap-1">
                                                <FaCalendarAlt size={10} />
                                                {formatDate(c.complaintResolvedDate || c.updatedAt)}
                                            </span>
                                            <button
                                                onClick={e => { e.stopPropagation(); setSelected(c); }}
                                                className="btn btn-sm d-flex align-items-center gap-1 fw-medium"
                                                style={{ borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.78rem', color: '#475569' }}
                                            >
                                                <FaEye size={11} /> View
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>
            ) : (
                /* ── List View ── */
                <div className="d-flex flex-column gap-3">
                    {filtered.map((c, i) => (
                        <motion.div
                            key={c._id || c.complaintId}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            onClick={() => setSelected(c)}
                            className="bg-white rounded-4 border d-flex align-items-center gap-4 px-4 py-3 cursor-pointer"
                            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.15s', cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'}
                        >
                            {/* Thumbnail */}
                            <div className="rounded-3 overflow-hidden flex-shrink-0" style={{ width: '56px', height: '56px', background: '#f0fdf4' }}>
                                {c.complaintImage
                                    ? <img src={c.complaintImage} alt="" className="w-100 h-100 object-fit-cover" />
                                    : <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                                        <FaCheckCircle size={22} style={{ color: '#6ee7b7' }} />
                                    </div>
                                }
                            </div>

                            <div className="flex-grow-1 min-width-0">
                                <div className="d-flex align-items-baseline gap-2 mb-1">
                                    <h6 className="fw-bold text-dark mb-0 text-truncate">{c.complaintType}</h6>
                                    <small className="text-muted flex-shrink-0">#{c.complaintId?.substring(0, 8)}</small>
                                </div>
                                <div className="d-flex align-items-center gap-3 text-muted" style={{ fontSize: '0.79rem' }}>
                                    <span className="d-flex align-items-center gap-1">
                                        <FaMapMarkerAlt size={10} className="text-danger" />
                                        <span className="text-truncate" style={{ maxWidth: '200px' }}>{c.complaintLocation}</span>
                                    </span>
                                    <span className="d-flex align-items-center gap-1">
                                        <FaCalendarAlt size={10} />
                                        {formatDate(c.complaintResolvedDate || c.updatedAt)}
                                    </span>
                                </div>
                            </div>

                            <span
                                className="badge rounded-pill fw-medium px-3 py-2 flex-shrink-0"
                                style={{ background: '#ecfdf5', color: '#10b981', border: '1px solid #6ee7b7', fontSize: '0.76rem' }}
                            >
                                {c.complaintStatus}
                            </span>

                            <button
                                onClick={e => { e.stopPropagation(); setSelected(c); }}
                                className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{ width: '34px', height: '34px', background: '#f8fafc', border: '1px solid #e2e8f0' }}
                            >
                                <FaEye size={13} className="text-muted" />
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <ComplaintDetailsModal
                isOpen={!!selected}
                onClose={() => setSelected(null)}
                complaint={selected}
            />
        </div>
    );
};

export default ResolvedIssues;
