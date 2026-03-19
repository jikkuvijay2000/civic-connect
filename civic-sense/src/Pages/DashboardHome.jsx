import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FaSearch, FaHeart, FaExclamationCircle, FaCheckCircle,
    FaRegClock, FaChartLine, FaHandsHelping, FaTerminal
} from 'react-icons/fa';
import Calendar from '../Components/Calendar';
import NotificationDropdown from '../components/NotificationDropdown';
import ComplaintDetailsModal from '../components/ComplaintDetailsModal';
import { notify } from '../utils/notify';
import { initiateSocketConnection, subscribeToNotifications, subscribeToAlerts } from '../utils/socketService';
import AIAnimation from '../Components/AIAnimation';
import api from '../api/axios';
import LiveIncidentMap from '../components/LiveIncidentMap';

const TAG_META = {
    Alert: { color: 'var(--accent-red)', bg: 'rgba(239, 68, 68, 0.1)', border: 'var(--accent-red)' },
    Event: { color: 'var(--secondary-color)', bg: 'rgba(163, 230, 53, 0.1)', border: 'var(--secondary-color)' },
    News: { color: 'var(--primary-color)', bg: 'rgba(170, 0, 255, 0.1)', border: 'var(--primary-color)' },
    Update: { color: '#00f0ff', bg: 'rgba(0, 240, 255, 0.1)', border: '#00f0ff' },
    Notice: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b' },
};
const getTagMeta = (tag) => TAG_META[tag] || { color: '#9ca3af', bg: 'rgba(255,255,255,0.05)', border: '#4b5563' };

const timeAgo = (dateString) => {
    const s = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (s < 60) return `${s}s AGO`;
    if (s < 3600) return `${Math.floor(s / 60)}M AGO`;
    if (s < 86400) return `${Math.floor(s / 3600)}H AGO`;
    if (s < 2592000) return `${Math.floor(s / 86400)}D AGO`;
    return `${Math.floor(s / 2592000)}MO AGO`;
};

