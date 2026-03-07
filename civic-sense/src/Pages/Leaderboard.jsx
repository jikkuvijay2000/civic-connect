import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaTrophy, FaClipboardList, FaCheckCircle, FaGift,
    FaStar, FaCopy, FaCheck, FaLock, FaUnlock,
    FaMedal, FaFire, FaTicketAlt, FaArrowUp
} from 'react-icons/fa';
import api from '../api/axios';
import { notify } from '../utils/notify';

/* ── Medal colours ── */
const MEDAL = [
    { color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d', shadow: 'rgba(245,158,11,0.25)', label: '1st' },
    { color: '#94a3b8', bg: '#f1f5f9', border: '#cbd5e1', shadow: 'rgba(148,163,184,0.25)', label: '2nd' },
    { color: '#cd7f32', bg: '#fff7ed', border: '#fdba74', shadow: 'rgba(205,127,50,0.25)', label: '3rd' },
];

/* ── Promo Reveal badge ── */
const PromoBadge = ({ code }) => {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="d-flex align-items-center gap-2 px-3 py-2 rounded-3"
            style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', border: '1px solid rgba(251,191,36,0.3)' }}
        >
            <FaTicketAlt size={13} style={{ color: '#fbbf24' }} />
            <span className="fw-bold" style={{ fontFamily: 'monospace', color: '#fbbf24', letterSpacing: '0.12em', fontSize: '0.9rem' }}>
                {code}
            </span>
            <button
                onClick={copy}
                className="btn btn-sm p-0 border-0 ms-1 d-flex align-items-center"
                style={{ color: copied ? '#10b981' : '#64748b' }}
            >
                {copied ? <FaCheck size={12} /> : <FaCopy size={12} />}
            </button>
        </motion.div>
    );
};

