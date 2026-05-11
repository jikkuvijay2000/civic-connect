import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AuthoritySidebar from '../components/AuthoritySidebar';
import { initiateSocketConnection, subscribeToEmergency } from '../utils/socketService';
import { FaExclamationTriangle, FaTimes, FaMapMarkerAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const AuthorityLayout = () => {
    const [emergencyModal, setEmergencyModal] = useState(false);
    const [emergencyData, setEmergencyData] = useState(null);

    useEffect(() => {
        initiateSocketConnection();

        const unsubEmergency = subscribeToEmergency((err, data) => {
            console.log('High/Emergency Complaint Received:', data);
            if (data && data.complaint) {
                setEmergencyData(data);
                setEmergencyModal(true);
            }
        });

        return () => {
            if (unsubEmergency) unsubEmergency();
        };
    }, []);

    const complaint = emergencyData?.complaint;
    const isEmergency = complaint?.complaintPriority === 'Emergency';
    const accentColor = isEmergency ? '#dc2626' : '#ea580c';

    return (
        <div className="container-fluid min-vh-100 bg-light position-relative">
            <div className="row">
                <AuthoritySidebar />
                <div className="col-lg-10 col-md-12 p-0">
                    <Outlet />
                </div>
            </div>

            {/* ── High Priority / Emergency Popup ── */}
            <AnimatePresence>
                {emergencyModal && complaint && (
                    <motion.div
                        key="emergency-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                        style={{ zIndex: 9999, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)' }}
                    >
                        <motion.div
                            key="emergency-card"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            className="bg-white rounded-4 overflow-hidden"
                            style={{
                                maxWidth: '500px',
                                width: '90%',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)',
                                borderLeft: `6px solid ${accentColor}`,
                            }}
                        >
                            {/* Header */}
                            <div className="px-4 pt-4 pb-0 d-flex align-items-center justify-content-between">
                                <motion.span
                                    animate={{ opacity: [1, 0.55, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.4 }}
                                    className="badge rounded-pill px-3 py-2 d-flex align-items-center gap-2 fw-bold"
                                    style={{
                                        letterSpacing: '0.5px',
                                        background: isEmergency ? '#fef2f2' : '#fff7ed',
                                        color: isEmergency ? '#b91c1c' : '#c2410c',
                                        border: `1px solid ${isEmergency ? '#fca5a5' : '#fed7aa'}`,
                                    }}
                                >
                                    <FaExclamationTriangle />
                                    {isEmergency ? '🚨 EMERGENCY ALERT' : '⚠️ HIGH PRIORITY COMPLAINT'}
                                </motion.span>

                                <button
                                    onClick={() => setEmergencyModal(false)}
                                    className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center"
                                    style={{ width: '32px', height: '32px', flexShrink: 0 }}
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-4 px-md-5 text-center">
                                {complaint.complaintImage && (
                                    <div
                                        className="mb-4 mx-auto border rounded-4 p-1 shadow-sm"
                                        style={{ maxWidth: '350px', backgroundColor: '#f8fafc' }}
                                    >
                                        <img
                                            src={complaint.complaintImage}
                                            alt="Complaint Evidence"
                                            className="img-fluid rounded-3 w-100"
                                            style={{ height: '200px', objectFit: 'cover' }}
                                        />
                                    </div>
                                )}

                                <h4 className="fw-bolder text-dark mb-2">
                                    {complaint.complaintType || 'Civic Complaint'}
                                </h4>

                                {complaint.complaintLocation && (
                                    <p className="text-muted small fw-medium mb-4 d-flex align-items-center justify-content-center gap-1">
                                        <FaMapMarkerAlt style={{ color: accentColor }} />
                                        {complaint.complaintLocation}
                                    </p>
                                )}

                                <div className="bg-light p-3 rounded-4 mb-4 text-start border shadow-sm">
                                    <p
                                        className="mb-0 text-secondary"
                                        style={{ whiteSpace: 'pre-line', lineHeight: '1.7', fontSize: '0.92rem' }}
                                    >
                                        {(complaint.complaintDescription || '').replace(/\*\*/g, '')}
                                    </p>
                                </div>

                                <button
                                    onClick={() => setEmergencyModal(false)}
                                    className="btn w-100 py-3 rounded-pill fw-bold shadow-sm"
                                    style={{
                                        background: accentColor,
                                        color: 'white',
                                        border: 'none',
                                        fontSize: '0.95rem',
                                    }}
                                >
                                    {isEmergency ? '🔒 Acknowledge & Secure' : '✓ Acknowledge Complaint'}
                                </button>
                            </div>

                            {/* Footer */}
                            <div className="bg-light p-3 text-center border-top">
                                <small
                                    className="text-secondary fw-semibold text-uppercase"
                                    style={{ letterSpacing: '0.5px', fontSize: '11px' }}
                                >
                                    Reported by Citizen
                                    {complaint.createdAt
                                        ? ` • ${new Date(complaint.createdAt).toLocaleTimeString()}`
                                        : ''}
                                    {' '}• Priority: {complaint.complaintPriority}
                                </small>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AuthorityLayout;
