import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaTimes, FaMapMarkerAlt, FaFilePdf, FaCheckCircle, FaExclamationCircle,
    FaRobot, FaEdit, FaSave, FaUserTie, FaUser, FaHistory,
    FaPencilAlt, FaRedo, FaCheck, FaPlus, FaExchangeAlt, FaCalendarAlt,
    FaCommentAlt, FaTag, FaTerminal, FaShieldAlt, FaExclamationTriangle
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../api/axios';
import { notify } from '../utils/notify';

/* ─── Dark theme status configs ─── */
const STATUS_META = {
    Resolved:    { color: '#a3e635', bg: 'rgba(163,230,53,0.08)', border: 'rgba(163,230,53,0.3)' },
    Closed:      { color: '#a3e635', bg: 'rgba(163,230,53,0.08)', border: 'rgba(163,230,53,0.3)' },
    Pending:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)' },
    'In Progress':{ color: '#00f0ff', bg: 'rgba(0,240,255,0.08)', border: 'rgba(0,240,255,0.3)' },
    Rejected:    { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)' },
};
const getStatusMeta = (s) => STATUS_META[s] || { color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.3)' };

const PRIORITY_COLOR = { Emergency: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#a3e635' };

/* ─── Activity log helpers ─── */
const logActionMeta = (action) => {
    const a = action?.toLowerCase() || '';
    if (a.includes('filed'))    return { icon: FaPlus,        color: '#aa00ff' };
    if (a.includes('edited'))   return { icon: FaPencilAlt,   color: '#f59e0b' };
    if (a.includes('status'))   return { icon: FaExchangeAlt, color: '#00f0ff' };
    if (a.includes('reopened')) return { icon: FaRedo,        color: '#ef4444' };
    if (a.includes('accepted')) return { icon: FaCheck,       color: '#a3e635' };
    return { icon: FaHistory, color: '#6b7280' };
};

const ActivityLog = ({ log = [] }) => {
    if (!log || log.length === 0) return (
        <div style={{ padding: '32px', textAlign: 'center', color: '#4b5563', fontFamily: "'Share Tech Mono',monospace", fontSize: '11px', letterSpacing: '0.1em' }}>
            <FaHistory size={24} style={{ color: '#374151', marginBottom: '8px', display: 'block', margin: '0 auto 8px' }} />
            NO ACTIVITY LOGGED
        </div>
    );
    return (
        <div style={{ paddingLeft: '20px', borderLeft: '1px solid rgba(170,0,255,0.2)' }}>
            {[...log].reverse().map((entry, idx) => {
                const { icon: Icon, color } = logActionMeta(entry.action);
                return (
                    <div key={idx} style={{ marginBottom: '16px', position: 'relative' }}>
                        <span style={{
                            position: 'absolute', left: '-27px', top: '8px',
                            width: '14px', height: '14px', borderRadius: '50%',
                            background: `rgba(0,0,0,0.8)`, border: `1.5px solid ${color}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: `0 0 6px ${color}44`,
                        }}>
                            <Icon size={6} style={{ color }} />
                        </span>
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '6px', padding: '10px 14px',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginBottom: '4px' }}>
                                <span style={{ color, fontWeight: 'bold', fontSize: '11px', fontFamily: "'Share Tech Mono',monospace", letterSpacing: '0.1em' }}>{entry.action}</span>
                                <span style={{ color: '#4b5563', fontSize: '9px', fontFamily: "'Share Tech Mono',monospace" }}>
                                    {new Date(entry.timestamp).toLocaleString()}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {entry.performedByRole === 'Authority'
                                    ? <FaUserTie size={10} style={{ color: '#aa00ff' }} />
                                    : <FaUser size={10} style={{ color: '#a3e635' }} />}
                                <small style={{ color: '#6b7280', fontSize: '10px', fontFamily: "'Rajdhani',sans-serif" }}>
                                    {entry.performedByName || 'Unknown'} · {entry.performedByRole}
                                </small>
                            </div>
                            {entry.note && (
                                <p style={{ margin: '6px 0 0', color: '#9ca3af', fontSize: '11px', fontFamily: "'Rajdhani',sans-serif", fontStyle: 'italic', lineHeight: 1.5 }}>
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

/* ─── Main Modal ─── */
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
        (complaint.complaintUser?._id === currentUser._id) ||
        (complaint.complaintUser?.toString() === currentUser._id) ||
        complaint.complaintUser === currentUser._id
    );
    const canEdit = isOwner && !['Resolved', 'Closed'].includes(complaint.complaintStatus);

    const getDescription = (desc) => desc ? desc.replace(/^\*\*(.*?)\*\*\n?/, '').trim() : '';
    const getTitle = (desc) => {
        if (!desc) return complaint.complaintType || 'Issue Report';
        const m = desc.match(/^\*\*(.*?)\*\*/);
        return m ? m[1] : complaint.complaintType || 'Issue Report';
    };

    const startEdit = () => { setEditedDescription(getDescription(complaint.complaintDescription)); setIsEditing(true); };
    const saveEdit = async () => {
        if (!editedDescription.trim()) { notify('warning', 'Description cannot be empty.'); return; }
        setSavingEdit(true);
        try {
            await api.put(`/complaint/edit/${complaint.complaintId || complaint._id}`, { description: editedDescription });
            notify('success', 'UPLINK UPDATED');
            setIsEditing(false);
            if (onUpdate) onUpdate();
        } catch (err) { notify('error', err?.response?.data?.message || 'UPDATE FAILED'); }
        finally { setSavingEdit(false); }
    };

    const downloadExpenseReport = () => {
        const doc = new jsPDF();
        const pageW = doc.internal.pageSize.getWidth();
        const now = new Date();
        doc.setFillColor(10, 10, 16); doc.rect(0, 0, pageW, 28, 'F');
        doc.setFontSize(16); doc.setTextColor(170, 0, 255); doc.setFont(undefined, 'bold');
        doc.text('CIVIC CONNECT', 14, 11);
        doc.setFontSize(10); doc.setTextColor(200, 200, 200); doc.setFont(undefined, 'normal');
        doc.text('OFFICIAL COMPLAINT & EXPENSE REPORT', 14, 19);
        doc.setFontSize(9);
        doc.text(`GENERATED: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, pageW - 14, 19, { align: 'right' });
        const status = complaint.complaintStatus || '—';
        const priority = complaint.complaintPriority || '—';
        const filedDate = complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
        doc.setTextColor(40, 40, 40); doc.setFontSize(12); doc.setFont(undefined, 'bold');
        doc.text('1. Complaint Details', 14, 40);
        doc.setDrawColor(220, 220, 220); doc.line(14, 43, pageW - 14, 43);
        autoTable(doc, { startY: 47, theme: 'grid', styles: { fontSize: 9, cellPadding: 3 }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 48, fillColor: [245, 247, 250] } }, body: [['Complaint ID', complaint.complaintId || complaint._id || '—'], ['Issue Type', complaint.complaintType || '—'], ['Priority', priority], ['Status', status], ['Location', complaint.complaintLocation || '—'], ['Date Filed', filedDate]] });
        const afterTable = doc.lastAutoTable.finalY + 6;
        doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.setTextColor(40, 40, 40);
        doc.text('Description:', 14, afterTable);
        doc.setFont(undefined, 'normal');
        const desc = complaint.complaintDescription || 'No description provided.';
        const descLines = doc.splitTextToSize(desc, pageW - 28);
        doc.text(descLines, 14, afterTable + 6);
        let notesStartY = afterTable + 6 + descLines.length * 5 + 12;
        let notesLines = [];
        if (complaint.complaintNotes) {
            doc.setFontSize(12); doc.setFont(undefined, 'bold'); doc.setTextColor(40, 40, 40);
            doc.text('2. Official Notes', 14, notesStartY);
            doc.setDrawColor(220, 220, 220); doc.line(14, notesStartY + 3, pageW - 14, notesStartY + 3);
            doc.setFontSize(9); doc.setFont(undefined, 'normal');
            notesLines = doc.splitTextToSize(complaint.complaintNotes, pageW - 28);
            doc.text(notesLines, 14, notesStartY + 10);
        }
        const expenseStartY = complaint.complaintNotes ? notesStartY + 10 + notesLines.length * 5 + 12 : afterTable + 6 + descLines.length * 5 + 12;
        doc.setFontSize(12); doc.setFont(undefined, 'bold'); doc.setTextColor(40, 40, 40);
        doc.text(complaint.complaintNotes ? '3. Expense Breakdown' : '2. Expense Breakdown', 14, expenseStartY);
        doc.setDrawColor(220, 220, 220); doc.line(14, expenseStartY + 3, pageW - 14, expenseStartY + 3);
        if (complaint.expenses?.length > 0) {
            const total = complaint.expenses.reduce((acc, e) => acc + Number(e.cost), 0);
            autoTable(doc, { startY: expenseStartY + 8, head: [['#', 'Item', 'Cost']], body: complaint.expenses.map((e, i) => [i + 1, e.item, `Rs. ${Number(e.cost).toLocaleString('en-IN')}`]), foot: [['', 'Total', `Rs. ${total.toLocaleString('en-IN')}`]], theme: 'striped', headStyles: { fillColor: [90, 0, 180], textColor: 255, fontStyle: 'bold', fontSize: 9 }, footStyles: { fillColor: [240, 242, 255], textColor: [40, 40, 40], fontStyle: 'bold', fontSize: 9 }, styles: { fontSize: 9, cellPadding: 3 }, columnStyles: { 0: { cellWidth: 12 }, 2: { halign: 'right', cellWidth: 36 } } });
        } else {
            doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(120);
            doc.text('No expenses recorded.', 14, expenseStartY + 14);
        }
        const pageCount = doc.internal.getNumberOfPages();
        for (let p = 1; p <= pageCount; p++) {
            doc.setPage(p);
            doc.setFontSize(8); doc.setTextColor(160);
            doc.text(`Page ${p} of ${pageCount}  |  Civic Connect – Confidential`, pageW / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
        }
        doc.save(`CivicConnect_Report_${complaint.complaintId || 'Issue'}.pdf`);
    };

    const submitFeedback = async (action) => {
        if (action === 'Reopen' && !feedbackMsg.trim()) { notify('warning', 'PROVIDE REASON TO REOPEN'); return; }
        setSubmitting(true);
        try {
            await api.post(`/complaint/feedback/${complaint.complaintId || complaint._id}`, { message: action === 'Accept' ? (feedbackMsg || 'Resolution accepted.') : feedbackMsg, action });
            notify('success', action === 'Accept' ? 'RESOLUTION ACCEPTED' : 'ISSUE REOPENED');
            if (onUpdate) onUpdate();
            setFeedbackMsg('');
            if (onClose) onClose();
        } catch (err) { notify('error', 'FEEDBACK TRANSMISSION FAILED'); }
        finally { setSubmitting(false); }
    };

    const sm = getStatusMeta(complaint.complaintStatus);
    const totalExpense = (complaint.expenses || []).reduce((s, e) => s + Number(e.cost), 0);
    const TABS = [
        { id: 'details', label: 'DETAILS' },
        { id: 'activity', label: `LOGS${complaint.activityLog?.length ? ` (${complaint.activityLog.length})` : ''}` },
        { id: 'feedback', label: 'FEEDBACK' },
    ];

    const DARK = { bg: '#09090b', surface: 'rgba(15,15,20,0.98)', panel: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)', textMain: '#f0f0f5', textMuted: '#6b7280', mono: "'Share Tech Mono',monospace" };

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={e => e.target === e.currentTarget && onClose()}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                        style={{
                            width: '100vw', maxWidth: '100vw', height: '100vh',
                            borderRadius: 0, overflow: 'hidden',
                            background: DARK.surface,
                            display: 'flex', flexDirection: 'column',
                            border: 'none',
                        }}
                    >
                        {/* ── Header ── */}
                        <div style={{
                            padding: '16px 24px',
                            background: 'rgba(9,9,11,0.95)',
                            borderBottom: '1px solid rgba(170,0,255,0.2)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            flexShrink: 0,
                        }}>
                            <div style={{ flex: 1, marginRight: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                    <FaTerminal size={14} style={{ color: '#aa00ff' }} />
                                    <h5 style={{ margin: 0, color: '#fff', fontFamily: DARK.mono, fontWeight: 'bold', fontSize: '1rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                        {getTitle(complaint.complaintDescription)}
                                    </h5>
                                    {complaint.isEdited && (
                                        <span style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '3px', fontSize: '9px', padding: '1px 6px', fontFamily: DARK.mono, letterSpacing: '0.1em' }}>
                                            EDITED
                                        </span>
                                    )}
                                    <span style={{ background: sm.bg, color: sm.color, border: `1px solid ${sm.border}`, borderRadius: '4px', fontSize: '10px', padding: '2px 10px', fontFamily: DARK.mono, letterSpacing: '0.15em' }}>
                                        {complaint.complaintStatus}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '10px', color: DARK.textMuted, fontFamily: DARK.mono, letterSpacing: '0.1em' }}>
                                    <span>#{complaint.complaintId?.substring(0, 12) || 'N/A'}</span>
                                    <span style={{ color: '#374151' }}>|</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FaTag size={8} /> {complaint.complaintType}</span>
                                    <span style={{ color: '#374151' }}>|</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><FaCalendarAlt size={8} /> {new Date(complaint.createdAt || complaint.updatedAt).toLocaleDateString()}</span>
                                    {complaint.complaintPriority && (
                                        <>
                                            <span style={{ color: '#374151' }}>|</span>
                                            <span style={{ color: PRIORITY_COLOR[complaint.complaintPriority] || '#6b7280' }}>
                                                ⬤ {complaint.complaintPriority?.toUpperCase()}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                            >
                                <FaTimes size={13} style={{ color: '#6b7280' }} />
                            </button>
                        </div>

                        {/* ── Body ── */}
                        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                            {/* LEFT */}
                            <div style={{ flex: '1 1 55%', borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', padding: '28px 32px' }}>

                                {complaint.complaintImage && (
                                    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px', maxHeight: '260px' }}>
                                        <img src={complaint.complaintImage} alt="Evidence" style={{ width: '100%', height: '260px', objectFit: 'cover', filter: 'brightness(0.9) contrast(1.1)' }} />
                                    </div>
                                )}

                                {/* Location */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', marginBottom: '20px' }}>
                                    <FaMapMarkerAlt style={{ color: '#ef4444', flexShrink: 0 }} size={12} />
                                    <span style={{ color: '#e5e7eb', fontSize: '12px', fontFamily: "'Rajdhani',sans-serif", lineHeight: 1.4 }}>{complaint.complaintLocation}</span>
                                </div>

                                {/* Sub-tabs */}
                                <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '20px' }}>
                                    {TABS.map(tab => (
                                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                padding: '8px 16px',
                                                color: activeTab === tab.id ? '#aa00ff' : '#4b5563',
                                                fontFamily: DARK.mono, fontSize: '10px', letterSpacing: '0.12em',
                                                borderBottom: activeTab === tab.id ? '2px solid #aa00ff' : '2px solid transparent',
                                                transition: 'all 0.15s',
                                            }}>
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <AnimatePresence mode="wait">
                                    {/* Details Tab */}
                                    {activeTab === 'details' && (
                                        <motion.div key="details" initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                                            <label style={{ color: DARK.textMuted, fontFamily: DARK.mono, fontSize: '9px', letterSpacing: '0.2em', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>SITUATION LOG</label>
                                            {isEditing ? (
                                                <div>
                                                    <textarea rows={5} value={editedDescription} onChange={e => setEditedDescription(e.target.value)} autoFocus
                                                        style={{ width: '100%', background: 'rgba(170,0,255,0.05)', border: '1px solid rgba(170,0,255,0.4)', borderRadius: '6px', padding: '12px', color: '#e5e7eb', fontFamily: "'Rajdhani',sans-serif", fontSize: '14px', resize: 'none', outline: 'none', marginBottom: '10px' }} />
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button onClick={saveEdit} disabled={savingEdit} style={{ background: '#aa00ff', color: '#fff', border: 'none', borderRadius: '4px', padding: '8px 16px', fontFamily: DARK.mono, fontSize: '10px', letterSpacing: '0.1em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <FaSave size={10} /> {savingEdit ? 'SAVING...' : 'COMMIT'}
                                                        </button>
                                                        <button onClick={() => setIsEditing(false)} disabled={savingEdit} style={{ background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '8px 16px', fontFamily: DARK.mono, fontSize: '10px', cursor: 'pointer' }}>
                                                            ABORT
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p style={{ color: '#d1d5db', fontSize: '14px', fontFamily: "'Rajdhani',sans-serif", lineHeight: 1.75, marginBottom: '16px' }}>
                                                        {getDescription(complaint.complaintDescription) || complaint.complaintDescription}
                                                    </p>
                                                    {canEdit && (
                                                        <button onClick={startEdit} style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '4px', padding: '6px 14px', fontFamily: DARK.mono, fontSize: '10px', letterSpacing: '0.1em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <FaEdit size={10} /> EDIT LOG
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {/* AI Score */}
                                            {complaint.complaintAIScore > 0 && (
                                                <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(170,0,255,0.05)', border: '1px solid rgba(170,0,255,0.2)', borderRadius: '6px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <FaRobot style={{ color: '#aa00ff' }} size={12} />
                                                            <span style={{ color: '#fff', fontFamily: DARK.mono, fontSize: '10px', letterSpacing: '0.15em' }}>AI THREAT SCORE</span>
                                                        </div>
                                                        <span style={{
                                                            color: complaint.complaintAIScore > 80 ? '#ef4444' : complaint.complaintAIScore > 50 ? '#f59e0b' : '#a3e635',
                                                            fontFamily: DARK.mono, fontWeight: 'bold', fontSize: '13px',
                                                        }}>
                                                            {Math.round(complaint.complaintAIScore)}/100
                                                        </span>
                                                    </div>
                                                    <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                                                        <div style={{
                                                            height: '100%', width: `${complaint.complaintAIScore}%`,
                                                            background: complaint.complaintAIScore > 80 ? '#ef4444' : complaint.complaintAIScore > 50 ? '#f59e0b' : '#a3e635',
                                                            boxShadow: `0 0 6px ${complaint.complaintAIScore > 80 ? '#ef4444' : '#a3e635'}`,
                                                            transition: 'width 0.4s',
                                                        }} />
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* Activity Tab */}
                                    {activeTab === 'activity' && (
                                        <motion.div key="activity" initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                                            <ActivityLog log={complaint.activityLog} />
                                        </motion.div>
                                    )}

                                    {/* Feedback Tab */}
                                    {activeTab === 'feedback' && (
                                        <motion.div key="feedback" initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                                            {complaint.feedbackHistory?.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                                                    {complaint.feedbackHistory.map((fb, idx) => (
                                                        <div key={idx} style={{
                                                            padding: '12px 14px', borderRadius: '6px',
                                                            background: fb.action === 'Accept' ? 'rgba(163,230,53,0.06)' : 'rgba(245,158,11,0.06)',
                                                            border: `1px solid ${fb.action === 'Accept' ? 'rgba(163,230,53,0.25)' : 'rgba(245,158,11,0.25)'}`,
                                                        }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                                <small style={{ color: fb.action === 'Accept' ? '#a3e635' : '#f59e0b', fontFamily: DARK.mono, fontSize: '9px', letterSpacing: '0.1em' }}>
                                                                    {fb.action === 'Accept' ? 'RESOLUTION ACCEPTED' : 'REOPEN REQUEST'}
                                                                </small>
                                                                <small style={{ color: DARK.textMuted, fontSize: '9px', fontFamily: DARK.mono }}>{new Date(fb.date).toLocaleString()}</small>
                                                            </div>
                                                            <p style={{ margin: 0, color: '#d1d5db', fontSize: '12px', fontStyle: 'italic', fontFamily: "'Rajdhani',sans-serif" }}>"{fb.message}"</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div style={{ padding: '24px', textAlign: 'center', color: DARK.textMuted, fontFamily: DARK.mono, fontSize: '10px', letterSpacing: '0.1em' }}>
                                                    <FaCommentAlt size={20} style={{ color: '#1f2937', display: 'block', margin: '0 auto 8px' }} />
                                                    NO FEEDBACK TRANSMITTED
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* RIGHT */}
                            <div style={{ flex: '0 0 320px', overflowY: 'auto', padding: '24px', background: 'rgba(0,0,0,0.2)', borderLeft: '1px solid rgba(255,255,255,0.04)' }}>

                                {/* Status card */}
                                <div style={{ padding: '14px', background: sm.bg, border: `1px solid ${sm.border}`, borderRadius: '6px', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: sm.color, boxShadow: `0 0 6px ${sm.color}` }} />
                                        <span style={{ color: sm.color, fontFamily: DARK.mono, fontWeight: 'bold', fontSize: '11px', letterSpacing: '0.15em' }}>{complaint.complaintStatus?.toUpperCase()}</span>
                                    </div>
                                    <small style={{ color: DARK.textMuted, fontSize: '11px' }}>
                                        {['Resolved', 'Closed'].includes(complaint.complaintStatus)
                                            ? `Resolved: ${new Date(complaint.complaintResolvedDate || complaint.updatedAt).toLocaleDateString()}`
                                            : 'Authority actively reviewing this issue.'
                                        }
                                    </small>
                                </div>

                                {/* Reporter */}
                                {complaint.complaintUser && (
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ color: DARK.textMuted, fontFamily: DARK.mono, fontSize: '9px', letterSpacing: '0.2em', display: 'block', marginBottom: '8px' }}>REPORTER</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: DARK.panel, border: `1px solid ${DARK.border}`, borderRadius: '6px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(170,0,255,0.12)', border: '1px solid rgba(170,0,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <FaUser size={12} style={{ color: '#aa00ff' }} />
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, color: '#fff', fontFamily: DARK.mono, fontSize: '11px', letterSpacing: '0.08em' }}>{complaint.complaintUser?.userName || 'CITIZEN'}</p>
                                                <small style={{ color: DARK.textMuted, fontSize: '9px' }}>CITIZEN</small>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Official Notes */}
                                {complaint.complaintStatus !== 'Pending' && complaint.complaintNotes && (
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ color: DARK.textMuted, fontFamily: DARK.mono, fontSize: '9px', letterSpacing: '0.2em', display: 'block', marginBottom: '8px' }}>OFFICIAL NOTES</label>
                                        <div style={{ padding: '12px', background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.15)', borderRadius: '6px' }}>
                                            <p style={{ margin: 0, color: '#d1d5db', fontSize: '12px', fontFamily: "'Rajdhani',sans-serif", lineHeight: 1.7, whiteSpace: 'pre-line' }}>{complaint.complaintNotes}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Expenses */}
                                {complaint.complaintStatus !== 'Pending' && complaint.expenses?.length > 0 && (
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ color: DARK.textMuted, fontFamily: DARK.mono, fontSize: '9px', letterSpacing: '0.2em', display: 'block', marginBottom: '8px' }}>EXPENSE LEDGER</label>
                                        <div style={{ background: DARK.panel, border: `1px solid ${DARK.border}`, borderRadius: '6px', overflow: 'hidden', marginBottom: '10px' }}>
                                            {complaint.expenses.map((exp, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                    <small style={{ color: '#d1d5db', fontFamily: "'Rajdhani',sans-serif", fontSize: '12px' }}>{exp.item}</small>
                                                    <small style={{ color: '#aa00ff', fontFamily: DARK.mono, fontWeight: 'bold' }}>₹{Number(exp.cost).toLocaleString()}</small>
                                                </div>
                                            ))}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(170,0,255,0.05)' }}>
                                                <small style={{ color: '#fff', fontFamily: DARK.mono, fontWeight: 'bold', fontSize: '10px', letterSpacing: '0.1em' }}>TOTAL</small>
                                                <small style={{ color: '#a3e635', fontFamily: DARK.mono, fontWeight: 'bold' }}>₹{totalExpense.toLocaleString()}</small>
                                            </div>
                                        </div>
                                        <button onClick={downloadExpenseReport} style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '8px', color: '#6b7280', fontFamily: DARK.mono, fontSize: '10px', letterSpacing: '0.1em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                            <FaFilePdf style={{ color: '#ef4444' }} /> EXPORT PDF REPORT
                                        </button>
                                    </div>
                                )}

                                {/* Citizen Verdict Action */}
                                {isOwner && complaint.complaintStatus === 'Resolved' && !complaint.accepted && (
                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ color: DARK.textMuted, fontFamily: DARK.mono, fontSize: '9px', letterSpacing: '0.2em', display: 'block', marginBottom: '8px' }}>YOUR VERDICT</label>
                                        <div style={{ padding: '14px', background: DARK.panel, border: `1px solid ${DARK.border}`, borderRadius: '6px' }}>
                                            <p style={{ color: DARK.textMuted, fontSize: '11px', marginBottom: '10px', fontFamily: "'Rajdhani',sans-serif", lineHeight: 1.5 }}>Accept the resolution or reopen if issue persists.</p>
                                            <textarea rows={2} placeholder="REASON (required if reopening)" value={feedbackMsg} onChange={e => setFeedbackMsg(e.target.value)}
                                                style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '8px', color: '#e5e7eb', fontFamily: "'Rajdhani',sans-serif", fontSize: '12px', resize: 'none', outline: 'none', marginBottom: '10px' }} />
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => submitFeedback('Accept')} disabled={submitting} style={{ flex: 1, background: 'rgba(163,230,53,0.1)', color: '#a3e635', border: '1px solid rgba(163,230,53,0.3)', borderRadius: '4px', padding: '8px', fontFamily: DARK.mono, fontSize: '9px', cursor: 'pointer', letterSpacing: '0.1em' }}>
                                                    {submitting ? '...' : '✓ ACCEPT'}
                                                </button>
                                                <button onClick={() => submitFeedback('Reopen')} disabled={submitting} style={{ flex: 1, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '4px', padding: '8px', fontFamily: DARK.mono, fontSize: '9px', cursor: 'pointer', letterSpacing: '0.1em' }}>
                                                    {submitting ? '...' : '↻ REOPEN'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Closed confirmation */}
                                {complaint.complaintStatus === 'Closed' && (
                                    <div style={{ padding: '20px', background: 'rgba(163,230,53,0.06)', border: '1px solid rgba(163,230,53,0.3)', borderRadius: '6px', textAlign: 'center' }}>
                                        <FaCheckCircle size={24} style={{ color: '#a3e635', marginBottom: '8px' }} />
                                        <h6 style={{ color: '#a3e635', fontFamily: DARK.mono, fontSize: '11px', letterSpacing: '0.15em', margin: '0 0 4px' }}>TICKET CLOSED</h6>
                                        <small style={{ color: DARK.textMuted, fontSize: '10px' }}>Resolution accepted by citizen.</small>
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
