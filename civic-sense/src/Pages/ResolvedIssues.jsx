import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FaSearch, FaCheckCircle, FaMapMarkerAlt, FaEye,
    FaCalendarAlt, FaTerminal
} from 'react-icons/fa';
import api from '../api/axios';
import { notify } from '../utils/notify';
import ComplaintDetailsModal from '../components/ComplaintDetailsModal';

const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();

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
                notify('error', 'FAILED TO RETRIEVE ARCHIVES');
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
        <div className="p-4 p-md-5" style={{ background: 'transparent', minHeight: '100vh' }}>

            {/* Header */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start mb-5 gap-3">
                <div className="d-flex align-items-center gap-3">
                    <FaTerminal size={28} className="text-secondary" />
                    <div>
                        <h2 className="tech-font fw-bold text-white ls-tight mb-0 text-uppercase" style={{ letterSpacing: '0.15em' }}>RESOLVED ARCHIVES</h2>
                        <p className="tech-font text-muted mb-0 text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                            TRANSPARENCY PORTAL — SECURED AND CLOSED CIVIC INCIDENTS.
                        </p>
                    </div>
                </div>

                {!loading && (
                    <div className="d-flex align-items-center gap-2 px-4 py-3 rounded border" style={{ background: 'rgba(163,230,53,0.1)', borderColor: 'var(--secondary-color)' }}>
                        <FaCheckCircle className="pulse-animation" style={{ color: 'var(--secondary-color)' }} />
                        <div className="tech-font">
                            <span className="fw-bold text-white fs-5">{complaints.length}</span>
                            <span className="text-secondary small ms-2 text-uppercase tracking-widest" style={{ letterSpacing: '0.1em' }}>ARCHIVED</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Toolbar */}
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
                <div className="d-flex align-items-center rounded border px-3 py-2" style={{ width: '340px', background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
                    <FaSearch className="text-muted me-2" size={13} />
                    <input type="text" className="form-control tech-font text-white border-0 p-0 shadow-none bg-transparent"
                        placeholder="SEARCH ARCHIVES..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        style={{ fontSize: '0.85rem', letterSpacing: '0.1em' }}
                    />
                    {searchTerm && (
                        <button className="btn btn-sm p-0 text-muted ms-2" onClick={() => setSearchTerm('')}>&times;</button>
                    )}
                </div>

                {/* View toggle */}
                <div className="d-flex gap-1 border rounded p-1" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
                    {[['grid', 'MATRIX'], ['list', 'TABLE']].map(([mode, label]) => (
                        <button key={mode} onClick={() => setViewMode(mode)} className="btn btn-sm tech-font fw-bold px-3 text-uppercase"
                            style={{
                                borderRadius: '4px', background: viewMode === mode ? 'rgba(163,230,53,0.2)' : 'transparent',
                                color: viewMode === mode ? 'var(--secondary-color)' : 'var(--text-muted)', border: 'none',
                                fontSize: '0.75rem', letterSpacing: '0.1em', transition: 'all 0.15s'
                            }}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="text-center py-5">
                    <span className="spinner-border text-neon-green" role="status" />
                    <p className="tech-font mt-3 text-muted text-uppercase" style={{ letterSpacing: '0.2em', fontSize: '0.8rem' }}>DECRYPTING ARCHIVES...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-5 glass-card">
                    <FaCheckCircle size={40} className="text-secondary mb-3" style={{ opacity: 0.25 }} />
                    <h6 className="tech-font fw-bold text-white text-uppercase" style={{ letterSpacing: '0.15em' }}>NO ARCHIVES FOUND</h6>
                    <p className="tech-font text-muted small mb-0 text-uppercase" style={{ letterSpacing: '0.1em' }}>
                        {searchTerm ? 'ADJUST QUERY PARAMETERS.' : 'DATABASE EMPTY.'}
                    </p>
                </div>
            ) : viewMode === 'grid' ? (
                /* Grid View */
                <div className="row g-4">
                    {filtered.map((c, i) => (
                        <div className="col-lg-4 col-md-6" key={c._id || c.complaintId}>
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} onClick={() => setSelected(c)}
                                className="glass-card overflow-hidden d-flex flex-column h-100 hover-scale cursor-pointer"
                                style={{ borderBottom: '2px solid var(--secondary-color)', transition: 'all 0.18s' }}>
                                {/* Image */}
                                {c.complaintImage ? (
                                    <div style={{ height: '190px', overflow: 'hidden', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <img src={c.complaintImage} alt="Intel" className="w-100 h-100 object-fit-cover" style={{ filter: 'brightness(0.8) contrast(1.2)' }} />
                                    </div>
                                ) : (
                                    <div className="d-flex align-items-center justify-content-center" style={{ height: '190px', background: 'rgba(163,230,53,0.05)', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <FaCheckCircle size={44} style={{ color: 'var(--secondary-color)' }} />
                                    </div>
                                )}

                                <div className="p-4 d-flex flex-column flex-grow-1">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <span className="badge tech-font fw-bold px-3 py-1 text-uppercase" style={{ background: 'rgba(163,230,53,0.1)', color: 'var(--secondary-color)', border: '1px solid var(--secondary-color)', fontSize: '0.65rem', letterSpacing: '0.1em' }}>
                                            {c.complaintStatus}
                                        </span>
                                        <small className="tech-font text-muted fw-bold">#{c.complaintId?.substring(0, 8) || 'N/A'}</small>
                                    </div>

                                    <h6 className="tech-font fw-bold text-white mb-2 text-truncate tracking-widest text-uppercase">{c.complaintType}</h6>
                                    <p className="text-secondary mb-3 font-monospace" style={{ fontSize: '0.8rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.6 }}>
                                        {c.complaintDescription?.replace(/^\*\*(.*?)\*\*\n?/, '').trim() || 'NO LOG DATA.'}
                                    </p>

                                    <div className="mt-auto pt-3 border-top" style={{ borderColor: 'rgba(255,255,255,0.1) !important' }}>
                                        <div className="d-flex align-items-center gap-2 text-muted tech-font mb-2 text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.1em' }}>
                                            <FaMapMarkerAlt className="text-neon-red" size={11} />
                                            <span className="text-truncate">{c.complaintLocation}</span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center text-muted tech-font text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.1em' }}>
                                            <span className="d-flex align-items-center gap-1"><FaCalendarAlt size={10} /> {formatDate(c.complaintResolvedDate || c.updatedAt)}</span>
                                            <button onClick={e => { e.stopPropagation(); setSelected(c); }} className="btn btn-sm d-flex align-items-center gap-1 tech-font fw-bold text-uppercase"
                                                style={{ borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.65rem', color: 'white', letterSpacing: '0.1em' }}>
                                                <FaEye size={11} /> DECRYPT
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>
            ) : (
                /* List View */
                <div className="d-flex flex-column gap-3">
                    {filtered.map((c, i) => (
                        <motion.div key={c._id || c.complaintId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} onClick={() => setSelected(c)}
                            className="glass-card d-flex align-items-center gap-4 px-4 py-3 cursor-pointer hover-bg-light"
                            style={{ borderLeft: '3px solid var(--secondary-color)', transition: 'all 0.15s' }}>
                            {/* Thumbnail */}
                            <div className="rounded overflow-hidden flex-shrink-0" style={{ width: '56px', height: '56px', background: 'rgba(163,230,53,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                {c.complaintImage ? <img src={c.complaintImage} alt="Intel" className="w-100 h-100 object-fit-cover" style={{ filter: 'brightness(0.9) contrast(1.1)' }} />
                                    : <div className="w-100 h-100 d-flex align-items-center justify-content-center"><FaCheckCircle size={22} className="text-secondary" /></div>}
                            </div>

                            <div className="flex-grow-1 min-width-0">
                                <div className="d-flex align-items-baseline gap-2 mb-1">
                                    <h6 className="tech-font fw-bold text-white mb-0 text-truncate tracking-widest text-uppercase">{c.complaintType}</h6>
                                    <small className="tech-font text-muted flex-shrink-0 fw-bold">#{c.complaintId?.substring(0, 8)}</small>
                                </div>
                                <div className="d-flex align-items-center gap-3 text-muted tech-font text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.1em' }}>
                                    <span className="d-flex align-items-center gap-1"><FaMapMarkerAlt size={10} className="text-neon-red" /><span className="text-truncate" style={{ maxWidth: '200px' }}>{c.complaintLocation}</span></span>
                                    <span className="d-flex align-items-center gap-1"><FaCalendarAlt size={10} /> {formatDate(c.complaintResolvedDate || c.updatedAt)}</span>
                                </div>
                            </div>

                            <span className="badge tech-font rounded px-3 py-2 flex-shrink-0 text-uppercase fw-bold" style={{ background: 'rgba(163,230,53,0.1)', color: 'var(--secondary-color)', border: '1px solid var(--secondary-color)', fontSize: '0.65rem', letterSpacing: '0.1em' }}>
                                {c.complaintStatus}
                            </span>
                            <button onClick={e => { e.stopPropagation(); setSelected(c); }} className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '34px', height: '34px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)' }}>
                                <FaEye size={13} className="text-white" />
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <ComplaintDetailsModal isOpen={!!selected} onClose={() => setSelected(null)} complaint={selected} />
        </div>
    );
};

export default ResolvedIssues;
