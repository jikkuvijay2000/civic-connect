import React, { useState, useEffect, useRef } from 'react';
import {
    FaClipboardCheck, FaExclamationCircle, FaHourglassHalf, FaRobot,
    FaCheckCircle, FaCircle, FaArrowUp, FaBell, FaTerminal, FaNetworkWired
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../api/axios';
import { initiateSocketConnection, subscribeToEmergency, subscribeToAuthorityNotifications, subscribeToAiHealth } from '../utils/socketService';
import AIAnimation from '../Components/AIAnimation';

/* ── Stat card config ─────────────────────────────────────────────── */
const STAT_META = [
    { key: 'total', label: 'INCIDENTS LOGGED', icon: FaExclamationCircle, color: '#a855f7', bg: 'rgba(168,85,247,0.1)', border: '#c084fc' },
    { key: 'resolved', label: 'ANOMALIES RESOLVED', icon: FaClipboardCheck, color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: '#34d399' },
    { key: 'pending', label: 'AWAITING DISPATCH', icon: FaHourglassHalf, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: '#fbbf24' },
    { key: 'avgConf', label: 'AI CONFIDENCE', icon: FaRobot, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: '#60a5fa' },
];

const PIE_COLORS = ['#a855f7', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#06b6d4'];

const AuthorityDashboard = () => {
    const [statsData, setStatsData] = useState({ total: 0, resolved: 0, pending: 0, avgConfidence: 0 });
    const [loading, setLoading] = useState(true);
    const [aiHealth, setAiHealth] = useState({
        classifier: { status: 'SCANNING...', latency: null, color: '#64748b' },
        fakeDetection: { status: 'SCANNING...', latency: null, color: '#64748b' },
        captioning: { status: 'SCANNING...', latency: null, color: '#64748b' },
        avgLatency: null,
        allOnline: true
    });
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef(null);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, notifsRes] = await Promise.allSettled([
                    api.get('/complaint/authority-stats'),
                    api.get('/user/notifications')
                ]);

                if (statsRes.status === 'fulfilled' && statsRes.value.data.status === 'success') {
                    setStatsData(statsRes.value.data.data);
                }

                if (notifsRes.status === 'fulfilled' && notifsRes.value.data.status === 'success') {
                    setNotifications(notifsRes.value.data.data.notifications);
                    setUnreadCount(notifsRes.value.data.data.unreadCount);
                }
            } catch (e) {
                console.error('Error fetching dashboard data:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        initiateSocketConnection();

        const unsubAi = subscribeToAiHealth((data) => {
            if (data && Array.isArray(data)) {
                const c = data.find(s => s.name === 'Complaint Classifier');
                const f = data.find(s => s.name === 'Fake Detection');
                const i = data.find(s => s.name === 'Image Captioning');

                const onlineCount = data.filter(s => s.status === 'Online').length;
                const avgLat = onlineCount > 0 ? Math.round(data.filter(s => s.latency !== null).reduce((acc, curr) => acc + curr.latency, 0) / onlineCount) : null;

                setAiHealth({
                    classifier: { status: c?.status || 'UNKNOWN', latency: c?.latency, color: c?.status === 'Online' ? '#10b981' : '#ef4444' },
                    fakeDetection: { status: f?.status || 'UNKNOWN', latency: f?.latency, color: f?.status === 'Online' ? '#10b981' : '#ef4444' },
                    captioning: { status: i?.status || 'UNKNOWN', latency: i?.latency, color: i?.status === 'Online' ? '#10b981' : '#ef4444' },
                    avgLatency: avgLat,
                    allOnline: onlineCount === data.length
                });
            } else {
                setAiHealth({
                    classifier: { status: 'OFFLINE', latency: null, color: '#ef4444' },
                    fakeDetection: { status: 'OFFLINE', latency: null, color: '#ef4444' },
                    captioning: { status: 'OFFLINE', latency: null, color: '#ef4444' },
                    avgLatency: null,
                    allOnline: false
                });
            }
        });

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

        const handleOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setIsNotifOpen(false);
        };
        document.addEventListener('mousedown', handleOutside);
        return () => {
            if (unsubA) unsubA();
            if (unsubE) unsubE();
            if (unsubAi) unsubAi();
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
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh', background: 'transparent' }}>
            <div className="spinner-border text-neon-purple" role="status"><span className="visually-hidden">INITIALIZING SECURE LINK...</span></div>
        </div>
    );

    return (
        <div style={{ background: 'transparent', minHeight: '100vh' }}>

            {/* ── Top bar ── */}
            <div className="d-flex justify-content-between align-items-center px-4 px-md-5 py-4 border-bottom"
                style={{ background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10, borderColor: 'rgba(255,255,255,0.1) !important' }}>
                <div className="d-flex align-items-center gap-3">
                    <FaTerminal size={24} className="text-secondary d-none d-md-block" />
                    <div>
                        <h4 className="fw-bold mb-0 text-white tech-font text-uppercase tracking-widest" style={{ letterSpacing: '0.15em' }}>COMMAND DASHBOARD</h4>
                        <small className="tech-font text-muted text-uppercase tracking-widest font-monospace" style={{ fontSize: '0.75rem' }}>
                            OPERATIVE: <span className="text-secondary fw-bold">{user?.userName || 'AUTHORITY'}</span> // {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' })}
                        </small>
                    </div>
                </div>
                <div className="d-flex align-items-center gap-3">

                    {/* ── System Operational ── */}
                    <div className="d-none d-md-flex align-items-center gap-2 px-3 py-2 rounded border tech-font text-uppercase"
                        style={{ background: aiHealth.allOnline ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderColor: aiHealth.allOnline ? '#10b981 !important' : '#ef4444 !important' }}>
                        {aiHealth.allOnline ? <FaCheckCircle size={13} className="text-neon-green" /> : <FaExclamationCircle size={13} className="text-neon-red" />}
                        <small className="fw-bold" style={{ color: aiHealth.allOnline ? '#10b981' : '#ef4444', letterSpacing: '0.1em' }}>
                            {aiHealth.allOnline ? 'SYSTEM STABLE' : 'LINK DISRUPTION'}
                        </small>
                    </div>

                    {/* ── Notifications Bell ── */}
                    <div className="position-relative" ref={notifRef}>
                        <button
                            onClick={() => { setIsNotifOpen(!isNotifOpen); if (!isNotifOpen) setUnreadCount(0); }}
                            className="border-0 position-relative d-flex align-items-center justify-content-center hover-scale"
                            style={{ width: '42px', height: '42px', borderRadius: '4px', background: isNotifOpen ? 'rgba(170,0,255,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isNotifOpen ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', transition: 'all 0.15s' }}
                        >
                            <FaBell size={16} className={isNotifOpen ? 'text-primary' : 'text-muted'} />
                            {unreadCount > 0 && (
                                <span className="position-absolute d-flex align-items-center justify-content-center tech-font text-uppercase"
                                    style={{ top: '-6px', right: '-6px', minWidth: '20px', height: '20px', borderRadius: '10px', background: 'var(--accent-red)', color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '0 4px', border: '1px solid black' }}>
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
                                    className="position-absolute top-100 end-0 mt-3 rounded overflow-hidden"
                                    style={{ width: '320px', maxHeight: '380px', overflowY: 'auto', zIndex: 1000, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)', border: '1px solid var(--primary-color)', boxShadow: '0 0 30px rgba(170,0,255,0.2)' }}
                                >
                                    <div className="px-4 py-3 border-bottom d-flex justify-content-between align-items-center" style={{ borderColor: 'rgba(255,255,255,0.1) !important' }}>
                                        <small className="fw-bold tech-font text-uppercase tracking-widest text-primary" style={{ fontSize: '0.75rem', letterSpacing: '0.15em' }}>ALERTS</small>
                                        {notifications.length > 0 && <span className="badge rounded px-2 tech-font" style={{ background: 'var(--accent-red)', fontSize: '0.65rem', letterSpacing: '0.1em' }}>{notifications.length} NEW</span>}
                                    </div>
                                    {notifications.length === 0 ? (
                                        <div className="text-center py-5">
                                            <FaNetworkWired size={28} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '12px' }} />
                                            <p className="mb-0 tech-font text-uppercase" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>NETWORK CLEAR</p>
                                        </div>
                                    ) : notifications.map((notif, i) => (
                                        <div key={i} className="px-4 py-3 border-bottom hover-bg-light" style={{ borderColor: 'rgba(255,255,255,0.05) !important', cursor: 'pointer' }}>
                                            <div className="d-flex align-items-start gap-3">
                                                <div style={{ width: '6px', height: '6px', background: 'var(--accent-red)', marginTop: '6px', flexShrink: 0, boxShadow: '0 0 8px var(--accent-red)' }} />
                                                <div>
                                                    <p className="mb-1 fw-bold font-monospace text-white" style={{ fontSize: '0.75rem', lineHeight: 1.5, letterSpacing: '0.05em' }}>{notif.message}</p>
                                                    <small className="tech-font text-muted text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.1em' }}>{notif.time ? new Date(notif.time).toLocaleTimeString() : 'JUST NOW'}</small>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </div>

            <div className="px-3 px-md-5 py-5 overflow-auto custom-scrollbar h-100">

                {/* ── Stat cards ── */}
                <div className="row g-4 mb-5">
                    {stats.map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <div className="col-md-6 col-xl-3" key={i}>
                                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                                    className="glass-card p-4 h-100 position-relative overflow-hidden"
                                    style={{ borderLeft: `3px solid ${s.color} !important`, borderRadius: '4px' }}>
                                    <div className="position-absolute top-0 end-0 w-50 h-100" style={{ background: `linear-gradient(90deg, transparent, ${s.bg})`, zIndex: 0, pointerEvents: 'none', opacity: 0.3 }} />
                                    <div className="position-relative z-1">
                                        <div className="d-flex justify-content-between align-items-start mb-4">
                                            <div style={{ width: '42px', height: '42px', borderRadius: '4px', background: s.bg, border: `1px solid ${s.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Icon size={18} style={{ color: s.color }} />
                                            </div>
                                            {s.key === 'resolved' && statsData.total > 0 && (
                                                <span className="badge d-flex align-items-center gap-1 tech-font fw-bold" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid #34d399', fontSize: '0.7rem', letterSpacing: '0.1em' }}>
                                                    <FaArrowUp size={8} /> {resolutionRate}%
                                                </span>
                                            )}
                                        </div>
                                        <div className="fw-bold text-white tech-font mb-1" style={{ fontSize: '2rem', letterSpacing: '0.05em' }}>
                                            {typeof s.value === 'number' ? s.value.toLocaleString() : s.value}
                                        </div>
                                        <div className="text-secondary tech-font text-uppercase fw-bold" style={{ fontSize: '0.75rem', letterSpacing: '0.15em' }}>{s.label}</div>
                                    </div>
                                </motion.div>
                            </div>
                        );
                    })}
                </div>

                {/* ── Charts row ── */}
                <div className="row g-4 mb-5">

                    {/* AI Confidence Distribution */}
                    <div className="col-lg-5">
                        <div className="glass-card p-4 h-100 rounded">
                            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary opacity-75 pb-2">
                                <div>
                                    <h6 className="fw-bold text-white tech-font mb-1 text-uppercase tracking-widest">CONFIDENCE MAP</h6>
                                    <small className="text-muted font-monospace text-uppercase" style={{ fontSize: '0.7rem' }}>ANOMALY SEVERITY DISTRIBUTION</small>
                                </div>
                                <span className="badge px-3 py-1 fw-bold tech-font text-uppercase" style={{ background: 'var(--primary-color)', color: 'white', border: '1px solid var(--primary-color)', fontSize: '0.7rem', letterSpacing: '0.1em' }}>LIVE FEED</span>
                            </div>
                            <div style={{ height: '240px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={statsData.confidenceDistribution || []} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'Share Tech Mono' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'Share Tech Mono' }} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(170,0,255,0.1)' }}
                                            contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid var(--primary-color)', color: 'white', fontFamily: 'Share Tech Mono', fontSize: '0.8rem', borderRadius: '4px' }}
                                            itemStyle={{ color: 'var(--primary-color)' }}
                                        />
                                        <Bar dataKey="value" fill="url(#colorUv)" radius={[2, 2, 0, 0]} barSize={28}>
                                            <defs>
                                                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={1} />
                                                    <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0.3} />
                                                </linearGradient>
                                            </defs>
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Category Donut */}
                    <div className="col-lg-3">
                        <div className="glass-card p-4 h-100 rounded d-flex flex-column">
                            <div className="border-bottom border-secondary opacity-75 pb-2 mb-3">
                                <h6 className="fw-bold text-white tech-font mb-1 text-uppercase tracking-widest">CATEGORY SCAN</h6>
                                <small className="text-muted font-monospace text-uppercase" style={{ fontSize: '0.7rem' }}>TYPE CLASSIFICATION</small>
                            </div>
                            <div className="flex-grow-1" style={{ minHeight: '200px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statsData.categoryStats || []}
                                            cx="50%" cy="45%"
                                            innerRadius={55} outerRadius={75}
                                            paddingAngle={4}
                                            dataKey="count" nameKey="_id"
                                            stroke="none"
                                        >
                                            {(statsData.categoryStats || []).map((_, i) => (
                                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid var(--primary-color)', color: 'white', fontFamily: 'Share Tech Mono', fontSize: '0.8rem', borderRadius: '4px' }}
                                        />
                                        <Legend iconType="square" wrapperStyle={{ fontFamily: 'Share Tech Mono', fontSize: '10px', paddingTop: '15px', color: 'var(--text-muted)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Priority horizontal bar */}
                    <div className="col-lg-4">
                        <div className="glass-card p-4 h-100 rounded d-flex flex-column">
                            <div className="border-bottom border-secondary opacity-75 pb-2 mb-3">
                                <div className="d-flex align-items-center gap-2 mb-1">
                                    <FaExclamationCircle size={14} className="text-neon-red" />
                                    <h6 className="fw-bold text-white tech-font mb-0 text-uppercase tracking-widest">PRIORITY QUEUE</h6>
                                </div>
                                <small className="text-muted font-monospace text-uppercase" style={{ fontSize: '0.7rem' }}>SEVERITY ANALYSIS</small>
                            </div>
                            <div className="flex-grow-1" style={{ minHeight: '200px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={statsData.priorityStats || []} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="2 4" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="_id" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'Share Tech Mono', fontWeight: 'bold' }} width={80} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid var(--text-muted)', color: 'white', fontFamily: 'Share Tech Mono', fontSize: '0.8rem', borderRadius: '4px' }}
                                        />
                                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={22}>
                                            {(statsData.priorityStats || []).map((entry, i) => (
                                                <Cell key={i} fill={
                                                    entry._id === 'Emergency' ? 'var(--accent-red)' :
                                                        entry._id === 'High' ? '#f97316' :
                                                            entry._id === 'Medium' ? '#f59e0b' : 'var(--neon-green)'
                                                } />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── AI System Status (horizontal row card) ── */}
                <div className="glass-card p-4 rounded" style={{ border: '1px solid var(--primary-color)' }}>
                    <div className="d-flex align-items-center gap-4 flex-wrap flex-md-nowrap">
                        <div className="d-flex align-items-center gap-4 pe-md-4 border-end-md border-secondary">
                            <AIAnimation size="small" />
                            <div>
                                <h6 className="fw-bold text-white tech-font mb-1 text-uppercase tracking-widest">AI SURVEILLANCE</h6>
                                <small className={`tech-font fw-bold text-uppercase ${aiHealth.allOnline ? "text-muted" : "text-neon-red"}`} style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>
                                    CORE v2.1 // {aiHealth.allOnline ? 'ALL NODES STABLE' : 'NODE OFFLINE'}
                                </small>
                            </div>
                        </div>
                        
                        <div className="d-flex align-items-center gap-4 flex-wrap flex-grow-1 justify-content-md-between px-md-3">
                            {[
                                { label: 'TEXT_SCANNER', status: aiHealth.classifier.status, detail: aiHealth.classifier.latency ? `${aiHealth.classifier.latency}ms` : '', color: aiHealth.classifier.color },
                                { label: 'DEEP_FAKE_DETECTOR', status: aiHealth.fakeDetection.status, detail: aiHealth.fakeDetection.latency ? `${aiHealth.fakeDetection.latency}ms` : '', color: aiHealth.fakeDetection.color },
                                { label: 'IMG_PROCESSOR', status: aiHealth.captioning.status, detail: aiHealth.captioning.latency ? `${aiHealth.captioning.latency}ms` : '', color: aiHealth.captioning.color },
                                { label: 'AVG_LATENCY', status: aiHealth.avgLatency ? `${aiHealth.avgLatency}ms` : 'N/A', detail: '', color: aiHealth.avgLatency ? 'var(--primary-color)' : 'var(--text-muted)' },
                            ].map((s, i) => (
                                <div key={i} className="d-flex flex-column align-items-start border p-3 rounded" style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.05) !important' }}>
                                    <p className="fw-bold text-muted tech-font mb-1 d-flex align-items-center gap-2 text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.1em' }}>
                                        <FaCircle size={6} style={{ color: s.color, boxShadow: `0 0 5px ${s.color}` }} /> {s.label}
                                    </p>
                                    <div className="d-flex align-items-end gap-3 w-100">
                                        <span className="tech-font fw-bold text-white" style={{ fontSize: '1rem' }}>{s.status}</span>
                                        {s.detail && <span className="tech-font text-secondary" style={{ fontSize: '0.7rem' }}>{s.detail}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthorityDashboard;
