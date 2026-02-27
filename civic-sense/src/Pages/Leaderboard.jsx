import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaTrophy, FaMedal, FaCheckCircle, FaClipboardList, FaStar } from 'react-icons/fa';
import api from '../api/axios';

const MEDAL = [
    { color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d', label: '1st' },
    { color: '#94a3b8', bg: '#f1f5f9', border: '#cbd5e1', label: '2nd' },
    { color: '#cd7f32', bg: '#fff7ed', border: '#fdba74', label: '3rd' },
];

const Leaderboard = () => {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get('/user/leaderboard');
                if (res.data.status === 'success') setLeaders(res.data.data);
            } catch (e) {
                console.error('Error fetching leaderboard:', e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const top3 = leaders.slice(0, 3);
    const rest = leaders.slice(3);
    const myRank = leaders.findIndex(l => l._id === currentUser?._id);

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
        </div>
    );

    return (
        <div className="p-5" style={{ background: '#f8fafc', minHeight: '100vh' }}>

            {/* ── Header ── */}
            <div className="mb-6 mb-5">
                <h2 className="fw-bold text-dark ls-tight mb-1">Leaderboard</h2>
                <p className="text-muted mb-0">Top contributors making civic impact in their community.</p>
            </div>

            {/* ── Your rank banner (if logged in and on list) ── */}
            {myRank >= 0 && (
                <div className="mb-4 px-4 py-3 rounded-3 border d-flex align-items-center gap-3" style={{ background: '#eef2ff', borderColor: '#a5b4fc' }}>
                    <FaStar style={{ color: '#6366f1' }} />
                    <span className="fw-bold text-dark small">Your rank:</span>
                    <span className="badge rounded-pill px-3" style={{ background: '#6366f1', color: 'white', fontSize: '0.82rem' }}>#{myRank + 1}</span>
                    <span className="text-muted small ms-auto">{leaders[myRank]?.impactPoints} impact points</span>
                </div>
            )}

            {/* ── Podium (top 3) ── */}
            {top3.length >= 3 && (
                <div className="d-flex align-items-end justify-content-center gap-4 mb-5">
                    {/* 2nd */}
                    {[1, 0, 2].map((rank) => {
                        const user = top3[rank];
                        if (!user) return null;
                        const m = MEDAL[rank];
                        const heights = ['140px', '180px', '120px'];
                        const podiumH = heights[rank === 0 ? 1 : rank === 1 ? 0 : 2];
                        return (
                            <motion.div
                                key={user._id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: rank * 0.12 }}
                                className="d-flex flex-column align-items-center"
                                style={{ flex: rank === 0 ? '0 0 200px' : '0 0 160px' }}
                            >
                                {/* Avatar */}
                                <div
                                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold mb-2"
                                    style={{
                                        width: rank === 0 ? '68px' : '52px',
                                        height: rank === 0 ? '68px' : '52px',
                                        background: m.bg,
                                        border: `3px solid ${m.border}`,
                                        fontSize: rank === 0 ? '1.4rem' : '1.1rem',
                                        color: m.color,
                                    }}
                                >
                                    {user.userName.charAt(0).toUpperCase()}
                                </div>
                                <p className="fw-bold text-dark mb-0 text-center" style={{ fontSize: rank === 0 ? '0.95rem' : '0.82rem' }}>{user.userName}</p>
                                <small className="text-muted mb-2" style={{ fontSize: '0.74rem' }}>{user.impactPoints} pts</small>
                                {/* Podium block */}
                                <div
                                    className="w-100 rounded-top-3 d-flex align-items-center justify-content-center fw-bold"
                                    style={{ height: podiumH, background: m.bg, border: `2px solid ${m.border}`, color: m.color, fontSize: '1.2rem' }}
                                >
                                    {m.label}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* ── Full table ── */}
            <div className="bg-white rounded-4 border overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {/* Header row */}
                <div className="d-flex align-items-center px-5 py-3 border-bottom" style={{ background: '#f8fafc' }}>
                    <span className="text-muted fw-bold text-uppercase small" style={{ width: '60px', fontSize: '0.7rem', letterSpacing: '0.07em' }}>Rank</span>
                    <span className="text-muted fw-bold text-uppercase small flex-grow-1" style={{ fontSize: '0.7rem', letterSpacing: '0.07em' }}>Citizen</span>
                    <span className="text-muted fw-bold text-uppercase small text-center" style={{ width: '90px', fontSize: '0.7rem', letterSpacing: '0.07em' }}>Reports</span>
                    <span className="text-muted fw-bold text-uppercase small text-center" style={{ width: '90px', fontSize: '0.7rem', letterSpacing: '0.07em' }}>Resolved</span>
                    <span className="text-muted fw-bold text-uppercase small text-end" style={{ width: '110px', fontSize: '0.7rem', letterSpacing: '0.07em' }}>Impact</span>
                </div>

                {leaders.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                        <FaTrophy size={36} style={{ opacity: 0.2, marginBottom: '12px' }} />
                        <p className="small mb-0">No contributors yet. Be the first!</p>
                    </div>
                ) : (
                    leaders.map((user, idx) => {
                        const isMe = user._id === currentUser?._id;
                        const medal = MEDAL[idx];
                        return (
                            <motion.div
                                key={user._id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: Math.min(idx * 0.06, 0.5) }}
                                className="d-flex align-items-center px-5 py-3 border-bottom"
                                style={{
                                    background: isMe ? '#eef2ff' : idx % 2 === 0 ? 'white' : '#fafafa',
                                    borderLeft: isMe ? '4px solid #6366f1' : '4px solid transparent',
                                    transition: 'background 0.15s',
                                }}
                            >
                                {/* Rank */}
                                <div style={{ width: '60px' }}>
                                    {idx < 3 ? (
                                        <span
                                            className="badge rounded-pill fw-bold px-2 py-1"
                                            style={{ background: medal.bg, color: medal.color, border: `1px solid ${medal.border}`, fontSize: '0.75rem' }}
                                        >
                                            #{idx + 1}
                                        </span>
                                    ) : (
                                        <span className="text-muted fw-bold small">#{idx + 1}</span>
                                    )}
                                </div>

                                {/* User */}
                                <div className="d-flex align-items-center gap-3 flex-grow-1">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                        style={{
                                            width: '40px', height: '40px',
                                            background: isMe ? '#eef2ff' : '#f1f5f9',
                                            color: isMe ? '#6366f1' : '#64748b',
                                            fontSize: '0.95rem',
                                            border: isMe ? '2px solid #a5b4fc' : '2px solid #e2e8f0',
                                        }}
                                    >
                                        {user.userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="fw-bold text-dark small">{user.userName}</span>
                                            {isMe && <span className="badge rounded-pill px-2" style={{ background: '#eef2ff', color: '#6366f1', border: '1px solid #a5b4fc', fontSize: '0.65rem' }}>You</span>}
                                        </div>
                                        <small className="text-muted" style={{ fontSize: '0.74rem' }}>{user.userEmail}</small>
                                    </div>
                                </div>

                                {/* Reports */}
                                <div className="text-center" style={{ width: '90px' }}>
                                    <span className="d-flex align-items-center justify-content-center gap-1 text-muted fw-medium small">
                                        <FaClipboardList size={11} />
                                        {user.totalComplaints}
                                    </span>
                                </div>

                                {/* Resolved */}
                                <div className="text-center" style={{ width: '90px' }}>
                                    <span className="d-flex align-items-center justify-content-center gap-1 fw-medium small" style={{ color: '#10b981' }}>
                                        <FaCheckCircle size={11} />
                                        {user.resolvedComplaints}
                                    </span>
                                </div>

                                {/* Impact points */}
                                <div className="text-end" style={{ width: '110px' }}>
                                    <span
                                        className="badge rounded-pill fw-bold px-3 py-2"
                                        style={{ background: isMe ? '#eef2ff' : '#f1f5f9', color: isMe ? '#6366f1' : '#475569', border: `1px solid ${isMe ? '#a5b4fc' : '#e2e8f0'}`, fontSize: '0.82rem' }}
                                    >
                                        {user.impactPoints.toLocaleString()}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
