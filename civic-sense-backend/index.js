const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require('http');
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const { userRouter } = require("./Router/userRouter");
const { complaintRouter } = require("./Router/complaintRouter");
const { noteRouter } = require("./Router/noteRouter");
const { communityPostRouter } = require("./Router/communityPostRouter");
const aiChatRouter = require("./Router/aiChatRouter"); // NEW: AI Chat Router

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => callback(null, true),
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware for Socket Authentication
io.use((socket, next) => {
    let token = null;

    // 1. Try to get token from handshake auth payload (explicit)
    if (socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
    }

    // 2. Try to get token from cookies (fallback)
    if (!token && socket.handshake.headers.cookie) {
        const cookies = Object.fromEntries(socket.handshake.headers.cookie.split('; ').map(c => c.split('=')));
        token = cookies.accessToken;
    }

    if (!token) return next(new Error("Authentication error: No token found in auth payload or cookies"));

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        socket.user = decoded; // Attach user info to socket
        next();
    } catch (err) {
        next(new Error("Authentication error: Invalid token"));
    }
});

app.set('io', io);

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.userId}`);

    // Join a room specific to this user
    socket.join(socket.user.userId);
    console.log(`User ${socket.user.userId} joined room ${socket.user.userId}`);

    socket.on('disconnect', (reason) => {
        console.log(`User disconnected: ${socket.id}, Reason: ${reason}`);
    });
});

app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 100 requests per `window`
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiting middleware to all requests
// app.use(limiter); // Temporarily commented out to fix 'Too Many Requests'

app.use(express.json());

app.use(cors({
    origin: function (origin, callback) {
        callback(null, true);
    },
    credentials: true,
}));
app.use(cookieParser());

const PORT = process.env.PORT || 3000;

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // Limit each IP to 10 login/register requests per hour
    message: "Too many login attempts, please try again after an hour"
});

app.use('/user', userRouter); // Temporarily removing authLimiter for network testing
// app.use('/user', authLimiter, userRouter); // ORIGINAL: Un-comment this and remove the line above when testing is done
app.use('/complaint', complaintRouter);
app.use('/note', noteRouter);
app.use('/community-post', communityPostRouter);
app.use('/api/chat', aiChatRouter); // NEW: AI Chat endpoint

mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((error) => {
        console.log(error);
    });

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}, http://0.0.0.0:${PORT}`);
});
