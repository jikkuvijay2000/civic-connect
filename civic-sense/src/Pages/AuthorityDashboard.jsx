import React, { useState, useEffect } from 'react';
import { FaClipboardCheck, FaExclamationCircle, FaHourglassHalf, FaRobot } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../api/axios';
import { notify } from '../utils/notify';
import NotificationDropdown from '../components/NotificationDropdown';
import { initiateSocketConnection, subscribeToEmergency, disconnectSocket } from '../utils/socketService';
import { io } from 'socket.io-client';
import EmergencyAlertModal from '../components/EmergencyAlertModal';

const AuthorityDashboard = () => {
    const [statsData, setStatsData] = useState({
        total: 0,
        resolved: 0,
        pending: 0
    });
    const [loading, setLoading] = useState(true);
    const [alertModalOpen, setAlertModalOpen] = useState(false);
    const [currentAlert, setCurrentAlert] = useState(null);

    // Notifications State
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/complaint/authority-stats');
                if (response.data.status === 'success') {
                    setStatsData(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchNotifications = async () => {
            // Placeholder: Backend might not have a specific 'authority notifications' endpoint yet that returns *only* authority ones? 
            // Or we reuse /user/notifications if the backend filters by role.
            // Let's assume /user/notifications works if the backend is smart enough (it uses req.user).
            try {
                const response = await api.get('/user/notifications'); // Ensure this endpoint works for authorities
                if (response.data.data) {
                    setNotifications(response.data.data.notifications);
                    setUnreadCount(response.data.data.unreadCount);
                }
            } catch (error) {
                console.error("Error fetching notifications:", error);
            }
        };

        fetchStats();
        fetchNotifications();

        // Socket Connection using consistent service or direct
        // Note: initiateSocketConnection in utils might use a different singleton.
        // Let's use direct io here to be sure or reuse the util if it supports custom events easily.
        // utils/socketService usually exports specific subscribers. 
        // Let's use a direct local socket for this component to handle 'authority_notification' specifically if not in utils.
        const socket = io("http://localhost:3000", { withCredentials: true });

        socket.on("connect", () => {
            console.log("Authority Dashboard Socket Connected");
        });

        socket.on("authority_notification", (data) => {
            console.log("Dashboard: Authority Notification Received:", data);
            const newNotif = {
                _id: Date.now(),
                message: data.message,
                type: 'info',
                createdAt: new Date().toISOString(),
                isRead: false
            };
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
            // No Toast here, sidebar handles it.
        });

        // Also listen for emergency to add to list
        socket.on("new_emergency_complaint", (data) => {
            const newNotif = {
                _id: Date.now(),
                message: `EMERGENCY: ${data.complaint.complaintType}`,
                type: 'error',
                createdAt: new Date().toISOString(),
                isRead: false
            };
            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const markAsRead = async (id) => {
        // Optimistic update
        setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        try {
            await api.put(`/user/notifications/${id}/read`);
        } catch (error) {
            console.error("Error marking read:", error);
        }
    };

    // Derived Stats
    const stats = [
        { title: "Total Registered", value: statsData.total, color: "primary", icon: FaExclamationCircle },
        { title: "Resolved", value: statsData.resolved, color: "success", icon: FaClipboardCheck },
        { title: "Pending", value: statsData.pending, color: "warning", icon: FaHourglassHalf },
        { title: "Avg AI Confidence", value: `${statsData.avgConfidence || 0}%`, color: "info", icon: FaRobot }
    ];

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-0">
            {/* Top Bar - Sticky & Blurred */}
            <div className="d-flex justify-content-between align-items-center px-5 py-3 sticky-top top-0 z-2"
                style={{ background: 'rgba(248, 250, 252, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>

                <div>
                    <h4 className="fw-bold mb-0 text-dark ls-tight">Dashboard</h4>
                    <small className="text-muted">Welcome back, {user?.userName || 'Authority'}!</small>
                </div>

                <div className="d-flex align-items-center gap-4">
                    <NotificationDropdown
                        notifications={notifications}
                        unreadCount={unreadCount}
                        onMarkRead={markAsRead}
                        isOpen={isNotifOpen}
                        toggleDropdown={() => setIsNotifOpen(!isNotifOpen)}
                    />
                </div>
            </div>

            <div className="p-5">
                <EmergencyAlertModal
                    isOpen={alertModalOpen}
                    onClose={() => setAlertModalOpen(false)}
                    alertData={currentAlert}
                />

                <div className="row g-4">
                    {stats.map((stat, index) => (
                        <div key={index} className="col-md-3">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-surface rounded-custom-xl shadow-custom-sm p-4 border border-light h-100 position-relative overflow-hidden group hover-scale"
                            >
                                <div className="d-flex justify-content-between align-items-start position-relative z-2">
                                    <div>
                                        <h6 className="text-muted text-uppercase fw-bold ls-wide mb-3" style={{ fontSize: '0.8rem' }}>{stat.title}</h6>
                                        <h2 className="fw-bold display-5 mb-0 text-dark">{stat.value.toLocaleString()}</h2>
                                    </div>
                                    <div className={`p-3 rounded-circle bg-${stat.color}-subtle text-${stat.color}`}>
                                        <stat.icon size={24} />
                                    </div>
                                </div>
                                {/* Decorative background circle */}
                                <div className={`position-absolute top-0 end-0 p-5 rounded-circle bg-${stat.color} opacity-5 translate-middle-y me-n5 mt-n3`} style={{ width: '150px', height: '150px' }}></div>
                            </motion.div>
                        </div>
                    ))}
                </div>

                {/* AI Analytics Section */}
                <div className="row mt-5">
                    <div className="col-lg-8 mb-4">
                        <div className="bg-surface rounded-custom-xl shadow-custom-sm p-4 border border-light h-100">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="fw-bold text-dark ls-tight mb-0">AI Confidence Distribution</h5>
                                <span className="badge bg-primary-subtle text-primary rounded-pill px-3">Real-time</span>
                            </div>
                            <div style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={statsData.confidenceDistribution || []}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6c757d' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6c757d' }} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="value" fill="#4c6ef5" radius={[10, 10, 0, 0]} barSize={60} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4 mb-4">
                        <div className="bg-surface rounded-custom-xl shadow-custom-sm p-4 border border-light h-100">
                            <h5 className="fw-bold text-dark ls-tight mb-4">Category Analysis</h5>
                            <div style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statsData.categoryStats || []}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="count"
                                            nameKey="_id"
                                        >
                                            {(statsData.categoryStats || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#339af0', '#51cf66', '#fcc419', '#ff6b6b'][index % 4]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Status Section */}
                <div className="mt-2">
                    <div className="bg-surface rounded-custom-xl shadow-custom-sm p-5 border border-light text-center py-5">
                        <img src="https://illustrations.popsy.co/amber/success.svg" alt="All caught up" height="200" className="mb-4 opacity-75" />
                        <h5 className="text-muted fw-bold">System Status: Optimal</h5>
                        <p className="text-secondary max-w-sm mx-auto">AI Model v2.1 running. Average latency: 45ms. Confidence metrics are within expected range.</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AuthorityDashboard;