/* ── Reward Card for Leaderboard ── */
const RewardCard = ({ reward, myPoints, onClaim }) => {
    const { _id, title, description, image, pointsRequired, claimedByMe, promoCode, claimCount } = reward;
    const canClaim = myPoints >= pointsRequired;
    const [claiming, setClaiming] = useState(false);

    const pct = Math.min((myPoints / pointsRequired) * 100, 100);

    const handleClaim = async () => {
        setClaiming(true);
        try { await onClaim(_id); }
        finally { setClaiming(false); }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-4 border overflow-hidden h-100"
            style={{
                boxShadow: claimedByMe
                    ? '0 6px 24px rgba(16,185,129,0.12)'
                    : canClaim
                        ? '0 6px 24px rgba(99,102,241,0.12)'
                        : '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'box-shadow 0.25s',
                borderColor: claimedByMe ? '#6ee7b7' : canClaim ? '#a5b4fc' : '#e2e8f0',
            }}
        >
            {/* Image */}
            <div
                className="position-relative overflow-hidden"
                style={{
                    height: '150px',
                    background: image ? 'transparent'
                        : claimedByMe ? 'linear-gradient(135deg, #10b981, #059669)'
                            : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                }}
            >
                {image
                    ? <img src={image} alt={title} className="w-100 h-100 object-fit-cover" />
                    : <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                        <FaGift size={46} style={{ color: 'rgba(255,255,255,0.35)' }} />
                    </div>
                }

                {/* Status pill (top-left) */}
                <div
                    className="position-absolute d-flex align-items-center gap-1 px-2 py-1 rounded-pill fw-bold"
                    style={{
                        top: '10px', left: '10px',
                        background: claimedByMe
                            ? 'rgba(16,185,129,0.92)'
                            : canClaim
                                ? 'rgba(99,102,241,0.92)'
                                : 'rgba(15,23,42,0.8)',
                        color: 'white', fontSize: '0.65rem',
                        backdropFilter: 'blur(6px)',
                    }}
                >
                    {claimedByMe ? <><FaCheck size={9} /> Claimed</> : canClaim ? <><FaUnlock size={9} /> Unlocked</> : <><FaLock size={9} /> Locked</>}
                </div>

                {/* Points badge (top-right) */}
                <div
                    className="position-absolute d-flex align-items-center gap-1 px-2 py-1 rounded-pill fw-bold"
                    style={{
                        top: '10px', right: '10px',
                        background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(6px)',
                        color: '#fbbf24', fontSize: '0.72rem',
                        border: '1px solid rgba(251,191,36,0.25)',
                    }}
                >
                    <FaStar size={9} /> {Number(pointsRequired).toLocaleString()}
                </div>
            </div>

            {/* Body */}
            <div className="p-4 d-flex flex-column" style={{ flex: 1 }}>
                <h6 className="fw-bold text-dark mb-1" style={{ fontSize: '0.95rem' }}>{title}</h6>
                <p className="text-muted mb-3" style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
                    {description.length > 90 ? description.slice(0, 90) + '…' : description}
                </p>

                {/* Progress bar (if not yet claimed) */}
                {!claimedByMe && (
                    <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <small className="text-muted" style={{ fontSize: '0.72rem' }}>Your progress</small>
                            <small className="fw-bold" style={{ fontSize: '0.72rem', color: canClaim ? '#6366f1' : '#94a3b8' }}>
                                {Math.min(myPoints, pointsRequired).toLocaleString()} / {Number(pointsRequired).toLocaleString()} pts
                            </small>
                        </div>
                        <div className="rounded-pill overflow-hidden" style={{ height: '6px', background: '#f1f5f9' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                style={{
                                    height: '100%', borderRadius: '999px',
                                    background: canClaim
                                        ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                                        : 'linear-gradient(90deg, #94a3b8, #cbd5e1)',
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Claimed: show promo code */}
                {claimedByMe && promoCode && (
                    <div className="mb-3">
                        <small className="text-muted d-block mb-2" style={{ fontSize: '0.7rem', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Your Code</small>
                        <PromoBadge code={promoCode} />
                    </div>
                )}

                <div className="mt-auto d-flex align-items-center justify-content-between">
                    {/* Claim count */}
                    <small className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                        <FaMedal size={10} style={{ color: '#f59e0b' }} />
                        {claimCount} claim{claimCount !== 1 ? 's' : ''}
                    </small>

                    {/* CTA button */}
                    {claimedByMe ? (
                        <span
                            className="badge rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-1"
                            style={{ background: '#ecfdf5', color: '#10b981', border: '1px solid #6ee7b7', fontSize: '0.75rem' }}
                        >
                            <FaCheck size={10} /> Claimed
                        </span>
                    ) : canClaim ? (
                        <motion.button
                            whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(99,102,241,0.4)' }}
                            whileTap={{ scale: 0.96 }}
                            onClick={handleClaim}
                            disabled={claiming}
                            className="btn btn-sm fw-bold px-4 py-2 d-flex align-items-center gap-2"
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                color: 'white', border: 'none', borderRadius: '10px',
                                fontSize: '0.82rem',
                                boxShadow: '0 3px 10px rgba(99,102,241,0.3)',
                            }}
                        >
                            {claiming
                                ? <><span className="spinner-border spinner-border-sm" /> Claiming…</>
                                : <><FaGift size={11} /> Claim</>
                            }
                        </motion.button>
                    ) : (
                        <span
                            className="text-muted d-flex align-items-center gap-1"
                            style={{ fontSize: '0.74rem' }}
                        >
                            <FaLock size={10} />
                            Need {(pointsRequired - myPoints).toLocaleString()} more pts
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

/* ── Main Leaderboard Page ── */
const Leaderboard = () => {
    const [activeTab, setActiveTab] = useState('rankings');
    const [leaders, setLeaders] = useState([]);
    const [rewards, setRewards] = useState([]);
    const [myPoints, setMyPoints] = useState(0);
    const [loading, setLoading] = useState(true);
    const [rewardsLoading, setRewardsLoading] = useState(false);
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

    useEffect(() => {
        const fetchLeaders = async () => {
            try {
                const res = await api.get('/user/leaderboard');
                if (res.data.status === 'success') setLeaders(res.data.data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchLeaders();
    }, []);

    const fetchRewards = useCallback(async () => {
        setRewardsLoading(true);
        try {
            const res = await api.get('/reward/list');
            if (res.data.status === 'success') {
                setRewards(res.data.data);
                setMyPoints(res.data.myPoints || 0);
            }
        } catch (e) { console.error(e); }
        finally { setRewardsLoading(false); }
    }, []);

    useEffect(() => {
        if (activeTab === 'rewards') fetchRewards();
    }, [activeTab, fetchRewards]);

    const handleClaim = async (id) => {
        try {
            const res = await api.post(`/reward/claim/${id}`);
            if (res.data.status === 'success') {
                notify('success', `🎉 Reward claimed! Code: ${res.data.promoCode}`);
                fetchRewards();
            }
        } catch (err) {
            notify('error', err?.response?.data?.message || 'Failed to claim reward');
        }
    };

    const top3 = leaders.slice(0, 3);
    const myRank = leaders.findIndex(l => l._id === currentUser?._id);
    const myLeaderEntry = myRank >= 0 ? leaders[myRank] : null;

    const TABS = [
        { id: 'rankings', label: 'Rankings', icon: FaTrophy },
        { id: 'rewards', label: 'Rewards', icon: FaGift },
    ];

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
            <div className="spinner-border" style={{ color: '#6366f1' }} role="status">
                <span className="visually-hidden">Loading…</span>
            </div>
        </div>
    );

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh' }}>

            {/* ── Hero header ── */}
            <div
                className="px-5 py-5"
                style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-4 mb-4">
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                            <FaTrophy size={20} style={{ color: '#f59e0b' }} />
                            <h3 className="fw-bold mb-0" style={{ color: 'white' }}>Civic Leaderboard</h3>
                        </div>
                        <p className="mb-0" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem' }}>
                            Top contributors making civic impact — and earning real rewards.
                        </p>
                    </div>

                    {/* My stats pill */}
                    {myLeaderEntry && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="d-flex align-items-center gap-4 px-5 py-3 rounded-4"
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            <div className="text-center">
                                <div className="fw-bold" style={{ color: '#f59e0b', fontSize: '1.4rem' }}>#{myRank + 1}</div>
                                <small style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Rank</small>
                            </div>
                            <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.1)' }} />
                            <div className="text-center">
                                <div className="fw-bold" style={{ color: '#6ee7b7', fontSize: '1.4rem' }}>{(myLeaderEntry.impactPoints || 0).toLocaleString()}</div>
                                <small style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Points</small>
                            </div>
                            <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.1)' }} />
                            <div className="text-center">
                                <div className="fw-bold" style={{ color: '#a5b4fc', fontSize: '1.4rem' }}>{myLeaderEntry.resolvedComplaints || 0}</div>
                                <small style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Resolved</small>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Tabs */}
                <div className="d-flex gap-2">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="btn fw-bold d-flex align-items-center gap-2 px-4 py-2"
                            style={{
                                borderRadius: '10px',
                                background: activeTab === tab.id
                                    ? 'rgba(255,255,255,0.12)'
                                    : 'transparent',
                                color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.4)',
                                border: activeTab === tab.id
                                    ? '1px solid rgba(255,255,255,0.18)'
                                    : '1px solid transparent',
                                fontSize: '0.85rem',
                                transition: 'all 0.15s',
                            }}
                        >
                            <tab.icon size={13} />
                            {tab.label}
                            {tab.id === 'rewards' && rewards.filter(r => !r.claimedByMe && myPoints >= r.pointsRequired).length > 0 && (
                                <span
                                    className="badge rounded-pill"
                                    style={{ background: '#f59e0b', color: '#0f172a', fontSize: '0.65rem', padding: '2px 7px', marginLeft: '2px' }}
                                >
                                    {rewards.filter(r => !r.claimedByMe && myPoints >= r.pointsRequired).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Tab content ── */}
            <AnimatePresence mode="wait">

                {/* ── Rankings Tab ── */}
                {activeTab === 'rankings' && (
                    <motion.div
                        key="rankings"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="px-5 py-5"
                    >
                        {/* Podium */}
                        {top3.length >= 3 && (
                            <div className="d-flex align-items-end justify-content-center gap-4 mb-5">
                                {[1, 0, 2].map((rank) => {
                                    const user = top3[rank];
                                    if (!user) return null;
                                    const m = MEDAL[rank];
                                    const sizes = [{ avatar: 60, podium: '140px', name: '0.88rem' }, { avatar: 76, podium: '180px', name: '1rem' }, { avatar: 52, podium: '115px', name: '0.8rem' }];
                                    const { avatar, podium, name: nameSz } = sizes[rank === 0 ? 1 : rank === 1 ? 0 : 2];
                                    return (
                                        <motion.div
                                            key={user._id}
                                            initial={{ opacity: 0, y: 40 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: rank * 0.1, type: 'spring', stiffness: 200 }}
                                            className="d-flex flex-column align-items-center"
                                            style={{ flex: rank === 0 ? '0 0 200px' : '0 0 160px' }}
                                        >
                                            <div
                                                className="rounded-circle d-flex align-items-center justify-content-center fw-bold mb-2"
                                                style={{
                                                    width: `${avatar}px`, height: `${avatar}px`,
                                                    background: m.bg,
                                                    border: `3px solid ${m.border}`,
                                                    fontSize: `${avatar * 0.022}rem`,
                                                    color: m.color,
                                                    boxShadow: `0 0 0 6px ${m.shadow}`,
                                                    fontSize: rank === 0 ? '1.5rem' : '1.1rem',
                                                }}
                                            >
                                                {user.userName.charAt(0).toUpperCase()}
                                            </div>
                                            <p className="fw-bold text-dark mb-0 text-center" style={{ fontSize: nameSz }}>{user.userName}</p>
                                            <small className="text-muted mb-2 d-flex align-items-center gap-1" style={{ fontSize: '0.74rem' }}>
                                                <FaFire size={9} style={{ color: '#f59e0b' }} /> {user.impactPoints.toLocaleString()} pts
                                            </small>
                                            <div
                                                className="w-100 rounded-top-3 d-flex align-items-center justify-content-center fw-bold"
                                                style={{ height: podium, background: m.bg, border: `2px solid ${m.border}`, color: m.color, fontSize: '1.3rem', boxShadow: `0 -4px 20px ${m.shadow}` }}
                                            >
                                                {m.label}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Full table */}
                        <div className="bg-white rounded-4 border overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                            <div className="d-flex align-items-center px-5 py-3 border-bottom" style={{ background: '#f8fafc' }}>
                                {[
                                    { label: 'Rank', style: { width: '60px' } },
                                    { label: 'Citizen', style: { flex: 1 } },
                                    { label: 'Reports', style: { width: '90px', textAlign: 'center' } },
                                    { label: 'Resolved', style: { width: '90px', textAlign: 'center' } },
                                    { label: 'Impact', style: { width: '110px', textAlign: 'right' } },
                                ].map((h, i) => (
                                    <div key={i} className="text-muted fw-bold text-uppercase"
                                        style={{ fontSize: '0.67rem', letterSpacing: '0.08em', ...h.style }}>
                                        {h.label}
                                    </div>
                                ))}
                            </div>

                            {leaders.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <FaTrophy size={36} style={{ opacity: 0.15, marginBottom: '12px' }} />
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
                                            <div style={{ width: '60px' }}>
                                                {idx < 3 ? (
                                                    <span className="badge rounded-pill fw-bold px-2 py-1"
                                                        style={{ background: medal.bg, color: medal.color, border: `1px solid ${medal.border}`, fontSize: '0.75rem' }}>
                                                        #{idx + 1}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted fw-bold small">#{idx + 1}</span>
                                                )}
                                            </div>
                                            <div className="d-flex align-items-center gap-3 flex-grow-1">
                                                <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                                    style={{
                                                        width: '40px', height: '40px',
                                                        background: isMe ? '#eef2ff' : '#f1f5f9',
                                                        color: isMe ? '#6366f1' : '#64748b',
                                                        fontSize: '0.95rem',
                                                        border: isMe ? '2px solid #a5b4fc' : '2px solid #e2e8f0',
                                                    }}>
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
                                            <div style={{ width: '90px', textAlign: 'center' }}>
                                                <span className="d-flex align-items-center justify-content-center gap-1 text-muted fw-medium small">
                                                    <FaClipboardList size={11} /> {user.totalComplaints}
                                                </span>
                                            </div>
                                            <div style={{ width: '90px', textAlign: 'center' }}>
                                                <span className="d-flex align-items-center justify-content-center gap-1 fw-medium small" style={{ color: '#10b981' }}>
                                                    <FaCheckCircle size={11} /> {user.resolvedComplaints}
                                                </span>
                                            </div>
                                            <div style={{ width: '110px', textAlign: 'right' }}>
                                                <span className="badge rounded-pill fw-bold px-3 py-2"
                                                    style={{
                                                        background: isMe ? '#eef2ff' : '#f1f5f9',
                                                        color: isMe ? '#6366f1' : '#475569',
                                                        border: `1px solid ${isMe ? '#a5b4fc' : '#e2e8f0'}`,
                                                        fontSize: '0.82rem',
                                                    }}>
                                                    {user.impactPoints.toLocaleString()}
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ── Rewards Tab ── */}
                {activeTab === 'rewards' && (
                    <motion.div
                        key="rewards"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="px-5 py-5"
                    >
                        {/* My points banner */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-4 rounded-4 d-flex align-items-center justify-content-between gap-3"
                            style={{
                                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            }}
                        >
                            <div>
                                <p className="mb-1 fw-bold" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                    Your Impact Points
                                </p>
                                <div className="d-flex align-items-baseline gap-2">
                                    <span className="fw-bold" style={{ color: '#fbbf24', fontSize: '2.2rem', lineHeight: 1 }}>
                                        {myPoints.toLocaleString()}
                                    </span>
                                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.83rem' }}>pts</span>
                                </div>
                                <small style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.74rem' }}>
                                    Earn more by filing and resolving complaints
                                </small>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                                <div className="text-center">
                                    <div className="fw-bold" style={{ color: '#6ee7b7', fontSize: '1.3rem' }}>
                                        {rewards.filter(r => r.claimedByMe).length}
                                    </div>
                                    <small style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Claimed</small>
                                </div>
                                <div style={{ width: '1px', height: '36px', background: 'rgba(255,255,255,0.1)' }} />
                                <div className="text-center">
                                    <div className="fw-bold" style={{ color: '#a5b4fc', fontSize: '1.3rem' }}>
                                        {rewards.filter(r => !r.claimedByMe && myPoints >= r.pointsRequired).length}
                                    </div>
                                    <small style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Unlocked</small>
                                </div>
                            </div>
                        </motion.div>

                        {rewardsLoading ? (
                            <div className="d-flex justify-content-center py-5">
                                <div className="spinner-border" style={{ color: '#6366f1' }} role="status">
                                    <span className="visually-hidden">Loading rewards…</span>
                                </div>
                            </div>
                        ) : rewards.length === 0 ? (
                            <div className="text-center py-5 bg-white rounded-4 border">
                                <FaGift size={40} style={{ color: '#6366f1', opacity: 0.25, marginBottom: '12px' }} />
                                <h6 className="fw-bold text-dark mb-1">No Rewards Available Yet</h6>
                                <p className="text-muted small mb-0">
                                    Keep contributing — the authority will add rewards soon!
                                </p>
                            </div>
                        ) : (
                            <div className="row g-4">
                                {rewards.map((reward, idx) => (
                                    <div className="col-md-6 col-xl-4" key={reward._id}>
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.07 }}
                                            className="h-100"
                                        >
                                            <RewardCard
                                                reward={reward}
                                                myPoints={myPoints}
                                                onClaim={handleClaim}
                                            />
                                        </motion.div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
};

export default Leaderboard;
