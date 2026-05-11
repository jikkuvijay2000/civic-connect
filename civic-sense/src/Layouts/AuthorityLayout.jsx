import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AuthoritySidebar from '../components/AuthoritySidebar';
import { initiateSocketConnection, subscribeToEmergency } from '../utils/socketService';
import { toast } from 'react-toastify';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const AuthorityLayout = () => {
    const [emergencyModal, setEmergencyModal] = useState(false);
    const [emergencyData, setEmergencyData] = useState(null);

    useEffect(() => {
        initiateSocketConnection();

        const unsubEmergency = subscribeToEmergency((err, data) => {
            console.log("Emergency Complaint Received:", data);
            setEmergencyData(data);
            setEmergencyModal(true);

            // Play alert sound (optional)
            // const audio = new Audio('/assets/alert.mp3'); 
            // audio.play().catch(e => console.log("Audio play failed", e));
        });

        return () => {
            if (unsubEmergency) unsubEmergency();
        };
    }, []);

    return (
        <div className="container-fluid min-vh-100 bg-light position-relative">
            <div className="row">
                <AuthoritySidebar />{/* Sidebar handles its own local state/navigation */}
                <div className="col-lg-10 col-md-12 p-0">
                    <Outlet />
                </div>
            </div>

            {/* Persistent Emergency Modal */}
            {emergencyModal && emergencyData && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 9999, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)' }}>
                    <div className="bg-white rounded-4 overflow-hidden position-relative animate__animated animate__zoomIn" style={{ maxWidth: '500px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)', borderLeft: '6px solid #ef4444' }}>

                        <div className="px-4 pt-4 pb-0 d-flex align-items-center justify-content-between">
                            <span className="badge bg-danger-subtle text-danger rounded-pill px-3 py-2 d-flex align-items-center gap-2 border border-danger-subtle fw-bold" style={{ letterSpacing: '0.5px' }}>
                                <FaExclamationTriangle /> EMERGENCY ALERT
                            </span>
                            <button onClick={() => setEmergencyModal(false)} className="btn btn-sm btn-light rounded-circle p-2 d-flex align-items-center justify-content-center text-secondary hover-scale transition-fast" style={{ width: '32px', height: '32px' }}>
                                <FaTimes />
                            </button>
                        </div>

                        <div className="p-4 px-md-5 text-center">
                            {emergencyData.complaint.complaintImage && (
                                <div className="mb-4 mx-auto border rounded-4 p-1 shadow-sm" style={{ maxWidth: '350px', backgroundColor: '#f8fafc' }}>
                                    <img src={emergencyData.complaint.complaintImage} alt="Emergency" className="img-fluid rounded-3 w-100" style={{ height: '200px', objectFit: 'cover' }} />
                                </div>
                            )}

                            <h4 className="fw-bolder text-dark mb-2">{emergencyData.complaint.complaintType}</h4>
                            <p className="text-muted small fw-medium mb-4 d-flex align-items-center justify-content-center gap-1">
                                <i className="bi bi-geo-alt-fill text-danger"></i> {emergencyData.complaint.complaintLocation}
                            </p>

                            <div className="bg-light p-3 rounded-4 mb-4 text-start border shadow-sm">
                                <p className="mb-0 text-secondary" style={{ whiteSpace: 'pre-line', lineHeight: '1.6', fontSize: '0.95rem' }}>{emergencyData.complaint.complaintDescription.replace(/\*\*/g, '')}</p>
                            </div>

                            <button
                                onClick={() => setEmergencyModal(false)}
                                className="btn btn-danger w-100 py-3 rounded-pill fw-bold hover-scale shadow-sm"
                            >
                                Acknowledge & Secure
                            </button>
                        </div>

                        <div className="bg-light p-3 text-center border-top">
                            <small className="text-secondary fw-semibold text-uppercase" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>
                                Reported by Citizen • {new Date(emergencyData.complaint.createdAt).toLocaleTimeString()}
                            </small>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthorityLayout;
