import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { initiateSocketConnection, subscribeToAlerts } from '../utils/socketService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import AccessPopup from '../components/AccessPopup';

const DashboardLayout = () => {
    const [alertModal, setAlertModal] = useState(false);
    const [alertData, setAlertData] = useState(null);

    const rawUser = localStorage.getItem('user');
    const user = rawUser ? JSON.parse(rawUser) : null;
    const isCitizen = user?.role?.toLowerCase() === 'citizen';

    useEffect(() => {
        initiateSocketConnection();
        const unsubAlerts = subscribeToAlerts((err, data) => {
            if (data) {
                setAlertData(data);
                setAlertModal(true);
                toast.error(`AGENCY ALERT: ${data.title}`, { theme: "dark" });
            }
        });
        return () => { if (unsubAlerts) unsubAlerts(); };
    }, []);

    return (
        <div className="container-fluid min-vh-100 p-0 position-relative" style={{ backgroundColor: 'var(--bg-body)' }}>
            
            {/* Cyber Grid Base Layer */}
            <div className="position-fixed w-100 h-100" style={{ 
                backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)', 
                backgroundSize: '40px 40px', zIndex: 0 
            }} />

            {!isCitizen && (
                <div className="position-relative z-index-1050">
                    <AccessPopup message="AUTHORITY COMMAND NODE BLOCKED. PLEASE USE AUTHORITY TERMINAL." targetUrl="/authority" />
                </div>
            )}

            <div className="d-flex flex-column min-vh-100 position-relative z-index-1">
                <Sidebar />
                <div className="flex-grow-1 p-0 pb-5 pb-lg-0 w-100 d-flex justify-content-center">
                    <div style={{ maxWidth: '1400px', width: '100%' }}>
                        <Outlet />
                    </div>
                </div>
            </div>

            {/* Tactical Alert Modal Overlay */}
            {alertModal && alertData && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 1050, backgroundColor: 'rgba(9, 9, 11, 0.85)', backdropFilter: 'blur(10px)' }}>
                    <div className="glass-card overflow-hidden position-relative animate__animated animate__zoomIn" style={{ maxWidth: '500px', width: '90%', border: '1px solid var(--accent-red)', boxShadow: '0 0 40px rgba(239, 68, 68, 0.3)' }}>
                        
                        <div className="px-4 pt-4 pb-0 d-flex align-items-center justify-content-between">
                            <span className="tech-font d-flex align-items-center gap-2 text-neon-red fw-bold p-2" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-red)', borderRadius: '4px', letterSpacing: '0.1em' }}>
                                <FaExclamationTriangle className="pulse-animation" /> CRITICAL SYSTEM ALERT
                            </span>
                            <button onClick={() => setAlertModal(false)} className="btn rounded-circle text-white p-0 hover-scale" style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.1)' }}>
                                <FaTimes />
                            </button>
                        </div>

                        <div className="p-4 px-md-5 text-center">
                            {alertData.image && (
                                <div className="mb-4 mx-auto p-1" style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', borderRadius: '8px' }}>
                                    <img src={alertData.image} alt="Alert Intel" className="img-fluid rounded w-100" style={{ height: '200px', objectFit: 'cover', filter: 'brightness(0.9) contrast(1.1)' }} />
                                </div>
                            )}
                            <h4 className="tech-font fw-bold text-white mb-4 text-uppercase tracking-widest">{alertData.title}</h4>

                            <div className="p-3 mb-4 text-start font-monospace" style={{ background: 'rgba(239, 68, 68, 0.05)', borderLeft: '4px solid var(--accent-red)', borderRight: '1px solid rgba(255,255,255,0.1)', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <p className="mb-0 text-white" style={{ whiteSpace: 'pre-line', lineHeight: '1.6', fontSize: '0.85rem' }}>{alertData.content}</p>
                            </div>

                            <button onClick={() => setAlertModal(false)} className="btn w-100 py-3 tech-font fw-bold hover-scale" style={{ background: 'var(--accent-red)', color: 'white', letterSpacing: '0.2em', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                ACKNOWLEDGE DIRECTIVE
                            </button>
                        </div>

                        <div className="p-3 text-center" style={{ background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <small className="tech-font text-muted text-uppercase" style={{ letterSpacing: '0.15em', fontSize: '11px' }}>
                                ISSUED BY: {alertData.role?.toUpperCase() || 'COMMAND'} // {new Date(alertData.createdAt).toLocaleTimeString()}
                            </small>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardLayout;
