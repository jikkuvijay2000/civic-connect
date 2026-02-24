import React, { useState, useRef, useEffect } from 'react';
import { FaHome, FaExclamationTriangle, FaHandsHelping, FaCheckDouble, FaTrophy, FaUserCircle, FaSignOutAlt, FaChevronUp, FaUser, FaChevronDown } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import civicLogo from '../assets/civic_sense_symbolic_logo.png';
import { notify } from '../utils/notify';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [user, setUser] = useState(null);
    const dropdownRef = useRef(null);

    const handleNavClick = (path) => {
        navigate(path);
    };

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        console.log("Sidebar Debug - Stored User:", storedUser); // Debug log
        if (storedUser) {
            setUser(storedUser);
            console.log("Sidebar Debug - State User set:", storedUser); // Debug log
        } else {
            console.log("Sidebar Debug - No user found, redirecting"); // Debug log
            navigate('/');
        }
    }, [navigate]);

    const isActive = (path) => {
        return location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const handleLogout = async () => {
        try {
            // Clear any local storage/cookies
            localStorage.clear();
            sessionStorage.clear();
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
            className={`nav-link-custom d-flex align-items-center gap-3 p-3 mb-2 cursor-pointer ${isActive(path) ? 'active' : ''}`}
        >
            <Icon size={20} />
            <span>{label}</span>
        </div>
    );

    return (
        <div className="col-lg-2 d-none d-lg-flex flex-column justify-content-between p-4 bg-surface border-end vh-100 sticky-top top-0 shadow-custom-sm z-3">
            <div>
                {/* Logo Area */}
                <div className="d-flex align-items-center gap-3 mb-5 px-2">
                    <img src={civicLogo} alt="Logo" width="40" className='hover-scale' />
                    <h5 className="fw-bold mb-0" style={{ color: 'var(--primary-color)', letterSpacing: '1px' }}>CIVIC CONNECT</h5>
                </div>

                {/* Navigation */}
                <nav className="nav flex-column">
                    <NavItem icon={FaHome} label="Home" path="/dashboard" />
                    <NavItem icon={FaExclamationTriangle} label="Report Issue" path="/dashboard/report-issue" />
                    <NavItem icon={FaHandsHelping} label="Contributions" path="/dashboard/contributions" />
                    <NavItem icon={FaCheckDouble} label="Resolved Issues" path="/dashboard/resolved-issues" />
                    <NavItem icon={FaTrophy} label="Leaderboard" path="/dashboard/leaderboard" />
                </nav>
            </div>

            {/* Bottom Actions - User Dropdown */}
            <div className="position-relative" ref={dropdownRef}>
                <div
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`d-flex align-items-center gap-3 p-3 rounded-custom cursor-pointer transition-all ${isDropdownOpen ? 'bg-primary-light' : 'hover-bg-light'}`}
                >
                    <div className="rounded-circle bg-white shadow-sm p-1 d-flex justify-content-center align-items-center" style={{ width: 45, height: 45 }}>
                        <FaUserCircle size={28} className="text-primary-custom" />
                    </div>
                    <div style={{ lineHeight: '1.2' }} className="flex-grow-1">
                        <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: '0.95rem' }}>{user?.userName || 'User'}</h6>
                        <small className="text-muted" style={{ fontSize: '0.8rem' }}>{user?.role || 'Citizen'}</small>
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
                                <button onClick={() => handleNavClick('/dashboard/leaderboard')} className="btn btn-light w-100 text-start d-flex align-items-center gap-2 p-2 mb-1 rounded-3 hover-bg-light border-0 text-secondary">
                                    <FaTrophy size={14} /> Leaderboard
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

export default Sidebar;
