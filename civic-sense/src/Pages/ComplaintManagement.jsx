import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaSearch, FaEye, FaRobot, FaTimes, FaMapMarkerAlt, FaUser,
    FaArrowLeft, FaBuilding, FaCheckCircle, FaFilter, FaFileInvoiceDollar, FaRegClock
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
    const user = JSON.parse(localStorage.getItem('user'));

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
        const payload = {
            status: draft.status,
            notes: draft.adminNotes,
            expenses: draft.expenses || []
        };
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
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh', background: '#f8fafc' }}>
            <div className="spinner-border" style={{ color: '#4f46e5' }} role="status"><span className="visually-hidden">Loading…</span></div>
        </div>
    );

    return (
        <div className="d-flex flex-column" style={{ minHeight: '100vh', background: '#f8fafc' }}>

            {/* ─── UNIFIED HEADER ─────────────────────────────────── */}
            <div className="px-5 py-4 border-bottom shadow-sm" style={{ background: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-4">
                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center justify-content-center rounded-3 shadow-sm" style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #4f46e5, #6366f1)', color: 'white' }}>
                            <FaBuilding size={24} />
                        </div>
                        <div>
                            <h4 className="fw-bold text-dark mb-1" style={{ letterSpacing: '-0.5px' }}>
                                {user?.authorityDepartment || 'Department'} Queue
                            </h4>
                            <small className="text-secondary fw-medium">
                                {processed.length} Total Complaints &nbsp;·&nbsp; {statusCounts['Pending'] || 0} Pending &nbsp;·&nbsp; {statusCounts['Resolved'] || 0} Resolved
                            </small>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        {/* Live search */}
                        <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 border bg-white shadow-sm" style={{ width: '280px', transition: 'all 0.2s' }}>
                            <FaSearch size={14} className="text-muted" />
                            <input
                                type="text"
                                className="form-control border-0 p-0 shadow-none bg-transparent"
                                placeholder="Search ID, keyword, name..."
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                                style={{ fontSize: '0.9rem' }}
                            />
                            {searchText && <button className="btn btn-sm p-0 text-muted border-0" onClick={() => setSearchText('')}><FaTimes size={12} /></button>}
                        </div>
                        {/* AI sort */}
                        <button
                            onClick={() => setSortBy(sortBy === 'ai_priority' ? 'newest' : 'ai_priority')}
                            className="btn d-flex align-items-center gap-2 fw-bold shadow-sm"
                            style={{
                                borderRadius: '8px',
                                background: sortBy === 'ai_priority' ? '#fffbeb' : 'white',
                                color: sortBy === 'ai_priority' ? '#f59e0b' : '#64748b',
                                border: `1.5px solid ${sortBy === 'ai_priority' ? '#fcd34d' : '#e2e8f0'}`,
                                fontSize: '0.9rem', padding: '10px 20px',
                                transition: 'all 0.2s',
                            }}
                        >
                            <FaRobot size={15} />
                            {sortBy === 'ai_priority' ? 'Sorting: Critical Priority' : 'Sort: AI Priority'}
                        </button>
                    </div>
                </div>

                {/* Status filter pills */}
                <div className="d-flex gap-2 mt-4 pb-1 overflow-auto" style={{ scrollbarWidth: 'none' }}>
                    {[{ value: 'All', color: '#1e293b', bg: '#1e293b', border: '#1e293b', textActive: 'white' }, ...STATUS_OPTIONS].map((s) => {
                        const active = statusFilter === s.value;
                        const count = s.value === 'All' ? processed.length : (statusCounts[s.value] || 0);
                        return (
                            <button
                                key={s.value}
                                onClick={() => setStatusFilter(s.value)}
                                className="btn fw-bold px-4 py-2"
                                style={{
                                    borderRadius: '30px', fontSize: '0.85rem',
                                    background: active ? (s.bg || '#1e293b') : 'white',
                                    color: active ? (s.textActive || s.color) : '#64748b',
                                    border: `1.5px solid ${active ? (s.border || s.bg) : '#e2e8f0'}`,
                                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                    transform: active ? 'scale(1.02)' : 'scale(1)',
                                }}
                            >
                                {s.value} <span className="ms-1 opacity-75 fw-normal">({count})</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ─── CLEAN TABLE ─────────────────────────────────── */}
            <div className="px-5 py-4 flex-grow-1 d-flex flex-column">
                <div className="bg-white rounded-4 border shadow-sm d-flex flex-column flex-grow-1" style={{ overflow: 'hidden' }}>

                    {/* Column headers */}
                    <div className="d-flex align-items-center px-4 py-3 border-bottom" style={{ background: '#f8fafc', minWidth: '960px' }}>
                        {[
                            { label: 'Issue Title', style: { flex: '1 1 0', minWidth: '220px', paddingRight: '20px' } },
                            { label: 'Tracking ID', style: { width: '120px', minWidth: '120px', flexShrink: 0 } },
                            { label: 'Reporter', style: { width: '150px', minWidth: '150px', flexShrink: 0 } },
                            { label: 'Status', style: { width: '130px', minWidth: '130px', flexShrink: 0 } },
                            { label: 'AI Score', style: { width: '120px', minWidth: '120px', flexShrink: 0 } },
                            { label: 'Priority', style: { width: '110px', minWidth: '110px', flexShrink: 0 } },
                            { label: 'Date', style: { width: '120px', minWidth: '120px', flexShrink: 0 } },
                            { label: '', style: { width: '60px', minWidth: '60px', flexShrink: 0, textAlign: 'center' } },
                        ].map((h, i) => (
                            <div key={i} className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.08em', ...h.style }}>
                                {h.label}
                            </div>
                        ))}
                    </div>

                    {/* Table Body */}
                    <div className="overflow-auto flex-grow-1" style={{ minWidth: '960px' }}>
                        {filtered.length === 0 ? (
                            <div className="text-center py-5">
                                <FaFilter size={32} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
                                <h5 className="fw-bold text-dark mb-1">No complaints match</h5>
                                <p className="text-muted">Try removing your search filters to see all complaints.</p>
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
                                    style={{ cursor: 'pointer', transition: 'background 0.15s, transform 0.15s' }}
                                    onClick={() => setSelectedComplaint(c)}
                                    onMouseEnter={e => e.currentTarget.style.background = '#fefeff'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                >
                                    {/* Issue Title & Category */}
                                    <div style={{ flex: '1 1 0', minWidth: '220px', paddingRight: '20px' }}>
                                        <div className="d-flex align-items-center gap-2 mb-1 text-truncate">
                                            <span className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>{c.title}</span>
                                            {c.isEdited && (
                                                <span className="badge rounded-pill flex-shrink-0" style={{ background: '#fff3cd', color: '#92400e', border: '1px solid #fcd34d', fontSize: '0.65rem' }}>
                                                    Edited
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-muted text-truncate" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span className="badge bg-light text-secondary border px-2 py-1" style={{ fontSize: '0.65rem' }}>{c.category}</span>
                                            <span className="text-truncate">{c.location}</span>
                                        </div>
                                    </div>

                                    {/* ID */}
                                    <div style={{ width: '120px', minWidth: '120px', flexShrink: 0 }}>
                                        <span className="text-muted fw-bold" style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>#{String(c.id).slice(-6)}</span>
                                    </div>

                                    {/* Reporter */}
                                    <div style={{ width: '150px', minWidth: '150px', flexShrink: 0, overflow: 'hidden' }}>
                                        <div className="text-dark fw-medium text-truncate" style={{ fontSize: '0.85rem' }}>{c.reporter}</div>
                                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>Citizen</div>
                                    </div>

                                    {/* Status */}
                                    <div style={{ width: '130px', minWidth: '130px', flexShrink: 0 }}>
                                        <span className="badge rounded-pill fw-bold" style={{ background: st.bg, color: st.color, border: `1.5px solid ${st.border}`, fontSize: '0.75rem', padding: '6px 12px' }}>
                                            {c.status}
                                        </span>
                                    </div>

                                    {/* AI Score */}
                                    <div style={{ width: '120px', minWidth: '120px', flexShrink: 0 }}>
                                        {c.aiScore > 0 ? (
                                            <div className="d-flex align-items-center gap-2">
                                                <div style={{ width: '45px', height: '6px', borderRadius: '4px', background: '#f1f5f9', overflow: 'hidden' }}>
                                                    <div style={{ width: `${c.aiScore}%`, height: '100%', background: c.aiScore > 80 ? '#ef4444' : c.aiScore > 50 ? '#f59e0b' : '#10b981' }} />
                                                </div>
                                                <span className="fw-bold" style={{ fontSize: '0.8rem', color: c.aiScore > 80 ? '#ef4444' : c.aiScore > 50 ? '#f59e0b' : '#10b981' }}>{c.aiScore}</span>
                                            </div>
                                        ) : <span className="text-muted px-2">—</span>}
                                    </div>

                                    {/* Priority */}
                                    <div style={{ width: '110px', minWidth: '110px', flexShrink: 0 }}>
                                        <span className="badge rounded-pill fw-bold" style={{ background: pm.bg, color: pm.color, fontSize: '0.75rem', padding: '6px 12px' }}>
                                            {c.priority || 'Low'}
                                        </span>
                                    </div>

                                    {/* Date */}
                                    <div style={{ width: '120px', minWidth: '120px', flexShrink: 0 }}>
                                        <span className="text-muted fw-medium" style={{ fontSize: '0.8rem' }}>{c.date}</span>
                                    </div>

                                    {/* Action */}
                                    <div style={{ width: '60px', minWidth: '60px', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                                        <div className="d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#64748b' }}>
                                            <FaEye size={16} />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {filtered.length > 0 && (
                    <div className="text-center py-3">
                        <small className="text-muted fw-medium">Showing {filtered.length} of {processed.length} department complaints</small>
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

/* ─── Immersive Full-Screen Modal Component (Zendesk/Jira Style) ────────────────────── */
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
        { id: 'Workspace', icon: <FaCheckCircle />, label: 'Resolution Workspace' },
        { id: 'Ledger', icon: <FaFileInvoiceDollar />, label: `Expense Ledger ${(draft.expenses || []).length ? `(${(draft.expenses || []).length})` : ''}` },
        { id: 'Audit', icon: <FaRegClock />, label: `Audit Trail ${(complaint.activityLog || []).length ? `(${(complaint.activityLog || []).length})` : ''}` },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column"
            style={{ backgroundColor: '#f8fafc', zIndex: 1040 }}
        >
            {/* 1. Global Action Header */}
            <div className="px-4 py-2 bg-white border-bottom shadow-sm d-flex justify-content-between align-items-center" style={{ zIndex: 10, flexShrink: 0 }}>
                <div className="d-flex align-items-center gap-3">
                    <button
                        onClick={onClose}
                        className="btn btn-light rounded-circle d-flex align-items-center justify-content-center border shadow-sm"
                        style={{ width: '44px', height: '44px', transition: 'all 0.2s', background: '#f8fafc' }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                        title="Back to Dashboard"
                    >
                        <FaArrowLeft size={16} className="text-secondary" />
                    </button>
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                            <h6 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.2px' }}>Ticket #{String(complaint.id).slice(-6)}</h6>
                            <span className="badge rounded-pill px-2 py-1 fw-bold shadow-sm" style={{ background: currentStatusOpt.bg, color: currentStatusOpt.color, border: `1px solid ${currentStatusOpt.border}`, fontSize: '0.75rem' }}>
                                {draft.status}
                            </span>
                        </div>
                        <div className="text-muted fw-medium d-flex gap-2 align-items-center" style={{ fontSize: '0.8rem' }}>
                            <span>{complaint.category}</span>
                            <span>•</span>
                            <span>Reported {complaint.date}</span>
                            {hasChanges && <><span className="text-primary">•</span><span className="text-primary fw-bold" style={{ fontSize: '0.75rem' }}>Unsaved Changes</span></>}
                        </div>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <button onClick={onClose} className="btn btn-sm fw-bold text-muted px-3" style={{ borderRadius: '8px', fontSize: '0.85rem' }}>Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className="btn btn-sm fw-bold px-3 py-1 text-white shadow"
                        style={{
                            background: hasChanges ? 'linear-gradient(135deg, #4f46e5, #6366f1)' : '#cbd5e1',
                            borderRadius: '8px', transition: 'all 0.2s', border: 'none',
                            transform: hasChanges ? 'translateY(-1px)' : 'none', fontSize: '0.85rem'
                        }}
                    >
                        {saving ? (
                            <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Syncing Database...</>
                        ) : 'Save & Publish Changes'}
                    </button>
                </div>
            </div>

            {/* 2. Content Split View */}
            <div className="d-flex flex-grow-1 overflow-hidden">

                {/* ── LEFT SIDEBAR (Read-Only Context) ── */}
                <div className="bg-white border-end d-flex flex-column" style={{ width: '360px', flexShrink: 0, zIndex: 5 }}>
                    <div className="p-3 overflow-auto flex-grow-1" style={{ scrollbarWidth: 'thin' }}>

                        {/* Evidence Image */}
                        {complaint.image ? (
                            <div className="rounded-3 overflow-hidden shadow-sm border mb-3 position-relative bg-light">
                                <img src={complaint.image} alt="Evidence" className="w-100 object-fit-cover" style={{ height: '180px' }} />
                                <div className="position-absolute bottom-0 start-0 w-100 p-2" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 100%)' }}>
                                    <span className="badge bg-dark bg-opacity-75 text-white border border-secondary border-opacity-50"><FaEye className="me-2" />Evidence Attached</span>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-3 mb-3 bg-light border d-flex align-items-center justify-content-center" style={{ height: '100px' }}>
                                <span className="text-muted fw-medium" style={{ fontSize: '0.8rem' }}>No Image Provided</span>
                            </div>
                        )}

                        <h6 className="fw-bold text-dark mb-3 lh-sm" style={{ fontSize: '0.95rem' }}>{complaint.title}</h6>

                        {/* Immutable Metadata Blocks */}
                        <div className="d-flex flex-column gap-2 mb-3">
                            {/* AI Priority Matrix */}
                            {complaint.aiScore > 0 && (
                                <div className="p-2 rounded-3 border bg-white shadow-sm d-flex gap-2 align-items-center">
                                    <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '36px', height: '36px', background: complaint.aiScore > 80 ? '#fef2f2' : complaint.aiScore > 50 ? '#fffbeb' : '#ecfdf5' }}>
                                        <FaRobot size={16} color={complaint.aiScore > 80 ? '#ef4444' : complaint.aiScore > 50 ? '#f59e0b' : '#10b981'} />
                                    </div>
                                    <div className="flex-grow-1">
                                        <div className="d-flex justify-content-between align-items-center mb-1">
                                            <span className="fw-bold text-dark" style={{ fontSize: '0.75rem' }}>AI Severity</span>
                                            <span className={`fw-bold ${complaint.aiScore > 80 ? 'text-danger' : complaint.aiScore > 50 ? 'text-warning' : 'text-success'}`} style={{ fontSize: '0.75rem' }}>{complaint.aiScore}/100</span>
                                        </div>
                                        <div className="progress rounded-pill" style={{ height: '4px' }}>
                                            <div className={`progress-bar rounded-pill ${complaint.aiScore > 80 ? 'bg-danger' : complaint.aiScore > 50 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${complaint.aiScore}%` }} />
                                        </div>
                                        <p className="mt-1 mb-0 text-muted" style={{ fontSize: '0.7rem' }}>Assigned Priority: <strong>{complaint.priority}</strong></p>
                                    </div>
                                </div>
                            )}

                            {/* Location */}
                            <div className="p-2 rounded-3 border bg-white shadow-sm d-flex gap-2 align-items-center">
                                <div className="rounded-circle d-flex align-items-center justify-content-center bg-danger bg-opacity-10 text-danger flex-shrink-0" style={{ width: '36px', height: '36px' }}>
                                    <FaMapMarkerAlt size={16} />
                                </div>
                                <div>
                                    <small className="text-muted text-uppercase fw-bold d-block mb-0" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>Location</small>
                                    <span className="text-dark fw-bold text-break" style={{ fontSize: '0.85rem' }}>{complaint.location}</span>
                                </div>
                            </div>

                            {/* Reporter */}
                            <div className="p-2 rounded-3 border bg-white shadow-sm d-flex gap-2 align-items-center">
                                <div className="rounded-circle d-flex align-items-center justify-content-center bg-info bg-opacity-10 text-info flex-shrink-0" style={{ width: '36px', height: '36px' }}>
                                    <FaUser size={16} />
                                </div>
                                <div>
                                    <small className="text-muted text-uppercase fw-bold d-block mb-0" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>Citizen</small>
                                    <span className="text-dark fw-bold" style={{ fontSize: '0.85rem' }}>{complaint.reporter}</span>
                                </div>
                            </div>
                        </div>

                        {/* Full Description Text */}
                        <div className="pt-3 border-top">
                            <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '0.85rem' }}>Description</h6>
                            <p className="text-secondary" style={{ fontSize: '0.85rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                {complaint.description}
                            </p>
                        </div>

                        {/* Post-Resolution Feedback (If any) */}
                        {complaint.feedback?.message && (
                            <div className="mt-3 p-3 rounded-3 shadow-sm border border-danger border-opacity-25" style={{ background: '#fffafa' }}>
                                <h6 className="fw-bold text-danger mb-1" style={{ fontSize: '0.8rem' }}>Feedback</h6>
                                <p className="mb-1 text-dark fst-italic" style={{ fontSize: '0.8rem' }}>"{complaint.feedback.message}"</p>
                                <small className="text-muted d-block mt-1" style={{ fontSize: '0.7rem' }}>{new Date(complaint.feedback.date).toLocaleString()}</small>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── RIGHT MAIN AREA (Dynamic Workspace) ── */}
                <div className="flex-grow-1 d-flex flex-column" style={{ background: '#f0f4f8' }}>

                    {/* Inner Navbar / Pill Tabs */}
                    <div className="px-4 pt-3 pb-0 mb-2">
                        <div className="bg-white p-1 rounded-pill shadow-sm d-flex gap-1 border" style={{ width: 'max-content' }}>
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className="btn btn-sm d-flex align-items-center gap-2 px-3 py-1 rounded-pill"
                                    style={{
                                        background: activeTab === tab.id ? '#1e293b' : 'transparent',
                                        color: activeTab === tab.id ? 'white' : '#64748b',
                                        border: 'none', fontSize: '0.8rem', fontWeight: '600',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Scrollable Form Content */}
                    <div className="flex-grow-1 overflow-auto px-4 pt-2 pb-3">
                        <div style={{ maxWidth: '850px' }}>
                            <AnimatePresence mode="wait">

                                {/* WORKSPACE TAB */}
                                {activeTab === 'Workspace' && (
                                    <motion.div key="Workspace" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                                        <div className="bg-white p-4 rounded-4 shadow-sm border">
                                            <h6 className="fw-bold text-dark mb-3">Workspace</h6>

                                            <div className="mb-4">
                                                <h6 className="fw-bold text-muted mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>1. Status</h6>
                                                <div className="d-flex flex-wrap gap-3">
                                                    {STATUS_OPTIONS.map(opt => {
                                                        const isSelected = draft.status === opt.value;
                                                        return (
                                                            <button
                                                                key={opt.value}
                                                                onClick={() => setDraft(prev => ({ ...prev, status: opt.value }))}
                                                                className="btn btn-sm px-3 py-2 d-flex align-items-center gap-2 shadow-sm"
                                                                style={{
                                                                    borderRadius: '12px',
                                                                    background: isSelected ? opt.bg : '#f8fafc',
                                                                    color: isSelected ? opt.color : '#64748b',
                                                                    border: `1.5px solid ${isSelected ? opt.border : '#e2e8f0'}`,
                                                                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                                                                    transition: 'all 0.2s',
                                                                    fontSize: '0.85rem', fontWeight: '600'
                                                                }}
                                                            >
                                                                {isSelected && <FaCheckCircle size={14} />} {opt.value}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="mb-2">
                                                <h6 className="fw-bold text-muted mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>2. Public Notice</h6>
                                                <p className="text-secondary mb-2" style={{ fontSize: '0.8rem' }}>
                                                    Detail findings. Visible to the citizen.
                                                </p>
                                                <textarea
                                                    className="form-control shadow-sm"
                                                    rows={6}
                                                    placeholder="e.g., A designated sanitation team was dispatched..."
                                                    value={draft.adminNotes}
                                                    onChange={e => setDraft(prev => ({ ...prev, adminNotes: e.target.value }))}
                                                    style={{
                                                        borderRadius: '12px', fontSize: '0.85rem',
                                                        border: '1.5px solid #e2e8f0', resize: 'vertical',
                                                        padding: '12px', lineHeight: '1.5',
                                                        backgroundColor: '#f8fafc'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* LEDGER TAB */}
                                {activeTab === 'Ledger' && (
                                    <motion.div key="Ledger" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                                        <div className="bg-white p-4 rounded-4 shadow-sm border">
                                            <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                                                <div>
                                                    <h6 className="fw-bold text-dark mb-1">Ledger</h6>
                                                    <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>Record costs.</p>
                                                </div>
                                                <div className="px-3 py-2 rounded-3 shadow-sm" style={{ background: '#ecfdf5', border: '1.5px solid #6ee7b7' }}>
                                                    <small className="d-block text-success fw-bold text-uppercase mb-0" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>Total</small>
                                                    <span className="text-success fw-bold fs-5 lh-1">₹{totalExpense.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <div className="bg-light p-3 rounded-3 border mb-3 shadow-sm">
                                                <h6 className="fw-bold text-dark mb-2" style={{ fontSize: '0.85rem' }}>Add Edit</h6>
                                                <div className="d-flex flex-wrap gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Item Description"
                                                        className="form-control form-control-sm shadow-none flex-grow-1"
                                                        style={{ borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', padding: '6px 12px' }}
                                                        value={newExpenseItem}
                                                        onChange={e => setNewExpenseItem(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && addExpense()}
                                                    />
                                                    <div className="input-group input-group-sm" style={{ width: '150px' }}>
                                                        <span className="input-group-text bg-white text-muted fw-bold border-end-0 px-2" style={{ borderRadius: '8px 0 0 8px', border: '1px solid #cbd5e1' }}>₹</span>
                                                        <input
                                                            type="number"
                                                            placeholder="Amt"
                                                            className="form-control shadow-none border-start-0 px-2"
                                                            style={{ borderRadius: '0 8px 8px 0', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                                            value={newExpenseCost}
                                                            onChange={e => setNewExpenseCost(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && addExpense()}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={addExpense}
                                                        disabled={!newExpenseItem.trim() || !newExpenseCost}
                                                        className="btn btn-sm fw-bold px-3 text-white shadow-sm"
                                                        style={{ borderRadius: '8px', background: '#10b981', border: 'none', fontSize: '0.85rem' }}
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </div>

                                            <h6 className="fw-bold text-muted mb-2" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Recorded</h6>

                                            {(draft.expenses || []).length === 0 ? (
                                                <div className="text-center py-5 rounded-4" style={{ border: '2px dashed #e2e8f0', background: '#f8fafc' }}>
                                                    <p className="mb-0 fw-bold text-muted fs-5">Ledger is currently empty.</p>
                                                </div>
                                            ) : (
                                                <div className="d-flex flex-column gap-3">
                                                    {(draft.expenses || []).map((exp, idx) => (
                                                        <div key={idx} className="d-flex justify-content-between align-items-center p-2 rounded-3 shadow-sm border bg-white">
                                                            <div className="d-flex align-items-center gap-2">
                                                                <div className="rounded-circle bg-light d-flex align-items-center justify-content-center border" style={{ width: '28px', height: '28px' }}>
                                                                    <FaCheckCircle className="text-muted" size={12} />
                                                                </div>
                                                                <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{exp.item}</span>
                                                            </div>
                                                            <div className="d-flex align-items-center gap-3">
                                                                <span className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>₹{Number(exp.cost).toLocaleString()}</span>
                                                                <button onClick={() => removeExpense(idx)} className="btn btn-light rounded-circle p-2 text-danger border" title="Remove Entry">
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
                                    <motion.div key="Audit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                                        <div className="bg-white p-4 rounded-4 shadow-sm border">
                                            <h6 className="fw-bold text-dark mb-4 border-bottom pb-2">Audit Trail</h6>

                                            {(!complaint.activityLog || complaint.activityLog.length === 0) ? (
                                                <div className="text-center py-5 text-muted">
                                                    <p className="fw-bold fs-5 text-dark mb-1">No Trail Recorded Yet</p>
                                                    <p className="text-secondary">Tracked event history will populate here automatically.</p>
                                                </div>
                                            ) : (
                                                <div className="position-relative ms-4 border-start border-4 border-light pb-4">
                                                    {[...complaint.activityLog].reverse().map((entry, idx) => {
                                                        const a = (entry.action || '').toLowerCase();
                                                        const color =
                                                            a.includes('filed') ? '#4f46e5' :
                                                                a.includes('edited') ? '#f59e0b' :
                                                                    a.includes('status') ? '#3b82f6' :
                                                                        a.includes('reopened') ? '#ef4444' :
                                                                            a.includes('accepted') ? '#10b981' : '#94a3b8';

                                                        return (
                                                            <div key={idx} className="mb-4 position-relative ps-4">
                                                                <div
                                                                    className="position-absolute rounded-circle shadow"
                                                                    style={{ left: '-8px', top: '12px', width: '16px', height: '16px', background: color, border: '3px solid white' }}
                                                                />
                                                                <div className="bg-white rounded-3 border shadow-sm p-3">
                                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                                        <div className="d-flex align-items-center gap-2">
                                                                            <div className="p-1 rounded-2 bg-light" style={{ color: color }}>
                                                                                {entry.performedByRole === 'Authority' ? <FaBuilding size={14} /> : <FaUser size={14} />}
                                                                            </div>
                                                                            <span className="fw-bold text-dark" style={{ fontSize: '0.85rem' }}>{entry.action}</span>
                                                                        </div>
                                                                        <span className="badge bg-light text-secondary border px-2 py-1 fw-medium shadow-sm font-monospace" style={{ fontSize: '0.7rem' }}>
                                                                            {new Date(entry.timestamp).toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-secondary fw-medium px-1" style={{ fontSize: '0.8rem' }}>
                                                                        By <span className="text-dark fw-bold">{entry.performedByName}</span>
                                                                        <span className="ms-2 px-2 py-0 bg-light border rounded-pill text-muted" style={{ fontSize: '0.7rem' }}>
                                                                            {entry.performedByRole}
                                                                        </span>
                                                                    </div>
                                                                    {entry.note && (
                                                                        <div className="mt-2 mx-1 p-2 bg-light border border-secondary border-opacity-10 rounded-3 text-dark fst-italic shadow-sm" style={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
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
