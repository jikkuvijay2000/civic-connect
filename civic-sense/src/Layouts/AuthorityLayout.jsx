import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AuthoritySidebar from '../components/AuthoritySidebar';
import { initiateSocketConnection, subscribeToEmergency } from '../utils/socketService';
import { FaExclamationTriangle, FaTimes, FaMapMarkerAlt } from 'react-icons/fa';

const AuthorityLayout = () => {
    const [emergencyModal, setEmergencyModal] = useState(false);
    const [emergencyData, setEmergencyData] = useState(null);

    useEffect(() => {
        initiateSocketConnection();
        const unsubEmergency = subscribeToEmergency((err, data) => {
            console.log("CRITICAL INCIDENT INTERCEPTED:", data);
            setEmergencyData(data);
            setEmergencyModal(true);
            // Play alert sound (optional)
        });
        return () => { if (unsubEmergency) unsubEmergency(); };
    }, []);

    return (
        <div className="container-fluid min-vh-100 p-0 position-relative" style={{ backgroundColor: 'var(--bg-body)' }}>
            
            {/* Cyber Grid Base Layer */}
            <div className="position-fixed w-100 h-100" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)', backgroundSize: '40px 40px', zIndex: 0 }} />

            <div className="d-flex flex-column min-vh-100 position-relative z-index-1">
                <AuthoritySidebar />
                <div className="flex-grow-1 p-0 pb-5 pb-lg-0 w-100 d-flex justify-content-center">
                    <div style={{ maxWidth: '1400px', width: '100%' }}>
                        <Outlet />
                    </div>
                </div>
            </div>

            {/* Tactical Emergency Modal Override */}
            {emergencyModal && emergencyData && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 9999, backgroundColor: 'rgba(9, 9, 11, 0.9)', backdropFilter: 'blur(10px)' }}>
                    <div className="glass-card shadow-custom-lg overflow-hidden position-relative animate__animated animate__zoomIn" style={{ maxWidth: '500px', width: '90%', border: '2px solid var(--accent-red)', boxShadow: '0 0 50px rgba(239, 68, 68, 0.4)' }}>

                        <div className="px-4 pt-4 pb-0 d-flex align-items-center justify-content-between">
                            <span className="tech-font d-flex align-items-center gap-2 text-white fw-bold p-2 px-3 tracking-widest bg-danger" style={{ borderRadius: '4px', letterSpacing: '0.15em' }}>
                                <FaExclamationTriangle className="pulse-animation" /> CRITICAL EMERGENCY
                            </span>
                            <button onClick={() => setEmergencyModal(false)} className="btn rounded-circle text-white p-0 hover-scale" style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.1)' }}>
                                <FaTimes />
                            </button>
                        </div>

                        <div className="p-4 px-md-5 text-center">
                            {emergencyData.complaint.complaintImage && (
                                <div className="mb-4 mx-auto p-1" style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.8)', borderRadius: '8px' }}>
                                    <img src={emergencyData.complaint.complaintImage} alt="Emergency visual Intel" className="img-fluid rounded w-100" style={{ height: '200px', objectFit: 'cover', filter: 'brightness(0.8) contrast(1.2)' }} />
                                </div>
                            )}

                            <h4 className="tech-font fw-bold text-white mb-2 text-uppercase tracking-widest">{emergencyData.complaint.complaintType}</h4>
                            <p className="tech-font text-neon-red fw-bold mb-4 d-flex align-items-center justify-content-center gap-2" style={{ letterSpacing: '0.1em' }}>
                                <FaMapMarkerAlt /> {emergencyData.complaint.complaintLocation}
                            </p>

                            <div className="p-3 mb-4 text-start font-monospace" style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--accent-red)', borderTop: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <p className="mb-0 text-white" style={{ whiteSpace: 'pre-line', lineHeight: '1.6', fontSize: '0.85rem' }}>{emergencyData.complaint.complaintDescription.replace(/\*\*/g, '')}</p>
                            </div>

                            <button onClick={() => setEmergencyModal(false)} className="btn w-100 py-3 tech-font fw-bold hover-scale" style={{ background: 'var(--accent-red)', color: 'white', letterSpacing: '0.2em', textShadow: '0 2px 4px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.3)' }}>
                                SECURE AND ACKNOWLEDGE
                            </button>
                        </div>

                        <div className="p-3 text-center" style={{ background: 'rgba(0,0,0,0.6)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <small className="tech-font text-muted text-uppercase" style={{ letterSpacing: '0.15em', fontSize: '11px' }}>
                                REPORTED BY CITIZEN NODE // {new Date(emergencyData.complaint.createdAt).toLocaleTimeString()}
                            </small>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthorityLayout;
