import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaSearch, FaBell, FaHeart, FaExclamationCircle, FaCheckCircle,
    FaMapMarkerAlt, FaTag, FaRegClock, FaArrowUp, FaChartLine,
    FaHandsHelping
} from 'react-icons/fa';
import Calendar from '../Components/Calendar';
import NotificationDropdown from '../components/NotificationDropdown';
import ComplaintDetailsModal from '../components/ComplaintDetailsModal';
import { notify } from '../utils/notify';
import { initiateSocketConnection, subscribeToNotifications, subscribeToAlerts, disconnectSocket } from '../utils/socketService';
import AIAnimation from '../Components/AIAnimation';
import api from '../api/axios';

/* ── Tag color map ────────────────────────────────────────────────── */
const TAG_META = {
    Alert: { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
    Event: { color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7' },
    News: { color: '#6366f1', bg: '#eef2ff', border: '#a5b4fc' },
    Update: { color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd' },
    Notice: { color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
};
const getTagMeta = (tag) => TAG_META[tag] || { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' };

const timeAgo = (dateString) => {
    const s = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
    return `${Math.floor(s / 2592000)}mo ago`;
};

/* ══════════════════════════════════════════════════════════════════ */
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
                console.error('Error fetching dashboard data:', e);
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
                notify('info', `New Notification: ${data.message}`);
            }
        });
        const unsubAlerts = subscribeToAlerts((err, data) => {
            if (data) {
                setFeedPosts(prev => [data, ...prev]);
                const newNotification = { _id: Date.now(), message: `ALERT: ${data.title}`, type: 'warning', createdAt: new Date().toISOString(), isRead: false };
                setNotifications(prev => [newNotification, ...prev]);
                setUnreadCount(prev => prev + 1);
                notify('warning', `New Alert: ${data.title}`);
            }
        });
        return () => { if (unsubNotifs) unsubNotifs(); if (unsubAlerts) unsubAlerts(); };
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.put(`/user/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) { console.error('Error marking read:', e); }
    };

    const FILTERS = ['All', 'Alert', 'Event', 'News', 'Update', 'Notice'];
    const filtered = activeFilter === 'All' ? feedPosts : feedPosts.filter(p => p.tag === activeFilter);

    const STATS = [
        { label: 'Impact Points', value: userStats.impactPoints, icon: FaHeart, color: '#6366f1', bg: '#eef2ff' },
        { label: 'Issues Reported', value: userStats.totalComplaints, icon: FaExclamationCircle, color: '#f59e0b', bg: '#fffbeb' },
        { label: 'Issues Resolved', value: userStats.resolvedComplaints, icon: FaCheckCircle, color: '#10b981', bg: '#ecfdf5' },
    ];

    return (
        <div className="row m-0" style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <ComplaintDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                complaint={selectedComplaint}
            />

            {/* ── Center column ── */}
            <div className="col-lg-9 col-md-12 p-0 position-relative">

                {/* Sticky top bar */}
                <div
                    className="d-flex justify-content-between align-items-center px-5 py-3 border-bottom"
                    style={{ background: 'rgba(248,250,252,0.88)', backdropFilter: 'blur(14px)', position: 'sticky', top: 0, zIndex: 100 }}
                >
                    <div>
                        <h5 className="fw-bold mb-0 text-dark">Dashboard</h5>
                        <small className="text-muted">Welcome back, {user?.userName || 'Citizen'}</small>
                    </div>
                    <div className="d-flex align-items-center gap-3">
                        <div className="d-none d-md-flex align-items-center bg-white rounded-3 border px-3 py-2" style={{ width: '260px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <FaSearch className="text-muted me-2" size={13} />
                            <input type="text" className="form-control border-0 p-0 shadow-none bg-transparent" placeholder="Search posts..." style={{ fontSize: '0.87rem' }} />
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

                <div className="px-5 py-5">

                    {/* ── Stat cards ── */}
                    <div className="row g-4 mb-5">
                        {STATS.map((s, i) => {
                            const Icon = s.icon;
                            return (
                                <div className="col-md-4" key={i}>
                                    <motion.div
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.08 }}
                                        className="bg-white rounded-4 border p-4 d-flex align-items-center gap-4"
                                        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                                    >
                                        <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Icon size={22} style={{ color: s.color }} />
                                        </div>
                                        <div>
                                            <h3 className="fw-bold mb-0 text-dark">{s.value}</h3>
                                            <small className="text-muted fw-medium">{s.label}</small>
                                        </div>
                                    </motion.div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Feed header + filter ── */}
                    <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
                        <h6 className="fw-bold text-dark mb-0">Community Feed</h6>
                        <div className="d-flex gap-1 flex-wrap">
                            {FILTERS.map(f => {
                                const m = getTagMeta(f);
                                const active = activeFilter === f;
                                return (
                                    <button
                                        key={f}
                                        onClick={() => setActiveFilter(f)}
                                        className="btn btn-sm fw-medium"
                                        style={{
                                            borderRadius: '10px',
                                            padding: '5px 14px',
                                            background: active ? m.bg : 'white',
                                            color: active ? m.color : '#64748b',
                                            border: `1.5px solid ${active ? m.border : '#e2e8f0'}`,
                                            fontSize: '0.8rem',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {f}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Feed posts ── */}
                    <div className="d-flex flex-column gap-4 pb-5">
                        {loadingPosts ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-5 bg-white rounded-4 border">
                                <FaChartLine size={36} className="text-muted mb-3" style={{ opacity: 0.3 }} />
                                <h6 className="fw-bold text-dark">No posts found</h6>
                                <p className="text-muted small mb-0">
                                    {activeFilter === 'All' ? 'No community updates yet.' : `No "${activeFilter}" posts yet.`}
                                </p>
                            </div>
                        ) : (
                            filtered.map((post, index) => {
                                const tm = getTagMeta(post.tag);
                                return (
                                    <motion.div
                                        key={post._id || index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(index * 0.07, 0.4) }}
                                        className="bg-white rounded-4 border overflow-hidden"
                                        style={{
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                                            cursor: post.isComplaint ? 'pointer' : 'default',
                                            transition: 'all 0.18s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}
                                        onClick={() => {
                                            if (post.isComplaint) {
                                                setSelectedComplaint(post.rawComplaint);
                                                setIsModalOpen(true);
                                            }
                                        }}
                                    >
                                        {/* Post image */}
                                        {post.image && (
                                            <div style={{ height: '220px', overflow: 'hidden' }}>
                                                <img src={post.image} alt={post.title} className="w-100 h-100 object-fit-cover" />
                                            </div>
                                        )}

                                        <div className="p-4">
                                            {/* Author row */}
                                            <div className="d-flex align-items-center justify-content-between mb-3">
                                                <div className="d-flex align-items-center gap-3">
                                                    <img
                                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.author)}&background=random&color=fff&size=40`}
                                                        alt={post.author}
                                                        className="rounded-circle"
                                                        width="40" height="40"
                                                        style={{ flexShrink: 0 }}
                                                    />
                                                    <div>
                                                        <div className="d-flex align-items-center gap-2 flex-wrap">
                                                            <span className="fw-bold text-dark small">{post.author}</span>
                                                            <span className="badge rounded-pill" style={{ background: '#eef2ff', color: '#6366f1', border: '1px solid #a5b4fc', fontSize: '0.65rem', padding: '2px 7px' }}>
                                                                {post.role}
                                                            </span>
                                                        </div>
                                                        <span className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                                                            <FaRegClock size={10} /> {timeAgo(post.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span
                                                    className="badge rounded-pill fw-medium px-3 py-1"
                                                    style={{ background: tm.bg, color: tm.color, border: `1px solid ${tm.border}`, fontSize: '0.75rem' }}
                                                >
                                                    {post.tag}
                                                </span>
                                            </div>

                                            {/* Content */}
                                            <h6 className="fw-bold text-dark mb-2">{post.title}</h6>
                                            <p className="text-secondary mb-0" style={{ fontSize: '0.9rem', lineHeight: 1.65 }}>
                                                {post.content}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* ── Right sidebar ── */}
            <div
                className="col-lg-3 d-none d-lg-block border-start"
                style={{ background: 'white', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', zIndex: 1 }}
            >
                {/* Calendar section */}
                <div className="p-4 border-bottom">
                    <Calendar />
                </div>

                {/* AI Monitor */}
                <div className="p-4 border-bottom">
                    <label className="fw-bold text-muted text-uppercase mb-3 d-block" style={{ fontSize: '0.68rem', letterSpacing: '0.09em' }}>AI Monitor</label>
                    <div
                        className="rounded-3 p-3 d-flex align-items-center gap-3"
                        style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #f0fdf4 100%)', border: '1px solid #e0e7ff' }}
                    >
                        <div style={{ flexShrink: 0 }}>
                            <AIAnimation size="small" />
                        </div>
                        <div>
                            <p className="fw-bold text-dark mb-0" style={{ fontSize: '0.82rem' }}>Civic AI Monitor</p>
                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>Analyzing community trends locally</small>
                        </div>
                    </div>
                </div>

                {/* Suggested Groups */}
                <div className="p-4">
                    <label className="fw-bold text-muted text-uppercase mb-3 d-block" style={{ fontSize: '0.68rem', letterSpacing: '0.09em' }}>Suggested Groups</label>
                    <div className="d-flex flex-column gap-2">
                        {[
                            { name: 'Volunteer Corps', sub: 'Join 500+ locals', color: '#6366f1', bg: '#eef2ff', border: '#a5b4fc', icon: FaHandsHelping },
                            { name: 'Safety Watch', sub: 'Neighborhood patrol', color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7', icon: FaSearch },
                            { name: 'Green Initiative', sub: 'Eco-drive community', color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d', icon: FaChartLine },
                        ].map((g, i) => {
                            const GIcon = g.icon;
                            return (
                                <div
                                    key={i}
                                    className="d-flex align-items-center gap-3 p-3 rounded-3 border"
                                    style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'box-shadow 0.15s' }}
                                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.08)'}
                                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'}
                                >
                                    <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: g.bg, border: `1px solid ${g.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <GIcon size={14} style={{ color: g.color }} />
                                    </div>
                                    <div className="flex-grow-1 min-width-0">
                                        <p className="fw-bold text-dark mb-0" style={{ fontSize: '0.81rem' }}>{g.name}</p>
                                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>{g.sub}</small>
                                    </div>
                                    <button
                                        className="btn btn-sm fw-semibold flex-shrink-0"
                                        style={{ borderRadius: '8px', background: g.bg, color: g.color, border: `1px solid ${g.border}`, fontSize: '0.73rem', padding: '4px 11px' }}
                                    >
                                        Join
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
