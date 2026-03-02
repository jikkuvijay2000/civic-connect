import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';

const SessionOverlay = () => {
    const [showOverlay, setShowOverlay] = useState(false);
    const [originalUserId, setOriginalUserId] = useState(null);

    useEffect(() => {
        const updateOriginalUser = () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    setOriginalUserId(user._id || user.userEmail);
                } catch (e) {
                    // Ignore parse errors
                }
            } else {
                setOriginalUserId(null);
            }
        };

        // Capture initial user on mount
        updateOriginalUser();

        // Listen for storage events from OTHER tabs
        const handleStorageChange = (e) => {
            if (e.key === 'user') {
                const newUserStr = e.newValue;

                // If user logged out from another tab
                if (!newUserStr) {
                    setShowOverlay(true);
                    return;
                }

                try {
                    const newUser = JSON.parse(newUserStr);
                    const newUserId = newUser._id || newUser.userEmail;

                    console.log('SessionOverlay: Storage change detected', { originalUserId, newUserId });

                    // If the user changed to a different user completely
                    if (originalUserId && newUserId !== originalUserId) {
                        console.log('SessionOverlay: User mismatch! Showing overlay.');
                        setShowOverlay(true);
                    }
                } catch (err) {
                    console.error('SessionOverlay: Error parsing new user string', err);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Also, we need to know when THIS tab logs in so we set originalUserId correctly
        // We can do this by listening to a custom event, or just polling periodically, 
        // or patching localStorage.setItem.
        // Let's just poll every 2 seconds to make sure originalUserId is up to date 
        // with whatever THIS tab set it to.
        const interval = setInterval(() => {
            // Only update if we don't already have one, or to keep it fresh
            // If the overlay is already showing, don't update originalUserId
            if (!showOverlay) {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    try {
                        const user = JSON.parse(userStr);
                        const currentId = user._id || user.userEmail;
                        if (currentId !== originalUserId) {
                            console.log('SessionOverlay: Polling updated originalUserId to', currentId);
                            setOriginalUserId(currentId);
                        }
                    } catch (e) { }
                }
            }
        }, 1000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        }
    }, [originalUserId, showOverlay]);

    const handleReload = () => {
        // Instead of a simple reload which might keep them on a forbidden route
        // for the new user, redirect them to the home/login page to re-authenticate
        // or let the app route them correctly.
        window.location.href = '/';
    };

    return (
        <AnimatePresence>
            {showOverlay && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.85)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 999999, // Super high z-index to cover everything
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '24px'
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            background: 'white',
                            borderRadius: '20px',
                            padding: '40px',
                            maxWidth: '440px',
                            width: '100%',
                            textAlign: 'center',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: '#fef2f2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px'
                        }}>
                            <FaExclamationTriangle size={28} color="#ef4444" />
                        </div>

                        <h3 style={{
                            color: '#0f172a',
                            fontWeight: 800,
                            fontSize: '1.5rem',
                            marginBottom: '12px'
                        }}>
                            Session Changed
                        </h3>

                        <p style={{
                            color: '#64748b',
                            fontSize: '0.95rem',
                            lineHeight: 1.6,
                            marginBottom: '32px'
                        }}>
                            The logged-in user has changed in another tab. Please reload the page to continue with the current session.
                        </p>

                        <button
                            onClick={handleReload}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)',
                                transition: 'transform 0.1s'
                            }}
                            onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                            onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <FaRedo size={14} /> Reload Page
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SessionOverlay;