const DashboardHome = () => {
    const [feedPosts, setFeedPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [userStats, setUserStats] = useState({ impactPoints: 0, totalComplaints: 0, resolvedComplaints: 0 });
    const [user, setUser] = useState(null);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) setUser(storedUser);

        const fetchAll = async () => {
            try {
                const [postsRes, notifsRes, statsRes] = await Promise.allSettled([
                    api.get('/community-post'),
                    api.get('/user/notifications'),
                    api.get('/user/stats'),
                ]);
                if (postsRes.status === 'fulfilled') {
                    setFeedPosts([...postsRes.value.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
                }
                if (notifsRes.status === 'fulfilled') {
                    setNotifications(notifsRes.value.data.data.notifications);
                    setUnreadCount(notifsRes.value.data.data.unreadCount);
                }
                if (statsRes.status === 'fulfilled' && statsRes.value.data.data) {
                    setUserStats(statsRes.value.data.data);
                }
            } catch (e) {
                console.error('Data intercept failed:', e);
            } finally {
                setLoadingPosts(false);
            }
        };

        fetchAll();
        initiateSocketConnection();

        const unsubNotifs = subscribeToNotifications((err, data) => {
            if (data) {
                setNotifications(prev => [data, ...prev]);
                setUnreadCount(prev => prev + 1);
                notify('info', `INTEL: ${data.message}`);
            }
        });
        const unsubAlerts = subscribeToAlerts((err, data) => {
            if (data) {
                setFeedPosts(prev => [data, ...prev]);
                const newNotification = { _id: Date.now(), message: `ALERT: ${data.title}`, type: 'warning', createdAt: new Date().toISOString(), isRead: false };
                setNotifications(prev => [newNotification, ...prev]);
                setUnreadCount(prev => prev + 1);
            }
        });
        return () => { if (unsubNotifs) unsubNotifs(); if (unsubAlerts) unsubAlerts(); };
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.put(`/user/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) { console.error('Status sync failed:', e); }
    };

    const FILTERS = ['All', 'Alert', 'Event', 'News', 'Update', 'Notice'];
    const filtered = activeFilter === 'All' ? feedPosts : feedPosts.filter(p => p.tag === activeFilter);

    const STATS = [
        { label: 'IMPACT METRIC', value: userStats.impactPoints, icon: FaHeart, color: 'var(--primary-color)' },
        { label: 'INCIDENTS LOGGED', value: userStats.totalComplaints, icon: FaExclamationCircle, color: '#f59e0b' },
        { label: 'RESOLUTION COUNT', value: userStats.resolvedComplaints, icon: FaCheckCircle, color: 'var(--secondary-color)' },
    ];

    return (
        <div className="row m-0 w-100" style={{ minHeight: '100vh', background: 'transparent' }}>
            <ComplaintDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                complaint={selectedComplaint}
            />

            {/* Center column */}
            <div className="col-lg-9 col-md-12 p-0 position-relative">
                {/* Top bar */}
                <div className="d-flex justify-content-between align-items-center px-4 py-3 glass-sticky">
                    <div>
                        <h5 className="tech-font fw-bold mb-0 text-white" style={{ letterSpacing: '0.15em' }}>COMMAND GRID</h5>
                        <small className="tech-font text-muted text-uppercase" style={{ letterSpacing: '0.1em' }}>ALIAS DETECTED: {user?.userName || 'UNKNOWN'}</small>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <div className="d-none d-md-flex align-items-center rounded bg-transparent px-3 py-2" style={{ border: '1px solid rgba(255,255,255,0.1)', width: '260px' }}>
                            <FaSearch className="text-muted me-2" size={13} />
                            <input type="text" className="form-control tech-font text-white border-0 p-0 shadow-none bg-transparent" placeholder="QUERY NETWORK..." style={{ fontSize: '0.8rem', letterSpacing: '0.1em' }} />
                        </div>
                        <NotificationDropdown
                            notifications={notifications}
                            unreadCount={unreadCount}
                            onMarkRead={markAsRead}
                            isOpen={isNotifOpen}
                            toggleDropdown={() => setIsNotifOpen(!isNotifOpen)}
                        />
                    </div>
                </div>

                <div className="px-4 px-md-5 py-4 py-md-5">
                    {/* Stat Hub */}
                    <div className="row g-4 mb-5">
                        {STATS.map((s, i) => {
                            const Icon = s.icon;
                            return (
                                <div className="col-md-4" key={i}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                                        className="glass-card p-4 d-flex align-items-center gap-4 hover-scale"
                                        style={{ borderTop: `2px solid ${s.color}` }}
                                    >
                                        <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: `rgba(${s.color === 'var(--primary-color)' ? '170,0,255' : s.color === 'var(--secondary-color)' ? '163,230,53' : '245,158,11'}, 0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${s.color}` }}>
                                            <Icon size={22} style={{ color: s.color }} />
                                        </div>
                                        <div>
                                            <h3 className="tech-font fw-bold mb-0 text-white" style={{ letterSpacing: '0.1em' }}>{s.value}</h3>
                                            <small className="label-sm text-muted">{s.label}</small>
                                        </div>
                                    </motion.div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Live Incident Map */}
                    <div className="mb-5">
                        <LiveIncidentMap height="380px" showTitle={true} />
                    </div>

                    {/* Feed Controls */}
                    <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
                        <div className="d-flex align-items-center gap-2">
                            <FaTerminal className="text-neon-purple" size={14} />
                            <h6 className="tech-font fw-bold text-white mb-0 text-uppercase" style={{ letterSpacing: '0.15em' }}>GLOBAL COMM FEED</h6>
                        </div>
                        <div className="d-flex gap-2 flex-wrap">
                            {FILTERS.map(f => {
                                const m = getTagMeta(f);
                                const active = activeFilter === f;
                                return (
                                    <button key={f} onClick={() => setActiveFilter(f)}
                                        className="btn tech-font fw-bold text-uppercase"
                                        style={{
                                            borderRadius: '4px', padding: '6px 14px',
                                            background: active ? m.bg : 'transparent',
                                            color: active ? m.color : 'var(--text-muted)',
                                            border: `1px solid ${active ? m.border : 'rgba(255,255,255,0.1)'}`,
                                            fontSize: '0.7rem', letterSpacing: '0.1em', transition: 'all 0.2s',
                                        }}>
                                        {f}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Feed List */}
                    <div className="d-flex flex-column gap-4 pb-5">
                        {loadingPosts ? (
                            <div className="text-center py-5">
                                <span className="spinner-border text-neon-purple" role="status" />
                                <p className="tech-font mt-3 text-muted text-uppercase" style={{ letterSpacing: '0.2em', fontSize: '0.8rem' }}>ESTABLISHING UPLINK...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-5 glass-card">
                                <FaChartLine size={36} className="text-muted mb-3" style={{ opacity: 0.3 }} />
                                <h6 className="tech-font fw-bold text-white text-uppercase" style={{ letterSpacing: '0.15em' }}>NO TRANSMISSIONS DETECTED</h6>
                                <p className="tech-font text-muted text-uppercase mb-0" style={{ fontSize: '0.7rem', letterSpacing: '0.1em' }}>
                                    {activeFilter === 'All' ? 'NETWORK STATIC DETECTED.' : `NO "${activeFilter}" CATEGORY SIGNALS.`}
                                </p>
                            </div>
                        ) : (
                            filtered.map((post, index) => {
                                const tm = getTagMeta(post.tag);
                                return (
                                    <motion.div key={post._id || index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.07, 0.4) }}
                                        className="glass-card overflow-hidden hover-bg-light"
                                        style={{ cursor: post.isComplaint ? 'pointer' : 'default', borderLeft: `3px solid ${tm.border}` }}
                                        onClick={() => { if (post.isComplaint) { setSelectedComplaint(post.rawComplaint); setIsModalOpen(true); } }}>
                                        {post.image && (
                                            <div style={{ height: '220px', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <img src={post.image} alt="Intel" className="w-100 h-100 object-fit-cover" style={{ filter: 'brightness(0.85) contrast(1.15)' }} />
                                            </div>
                                        )}
                                        <div className="p-4">
                                            <div className="d-flex align-items-center justify-content-between mb-3">
                                                <div className="d-flex align-items-center gap-3">
                                                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.author)}&background=101018&color=fff&size=40`}
                                                        alt={post.author} className="rounded" width="40" height="40" style={{ flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }} />
                                                    <div>
                                                        <div className="d-flex align-items-center gap-2 flex-wrap">
                                                            <span className="tech-font fw-bold text-white" style={{ fontSize: '0.9rem', letterSpacing: '0.05em' }}>{post.author}</span>
                                                            <span className="badge rounded tech-font text-uppercase" style={{ background: 'rgba(170,0,255,0.1)', color: 'var(--primary-color)', border: '1px solid var(--primary-color)', fontSize: '0.65rem', padding: '3px 8px', letterSpacing: '0.08em' }}>
                                                                {post.role}
                                                            </span>
                                                        </div>
                                                        <span className="tech-font text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                                                            <FaRegClock size={10} /> {timeAgo(post.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="badge rounded tech-font text-uppercase" style={{ background: tm.bg, color: tm.color, border: `1px solid ${tm.border}`, fontSize: '0.72rem', padding: '4px 10px', letterSpacing: '0.08em' }}>
                                                    {post.tag}
                                                </span>
                                            </div>
                                            <h6 className="tech-font fw-bold text-white mb-2 text-uppercase tracking-widest">{post.title}</h6>
                                            <p className="body-text mb-0">{post.content}</p>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Right sidebar logic (Hidden on Mobile) */}
            <div className="col-lg-3 d-none d-lg-block glass-card p-0" style={{ position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', zIndex: 1, borderTop: 'none', borderRight: 'none', borderBottom: 'none', borderRadius: 0 }}>
                {/* Calendar Panel */}
                <div className="p-4 border-bottom border-secondary" style={{ borderColor: 'rgba(255,255,255,0.05) !important' }}>
                    <Calendar />
                </div>

                {/* AI Monitor Panel */}
                <div className="p-4 border-bottom border-secondary" style={{ borderColor: 'rgba(255,255,255,0.05) !important' }}>
                    <label className="label-sm text-primary mb-3 d-flex align-items-center gap-2"><FaTerminal size={10} /> AUTO-ANALYSIS MODULE</label>
                    <div className="rounded p-3 d-flex align-items-center gap-3" style={{ background: 'rgba(170,0,255,0.05)', border: '1px solid var(--primary-color)' }}>
                        <div style={{ flexShrink: 0 }}><AIAnimation size="small" /></div>
                        <div>
                            <p className="tech-font fw-bold text-neon-purple mb-0 text-uppercase" style={{ fontSize: '0.82rem', letterSpacing: '0.08em' }}>CIVIC AI SEER</p>
                            <small className="label-sm text-muted d-block mt-1">PROCESSING LOCAL THREAT VECTORS...</small>
                        </div>
                    </div>
                </div>

                {/* Sub-Networks Panel */}
                <div className="p-4">
                    <label className="label-sm text-secondary mb-3 d-flex align-items-center gap-2"><FaTerminal size={10} /> LOCALIZED COMM GROUPS</label>
                    <div className="d-flex flex-column gap-3">
                        {[
                            { name: 'RESPONSE CORPS', sub: '942 ACTIVE UNITS', color: 'var(--primary-color)', icon: FaHandsHelping },
                            { name: 'SECTOR PATROL', sub: 'LOCALIZED SECURITY OVERSIGHT', color: 'var(--secondary-color)', icon: FaSearch },
                            { name: 'TERRA INITIATIVE', sub: 'ECO-RECOVERY OPS', color: '#f59e0b', icon: FaChartLine },
                        ].map((g, i) => {
                            const GIcon = g.icon;
                            let rgb = g.color === 'var(--primary-color)' ? '170,0,255' : g.color === 'var(--secondary-color)' ? '163,230,53' : '245,158,11';
                            return (
                                <div key={i} className="d-flex align-items-center gap-3 p-3 rounded glass-card hover-bg-light" style={{ transition: 'all 0.2s' }}>
                                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: `rgba(${rgb}, 0.1)`, border: `1px solid ${g.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <GIcon size={16} style={{ color: g.color }} />
                                    </div>
                                    <div className="flex-grow-1 min-width-0">
                                        <p className="tech-font fw-bold text-white mb-0 text-uppercase" style={{ fontSize: '0.78rem', letterSpacing: '0.08em' }}>{g.name}</p>
                                        <small className="label-sm text-muted d-block">{g.sub}</small>
                                    </div>
                                    <button className="btn p-1 px-2 text-uppercase tech-font fw-bold" style={{ borderRadius: '4px', background: `rgba(${rgb}, 0.1)`, color: g.color, border: `1px solid ${g.color}`, fontSize: '0.6rem', letterSpacing: '0.1em' }}>
                                        LINK
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
