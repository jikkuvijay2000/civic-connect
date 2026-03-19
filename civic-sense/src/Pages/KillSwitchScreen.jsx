import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaTerminal, FaLock, FaExclamationTriangle } from 'react-icons/fa';

/**
 * Full-screen block displayed when the backend kill switch is active.
 * Shown automatically by App.jsx via the KillSwitchContext whenever any
 * API call returns HTTP 503 with status === 'kill_switch'.
 */
const KillSwitchScreen = () => {
    const [dots, setDots] = useState('');
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const dotTimer = setInterval(() => {
            setDots(d => d.length >= 3 ? '' : d + '.');
        }, 500);
        const clockTimer = setInterval(() => setTime(new Date()), 1000);
        return () => { clearInterval(dotTimer); clearInterval(clockTimer); };
    }, []);

    const lines = [
        '> CIVIC SENSE NODE v2.1',
        `> TIMESTAMP : ${time.toISOString()}`,
        '> AUTH LEVEL : REVOKED',
        '> SYSTEM STATE : OFFLINE',
        '> OPERATOR LOCK : ENGAGED',
    ];

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 999999,
            background: '#09090b',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>
            {/* Cyber grid background */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                pointerEvents: 'none',
            }} />

            {/* Red glow top-left */}
            <div style={{
                position: 'absolute', width: 400, height: 400,
                borderRadius: '50%', background: '#ef4444',
                filter: 'blur(120px)', opacity: 0.08,
                top: '-10%', left: '-5%', pointerEvents: 'none',
            }} />

            {/* Purple glow bottom-right */}
            <div style={{
                position: 'absolute', width: 400, height: 400,
                borderRadius: '50%', background: '#aa00ff',
                filter: 'blur(120px)', opacity: 0.07,
                bottom: '-10%', right: '-5%', pointerEvents: 'none',
            }} />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 560, padding: '0 24px' }}
            >
                {/* Icon */}
                <motion.div
                    animate={{ boxShadow: ['0 0 20px rgba(239,68,68,0.3)', '0 0 50px rgba(239,68,68,0.6)', '0 0 20px rgba(239,68,68,0.3)'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                        width: 88, height: 88, borderRadius: '50%',
                        background: 'rgba(239,68,68,0.1)', border: '2px solid #ef4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 32px',
                    }}
                >
                    <FaLock size={34} style={{ color: '#ef4444' }} />
                </motion.div>

                {/* Title */}
                <p style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '0.8rem', color: '#ef4444',
                    letterSpacing: '0.25em', textTransform: 'uppercase',
                    marginBottom: 12,
                }}>
                    <FaExclamationTriangle style={{ marginRight: 8 }} />
                    OPERATOR KILL SWITCH ENGAGED
                </p>

                <h1 style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: 'clamp(1.6rem, 4vw, 2.5rem)',
                    color: '#f8fafc', letterSpacing: '0.08em',
                    marginBottom: 16, fontWeight: 700,
                }}>
                    SYSTEM OFFLINE
                </h1>

                <p style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: '1.05rem', color: '#b8bcc8',
                    lineHeight: 1.7, marginBottom: 40,
                }}>
                    Access to this system has been temporarily suspended by the project owner.
                    Please contact the operator to restore access.
                </p>

                {/* Terminal readout */}
                <div style={{
                    background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 6, padding: '20px 24px', textAlign: 'left',
                }}>
                    {lines.map((line, i) => (
                        <motion.p
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.12 }}
                            style={{
                                fontFamily: "'Share Tech Mono', monospace",
                                fontSize: '0.8rem', color: i === 3 ? '#ef4444' : '#b8bcc8',
                                marginBottom: i === lines.length - 1 ? 0 : 8,
                                letterSpacing: '0.05em',
                            }}
                        >
                            {line}
                        </motion.p>
                    ))}
                    <motion.p
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        style={{
                            fontFamily: "'Share Tech Mono', monospace",
                            fontSize: '0.8rem', color: '#aa00ff',
                            marginBottom: 0, marginTop: 8, letterSpacing: '0.05em',
                        }}
                    >
                        {`> AWAITING OPERATOR CLEARANCE${dots}`}
                    </motion.p>
                </div>

                {/* Footer */}
                <div style={{
                    marginTop: 32, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8,
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)',
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                }}>
                    <FaTerminal size={11} /> CIVIC SENSE // CONTROLLED ACCESS NODE
                </div>
            </motion.div>
        </div>
    );
};

export default KillSwitchScreen;
