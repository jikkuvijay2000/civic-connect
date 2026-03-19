import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChartLine, FaClipboardList, FaBullhorn, FaSignOutAlt, FaShieldAlt, FaTerminal } from 'react-icons/fa';
import civicLogo from '../assets/civic_logo_dark.png';
import { notify } from '../utils/notify';
import { toast } from 'react-toastify';
import { initiateSocketConnection, subscribeToEmergency, subscribeToAuthorityNotifications } from '../utils/socketService';

const NAV_ITEMS = [
    { icon: FaChartLine, label: 'COMMAND', path: '/authority' },
    { icon: FaClipboardList, label: 'INCIDENTS', path: '/authority/complaints' },
    { icon: FaBullhorn, label: 'BROADCAST', path: '/authority/community-post' },
];

const AuthoritySidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = JSON.parse(localStorage.getItem('user'));
    const [showProfile, setShowProfile] = useState(false);

    useEffect(() => {
        initiateSocketConnection();
        const unsubEmergency = subscribeToEmergency((err, data) => {
            if (data) toast.error(`CRITICAL: ${data.complaint.complaintType}`, { position: 'top-right', theme: 'dark' });
        });
        const unsubAuthorityNotif = subscribeToAuthorityNotifications((err, data) => {
            if (data) toast.info(data.message, { position: 'top-right', theme: 'dark' });
        });
        return () => { if (unsubEmergency) unsubEmergency(); if (unsubAuthorityNotif) unsubAuthorityNotif(); };
    }, []);

    const isActive = (path) => location.pathname === path || (path !== '/authority' && location.pathname.startsWith(path));

    const handleLogout = () => {
        try {
            localStorage.clear(); sessionStorage.clear();
            document.cookie.split(';').forEach(c => document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/'));
            notify('success', 'AUTHORITY LINK SEVERED');
            navigate('/');
        } catch (err) { notify('error', 'DISCONNECT FAILURE'); }
    };

    const UserMenu = () => (
        <AnimatePresence>
            {showProfile && (
                <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="position-absolute end-0 mt-2 p-2 glass-card border border-primary shadow-custom-lg"
                    style={{ top: '100%', minWidth: '220px', zIndex: 1000, background: 'rgba(20, 20, 28, 0.95)' }}>
                    <div className="px-3 py-2 border-bottom border-secondary mb-2">
                        <p className="tech-font fw-bold text-white mb-0" style={{ letterSpacing: '0.1em' }}>{user?.userName || 'COMMANDER'}</p>
                        <small className="tech-font text-neon-green fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.15em' }}>{user?.userDepartment || 'OVERSEER'} SEC-LEVEL 4</small>
                    </div>
                    <button onClick={() => { navigate('/authority/security'); setShowProfile(false); }} className="btn w-100 text-start text-white tech-font p-2 hover-bg-light border-0 d-flex align-items-center gap-2 mb-1" style={{ fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                        <FaShieldAlt size={12} className="text-neon-purple" /> PROTOCOL SECURITY
                    </button>
                    <button onClick={handleLogout} className="btn w-100 text-start text-neon-red tech-font p-2 border-0 d-flex align-items-center gap-2" style={{ fontSize: '0.8rem', letterSpacing: '0.1em', background: 'rgba(239, 68, 68, 0.1)' }}>
                        <FaSignOutAlt size={12} /> TERMINATE COMMAND LINK
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            {/* Desktop TopBar HUD */}
            <div className="d-none d-lg-flex w-100 align-items-center justify-content-between px-4 py-3 border-bottom position-sticky top-0 z-index-1030 glass-card" style={{ borderBottomColor: 'var(--primary-color) !important' }}>
                <div className="d-flex align-items-center gap-3">
                    <FaTerminal size={24} className="text-neon-purple" />
                    <div>
                        <h5 className="tech-font text-white mb-0 fw-bold" style={{ letterSpacing: '0.2em' }}>CIVIC SENSE</h5>
                        <small className="tech-font text-neon-red fw-bold text-uppercase" style={{ fontSize: '0.62rem', letterSpacing: '0.3em' }}>AUTHORITY COMMAND NODE</small>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
                        <button key={path} onClick={() => navigate(path)}
                            className={`btn tech-font fw-bold d-flex align-items-center gap-2 px-3 py-2 ${isActive(path) ? 'text-neon-green' : 'text-muted'}`}
                            style={{ 
                                background: isActive(path) ? 'rgba(163, 230, 53, 0.1)' : 'transparent', 
                                border: isActive(path) ? '1px solid var(--secondary-color)' : '1px solid transparent',
                                fontSize: '0.8rem', letterSpacing: '0.15em', borderRadius: '4px' 
                            }}>
                            <Icon size={14} /> {label}
                        </button>
                    ))}
                </div>

                <div className="position-relative">
                    <button onClick={() => setShowProfile(!showProfile)} className="btn rounded-circle p-0" style={{ width: '40px', height: '40px', background: 'rgba(170,0,255,0.2)', border: '1px solid var(--primary-color)' }}>
                        <FaShieldAlt size={16} className="text-neon-purple" />
                    </button>
                    <UserMenu />
                </div>
            </div>

            {/* Mobile TopBar HUD */}
            <div className="d-lg-none w-100 align-items-center justify-content-between px-3 py-3 border-bottom position-sticky top-0 z-index-1030 glass-card" style={{ display: 'flex', borderBottomColor: 'var(--primary-color) !important' }}>
                <div className="d-flex align-items-center gap-2">
                    <FaTerminal size={20} className="text-neon-purple" />
                    <span className="tech-font text-white fw-bold tracking-widest text-uppercase" style={{ fontSize: '1.1rem', letterSpacing: '0.1em' }}>AUTHORITY</span>
                </div>
                <div className="position-relative">
                    <button onClick={() => setShowProfile(!showProfile)} className="btn rounded-circle p-0" style={{ width: '36px', height: '36px', background: 'rgba(170,0,255,0.2)', border: '1px solid var(--primary-color)' }}>
                        <FaShieldAlt size={14} className="text-neon-purple" />
                    </button>
                    <UserMenu />
                </div>
            </div>

            {/* Mobile BottomNav HUD */}
            <div className="d-lg-none w-100 position-fixed py-2 px-2 z-index-1030 glass-card" style={{ bottom: '15px', left: '50%', transform: 'translateX(-50%)', width: '92%', borderRadius: '24px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.8)', border: '1px solid var(--primary-color)' }}>
                {NAV_ITEMS.map(({ icon: Icon, path, label }) => {
                    const active = isActive(path);
                    return (
                        <button key={path} onClick={() => navigate(path)} className="btn p-2 d-flex flex-column align-items-center" style={{ border: 'none', background: 'transparent' }}>
                            <div className="d-flex align-items-center justify-content-center" style={{ 
                                width: '40px', height: '40px', borderRadius: '50%', 
                                background: active ? 'rgba(170,0,255,0.2)' : 'transparent',
                                border: active ? '1px solid var(--primary-color)' : '1px solid transparent',
                                transition: 'all 0.3s'
                            }}>
                                <Icon size={18} className={active ? 'text-neon-green' : 'text-muted'} />
                            </div>
                            {active && <span className="tech-font mt-1 text-neon-green fw-bold d-block text-uppercase" style={{ fontSize: '0.55rem', letterSpacing: '0.1em' }}>{label}</span>}
                        </button>
                    );
                })}
            </div>
        </>
    );
};

export default AuthoritySidebar;
