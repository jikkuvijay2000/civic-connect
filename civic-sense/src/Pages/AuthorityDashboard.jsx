import React, { useState, useEffect, useRef } from 'react';
import {
    FaClipboardCheck, FaExclamationCircle, FaHourglassHalf, FaRobot,
    FaCheckCircle, FaCircle, FaArrowUp, FaBell
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../api/axios';
import { initiateSocketConnection, subscribeToEmergency, subscribeToAuthorityNotifications } from '../utils/socketService';
import AIAnimation from '../Components/AIAnimation';

/* ── Stat card config ─────────────────────────────────────────────── */
const STAT_META = [
    { key: 'total', label: 'Total Complaints', icon: FaExclamationCircle, color: '#6366f1', bg: '#eef2ff', border: '#a5b4fc' },
    { key: 'resolved', label: 'Resolved', icon: FaClipboardCheck, color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7' },
    { key: 'pending', label: 'Pending', icon: FaHourglassHalf, color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
    { key: 'avgConf', label: 'Avg AI Confidence', icon: FaRobot, color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd' },
];

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const AuthorityDashboard = () => {
    const [statsData, setStatsData] = useState({ total: 0, resolved: 0, pending: 0, avgConfidence: 0 });
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef(null);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/complaint/authority-stats');
                if (res.data.status === 'success') setStatsData(res.data.data);
            } catch (e) { console.error('Error fetching stats:', e); }
            finally { setLoading(false); }
        };
        fetchStats();
        initiateSocketConnection();

        const unsubA = subscribeToAuthorityNotifications((err, data) => {
            if (data) {
                setNotifications(prev => [{ message: data.message, time: new Date().toISOString() }, ...prev]);
                setUnreadCount(prev => prev + 1);
            }
        });
        const unsubE = subscribeToEmergency((err, data) => {
            if (data) {
                setNotifications(prev => [data.notification, ...prev]);
                setUnreadCount(prev => prev + 1);
            }
        });

        // Close notif panel on outside click
        const handleOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false);
        };
        document.addEventListener('mousedown', handleOutside);
        return () => {
            if (unsubA) unsubA();
            if (unsubE) unsubE();
            document.removeEventListener('mousedown', handleOutside);
        };
    }, []);

    const stats = [
        { ...STAT_META[0], value: statsData.total },
        { ...STAT_META[1], value: statsData.resolved },
        { ...STAT_META[2], value: statsData.pending },
        { ...STAT_META[3], value: `${statsData.avgConfidence || 0}%` },
    ];

    const resolutionRate = statsData.total > 0
        ? Math.round((statsData.resolved / statsData.total) * 100) : 0;

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <div className="spinner-border" style={{ color: '#6366f1' }} role="status"><span className="visually-hidden">Loading...</span></div>
        </div>
    );

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh' }}>

            {/* ── Top bar ── */}
            <div className="d-flex justify-content-between align-items-center px-4 px-md-5 py-4 border-bottom"
                style={{ background: 'white', position: 'sticky', top: 0, zIndex: 10 }}>
                <div>
                    <h4 className="fw-bold mb-0 text-dark">Dashboard</h4>
                    <small className="text-muted">
                        Welcome back, <strong>{user?.userName || 'Authority'}</strong> · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </small>
                </div>
                <div className="d-flex align-items-center gap-3">

                    {/* ── Notifications Bell ── */}
                    <div className="position-relative" ref={notifRef}>
                        <button
                            onClick={() => { setIsNotifOpen(!isNotifOpen); if (!isNotifOpen) setUnreadCount(0); }}
                            className="border-0 position-relative d-flex align-items-center justify-content-center"
                            style={{ width: '38px', height: '38px', borderRadius: '12px', background: isNotifOpen ? '#fef2f2' : '#f8fafc', border: `1.5px solid ${isNotifOpen ? '#fca5a5' : '#e2e8f0'}`, cursor: 'pointer', transition: 'all 0.15s' }}
                        >
                            <FaBell size={15} style={{ color: isNotifOpen ? '#ef4444' : '#64748b' }} />
                            {unreadCount > 0 && (
                                <span className="position-absolute d-flex align-items-center justify-content-center"
                                    style={{ top: '-5px', right: '-5px', minWidth: '18px', height: '18px', borderRadius: '9px', background: '#ef4444', color: 'white', fontSize: '0.6rem', fontWeight: 700, padding: '0 4px', border: '2px solid white' }}>
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        <AnimatePresence>
                            {isNotifOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                                    transition={{ duration: 0.15 }}
                                    className="position-absolute top-100 end-0 mt-2 rounded-3 overflow-hidden"
                                    style={{ width: '300px', maxHeight: '340px', overflowY: 'auto', zIndex: 1000, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 40px rgba(0,0,0,0.35)' }}
                                >
                                    <div className="px-4 py-3 border-bottom d-flex justify-content-between align-items-center" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                                        <small className="fw-bold text-uppercase" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', letterSpacing: '0.1em' }}>Notifications</small>
                                        {notifications.length > 0 && <span className="badge rounded-pill" style={{ background: '#ef4444', fontSize: '0.65rem' }}>{notifications.length}</span>}
                                    </div>
                                    {notifications.length === 0 ? (
                                        <div className="text-center py-5">
                                            <FaBell size={24} style={{ color: 'rgba(255,255,255,0.12)', marginBottom: '10px' }} />
                                            <p className="mb-0" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>No new alerts</p>
                                        </div>
                                    ) : notifications.map((notif, i) => (
                                        <div key={i} className="px-4 py-3 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                            <div className="d-flex align-items-start gap-3">
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', marginTop: '5px', flexShrink: 0 }} />
                                                <div>
                                                    <p className="mb-1 fw-medium" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem', lineHeight: 1.4 }}>{notif.message}</p>
                                                    <small style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem' }}>{notif.time ? new Date(notif.time).toLocaleTimeString() : 'Just now'}</small>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* System Operational */}
                    <div className="d-flex align-items-center gap-2 px-3 py-2 rounded-3" style={{ background: '#ecfdf5', border: '1px solid #6ee7b7' }}>
                        <FaCheckCircle size={13} style={{ color: '#10b981' }} />
                        <small className="fw-bold" style={{ color: '#065f46' }}>System Operational</small>
                    </div>
                </div>
            </div>

            <div className="px-5 py-5">

                {/* ── Stat cards ── */}
                <div className="row g-4 mb-5">
                    {stats.map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <div className="col-md-6 col-xl-3" key={i}>
                                <motion.div
                                    initial={{ opacity: 0, y: 18 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    className="bg-white rounded-4 border p-4 h-100"
                                    style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)', borderLeft: `4px solid ${s.color} !important` }}
                                >
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: s.bg, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Icon size={17} style={{ color: s.color }} />
                                        </div>
                                        {s.key === 'resolved' && statsData.total > 0 && (
                                            <span className="badge rounded-pill d-flex align-items-center gap-1" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #6ee7b7', fontSize: '0.68rem' }}>
                                                <FaArrowUp size={8} /> {resolutionRate}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="fw-bold text-dark mb-1" style={{ fontSize: '1.75rem', letterSpacing: '-0.5px' }}>
                                        {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
                                    </div>
                                    <div className="text-muted" style={{ fontSize: '0.82rem' }}>{s.label}</div>
                                </motion.div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Charts row ── */}
                <div className="row g-4 mb-4">

                    {/* AI Confidence Distribution */}
                    <div className="col-lg-5">
                        <div className="bg-white rounded-4 border p-4 h-100" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div>
                                    <h6 className="fw-bold text-dark mb-0">AI Confidence Map</h6>
                                    <small className="text-muted">Complaint severity distribution</small>
                                </div>
                                <span className="badge rounded-pill px-3 py-2 fw-medium" style={{ background: '#eef2ff', color: '#6366f1', border: '1px solid #a5b4fc', fontSize: '0.72rem' }}>Live</span>
                            </div>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={statsData.confidenceDistribution || []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(99,102,241,0.06)' }}
                                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '0.82rem' }}
                                        formatter={(v) => [`${v} issues`, 'Count']}
                                    />
                                    <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={34} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Category Donut */}
                    <div className="col-lg-3">
                        <div className="bg-white rounded-4 border p-4 h-100" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                            <h6 className="fw-bold text-dark mb-1">By Category</h6>
                            <small className="text-muted d-block mb-3">Complaint type breakdown</small>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={statsData.categoryStats || []}
                                        cx="50%" cy="45%"
                                        innerRadius={48} outerRadius={72}
                                        paddingAngle={4}
                                        dataKey="count" nameKey="_id"
                                    >
                                        {(statsData.categoryStats || []).map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}
                                        formatter={(v) => [v, 'Complaints']}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Priority horizontal bar */}
                    <div className="col-lg-4">
                        <div className="bg-white rounded-4 border p-4 h-100" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <FaExclamationCircle size={13} style={{ color: '#ef4444' }} />
                                <h6 className="fw-bold text-dark mb-0">Priority & Emergency</h6>
                            </div>
                            <small className="text-muted d-block mb-3">Complaints by severity level</small>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={statsData.priorityStats || []} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="_id" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} width={70} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}
                                        formatter={(v) => [`${v} complaints`, 'Count']}
                                    />
                                    <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={20}>
                                        {(statsData.priorityStats || []).map((entry, i) => (
                                            <Cell key={i} fill={
                                                entry._id === 'Emergency' ? '#ef4444' :
                                                    entry._id === 'High' ? '#f97316' :
                                                        entry._id === 'Medium' ? '#f59e0b' : '#10b981'
                                            } />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* ── AI System Status (horizontal row card) ── */}
                <div className="bg-white rounded-4 border p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                    <div className="d-flex align-items-center gap-5 flex-wrap">
                        <div className="d-flex align-items-center gap-4">
                            <AIAnimation size="small" />
                            <div>
                                <h6 className="fw-bold text-dark mb-1">Civic AI System</h6>
                                <small className="text-muted">Model v2.1 · All services operational</small>
                            </div>
                        </div>
                        <div style={{ height: '40px', width: '1px', background: '#e2e8f0' }} className="d-none d-md-block" />
                        {[
                            { label: 'Complaint Classifier', status: 'Online', color: '#10b981' },
                            { label: 'Fake Detection', status: 'Online', color: '#10b981' },
                            { label: 'Image Captioning', status: 'Online', color: '#10b981' },
                            { label: 'Avg Latency', status: '45ms', color: '#6366f1' },
                        ].map((s, i) => (
                            <div key={i} className="d-flex align-items-center gap-2">
                                <FaCircle size={8} style={{ color: s.color }} />
                                <div>
                                    <p className="fw-bold text-dark mb-0" style={{ fontSize: '0.78rem' }}>{s.label}</p>
                                    <small style={{ color: s.color, fontSize: '0.7rem', fontWeight: 600 }}>{s.status}</small>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthorityDashboard;
