import React, { useState, useRef, useEffect } from 'react';
import {
    FaChartLine, FaClipboardList, FaSignOutAlt, FaChevronDown,
    FaUser, FaCog, FaBullhorn, FaChevronRight, FaShieldAlt, FaBars, FaTimes
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import civicLogo from '../assets/civic_logo_dark.png';
import { notify } from '../utils/notify';
import { toast } from 'react-toastify';
import { initiateSocketConnection, subscribeToEmergency, subscribeToAuthorityNotifications } from '../utils/socketService';

const NAV_ITEMS = [
    { icon: FaChartLine, label: 'Dashboard', path: '/authority' },
    { icon: FaClipboardList, label: 'Complaints', path: '/authority/complaints' },
    { icon: FaBullhorn, label: 'Community Post', path: '/authority/community-post' },
];

const ACCENT = '#f59e0b';

/* ── Sidebar inner content (shared between desktop and mobile drawer) ── */
const SidebarContent = ({ user, initials, isActive, navigate, handleLogout, onClose }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setIsDropdownOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const navBtn = (path, Icon, label) => {
        const active = isActive(path);
        return (
            <button
                key={path}
                onClick={() => { navigate(path); onClose?.(); }}
                className="w-100 border-0 d-flex align-items-center gap-3 px-3 py-3 mb-1 position-relative"
                style={{
                    background: active ? 'rgba(245,158,11,0.15)' : 'transparent',
                    borderRadius: '12px',
                    color: active ? ACCENT : 'rgba(255,255,255,0.5)',
                    fontWeight: active ? 600 : 400,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    outline: 'none',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; } }}
            >
                {active && <span className="position-absolute start-0 top-50 translate-middle-y rounded-end" style={{ width: '3px', height: '20px', background: ACCENT }} />}
                <Icon size={16} style={{ flexShrink: 0 }} />
                <span>{label}</span>
                {active && <FaChevronRight size={10} className="ms-auto" style={{ opacity: 0.5 }} />}
            </button>
        );
    };

    return (
        <div className="d-flex flex-column h-100">
            {/* Logo */}
            <div className="px-4 py-4 d-flex align-items-center justify-content-between border-bottom flex-shrink-0"
                style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="d-flex align-items-center gap-3">
                    <img src={civicLogo} alt="Civic Connect" width="26" style={{ opacity: 0.95 }} />
                    <div>
                        <p className="fw-bold mb-0" style={{ color: 'white', fontSize: '0.85rem', letterSpacing: '0.5px' }}>Civic Connect</p>
                        <small style={{ color: ACCENT, fontSize: '0.63rem', letterSpacing: '1px', fontWeight: 700 }}>AUTHORITY</small>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="border-0 d-flex align-items-center justify-content-center"
                        style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                        <FaTimes size={12} style={{ color: 'rgba(255,255,255,0.6)' }} />
                    </button>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-grow-1 px-3 py-4 overflow-auto" style={{ scrollbarWidth: 'none' }}>
                <p className="text-uppercase fw-bold px-3 mb-3" style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }}>Management</p>
                {NAV_ITEMS.map(({ icon: Icon, label, path }) => navBtn(path, Icon, label))}

                <div className="my-4 mx-3" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                <p className="text-uppercase fw-bold px-3 mb-3" style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em' }}>Settings</p>
                <button className="w-100 border-0 d-flex align-items-center gap-3 px-3 py-3 mb-1"
                    style={{ background: 'transparent', borderRadius: '12px', color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', cursor: 'pointer', outline: 'none', textAlign: 'left' }}
                    onClick={() => { navigate('/authority/security'); onClose?.(); }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}>
                    <FaShieldAlt size={16} /> <span>Security</span>
                </button>
            </nav>

            {/* ── User panel — dropdown UPWARD, outside overflow:hidden ── */}
            <div className="flex-shrink-0 border-top px-3 py-3" ref={dropdownRef}
                style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', position: 'relative' }}>

                {/* Dropdown — rendered ABOVE, inside this relative container which has overflow:visible */}
                <AnimatePresence>
                    {isDropdownOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                            style={{
                                position: 'absolute',
                                bottom: '100%',
                                left: '12px',
                                right: '12px',
                                marginBottom: '6px',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                background: '#1e293b',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
                                zIndex: 9999,
                            }}
                        >
                            <div className="p-2">
                                <button className="w-100 border-0 d-flex align-items-center gap-3 px-3 py-2 rounded-2 mb-1"
                                    style={{ background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <FaUser size={13} /> Profile
                                </button>
                                <button className="w-100 border-0 d-flex align-items-center gap-3 px-3 py-2 rounded-2 mb-1"
                                    style={{ background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <FaCog size={13} /> Settings
                                </button>
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '6px 0' }} />
                                <button onClick={handleLogout} className="w-100 border-0 d-flex align-items-center gap-3 px-3 py-2 rounded-2"
                                    style={{ background: 'transparent', color: '#f87171', fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <FaSignOutAlt size={13} /> Log out
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* User row trigger */}
                <div onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="d-flex align-items-center gap-3 px-3 py-2 rounded-3"
                    style={{ cursor: 'pointer', borderRadius: '12px', background: isDropdownOpen ? 'rgba(245,158,11,0.12)' : 'transparent', transition: 'background 0.15s' }}
                    onMouseEnter={e => { if (!isDropdownOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={e => { if (!isDropdownOpen) e.currentTarget.style.background = 'transparent'; }}>
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                        style={{ width: '34px', height: '34px', background: `linear-gradient(135deg, ${ACCENT}, #f97316)`, color: 'white', fontSize: '0.78rem' }}>
                        {initials}
                    </div>
                    <div className="flex-grow-1" style={{ overflow: 'hidden' }}>
                        <p className="fw-bold mb-0 text-truncate" style={{ color: 'white', fontSize: '0.82rem' }}>{user?.userName || 'Authority'}</p>
                        <small className="text-truncate d-block" style={{ color: ACCENT, fontSize: '0.68rem' }}>{user?.userDepartment || 'Authority'}</small>
                    </div>
                    <motion.div animate={{ rotate: isDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <FaChevronDown size={11} style={{ color: 'rgba(255,255,255,0.4)' }} />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

const AuthoritySidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) setUser(storedUser);
        initiateSocketConnection();

        const unsubEmergency = subscribeToEmergency((err, data) => {
            if (data) {
                toast.error(`NEW EMERGENCY: ${data.complaint.complaintType}`, {
                    position: 'top-right', autoClose: 5000, theme: 'colored'
                });
            }
        });
        const unsubAuthorityNotif = subscribeToAuthorityNotifications((err, data) => {
            if (data) toast.info(data.message, { position: 'top-right', autoClose: 5000, theme: 'colored' });
        });

        return () => { if (unsubEmergency) unsubEmergency(); if (unsubAuthorityNotif) unsubAuthorityNotif(); };
    }, []);

    const isActive = (path) =>
        location.pathname === path || (path !== '/authority' && location.pathname.startsWith(path));

    const handleLogout = () => {
        try {
            localStorage.clear(); sessionStorage.clear();
            document.cookie.split(';').forEach(c => {
                document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
            });
            notify('success', 'Logged out successfully');
            navigate('/');
        } catch (err) {
            console.error('Logout error', err);
            notify('error', 'Failed to logout');
        }
    };

    const initials = user?.userName
        ? user.userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : 'A';

    const sharedProps = { user, initials, isActive, navigate, handleLogout };

    return (
        <>
            {/* ── Hamburger button (visible < lg) ── */}
            <button
                onClick={() => setMobileOpen(true)}
                className="d-flex d-lg-none align-items-center justify-content-center border-0 position-fixed"
                style={{
                    top: '16px', left: '16px', zIndex: 400,
                    width: '40px', height: '40px', borderRadius: '12px',
                    background: '#0f172a', boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
                }}
            >
                <FaBars size={16} style={{ color: ACCENT }} />
            </button>

            {/* ── Desktop sidebar ── */}
            <div
                className="d-none d-lg-flex flex-column col-lg-2"
                style={{
                    height: '100vh',
                    position: 'sticky',
                    top: 0,
                    background: '#0f172a',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                    zIndex: 200,
                    overflow: 'visible',   /* ← was 'hidden', that was clipping the dropdown */
                }}
            >
                <SidebarContent {...sharedProps} onClose={null} />
            </div>

            {/* ── Mobile drawer ── */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, backdropFilter: 'blur(4px)' }}
                        />
                        {/* Drawer */}
                        <motion.div
                            key="drawer"
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            style={{
                                position: 'fixed', top: 0, left: 0, bottom: 0,
                                width: '260px', background: '#0f172a',
                                borderRight: '1px solid rgba(255,255,255,0.06)',
                                zIndex: 600, overflowY: 'auto',
                            }}
                        >
                            <SidebarContent {...sharedProps} onClose={() => setMobileOpen(false)} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default AuthoritySidebar;
