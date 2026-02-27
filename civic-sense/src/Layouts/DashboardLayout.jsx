import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
// import Chatbot from '../components/Chatbot'; // HIDDEN: Chat feature deferred
import { initiateSocketConnection, subscribeToAlerts } from '../utils/socketService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const DashboardLayout = () => {
    const [alertModal, setAlertModal] = useState(false);
    const [alertData, setAlertData] = useState(null);

    useEffect(() => {
        initiateSocketConnection();

        const unsubAlerts = subscribeToAlerts((err, data) => {
            if (data) {
                console.log("New Alert Received:", data);
                setAlertData(data);
                setAlertModal(true);
                toast.error(`AGENCY ALERT: ${data.title}`, {
                    position: "top-center",
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "colored",
                });
            }
        });

        return () => {
            if (unsubAlerts) unsubAlerts();
        };
    }, []);

    return (
        <div className="container-fluid min-vh-100 bg-light position-relative">
            <div className="row">
                <Sidebar />
                <div className="col-lg-10 col-md-12 p-0">
                    <Outlet />
                </div>
            </div>

            {/* Alert Modal Overlay */}
            {alertModal && alertData && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 1050, backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)' }}>
                    <div className="bg-white rounded-4 overflow-hidden position-relative animate__animated animate__zoomIn" style={{ maxWidth: '500px', width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)', borderLeft: '6px solid #ef4444' }}>

                        <div className="px-4 pt-4 pb-0 d-flex align-items-center justify-content-between">
                            <span className="badge bg-danger-subtle text-danger rounded-pill px-3 py-2 d-flex align-items-center gap-2 border border-danger-subtle fw-bold" style={{ letterSpacing: '0.5px' }}>
                                <FaExclamationTriangle /> EMERGENCY ALERT
                            </span>
                            <button onClick={() => setAlertModal(false)} className="btn btn-sm btn-light rounded-circle p-2 d-flex align-items-center justify-content-center text-secondary hover-scale transition-fast" style={{ width: '32px', height: '32px' }}>
                                <FaTimes />
                            </button>
                        </div>

                        <div className="p-4 px-md-5 text-center">
                            {alertData.image && (
                                <div className="mb-4 mx-auto border rounded-4 p-1 shadow-sm" style={{ maxWidth: '350px', backgroundColor: '#f8fafc' }}>
                                    <img src={alertData.image} alt="Alert" className="img-fluid rounded-3 w-100" style={{ height: '200px', objectFit: 'cover' }} />
                                </div>
                            )}
                            <h4 className="fw-bolder text-dark mb-4">{alertData.title}</h4>

                            <div className="bg-light p-3 rounded-4 mb-4 text-start border shadow-sm">
                                <p className="mb-0 text-secondary" style={{ whiteSpace: 'pre-line', lineHeight: '1.6', fontSize: '0.95rem' }}>{alertData.content}</p>
                            </div>

                            <button
                                onClick={() => setAlertModal(false)}
                                className="btn btn-danger w-100 py-3 rounded-pill fw-bold hover-scale shadow-sm"
                            >
                                Acknowledge Alert
                            </button>
                        </div>

                        <div className="bg-light p-3 text-center border-top">
                            <small className="text-secondary fw-semibold text-uppercase" style={{ letterSpacing: '0.5px', fontSize: '11px' }}>
                                ISSUED BY {alertData.role?.toUpperCase() || 'AUTHORITY'} • {new Date(alertData.createdAt).toLocaleTimeString()}
                            </small>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Chatbot Widget — Hidden (feature deferred) */}
            {/* <Chatbot /> */}
        </div>
    );
};

export default DashboardLayout;
