import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaTimes, FaMapMarkerAlt, FaFilePdf, FaCheckCircle, FaExclamationCircle,
    FaRobot, FaEdit, FaSave, FaBan, FaUserTie, FaUser, FaHistory,
    FaPencilAlt, FaRedo, FaCheck, FaPlus, FaExchangeAlt, FaCalendarAlt,
    FaCommentAlt, FaTag
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../api/axios';
import { notify } from '../utils/notify';

/* ─── Status config ──────────────────────────────────────────────────────────── */
const STATUS_META = {
    Resolved: { color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7' },
    Closed: { color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7' },
    Pending: { color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
    'In Progress': { color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd' },
    Rejected: { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
};
const getStatusMeta = (s) => STATUS_META[s] || { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' };

/* ─── Activity Log helpers ───────────────────────────────────────────────────── */
const logActionMeta = (action) => {
    const a = action?.toLowerCase() || '';
    if (a.includes('filed')) return { icon: FaPlus, color: '#6366f1', bg: '#eef2ff' };
    if (a.includes('edited')) return { icon: FaPencilAlt, color: '#f59e0b', bg: '#fffbeb' };
    if (a.includes('status')) return { icon: FaExchangeAlt, color: '#3b82f6', bg: '#eff6ff' };
    if (a.includes('reopened')) return { icon: FaRedo, color: '#ef4444', bg: '#fef2f2' };
    if (a.includes('accepted')) return { icon: FaCheck, color: '#10b981', bg: '#ecfdf5' };
    return { icon: FaHistory, color: '#6b7280', bg: '#f9fafb' };
};

const ActivityLog = ({ log = [] }) => {
    if (!log || log.length === 0) {
        return (
            <div className="text-center py-4">
                <FaHistory size={28} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                <p className="text-muted small mb-0">No activity recorded yet.</p>
            </div>
        );
    }
    return (
        <div className="position-relative ps-4" style={{ borderLeft: '2px solid #e2e8f0' }}>
            {[...log].reverse().map((entry, idx) => {
                const { icon: Icon, color, bg } = logActionMeta(entry.action);
                return (
                    <div key={idx} className="mb-4 position-relative">
                        <span
                            className="position-absolute rounded-circle d-flex align-items-center justify-content-center"
                            style={{ left: '-21px', top: '10px', width: '14px', height: '14px', background: bg, border: `2px solid ${color}` }}
                        >
                            <Icon size={6} style={{ color }} />
                        </span>
                        <div className="bg-white rounded-3 border p-3 shadow-sm">
                            <div className="d-flex justify-content-between align-items-start flex-wrap gap-1 mb-1">
                                <span className="fw-bold small" style={{ color }}>{entry.action}</span>
                                <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                                    {new Date(entry.timestamp).toLocaleString()}
                                </span>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                {entry.performedByRole === 'Authority'
                                    ? <FaUserTie size={11} className="text-primary" />
                                    : <FaUser size={11} className="text-secondary" />
                                }
                                <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    {entry.performedByName || 'Unknown'} · {entry.performedByRole}
                                </small>
                            </div>
                            {entry.note && (
                                <p className="mb-0 mt-2 text-dark fst-italic" style={{ fontSize: '0.78rem' }}>
                                    "{entry.note}"
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

/* ─── Main Modal ─────────────────────────────────────────────────────────────── */
const ComplaintDetailsModal = ({ isOpen, onClose, complaint, onUpdate }) => {
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedDescription, setEditedDescription] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);
    const [activeTab, setActiveTab] = useState('details');

    if (!isOpen || !complaint) return null;

    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    const isOwner = currentUser && complaint && (
        (complaint.complaintUser && complaint.complaintUser._id === currentUser._id) ||
        complaint.complaintUser === currentUser._id
    );
    const canEdit = isOwner && !['Resolved', 'Closed'].includes(complaint.complaintStatus);

    const getDescription = (desc) => {
        if (!desc) return '';
        return desc.replace(/^\*\*(.*?)\*\*\n?/, '').trim();
    };

    const getTitle = (desc) => {
        if (!desc) return complaint.complaintType || 'Issue Report';
        const m = desc.match(/^\*\*(.*?)\*\*/);
        return m ? m[1] : complaint.complaintType || 'Issue Report';
    };

    const startEdit = () => {
        setEditedDescription(getDescription(complaint.complaintDescription));
        setIsEditing(true);
    };

    const saveEdit = async () => {
        if (!editedDescription.trim()) { notify('warning', 'Description cannot be empty.'); return; }
        setSavingEdit(true);
        try {
            await api.put(`/complaint/edit/${complaint.complaintId || complaint._id}`, { description: editedDescription });
            notify('success', 'Complaint updated successfully!');
            setIsEditing(false);
            if (onUpdate) onUpdate();
        } catch (err) {
            notify('error', err?.response?.data?.message || 'Failed to update complaint');
        } finally {
            setSavingEdit(false);
        }
    };

    const downloadExpenseReport = () => {
        const doc = new jsPDF();
        const pageW = doc.internal.pageSize.getWidth();
        const now = new Date();

        /* ── Header banner ── */
        doc.setFillColor(99, 102, 241);           // indigo
        doc.rect(0, 0, pageW, 28, 'F');
        doc.setFontSize(16); doc.setTextColor(255, 255, 255); doc.setFont(undefined, 'bold');
        doc.text('Civic Connect', 14, 11);
        doc.setFontSize(10); doc.setFont(undefined, 'normal');
        doc.text('Official Complaint & Expense Report', 14, 19);
        doc.setFontSize(9);
        doc.text(`Generated: ${now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}  ${now.toLocaleTimeString()}`, pageW - 14, 19, { align: 'right' });

        /* ── Section 1: Complaint Details ── */
        doc.setTextColor(40, 40, 40); doc.setFontSize(12); doc.setFont(undefined, 'bold');
        doc.text('1. Complaint Details', 14, 40);
        doc.setDrawColor(220, 220, 220); doc.line(14, 43, pageW - 14, 43);

        const status = complaint.complaintStatus || '—';
        const priority = complaint.complaintPriority || '—';
        const filedDate = complaint.createdAt
            ? new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—';
        const aiScore = complaint.aiConfidenceScore != null ? `${complaint.aiConfidenceScore}%` : '—';

        autoTable(doc, {
            startY: 47,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 48, fillColor: [245, 247, 250] } },
            body: [
                ['Complaint ID', complaint.complaintId || complaint._id || '—'],
                ['Issue Type', complaint.complaintType || '—'],
                ['Priority', priority],
                ['Status', status],
                ['Location', complaint.complaintLocation || '—'],
                ['Date Filed', filedDate],
                ['AI Confidence', aiScore],
            ],
        });

        /* ── Description (multi-line) ── */
        const afterTable = doc.lastAutoTable.finalY + 6;
        doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.setTextColor(40, 40, 40);
        doc.text('Description:', 14, afterTable);
        doc.setFont(undefined, 'normal');
        const desc = complaint.complaintDescription || 'No description provided.';
        const descLines = doc.splitTextToSize(desc, pageW - 28);
        doc.text(descLines, 14, afterTable + 6);

        /* ── Section 2: Expense Breakdown ── */
        const expenseStartY = afterTable + 6 + descLines.length * 5 + 12;
        doc.setFontSize(12); doc.setFont(undefined, 'bold'); doc.setTextColor(40, 40, 40);
        doc.text('2. Expense Breakdown', 14, expenseStartY);
        doc.setDrawColor(220, 220, 220); doc.line(14, expenseStartY + 3, pageW - 14, expenseStartY + 3);

        if (complaint.expenses?.length > 0) {
            const tableData = complaint.expenses.map((e, i) => [i + 1, e.item, `Rs. ${Number(e.cost).toLocaleString('en-IN')}`]);
            const total = complaint.expenses.reduce((acc, e) => acc + Number(e.cost), 0);
            autoTable(doc, {
                startY: expenseStartY + 8,
                head: [['#', 'Item / Description', 'Cost']],
                body: tableData,
                foot: [['', 'Total', `Rs. ${total.toLocaleString('en-IN')}`]],
                theme: 'striped',
                headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 9 },
                footStyles: { fillColor: [240, 242, 255], textColor: [40, 40, 40], fontStyle: 'bold', fontSize: 9 },
                styles: { fontSize: 9, cellPadding: 3 },
                columnStyles: { 0: { cellWidth: 12 }, 2: { halign: 'right', cellWidth: 36 } },
            });
        } else {
            doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(120);
            doc.text('No expenses recorded for this resolution.', 14, expenseStartY + 14);
        }

        /* ── Signature block (last page, bottom-right) ── */
        const authorityUser = JSON.parse(localStorage.getItem('user') || '{}');
        const authorityName = authorityUser.userName || 'Authorised Officer';
        const authorityDept = authorityUser.userDepartment || 'Civic Authority';

        // Go to last page
        doc.setPage(doc.internal.getNumberOfPages());
        const pageH = doc.internal.pageSize.getHeight();
        const sigRight = pageW - 14;
        const sigY = pageH - 38;

        doc.setDrawColor(180, 180, 180);
        doc.line(sigRight - 60, sigY, sigRight, sigY);           // signature line
        doc.setFontSize(8); doc.setTextColor(120); doc.setFont(undefined, 'normal');
        doc.text('Authorised Signatory', sigRight, sigY + 5, { align: 'right' });
        doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.setTextColor(40, 40, 40);
        doc.text(authorityName, sigRight, sigY + 11, { align: 'right' });
        doc.setFontSize(8); doc.setFont(undefined, 'normal'); doc.setTextColor(100);
        doc.text(authorityDept, sigRight, sigY + 17, { align: 'right' });
        doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, sigRight, sigY + 23, { align: 'right' });

        /* ── Footer ── */
        const pageCount = doc.internal.getNumberOfPages();
        for (let p = 1; p <= pageCount; p++) {
            doc.setPage(p);
            doc.setFontSize(8); doc.setTextColor(160);
            doc.text(`Page ${p} of ${pageCount}  |  Civic Connect – Confidential`, pageW / 2, pageH - 8, { align: 'center' });
        }

        doc.save(`CivicConnect_Report_${complaint.complaintId || 'Issue'}.pdf`);
    };


    const submitFeedback = async (action) => {
        if (action === 'Reopen' && !feedbackMsg.trim()) {
            notify('warning', 'Please provide a reason to reopen the issue.'); return;
        }
        setSubmitting(true);
        try {
            await api.post(`/complaint/feedback/${complaint.complaintId || complaint._id}`, {
                message: action === 'Accept' ? (feedbackMsg || 'Resolution accepted by citizen.') : feedbackMsg,
                action
            });
            notify('success', action === 'Accept' ? 'Resolution accepted' : 'Issue reopened');
            if (onUpdate) onUpdate();
            setFeedbackMsg('');
            if (onClose) onClose();
        } catch (err) {
            notify('error', 'Failed to send feedback');
        } finally {
            setSubmitting(false);
        }
    };

    const sm = getStatusMeta(complaint.complaintStatus);
    const totalExpense = (complaint.expenses || []).reduce((s, e) => s + Number(e.cost), 0);
    const TABS = [
        { id: 'details', label: 'Details' },
        { id: 'activity', label: `Activity${complaint.activityLog?.length ? ` (${complaint.activityLog.length})` : ''}` },
        { id: 'feedback', label: 'Feedback' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)', zIndex: 9999 }}
                    onClick={e => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                        style={{
                            width: '100vw', maxWidth: '100vw',
                            height: '100vh', borderRadius: '0',
                            overflow: 'hidden', background: 'white',
                            display: 'flex', flexDirection: 'column'
                        }}
                    >
                        {/* ── Header ── */}
                        <div
                            className="px-5 py-4 d-flex justify-content-between align-items-start border-bottom flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)' }}
                        >
                            <div className="flex-grow-1 me-4">
                                <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                                    <h5 className="fw-bold text-dark mb-0">{getTitle(complaint.complaintDescription)}</h5>
                                    {complaint.isEdited && (
                                        <span className="badge d-flex align-items-center gap-1" style={{ background: '#fff3cd', color: '#92400e', border: '1px solid #fcd34d', fontSize: '0.65rem', padding: '2px 7px', borderRadius: '20px' }}>
                                            <FaPencilAlt size={7} /> Edited
                                        </span>
                                    )}
                                    <span
                                        className="badge rounded-pill fw-medium px-3 py-1"
                                        style={{ background: sm.bg, color: sm.color, border: `1px solid ${sm.border}`, fontSize: '0.75rem' }}
                                    >
                                        {complaint.complaintStatus}
                                    </span>
                                </div>
                                <div className="d-flex align-items-center gap-3 flex-wrap" style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                    <span className="d-flex align-items-center gap-1">
                                        <span style={{ fontWeight: 600 }}>#{complaint.complaintId?.substring(0, 10) || 'N/A'}</span>
                                    </span>
                                    <span>·</span>
                                    <span className="d-flex align-items-center gap-1">
                                        <FaTag size={10} /> {complaint.complaintType}
                                    </span>
                                    <span>·</span>
                                    <span className="d-flex align-items-center gap-1">
                                        <FaCalendarAlt size={10} />
                                        {new Date(complaint.createdAt || complaint.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </span>
                                    {complaint.complaintPriority && (
                                        <>
                                            <span>·</span>
                                            <span className={`badge rounded-pill px-2 ${complaint.complaintPriority === 'High' || complaint.complaintPriority === 'Emergency' ? 'bg-danger-subtle text-danger' : 'bg-info-subtle text-info'}`} style={{ fontSize: '0.72rem' }}>
                                                {complaint.complaintPriority}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="btn btn-sm rounded-circle d-flex align-items-center justify-content-center border flex-shrink-0"
                                style={{ width: '36px', height: '36px', background: 'white' }}
                            >
                                <FaTimes size={14} className="text-secondary" />
                            </button>
                        </div>

                        {/* ── Body: two columns ── */}
                        <div className="d-flex flex-grow-1 overflow-hidden">

                            {/* ── LEFT: Photo + Description + AI ── */}
                            <div className="overflow-auto p-5" style={{ flex: '1 1 55%', borderRight: '1px solid #e2e8f0' }}>

                                {/* Image */}
                                {complaint.complaintImage ? (
                                    <div className="rounded-3 overflow-hidden border shadow-sm mb-4" style={{ maxHeight: '240px' }}>
                                        <img src={complaint.complaintImage} alt="Evidence" className="w-100 object-fit-cover" style={{ maxHeight: '240px' }} />
                                    </div>
                                ) : null}

                                {/* Location */}
                                <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 mb-4" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                                    <FaMapMarkerAlt className="text-danger" size={13} />
                                    <span className="text-dark fw-medium small">{complaint.complaintLocation}</span>
                                </div>

                                {/* Tabbed sub-panel */}
                                <div>
                                    {/* Sub-tabs */}
                                    <div className="d-flex gap-1 border-bottom mb-4" style={{ borderColor: '#e2e8f0' }}>
                                        {TABS.map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className="btn btn-sm fw-medium px-4 py-2"
                                                style={{
                                                    borderRadius: '8px 8px 0 0',
                                                    background: activeTab === tab.id ? 'white' : 'transparent',
                                                    color: activeTab === tab.id ? '#1e293b' : '#64748b',
                                                    border: activeTab === tab.id ? '1px solid #e2e8f0' : 'none',
                                                    borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                                                    fontSize: '0.82rem',
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                                {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {/* Details tab */}
                                        {activeTab === 'details' && (
                                            <motion.div key="details" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                                                <label className="fw-bold text-muted text-uppercase mb-2 d-block" style={{ fontSize: '0.71rem', letterSpacing: '0.08em' }}>Description</label>
                                                {isEditing ? (
                                                    <div>
                                                        <textarea
                                                            className="form-control shadow-none mb-3"
                                                            rows={5}
                                                            value={editedDescription}
                                                            onChange={e => setEditedDescription(e.target.value)}
                                                            placeholder="Update complaint description..."
                                                            autoFocus
                                                            style={{ borderRadius: '12px', border: '1.5px solid #6366f1', fontSize: '0.9rem', resize: 'none' }}
                                                        />
                                                        <div className="d-flex gap-2">
                                                            <button onClick={saveEdit} disabled={savingEdit} className="btn btn-sm fw-bold px-4" style={{ borderRadius: '10px', background: '#6366f1', color: 'white', border: 'none' }}>
                                                                <FaSave size={12} className="me-1" /> {savingEdit ? 'Saving...' : 'Save'}
                                                            </button>
                                                            <button onClick={() => setIsEditing(false)} disabled={savingEdit} className="btn btn-sm btn-light border fw-medium px-4" style={{ borderRadius: '10px' }}>
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="text-secondary mb-3" style={{ lineHeight: 1.75, fontSize: '0.9rem' }}>
                                                            {getDescription(complaint.complaintDescription) || complaint.complaintDescription}
                                                        </p>
                                                        {canEdit && (
                                                            <button onClick={startEdit} className="btn btn-sm fw-medium d-flex align-items-center gap-2" style={{ borderRadius: '10px', background: '#fffbeb', color: '#92400e', border: '1px solid #fcd34d', fontSize: '0.82rem' }}>
                                                                <FaEdit size={12} /> Edit Description
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {/* AI Score */}
                                                {complaint.complaintAIScore > 0 && (
                                                    <div className="mt-4 p-4 rounded-3 border" style={{ background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)' }}>
                                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                                            <div className="d-flex align-items-center gap-2">
                                                                <FaRobot className="text-primary" size={15} />
                                                                <span className="fw-bold text-dark small">AI Severity Score</span>
                                                            </div>
                                                            <span className={`badge rounded-pill fw-bold px-3 ${complaint.complaintAIScore > 80 ? 'bg-danger' : complaint.complaintAIScore > 50 ? 'bg-warning text-dark' : 'bg-success'}`}>
                                                                {Math.round(complaint.complaintAIScore)}/100
                                                            </span>
                                                        </div>
                                                        <div className="progress rounded-pill" style={{ height: '6px' }}>
                                                            <div
                                                                className={`progress-bar rounded-pill ${complaint.complaintAIScore > 80 ? 'bg-danger' : complaint.complaintAIScore > 50 ? 'bg-warning' : 'bg-success'}`}
                                                                style={{ width: `${complaint.complaintAIScore}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}

                                        {/* Activity tab */}
                                        {activeTab === 'activity' && (
                                            <motion.div key="activity" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                                                <ActivityLog log={complaint.activityLog} />
                                            </motion.div>
                                        )}

                                        {/* Feedback tab */}
                                        {activeTab === 'feedback' && (
                                            <motion.div key="feedback" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                                                {/* Feedback history */}
                                                {(complaint.feedbackHistory?.length > 0) ? (
                                                    <div className="d-flex flex-column gap-3 mb-4">
                                                        {complaint.feedbackHistory.map((fb, idx) => {
                                                            const isAccept = fb.action === 'Accept';
                                                            return (
                                                                <div key={idx} className="p-3 rounded-3 border" style={{ background: isAccept ? '#ecfdf5' : '#fffbeb', borderColor: isAccept ? '#6ee7b7' : '#fcd34d' }}>
                                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                                        <small className="fw-bold" style={{ color: isAccept ? '#10b981' : '#f59e0b' }}>{fb.action === 'Accept' ? 'Resolution Accepted' : 'Reopen Request'}</small>
                                                                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>{new Date(fb.date).toLocaleString()}</small>
                                                                    </div>
                                                                    <p className="mb-0 text-dark fst-italic" style={{ fontSize: '0.83rem' }}>"{fb.message}"</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : complaint.feedback?.message ? (
                                                    <div className="p-3 rounded-3 border mb-4" style={{ background: '#f8fafc' }}>
                                                        <small className="text-muted d-block mb-1">Feedback</small>
                                                        <p className="mb-0 text-dark fst-italic small">"{complaint.feedback.message}"</p>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-4 mb-4">
                                                        <FaCommentAlt size={28} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                                                        <p className="text-muted small mb-0">No feedback history yet.</p>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* ── RIGHT: Resolution info + actions ── */}
                            <div className="overflow-auto p-5" style={{ flex: '0 0 340px', background: '#f8fafc' }}>

                                {/* Status card */}
                                <div className="p-4 rounded-3 border mb-4" style={{ background: sm.bg, borderColor: sm.border }}>
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: sm.color, flexShrink: 0 }} />
                                        <span className="fw-bold" style={{ color: sm.color }}>{complaint.complaintStatus}</span>
                                    </div>
                                    {(complaint.complaintStatus === 'Resolved' || complaint.complaintStatus === 'Closed') ? (
                                        <small className="text-muted">
                                            Resolved on {new Date(complaint.complaintResolvedDate || complaint.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </small>
                                    ) : (
                                        <small className="text-muted">Authority is actively reviewing this issue.</small>
                                    )}
                                </div>

                                {/* Authority Notes */}
                                {complaint.complaintNotes && (
                                    <div className="mb-4">
                                        <label className="fw-bold text-muted text-uppercase mb-2 d-block" style={{ fontSize: '0.71rem', letterSpacing: '0.08em' }}>Official Notes</label>
                                        <div className="p-3 rounded-3 border bg-white" style={{ borderColor: '#e2e8f0' }}>
                                            <p className="mb-0 text-dark" style={{ fontSize: '0.88rem', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                                                {complaint.complaintNotes}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Expense Report */}
                                {complaint.expenses?.length > 0 && (
                                    <div className="mb-4">
                                        <label className="fw-bold text-muted text-uppercase mb-2 d-block" style={{ fontSize: '0.71rem', letterSpacing: '0.08em' }}>Expenses</label>
                                        <div className="bg-white rounded-3 border overflow-hidden mb-3">
                                            {complaint.expenses.map((exp, i) => (
                                                <div key={i} className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                                                    <small className="text-dark fw-medium">{exp.item}</small>
                                                    <small className="text-primary fw-bold">₹{Number(exp.cost).toLocaleString()}</small>
                                                </div>
                                            ))}
                                            <div className="d-flex justify-content-between align-items-center px-3 py-2" style={{ background: '#f8fafc' }}>
                                                <small className="fw-bold text-dark">Total</small>
                                                <small className="fw-bold text-success">₹{totalExpense.toLocaleString()}</small>
                                            </div>
                                        </div>
                                        <button
                                            onClick={downloadExpenseReport}
                                            className="btn btn-sm w-100 fw-medium d-flex align-items-center justify-content-center gap-2"
                                            style={{ borderRadius: '10px', background: 'white', border: '1.5px solid #e2e8f0', color: '#64748b', fontSize: '0.83rem' }}
                                        >
                                            <FaFilePdf className="text-danger" /> Download PDF Report
                                        </button>
                                    </div>
                                )}

                                {/* Citizen feedback action (accept / reopen) */}
                                {isOwner && complaint.complaintStatus === 'Resolved' && !complaint.accepted && (
                                    <div className="mb-4">
                                        <label className="fw-bold text-muted text-uppercase mb-2 d-block" style={{ fontSize: '0.71rem', letterSpacing: '0.08em' }}>Your Verdict</label>
                                        <div className="bg-white rounded-3 border p-3">
                                            <p className="small text-muted mb-3">Review the resolution. Accept it or request a reopen if the issue persists.</p>
                                            <textarea
                                                className="form-control shadow-none mb-3"
                                                rows={2}
                                                placeholder="Comment (required if reopening)"
                                                value={feedbackMsg}
                                                onChange={e => setFeedbackMsg(e.target.value)}
                                                style={{ borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', resize: 'none' }}
                                            />
                                            <div className="d-flex gap-2">
                                                <button
                                                    onClick={() => submitFeedback('Accept')}
                                                    disabled={submitting}
                                                    className="btn btn-sm fw-bold flex-grow-1 py-2"
                                                    style={{ borderRadius: '10px', background: '#ecfdf5', color: '#10b981', border: '1.5px solid #6ee7b7' }}
                                                >
                                                    {submitting ? '...' : 'Accept'}
                                                </button>
                                                <button
                                                    onClick={() => submitFeedback('Reopen')}
                                                    disabled={submitting || !feedbackMsg.trim()}
                                                    className="btn btn-sm fw-bold flex-grow-1 py-2"
                                                    style={{ borderRadius: '10px', background: '#fffbeb', color: '#f59e0b', border: '1.5px solid #fcd34d' }}
                                                >
                                                    {submitting ? '...' : 'Reopen'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Closed confirmation */}
                                {complaint.complaintStatus === 'Closed' && (
                                    <div className="text-center p-4 rounded-3 border" style={{ background: '#ecfdf5', borderColor: '#6ee7b7' }}>
                                        <FaCheckCircle size={28} style={{ color: '#10b981', marginBottom: '8px' }} />
                                        <h6 className="fw-bold mb-1" style={{ color: '#10b981' }}>Ticket Closed</h6>
                                        <small className="text-muted">The citizen has accepted the resolution.</small>
                                    </div>
                                )}

                                {/* Reporter info */}
                                {complaint.complaintUser && (
                                    <div className="mt-4 pt-4 border-top">
                                        <label className="fw-bold text-muted text-uppercase mb-2 d-block" style={{ fontSize: '0.71rem', letterSpacing: '0.08em' }}>Reporter</label>
                                        <div className="d-flex align-items-center gap-3 p-3 rounded-3 bg-white border">
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <FaUser size={14} style={{ color: '#6366f1' }} />
                                            </div>
                                            <div>
                                                <p className="fw-bold text-dark mb-0 small">{complaint.complaintUser?.userName || 'Citizen'}</p>
                                                <small className="text-muted">Citizen</small>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ComplaintDetailsModal;
