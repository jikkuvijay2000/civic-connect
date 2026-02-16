import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AuthoritySidebar from '../components/AuthoritySidebar';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const AuthorityLayout = () => {
    const [emergencyModal, setEmergencyModal] = useState(false);
    const [emergencyData, setEmergencyData] = useState(null);

    useEffect(() => {
        const socket = io("http://localhost:3000");

        socket.on("new_emergency_complaint", (data) => {
            console.log("Emergency Complaint Received:", data);
            setEmergencyData(data);
            setEmergencyModal(true);

            // Play alert sound (optional)
            // const audio = new Audio('/assets/alert.mp3'); 
            // audio.play().catch(e => console.log("Audio play failed", e));
        });

        return () => {
            socket.disconnect();
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
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 9999, backgroundColor: 'rgba(220, 53, 69, 0.9)', backdropFilter: 'blur(5px)' }}>
                    <div className="bg-white rounded-custom-xl shadow-custom-lg overflow-hidden position-relative animate__animated animate__pulse animate__infinite" style={{ maxWidth: '600px', width: '90%', border: '4px solid #dc3545' }}>
                        <div className="bg-danger text-white p-4 d-flex align-items-center justify-content-between">
                            <h2 className="mb-0 fw-bold d-flex align-items-center gap-3">
                                <FaExclamationTriangle className="fs-1 warning-blink" /> EMERGENCY REPORT
                            </h2>
                        </div>
                        <div className="p-5 text-center">
                            {emergencyData.complaint.complaintImage && (
                                <img src={emergencyData.complaint.complaintImage} alt="Emergency" className="img-fluid rounded-4 mb-4 shadow-sm border border-danger" style={{ maxHeight: '250px', objectFit: 'cover' }} />
                            )}
                            <h3 className="fw-bold text-danger mb-2 text-uppercase">{emergencyData.complaint.complaintType}</h3>
                            <h5 className="fw-bold text-dark mb-4">{emergencyData.complaint.complaintLocation}</h5>

                            <div className="bg-light p-3 rounded-3 mb-4 text-start border-start border-4 border-danger">
                                <p className="mb-0 fs-5" style={{ whiteSpace: 'pre-line' }}>{emergencyData.complaint.complaintDescription.replace(/\*\*/g, '')}</p>
                            </div>

                            <div className="d-flex justify-content-center gap-3">
                                <button
                                    onClick={() => setEmergencyModal(false)}
                                    className="btn btn-danger btn-lg px-5 py-3 rounded-pill fw-bold shadow-lg hover-scale"
                                >
                                    ACKNOWLEDGE & CLOSE
                                </button>
                            </div>
                        </div>
                        <div className="bg-dark text-white p-3 text-center">
                            <small className="fw-bold text-uppercase ls-wide">REPORTED BY USER • {new Date(emergencyData.complaint.createdAt).toLocaleTimeString()}</small>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthorityLayout;
