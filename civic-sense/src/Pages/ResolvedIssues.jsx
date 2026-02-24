import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaCheckCircle, FaMapMarkerAlt, FaEye, FaRobot, FaTimes } from 'react-icons/fa';
import api from '../api/axios';
import { notify } from '../utils/notify';
import ComplaintDetailsModal from '../components/ComplaintDetailsModal';

const ResolvedIssues = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchResolvedComplaints = async () => {
            try {
                const response = await api.get('/complaint/resolved');
                if (response.data && response.data.data) {
                    setComplaints(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching resolved complaints:", error);
                notify("error", "Failed to fetch resolved issues");
            } finally {
                setLoading(false);
            }
        };

        fetchResolvedComplaints();
    }, []);

    const filteredComplaints = complaints.filter(c =>
        (c.complaintType?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (c.complaintLocation?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (c.complaintId?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-5 position-relative bg-body min-vh-100">
            <div className="d-flex justify-content-between align-items-end mb-5">
                <div>
                    <h2 className="fw-bold text-dark ls-tight">Resolved Issues</h2>
                    <p className="text-muted">Transparency portal: View civic issues that have been addressed and closed within the community.</p>
                </div>

                <div className="d-flex gap-3">
                    <div className="input-group d-flex align-items-center bg-white rounded-pill border px-3 py-2 shadow-sm" style={{ width: '300px' }}>
                        <FaSearch className="text-muted me-2" />
                        <input
                            type="text"
                            className="form-control border-0 p-0 shadow-none bg-transparent"
                            placeholder="Search by issue, location or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : filteredComplaints.length === 0 ? (
                <div className="text-center py-5 bg-white rounded-custom-xl shadow-sm border">
                    <FaCheckCircle className="text-muted mb-3" size={40} />
                    <h5 className="text-dark fw-bold">No resolved issues found</h5>
                    <p className="text-muted">Currently, there are no issues that have been fully resolved.</p>
                </div>
            ) : (
                <div className="row g-4">
                    {filteredComplaints.map((complaint, index) => (
                        <div className="col-lg-4 col-md-6" key={complaint._id || complaint.complaintId}>
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-custom-xl shadow-custom-sm overflow-hidden border border-light cursor-pointer hover-scale transition-all h-100 d-flex flex-column"
                                onClick={() => setSelectedComplaint(complaint)}
                            >
                                {complaint.complaintImage ? (
                                    <div style={{ height: '200px', overflow: 'hidden' }}>
                                        <img src={complaint.complaintImage} alt={complaint.complaintType} className="w-100 h-100 object-fit-cover" />
                                    </div>
                                ) : (
                                    <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
                                        <FaCheckCircle className="text-success opacity-50" size={60} />
                                    </div>
                                )}

                                <div className="p-4 d-flex flex-column flex-grow-1">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <span className={`badge rounded-pill fw-normal px-2 py-1 ${complaint.complaintStatus === 'Closed' ? 'bg-success text-white' : 'bg-success-subtle text-success'}`}>
                                            {complaint.complaintStatus}
                                        </span>
                                        <small className="text-muted fw-bold">#{complaint.complaintId?.substring(0, 6) || 'N/A'}</small>
                                    </div>
                                    <h5 className="fw-bold text-dark mb-2 text-truncate">{complaint.complaintType}</h5>
                                    <p className="text-muted small mb-3 description-truncate" style={{
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                    }}>
                                        {complaint.complaintDescription?.replace(/\*\*(.*?)\*\*\n?/, '').trim() || "No description provided."}
                                    </p>

                                    <div className="mt-auto pt-3 border-top">
                                        <div className="d-flex align-items-center gap-2 text-muted small mb-2">
                                            <FaMapMarkerAlt className="text-danger" />
                                            <span className="text-truncate">{complaint.complaintLocation}</span>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center text-muted small">
                                            <span>Resolved: {new Date(complaint.complaintResolvedDate || complaint.updatedAt).toLocaleDateString()}</span>
                                            <button className="btn btn-sm btn-light rounded-circle p-2 text-primary hover-bg-primary-subtle">
                                                <FaEye />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reusing existing Complaint Details Modal */}
            <ComplaintDetailsModal
                isOpen={!!selectedComplaint}
                onClose={() => setSelectedComplaint(null)}
                complaint={selectedComplaint}
            />
        </div>
    );
};

export default ResolvedIssues;
