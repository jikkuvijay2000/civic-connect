import React, { useState, useRef, useEffect } from 'react';
import { FaChartLine, FaClipboardList, FaSignOutAlt, FaChevronDown, FaUserCircle, FaUser, FaCog, FaBullhorn, FaBell } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import civicLogo from '../assets/civic_sense_symbolic_logo.png';
import { notify } from '../utils/notify';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

const AuthoritySidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const notifRef = useRef(null);

    const handleNavClick = (path) => {
        navigate(path);
    };

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setUser(storedUser);
        }

        // Socket.io for Emergency Alerts
        const socket = io("http://localhost:3000", {
            withCredentials: true
        });

        socket.on("new_emergency_complaint", (data) => {
            console.log("Emergency Alert:", data);
            setNotifications(prev => [data.notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            toast.error(`NEW EMERGENCY: ${data.complaint.complaintType}`, {
                position: "top-right",
                autoClose: 5000,
                theme: "colored"
            });
        });

        socket.on("authority_notification", (data) => {
            console.log("Authority Notification:", data);
            setNotifications(prev => [{ message: data.message, time: new Date().toISOString() }, ...prev]);
            setUnreadCount(prev => prev + 1);
            toast.info(data.message, {
                position: "top-right",
                autoClose: 5000,
                theme: "colored"
            });
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const isActive = (path) => {
        return location.pathname === path || (path !== '/authority' && location.pathname.startsWith(path));
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef, notifRef]);

    const handleLogout = async () => {
        try {
            localStorage.clear();
            sessionStorage.clear();
            // ... cookie clearing ...
            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
            notify("success", "Logged out successfully");
            navigate('/');
        } catch (error) {
            console.error("Logout error", error);
            notify("error", "Failed to logout");
        }
    };

    const NavItem = ({ icon: Icon, label, path }) => (
        <div
            onClick={() => handleNavClick(path)}
            className={`nav-link-custom d-flex align-items-center gap-3 p-3 mb-2 rounded-custom cursor-pointer transition-all ${isActive(path) ? 'bg-primary-light text-primary fw-bold' : 'hover-bg-light text-secondary'}`}
        >
            <Icon size={20} />
            <span>{label}</span>
            {isActive(path) && <motion.div layoutId="active-nav" className="ms-auto" />}
        </div>
    );

    return (
        <div className="col-lg-2 d-none d-lg-flex flex-column justify-content-between p-4 bg-surface border-end vh-100 sticky-top top-0 shadow-custom-sm z-3">
            <div>
                {/* Logo Area */}
                <div className="d-flex align-items-center justify-content-between mb-5 px-2">
                    <div className="d-flex align-items-center gap-3">
                        <img src={civicLogo} alt="Logo" width="40" className='hover-scale' />
                        <h5 className="fw-bold mb-0" style={{ color: 'var(--primary-color)', letterSpacing: '1px' }}>CIVIC</h5>
                    </div>
                </div>

                {/* Notifications Bell */}
                <div className="mb-4 px-2 position-relative" ref={notifRef}>
                    <div
                        className="d-flex align-items-center gap-2 p-2 rounded-custom cursor-pointer hover-bg-light text-secondary"
                        onClick={() => {
                            setIsNotifOpen(!isNotifOpen);
                            if (!isNotifOpen) setUnreadCount(0); // Mark as read on open
                        }}
                    >
                        <div className="position-relative">
                            <FaBell size={20} />
                            {unreadCount > 0 && (
                                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <span className="fw-bold small">Alerts</span>
                    </div>

                    <AnimatePresence>
                        {isNotifOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="position-absolute top-100 start-0 w-100 mt-2 bg-white rounded-custom shadow-custom-lg border border-light overflow-hidden"
                                style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}
                            >
                                <div className="p-2 border-bottom bg-light">
                                    <h6 className="mb-0 fw-bold small text-uppercase">Notifications</h6>
                                </div>
                                <div>
                                    {notifications.length === 0 ? (
                                        <div className="p-3 text-center text-muted small">No new alerts</div>
                                    ) : (
                                        notifications.map((notif, index) => (
                                            <div key={index} className="p-2 border-bottom hover-bg-light cursor-pointer">
                                                <div className="d-flex align-items-start gap-2">
                                                    <FaBullhorn className="text-danger mt-1 flex-shrink-0" size={12} />
                                                    <div>
                                                        <p className="mb-0 small fw-bold text-dark" style={{ fontSize: '0.8rem', lineHeight: '1.2' }}>{notif.message}</p>
                                                        <small className="text-secondary" style={{ fontSize: '0.7rem' }}>
                                                            {notif.time ? new Date(notif.time).toLocaleTimeString() : 'Just now'}
                                                        </small>
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

                {/* Navigation */}
                <nav className="nav flex-column">
                    <NavItem icon={FaChartLine} label="Dashboard" path="/authority" />
                    <NavItem icon={FaClipboardList} label="Complaints" path="/authority/complaints" />
                    <NavItem icon={FaBullhorn} label="Community Post" path="/authority/community-post" />
                </nav>
            </div>

            {/* Bottom Actions - User Dropdown */}
            <div className="position-relative" ref={dropdownRef}>
                {/* ... existing user dropdown code ... */}
                <div
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`d-flex align-items-center gap-3 p-3 rounded-custom cursor-pointer transition-all ${isDropdownOpen ? 'bg-primary-light' : 'hover-bg-light'}`}
                >
                    <div className="rounded-circle bg-white shadow-sm p-1 d-flex justify-content-center align-items-center" style={{ width: 45, height: 45 }}>
                        <FaUserCircle size={28} className="text-primary-custom" />
                    </div>
                    <div style={{ lineHeight: '1.2' }} className="flex-grow-1">
                        <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.95rem' }}>{user?.userName || 'Authority'}</h6>
                        <small className="text-muted" style={{ fontSize: '0.8rem' }}>{user?.role || 'Admin'}</small>
                    </div>
                    <motion.div animate={{ rotate: isDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <FaChevronDown size={12} className="text-secondary" />
                    </motion.div>
                </div>

                <AnimatePresence>
                    {isDropdownOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="position-absolute bottom-100 start-0 w-100 mb-2 bg-white rounded-custom shadow-custom-lg border border-light overflow-hidden"
                            style={{ zIndex: 1000 }}
                        >
                            <div className="p-2">
                                <button className="btn btn-light w-100 text-start d-flex align-items-center gap-2 p-2 mb-1 rounded-3 hover-bg-light border-0 text-secondary">
                                    <FaUser size={14} /> Profile
                                </button>
                                <button className="btn btn-light w-100 text-start d-flex align-items-center gap-2 p-2 mb-1 rounded-3 hover-bg-light border-0 text-secondary">
                                    <FaCog size={14} /> Settings
                                </button>
                                <div className="border-top my-1"></div>
                                <button
                                    onClick={handleLogout}
                                    className="btn btn-light w-100 text-start d-flex align-items-center gap-2 p-2 rounded-3 hover-bg-danger-subtle text-danger border-0"
                                >
                                    <FaSignOutAlt size={14} /> Logout
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AuthoritySidebar;
