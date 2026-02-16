import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaExclamationCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const NotificationDropdown = ({ notifications, unreadCount, onMarkRead, isOpen, toggleDropdown }) => {

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <FaCheckCircle className="text-success" />;
            case 'warning': return <FaExclamationTriangle className="text-warning" />;
            case 'error': return <FaExclamationCircle className="text-danger" />;
            default: return <FaInfoCircle className="text-primary" />;
        }
    };

    return (
        <div className="position-relative">
            <div
                className="position-relative cursor-pointer hover-scale p-2 bg-white rounded-circle shadow-sm"
                onClick={toggleDropdown}
            >
                <FaBell size={20} className="text-secondary" />
                {unreadCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                        <span className="visually-hidden">New alerts</span>
                        <span className="badge badge-pill badge-danger" style={{ fontSize: '0.6rem', position: 'absolute', top: '-5px', right: '-5px' }}>{unreadCount}</span>
                    </span>
                )}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="position-absolute end-0 mt-3 bg-white rounded-custom shadow-lg border border-light overflow-hidden z-3"
                        style={{ width: '320px', maxHeight: '400px', overflowY: 'auto' }}
                    >
                        <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-gray-50 sticky-top top-0">
                            <h6 className="fw-bold mb-0 text-dark">Notifications</h6>
                            {unreadCount > 0 && <span className="badge bg-primary-subtle text-primary rounded-pill">{unreadCount} new</span>}
                        </div>

                        <div className="list-group list-group-flush">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-muted">
                                    <small>No notifications yet</small>
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <div
                                        key={notif._id}
                                        className={`list-group-item list-group-item-action p-3 border-bottom-0 border-top ${!notif.isRead ? 'bg-blue-50' : ''}`}
                                        onClick={() => onMarkRead(notif._id)}
                                    >
                                        <div className="d-flex gap-3">
                                            <div className="mt-1">
                                                {getIcon(notif.type)}
                                            </div>
                                            <div>
                                                <p className="mb-1 small text-dark">{notif.message}</p>
                                                <small className="text-muted extra-small">{new Date(notif.createdAt).toLocaleString()}</small>
                                                {notif.link && (
                                                    <Link to={notif.link} className="d-block small text-primary mt-1 text-decoration-none hover-underline">
                                                        View Details
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationDropdown;
