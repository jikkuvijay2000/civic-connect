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
const aiChatRouter = require("./Router/aiChatRouter");
const { rewardRouter } = require("./Router/rewardRouter");

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
    if (socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
    }
    if (!token && socket.handshake.headers.cookie) {
        const cookies = Object.fromEntries(socket.handshake.headers.cookie.split('; ').map(c => c.split('=')));
        token = cookies.accessToken;
    }
    if (!token) return next(); // Allow connection without auth for now

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'your_access_token_secret');
        socket.user = decoded;
        next();
    } catch (err) {
        next();
    }
});

app.set('io', io);

app.use(express.json());
app.use(cors({
    origin: function (origin, callback) {
        callback(null, true);
    },
    credentials: true,
}));
app.use(cookieParser());

// Kill Switch for project security
const { killSwitchMiddleware } = require("./Middlewares/killSwitchMiddleware");
app.use(killSwitchMiddleware);

const PORT = process.env.PORT || 3000;

app.use('/user', userRouter);
app.use('/complaint', complaintRouter);
app.use('/note', noteRouter);
app.use('/community-post', communityPostRouter);
app.use('/api/chat', aiChatRouter);
app.use('/reward', rewardRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
});

mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/civic-connect')
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((error) => {
        console.log("MongoDB connection error:", error);
    });

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}, http://0.0.0.0:${PORT}`);
});
