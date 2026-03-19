import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import api from '../api/axios';

// Dark tactical custom marker – a neon exclamation/pin SVG
const createTacticalIcon = (color = '#aa00ff', label = '!') => L.divIcon({
    className: '',
    html: `
        <div style="
            width:34px; height:34px;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            background:${color};
            border:2px solid rgba(255,255,255,0.4);
            box-shadow: 0 0 10px ${color}, 0 0 20px ${color}40;
            display:flex; align-items:center; justify-content:center;
        ">
            <span style="
                transform:rotate(45deg);
                color:#fff;
                font-weight:900;
                font-size:14px;
                font-family:'Share Tech Mono',monospace;
                line-height:1;
            ">${label}</span>
        </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -36],
});

const SELECTED_ICON = createTacticalIcon('#aa00ff', '✦');
const INCIDENT_ICON = createTacticalIcon('#ef4444', '!');

// Click + geocode handler
const LocationMarker = ({ position, setPosition, onLocationSelect }) => {
    const map = useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setPosition(e.latlng);
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                .then(r => r.json())
                .then(data => onLocationSelect({ lat, lng, address: data.display_name }))
                .catch(() => onLocationSelect({ lat, lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
        },
    });

    useEffect(() => {
        if (position) map.flyTo(position, map.getZoom());
    }, [position, map]);

    return position === null ? null : (
        <Marker position={position} icon={SELECTED_ICON}>
            <Popup className="tactical-popup">
                <div style={{ background: 'rgba(15,23,42,0.95)', color: '#aa00ff', fontFamily: "'Share Tech Mono',monospace", padding: '6px 10px', fontSize: '12px', border: '1px solid #aa00ff', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                    📍 SELECTED COORDS
                </div>
            </Popup>
        </Marker>
    );
};

const RecenterMap = ({ center }) => {
    const map = useMapEvents({});
    useEffect(() => { map.setView(center); }, [center, map]);
    return null;
};

const LocationPicker = ({ onLocationSelect, initialPosition }) => {
    const [position, setPosition] = useState(initialPosition || null);
    const [defaultCenter, setDefaultCenter] = useState([28.6139, 77.2090]);
    const [incidents, setIncidents] = useState([]);

    // Get user's live location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setDefaultCenter([pos.coords.latitude, pos.coords.longitude]),
                () => setDefaultCenter([28.6139, 77.2090])
            );
        }
    }, [initialPosition]);

    // Fetch existing incident locations
    useEffect(() => {
        api.get('/complaint/map-points')
            .then(res => {
                if (res.data?.data) setIncidents(res.data.data);
            })
            .catch(() => {
                // Silently fail — map still works without incident pins
            });
    }, []);

    return (
        <div style={{ height: '340px', width: '100%', borderRadius: '8px', overflow: 'hidden', zIndex: 0, border: '1px solid rgba(170,0,255,0.3)', boxShadow: '0 0 20px rgba(170,0,255,0.1)' }}>
            <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                {/* Dark tactical tile layer (CartoDB Dark) */}
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <RecenterMap center={defaultCenter} />
                <LocationMarker position={position} setPosition={setPosition} onLocationSelect={onLocationSelect} />

                {/* Existing incident markers */}
                {incidents.map((inc, i) => (
                    inc.lat && inc.lng ? (
                        <Marker key={i} position={[inc.lat, inc.lng]} icon={INCIDENT_ICON}>
                            <Popup>
                                <div style={{ background: 'rgba(15,23,42,0.95)', color: '#ef4444', fontFamily: "'Share Tech Mono',monospace", padding: '8px 12px', fontSize: '11px', border: '1px solid #ef4444', borderRadius: '4px', minWidth: '180px' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '4px', letterSpacing: '0.1em' }}>⚠ ANOMALY LOGGED</div>
                                    <div style={{ color: '#fff', fontSize: '10px' }}>{inc.title || 'Unknown Incident'}</div>
                                    <div style={{ color: '#6b7280', fontSize: '9px', marginTop: '4px' }}>{inc.category || ''}</div>
                                </div>
                            </Popup>
                        </Marker>
                    ) : null
                ))}
            </MapContainer>
        </div>
    );
};

export default LocationPicker;
