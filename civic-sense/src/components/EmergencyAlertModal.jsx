import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

const EmergencyAlertModal = ({ isOpen, onClose, alertData }) => {
    if (!isOpen || !alertData) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999 }}>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="bg-white rounded-custom-xl shadow-custom-lg overflow-hidden position-relative"
                        style={{ maxWidth: '800px', width: '90%' }}
                    >
                        <div className="bg-danger text-white p-4 text-center">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                <FaExclamationTriangle size={50} className="mb-2" />
                            </motion.div>
                            <h3 className="fw-bold mb-0">EMERGENCY ALERT</h3>
                        </div>

                        <div className="p-4 text-center">
                            <h4 className="fw-bold text-dark mb-3">{alertData.title}</h4>
                            <p className="text-secondary mb-4" style={{ fontSize: '1.1rem' }}>{alertData.content}</p>

                            {alertData.image && (
                                <div className="rounded-custom overflow-hidden mb-4 shadow-sm">
                                    <img src={alertData.image} alt="Alert" className="w-100 object-fit-cover" style={{ maxHeight: '400px' }} />
                                </div>
                            )}

                            <div className="d-flex justify-content-between align-items-center text-muted small mb-4">
                                <span>From: <span className="fw-bold text-dark">{alertData.author}</span></span>
                                <span>{new Date(alertData.createdAt).toLocaleTimeString()}</span>
                            </div>

                            <button onClick={onClose} className="btn btn-danger w-100 py-3 rounded-pill fw-bold text-uppercase ls-wide shadow-sm hover-scale">
                                Acknowledge
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default EmergencyAlertModal;
