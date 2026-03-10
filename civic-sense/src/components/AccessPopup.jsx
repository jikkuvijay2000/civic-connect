import React from 'react';
import { FaShieldAlt } from 'react-icons/fa';

/**
 * AccessPopup component blocks the screen if a user tries to access a dashboard
 * they are not authorized for. It forces them to click a button which reloads
 * the page (or navigates to their respective dashboard).
 */
const AccessPopup = ({ message, targetUrl }) => {
    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 99999,
                background: 'rgba(10, 15, 30, 0.85)',
                backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
        >
            <div
                style={{
                    background: '#fff', borderRadius: '20px', maxWidth: '400px', width: '90%',
                    padding: '40px', textAlign: 'center',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                }}
            >
                <div style={{
                    width: 70, height: 70, borderRadius: '50%', background: '#fee2e2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px', fontSize: 30, color: '#ef4444'
                }}>
                    <FaShieldAlt />
                </div>
                <h3 style={{ fontWeight: 800, color: '#0f172a', marginBottom: 15 }}>Access Denied</h3>
                <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: 30 }}>
                    {message}
                </p>
                <button
                    onClick={() => {
                        window.location.href = targetUrl;
                    }}
                    style={{
                        width: '100%', padding: '14px', background: '#3b82f6', color: '#fff',
                        border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer',
                        transition: 'opacity 0.2s'
                    }}
                >
                    Go to My Dashboard
                </button>
            </div>
        </div>
    );
};

export default AccessPopup;
