import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaSearch, FaEye, FaRobot, FaTimes, FaMapMarkerAlt, FaUser,
    FaPencilAlt, FaHistory, FaUserTie, FaCheckCircle, FaHourglassHalf,
    FaBan, FaFilter
} from 'react-icons/fa';
import api from '../api/axios';
import { notify } from '../utils/notify';

/* ─── Status config ──────────────────────────────────────────────────────────── */
const STATUS_OPTIONS = [
    { value: 'Pending', color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
    { value: 'In Progress', color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd' },
    { value: 'Resolved', color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7' },
    { value: 'Rejected', color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
];
const getStatusOpt = (val) => STATUS_OPTIONS.find(s => s.value === val) || STATUS_OPTIONS[0];

const PRIORITY_META = {
    Emergency: { color: '#ef4444', bg: '#fef2f2' },
    High: { color: '#f97316', bg: '#fff7ed' },
    Medium: { color: '#f59e0b', bg: '#fffbeb' },
    Low: { color: '#10b981', bg: '#ecfdf5' },
};

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
const ComplaintManagement = () => {
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [sortBy, setSortBy] = useState('newest');
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchText, setSearchText] = useState('');
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                const response = await api.get('/complaint/authority-complaints');
                setComplaints(response.data.data);
            } catch (error) {
                console.error('Error fetching complaints:', error);
                notify('error', 'Failed to fetch complaints');
            } finally {
                setLoading(false);
            }
        };
        fetchComplaints();
    }, []);

    const mapComplaint = (c) => ({
        id: c.complaintId || c._id,
        title: c.complaintDescription.split('\n')[0].replace(/\*\*/g, '') || 'Complaint',
        description: c.complaintDescription.replace(/\*\*/g, ''),
        location: c.complaintLocation,
        status: c.complaintStatus,
        priority: c.complaintPriority,
        date: new Date(c.createdAt).toLocaleDateString(),
        reporter: c.complaintUser?.userName || 'Anonymous',
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
        const payload = { status: draft.status, notes: draft.adminNotes };
        if (draft.status === 'Resolved' || (draft.expenses && draft.expenses.length > 0)) {
            payload.expenses = draft.expenses;
        }
        await api.put(`/complaint/update-status/${draft.id}`, payload);
        notify('success', 'Ticket updated successfully');
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
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <div className="spinner-border" style={{ color: '#f59e0b' }} role="status"><span className="visually-hidden">Loading…</span></div>
        </div>
    );

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh' }}>

            {/* ── Sticky header ── */}
            <div className="px-5 py-4 border-bottom" style={{ background: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
                <div className="d-flex justify-content-between align-items-center">
                    <div>
                        <h4 className="fw-bold text-dark mb-0">Complaint Management</h4>
                        <small className="text-muted">
                            {processed.length} total &nbsp;·&nbsp; {statusCounts['Pending'] || 0} pending &nbsp;·&nbsp; {statusCounts['Resolved'] || 0} resolved
                        </small>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        {/* Live search */}
                        <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 border bg-white" style={{ width: '240px' }}>
                            <FaSearch size={12} className="text-muted" />
                            <input
                                type="text"
                                className="form-control border-0 p-0 shadow-none bg-transparent"
                                placeholder="Search ID, name..."
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                                style={{ fontSize: '0.87rem' }}
                            />
                            {searchText && <button className="btn btn-sm p-0 text-muted border-0" onClick={() => setSearchText('')}><FaTimes size={11} /></button>}
                        </div>
                        {/* AI sort */}
                        <button
                            onClick={() => setSortBy(sortBy === 'ai_priority' ? 'newest' : 'ai_priority')}
                            className="btn d-flex align-items-center gap-2 fw-medium"
                            style={{
                                borderRadius: '10px',
                                background: sortBy === 'ai_priority' ? '#fffbeb' : 'white',
                                color: sortBy === 'ai_priority' ? '#f59e0b' : '#64748b',
                                border: `1.5px solid ${sortBy === 'ai_priority' ? '#fcd34d' : '#e2e8f0'}`,
                                fontSize: '0.84rem', padding: '8px 16px',
                            }}
                        >
                            <FaRobot size={13} />
                            {sortBy === 'ai_priority' ? 'AI: Critical First' : 'Sort: AI Priority'}
                        </button>
                    </div>
                </div>

                {/* Status filter pills */}
                <div className="d-flex gap-2 mt-3 flex-wrap">
                    {[{ value: 'All', color: '#1e293b', bg: '#1e293b', border: '#1e293b', textActive: 'white' }, ...STATUS_OPTIONS].map((s) => {
                        const active = statusFilter === s.value;
                        const count = s.value === 'All' ? processed.length : (statusCounts[s.value] || 0);
                        return (
                            <button
                                key={s.value}
                                onClick={() => setStatusFilter(s.value)}
                                className="btn btn-sm fw-medium"
                                style={{
                                    borderRadius: '10px', padding: '5px 14px', fontSize: '0.8rem',
                                    background: active ? (s.bg || '#1e293b') : 'white',
                                    color: active ? (s.textActive || s.color) : '#64748b',
                                    border: `1.5px solid ${active ? (s.border || s.bg) : '#e2e8f0'}`,
                                }}
                            >
                                {s.value} <span className="ms-1 opacity-75">({count})</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Table ── */}
            <div className="px-5 py-4">
                <div className="bg-white rounded-4 border overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

                    {/* Column headers */}
                    <div className="d-flex align-items-center px-4 py-3 border-bottom" style={{ background: '#f8fafc' }}>
                        {[
                            { label: 'ID', style: { width: '90px', flexShrink: 0 } },
                            { label: 'Issue', style: { flex: '1 1 0', minWidth: 0 } },
                            { label: 'Category', style: { width: '110px', flexShrink: 0 } },
                            { label: 'Reporter', style: { width: '120px', flexShrink: 0 } },
                            { label: 'Status', style: { width: '110px', flexShrink: 0 } },
                            { label: 'AI Score', style: { width: '90px', flexShrink: 0 } },
                            { label: 'Priority', style: { width: '90px', flexShrink: 0 } },
                            { label: 'Date', style: { width: '100px', flexShrink: 0 } },
                            { label: '', style: { width: '48px', flexShrink: 0 } },
                        ].map((h, i) => (
                            <div key={i} className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.67rem', letterSpacing: '0.08em', ...h.style }}>
                                {h.label}
                            </div>
                        ))}
                    </div>

                    {filtered.length === 0 ? (
                        <div className="text-center py-5">
                            <FaFilter size={28} style={{ color: '#cbd5e1', marginBottom: '12px' }} />
                            <p className="fw-bold text-dark mb-1">No complaints match</p>
                            <small className="text-muted">Try a different filter or search term</small>
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
                                className="d-flex align-items-center px-4 py-3 border-bottom"
                                style={{ cursor: 'pointer', transition: 'background 0.12s' }}
                                onClick={() => setSelectedComplaint(c)}
                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={e => e.currentTarget.style.background = 'white'}
                            >
                                <div style={{ width: '90px', flexShrink: 0 }}>
                                    <span className="text-muted fw-medium" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>#{String(c.id).slice(-6)}</span>
                                </div>

                                <div style={{ flex: '1 1 0', minWidth: 0, paddingRight: '16px' }}>
                                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                                        <span className="fw-bold text-dark" style={{ fontSize: '0.87rem' }}>{c.title}</span>
                                        {c.isEdited && (
                                            <span className="badge d-flex align-items-center gap-1" style={{ background: '#fff3cd', color: '#92400e', border: '1px solid #fcd34d', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '20px' }}>
                                                <FaPencilAlt size={7} /> Edited
                                            </span>
                                        )}
                                        {c.feedback?.message && <span className="badge rounded-circle" style={{ width: '8px', height: '8px', background: '#ef4444', padding: 0 }} title="New Feedback" />}
                                    </div>
                                    <small className="text-muted text-truncate d-block" style={{ maxWidth: '260px', fontSize: '0.75rem' }}>{c.description}</small>
                                </div>

                                <div style={{ width: '110px', flexShrink: 0 }}>
                                    <span className="badge rounded-pill" style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', fontSize: '0.72rem', padding: '4px 10px' }}>{c.category}</span>
                                </div>

                                <div style={{ width: '120px', flexShrink: 0 }}>
                                    <small className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.77rem' }}><FaUser size={10} /> {c.reporter}</small>
                                </div>

                                <div style={{ width: '110px', flexShrink: 0 }}>
                                    <span className="badge rounded-pill fw-medium" style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, fontSize: '0.72rem', padding: '4px 10px' }}>{c.status}</span>
                                </div>

                                <div style={{ width: '90px', flexShrink: 0 }}>
                                    <div className="d-flex align-items-center gap-2">
                                        <div style={{ width: '40px', height: '5px', borderRadius: '3px', background: '#f1f5f9', flexShrink: 0, overflow: 'hidden' }}>
                                            <div style={{ width: `${c.aiScore}%`, height: '100%', borderRadius: '3px', background: c.aiScore > 80 ? '#ef4444' : c.aiScore > 50 ? '#f59e0b' : '#10b981' }} />
                                        </div>
                                        <span className="fw-bold" style={{ fontSize: '0.75rem', color: c.aiScore > 80 ? '#ef4444' : c.aiScore > 50 ? '#f59e0b' : '#10b981' }}>{c.aiScore}</span>
                                    </div>
                                </div>

                                <div style={{ width: '90px', flexShrink: 0 }}>
                                    <span className="badge rounded-pill fw-medium" style={{ background: pm.bg, color: pm.color, fontSize: '0.72rem', padding: '4px 10px' }}>{c.priority || '—'}</span>
                                </div>

                                <div style={{ width: '100px', flexShrink: 0 }}>
                                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>{c.date}</small>
                                </div>

                                <div style={{ width: '48px', flexShrink: 0 }}>
                                    <div className="d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#fffbeb', border: '1px solid #fcd34d' }}>
                                        <FaEye size={12} style={{ color: '#f59e0b' }} />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {filtered.length > 0 && (
                    <div className="text-center py-3">
                        <small className="text-muted">Showing {filtered.length} of {processed.length} complaints</small>
                    </div>
                )}
            </div>

            {/* ── Modal ── */}
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

/* ─── Complaint Modal ─────────────────────────────────────────────────────────
   Redesigned UX:
   - Left panel: all complaint details (read-only for authority)
   - Right panel: tabbed → Actions | Expenses | Activity
   - Actions tab: visual clickable status cards + notes textarea + save CTA
   - Save button is active only when there are unsaved changes
─────────────────────────────────────────────────────────────────────────────── */
const ComplaintModal = ({ complaint, onClose, onSave }) => {
    const [draft, setDraft] = useState({ ...complaint });
    const [activeTab, setActiveTab] = useState('actions');
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
            notify('error', 'Failed to update ticket');
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
        { id: 'actions', label: 'Actions' },
        { id: 'expenses', label: `Expenses${(draft.expenses || []).length ? ` (${draft.expenses.length})` : ''}` },
        { id: 'activity', label: `Activity${(complaint.activityLog || []).length ? ` (${complaint.activityLog.length})` : ''}` },
    ];

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{ backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)', zIndex: 9999 }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ opacity: 0, y: 28, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                style={{ width: '100vw', maxWidth: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', borderRadius: '0', overflow: 'hidden', background: 'white' }}
            >
                {/* ── Modal Header ── */}
                <div
                    className="d-flex justify-content-between align-items-center px-5 py-4 border-bottom"
                    style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', flexShrink: 0 }}
                >
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                            <h5 className="fw-bold mb-0 text-dark">{complaint.title}</h5>
                            {complaint.isEdited && (
                                <span className="badge" style={{ background: '#fff3cd', color: '#92400e', border: '1px solid #fcd34d', fontSize: '0.65rem' }}>
                                    <FaPencilAlt size={8} className="me-1" />Edited
                                </span>
                            )}
                            <span
                                className="badge rounded-pill px-2 py-1 ms-1"
                                style={{ background: currentStatusOpt.bg, color: currentStatusOpt.color, border: `1px solid ${currentStatusOpt.border}`, fontSize: '0.75rem' }}
                            >
                                {draft.status}
                            </span>
                        </div>
                        <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.8rem' }}>
                            <span>#{complaint.id}</span>
                            <span>·</span>
                            <span>{complaint.category}</span>
                            <span>·</span>
                            <span>Reported {complaint.date}</span>
                            {complaint.priority && (
                                <>
                                    <span>·</span>
                                    <span className={`badge rounded-pill px-2 ${complaint.priority === 'Critical' || complaint.priority === 'High' ? 'bg-danger-subtle text-danger' : 'bg-info-subtle text-info'}`}>
                                        {complaint.priority}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center border"
                        style={{ width: '36px', height: '36px', background: 'white', flexShrink: 0 }}
                    >
                        <FaTimes size={14} className="text-secondary" />
                    </button>
                </div>

                {/* ── Modal Body ── */}
                <div className="d-flex flex-grow-1 overflow-hidden">

                    {/* Left: Complaint Info (read-only) */}
                    <div className="overflow-auto p-5" style={{ flex: '1 1 55%', borderRight: '1px solid #e2e8f0' }}>

                        {/* Reporter */}
                        <div className="d-flex align-items-center gap-3 p-3 rounded-3 border mb-4" style={{ background: '#f8fafc' }}>
                            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', background: '#e2e8f0', flexShrink: 0 }}>
                                <FaUser size={15} className="text-secondary" />
                            </div>
                            <div>
                                <div className="fw-bold text-dark small">{complaint.reporter}</div>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Citizen</div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-4">
                            <label className="fw-bold text-muted text-uppercase mb-2 d-block" style={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>Description</label>
                            <p className="text-secondary mb-0" style={{ lineHeight: 1.75 }}>{complaint.description}</p>
                        </div>

                        {/* Location */}
                        <div className="d-flex align-items-center gap-2 p-3 rounded-3 mb-4" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                            <FaMapMarkerAlt className="text-danger" size={14} />
                            <span className="text-dark small fw-medium">{complaint.location}</span>
                        </div>

                        {/* Image */}
                        {complaint.image && (
                            <div className="rounded-3 overflow-hidden mb-4 border shadow-sm">
                                <img src={complaint.image} alt="Evidence" className="w-100 object-fit-cover" style={{ maxHeight: '240px' }} />
                            </div>
                        )}

                        {/* AI Score */}
                        {complaint.aiScore > 0 && (
                            <div className="p-4 rounded-3 border mb-4" style={{ background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)' }}>
                                <div className="d-flex align-items-center justify-content-between mb-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <FaRobot className="text-primary" size={16} />
                                        <span className="fw-bold text-dark small">AI Severity Score</span>
                                    </div>
                                    <span className={`badge rounded-pill fw-bold px-3 ${complaint.aiScore > 80 ? 'bg-danger' : complaint.aiScore > 50 ? 'bg-warning text-dark' : 'bg-success'}`}>
                                        {complaint.aiScore}/100
                                    </span>
                                </div>
                                <div className="progress rounded-pill" style={{ height: '8px' }}>
                                    <div
                                        className={`progress-bar rounded-pill ${complaint.aiScore > 80 ? 'bg-danger' : complaint.aiScore > 50 ? 'bg-warning' : 'bg-success'}`}
                                        style={{ width: `${complaint.aiScore}%` }}
                                    />
                                </div>
                                <p className="mb-0 mt-2 text-muted" style={{ fontSize: '0.78rem' }}>
                                    Flagged as <strong>{complaint.priority}</strong> priority based on keywords and location density.
                                </p>
                            </div>
                        )}

                        {/* Citizen Feedback (read-only display) */}
                        {complaint.feedback?.message && (
                            <div className="p-3 rounded-3 border" style={{ background: '#fef2f2', borderColor: '#fca5a5' }}>
                                <label className="fw-bold text-danger text-uppercase mb-2 d-block" style={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>Citizen Feedback</label>
                                <p className="mb-1 text-dark fst-italic small">"{complaint.feedback.message}"</p>
                                <small className="text-muted">{new Date(complaint.feedback.date).toLocaleString()}</small>
                            </div>
                        )}
                    </div>

                    {/* Right: Tabbed Action Panel */}
                    <div style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column', minWidth: 0, background: '#f8fafc' }}>

                        {/* Tabs */}
                        <div className="d-flex border-bottom px-4 pt-3" style={{ background: '#f1f5f9', flexShrink: 0, gap: '2px' }}>
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className="btn btn-sm px-4 py-2 fw-medium"
                                    style={{
                                        borderRadius: '10px 10px 0 0',
                                        background: activeTab === tab.id ? 'white' : 'transparent',
                                        color: activeTab === tab.id ? '#1e293b' : '#64748b',
                                        borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                                        border: activeTab === tab.id ? '1px solid #e2e8f0' : 'none',
                                        borderBottom: activeTab === tab.id ? `2px solid #6366f1` : '2px solid transparent',
                                        fontSize: '0.83rem',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content (scrollable) */}
                        <div className="overflow-auto p-4 flex-grow-1">
                            <AnimatePresence mode="wait">

                                {/* ── Actions Tab ── */}
                                {activeTab === 'actions' && (
                                    <motion.div key="actions" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>

                                        {/* Visual Status Cards */}
                                        <label className="fw-bold text-muted text-uppercase mb-3 d-block" style={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>Update Status</label>
                                        <div className="d-flex flex-wrap gap-2 mb-5">
                                            {STATUS_OPTIONS.map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setDraft(prev => ({ ...prev, status: opt.value }))}
                                                    className="btn btn-sm fw-medium d-flex align-items-center gap-2"
                                                    style={{
                                                        borderRadius: '12px',
                                                        padding: '9px 18px',
                                                        background: draft.status === opt.value ? opt.bg : 'white',
                                                        color: draft.status === opt.value ? opt.color : '#64748b',
                                                        border: `1.5px solid ${draft.status === opt.value ? opt.border : '#e2e8f0'}`,
                                                        boxShadow: draft.status === opt.value ? `0 0 0 3px ${opt.bg}` : 'none',
                                                        transform: draft.status === opt.value ? 'scale(1.04)' : 'scale(1)',
                                                        transition: 'all 0.15s ease',
                                                        fontSize: '0.84rem',
                                                    }}
                                                >
                                                    {opt.value}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Official Notes */}
                                        <label className="fw-bold text-muted text-uppercase mb-2 d-block" style={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>Official Notes</label>
                                        <textarea
                                            className="form-control shadow-none mb-1"
                                            rows={6}
                                            placeholder="Add resolution notes, actions taken, or next steps... These are visible to the citizen."
                                            value={draft.adminNotes}
                                            onChange={e => setDraft(prev => ({ ...prev, adminNotes: e.target.value }))}
                                            style={{ borderRadius: '12px', fontSize: '0.88rem', resize: 'none', border: '1.5px solid #e2e8f0', lineHeight: 1.65 }}
                                        />
                                        <div className="d-flex justify-content-between mb-5">
                                            <small className="text-muted">Visible to citizen once resolved.</small>
                                            <small className="text-muted">{(draft.adminNotes || '').length} chars</small>
                                        </div>

                                        {/* Save Button */}
                                        <button
                                            onClick={handleSave}
                                            disabled={saving || !hasChanges}
                                            className="btn w-100 fw-bold py-3 rounded-3"
                                            style={{
                                                background: hasChanges ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : '#e2e8f0',
                                                color: hasChanges ? 'white' : '#94a3b8',
                                                border: 'none',
                                                fontSize: '0.95rem',
                                                transition: 'all 0.2s',
                                                boxShadow: hasChanges ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
                                            }}
                                        >
                                            {saving ? (
                                                <span className="d-flex align-items-center justify-content-center gap-2">
                                                    <span className="spinner-border spinner-border-sm" /> Saving...
                                                </span>
                                            ) : hasChanges ? 'Save Changes' : 'No Changes to Save'}
                                        </button>
                                        {hasChanges && (
                                            <p className="text-center text-muted mt-2" style={{ fontSize: '0.74rem' }}>You have unsaved changes</p>
                                        )}
                                    </motion.div>
                                )}

                                {/* ── Expenses Tab ── */}
                                {activeTab === 'expenses' && (
                                    <motion.div key="expenses" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>

                                        {(draft.expenses || []).length > 0 && (
                                            <div className="d-flex align-items-center justify-content-between p-3 rounded-3 mb-4" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                                                <span className="fw-bold text-success small">Total Expenses</span>
                                                <span className="fw-bold text-success fs-5">₹{totalExpense.toLocaleString()}</span>
                                            </div>
                                        )}

                                        {(draft.expenses || []).length === 0 ? (
                                            <div className="text-center py-5 text-muted">
                                                <div style={{ fontSize: '2.5rem' }}>📋</div>
                                                <p className="mt-2 small">No expenses recorded yet.</p>
                                            </div>
                                        ) : (
                                            <div className="mb-4">
                                                {(draft.expenses || []).map((exp, idx) => (
                                                    <div key={idx} className="d-flex justify-content-between align-items-center px-3 py-2 mb-2 rounded-3 border bg-white">
                                                        <span className="fw-medium text-dark small">{exp.item}</span>
                                                        <div className="d-flex align-items-center gap-3">
                                                            <span className="fw-bold text-primary small">₹{Number(exp.cost).toLocaleString()}</span>
                                                            <button
                                                                onClick={() => removeExpense(idx)}
                                                                className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center p-0"
                                                                style={{ width: '24px', height: '24px', background: '#fee2e2', border: 'none', flexShrink: 0 }}
                                                            >
                                                                <FaTimes size={10} className="text-danger" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Add Expense Form */}
                                        <div className="p-4 rounded-3 border" style={{ background: 'white' }}>
                                            <label className="fw-bold text-muted text-uppercase mb-3 d-block" style={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>Add Expense Item</label>
                                            <div className="mb-2">
                                                <input
                                                    type="text"
                                                    placeholder="Description (e.g. Replacement Bulb)"
                                                    className="form-control shadow-none"
                                                    style={{ borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.87rem' }}
                                                    value={newExpenseItem}
                                                    onChange={e => setNewExpenseItem(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && addExpense()}
                                                />
                                            </div>
                                            <div className="d-flex gap-2">
                                                <div className="input-group" style={{ flex: 1 }}>
                                                    <span className="input-group-text bg-white border-end-0 text-muted" style={{ borderRadius: '10px 0 0 10px', border: '1.5px solid #e2e8f0', borderRight: 'none' }}>₹</span>
                                                    <input
                                                        type="number"
                                                        placeholder="Cost"
                                                        className="form-control shadow-none border-start-0"
                                                        style={{ borderRadius: '0 10px 10px 0', border: '1.5px solid #e2e8f0', borderLeft: 'none', fontSize: '0.87rem' }}
                                                        value={newExpenseCost}
                                                        onChange={e => setNewExpenseCost(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && addExpense()}
                                                    />
                                                </div>
                                                <button
                                                    onClick={addExpense}
                                                    disabled={!newExpenseItem.trim() || !newExpenseCost}
                                                    className="btn fw-bold px-4"
                                                    style={{ borderRadius: '10px', background: '#6366f1', color: 'white', border: 'none', fontSize: '0.85rem' }}
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>

                                        {(draft.expenses || []).length > 0 && (
                                            <button
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="btn w-100 fw-bold py-2 rounded-3 mt-4"
                                                style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none' }}
                                            >
                                                {saving ? 'Saving...' : 'Save Expense Report'}
                                            </button>
                                        )}
                                    </motion.div>
                                )}

                                {/* ── Activity Tab ── */}
                                {activeTab === 'activity' && (
                                    <motion.div key="activity" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
                                        {(!complaint.activityLog || complaint.activityLog.length === 0) ? (
                                            <div className="text-center py-5 text-muted">
                                                <div style={{ fontSize: '2.5rem' }}>📜</div>
                                                <p className="mt-2 small">No activity recorded yet.</p>
                                            </div>
                                        ) : (
                                            <div className="position-relative ps-4" style={{ borderLeft: '2px solid #e2e8f0' }}>
                                                {[...complaint.activityLog].reverse().map((entry, idx) => {
                                                    const a = (entry.action || '').toLowerCase();
                                                    const color =
                                                        a.includes('filed') ? '#6366f1' :
                                                            a.includes('edited') ? '#f59e0b' :
                                                                a.includes('status') ? '#3b82f6' :
                                                                    a.includes('reopened') ? '#ef4444' :
                                                                        a.includes('accepted') ? '#10b981' : '#6b7280';
                                                    return (
                                                        <div key={idx} className="mb-4 position-relative">
                                                            <span
                                                                className="position-absolute rounded-circle"
                                                                style={{ left: '-21px', top: '9px', width: '14px', height: '14px', background: color, border: '2px solid white', boxShadow: `0 0 0 2px ${color}40`, flexShrink: 0 }}
                                                            />
                                                            <div className="bg-white rounded-3 border p-3 shadow-sm">
                                                                <div className="d-flex justify-content-between align-items-start flex-wrap gap-1 mb-1">
                                                                    <span className="fw-bold small" style={{ color }}>{entry.action}</span>
                                                                    <span className="text-muted" style={{ fontSize: '0.7rem' }}>{new Date(entry.timestamp).toLocaleString()}</span>
                                                                </div>
                                                                <div className="d-flex align-items-center gap-2">
                                                                    {entry.performedByRole === 'Authority'
                                                                        ? <FaUserTie size={11} className="text-primary" />
                                                                        : <FaUser size={11} className="text-secondary" />
                                                                    }
                                                                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                                        {entry.performedByName} · {entry.performedByRole}
                                                                    </small>
                                                                </div>
                                                                {entry.note && (
                                                                    <p className="mb-0 mt-2 fst-italic text-secondary" style={{ fontSize: '0.78rem' }}>"{entry.note}"</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ComplaintManagement;
