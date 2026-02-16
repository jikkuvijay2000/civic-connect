import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3000";

let socket;

export const initiateSocketConnection = () => {
    socket = io(SOCKET_URL, {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
    });

    socket.on("connect_error", (err) => {
        console.error("Socket Connection Error:", err.message);
    });

    console.log("Connecting to socket...");
};

export const disconnectSocket = () => {
    if (socket) socket.disconnect();
};

export const subscribeToNotifications = (cb) => {
    if (!socket) return true;
    socket.on('notification', msg => {
        console.log("Socket notification received:", msg);
        cb(null, msg);
    });
};

export const subscribeToEmergency = (cb) => {
    if (!socket) return true;
    socket.on('new_emergency_complaint', msg => {
        console.log("Emergency received:", msg);
        cb(null, msg);
    });
};

export const subscribeToAlerts = (cb) => {
    if (!socket) return true;
    socket.on('new_alert', msg => {
        console.log("Alert received:", msg);
        cb(null, msg);
    });
};
