import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaTrophy, FaClipboardList, FaCheckCircle, FaGift,
    FaStar, FaCopy, FaCheck, FaLock, FaUnlock,
    FaMedal, FaFire, FaTicketAlt, FaTerminal
} from 'react-icons/fa';
import api from '../api/axios';
import { notify } from '../utils/notify';

/* Medal colours */
const MEDAL = [
    { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: '#f59e0b', shadow: 'rgba(245,158,11,0.25)', label: 'PRIMUS' },
    { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: '#cbd5e1', shadow: 'rgba(148,163,184,0.25)', label: 'SECUNDUS' },
    { color: '#cd7f32', bg: 'rgba(205,127,50,0.1)', border: '#fdba74', shadow: 'rgba(205,127,50,0.25)', label: 'TERTIUS' },
];

/* Promo Reveal badge */
const PromoBadge = ({ code }) => {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="d-flex align-items-center gap-2 px-3 py-2 rounded"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(251,191,36,0.5)' }}>
            <FaTicketAlt size={13} style={{ color: '#fbbf24' }} />
            <span className="fw-bold font-monospace" style={{ color: '#fbbf24', letterSpacing: '0.15em', fontSize: '0.9rem' }}>
                {code}
            </span>
            <button onClick={copy} className="btn btn-sm p-0 border-0 ms-1 d-flex align-items-center" style={{ color: copied ? 'var(--secondary-color)' : 'var(--text-muted)' }}>
                {copied ? <FaCheck size={12} /> : <FaCopy size={12} />}
            </button>
        </motion.div>
    );
};

