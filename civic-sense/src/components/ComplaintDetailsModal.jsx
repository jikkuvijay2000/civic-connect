import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaMapMarkerAlt, FaFilePdf, FaCommentDots, FaCheckCircle, FaExclamationCircle, FaRobot } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../api/axios';
import { notify } from '../utils/notify';

const ComplaintDetailsModal = ({ isOpen, onClose, complaint, onUpdate }) => {
    const [feedbackMsg, setFeedbackMsg] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen || !complaint) return null;

    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    const isOwner = currentUser && complaint && (
        (complaint.complaintUser && complaint.complaintUser._id === currentUser._id) ||
        complaint.complaintUser === currentUser._id
    );

    const downloadExpenseReport = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text("Civic Connect - Expense Report", 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Complaint ID: ${complaint.complaintId || complaint._id}`, 14, 32);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 38);

        doc.line(14, 45, 196, 45);

        // Complaint Details
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Issue: ${complaint.complaintType}`, 14, 55);
        doc.text(`Location: ${complaint.complaintLocation}`, 14, 62);
        doc.text(`Resolved By: Authority`, 14, 69); // Could be more specific if we had auth name

        // Expenses Table
        if (complaint.expenses && complaint.expenses.length > 0) {
            const tableData = complaint.expenses.map(e => [e.item, `Rs. ${e.cost}`]);
            const total = complaint.expenses.reduce((acc, curr) => acc + curr.cost, 0);
            tableData.push(['Total', `Rs. ${total}`]);

            autoTable(doc, {
                startY: 80,
                head: [['Item', 'Cost']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [66, 133, 244] },
                foot: [['Total', `Rs. ${total}`]],
                footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
            });
        } else {
            doc.text("No expenses recorded for this resolution.", 14, 90);
        }

        doc.save(`Expense_Report_${complaint.complaintId || 'CivicIsuse'}.pdf`);
    };

    const submitFeedback = async (action) => {
        if (action === 'Reopen' && !feedbackMsg.trim()) {
            notify("warning", "Please provide a reason to reopen the issue.");
            return;
        }
        setSubmitting(true);
        try {
            await api.post(`/complaint/feedback/${complaint.complaintId || complaint._id}`, {
                message: action === 'Accept' ? (feedbackMsg || "Resolution accepted by citizen.") : feedbackMsg,
                action: action
            });
            notify("success", action === 'Accept' ? "Resolution Accepted" : "Issue Reopened");
            if (onUpdate) onUpdate(); // Refresh parent
            setFeedbackMsg("");
            if (onClose) onClose();
        } catch (error) {
            console.error(error);
            notify("error", "Failed to send feedback");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', zIndex: 9999 }}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-custom-xl shadow-custom-lg overflow-hidden position-relative w-100 mx-3"
                        style={{ maxWidth: '98%', height: '95vh', maxHeight: 'none' }}
                    >
                        {/* Header */}
                        <div className="p-4 border-bottom d-flex justify-content-between align-items-center bg-light" style={{ height: '80px' }}>
                            <div>
                                <h5 className="fw-bold mb-1">Issue Overview</h5>
                                <span className={`badge rounded-pill ${complaint.complaintStatus === 'Resolved' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                                    {complaint.complaintStatus}
                                </span>
                            </div>
                            <button onClick={onClose} className="btn btn-sm btn-light rounded-circle p-2 hover-bg-danger text-secondary hover-text-white transition-fast">
                                <FaTimes size={18} />
                            </button>
                        </div>

                        <div className="row g-0 overflow-auto" style={{ height: 'calc(95vh - 80px)', maxHeight: 'none' }}>
                            {/* Left: Details */}
                            <div className="col-md-7 p-4 border-end">
                                <h4 className="fw-bold mb-3">{complaint.complaintType}</h4>
                                <p className="text-secondary mb-4">{complaint.complaintDescription}</p>

                                <div className="d-flex align-items-center gap-2 mb-4 text-muted">
                                    <FaMapMarkerAlt className="text-danger" />
                                    <span>{complaint.complaintLocation}</span>
                                </div>

                                {complaint.complaintImage && (
                                    <div className="rounded-custom overflow-hidden mb-4 shadow-sm border">
                                        <img src={complaint.complaintImage} alt="Issue" className="w-100 object-fit-cover" style={{ maxHeight: '300px' }} />
                                    </div>
                                )}

                                {complaint.complaintAIScore > 0 && (
                                    <div className="p-3 bg-primary-subtle rounded-custom border border-primary-subtle d-flex align-items-center gap-3">
                                        <FaRobot className="text-primary" size={24} />
                                        <div>
                                            <h6 className="fw-bold text-dark mb-0">AI Severity Score: {complaint.complaintAIScore}/100</h6>
                                            <small className="text-muted">Automated priority assessment</small>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: Actions & Feedback */}
                            <div className="col-md-5 p-4 bg-surface">
                                <h6 className="fw-bold text-uppercase small text-muted ls-wide mb-4">Resolution Details</h6>

                                {complaint.complaintStatus === 'Resolved' || complaint.complaintStatus === 'Closed' ? (
                                    <>
                                        <div className="mb-4">
                                            <div className="d-flex align-items-center gap-2 text-success mb-2">
                                                <FaCheckCircle />
                                                <span className="fw-bold">Marked Resolved</span>
                                            </div>
                                            <p className="small text-muted mb-0">
                                                By Authority on {new Date(complaint.complaintResolvedDate || complaint.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>

                                        {/* Download Expense Report */}
                                        <div className="mb-5">
                                            <label className="text-uppercase small fw-bold text-muted ls-wide mb-2">Documents</label>
                                            <button
                                                onClick={downloadExpenseReport}
                                                className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2 rounded-pill py-2"
                                            >
                                                <FaFilePdf /> Download Expense Report
                                            </button>
                                        </div>

                                        {/* Feedback Section */}
                                        <div className="mt-4">
                                            <label className="text-uppercase small fw-bold text-muted ls-wide mb-2">Feedback History</label>

                                            {complaint.feedbackHistory && complaint.feedbackHistory.length > 0 ? (
                                                <div className="d-flex flex-column gap-2 mb-3">
                                                    {complaint.feedbackHistory.map((fb, idx) => (
                                                        <div key={idx} className={`p-3 rounded-custom border shadow-sm ${fb.action === 'Accept' ? 'bg-success-subtle' : fb.action === 'Reopen' ? 'bg-warning-subtle' : 'bg-light'}`}>
                                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                                <small className={`fw-bold ${fb.action === 'Accept' ? 'text-success' : fb.action === 'Reopen' ? 'text-warning text-darken' : 'text-dark'}`}>{fb.action} Action</small>
                                                                <small className="text-muted" style={{ fontSize: '0.7rem' }}>{new Date(fb.date).toLocaleString()}</small>
                                                            </div>
                                                            <p className="mb-0 text-dark fst-italic small">"{fb.message}"</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : complaint.feedback && complaint.feedback.message && (
                                                <div className="bg-light p-3 rounded-custom border shadow-sm mb-3">
                                                    <small className="text-muted d-block mb-1">Legacy Feedback:</small>
                                                    <p className="mb-0 text-dark fst-italic small">"{complaint.feedback.message}"</p>
                                                </div>
                                            )}

                                            {isOwner && complaint.complaintStatus === 'Resolved' && !complaint.accepted && (
                                                <div className="p-3 bg-white rounded-custom border shadow-sm">
                                                    <p className="small text-muted mb-2 fw-medium">Review the resolution. You can accept it or reopen if the issue persists.</p>
                                                    <textarea
                                                        className="form-control shadow-none border-secondary-subtle mb-3 text-sm"
                                                        rows="2"
                                                        placeholder="Add an optional comment... (Required if reopening)"
                                                        value={feedbackMsg}
                                                        onChange={(e) => setFeedbackMsg(e.target.value)}
                                                    ></textarea>
                                                    <div className="d-flex gap-2">
                                                        <button
                                                            onClick={() => submitFeedback('Accept')}
                                                            disabled={submitting}
                                                            className="btn btn-success btn-sm w-50 rounded-pill fw-bold"
                                                        >
                                                            {submitting ? 'Processing...' : 'Accept Resolution'}
                                                        </button>
                                                        <button
                                                            onClick={() => submitFeedback('Reopen')}
                                                            disabled={submitting || !feedbackMsg.trim()}
                                                            className="btn btn-warning btn-sm w-50 rounded-pill fw-bold text-dark"
                                                        >
                                                            {submitting ? '...' : 'Reopen Issue'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {complaint.complaintStatus === 'Closed' && (
                                                <div className="text-center p-3 bg-success-subtle rounded-custom border border-success-subtle mt-2">
                                                    <FaCheckCircle className="text-success mb-2" size={24} />
                                                    <h6 className="fw-bold text-success mb-0">Ticket Closed</h6>
                                                    <small className="text-muted">The citizen has accepted the resolution.</small>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaExclamationCircle size={40} className="text-warning mb-3" />
                                        <h6 className="fw-bold text-dark">Pending Resolution</h6>
                                        <p className="text-muted small">Authority is working on this issue. Check back later for reports and feedback options.</p>
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
