const { registerUser, loginUser, refreshToken, logoutUser, getLeaderboard, forgotPassword, resetPassword, getUserStats, getNotifications, markNotificationRead, verifyEmail, resendOtp, changePassword } = require("../Controllers/UserController");
const express = require("express");
const { generateCSRFToken, verifyCsrfToken } = require("../Middlewares/csrfMiddleware");
const { protect } = require("../Middlewares/authMiddleware");
const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOtp);
router.get("/csrf-token", generateCSRFToken);

router.post("/login", verifyCsrfToken, loginUser);
router.post("/refresh", refreshToken);
router.post("/logout", logoutUser);
router.get("/leaderboard", protect, getLeaderboard);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

// Authenticated routes
router.get("/stats", protect, getUserStats);
router.get("/notifications", protect, getNotifications);
router.put("/notifications/:id/read", protect, markNotificationRead);
router.put("/change-password", protect, changePassword);

router.get("/protected", protect, (req, res) => {
    res.json({ message: "Protected content", userId: req.userId });
});

module.exports = { userRouter: router };