import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaHandsHelping, FaCalendarAlt, FaCheckCircle, FaSpinner, FaExclamationTriangle, FaMapMarkerAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ComplaintDetailsModal from '../components/ComplaintDetailsModal';

const Contributions = () => {
    const navigate = useNavigate();
    const [contributions, setContributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedContribution, setSelectedContribution] = useState(null);

    useEffect(() => {
        const fetchContributions = async () => {
            try {
                const response = await api.get('/complaint/my-contributions');
                if (response.data.status === "success") {
                    console.log("Fetched contributions:", response.data.data);
                    setContributions(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching contributions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchContributions();
    }, []);

    // Calculate stats
    const totalContributions = contributions.length;
    const issuesResolved = contributions.filter(c => c.complaintStatus === 'Resolved').length;
    // Simple impact calculation: 10 points per contribution + 20 per resolved
    const impactPoints = (totalContributions * 10) + (issuesResolved * 20);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Resolved': return 'text-success';
            case 'Pending': return 'text-warning';
            case 'Rejected': return 'text-danger';
            default: return 'text-secondary';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Extract title from description if structured as "**Title**\nDescription"
    const getTitle = (desc) => {
        if (!desc) return "Issue Report";
        const match = desc.match(/^\*\*(.*?)\*\*/);
        return match ? match[1] : "Issue Report";
    };

    const getDescription = (desc) => {
        if (!desc) return "No description available.";
        // Remove the title part if it exists
        return desc.replace(/^\*\*(.*?)\*\*\n?/, '').trim();
    };

    const openModal = (contribution) => {
        console.log("Opening modal for:", contribution);
        setSelectedContribution(contribution);
    };

    const closeModal = () => {
        setSelectedContribution(null);
    };

    return (
        <div className="p-4">
            <div className="row justify-content-center">
                <div className="col-lg-10">
                    <h4 className="fw-bold text-dark mb-4">My Contributions</h4>

                    <div className="row g-4">
                        <div className="col-md-4">
                            <div className="bg-white rounded-4 shadow-sm p-4 text-center">
                                <h2 className="fw-bold text-primary mb-0">{totalContributions}</h2>
                                <p className="text-muted small mb-0">Total Contributions</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="bg-white rounded-4 shadow-sm p-4 text-center">
                                <h2 className="fw-bold text-success mb-0">{issuesResolved}</h2>
                                <p className="text-muted small mb-0">Issues Resolved</p>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="bg-white rounded-4 shadow-sm p-4 text-center">
                                <h2 className="fw-bold text-warning mb-0">{impactPoints}</h2>
                                <p className="text-muted small mb-0">Impact Points</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5">
                        <h5 className="fw-bold mb-4 text-secondary">Recent Activity</h5>
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : contributions.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <p>No contributions yet. Start by reporting an issue!</p>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-3">
                                {contributions.map((item, index) => (
                                    <motion.div

                                        key={item._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => openModal(item)}
                                        className="bg-white rounded-4 shadow-sm p-4 d-flex align-items-center justify-content-between hover-bg-light transition-all cursor-pointer"
                                    >
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="rounded-circle p-3 bg-warning-subtle text-warning-emphasis">
                                                <FaExclamationTriangle size={20} />
                                            </div>
                                            <div>
                                                <h6 className="mb-1 fw-bold text-dark">{getTitle(item.complaintDescription)}</h6>
                                                <div className="d-flex align-items-center gap-2 text-muted small">
                                                    <FaCalendarAlt size={12} /> {formatDate(item.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className={`fw-bold small ${getStatusColor(item.complaintStatus)}`}>{item.complaintStatus}</span>
                                            {item.complaintStatus === 'Resolved' ? <FaCheckCircle className="text-success" /> : <FaSpinner className={`fa-spin ${getStatusColor(item.complaintStatus)}`} />}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>


            {/* Contribution Details Modal */}
            <ComplaintDetailsModal
                isOpen={!!selectedContribution}
                onClose={closeModal}
                complaint={selectedContribution}
                onUpdate={() => {
                    const fetchContributions = async () => {
                        try {
                            const response = await api.get('/complaint/my-contributions');
                            if (response.data.status === "success") {
                                const newContributions = response.data.data;
                                setContributions(newContributions);

                                // Update selected contribution if open
                                if (selectedContribution) {
                                    const updated = newContributions.find(c => (c.complaintId === selectedContribution.complaintId || c._id === selectedContribution._id));
                                    if (updated) {
                                        setSelectedContribution(updated);
                                    }
                                }
                            }
                        } catch (error) {
                            console.error("Error fetching contributions:", error);
                        }
                    };
                    fetchContributions();
                }}
            />
        </div>
    );
};

export default Contributions;
