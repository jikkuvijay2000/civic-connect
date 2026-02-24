import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaBell, FaUserCircle, FaHeart, FaComment, FaShare, FaHandsHelping, FaImage, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import Calendar from '../Components/Calendar';
import NotificationDropdown from '../components/NotificationDropdown';
import EmergencyAlertModal from '../components/EmergencyAlertModal';
import { notify } from '../utils/notify';
import { initiateSocketConnection, subscribeToNotifications, subscribeToAlerts, disconnectSocket } from '../utils/socketService';
import AIAnimation from '../Components/AIAnimation';
import api from '../api/axios';

const DashboardHome = () => {
    // State for feed
    const [feedPosts, setFeedPosts] = useState([]);
    const [loadingPosts, setLoadingPosts] = useState(true);

    // Notifications State
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    // Stats State
    const [userStats, setUserStats] = useState({ impactPoints: 0, totalComplaints: 0, resolvedComplaints: 0 });

    // Fetch posts on mount
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await api.get('/community-post');
                setFeedPosts(response.data);
            } catch (error) {
                console.error("Error fetching posts:", error);
                // notify("error", "Could not load feed");
            } finally {
                setLoadingPosts(false);
            }
        };

        const fetchNotifications = async () => {
            try {
                const response = await api.get('/user/notifications');
                setNotifications(response.data.data.notifications);
                setUnreadCount(response.data.data.unreadCount);
            } catch (error) {
                console.error("Error fetching notifications:", error);
            }
        };

        const fetchStats = async () => {
            try {
                const response = await api.get('/user/stats');
                if (response.data.data) {
                    setUserStats(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching stats:", error);
            }
        };

        fetchPosts();
        fetchNotifications();
        fetchStats();

        // Initialize Socket
        initiateSocketConnection();

        subscribeToNotifications((err, data) => {
            if (data) {
                setNotifications(prev => [data, ...prev]);
                setUnreadCount(prev => prev + 1);
                notify("info", `New Notification: ${data.message}`);
            }
        });

        subscribeToAlerts((err, data) => {
            if (data) {
                setFeedPosts(prev => [data, ...prev]);
                notify("warning", `New Alert: ${data.title}`);
            }
        });

        return () => {
            disconnectSocket();
        };
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.put(`/user/notifications/${id}/read`);
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking read:", error);
        }
    };


    const timeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setUser(storedUser);
        }
    }, []);

    const [alertModalOpen, setAlertModalOpen] = useState(false);
    const [currentAlert, setCurrentAlert] = useState(null);

    // Fetch posts on mount
    useEffect(() => {
        // ... previous fetch logic ...

        // ... socket logic ...
        subscribeToAlerts((err, data) => {
            if (data) {
                setFeedPosts(prev => [data, ...prev]);

                // Trigger Red Popup
                setCurrentAlert(data);
                setAlertModalOpen(true);

                // Also add to notifications
                const newNotification = {
                    _id: Date.now(), // Temporary ID
                    message: `ALERT: ${data.title}`,
                    type: 'warning',
                    createdAt: new Date().toISOString(),
                    isRead: false
                };
                setNotifications(prev => [newNotification, ...prev]);
                setUnreadCount(prev => prev + 1);
            }
        });

        // ... cleanup ...
    }, []);

    return (
        <div className="row m-0 bg-body min-vh-100">
            <EmergencyAlertModal
                isOpen={alertModalOpen}
                onClose={() => setAlertModalOpen(false)}
                alertData={currentAlert}
            />
            {/* ... rest of the dashboard ... */}
            {/* Center Feed */}
            <div className="col-lg-9 col-md-12 p-0 position-relative">
                {/* Top Bar - Sticky & Blurred */}
                <div className="d-flex justify-content-between align-items-center px-5 py-3 sticky-top top-0 z-2"
                    style={{ background: 'rgba(248, 250, 252, 0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>

                    <div>
                        <h4 className="fw-bold mb-0 text-dark ls-tight">Dashboard</h4>
                        <small className="text-muted">Welcome back, {user?.userName || 'User'}!</small>
                    </div>

                    <div className="d-flex align-items-center gap-4">
                        <div className="input-group d-none d-md-flex align-items-center bg-white rounded-pill border px-3 py-2 shadow-sm" style={{ width: '300px' }}>
                            <FaSearch className="text-muted me-2" />
                            <input type="text" className="form-control border-0 p-0 shadow-none bg-transparent" placeholder="Search issues, places..." />
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

                <div className="px-5 py-4 mx-auto" style={{ maxWidth: '900px' }}>

                    {/* Create Post Widget */}
                    {/* Stats Widget */}
                    <div className="row g-4 mb-5">
                        <div className="col-md-4">
                            <div className="bg-surface rounded-custom-xl shadow-custom-sm p-4 border border-light hover-scale h-100 d-flex align-items-center gap-3">
                                <div className="rounded-circle bg-primary-subtle text-primary p-3">
                                    <FaHeart size={24} />
                                </div>
                                <div>
                                    <h3 className="fw-bold text-dark mb-0">{userStats.impactPoints}</h3>
                                    <small className="text-muted text-uppercase ls-wide fw-bold" style={{ fontSize: '0.7rem' }}>Impact Points</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="bg-surface rounded-custom-xl shadow-custom-sm p-4 border border-light hover-scale h-100 d-flex align-items-center gap-3">
                                <div className="rounded-circle bg-warning-subtle text-warning p-3">
                                    <FaExclamationCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="fw-bold text-dark mb-0">{userStats.totalComplaints}</h3>
                                    <small className="text-muted text-uppercase ls-wide fw-bold" style={{ fontSize: '0.7rem' }}>Issues Reported</small>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="bg-surface rounded-custom-xl shadow-custom-sm p-4 border border-light hover-scale h-100 d-flex align-items-center gap-3">
                                <div className="rounded-circle bg-success-subtle text-success p-3">
                                    <FaCheckCircle size={24} />
                                </div>
                                <div>
                                    <h3 className="fw-bold text-dark mb-0">{userStats.resolvedComplaints}</h3>
                                    <small className="text-muted text-uppercase ls-wide fw-bold" style={{ fontSize: '0.7rem' }}>Issues Resolved</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-3 mb-4">
                        <h6 className="fw-bold text-secondary text-uppercase ls-wide" style={{ fontSize: '0.8rem' }}>Community Feed</h6>
                        <div className="flex-grow-1 border-bottom"></div>
                    </div>

                    {/* Feed Posts */}
                    <div className="d-flex flex-column gap-4 pb-5">
                        {loadingPosts ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : feedPosts.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <p>No updates from authorities yet.</p>
                            </div>
                        ) : (
                            feedPosts.map((post, index) => (
                                <motion.div
                                    key={post._id || index}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-surface rounded-custom-xl shadow-custom-md overflow-hidden border border-light"
                                >
                                    <div className="p-4 d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center gap-3">
                                            <img
                                                src={`https://ui-avatars.com/api/?name=${post.author}&background=random&color=fff`}
                                                alt="User"
                                                className="rounded-circle shadow-sm"
                                                width="48"
                                                height="48"
                                            />
                                            <div>
                                                <h6 className="mb-0 fw-bold text-dark">{post.author} <span className="badge bg-primary-subtle text-primary border border-primary-subtle ms-2" style={{ fontSize: '0.65rem' }}>{post.role}</span></h6>
                                                <small className="text-muted d-block" style={{ fontSize: '0.85rem' }}>{timeAgo(post.createdAt)}</small>
                                            </div>
                                        </div>
                                        <span className={`badge rounded-pill px-3 py-2 fw-normal ${post.tag === 'Alert' ? 'bg-danger-subtle text-danger' : post.tag === 'Event' ? 'bg-success-subtle text-success' : 'bg-light text-secondary'}`}>
                                            {post.tag}
                                        </span>
                                    </div>

                                    <div className="px-4 pb-2 mb-3">
                                        <h5 className="fw-bold text-dark mb-2">{post.title}</h5>
                                        <p className="mb-3 text-secondary" style={{ fontSize: '1rem', lineHeight: '1.6' }}>{post.content}</p>
                                        {post.image && (
                                            <div className="rounded-custom-xl overflow-hidden mb-3 shadow-sm position-relative">
                                                <img src={post.image} alt="Post Content" className="w-100 object-fit-cover transition-fast hover-scale-img" style={{ maxHeight: '450px' }} />
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Right Calendar Column - Sticky */}
            <div className="col-lg-3 d-none d-lg-block bg-body p-4 border-start vh-100 sticky-top top-0 overflow-auto z-1">
                <Calendar />

                <div className="mt-5">
                    <div className="bg-surface rounded-custom shadow-custom-sm p-4 text-center border border-light mb-4">
                        <AIAnimation size="small" />
                        <h6 className="fw-bold text-dark mt-3 mb-1">Civic AI Monitor</h6>
                        <p className="text-muted extra-small mb-0" style={{ fontSize: '11px' }}>Analyzing community trends locally</p>
                    </div>

                    <h6 className="fw-bold text-secondary mb-4 text-uppercase ls-wide" style={{ fontSize: '0.8rem' }}>Suggested Groups</h6>

                    <div className="bg-surface rounded-custom shadow-custom-sm p-3 mb-3 d-flex gap-3 align-items-center hover-scale border border-light cursor-pointer transition-fast">
                        <div className="rounded-circle bg-primary-light text-primary-custom p-3 d-flex align-items-center justify-content-center">
                            <FaHandsHelping size={18} />
                        </div>
                        <div>
                            <h6 className="mb-0 text-dark small fw-bold">Volunteer Corps</h6>
                            <p className="mb-0 text-muted extra-small" style={{ fontSize: '11px' }}>Join 500+ locals</p>
                        </div>
                        <button className="btn btn-sm btn-outline-primary ms-auto rounded-pill px-3" style={{ fontSize: '10px' }}>Join</button>
                    </div>

                    <div className="bg-surface rounded-custom shadow-custom-sm p-3 mb-3 d-flex gap-3 align-items-center hover-scale border border-light cursor-pointer transition-fast">
                        <div className="rounded-circle bg-success-subtle text-success p-3 d-flex align-items-center justify-content-center">
                            <FaSearch size={18} />
                        </div>
                        <div>
                            <h6 className="mb-0 text-dark small fw-bold">Safety Watch</h6>
                            <p className="mb-0 text-muted extra-small" style={{ fontSize: '11px' }}>Nighborhood patrol</p>
                        </div>
                        <button className="btn btn-sm btn-outline-success ms-auto rounded-pill px-3" style={{ fontSize: '10px' }}>Join</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
