import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import civicCleaning from '../assets/realistic_cleaning.png';
import civicRecycling from '../assets/realistic_recycling.png';
import civicTraffic from '../assets/realistic_traffic.png';
import civicCommunity from '../assets/realistic_community.png';
import civicLogo from '../assets/civic_sense_symbolic_logo.png';
import { notify } from '../utils/notify';
import axios from 'axios';
import { BASE_URL } from '../services/baseUrl';
// CivicBackground removed as carousel now serves as background

const Register = () => {
    // Carousel images with captions
    const carouselImages = [
        { src: civicCleaning, caption: 'Community Clean-Up', description: 'Together we keep our city clean' },
        { src: civicRecycling, caption: 'Waste Segregation', description: 'Recycle for a greener tomorrow' },
        { src: civicTraffic, caption: 'Follow Traffic Rules', description: 'Safe streets, happy community' },
        { src: civicCommunity, caption: 'Help Each Other', description: 'Compassion builds strong communities' }
    ];

    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Auto-rotate carousel every 4 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % carouselImages.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [carouselImages.length]);

    // Animation variants
    const fadeIn = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    const imageVariants = {
        enter: { opacity: 0, x: 100 },
        center: { opacity: 1, x: 0, transition: { duration: 0.5 } },
        exit: { opacity: 0, x: -100, transition: { duration: 0.5 } }
    };

    const [userDetails, setUserDetails] = useState({
        userName: '',
        userEmail: '',
        userAddress: '',
        userPassword: '',
        userConfirmPassword: '',
        termsChecked: false
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [otp, setOtp] = useState('');

    const navigate = useNavigate();
    const [touched, setTouched] = useState({});

    const handleBlur = (field) => {
        setTouched({ ...touched, [field]: true });
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

    const isEmailValid = emailRegex.test(userDetails.userEmail);
    const isPasswordValid = passwordRegex.test(userDetails.userPassword);
    const doPasswordsMatch = userDetails.userPassword === userDetails.userConfirmPassword;

    const isFormValid = userDetails.userName &&
        userDetails.userAddress &&
        isEmailValid &&
        isPasswordValid &&
        doPasswordsMatch &&
        userDetails.termsChecked;

    const handleRegister = async (e) => {
        e.preventDefault();

        if (!isFormValid) {
            notify("error", "Please fix the errors in the form.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await axios.post(`${BASE_URL}/user/register`, userDetails);
            if (response.status === 200) {
                notify("success", "Registration successful! Please check your email for the OTP.");
                setShowOtp(true);
            } else {
                notify("error", response.data.message);
            }

        } catch (err) {
            notify("error", err.response?.data?.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    }

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        if (!otp || otp.length !== 6) {
            notify("error", "Please enter a valid 6-digit OTP.");
            return;
        }

        setIsVerifying(true);
        try {
            const response = await axios.post(`${BASE_URL}/user/verify-email`, {
                userEmail: userDetails.userEmail,
                otp: otp
            });

            if (response.status === 200) {
                notify("success", "Email verified successfully! Redirecting to login...");
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            }
        } catch (err) {
            notify("error", err.response?.data?.message || "Failed to verify OTP. Please try again.");
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="container-fluid min-vh-100 p-0 position-relative overflow-hidden">
            {/* CivicBackground removed */}
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
                        style={{ maxWidth: '780px', padding: '3rem' }}
                        initial="hidden"
                        animate="visible"
                        variants={fadeIn}
                    >
                        <div className="mb-4">
                            {/* <div className="mb-4">
                            <img src={civicLogo} alt="Civic Sense Logo" height="150" />
                        </div> */}
                            <h1 className="display-6 fw-bold text-dark mb-2">Create Account</h1>
                            <p className="text-muted">Fill in your details to get started with Civic Connect.</p>
                        </div>

                        <form onSubmit={!showOtp ? handleRegister : handleVerifyOtp}>
                            {!showOtp ? (
                                <>
                                    <div className="mb-4">
                                        <label htmlFor="nameInput" className="form-label fw-semibold text-secondary small text-uppercase ls-1">Full Name</label>
                                        <input
                                            type="text"
                                            className="form-control input-modern"
                                            id="nameInput"
                                            placeholder="John Doe"
                                            onChange={(e) => setUserDetails({ ...userDetails, userName: e.target.value })}
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="emailInput" className="form-label fw-semibold text-secondary small text-uppercase ls-1">Email Address</label>
                                        <input
                                            type="email"
                                            className={`form-control input-modern ${touched.userEmail && !isEmailValid ? 'is-invalid' : ''}`}
                                            id="emailInput"
                                            placeholder="name@example.com"
                                            autoComplete="username"
                                            onBlur={() => handleBlur('userEmail')}
                                            onChange={(e) => setUserDetails({ ...userDetails, userEmail: e.target.value })}
                                        />
                                        {touched.userEmail && !isEmailValid && (
                                            <div className="invalid-feedback">
                                                Please enter a valid email address.
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="addressInput" className="form-label fw-semibold text-secondary small text-uppercase ls-1">Address</label>
                                        <textarea
                                            className="form-control input-modern"
                                            id="address"
                                            placeholder="St. 123, City, State, Zip"
                                            onChange={(e) => setUserDetails({ ...userDetails, userAddress: e.target.value })}
                                        />
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-4">
                                            <label htmlFor="passwordInput" className="form-label fw-semibold text-secondary small text-uppercase ls-1">Password</label>
                                            <input
                                                type="password"
                                                className={`form-control input-modern ${touched.userPassword && !isPasswordValid ? 'is-invalid' : ''}`}
                                                id="passwordInput"
                                                placeholder="••••••••"
                                                autoComplete="new-password"
                                                onBlur={() => handleBlur('userPassword')}
                                                onChange={(e) => setUserDetails({ ...userDetails, userPassword: e.target.value })}
                                            />
                                            {touched.userPassword && !isPasswordValid && (
                                                <div className="invalid-feedback" style={{ fontSize: '0.75rem' }}>
                                                    Must contain: 1 Upper, 1 Lower, 1 Number, 1 Special
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-md-6 mb-4">
                                            <label htmlFor="confirmPasswordInput" className="form-label fw-semibold text-secondary small text-uppercase ls-1">Confirm</label>
                                            <input
                                                type="password"
                                                className={`form-control input-modern ${touched.userConfirmPassword && !doPasswordsMatch ? 'is-invalid' : ''}`}
                                                id="confirmPasswordInput"
                                                placeholder="••••••••"
                                                autoComplete="new-password"
                                                onBlur={() => handleBlur('userConfirmPassword')}
                                                onChange={(e) => setUserDetails({ ...userDetails, userConfirmPassword: e.target.value })}
                                            />
                                            {touched.userConfirmPassword && !doPasswordsMatch && (
                                                <div className="invalid-feedback">
                                                    Passwords do not match.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mb-4 form-check">
                                        <input type="checkbox" className="form-check-input" id="termsCheck"
                                            onChange={(e) => setUserDetails({ ...userDetails, termsChecked: e.target.checked })}
                                        />
                                        <label className="form-check-label text-muted small" htmlFor="termsCheck">
                                            I agree to the <a href="#" className="text-decoration-none">Terms of Service</a> & <a href="#" className="text-decoration-none">Privacy Policy</a>
                                        </label>
                                    </div>

                                    <motion.button
                                        type="submit"
                                        className={`btn btn-primary w-100 btn-modern mb-4 text-white ${!isFormValid ? 'disabled' : ''}`}
                                        whileHover={isFormValid ? { scale: 1.02 } : {}}
                                        whileTap={isFormValid ? { scale: 0.98 } : {}}
                                        onClick={handleRegister}
                                        disabled={!isFormValid || isLoading}
                                    >
                                        {isLoading ? (
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        ) : null}
                                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                                    </motion.button>

                                    <div className="text-center">
                                        <p className="text-muted mb-0">
                                            Already have an account? <Link to="/" className="text-primary fw-bold text-decoration-none">Log In</Link>
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center"
                                >
                                    <div className="mb-4">
                                        <div className="bg-primary-light d-inline-block p-3 rounded-circle text-primary-custom mb-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697ZM6.761 8.83l-6.57 4.027A2 2 0 0 0 2 14h12a2 2 0 0 0 1.808-1.144l-6.57-4.027L8 9.586l-1.239-.757Zm3.436-.586L16 11.801V4.697l-5.803 3.546Z" />
                                            </svg>
                                        </div>
                                        <h4 className="fw-bold">Verify Your Email</h4>
                                        <p className="text-muted">We've sent a 6-digit OTP to <strong>{userDetails.userEmail}</strong>. Please enter it below.</p>
                                    </div>

                                    <div className="mb-4">
                                        <input
                                            type="text"
                                            className="form-control form-control-lg text-center fw-bold rounded-custom border-2 text-dark focus-ring-primary"
                                            placeholder="------"
                                            maxLength="6"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            style={{ letterSpacing: '0.5rem', fontSize: '1.5rem' }}
                                        />
                                    </div>

                                    <motion.button
                                        type="submit"
                                        className={`btn btn-primary w-100 btn-modern mb-3 text-white ${otp.length !== 6 ? 'disabled' : ''}`}
                                        whileHover={otp.length === 6 ? { scale: 1.02 } : {}}
                                        whileTap={otp.length === 6 ? { scale: 0.98 } : {}}
                                        onClick={handleVerifyOtp}
                                        disabled={otp.length !== 6 || isVerifying}
                                    >
                                        {isVerifying ? (
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        ) : null}
                                        {isVerifying ? 'Verifying...' : 'Verify Email'}
                                    </motion.button>
                                </motion.div>
                            )}
                        </form>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

export default Register;