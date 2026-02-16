import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const DashboardLayout = () => {
    const [alertModal, setAlertModal] = useState(false);
    const [alertData, setAlertData] = useState(null);

    useEffect(() => {
        // Connect to the backend Socket.io server
        const socket = io("http://localhost:3000"); // Ensure this matches your backend URL

        socket.on("connect", () => {
            console.log("Connected to Socket.io server");
        });

        socket.on("new_alert", (data) => {
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
        });

        return () => {
            socket.disconnect();
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
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)' }}>
                    <div className="bg-white rounded-custom-xl shadow-custom-lg overflow-hidden position-relative" style={{ maxWidth: '500px', width: '90%', animation: 'slideInDown 0.4s ease-out' }}>
                        <div className="bg-danger text-white p-4 d-flex align-items-center justify-content-between">
                            <h4 className="mb-0 fw-bold d-flex align-items-center gap-2">
                                <FaExclamationTriangle className="fs-3" /> EMERGENCY ALERT
                            </h4>
                            <button onClick={() => setAlertModal(false)} className="btn btn-link text-white p-0 fs-4 hover-rotate transition-fast">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-5 text-center">
                            {alertData.image && (
                                <img src={alertData.image} alt="Alert" className="img-fluid rounded-4 mb-4 shadow-sm" style={{ maxHeight: '200px', objectFit: 'cover' }} />
                            )}
                            <h3 className="fw-bold text-dark mb-3">{alertData.title}</h3>
                            <p className="text-secondary mb-4 fs-5" style={{ lineHeight: '1.6' }}>
                                {alertData.content}
                            </p>
                            <div className="d-flex justify-content-center gap-3">
                                <button onClick={() => setAlertModal(false)} className="btn btn-danger px-5 py-2 rounded-pill fw-bold shadow-sm hover-scale transition-fast">
                                    Acknowledge
                                </button>
                            </div>
                        </div>
                        <div className="bg-light p-3 text-center border-top">
                            <small className="text-muted fw-bold text-uppercase ls-wide">Issued by {alertData.role} • {new Date(alertData.createdAt).toLocaleTimeString()}</small>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardLayout;
