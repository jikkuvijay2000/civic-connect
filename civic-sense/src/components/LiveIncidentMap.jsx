import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { initiateSocketConnection } from '../utils/socketService';
import { FaExclamationTriangle, FaCheckCircle, FaRegDotCircle, FaTimes, FaLayerGroup, FaMap } from 'react-icons/fa';

/* ─── Tactical SVG marker factory ─── */
const makeIcon = (color, symbol) => L.divIcon({
    className: '',
    html: `<div style="
        width:32px;height:32px;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:${color};
        border:2px solid rgba(255,255,255,0.3);
        box-shadow:0 0 12px ${color},0 0 24px ${color}44;
        display:flex;align-items:center;justify-content:center;">
        <span style="transform:rotate(45deg);color:#fff;font-weight:900;font-size:13px;font-family:'Share Tech Mono',monospace;line-height:1;">${symbol}</span>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
});

const ICONS = {
    pending:     makeIcon('#ef4444', '!'),
    'in progress': makeIcon('#f59e0b', '↻'),
    resolved:    makeIcon('#a3e635', '✓'),
    closed:      makeIcon('#6b7280', '■'),
    default:     makeIcon('#aa00ff', '?'),
};

const getIcon = (status = '') => ICONS[status.toLowerCase()] || ICONS.default;

const PRIORITY_COLOR = {
    Emergency: '#ef4444',
    High: '#f97316',
    Medium: '#f59e0b',
    Low: '#a3e635',
};

/* ─── Popup dark card ─── */
const IncidentCard = ({ point, onClose }) => (
    <div style={{
        background: 'rgba(9,9,11,0.97)',
        border: `1px solid ${PRIORITY_COLOR[point.priority] || 'rgba(170,0,255,0.6)'}`,
        borderRadius: '6px',
        padding: '14px 16px',
        minWidth: '220px',
        fontFamily: "'Share Tech Mono',monospace",
        boxShadow: `0 0 20px ${PRIORITY_COLOR[point.priority] || '#aa00ff'}44`,
        position: 'relative',
    }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', lineHeight: 1 }}>
            <FaTimes size={10}/>
        </button>
        <div style={{ color: PRIORITY_COLOR[point.priority] || '#aa00ff', fontSize: '10px', letterSpacing: '0.15em', marginBottom: '6px' }}>
            ⚠ {point.priority?.toUpperCase() || 'UNKNOWN'} PRIORITY
        </div>
        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '12px', marginBottom: '4px', letterSpacing: '0.05em' }}>
            {point.title || 'ANOMALY LOGGED'}
        </div>
        <div style={{ color: '#a1a1aa', fontSize: '10px', marginBottom: '8px' }}>{point.category}</div>
        <div style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '3px',
            fontSize: '9px',
            letterSpacing: '0.15em',
            background: point.status?.toLowerCase() === 'resolved' ? 'rgba(163,230,53,0.15)' : 'rgba(239,68,68,0.15)',
            color: point.status?.toLowerCase() === 'resolved' ? '#a3e635' : '#ef4444',
            border: `1px solid ${point.status?.toLowerCase() === 'resolved' ? '#a3e635' : '#ef4444'}`,
        }}>
            {(point.status || 'PENDING').toUpperCase()}
        </div>
        {point.resolvedAt && (
            <div style={{ color: '#6b7280', fontSize: '9px', marginTop: '6px' }}>
                RESOLVED: {new Date(point.resolvedAt).toLocaleDateString()}
            </div>
        )}
    </div>
);

/* ─── Legend ─── */
const MapLegend = () => (
    <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        background: 'rgba(9,9,11,0.92)',
        border: '1px solid rgba(170,0,255,0.3)',
        borderRadius: '6px',
        padding: '10px 14px',
        fontFamily: "'Share Tech Mono',monospace",
        fontSize: '9px',
        letterSpacing: '0.1em',
        zIndex: 1000,
        boxShadow: '0 0 15px rgba(0,0,0,0.8)',
    }}>
        <div style={{ color: '#a1a1aa', marginBottom: '8px', letterSpacing: '0.2em' }}>MAP LEGEND</div>
        {[
            { color: '#ef4444', label: 'PENDING', symbol: '!' },
            { color: '#f59e0b', label: 'IN PROGRESS', symbol: '↻' },
            { color: '#a3e635', label: 'RESOLVED', symbol: '✓' },
        ].map(({ color, label, symbol }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{
                    width: '14px', height: '14px', borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)',
                    background: color, border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <span style={{ transform: 'rotate(45deg)', color: '#fff', fontSize: '7px', lineHeight: 1 }}>{symbol}</span>
                </div>
                <span style={{ color: '#e5e7eb' }}>{label}</span>
            </div>
        ))}
    </div>
);

/* ─── Main Component ─── */
const LiveIncidentMap = ({ height = '420px', showTitle = true }) => {
    const [points, setPoints] = useState([]);
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [center, setCenter] = useState([28.6139, 77.2090]);
    const socketRef = useRef(null);

    // Load existing incidents
    useEffect(() => {
        api.get('/complaint/map-points')
            .then(res => {
                if (res.data?.data) setPoints(res.data.data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));

        // Try to center on user
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
                () => {}
            );
        }
    }, []);

    // Subscribe to socket for live map_update and map_status_update events
    useEffect(() => {
        const socket = initiateSocketConnection();
        if (socket) {
            socketRef.current = socket;
            // New complaint pinned
            socket.on('map_update', (newPoint) => {
                setPoints(prev => {
                    const exists = prev.find(p => p.id === newPoint.complaintId);
                    if (exists) return prev;
                    return [{
                        id: newPoint.complaintId,
                        title: newPoint.title,
                        category: newPoint.category,
                        status: newPoint.status,
                        priority: newPoint.priority,
                        lat: newPoint.lat,
                        lng: newPoint.lng,
                    }, ...prev];
                });
            });
            // Status changed (e.g. resolved) — update marker color in real-time
            socket.on('map_status_update', (update) => {
                setPoints(prev => prev.map(p =>
                    p.id === update.id ? { ...p, status: update.status } : p
                ));
            });
        }
        return () => {
            if (socketRef.current) {
                socketRef.current.off('map_update');
                socketRef.current.off('map_status_update');
            }
        };
    }, []);

    const stats = {
        active: points.filter(p => !['resolved', 'closed'].includes(p.status?.toLowerCase())).length,
        resolved: points.filter(p => ['resolved', 'closed'].includes(p.status?.toLowerCase())).length,
    };

    return (
        <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(170,0,255,0.3)', boxShadow: '0 0 30px rgba(170,0,255,0.1)', zIndex: 0, isolation: 'isolate' }}>
            {showTitle && (
                <div style={{
                    background: 'rgba(9,9,11,0.95)',
                    borderBottom: '1px solid rgba(170,0,255,0.2)',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: "'Share Tech Mono',monospace",
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <FaMap size={14} style={{ color: 'var(--primary-color)' }} />
                        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.8rem', letterSpacing: '0.15em' }}>LIVE INCIDENT MAP</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '9px', letterSpacing: '0.1em' }}>
                        <span style={{ color: '#ef4444' }}>⬤ {stats.active} ACTIVE</span>
                        <span style={{ color: '#a3e635' }}>⬤ {stats.resolved} RESOLVED</span>
                        <span style={{ color: '#a1a1aa' }}>⬤ {points.length} TOTAL</span>
                    </div>
                </div>
            )}
            <div style={{ height, position: 'relative' }}>
                {loading && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(9,9,11,0.8)', zIndex: 1000, fontFamily: "'Share Tech Mono',monospace", color: '#a1a1aa', letterSpacing: '0.2em', fontSize: '11px' }}>
                        ESTABLISHING UPLINK...
                    </div>
                )}
                <MapContainer center={center} zoom={12} scrollWheelZoom={true} style={{ height: '100%', width: '100%', background: '#0a0a0f' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                    {points.map((point, i) => (
                        point.lat && point.lng ? (
                            <Marker
                                key={point.id || i}
                                position={[point.lat, point.lng]}
                                icon={getIcon(point.status)}
                                eventHandlers={{ click: () => setSelectedPoint(selectedPoint?.id === point.id ? null : point) }}
                            />
                        ) : null
                    ))}
                </MapContainer>

                {/* Custom floating info card — outside Leaflet Popup for full dark control */}
                <AnimatePresence>
                    {selectedPoint && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 1200 }}
                        >
                            <IncidentCard point={selectedPoint} onClose={() => setSelectedPoint(null)} />
                        </motion.div>
                    )}
                </AnimatePresence>

                <MapLegend />
            </div>
        </div>
    );
};

export default LiveIncidentMap;