/* Reward Card */
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
        <motion.div layout initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card overflow-hidden h-100 d-flex flex-column hover-scale"
            style={{
                boxShadow: claimedByMe ? '0 0 20px rgba(163,230,53,0.1)' : canClaim ? '0 0 20px rgba(170,0,255,0.1)' : 'none',
                borderColor: claimedByMe ? 'var(--secondary-color)' : canClaim ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)'
            }}>
            {/* Image */}
            <div className="position-relative overflow-hidden" style={{ height: '150px', background: image ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                {image ? <img src={image} alt={title} className="w-100 h-100 object-fit-cover" style={{ filter: 'brightness(0.8) contrast(1.1) sepia(0.2) hue-rotate(200deg)' }} /> :
                    <div className="w-100 h-100 d-flex align-items-center justify-content-center"><FaGift size={46} style={{ color: 'rgba(255,255,255,0.1)' }} /></div>}
                
                <div className="position-absolute d-flex align-items-center gap-1 px-3 py-1 fw-bold tech-font text-uppercase"
                    style={{ top: '10px', left: '10px', background: claimedByMe ? 'rgba(163,230,53,0.8)' : canClaim ? 'rgba(170,0,255,0.8)' : 'rgba(0,0,0,0.8)', color: claimedByMe ? 'black' : 'white', fontSize: '0.65rem', backdropFilter: 'blur(6px)', border: `1px solid ${claimedByMe ? 'var(--secondary-color)' : canClaim ? 'var(--primary-color)' : 'rgba(255,255,255,0.2)'}` }}>
                    {claimedByMe ? <><FaCheck size={9} /> DECRYPTED</> : canClaim ? <><FaUnlock size={9} /> UNLOCKED</> : <><FaLock size={9} /> LOCKED</>}
                </div>
                <div className="position-absolute d-flex align-items-center gap-1 px-3 py-1 fw-bold tech-font"
                    style={{ top: '10px', right: '10px', background: 'rgba(0,0,0,0.8)', color: '#fbbf24', fontSize: '0.72rem', border: '1px solid rgba(251,191,36,0.3)', backdropFilter: 'blur(6px)' }}>
                    <FaStar size={9} /> {Number(pointsRequired).toLocaleString()}
                </div>
            </div>

            {/* Body */}
            <div className="p-4 d-flex flex-column flex-grow-1">
                <h6 className="tech-font fw-bold text-white mb-2 text-uppercase tracking-widest">{title}</h6>
                <p className="text-secondary font-monospace mb-4" style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
                    {description.length > 90 ? description.slice(0, 90) + '…' : description}
                </p>

                {/* Progress bar */}
                {!claimedByMe && (
                    <div className="mb-4 mt-auto">
                        <div className="d-flex justify-content-between align-items-center mb-2 tech-font fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>
                            <span className="text-muted">CREDIT ASSIGNMENT</span>
                            <span style={{ color: canClaim ? 'var(--primary-color)' : 'var(--text-muted)' }}>
                                {Math.min(myPoints, pointsRequired).toLocaleString()} / {Number(pointsRequired).toLocaleString()} XP
                            </span>
                        </div>
                        <div className="rounded overflow-hidden" style={{ height: '4px', background: 'rgba(255,255,255,0.1)' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                                style={{ height: '100%', background: canClaim ? 'var(--primary-color)' : 'var(--text-muted)' }} />
                        </div>
                    </div>
                )}

                {/* Promo */}
                {claimedByMe && promoCode && (
                    <div className="mb-4 mt-auto">
                        <small className="tech-font text-neon-green d-block mb-2 fw-bold text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.1em' }}>DECRYPTION KEY</small>
                        <PromoBadge code={promoCode} />
                    </div>
                )}

                <div className="d-flex align-items-center justify-content-between mt-auto">
                    <small className="tech-font text-muted d-flex align-items-center gap-2 fw-bold text-uppercase" style={{ fontSize: '0.7rem' }}>
                        <FaMedal size={11} style={{ color: '#f59e0b' }} />
                        {claimCount} EXECUTIONS
                    </small>

                    {claimedByMe ? (
                        <span className="badge tech-font fw-bold px-3 py-2 d-flex align-items-center gap-2 text-uppercase" style={{ background: 'rgba(163,230,53,0.1)', color: 'var(--secondary-color)', border: '1px solid var(--secondary-color)', fontSize: '0.7rem', letterSpacing: '0.1em' }}>
                            <FaCheck size={10} /> SECURED
                        </span>
                    ) : canClaim ? (
                        <motion.button onClick={handleClaim} disabled={claiming} whileTap={{ scale: 0.95 }}
                            className="btn btn-sm tech-font fw-bold px-3 py-2 d-flex align-items-center gap-2 text-uppercase"
                            style={{ background: 'rgba(170,0,255,0.1)', color: 'white', border: '1px solid var(--primary-color)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
                            {claiming ? <><span className="spinner-border spinner-border-sm" /> LINKING…</> : <><FaGift size={11} className="text-neon-purple" /> INITIATE</>}
                        </motion.button>
                    ) : (
                        <span className="tech-font text-muted fw-bold d-flex align-items-center gap-1 text-uppercase" style={{ fontSize: '0.7rem' }}>
                            <FaLock size={10} /> REQUIRES {(pointsRequired - myPoints).toLocaleString()} XP
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

/* Main Leaderboard Page */
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
                notify('success', `ACCESS GRANTED! CODE: ${res.data.promoCode}`);
                fetchRewards();
            }
        } catch (err) {
            notify('error', err?.response?.data?.message || 'TRANSACTION FAILED');
        }
    };

    const top3 = leaders.slice(0, 3);
    const myRank = leaders.findIndex(l => l._id === currentUser?._id);
    const myLeaderEntry = myRank >= 0 ? leaders[myRank] : null;

    const TABS = [
        { id: 'leaderboard', label: 'NETWORK RANKINGS', icon: FaTrophy },
        { id: 'rewards', label: 'BENEFACTOR ASSETS', icon: FaGift },
    ];

    if (loading) return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh', background: 'transparent' }}>
            <div className="spinner-border text-neon-purple" role="status"><span className="visually-hidden">LOADING...</span></div>
        </div>
    );

    return (
        <div style={{ background: 'transparent', minHeight: '100vh' }}>
            {/* Header */}
            <div className="px-4 px-md-5 py-5 glass-card" style={{ borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderRadius: 0 }}>
                <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-4 mb-4">
                    <div className="d-flex align-items-center gap-3">
                        <FaTerminal size={30} className="text-secondary d-none d-md-block" />
                        <div>
                            <h2 className="tech-font fw-bold text-white mb-1 text-uppercase tracking-widest" style={{ letterSpacing: '0.2em' }}>CIVIC LEADERBOARD</h2>
                            <p className="tech-font text-muted mb-0 text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.1em' }}>TOP OPERATIVES LOGGED WITHIN THE NETWORK FRAMEWORK.</p>
                        </div>
                    </div>

                    {/* My stats pill */}
                    {myLeaderEntry && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                            className="d-flex align-items-center gap-4 px-4 py-3 rounded border"
                            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)' }}>
                            <div className="text-center">
                                <div className="fw-bold tech-font" style={{ color: '#f59e0b', fontSize: '1.4rem' }}>#{myRank + 1}</div>
                                <small className="tech-font text-muted fw-bold text-uppercase" style={{ fontSize: '0.6rem', letterSpacing: '0.15em' }}>RANK</small>
                            </div>
                            <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.1)' }} />
                            <div className="text-center">
                                <div className="fw-bold tech-font text-neon-green" style={{ fontSize: '1.4rem' }}>{(myLeaderEntry.impactPoints || 0).toLocaleString()}</div>
                                <small className="tech-font text-muted fw-bold text-uppercase" style={{ fontSize: '0.6rem', letterSpacing: '0.15em' }}>CREDITS</small>
                            </div>
                            <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.1)' }} />
                            <div className="text-center">
                                <div className="fw-bold tech-font text-neon-purple" style={{ fontSize: '1.4rem' }}>{myLeaderEntry.resolvedComplaints || 0}</div>
                                <small className="tech-font text-muted fw-bold text-uppercase" style={{ fontSize: '0.6rem', letterSpacing: '0.15em' }}>RESOLVED</small>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Tabs */}
                <div className="d-flex gap-2 flex-wrap">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="btn tech-font fw-bold d-flex align-items-center gap-2 px-4 py-2 text-uppercase"
                            style={{
                                borderRadius: '4px', background: activeTab === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                                border: `1px solid ${activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'transparent'}`,
                                fontSize: '0.75rem', letterSpacing: '0.1em', transition: 'all 0.15s'
                            }}>
                            <tab.icon size={13} className={activeTab === tab.id ? 'text-secondary' : ''} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">

                {/* Rankings Tab */}
                {activeTab === 'leaderboard' && (
                    <motion.div key="rankings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="px-4 px-md-5 py-5">
                        {/* Podium */}
                        {top3.length >= 3 && (
                            <div className="d-flex align-items-end justify-content-center gap-2 gap-md-4 mb-5 flex-wrap flex-md-nowrap">
                                {[1, 0, 2].map((rank) => {
                                    const user = top3[rank];
                                    if (!user) return null;
                                    const m = MEDAL[rank];
                                    const sizes = [{ avatar: 50, podium: '120px', name: '0.8rem' }, { avatar: 65, podium: '160px', name: '0.95rem' }, { avatar: 45, podium: '100px', name: '0.75rem' }];
                                    const { avatar, podium, name: nameSz } = sizes[rank === 0 ? 1 : rank === 1 ? 0 : 2];
                                    return (
                                        <motion.div key={user._id} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: rank * 0.1, type: 'spring', stiffness: 200 }}
                                            className="d-flex flex-column align-items-center" style={{ flex: rank === 0 ? '0 0 160px' : '0 0 120px' }}>
                                            <div className="rounded d-flex align-items-center justify-content-center fw-bold tech-font mb-3"
                                                style={{
                                                    width: `${avatar}px`, height: `${avatar}px`, background: m.bg, border: `2px solid ${m.border}`,
                                                    color: m.border, boxShadow: `0 0 20px ${m.shadow}`, fontSize: rank === 0 ? '1.5rem' : '1.1rem',
                                                    textShadow: `0 0 10px ${m.border}`
                                                }}>
                                                {user.userName.charAt(0).toUpperCase()}
                                            </div>
                                            <p className="fw-bold text-white mb-1 text-center tech-font text-uppercase tracking-widest text-truncate w-100 px-2" style={{ fontSize: nameSz }}>{user.userName}</p>
                                            <small className="text-secondary tech-font fw-bold mb-3 d-flex align-items-center gap-2 text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.1em' }}>
                                                <FaFire size={10} className="text-neon-purple" /> {user.impactPoints.toLocaleString()} XP
                                            </small>
                                            <div className="w-100 rounded-top d-flex align-items-center justify-content-center fw-bold tech-font text-uppercase tracking-widest"
                                                style={{ height: podium, background: m.bg, borderTop: `2px solid ${m.border}`, borderLeft: `1px solid ${m.border}`, borderRight: `1px solid ${m.border}`, color: m.border, fontSize: '1rem', textShadow: `0 0 10px ${m.border}`, borderBottom: 'none' }}>
                                                {m.label}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Full table */}
                        <div className="glass-card overflow-hidden">
                            <div className="d-flex align-items-center px-4 py-3 border-bottom" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1) !important' }}>
                                {[
                                    { label: 'RANK', style: { width: '60px' } },
                                    { label: 'OPERATIVE', style: { flex: 1 } },
                                    { label: 'LOGS', style: { width: '90px', textAlign: 'center' } },
                                    { label: 'SOLVED', style: { width: '90px', textAlign: 'center' } },
                                    { label: 'CREDITS', style: { width: '110px', textAlign: 'right' } },
                                ].map((h, i) => (
                                    <div key={i} className="text-muted tech-font fw-bold text-uppercase d-none d-md-block" style={{ fontSize: '0.7rem', letterSpacing: '0.15em', ...h.style }}>
                                        {h.label}
                                    </div>
                                ))}
                                {/* Mobile Header */}
                                <div className="text-muted tech-font fw-bold text-uppercase d-md-none w-100 text-center" style={{ fontSize: '0.7rem', letterSpacing: '0.15em' }}>
                                    OPERATIVE LOGS
                                </div>
                            </div>

                            {leaders.length === 0 ? (
                                <div className="text-center py-5">
                                    <FaTrophy size={36} className="text-muted mb-3" style={{ opacity: 0.3 }} />
                                    <h6 className="tech-font fw-bold text-white text-uppercase tracking-widest">NETWORK EMPTY</h6>
                                </div>
                            ) : (
                                leaders.map((user, idx) => {
                                    const isMe = user._id === currentUser?._id;
                                    const medal = MEDAL[idx] || { bg: 'transparent', color: 'var(--text-muted)', border: 'transparent' };
                                    return (
                                        <motion.div key={user._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(idx * 0.06, 0.5) }}
                                            className="d-flex align-items-center px-4 py-3 border-bottom flex-wrap flex-md-nowrap gap-3 gap-md-0 cursor-pointer hover-bg-light"
                                            style={{
                                                background: isMe ? 'rgba(170,0,255,0.1)' : 'transparent',
                                                borderLeft: isMe ? '3px solid var(--primary-color)' : '3px solid transparent',
                                                borderColor: 'rgba(255,255,255,0.05) !important'
                                            }}>
                                            <div style={{ width: '60px' }} className="d-none d-md-block">
                                                {idx < 3 ? (
                                                    <span className="badge tech-font fw-bold px-2 py-1 text-uppercase" style={{ background: medal.bg, color: medal.border, border: `1px solid ${medal.border}`, fontSize: '0.65rem' }}>
                                                        #{idx + 1}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted fw-bold tech-font">#{idx + 1}</span>
                                                )}
                                            </div>
                                            <div className="d-flex align-items-center gap-3 flex-grow-1 w-100 w-md-auto">
                                                <div className="rounded d-flex align-items-center justify-content-center fw-bold flex-shrink-0 tech-font border"
                                                    style={{ width: '40px', height: '40px', background: isMe ? 'rgba(170,0,255,0.2)' : 'rgba(255,255,255,0.05)', color: isMe ? 'white' : 'var(--text-muted)', fontSize: '1rem', borderColor: isMe ? 'var(--primary-color) !important' : 'rgba(255,255,255,0.1) !important' }}>
                                                    {user.userName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <span className="tech-font fw-bold text-white tracking-widest text-uppercase">{user.userName}</span>
                                                        {isMe && <span className="badge tech-font px-2 py-1 text-uppercase" style={{ background: 'var(--primary-color)', color: 'white', fontSize: '0.55rem', letterSpacing: '0.1em' }}>YOU</span>}
                                                    </div>
                                                    <small className="tech-font text-muted font-monospace" style={{ fontSize: '0.7rem' }}>{user.userEmail}</small>
                                                </div>
                                            </div>
                                            
                                            {/* Mobile row breakdown */}
                                            <div className="d-flex w-100 d-md-none justify-content-between mt-2 pt-2 border-top" style={{ borderColor: 'rgba(255,255,255,0.05) !important' }}>
                                                <span className="tech-font text-muted small"><FaClipboardList /> {user.totalComplaints}</span>
                                                <span className="tech-font text-secondary small"><FaCheckCircle /> {user.resolvedComplaints}</span>
                                                <span className="badge tech-font" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>{user.impactPoints.toLocaleString()} XP</span>
                                            </div>

                                            {/* Desktop columns */}
                                            <div style={{ width: '90px', textAlign: 'center' }} className="d-none d-md-block">
                                                <span className="d-flex align-items-center justify-content-center gap-2 text-muted fw-bold tech-font small">
                                                    <FaClipboardList size={11} /> {user.totalComplaints}
                                                </span>
                                            </div>
                                            <div style={{ width: '90px', textAlign: 'center' }} className="d-none d-md-block">
                                                <span className="d-flex align-items-center justify-content-center gap-2 fw-bold tech-font small text-neon-green">
                                                    <FaCheckCircle size={11} /> {user.resolvedComplaints}
                                                </span>
                                            </div>
                                            <div style={{ width: '110px', textAlign: 'right' }} className="d-none d-md-block">
                                                <span className="badge tech-font fw-bold px-3 py-2 text-uppercase" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.75rem', letterSpacing: '0.1em' }}>
                                                    {user.impactPoints.toLocaleString()} XP
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Rewards Tab */}
                {activeTab === 'rewards' && (
                    <motion.div key="rewards" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="px-4 px-md-5 py-5">
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="mb-5 p-4 rounded glass-card d-flex flex-column flex-md-row align-items-center justify-content-between gap-4"
                            style={{ border: '1px solid var(--primary-color)', boxShadow: '0 0 30px rgba(170,0,255,0.15)' }}>
                            <div className="text-center text-md-start">
                                <p className="mb-2 fw-bold tech-font text-neon-purple text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.2em' }}>
                                    SECURED NETWORK CREDITS
                                </p>
                                <div className="d-flex align-items-baseline gap-2 justify-content-center justify-content-md-start">
                                    <span className="fw-bold tech-font text-white" style={{ fontSize: '2.4rem', lineHeight: 1 }}>
                                        {myPoints.toLocaleString()}
                                    </span>
                                    <span className="tech-font text-muted fw-bold" style={{ fontSize: '0.8rem', letterSpacing: '0.1em' }}>XP</span>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-4">
                                <div className="text-center p-3 rounded" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div className="fw-bold tech-font text-secondary" style={{ fontSize: '1.4rem' }}>{rewards.filter(r => r.claimedByMe).length}</div>
                                    <small className="tech-font text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.15em' }}>DECRYPTED</small>
                                </div>
                                <div className="text-center p-3 rounded" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <div className="fw-bold tech-font text-neon-purple" style={{ fontSize: '1.4rem' }}>{rewards.filter(r => !r.claimedByMe && myPoints >= r.pointsRequired).length}</div>
                                    <small className="tech-font text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.15em' }}>UNLOCKED</small>
                                </div>
                            </div>
                        </motion.div>

                        {rewardsLoading ? (
                            <div className="d-flex justify-content-center py-5">
                                <div className="spinner-border text-neon-purple" role="status"><span className="visually-hidden">SCANNING FOR ASSETS...</span></div>
                            </div>
                        ) : rewards.length === 0 ? (
                            <div className="text-center py-5 glass-card">
                                <FaGift size={40} className="text-muted mb-3" style={{ opacity: 0.3 }} />
                                <h6 className="fw-bold tech-font text-white text-uppercase tracking-widest">NO ASSETS DETECTED</h6>
                                <p className="text-muted small tech-font text-uppercase" style={{ letterSpacing: '0.1em' }}>AWAITING BENEFACTOR DROPS.</p>
                            </div>
                        ) : (
                            <div className="row g-4">
                                {rewards.map((reward, idx) => (
                                    <div className="col-md-6 col-lg-4" key={reward._id}>
                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }} className="h-100">
                                            <RewardCard reward={reward} myPoints={myPoints} onClaim={handleClaim} />
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
