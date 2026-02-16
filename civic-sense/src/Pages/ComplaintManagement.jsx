import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSortAmountDown, FaSearch, FaFilter, FaEye, FaRobot, FaTimes, FaMapMarkerAlt, FaUser } from 'react-icons/fa';
import api from '../api/axios';
import { notify } from '../utils/notify';

const ComplaintManagement = () => {
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [sortBy, setSortBy] = useState('newest');
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                const response = await api.get('/complaint/authority-complaints');
                setComplaints(response.data.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching complaints:", error);
                notify("error", "Failed to fetch complaints");
                setLoading(false);
            }
        };

        fetchComplaints();
    }, []);

    // AI Score Calculation Logic
    // AI Score calculation removed - now using backend value

    // Helper to map backend fields to UI
    const mapComplaint = (c) => {
        const mapped = {
            id: c.complaintId || c._id, // Fallback
            title: c.complaintDescription.split('\n')[0].replace(/\*\*/g, '') || "Complaint", // Extract title from "Title\nDesc"
            description: c.complaintDescription.replace(/\*\*/g, ''),
            location: c.complaintLocation,
            status: c.complaintStatus,
            priority: c.complaintPriority,
            date: new Date(c.createdAt).toLocaleDateString(),
            reporter: c.complaintUser?.userName || "Anonymous",
            category: c.complaintType,
            image: c.complaintImage,
            emergencyScore: c.emergencyScore, // pass through if it exists
            aiScore: c.complaintAIScore ? Math.round(c.complaintAIScore) : 0, // Use backend score
            adminNotes: c.complaintNotes || "",
            expenses: c.expenses || [],
            feedback: c.feedback || null
        };

        return mapped;
    };

    const processedComplaints = complaints.map(mapComplaint);

    // Simulate AI Sorting
    const sortedComplaints = [...processedComplaints].sort((a, b) => {
        if (sortBy === 'ai_priority') {
            return b.aiScore - a.aiScore; // Higher score first
        }
        return new Date(b.date) - new Date(a.date); // Default Newest
    });

    if (loading) return <div className="text-center p-5">Loading complaints...</div>;

    return (
        <div className="p-5 position-relative">
            <div className="d-flex justify-content-between align-items-end mb-5">
                <div>
                    <h2 className="fw-bold text-dark ls-tight">Complaint Management</h2>
                    <p className="text-muted">Review and manage citizen complaints efficiently.</p>
                </div>

                <div className="d-flex gap-3">
                    <button
                        className={`btn d-flex align-items-center gap-2 rounded-pill px-4 ${sortBy === 'ai_priority' ? 'btn-primary shadow-custom-sm' : 'btn-white border'}`}
                        onClick={() => setSortBy(sortBy === 'ai_priority' ? 'newest' : 'ai_priority')}
                    >
                        <FaRobot size={18} />
                        <span className="fw-medium">{sortBy === 'ai_priority' ? 'AI Sorted: Critical First' : 'Sort: AI Priority'}</span>
                    </button>
                    <div className="input-group d-flex align-items-center bg-white rounded-pill border px-3 py-2 shadow-sm" style={{ width: '250px' }}>
                        <FaSearch className="text-muted me-2" />
                        <input type="text" className="form-control border-0 p-0 shadow-none bg-transparent" placeholder="Search ID..." />
                    </div>
                </div>
            </div>

            {/* Complaint List */}
            <div className="bg-surface rounded-custom-xl shadow-custom-sm border border-light overflow-hidden">
                <div className="table-responsive">
                    <table className="table table-hover mb-0 align-middle">
                        <thead className="bg-light">
                            <tr>
                                <th className="py-3 px-4 border-bottom-0 text-secondary text-uppercase small fw-bold ls-wide">ID</th>
                                <th className="py-3 px-4 border-bottom-0 text-secondary text-uppercase small fw-bold ls-wide">Issue</th>
                                <th className="py-3 px-4 border-bottom-0 text-secondary text-uppercase small fw-bold ls-wide">Category</th>
                                <th className="py-3 px-4 border-bottom-0 text-secondary text-uppercase small fw-bold ls-wide">Status</th>
                                <th className="py-3 px-4 border-bottom-0 text-secondary text-uppercase small fw-bold ls-wide">AI Score</th>
                                <th className="py-3 px-4 border-bottom-0 text-secondary text-uppercase small fw-bold ls-wide text-end">Date</th>
                                <th className="py-3 px-4 border-bottom-0 text-secondary text-uppercase small fw-bold ls-wide text-end">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedComplaints.map((complaint) => (
                                <motion.tr
                                    key={complaint.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setSelectedComplaint(complaint)}
                                >
                                    <td className="px-4 fw-medium text-dark">{complaint.id}</td>
                                    <td className="px-4">
                                        <div className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                                            {complaint.title}
                                            {complaint.feedback && complaint.feedback.message && (
                                                <span className="badge bg-danger rounded-circle p-1" style={{ width: '8px', height: '8px', padding: 0 }} title="New Feedback"></span>
                                            )}
                                        </div>
                                        <small className="text-muted d-block text-truncate" style={{ maxWidth: '200px' }}>{complaint.description}</small>
                                    </td>
                                    <td className="px-4"><span className="badge bg-light text-secondary rounded-pill fw-normal border">{complaint.category}</span></td>
                                    <td className="px-4">
                                        <span className={`badge rounded-pill fw-normal px-3 py-2 ${complaint.status === 'Resolved' ? 'bg-success-subtle text-success' :
                                            complaint.status === 'Pending' ? 'bg-warning-subtle text-warning' :
                                                'bg-primary-subtle text-primary'
                                            }`}>
                                            {complaint.status}
                                        </span>
                                    </td>
                                    <td className="px-4">
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="progress flex-grow-1" style={{ height: '6px', width: '60px' }}>
                                                <div
                                                    className={`progress-bar rounded-pill ${complaint.aiScore > 80 ? 'bg-danger' :
                                                        complaint.aiScore > 50 ? 'bg-warning' : 'bg-success'
                                                        }`}
                                                    role="progressbar"
                                                    style={{ width: `${complaint.aiScore}%` }}
                                                ></div>
                                            </div>
                                            <span className="small fw-bold">{complaint.aiScore}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 text-end text-muted small">{complaint.date}</td>
                                    <td className="px-4 text-end">
                                        <button className="btn btn-sm btn-light rounded-circle p-2 text-primary hover-scale">
                                            <FaEye />
                                        </button>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {selectedComplaint && (
                    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50" style={{ zIndex: 9999 }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white rounded-custom-xl shadow-custom-lg overflow-hidden position-relative w-100 mx-3"
                            style={{ maxWidth: '98%', height: '95vh', maxHeight: 'none' }}
                        >
                            <div className="p-4 border-bottom d-flex justify-content-between align-items-center bg-light" style={{ height: '80px' }}>
                                <h5 className="fw-bold mb-0">Complaint Details</h5>
                                <button onClick={() => setSelectedComplaint(null)} className="btn btn-sm btn-light rounded-circle p-2 hover-bg-danger text-secondary hover-text-white transition-fast">
                                    <FaTimes size={16} />
                                </button>
                            </div>

                            <div className="row g-0 overflow-auto" style={{ height: 'calc(95vh - 80px)', maxHeight: 'none' }}>
                                <div className="col-md-7 p-4 border-end">
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                        <span className={`badge rounded-pill ${selectedComplaint.priority === 'Critical' || selectedComplaint.priority === 'High' ? 'bg-danger-subtle text-danger' : 'bg-info-subtle text-info'
                                            }`}>{selectedComplaint.priority} Priority</span>
                                        <span className="text-muted small">#{selectedComplaint.id}</span>
                                    </div>

                                    <h4 className="fw-bold mb-3">{selectedComplaint.title}</h4>
                                    <p className="text-secondary lead mb-4" style={{ fontSize: '1rem' }}>{selectedComplaint.description}</p>

                                    <div className="d-flex align-items-center gap-3 text-muted mb-4 p-3 bg-light rounded-custom">
                                        <FaMapMarkerAlt className="text-danger" />
                                        <span>{selectedComplaint.location}</span>
                                    </div>

                                    {selectedComplaint.image && (
                                        <div className="rounded-custom overflow-hidden mb-4 border shadow-sm">
                                            <img src={selectedComplaint.image} alt="Evidence" className="w-100 object-fit-cover" style={{ height: '300px' }} />
                                        </div>
                                    )}

                                    <h6 className="fw-bold text-uppercase small text-muted ls-wide mb-3">AI Analysis</h6>
                                    <div className="p-3 bg-primary-light rounded-custom border border-primary-subtle mb-4">
                                        <div className="d-flex gap-2 align-items-center mb-2">
                                            <FaRobot className="text-primary" />
                                            <span className="fw-bold text-primary-dark">Severity Score: {selectedComplaint.aiScore}/100</span>
                                        </div>
                                        <p className="small mb-0 text-muted">AI has flagged this as a <strong>{selectedComplaint.priority}</strong> priority issue based on keywords and location density.</p>
                                    </div>

                                </div>
                                <div className="col-md-5 bg-surface p-4">
                                    <div className="mb-4">
                                        <label className="text-uppercase small fw-bold text-muted ls-wide mb-2">Reporter</label>
                                        <div className="d-flex align-items-center gap-3 p-3 bg-white rounded-custom border shadow-sm">
                                            <div className="rounded-circle bg-secondary-subtle text-secondary p-2 d-flex justify-content-center align-items-center">
                                                <FaUser />
                                            </div>
                                            <div>
                                                <h6 className="mb-0 fw-bold">{selectedComplaint.reporter}</h6>
                                                <small className="text-muted">Citizen</small>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="text-uppercase small fw-bold text-muted ls-wide mb-2">Update Status</label>
                                        <select
                                            className="form-select shadow-none border-secondary-subtle focus-ring-primary rounded-3 text-dark fw-medium"
                                            value={selectedComplaint.status}
                                            onChange={(e) => setSelectedComplaint({ ...selectedComplaint, status: e.target.value })}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Resolved">Resolved</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <label className="text-uppercase small fw-bold text-muted ls-wide mb-2">Admin Notes</label>
                                        <textarea
                                            className="form-control shadow-none border-secondary-subtle focus-ring-primary rounded-3"
                                            rows="4"
                                            placeholder="Add internal notes..."
                                            value={selectedComplaint.adminNotes}
                                            onChange={(e) => setSelectedComplaint({ ...selectedComplaint, adminNotes: e.target.value })}
                                        ></textarea>
                                    </div>

                                    {selectedComplaint.status === 'Resolved' && (
                                        <div className="mb-4">
                                            <label className="text-uppercase small fw-bold text-muted ls-wide mb-2">Expense Report</label>
                                            <div className="bg-light p-3 rounded-custom border">
                                                {(!selectedComplaint.expenses || selectedComplaint.expenses.length === 0) && (
                                                    <p className="small text-muted mb-2">Add expenses incurred for this resolution.</p>
                                                )}

                                                {(selectedComplaint.expenses || []).map((exp, idx) => (
                                                    <div key={idx} className="d-flex justify-content-between align-items-center mb-2 small">
                                                        <span>{exp.item}</span>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className="fw-bold">₹{exp.cost}</span>
                                                            <button
                                                                onClick={() => {
                                                                    const newExpenses = selectedComplaint.expenses.filter((_, i) => i !== idx);
                                                                    setSelectedComplaint({ ...selectedComplaint, expenses: newExpenses });
                                                                }}
                                                                className="btn btn-xs btn-outline-danger p-0 border-0"
                                                            >
                                                                <FaTimes />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}

                                                <div className="d-flex gap-2 mt-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Item"
                                                        className="form-control form-control-sm"
                                                        id="expense-item"
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="Cost"
                                                        className="form-control form-control-sm"
                                                        style={{ width: '80px' }}
                                                        id="expense-cost"
                                                    />
                                                    <button
                                                        className="btn btn-sm btn-dark"
                                                        onClick={() => {
                                                            const itemInput = document.getElementById('expense-item');
                                                            const costInput = document.getElementById('expense-cost');
                                                            if (itemInput.value && costInput.value) {
                                                                const newExpense = { item: itemInput.value, cost: parseFloat(costInput.value) };
                                                                setSelectedComplaint({
                                                                    ...selectedComplaint,
                                                                    expenses: [...(selectedComplaint.expenses || []), newExpense]
                                                                });
                                                                itemInput.value = '';
                                                                costInput.value = '';
                                                            }
                                                        }}
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* User Feedback Display */}
                                    {selectedComplaint.feedback && selectedComplaint.feedback.message && (
                                        <div className="mb-4">
                                            <label className="text-uppercase small fw-bold text-danger ls-wide mb-2">User Feedback</label>
                                            <div className="bg-danger-subtle p-3 rounded-custom border border-danger-subtle">
                                                <p className="small text-dark mb-1 fw-bold">"{selectedComplaint.feedback.message}"</p>
                                                <small className="text-muted d-block">{new Date(selectedComplaint.feedback.date).toLocaleString()}</small>
                                            </div>
                                        </div>
                                    )}

                                    <div className="d-grid">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const payload = {
                                                        status: selectedComplaint.status,
                                                        notes: selectedComplaint.adminNotes
                                                    };

                                                    if (selectedComplaint.status === 'Resolved') {
                                                        payload.expenses = selectedComplaint.expenses || [];
                                                    }

                                                    await api.put(`/complaint/update-status/${selectedComplaint.id}`, payload);
                                                    notify("success", "Ticket updated successfully");
                                                    // Refresh list
                                                    const updatedComplaints = complaints.map(c =>
                                                        (c._id === selectedComplaint.id || c.complaintId === selectedComplaint.id) ? {
                                                            ...c,
                                                            complaintStatus: selectedComplaint.status,
                                                            complaintNotes: selectedComplaint.adminNotes,
                                                            expenses: payload.expenses, // update local state
                                                            feedback: c.feedback // keep feedback
                                                        } : c
                                                    );
                                                    setComplaints(updatedComplaints);
                                                    setSelectedComplaint(null);
                                                } catch (error) {
                                                    notify("error", "Failed to update ticket");
                                                }
                                            }}
                                            className="btn btn-primary rounded-pill py-2 shadow-custom-sm hover-scale"
                                        >
                                            Update Ticket
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ComplaintManagement;
