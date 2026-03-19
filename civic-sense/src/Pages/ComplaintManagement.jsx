import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaSearch, FaEye, FaRobot, FaTimes, FaMapMarkerAlt, FaUser,
    FaArrowLeft, FaTerminal, FaCheckCircle, FaFilter, FaFileInvoiceDollar, FaRegClock, FaCity
} from 'react-icons/fa';
import api from '../api/axios';
import { notify } from '../utils/notify';

/* ─── Status config ──────────────────────────────────────────────────────────── */
const STATUS_OPTIONS = [
    { value: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: '#fbbf24' },
    { value: 'In Progress', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: '#60a5fa' },
    { value: 'Resolved', color: 'var(--neon-green)', bg: 'rgba(16,185,129,0.1)', border: 'var(--neon-green)' },
    { value: 'Rejected', color: 'var(--accent-red)', bg: 'rgba(239,68,68,0.1)', border: 'var(--accent-red)' },
];
const getStatusOpt = (val) => STATUS_OPTIONS.find(s => s.value === val) || STATUS_OPTIONS[0];

const PRIORITY_META = {
    Emergency: { color: 'var(--accent-red)', bg: 'rgba(239,68,68,0.15)' },
    High: { color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
    Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    Low: { color: 'var(--neon-green)', bg: 'rgba(16,185,129,0.15)' },
};

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
const ComplaintManagement = () => {
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [sortBy, setSortBy] = useState('newest');
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchText, setSearchText] = useState('');
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                const response = await api.get('/complaint/authority-complaints');
                setComplaints(response.data.data);
            } catch (error) {
                console.error('Error fetching complaints:', error);
                notify('error', 'SYSTEM ERROR: FAILED TO FETCH ANOMALIES');
            } finally {
                setLoading(false);
            }
        };
        fetchComplaints();
    }, []);

    const mapComplaint = (c) => ({
        id: c.complaintId || c._id,
        title: c.complaintDescription.split('\n')[0].replace(/\*\*/g, '') || 'ANOMALY',
        description: c.complaintDescription.replace(/\*\*/g, ''),
        location: c.complaintLocation,
        status: c.complaintStatus,
        priority: c.complaintPriority,
        date: new Date(c.createdAt).toLocaleDateString(),
        reporter: c.complaintUser?.userName || 'UNKNOWN',
        category: c.complaintType,
        image: c.complaintImage,
        aiScore: c.complaintAIScore ? Math.round(c.complaintAIScore) : 0,
        adminNotes: c.complaintNotes || '',
        expenses: c.expenses || [],
        feedback: c.feedback || null,
        isEdited: c.isEdited || false,
        activityLog: c.activityLog || [],
    });

    const processed = complaints.map(mapComplaint);

    const filtered = processed
        .filter(c => statusFilter === 'All' || c.status === statusFilter)
        .filter(c => !searchText ||
            c.title.toLowerCase().includes(searchText.toLowerCase()) ||
            (c.id?.toString().toLowerCase().includes(searchText.toLowerCase())) ||
            c.reporter.toLowerCase().includes(searchText.toLowerCase()))
        .sort((a, b) => sortBy === 'ai_priority' ? b.aiScore - a.aiScore : new Date(b.date) - new Date(a.date));

    const handleSave = async (draft) => {
        const payload = {
            status: draft.status,
            notes: draft.adminNotes,
            expenses: draft.expenses || []
        };
        await api.put(`/complaint/update-status/${draft.id}`, payload);
        notify('success', 'DATALINK SECURED: RECORD UPDATED.');
        setComplaints(prev =>
            prev.map(c =>
                (c._id === draft.id || c.complaintId === draft.id)
                    ? { ...c, complaintStatus: draft.status, complaintNotes: draft.adminNotes, expenses: payload.expenses, feedback: c.feedback }
                    : c
            )
        );
        setSelectedComplaint(null);
    };

    const statusCounts = STATUS_OPTIONS.reduce((acc, s) => {
        acc[s.value] = processed.filter(c => c.status === s.value).length;
        return acc;
    }, {});

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh', background: 'transparent' }}>
            <div className="spinner-border text-neon-purple" role="status"><span className="visually-hidden">LOADING...</span></div>
        </div>
    );

    return (
        <div className="d-flex flex-column" style={{ minHeight: '100vh', background: 'transparent' }}>

            {/* ─── UNIFIED HEADER ─────────────────────────────────── */}
            <div className="px-5 py-4 border-bottom shadow-sm" style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10, borderColor: 'rgba(255,255,255,0.1) !important' }}>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-4">
                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center justify-content-center border border-primary rounded" style={{ width: '56px', height: '56px', background: 'rgba(170,0,255,0.1)', color: 'var(--primary-color)' }}>
                            <FaCity size={24} />
                        </div>
                        <div>
                            <h4 className="fw-bold text-white tech-font mb-1 text-uppercase tracking-widest" style={{ letterSpacing: '0.1em' }}>
                                {user?.authorityDepartment || 'SECTOR'} COMMAND
                            </h4>
                            <small className="tech-font text-muted font-monospace text-uppercase" style={{ letterSpacing: '0.1em', fontSize: '0.75rem' }}>
                                {processed.length} RECORDS &nbsp;·&nbsp; <span style={{ color: '#f59e0b' }}>{statusCounts['Pending'] || 0} PENDING</span> &nbsp;·&nbsp; <span style={{ color: 'var(--neon-green)' }}>{statusCounts['Resolved'] || 0} SECURED</span>
                            </small>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        {/* Live search */}
                        <div className="d-flex align-items-center gap-2 px-3 py-2 rounded border" style={{ width: '280px', background: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.1) !important' }}>
                            <FaSearch size={14} className="text-secondary" />
                            <input
                                type="text"
                                className="form-control border-0 p-0 shadow-none bg-transparent text-white tech-font placeholder-glow"
                                placeholder="QUERY ARCHIVES..."
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                                style={{ fontSize: '0.9rem', letterSpacing: '0.05em' }}
                            />
                            {searchText && <button className="btn btn-sm p-0 text-muted border-0" onClick={() => setSearchText('')}><FaTimes size={12} /></button>}
                        </div>
                        {/* AI sort */}
                        <button
                            onClick={() => setSortBy(sortBy === 'ai_priority' ? 'newest' : 'ai_priority')}
                            className="btn d-flex align-items-center gap-2 fw-bold tech-font text-uppercase"
                            style={{
                                borderRadius: '4px',
                                background: sortBy === 'ai_priority' ? 'rgba(170,0,255,0.2)' : 'rgba(255,255,255,0.05)',
                                color: sortBy === 'ai_priority' ? 'var(--primary-color)' : '#94a3b8',
                                border: `1px solid ${sortBy === 'ai_priority' ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)'}`,
                                fontSize: '0.8rem', padding: '10px 20px', letterSpacing: '0.1em',
                                transition: 'all 0.2s',
                            }}
                        >
                            <FaRobot size={15} />
                            {sortBy === 'ai_priority' ? 'OVERRIDE: CRITICAL' : 'SORT: AI PRIORITY'}
                        </button>
                    </div>
                </div>

                {/* Status filter pills */}
                <div className="d-flex gap-2 mt-4 pb-1 overflow-auto custom-scrollbar">
                    {[{ value: 'All', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', textActive: 'white' }, ...STATUS_OPTIONS].map((s) => {
                        const active = statusFilter === s.value;
                        const count = s.value === 'All' ? processed.length : (statusCounts[s.value] || 0);
                        return (
                            <button
                                key={s.value}
                                onClick={() => setStatusFilter(s.value)}
                                className="btn fw-bold px-3 py-1 tech-font text-uppercase"
                                style={{
                                    borderRadius: '4px', fontSize: '0.75rem', letterSpacing: '0.1em',
                                    background: active ? (s.bg || 'rgba(170,0,255,0.1)') : 'rgba(255,255,255,0.02)',
                                    color: active ? (s.textActive || s.color) : '#64748b',
                                    border: `1px solid ${active ? (s.border || 'var(--primary-color)') : 'rgba(255,255,255,0.1)'}`,
                                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                    boxShadow: active ? `0 0 10px ${s.border || 'var(--primary-color)'}` : 'none'
                                }}
                            >
                                {s.value} <span className="ms-1 opacity-75 font-monospace">({count})</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ─── CLEAN TABLE ─────────────────────────────────── */}
            <div className="px-3 px-md-5 py-4 flex-grow-1 d-flex flex-column">
                <div className="glass-card d-flex flex-column flex-grow-1 overflow-hidden rounded" style={{ border: '1px solid var(--primary-color)' }}>
                    
                    {/* Column headers */}
                    <div className="d-flex align-items-center px-4 py-3 border-bottom border-secondary" style={{ background: 'rgba(170,0,255,0.05)', minWidth: '960px' }}>
                        {[
                            { label: 'ANOMALY TITLE', style: { flex: '1 1 0', minWidth: '220px', paddingRight: '20px' } },
                            { label: 'TRACKING_ID', style: { width: '120px', minWidth: '120px', flexShrink: 0 } },
                            { label: 'OPERATIVE', style: { width: '150px', minWidth: '150px', flexShrink: 0 } },
                            { label: 'STATUS', style: { width: '130px', minWidth: '130px', flexShrink: 0 } },
                            { label: 'AI_CONF', style: { width: '120px', minWidth: '120px', flexShrink: 0 } },
                            { label: 'PRIORITY', style: { width: '110px', minWidth: '110px', flexShrink: 0 } },
                            { label: 'SYS_DATE', style: { width: '120px', minWidth: '120px', flexShrink: 0 } },
                            { label: '', style: { width: '60px', minWidth: '60px', flexShrink: 0, textAlign: 'center' } },
                        ].map((h, i) => (
                            <div key={i} className="text-secondary tech-font fw-bold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.1em', ...h.style }}>
                                {h.label}
                            </div>
                        ))}
                    </div>

                    {/* Table Body */}
                    <div className="overflow-auto flex-grow-1 custom-scrollbar" style={{ minWidth: '960px' }}>
                        {filtered.length === 0 ? (
                            <div className="text-center py-5">
                                <FaFilter size={32} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '16px' }} />
                                <h5 className="fw-bold text-white tech-font mb-1 text-uppercase tracking-widest">DATA NOT FOUND</h5>
                                <p className="text-muted font-monospace text-uppercase" style={{ fontSize: '0.8rem' }}>ADJUST FILTERS TO EXPAND QUERY.</p>
                            </div>
                        ) : filtered.map((c, idx) => {
                            const st = getStatusOpt(c.status);
                            const pm = PRIORITY_META[c.priority] || PRIORITY_META.Low;
                            return (
                                <motion.div
                                    key={c.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(idx * 0.04, 0.3) }}
                                    className="d-flex align-items-center px-4 py-3 border-bottom border-secondary hover-bg-light cursor-pointer"
                                    onClick={() => setSelectedComplaint(c)}
                                >
                                    {/* Issue Title & Category */}
                                    <div style={{ flex: '1 1 0', minWidth: '220px', paddingRight: '20px' }}>
                                        <div className="d-flex align-items-center gap-2 mb-1 text-truncate">
                                            <span className="fw-bold text-white font-monospace" style={{ fontSize: '0.85rem' }}>{c.title}</span>
                                            {c.isEdited && (
                                                <span className="badge flex-shrink-0 tech-font" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid #f59e0b', fontSize: '0.65rem', letterSpacing: '0.1em' }}>
                                                    REVISED
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-muted text-truncate tech-font text-uppercase" style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.05em' }}>
                                            <span className="badge text-secondary border px-2 py-1" style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1) !important' }}>{c.category}</span>
                                            <span className="text-truncate">{c.location}</span>
                                        </div>
                                    </div>

                                    {/* ID */}
                                    <div style={{ width: '120px', minWidth: '120px', flexShrink: 0 }}>
                                        <span className="text-primary tech-font" style={{ fontSize: '0.85rem', letterSpacing: '0.1em' }}>#{String(c.id).slice(-6)}</span>
                                    </div>

                                    {/* Reporter */}
                                    <div style={{ width: '150px', minWidth: '150px', flexShrink: 0, overflow: 'hidden' }}>
                                        <div className="text-white tech-font text-uppercase text-truncate" style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>{c.reporter}</div>
                                        <div className="text-muted font-monospace" style={{ fontSize: '0.65rem' }}>CITIZEN</div>
                                    </div>

                                    {/* Status */}
                                    <div style={{ width: '130px', minWidth: '130px', flexShrink: 0 }}>
                                        <span className="badge px-3 py-1 tech-font text-uppercase" style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, fontSize: '0.7rem', letterSpacing: '0.1em' }}>
                                            {c.status}
                                        </span>
                                    </div>

                                    {/* AI Score */}
                                    <div style={{ width: '120px', minWidth: '120px', flexShrink: 0 }}>
                                        {c.aiScore > 0 ? (
                                            <div className="d-flex align-items-center gap-2">
                                                <div style={{ width: '45px', height: '4px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                                    <div style={{ width: `${c.aiScore}%`, height: '100%', background: c.aiScore > 80 ? 'var(--accent-red)' : c.aiScore > 50 ? '#f59e0b' : 'var(--neon-green)', boxShadow: `0 0 5px ${c.aiScore > 80 ? 'var(--accent-red)' : c.aiScore > 50 ? '#f59e0b' : 'var(--neon-green)'}` }} />
                                                </div>
                                                <span className="fw-bold font-monospace" style={{ fontSize: '0.8rem', color: c.aiScore > 80 ? 'var(--accent-red)' : c.aiScore > 50 ? '#f59e0b' : 'var(--neon-green)' }}>{c.aiScore}%</span>
                                            </div>
                                        ) : <span className="text-muted px-2 tech-font">—</span>}
                                    </div>

                                    {/* Priority */}
                                    <div style={{ width: '110px', minWidth: '110px', flexShrink: 0 }}>
                                        <span className="tech-font fw-bold" style={{ color: pm.color, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
                                            {c.priority || 'LOW'}
                                        </span>
                                    </div>

                                    {/* Date */}
                                    <div style={{ width: '120px', minWidth: '120px', flexShrink: 0 }}>
                                        <span className="text-muted font-monospace" style={{ fontSize: '0.75rem' }}>{c.date}</span>
                                    </div>

                                    {/* Action */}
                                    <div style={{ width: '60px', minWidth: '60px', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                                        <div className="d-flex align-items-center justify-content-center text-secondary hover-text-primary transition-all">
                                            <FaTerminal size={16} />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {filtered.length > 0 && (
                    <div className="text-center py-3">
                        <small className="tech-font text-muted text-uppercase tracking-widest" style={{ fontSize: '0.7rem' }}>DISPLAYING {filtered.length} OF {processed.length} RECORDS</small>
                    </div>
                )}
            </div>

            {/* ─── MODAL POPUP ─────────────────────────────────── */}
            <AnimatePresence>
                {selectedComplaint && (
                    <ComplaintModal
                        complaint={selectedComplaint}
                        onClose={() => setSelectedComplaint(null)}
                        onSave={handleSave}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

/* ─── Immersive Full-Screen Modal Component (Zendesk/Jira Style in Dark Tactical) ────────────────────── */
const ComplaintModal = ({ complaint, onClose, onSave }) => {
    const [draft, setDraft] = useState({ ...complaint });
    const [activeTab, setActiveTab] = useState('Workspace');
    const [saving, setSaving] = useState(false);
    const [newExpenseItem, setNewExpenseItem] = useState('');
    const [newExpenseCost, setNewExpenseCost] = useState('');

    const hasChanges =
        draft.status !== complaint.status ||
        draft.adminNotes !== complaint.adminNotes ||
        JSON.stringify(draft.expenses) !== JSON.stringify(complaint.expenses);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(draft);
        } catch (e) {
            notify('error', 'SYSTEM ERROR: UPDATE FAILED.');
        } finally {
            setSaving(false);
        }
    };

    const addExpense = () => {
        if (!newExpenseItem.trim() || !newExpenseCost) return;
        setDraft(prev => ({
            ...prev,
            expenses: [...(prev.expenses || []), { item: newExpenseItem.trim(), cost: parseFloat(newExpenseCost) }]
        }));
        setNewExpenseItem('');
        setNewExpenseCost('');
    };

    const removeExpense = (idx) =>
        setDraft(prev => ({ ...prev, expenses: prev.expenses.filter((_, i) => i !== idx) }));

    const totalExpense = (draft.expenses || []).reduce((s, e) => s + Number(e.cost), 0);
    const currentStatusOpt = getStatusOpt(draft.status);

    const tabs = [
        { id: 'Workspace', icon: <FaTerminal />, label: 'CMD/WORKSPACE' },
        { id: 'Ledger', icon: <FaFileInvoiceDollar />, label: `LEDGER ${(draft.expenses || []).length ? `[${(draft.expenses || []).length}]` : ''}` },
        { id: 'Audit', icon: <FaRegClock />, label: `AUDIT_LOG ${(complaint.activityLog || []).length ? `[${(complaint.activityLog || []).length}]` : ''}` },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column"
            style={{ backgroundColor: 'rgba(9,9,11,0.95)', backdropFilter: 'blur(30px)', zIndex: 1040 }}
        >
            {/* 1. Global Action Header */}
            <div className="px-4 py-3 border-bottom d-flex justify-content-between align-items-center" style={{ background: 'rgba(0,0,0,0.8)', borderColor: 'var(--primary-color) !important', zIndex: 10, flexShrink: 0, boxShadow: '0 0 20px rgba(170,0,255,0.1)' }}>
                <div className="d-flex align-items-center gap-3">
                    <button
                        onClick={onClose}
                        className="btn rounded-0 d-flex align-items-center justify-content-center text-secondary border border-secondary hover-bg-light"
                        style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)' }}
                        title="TERMINATE LINK"
                    >
                        <FaArrowLeft size={16} />
                    </button>
                    <div>
                        <div className="d-flex align-items-center gap-3 mb-1">
                            <h6 className="fw-bold mb-0 text-white tech-font tracking-widest text-uppercase" style={{ letterSpacing: '0.15em' }}>SYS_REF #{String(complaint.id).slice(-6)}</h6>
                            <span className="badge px-2 py-1 tech-font text-uppercase" style={{ background: currentStatusOpt.bg, color: currentStatusOpt.color, border: `1px solid ${currentStatusOpt.border}`, fontSize: '0.7rem', letterSpacing: '0.1em', boxShadow: `0 0 8px ${currentStatusOpt.border}` }}>
                                {draft.status}
                            </span>
                        </div>
                        <div className="text-muted font-monospace text-uppercase d-flex gap-2 align-items-center" style={{ fontSize: '0.7rem' }}>
                            <span>{complaint.category}</span>
                            <span className="text-secondary">//</span>
                            <span>LOGGED {complaint.date}</span>
                            {hasChanges && <><span className="text-primary">//</span><span className="text-primary fw-bold blink">UNSAVED_CHANGES</span></>}
                        </div>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-3">
                    <button onClick={onClose} className="btn btn-sm tech-font text-muted px-4 text-uppercase fw-bold" style={{ fontSize: '0.8rem', letterSpacing: '0.1em' }}>ABORT</button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className="btn btn-sm fw-bold px-4 py-2 text-white tech-font text-uppercase"
                        style={{
                            background: hasChanges ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)',
                            border: `1px solid ${hasChanges ? 'var(--primary-color)' : 'transparent'}`,
                            boxShadow: hasChanges ? '0 0 15px rgba(170,0,255,0.4)' : 'none',
                            fontSize: '0.8rem', letterSpacing: '0.1em'
                        }}
                    >
                        {saving ? (
                            <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>ENCRYPTING...</>
                        ) : 'COMMIT SYSTEM OVERRIDE'}
                    </button>
                </div>
            </div>

            {/* 2. Content Split View */}
            <div className="d-flex flex-grow-1 overflow-hidden">

                {/* ── LEFT SIDEBAR (Read-Only Context) ── */}
                <div className="border-end border-secondary d-flex flex-column" style={{ width: '400px', flexShrink: 0, zIndex: 5, background: 'rgba(15,23,42,0.9)' }}>
                    <div className="p-4 overflow-auto flex-grow-1 custom-scrollbar">

                        <h6 className="fw-bold text-secondary tech-font mb-3 text-uppercase tracking-widest border-bottom border-secondary pb-2">EVIDENCE COM-LINK</h6>

                        {/* Evidence Image */}
                        {complaint.image ? (
                            <div className="overflow-hidden border border-secondary mb-4 position-relative" style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)' }}>
                                <div className="position-absolute top-0 start-0 w-100 h-100 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(163,230,53,0.05) 2px, rgba(163,230,53,0.05) 4px)', zIndex: 1 }}></div>
                                <img src={complaint.image} alt="Evidence" className="w-100 object-fit-cover" style={{ height: '220px', filter: 'brightness(0.9) contrast(1.1) sepia(0.2) hue-rotate(180deg)' }} />
                                <div className="position-absolute bottom-0 start-0 w-100 p-2 d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, transparent 100%)', zIndex: 2 }}>
                                    <span className="badge text-neon-green tech-font text-uppercase" style={{ fontSize: '0.7rem', border: '1px solid var(--neon-green)', background: 'rgba(0,0,0,0.5)' }}><FaEye className="me-2" />EVIDENCE_01</span>
                                    <small className="tech-font text-muted font-monospace" style={{ fontSize: '0.6rem' }}>{complaint.id}</small>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-4 border border-secondary d-flex flex-column align-items-center justify-content-center" style={{ height: '120px', background: 'rgba(0,0,0,0.4)', backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                                <FaTerminal size={24} className="text-secondary opacity-50 mb-2" />
                                <span className="tech-font text-muted text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>VISUAL DATA UNAVAILABLE</span>
                            </div>
                        )}

                        <h6 className="fw-bold text-white mb-4 font-monospace" style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{complaint.title}</h6>

                        {/* Immutable Metadata Blocks */}
                        <div className="d-flex flex-column gap-3 mb-4">
                            {/* AI Priority Matrix */}
                            {complaint.aiScore > 0 && (
                                <div className="p-3 border border-secondary d-flex gap-3 align-items-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                                    <div className="d-flex align-items-center justify-content-center flex-shrink-0 border" style={{ width: '40px', height: '40px', background: 'rgba(0,0,0,0.5)', borderColor: complaint.aiScore > 80 ? 'var(--accent-red)' : complaint.aiScore > 50 ? '#f59e0b' : 'var(--neon-green)', color: complaint.aiScore > 80 ? 'var(--accent-red)' : complaint.aiScore > 50 ? '#f59e0b' : 'var(--neon-green)', boxShadow: `0 0 10px ${complaint.aiScore > 80 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
                                        <FaRobot size={18} />
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="d-flex justify-content-between align-items-center mb-1 tech-font text-uppercase tracking-widest">
                                            <span className="text-muted" style={{ fontSize: '0.7rem' }}>AI_SEVERITY_INDEX</span>
                                            <span className="fw-bold font-monospace" style={{ color: complaint.aiScore > 80 ? 'var(--accent-red)' : complaint.aiScore > 50 ? '#f59e0b' : 'var(--neon-green)', fontSize: '0.8rem' }}>{complaint.aiScore}%</span>
                                        </div>
                                        <div className="progress" style={{ height: '2px', background: 'rgba(255,255,255,0.1)' }}>
                                            <div className="progress-bar" style={{ width: `${complaint.aiScore}%`, background: complaint.aiScore > 80 ? 'var(--accent-red)' : complaint.aiScore > 50 ? '#f59e0b' : 'var(--neon-green)', boxShadow: `0 0 5px ${complaint.aiScore > 80 ? 'var(--accent-red)' : 'var(--neon-green)'}` }} />
                                        </div>
                                        <p className="mt-2 mb-0 text-muted tech-font text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.1em' }}>FLAGGED: <strong style={{ color: PRIORITY_META[complaint.priority]?.color }}>{complaint.priority}</strong></p>
                                    </div>
                                </div>
                            )}

                            {/* Location */}
                            <div className="p-3 border border-secondary d-flex gap-3 align-items-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                                <div className="d-flex align-items-center justify-content-center text-secondary flex-shrink-0 border border-secondary" style={{ width: '40px', height: '40px', background: 'rgba(0,0,0,0.5)' }}>
                                    <FaMapMarkerAlt size={16} />
                                </div>
                                <div className="overflow-hidden">
                                    <small className="tech-font text-muted text-uppercase d-block mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.15em' }}>COORDINATES</small>
                                    <span className="text-white font-monospace text-truncate d-block" style={{ fontSize: '0.8rem' }}>{complaint.location}</span>
                                </div>
                            </div>

                            {/* Reporter */}
                            <div className="p-3 border border-secondary d-flex gap-3 align-items-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                                <div className="d-flex align-items-center justify-content-center text-primary flex-shrink-0 border border-primary" style={{ width: '40px', height: '40px', background: 'rgba(170,0,255,0.1)', boxShadow: '0 0 10px rgba(170,0,255,0.2)' }}>
                                    <FaUser size={16} />
                                </div>
                                <div>
                                    <small className="tech-font text-muted text-uppercase d-block mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.15em' }}>OPERATIVE_ALIAS</small>
                                    <span className="text-white font-monospace text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.05em' }}>{complaint.reporter}</span>
                                </div>
                            </div>
                        </div>

                        {/* Full Description Text */}
                        <div className="pt-3 border-top border-secondary opacity-75">
                            <h6 className="fw-bold text-secondary tech-font mb-2 text-uppercase tracking-widest" style={{ fontSize: '0.75rem' }}>TRANSMISSION_LOG</h6>
                            <p className="text-white font-monospace" style={{ fontSize: '0.8rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', opacity: 0.9 }}>
                                {complaint.description}
                            </p>
                        </div>

                        {/* Post-Resolution Feedback (If any) */}
                        {complaint.feedback?.message && (
                            <div className="mt-4 p-3 border border-secondary" style={{ background: 'rgba(239,68,68,0.05)', borderLeft: '3px solid var(--accent-red) !important' }}>
                                <h6 className="fw-bold text-neon-red tech-font mb-2 text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>&gt;&gt; CITIZEN_ECHO</h6>
                                <p className="mb-2 text-white font-monospace fst-italic" style={{ fontSize: '0.8rem' }}>"{complaint.feedback.message}"</p>
                                <small className="text-muted font-monospace d-block" style={{ fontSize: '0.65rem' }}>[{new Date(complaint.feedback.date).toLocaleString()}]</small>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── RIGHT MAIN AREA (Dynamic Workspace) ── */}
                <div className="flex-grow-1 d-flex flex-column position-relative" style={{ background: 'radial-gradient(circle at center, rgba(15,23,42,0.8) 0%, rgba(9,9,11,1) 100%)' }}>
                    
                    {/* Background Grid Pattern */}
                    <div className="position-absolute top-0 start-0 w-100 h-100 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', zIndex: 0 }}></div>

                    {/* Inner Navbar / Pill Tabs */}
                    <div className="px-5 pt-4 pb-0 mb-4 z-1">
                        <div className="d-flex gap-2 border-bottom border-secondary pb-2">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className="btn d-flex align-items-center gap-2 px-4 py-2 tech-font text-uppercase"
                                    style={{
                                        background: activeTab === tab.id ? 'var(--primary-color)' : 'transparent',
                                        color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                                        border: activeTab === tab.id ? '1px solid var(--primary-color)' : '1px solid transparent',
                                        borderBottom: activeTab === tab.id ? 'none' : '1px solid transparent',
                                        borderRadius: '4px 4px 0 0',
                                        fontSize: '0.8rem', letterSpacing: '0.1em',
                                        transition: 'all 0.2s',
                                        boxShadow: activeTab === tab.id ? '0 -5px 15px rgba(170,0,255,0.1)' : 'none'
                                    }}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scrollable Form Content */}
                    <div className="flex-grow-1 overflow-auto px-5 pt-2 pb-5 z-1 custom-scrollbar">
                        <div style={{ maxWidth: '850px' }}>
                            <AnimatePresence mode="wait">

                                {/* WORKSPACE TAB */}
                                {activeTab === 'Workspace' && (
                                    <motion.div key="Workspace" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                                        <div className="glass-card p-5 border border-secondary" style={{ background: 'rgba(15,23,42,0.6)' }}>
                                            <h5 className="fw-bold text-white tech-font text-uppercase tracking-widest border-bottom border-secondary pb-3 mb-4 d-flex align-items-center gap-3">
                                                <FaTerminal className="text-secondary" /> PROTOCOL_OVERRIDE
                                            </h5>

                                            <div className="mb-5">
                                                <h6 className="fw-bold text-secondary tech-font mb-3 text-uppercase tracking-widest" style={{ fontSize: '0.8rem' }}>&gt;&gt; ASSIGN_STATE</h6>
                                                <div className="d-flex flex-wrap gap-3">
                                                    {STATUS_OPTIONS.map(opt => {
                                                        const isSelected = draft.status === opt.value;
                                                        return (
                                                            <button
                                                                key={opt.value}
                                                                onClick={() => setDraft(prev => ({ ...prev, status: opt.value }))}
                                                                className="btn px-4 py-2 d-flex align-items-center gap-2 tech-font text-uppercase"
                                                                style={{
                                                                    background: isSelected ? opt.bg : 'rgba(0,0,0,0.5)',
                                                                    color: isSelected ? opt.color : 'var(--text-muted)',
                                                                    border: `1px solid ${isSelected ? opt.border : 'rgba(255,255,255,0.1)'}`,
                                                                    transition: 'all 0.2s',
                                                                    fontSize: '0.85rem', letterSpacing: '0.1em',
                                                                    boxShadow: isSelected ? `0 0 10px ${opt.border}` : 'none'
                                                                }}
                                                            >
                                                                {isSelected && <FaCheckCircle size={14} />} {opt.value}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="mb-2">
                                                <h6 className="fw-bold text-secondary tech-font mb-2 text-uppercase tracking-widest" style={{ fontSize: '0.8rem' }}>&gt;&gt; PUBLIC_BROADCAST_LOG</h6>
                                                <p className="text-muted font-monospace mb-3" style={{ fontSize: '0.75rem' }}>
                                                    // VISIBLE TO CITIZEN FACTIONS. KEEP IT CLINICAL.
                                                </p>
                                                <textarea
                                                    className="form-control text-white font-monospace"
                                                    rows={6}
                                                    placeholder="e.g., A designated sanitation team was dispatched..."
                                                    value={draft.adminNotes}
                                                    onChange={e => setDraft(prev => ({ ...prev, adminNotes: e.target.value }))}
                                                    style={{
                                                        background: 'rgba(0,0,0,0.5)',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        color: 'white',
                                                        fontSize: '0.85rem',
                                                        resize: 'vertical',
                                                        padding: '16px',
                                                        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* LEDGER TAB */}
                                {activeTab === 'Ledger' && (
                                    <motion.div key="Ledger" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                                        <div className="glass-card p-5 border border-secondary" style={{ background: 'rgba(15,23,42,0.6)' }}>
                                            <div className="d-flex align-items-center justify-content-between border-bottom border-secondary pb-4 mb-4">
                                                <div>
                                                    <h5 className="fw-bold text-white tech-font mb-1 text-uppercase tracking-widest">EXPENSE_ROUTING</h5>
                                                    <p className="text-muted font-monospace mb-0" style={{ fontSize: '0.75rem' }}>// ALLOCATE CREDITS TO OPERATION.</p>
                                                </div>
                                                <div className="px-4 py-3 border" style={{ background: 'rgba(16,185,129,0.05)', borderColor: 'var(--neon-green) !important', boxShadow: '0 0 15px rgba(16,185,129,0.1)' }}>
                                                    <small className="d-block text-neon-green fw-bold text-uppercase tech-font mb-1 tracking-widest" style={{ fontSize: '0.7rem' }}>NET_BURN</small>
                                                    <span className="text-white font-monospace fw-bold fs-4 lh-1">₹{totalExpense.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <div className="p-4 border mb-5" style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.05) !important' }}>
                                                <h6 className="fw-bold text-secondary tech-font mb-3 text-uppercase tracking-widest" style={{ fontSize: '0.8rem' }}>&gt;&gt; APPEND_LEDGER</h6>
                                                <div className="d-flex flex-wrap gap-3">
                                                    <input
                                                        type="text"
                                                        placeholder="RESOURCE_NAME //"
                                                        className="form-control shadow-none flex-grow-1 text-white font-monospace"
                                                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem', padding: '10px 16px' }}
                                                        value={newExpenseItem}
                                                        onChange={e => setNewExpenseItem(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && addExpense()}
                                                    />
                                                    <div className="input-group" style={{ width: '180px' }}>
                                                        <span className="input-group-text bg-dark text-muted fw-bold border-0 px-3 font-monospace">₹</span>
                                                        <input
                                                            type="number"
                                                            placeholder="AMT"
                                                            className="form-control shadow-none border-0 text-white font-monospace"
                                                            style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.85rem' }}
                                                            value={newExpenseCost}
                                                            onChange={e => setNewExpenseCost(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && addExpense()}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={addExpense}
                                                        disabled={!newExpenseItem.trim() || !newExpenseCost}
                                                        className="btn fw-bold px-4 text-white tech-font tracking-widest"
                                                        style={{ background: 'var(--neon-green)', border: 'none', fontSize: '0.85rem', color: 'black' }}
                                                    >
                                                        INJECT
                                                    </button>
                                                </div>
                                            </div>

                                            <h6 className="fw-bold text-secondary tech-font mb-3 text-uppercase tracking-widest" style={{ fontSize: '0.8rem' }}>&gt;&gt; COMPILED_LIST</h6>

                                            {(draft.expenses || []).length === 0 ? (
                                                <div className="text-center py-5 border border-secondary" style={{ background: 'rgba(0,0,0,0.2)', backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 2px, transparent 2px, transparent 10px)' }}>
                                                    <p className="mb-0 fw-bold text-muted tech-font text-uppercase tracking-widest">LEDGER IS EMPTY.</p>
                                                </div>
                                            ) : (
                                                <div className="d-flex flex-column gap-3">
                                                    {(draft.expenses || []).map((exp, idx) => (
                                                        <div key={idx} className="d-flex justify-content-between align-items-center p-3 border hover-bg-light transition-all" style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.1) !important' }}>
                                                            <div className="d-flex align-items-center gap-3">
                                                                <FaTerminal className="text-secondary opacity-50" size={12} />
                                                                <span className="fw-bold text-white font-monospace text-uppercase" style={{ fontSize: '0.85rem', letterSpacing: '0.05em' }}>{exp.item}</span>
                                                            </div>
                                                            <div className="d-flex align-items-center gap-4">
                                                                <span className="fw-bold text-neon-green font-monospace" style={{ fontSize: '1rem' }}>₹{Number(exp.cost).toLocaleString()}</span>
                                                                <button onClick={() => removeExpense(idx)} className="btn text-accent-red p-1 hover-scale" title="DELETE ENTRY">
                                                                    <FaTimes size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {/* AUDIT TAB */}
                                {activeTab === 'Audit' && (
                                    <motion.div key="Audit" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                                        <div className="glass-card p-5 border border-secondary" style={{ background: 'rgba(15,23,42,0.6)' }}>
                                            <h5 className="fw-bold text-white tech-font mb-4 border-bottom border-secondary pb-3 text-uppercase tracking-widest">SYSTEM_AUDIT_TRAIL</h5>

                                            {(!complaint.activityLog || complaint.activityLog.length === 0) ? (
                                                <div className="text-center py-5 text-muted border border-secondary" style={{ background: 'rgba(0,0,0,0.2)' }}>
                                                    <p className="fw-bold text-uppercase tech-font tracking-widest text-muted mb-1">NO LOGS EXTRACTED</p>
                                                    <p className="text-secondary font-monospace" style={{ fontSize: '0.75rem' }}>// AWAITING SYSTEM EVENTS.</p>
                                                </div>
                                            ) : (
                                                <div className="position-relative ms-2 border-start border-secondary pb-4">
                                                    {[...complaint.activityLog].reverse().map((entry, idx) => {
                                                        const a = (entry.action || '').toLowerCase();
                                                        const color =
                                                            a.includes('filed') ? 'var(--primary-color)' :
                                                                a.includes('edited') ? '#f59e0b' :
                                                                    a.includes('status') ? '#3b82f6' :
                                                                        a.includes('reopened') ? 'var(--accent-red)' :
                                                                            a.includes('accepted') ? 'var(--neon-green)' : '#94a3b8';

                                                        return (
                                                            <div key={idx} className="mb-4 position-relative ps-4">
                                                                <div
                                                                    className="position-absolute rounded-0"
                                                                    style={{ left: '-6px', top: '15px', width: '11px', height: '11px', background: 'black', border: `2px solid ${color}`, boxShadow: `0 0 8px ${color}` }}
                                                                />
                                                                <div className="p-3 border hover-bg-light transition-all" style={{ background: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.05) !important' }}>
                                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                                        <div className="d-flex align-items-center gap-2">
                                                                            <span className="fw-bold text-white tech-font text-uppercase tracking-widest" style={{ fontSize: '0.85rem', color: color }}>[ {entry.action} ]</span>
                                                                        </div>
                                                                        <span className="text-secondary font-monospace" style={{ fontSize: '0.7rem' }}>
                                                                            {new Date(entry.timestamp).toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-muted font-monospace text-uppercase" style={{ fontSize: '0.75rem' }}>
                                                                        EXECUTED BY: <span className="text-white fw-bold">{entry.performedByName}</span>
                                                                        <span className="ms-2 px-2 py-0 border rounded text-secondary" style={{ fontSize: '0.65rem', borderColor: 'rgba(255,255,255,0.1) !important', background: 'rgba(255,255,255,0.02)' }}>
                                                                            {entry.performedByRole}
                                                                        </span>
                                                                    </div>
                                                                    {entry.note && (
                                                                        <div className="mt-3 mx-1 p-3 border border-secondary text-white font-monospace fst-italic shadow-sm" style={{ fontSize: '0.8rem', lineHeight: 1.5, background: 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${color} !important` }}>
                                                                            "{entry.note}"
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ComplaintManagement;
