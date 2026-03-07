import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';

/**
 * SessionOverlay
 *
 * Shows a blocking overlay ONLY when the same browser profile (same localStorage)
 * switches to a *different* logged-in user in another same-profile tab.
 *
 * Incognito / private windows have completely isolated storage and NEVER share
 * storage events with normal windows, so two different users in
 * normal + incognito will never interfere with each other.
 */
const SessionOverlay = () => {
    const [showOverlay, setShowOverlay] = useState(false);

    // Use a ref so handlers always see the latest value without triggering re-renders
    const originalUserIdRef = useRef(null);
    const overlayShownRef = useRef(false);

    useEffect(() => {
        // --- Capture this tab's user on mount ---
        const readCurrentUser = () => {
            try {
                const raw = localStorage.getItem('user');
                if (!raw) return null;
                const u = JSON.parse(raw);
                return u._id || u.userEmail || null;
            } catch {
                return null;
            }
        };

        originalUserIdRef.current = readCurrentUser();

        /**
         * The browser fires `window.storage` ONLY for changes made by OTHER
         * tabs/windows in the SAME profile — never for this tab's own writes,
         * and never across normal ↔ incognito boundaries.
         */
        const handleStorageChange = (e) => {
            // We only care about the 'user' key
            if (e.key !== 'user') return;

            // If the overlay is already up, nothing more to do
            if (overlayShownRef.current) return;

            const prevUserId = originalUserIdRef.current;

            // Another tab cleared the session (logged out)
            if (!e.newValue) {
                // Only block if THIS tab was logged in as someone
                if (prevUserId) {
                    overlayShownRef.current = true;
                    setShowOverlay(true);
                }
                return;
            }

            // Another tab logged in as a *different* user
            try {
                const newUser = JSON.parse(e.newValue);
                const newUserId = newUser._id || newUser.userEmail || null;

                if (prevUserId && newUserId && newUserId !== prevUserId) {
                    overlayShownRef.current = true;
                    setShowOverlay(true);
                }
            } catch {
                // Malformed value — ignore
            }
        };

        /**
         * Update our ref when THIS tab changes its own session (login/logout
         * within this tab), so we always compare against the correct baseline.
         * We patch localStorage.setItem instead of polling to avoid the stale-
         * closure bug of setInterval + state.
         */
        const originalSetItem = localStorage.setItem.bind(localStorage);
        localStorage.setItem = function (key, value) {
            originalSetItem(key, value);

            if (key === 'user' && !overlayShownRef.current) {
                try {
                    const u = JSON.parse(value);
                    originalUserIdRef.current = u._id || u.userEmail || null;
                } catch { }
            }
        };

        const originalRemoveItem = localStorage.removeItem.bind(localStorage);
        localStorage.removeItem = function (key) {
            originalRemoveItem(key);

            if (key === 'user' && !overlayShownRef.current) {
                originalUserIdRef.current = null;
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            // Restore original localStorage methods
            localStorage.setItem = originalSetItem;
            localStorage.removeItem = originalRemoveItem;
        };
    }, []); // Run once on mount — no deps needed because we use refs

    const handleReload = () => {
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
                        backgroundColor: 'rgba(15, 23, 42, 0.88)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 999999,
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
                            Another tab in this window logged in as a different user.
                            Reload to continue with the current session.
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
