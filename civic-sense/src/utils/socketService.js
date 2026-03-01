import { io } from "socket.io-client";

const SOCKET_URL = `http://${window.location.hostname}:3000`;

let socket;

export const initiateSocketConnection = () => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5
        });

        socket.on("connect_error", (err) => {
            console.error("Socket Connection Error:", err.message);
        });

        console.log("Connecting to socket...");
    } else {
        if (socket.disconnected) {
            socket.connect();
        }
    }
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null; // Important for complete cleanup
    }
};

export const subscribeToNotifications = (cb) => {
    if (!socket) return () => { };
    const listener = (msg) => {
        console.log("Socket notification received:", msg);
        cb(null, msg);
    };
    socket.on('notification', listener);
    return () => socket.off('notification', listener);
};

export const subscribeToEmergency = (cb) => {
    if (!socket) return () => { };
    const listener = (msg) => {
        console.log("Emergency received:", msg);
        cb(null, msg);
    };
    socket.on('new_emergency_complaint', listener);
    return () => socket.off('new_emergency_complaint', listener);
};

export const subscribeToAlerts = (cb) => {
    if (!socket) return () => { };
    const listener = (msg) => {
        console.log("Alert received:", msg);
        cb(null, msg);
    };
    socket.on('new_alert', listener);
    return () => socket.off('new_alert', listener);
};

export const subscribeToAuthorityNotifications = (cb) => {
    if (!socket) return () => { };
    const listener = (msg) => {
        console.log("Authority Notification received:", msg);
        cb(null, msg);
    };
    socket.on('authority_notification', listener);
    return () => socket.off('authority_notification', listener);
};
