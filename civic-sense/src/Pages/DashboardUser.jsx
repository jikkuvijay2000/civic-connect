import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    FaHome, FaExclamationTriangle, FaHandsHelping, FaTrophy,
    FaUserCircle, FaSearch, FaBell, FaComment, FaHeart, FaShare,
    FaTerminal, FaCrosshairs, FaShieldAlt
} from 'react-icons/fa';
import civicLogo from '../assets/civic_sense_symbolic_logo.png';
import Calendar from '../Components/Calendar';
import { notify } from '../utils/notify';

const DashboardUser = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            navigate('/'); // Redirect if no user found
        }
    }, [navigate]);

    // Mock Data for Feed
    const feedPosts = [
        {
            id: 1,
            user: "SYSTEM DIRECTIVE",
            role: "CENTRAL AUTHORITY",
            avatar: "https://ui-avatars.com/api/?name=AUTH&background=1e293b&color=ffea00",
            time: "2 HOURS AGO",
            content: "OPERATIVES: A CLEANUP PROTOCOL HAS BEEN INITIATED AT CENTRAL SECTOR. ALL AVAILABLE UNITS REQUESTED TO ASSIST.",
            image: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=1974&auto=format&fit=crop",
            likes: 124,
            comments: 45
        },
        {
            id: 2,
            user: "TRAFFIC CONTROL",
            role: "MONITORING DEPT",
            avatar: "https://ui-avatars.com/api/?name=TC&background=dc3545&color=fff",
            time: "5 HOURS AGO",
            content: "ALERT: CONGESTION DETECTED ON PRIMARY ARTERY. MAINTENANCE OVERRIDE IN EFFECT. REROUTE RECOMMENDED.",
            image: null,
            likes: 89,
            comments: 12
        },
        {
            id: 3,
            user: "ECO SYNDICATE",
            role: "CITIZEN FACTION",
            avatar: "https://ui-avatars.com/api/?name=ECO&background=10b981&color=fff",
            time: "1 DAY AGO",
            content: "BOTANICAL DEPLOYMENT SUCCESSFUL. APPRECIATION TO ALL FIELD VOLUNTEERS FOR THEIR EFFORTS.",
            image: "https://images.unsplash.com/photo-1542601906990-24ccd54b8606?q=80&w=2070&auto=format&fit=crop",
            likes: 256,
            comments: 67
        }
    ];

    const handleNavClick = (name, path) => {
        if (path) {
            navigate(path);
        } else {
            notify("info", `INITIALIZING: ${name} PROTOCOL...`);
        }
    };

    const handleFeatureClick = (feature) => {
        notify("info", `FEATURE DENIED: ${feature} PROTOCOL PENDING UPLINK.`);
    };

    const handleLike = (postUser) => {
        notify("success", `ENDORSING LOG SUBMITTED BY ${postUser}.`);
    };

    const handleShare = () => {
        notify("success", "DATALINK SECURED. COPIED TO CLIPBOARD.");
    };

    return (
        <div className="container-fluid min-vh-100 p-0" style={{ background: 'var(--bg-body)' }}>
            <div className="row g-0 h-100">
                {/* Left Sidebar (Desktop only) */}
                <div className="col-lg-3 col-xl-2 d-none d-lg-flex flex-column justify-content-between p-4 glass-card border-top-0 border-bottom-0 border-start-0 vh-100 sticky-top top-0 rounded-0" style={{ backgroundColor: 'rgba(15,23,42,0.95)', borderRight: '1px solid var(--border-color)' }}>
                    <div>
                        <div className="d-flex align-items-center gap-3 mb-5">
                            <FaShieldAlt size={28} className="text-secondary" />
                            <h5 className="fw-bold mb-0 tech-font text-white tracking-widest text-uppercase">CIVIC<span className="text-secondary">OS</span></h5>
                        </div>

                        <nav className="nav flex-column gap-2 mb-4">
                            <div onClick={() => handleNavClick('Home', '/dashboard')} className="nav-link text-white tech-font fw-bold d-flex align-items-center gap-3 p-3 rounded cursor-pointer" style={{ background: 'rgba(170,0,255,0.15)', borderLeft: '3px solid var(--primary-color)', fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                <FaTerminal size={18} className="text-primary" /> COMMAND CENTER
                            </div>
                            <div onClick={() => handleNavClick('Report Issue', '/report-issue')} className="nav-link text-muted tech-font fw-bold d-flex align-items-center gap-3 p-3 rounded hover-bg-light cursor-pointer transition-all" style={{ fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                <FaExclamationTriangle size={18} /> REPORT ANOMALY
                            </div>
                            <div onClick={() => handleNavClick('Contributions', '/contributions')} className="nav-link text-muted tech-font fw-bold d-flex align-items-center gap-3 p-3 rounded hover-bg-light cursor-pointer transition-all" style={{ fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                <FaCrosshairs size={18} /> MY ARCHIVES
                            </div>
                            <div onClick={() => handleNavClick('Leaderboard', '/dashboard/leaderboard')} className="nav-link text-muted tech-font fw-bold d-flex align-items-center gap-3 p-3 rounded hover-bg-light cursor-pointer transition-all" style={{ fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                <FaTrophy size={18} /> NETWORK RANK
                            </div>
                        </nav>
                        
                        <div className="mt-4 pt-4 border-top border-secondary opacity-50">
                            <small className="tech-font text-muted d-block mb-3 text-uppercase" style={{ letterSpacing: '0.15em', fontSize: '0.65rem' }}>SYSTEM DIAGNOSTICS</small>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="tech-font text-muted small text-uppercase">UPLINK</span>
                                <span className="tech-font text-neon-green small">STABLE</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                                <span className="tech-font text-muted small text-uppercase">ENCRYPTION</span>
                                <span className="tech-font text-neon-purple small">ACTIVE</span>
                            </div>
                        </div>
                    </div>

                    <div onClick={() => handleNavClick('Profile')} className="d-flex align-items-center gap-3 p-3 rounded border cursor-pointer hover-scale transition-all mt-auto" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1) !important' }}>
                        <FaUserCircle size={36} className="text-secondary" />
                        <div>
                            <h6 className="mb-1 text-white tech-font text-uppercase tracking-widest" style={{ fontSize: '0.85rem' }}>{user?.userName || 'OPERATIVE'}</h6>
                            <small className="text-neon-purple tech-font text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.1em' }}>{user?.role || 'CITIZEN'} CLEARANCE</small>
                        </div>
                    </div>
                </div>

                {/* Center Feed */}
                <div className="col-12 col-lg-6 col-xl-7 d-flex flex-column vh-100 overflow-auto form-scrollbar">
                    {/* Top Bar */}
                    <div className="d-flex justify-content-between align-items-center p-3 p-md-4 glass-card border-top-0 border-start-0 border-end-0 sticky-top top-0 z-1 rounded-0" style={{ backdropFilter: 'blur(20px)' }}>
                        <div className="d-flex align-items-center gap-3">
                            <h4 className="fw-bold mb-0 text-white tech-font text-uppercase tracking-widest d-none d-md-block">COMMAND FEED</h4>
                            <h5 className="fw-bold mb-0 text-white tech-font text-uppercase tracking-widest d-md-none">CIVIC<span className="text-secondary">OS</span></h5>
                        </div>
                        <div className="input-group d-none d-md-flex mx-4" style={{ maxWidth: '400px' }}>
                            <span className="input-group-text bg-dark border-secondary text-muted"><FaSearch /></span>
                            <input type="text" className="form-control text-white border-secondary tech-font" style={{ background: 'rgba(0,0,0,0.5)' }} placeholder="QUERY NETWORK..." />
                        </div>
                        <button className="btn btn-dark border border-secondary p-2 position-relative rounded-circle">
                            <FaBell className="text-secondary" />
                            <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-dark rounded-circle">
                                <span className="visually-hidden">Alerts</span>
                            </span>
                        </button>
                    </div>

                    <div className="p-3 p-md-4 flex-grow-1" style={{ maxWidth: '850px', margin: '0 auto', width: '100%' }}>
                        <div className="d-flex align-items-center gap-3 mb-4 mt-2">
                            <FaTerminal className="text-secondary" />
                            <h6 className="fw-bold text-muted tech-font mb-0 text-uppercase tracking-widest" style={{ letterSpacing: '0.15em' }}>GLOBAL BROADCAST DECRYPTED</h6>
                            <div className="flex-grow-1 border-bottom border-secondary opacity-50"></div>
                        </div>

                        {/* Create Post Input */}
                        <div className="glass-card p-3 mb-5 d-flex gap-3 align-items-center cursor-pointer hover-scale" onClick={() => handleFeatureClick('Create Post')} style={{ border: '1px solid var(--primary-color)', boxShadow: '0 0 15px rgba(170,0,255,0.1)' }}>
                            <FaUserCircle size={36} className="text-primary" />
                            <input type="text" readOnly className="form-control tech-font text-white border-0 bg-transparent px-2 cursor-pointer transition-all placeholder-glow" placeholder="TRANSMIT INTEL TO NETWORK..." style={{ fontSize: '0.85rem', letterSpacing: '0.1em' }} />
                            <button className="btn btn-sm d-none d-md-block tech-font px-3 py-2 text-uppercase fw-bold" style={{ background: 'var(--primary-color)', color: 'white', letterSpacing: '0.1em' }}>SEND</button>
                        </div>

                        {/* Feed Posts */}
                        <div className="d-flex flex-column gap-4 pb-5">
                            {feedPosts.map(post => (
                                <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
                                    <div className="p-3 p-md-4 d-flex align-items-center gap-3 border-bottom border-secondary" style={{ background: 'rgba(255,255,255,0.02)' }}>
                                        <img src={post.avatar} alt="User User" className="border border-secondary" width="45" height="45" style={{ filter: 'contrast(1.2)' }} />
                                        <div>
                                            <div className="d-flex align-items-center gap-2">
                                                <h6 className="mb-0 fw-bold text-white tech-font text-uppercase tracking-widest">{post.user}</h6>
                                                <FaCheckCircle className="text-secondary d-none d-md-block" size={12} />
                                            </div>
                                            <div className="d-flex gap-2 align-items-center">
                                                <small className="tech-font text-neon-purple text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.1em' }}>{post.role}</small>
                                                <span className="text-muted" style={{ fontSize: '0.5rem' }}>|</span>
                                                <small className="tech-font text-muted text-uppercase" style={{ fontSize: '0.65rem' }}>{post.time}</small>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3 p-md-4">
                                        <p className="mb-4 text-white font-monospace" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{post.content}</p>
                                        {post.image && (
                                            <div className="border border-secondary overflow-hidden mb-2 rounded position-relative" style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}>
                                                <div className="position-absolute top-0 start-0 w-100 h-100 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(163,230,53,0.05) 2px, rgba(163,230,53,0.05) 4px)' }}></div>
                                                <img src={post.image} alt="Post Content Content" className="w-100 object-fit-cover hover-scale transition-all" style={{ maxHeight: '400px', filter: 'brightness(0.9) contrast(1.1) sepia(0.2) hue-rotate(180deg)' }} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="d-flex border-top border-secondary p-2" style={{ background: 'rgba(0,0,0,0.3)' }}>
                                        <button onClick={() => handleLike(post.user)} className="btn flex-grow-1 text-muted d-flex align-items-center justify-content-center gap-2 hover-text-primary tech-font text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.1em', transition: 'all 0.2s' }}>
                                            <FaHeart className="hover-shake" /> <span className="d-none d-md-inline">ENDORSE</span> ({post.likes})
                                        </button>
                                        <button onClick={() => handleFeatureClick('Comment')} className="btn flex-grow-1 text-muted d-flex align-items-center justify-content-center gap-2 hover-text-secondary tech-font text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.1em', transition: 'all 0.2s' }}>
                                            <FaComment /> <span className="d-none d-md-inline">REPLY</span> ({post.comments})
                                        </button>
                                        <button onClick={handleShare} className="btn flex-grow-1 text-muted d-flex align-items-center justify-content-center gap-2 hover-text-white tech-font text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.1em', transition: 'all 0.2s' }}>
                                            <FaShare /> <span className="d-none d-md-inline">RELAY</span>
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Calendar Column (Desktop XL only) */}
                <div className="col-lg-3 col-xl-3 d-none d-lg-block p-4 border-start border-secondary vh-100 sticky-top top-0 overflow-auto form-scrollbar" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(10px)' }}>
                    <h6 className="fw-bold text-white tech-font mb-4 text-uppercase tracking-widest d-flex align-items-center gap-2">
                        <FaTerminal className="text-secondary" size={14} /> SYSTEM CHRONOLOGY
                    </h6>
                    <div className="glass-card p-2 mb-5">
                        <Calendar />
                    </div>

                    <div className="mt-5">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h6 className="fw-bold text-muted tech-font text-uppercase mb-0 tracking-widest" style={{ fontSize: '0.8rem' }}>SUGGESTED ALLIANCES</h6>
                            <span className="badge border border-secondary text-secondary">NEW</span>
                        </div>
                        
                        <div className="glass-card p-3 d-flex gap-3 align-items-center cursor-pointer hover-scale transition-all" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                            <div className="rounded p-2 text-primary" style={{ background: 'rgba(170,0,255,0.1)', border: '1px solid var(--primary-color)' }}>
                                <FaHandsHelping size={24} />
                            </div>
                            <div>
                                <h6 className="mb-1 text-white tech-font text-uppercase fw-bold" style={{ fontSize: '0.8rem', letterSpacing: '0.1em' }}>LOCAL AUXILIARY</h6>
                                <p className="mb-0 text-muted font-monospace" style={{ fontSize: '0.7rem' }}>COMMUNITY FIELD OPERATIVES</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DashboardUser;