import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
// Import images explicitly to avoid issues with bundlers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icon
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

const LocationMarker = ({ position, setPosition, onLocationSelect }) => {
    const map = useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setPosition(e.latlng);
            // Reverse geocoding using Nominatim
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                .then(response => response.json())
                .then(data => {
                    const address = data.display_name;
                    onLocationSelect({ lat, lng, address });
                })
                .catch(err => {
                    console.error("Error fetching address:", err);
                    onLocationSelect({ lat, lng, address: `${lat}, ${lng}` });
                });
        },
    });

    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom());
        }
    }, [position, map]);

    return position === null ? null : (
        <Marker position={position}>
            <Popup>Selected Location</Popup>
        </Marker>
    );
};

const LocationPicker = ({ onLocationSelect, initialPosition }) => {
    // Default to a central location (e.g., a city center or user's current location)
    // Here using a generic lat/long, can be improved to use browser geolocation
    const [position, setPosition] = useState(initialPosition || null);
    const [defaultCenter, setDefaultCenter] = useState([51.505, -0.09]); // Default: London. 
    // In a real app, maybe default to user's IP location or a specific city if known.
    // For now, let's try to get user location or default to something irrelevant but we need a starting point.
    // Let's use a known coordinate or 0,0. 
    // New Delhi: 28.6139, 77.2090

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setDefaultCenter([latitude, longitude]);
                    if (!initialPosition) {
                        // Optional: auto-select current location? Maybe just center there.
                        // setPosition({ lat: latitude, lng: longitude });
                    }
                },
                (err) => {
                    console.warn("Geolocation permission denied or error:", err);
                    // Fallback to New Delhi if geolocation fails
                    setDefaultCenter([28.6139, 77.2090]);
                }
            );
        } else {
            setDefaultCenter([28.6139, 77.2090]);
        }
    }, [initialPosition]);

    // If we have an initial center from geolocation, use it. Effect updates state.
    // However, MapContainer center is immutable after mount unless we use a component to flyTo.
    // We can use a component to recenter when defaultCenter changes.

    const RecenterMap = ({ center }) => {
        const map = useMapEvents({});
        useEffect(() => {
            map.setView(center);
        }, [center, map]);
        return null;
    };

    return (
        <div style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden', zIndex: 0 }}>
            <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/children">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <RecenterMap center={defaultCenter} />
                <LocationMarker position={position} setPosition={setPosition} onLocationSelect={onLocationSelect} />
            </MapContainer>
        </div>
    );
};

export default LocationPicker;
