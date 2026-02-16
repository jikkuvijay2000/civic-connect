import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaHome, FaExclamationTriangle, FaHandsHelping, FaTrophy, FaUserCircle, FaSearch, FaBell, FaComment, FaHeart, FaShare } from 'react-icons/fa';
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
            user: "City Council",
            avatar: "https://ui-avatars.com/api/?name=City+Council&background=0D6EFD&color=fff",
            time: "2 hours ago",
            content: "We are organizing a cleanliness drive this Sunday at Central Park. Join us to make our city cleaner!",
            image: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=1974&auto=format&fit=crop",
            likes: 124,
            comments: 45
        },
        {
            id: 2,
            user: "Traffic Police",
            avatar: "https://ui-avatars.com/api/?name=Traffic+Police&background=dc3545&color=fff",
            time: "5 hours ago",
            content: "Heavy traffic alert on MG Road due to ongoing maintenance. Please take alternative routes.",
            image: null,
            likes: 89,
            comments: 12
        },
        {
            id: 3,
            user: "Green Club",
            avatar: "https://ui-avatars.com/api/?name=Green+Club&background=198754&color=fff",
            time: "1 day ago",
            content: "Tree plantation drive success! Thanks to all the volunteers who showed up.",
            image: "https://images.unsplash.com/photo-1542601906990-24ccd54b8606?q=80&w=2070&auto=format&fit=crop",
            likes: 256,
            comments: 67
        }
    ];

    const handleNavClick = (name, path) => {
        if (path) {
            navigate(path);
        } else {
            notify("info", `Navigating to ${name}...`);
        }
    };

    const handleFeatureClick = (feature) => {
        notify("info", `${feature} feature coming soon!`);
    };

    const handleLike = (postUser) => {
        notify("success", `You liked ${postUser}'s post!`);
    };

    const handleShare = () => {
        notify("success", "Post link copied to clipboard!");
    };



    return (
        <div className="container-fluid min-vh-100 bg-light">
            <div className="row">
                {/* Left Sidebar */}
                <div className="col-lg-2 d-none d-lg-flex flex-column justify-content-between p-4 bg-white border-end vh-100 sticky-top top-0">
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-5">
                            <img src={civicLogo} alt="Logo" width="40" />
                            <h5 className="fw-bold mb-0 text-primary ls-1">CIVIC SENSE</h5>
                        </div>

                        <nav className="nav flex-column gap-3">
                            <div onClick={() => handleNavClick('Home', '/dashboard')} className="nav-link text-primary fw-bold d-flex align-items-center gap-3 p-3 rounded-3 bg-primary-subtle cursor-pointer">
                                <FaHome size={20} /> Home
                            </div>
                            <div onClick={() => handleNavClick('Report Issue', '/report-issue')} className="nav-link text-secondary fw-medium d-flex align-items-center gap-3 p-3 rounded-3 hover-bg-light cursor-pointer">
                                <FaExclamationTriangle size={20} /> Report Issue
                            </div>
                            <div onClick={() => handleNavClick('Contributions', '/contributions')} className="nav-link text-secondary fw-medium d-flex align-items-center gap-3 p-3 rounded-3 hover-bg-light cursor-pointer">
                                <FaHandsHelping size={20} /> Contributions
                            </div>
                            <div onClick={() => handleNavClick('Leaderboard', '/dashboard/leaderboard')} className="nav-link text-secondary fw-medium d-flex align-items-center gap-3 p-3 rounded-3 hover-bg-light cursor-pointer">
                                <FaTrophy size={20} /> Leaderboard
                            </div>
                        </nav>
                    </div>

                    <div onClick={() => handleNavClick('Profile')} className="d-flex align-items-center gap-3 p-3 rounded-3 border bg-light mt-auto cursor-pointer hover-shadow-sm transition-all">
                        <FaUserCircle size={40} className="text-secondary" />
                        <div>
                            <h6 className="mb-0 fw-bold text-dark">{user?.userName || 'User'}</h6>
                            <small className="text-muted">{user?.role || 'Citizen'}</small>
                        </div>
                    </div>
                </div>

                {/* Center Feed */}
                <div className="col-lg-7 col-md-12 p-0">
                    {/* Top Bar */}
                    <div className="d-flex justify-content-between align-items-center p-4 bg-white border-bottom sticky-top top-0 z-1">
                        <h4 className="fw-bold mb-0 text-dark">Home</h4>
                        <div className="input-group w-50 d-none d-md-flex">
                            <span className="input-group-text bg-light border-0"><FaSearch className="text-muted" /></span>
                            <input type="text" className="form-control bg-light border-0" placeholder="Search issues, places..." />
                        </div>
                        <FaBell size={20} className="text-secondary cursor-pointer hover-text-primary" />
                    </div>

                    <div className="p-4" style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <div className="d-flex align-items-center gap-3 mb-4">
                            <h5 className="fw-bold text-secondary mb-0">What's happening in your area today</h5>
                            <div className="flex-grow-1 border-bottom"></div>
                        </div>

                        {/* Create Post Input */}
                        <div className="bg-white rounded-4 shadow-sm p-3 mb-4 d-flex gap-3 align-items-center" onClick={() => handleFeatureClick('Create Post')}>
                            <FaUserCircle size={40} className="text-secondary" />
                            <input type="text" readOnly className="form-control hover-bg-light border-0 bg-light rounded-pill px-3 py-2 cursor-pointer" placeholder="Spot a civic issue? Share it here..." />
                        </div>

                        {/* Feed Posts */}
                        <div className="d-flex flex-column gap-4 pb-5">
                            {feedPosts.map(post => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-4 shadow-sm overflow-hidden"
                                >
                                    <div className="p-3 d-flex align-items-center gap-3">
                                        <img src={post.avatar} alt="User" className="rounded-circle" width="40" height="40" />
                                        <div>
                                            <h6 className="mb-0 fw-bold text-dark">{post.user}</h6>
                                            <small className="text-muted">{post.time}</small>
                                        </div>
                                    </div>

                                    <div className="px-3 pb-3">
                                        <p className="mb-3 text-secondary">{post.content}</p>
                                        {post.image && (
                                            <div className="rounded-3 overflow-hidden mb-3">
                                                <img src={post.image} alt="Post Content" className="w-100 object-fit-cover" style={{ maxHeight: '400px' }} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="d-flex border-top p-2 bg-light">
                                        <button onClick={() => handleLike(post.user)} className="btn flex-grow-1 text-secondary d-flex align-items-center justify-content-center gap-2 hover-bg-white border-0">
                                            <FaHeart /> {post.likes}
                                        </button>
                                        <button onClick={() => handleFeatureClick('Comment')} className="btn flex-grow-1 text-secondary d-flex align-items-center justify-content-center gap-2 hover-bg-white border-0">
                                            <FaComment /> {post.comments}
                                        </button>
                                        <button onClick={handleShare} className="btn flex-grow-1 text-secondary d-flex align-items-center justify-content-center gap-2 hover-bg-white border-0">
                                            <FaShare /> Share
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Calendar Column */}
                <div className="col-lg-3 d-none d-lg-block bg-light p-4 border-start vh-100 sticky-top top-0 overflow-auto">
                    <Calendar />

                    <div className="mt-4">
                        <h6 className="fw-bold text-muted mb-3">Suggested for you</h6>
                        <div className="bg-white rounded-4 shadow-sm p-3 mb-3 d-flex gap-3 align-items-center">
                            <div className="rounded-circle bg-primary-subtle text-primary p-2">
                                <FaHandsHelping size={20} />
                            </div>
                            <div>
                                <h6 className="mb-0 text-dark small fw-bold">Volunteer Group</h6>
                                <p className="mb-0 text-muted small" style={{ fontSize: '11px' }}>Join local community helpers</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DashboardUser;