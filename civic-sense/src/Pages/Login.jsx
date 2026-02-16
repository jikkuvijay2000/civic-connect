import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import civicCleaning from '../assets/realistic_cleaning.png';
import civicRecycling from '../assets/realistic_recycling.png';
import civicTraffic from '../assets/realistic_traffic.png';
import civicCommunity from '../assets/realistic_community.png';
import civicLogo from '../assets/civic_sense_symbolic_logo.png';
import { notify } from '../utils/notify';
import api from '../api/axios';
import { BASE_URL } from '../services/baseUrl';

const Login = () => {
    // Carousel images with captions
    const carouselImages = [
        { src: civicCleaning, caption: 'Community Clean-Up', description: 'Together we keep our city clean' },
        { src: civicRecycling, caption: 'Waste Segregation', description: 'Recycle for a greener tomorrow' },
        { src: civicTraffic, caption: 'Follow Traffic Rules', description: 'Safe streets, happy community' },
        { src: civicCommunity, caption: 'Help Each Other', description: 'Compassion builds strong communities' }
    ];

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    // Auto-rotate carousel every 4 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % carouselImages.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [carouselImages.length]);

    useEffect(() => {
        api.get('/user/csrf-token');
    }, []);

    // Animation variants
    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    const [loginDetails, setLoginDetails] = useState({
        userEmail: '',
        userPassword: ''
    });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    const isFormValid = loginDetails.userEmail &&
        loginDetails.userPassword &&
        emailRegex.test(loginDetails.userEmail);

    const getCsrfToken = () => {
        return document.cookie
            .split('; ')
            .find(row => row.startsWith('csrfToken='))
            ?.split('=')[1];
    }
    const handleLogin = async (e) => {
        e.preventDefault();

        if (!loginDetails.userEmail || !loginDetails.userPassword) {
            notify("error", "All fields are required");
            return;
        }

        if (!emailRegex.test(loginDetails.userEmail)) {
            notify("error", "Invalid email address");
            return;
        }

        setIsLoading(true);

        try {
            const response = await api.post('user/login', {
                userEmail: loginDetails.userEmail,
                userPassword: loginDetails.userPassword
            }, {
                headers: {
                    'x-csrf-token': getCsrfToken()
                }
            });

            if (response.status === 200) {
                const { user } = response.data;
                localStorage.setItem('user', JSON.stringify(user));
                notify("success", "Login successful!");
                setTimeout(() => {
                    if (user.role === 'Authority') {
                        navigate('/authority');
                    } else {
                        navigate('/dashboard');
                    }
                }, 1000);
            } else {
                notify("error", response.data.message || "Login failed");
            }
        } catch (err) {
            notify("error", err.response?.data?.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    }



    return (
        <div className="container-fluid min-vh-100 p-0 position-relative overflow-hidden">
            <div className="row g-0 min-vh-100 position-relative" style={{ zIndex: 1 }}>
                {/* Left Column: Full-Height Image Carousel */}
                <div className="col-lg-6 d-none d-lg-block position-relative overflow-hidden p-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentImageIndex}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1 }}
                            className="position-absolute w-100 h-100 top-0 start-0"
                        >
                            <img
                                src={carouselImages[currentImageIndex].src}
                                className="w-100 h-100"
                                alt={carouselImages[currentImageIndex].caption}
                                style={{ objectFit: 'cover', objectPosition: 'center' }}
                            />
                            {/* Dark Overlay Gradient */}
                            <div className="position-absolute top-0 start-0 w-100 h-100"
                                style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)' }}>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Content Overlay */}
                    <div className="position-absolute bottom-0 start-0 w-100 p-5 text-white z-2">
                        <motion.div
                            key={currentImageIndex + "-text"}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <h2 className="display-5 fw-bold mb-3">{carouselImages[currentImageIndex].caption}</h2>
                            <p className="lead fw-light mb-4 text-white-50">{carouselImages[currentImageIndex].description}</p>
                        </motion.div>

                        {/* Carousel Indicators */}
                        <div className="d-flex gap-2">
                            {carouselImages.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className="border-0 rounded-pill p-0"
                                    style={{
                                        width: index === currentImageIndex ? '30px' : '10px',
                                        height: '4px',
                                        backgroundColor: index === currentImageIndex ? '#fff' : 'rgba(255,255,255,0.4)',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Form */}
                <div className="col-lg-6 d-flex flex-column justify-content-center position-relative" style={{ background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)' }}>
                    {/* Decorative Circle */}
                    <div className="position-absolute top-0 end-0 p-5 d-none d-lg-block">
                        <div className="rounded-circle bg-primary opacity-10" style={{ width: '200px', height: '200px', transform: 'translate(50%, -50%)' }}></div>
                    </div>

                    <motion.div
                        className="mx-auto w-100"
                        style={{ maxWidth: '600px', padding: '3rem' }}
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                    >
                        <div className="mb-4">
                            {/* <div className="mb-4">
                                <img src={civicLogo} alt="Civic Sense Logo" height="150" />
                            </div> */}
                            <h1 className="display-6 fw-bold text-dark mb-2">Welcome Back</h1>
                            <p className="text-muted">Log in to continue your journey with Civic Sense.</p>
                        </div>

                        <form>
                            <div className="mb-4">
                                <label htmlFor="emailInput" className="form-label fw-semibold text-secondary small text-uppercase ls-1">Email Address</label>
                                <input
                                    type="email"
                                    className="form-control input-modern"
                                    id="emailInput"
                                    placeholder="name@example.com"
                                    autoComplete="username"
                                    onChange={(e) => setLoginDetails({ ...loginDetails, userEmail: e.target.value })}
                                />
                            </div>

                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label htmlFor="passwordInput" className="form-label fw-semibold text-secondary small text-uppercase ls-1 mb-0">Password</label>
                                    <a href="/forgot-password" className="small text-primary text-decoration-none fw-semibold">Forgot Password?</a>
                                </div>
                                <input
                                    type="password"
                                    className="form-control input-modern"
                                    id="passwordInput"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    onChange={(e) => setLoginDetails({ ...loginDetails, userPassword: e.target.value })}
                                />
                            </div>

                            <motion.button
                                type="submit"
                                className={`btn btn-primary w-100 btn-modern mb-4 text-white ${!isFormValid ? 'disabled' : ''}`}
                                whileHover={isFormValid ? { scale: 1.02 } : {}}
                                whileTap={isFormValid ? { scale: 0.98 } : {}}
                                onClick={handleLogin}
                                disabled={!isFormValid || isLoading}
                            >
                                {isLoading ? (
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                ) : null}
                                {isLoading ? 'Logging In...' : 'Log In'}
                            </motion.button>

                            <div className="text-center">
                                <p className="text-muted mb-3">
                                    Don't have an account? <a href="/register" className="text-primary fw-bold text-decoration-none">Sign Up</a>
                                </p>
                                <div className="d-flex justify-content-center gap-3 small">
                                    <a href="/documentation" className="text-muted text-decoration-none hover-underline">Terms of Service</a>
                                    <span className="text-muted">•</span>
                                    <a href="/documentation" className="text-muted text-decoration-none hover-underline">Privacy Policy</a>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    )
};

export default Login;