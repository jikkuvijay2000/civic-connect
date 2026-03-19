import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaExclamationCircle, FaTerminal } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const TYPE_META = {
    success: { icon: FaCheckCircle, color: '#a3e635', bg: 'rgba(163,230,53,0.08)', border: 'rgba(163,230,53,0.25)' },
    warning: { icon: FaExclamationTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
    error:   { icon: FaExclamationCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)' },
    info:    { icon: FaInfoCircle, color: '#aa00ff', bg: 'rgba(170,0,255,0.08)', border: 'rgba(170,0,255,0.25)' },
};
const getMeta = (type) => TYPE_META[type] || TYPE_META.info;

const timeAgo = (dateString) => {
    const s = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (s < 60) return `${s}s AGO`;
    if (s < 3600) return `${Math.floor(s/60)}M AGO`;
    if (s < 86400) return `${Math.floor(s/3600)}H AGO`;
    return `${Math.floor(s/86400)}D AGO`;
};

const NotificationDropdown = ({ notifications, unreadCount, onMarkRead, isOpen, toggleDropdown }) => (
    <div className="position-relative">
        {/* Bell button */}
        <button
            onClick={toggleDropdown}
            className="btn p-0 position-relative d-flex align-items-center justify-content-center"
            style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: isOpen ? 'rgba(170,0,255,0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isOpen ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)'}`,
                transition: 'all 0.2s',
            }}
        >
            <FaBell size={16} style={{ color: isOpen ? '#aa00ff' : '#a1a1aa' }} />
            {unreadCount > 0 && (
                <span style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    background: '#ef4444', color: '#fff',
                    fontSize: '9px', fontWeight: 'bold',
                    borderRadius: '10px', padding: '1px 5px',
                    fontFamily: "'Share Tech Mono', monospace",
                    border: '1px solid rgba(0,0,0,0.4)',
                    minWidth: '16px', textAlign: 'center',
                }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </button>

        {/* Dropdown panel */}
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    style={{
                        position: 'absolute', right: 0, top: 'calc(100% + 10px)',
                        width: '340px', zIndex: 9999,
                        background: 'rgba(10, 10, 16, 0.97)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(170,0,255,0.3)',
                        borderRadius: '8px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 20px rgba(170,0,255,0.15)',
                        overflow: 'hidden',
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(170,0,255,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaTerminal size={11} style={{ color: '#aa00ff' }} />
                            <span style={{ color: '#fff', fontFamily: "'Share Tech Mono', monospace", fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.15em' }}>
                                INTEL FEED
                            </span>
                        </div>
                        {unreadCount > 0 && (
                            <span style={{
                                background: 'rgba(170,0,255,0.15)', color: '#aa00ff',
                                border: '1px solid rgba(170,0,255,0.4)',
                                borderRadius: '3px', padding: '1px 7px',
                                fontSize: '9px', fontFamily: "'Share Tech Mono',monospace", letterSpacing: '0.1em',
                            }}>
                                {unreadCount} NEW
                            </span>
                        )}
                    </div>

                    {/* List */}
                    <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '32px', textAlign: 'center', color: '#4b5563', fontFamily: "'Share Tech Mono',monospace", fontSize: '11px', letterSpacing: '0.1em' }}>
                                NO INCOMING SIGNALS
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                const meta = getMeta(notif.type);
                                const Icon = meta.icon;
                                return (
                                    <div
                                        key={notif._id}
                                        onClick={() => onMarkRead(notif._id)}
                                        style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                                            background: !notif.isRead ? 'rgba(170,0,255,0.04)' : 'transparent',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s',
                                            borderLeft: !notif.isRead ? `2px solid ${meta.color}` : '2px solid transparent',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                        onMouseLeave={e => e.currentTarget.style.background = !notif.isRead ? 'rgba(170,0,255,0.04)' : 'transparent'}
                                    >
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                            <div style={{
                                                width: '28px', height: '28px', borderRadius: '50%',
                                                background: meta.bg, border: `1px solid ${meta.border}`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0, marginTop: '2px',
                                            }}>
                                                <Icon size={11} style={{ color: meta.color }} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ margin: '0 0 4px', color: '#e5e7eb', fontSize: '12px', lineHeight: 1.5, fontFamily: "'Rajdhani',sans-serif" }}>
                                                    {notif.message}
                                                </p>
                                                <span style={{ color: '#4b5563', fontSize: '9px', fontFamily: "'Share Tech Mono',monospace", letterSpacing: '0.1em' }}>
                                                    {timeAgo(notif.createdAt)}
                                                </span>
                                                {notif.link && (
                                                    <Link to={notif.link} style={{ display: 'block', color: '#aa00ff', fontSize: '10px', marginTop: '4px', fontFamily: "'Share Tech Mono',monospace", textDecoration: 'none', letterSpacing: '0.1em' }}>
                                                        → VIEW INTEL
                                                    </Link>
                                                )}
                                            </div>
                                            {!notif.isRead && (
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: meta.color, flexShrink: 0, marginTop: '6px', boxShadow: `0 0 6px ${meta.color}` }} />
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

export default NotificationDropdown;
