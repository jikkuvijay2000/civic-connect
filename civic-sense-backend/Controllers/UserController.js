const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { generateAccessToken, generateRefreshToken, setAuthCookies } = require("../Utils/tokenUtils");
const userModel = require("../Models/User");
const Complaint = require("../Models/Complaints");
const Notification = require("../Models/Notification");
const crypto = require("crypto");
const sendEmail = require("../Utils/emailService");

const registerUser = async (req, res) => {
    const { userName, userEmail, userAddress, userPassword, userConfirmPassword } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

    if (!emailRegex.test(userEmail)) {
        return res.status(400).json({ status: "error", message: "Invalid email address" });
    }

    if (!passwordRegex.test(userPassword)) {
        return res.status(400).json({ status: "error", message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character" });
    }

    if (userPassword != userConfirmPassword) {
        return res.status(400).json({ status: "error", message: "Password does not match" });
    }

    try {
        const user = await userModel.find({
            userEmail: userEmail,
            isDeleted: false
        });
        if (user.length > 0) {
            return res.status(400).json({ status: "error", message: "User already exists" });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(userPassword, salt);

        const newUser = new userModel({
            userName: userName,
            userEmail: userEmail,
            userAddress: userAddress,
            userPassword: hashedPassword
        });

        await newUser.save();

        res.status(200).json({ status: "success", message: "User registered successfully" });

    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
}

const loginUser = async (req, res) => {
    const { userEmail, userPassword } = req.body;
    try {
        if (!userEmail || !userPassword)
            return res.status(400).json({ message: "Missing credentials" });

        const user = await userModel.findOne({ userEmail });
        if (!user)
            return res.status(401).json({ status: "error", message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(userPassword, user.userPassword);
        if (!isMatch)
            return res.status(401).json({ status: "error", message: "Invalid credentials" });

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshToken = refreshToken;
        await user.save();

        setAuthCookies(res, accessToken, refreshToken);

        res.json({
            message: "Login successful",
            user: {
                _id: user._id,
                userName: user.userName,
                userEmail: user.userEmail,
                role: user.userRole,
                userDepartment: user.userDepartment
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
}

const refreshToken = async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token)
        return res.status(401).json({ message: "No refresh token" });

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await userModel.findById(decoded.userId);

    if (!user || user.refreshToken !== token)
        return res.status(403).json({ message: "Invalid refresh token" });

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    setAuthCookies(res, newAccessToken, newRefreshToken);

    res.json({ message: "Token refreshed" });
};

const logoutUser = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;

        if (token) {
            const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
            await userModel.findByIdAndUpdate(decoded.userId, { refreshToken: null });
        }
    } catch (error) {
        console.log("Logout error (likely invalid token):", error.message);
    } finally {
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: true,
            sameSite: "strict"
        });
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true,
            sameSite: "strict"
        });
        return res.status(200).json({ message: "Logged out successfully" });
    }
}

const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await Complaint.aggregate([
            {
                $group: {
                    _id: "$complaintUser",
                    totalComplaints: { $sum: 1 },
                    resolvedComplaints: {
                        $sum: {
                            $cond: [{ $eq: ["$complaintStatus", "Resolved"] }, 1, 0]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $unwind: "$userDetails"
            },
            {
                $project: {
                    _id: 1,
                    userName: "$userDetails.userName",
                    userEmail: "$userDetails.userEmail",
                    totalComplaints: 1,
                    resolvedComplaints: 1,
                    impactPoints: {
                        $add: [
                            { $multiply: ["$totalComplaints", 10] },
                            { $multiply: ["$resolvedComplaints", 20] }
                        ]
                    }
                }
            },
            {
                $sort: { impactPoints: -1 }
            },
            {
                $limit: 10
            }
        ]);

        res.status(200).json({ status: "success", data: leaderboard });

    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};



const forgotPassword = async (req, res) => {
    const { userEmail } = req.body;

    try {
        const user = await userModel.findOne({ userEmail });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate Reset Token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash and set to resetPasswordToken field
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Set expire time (e.g., 10 minutes)
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

        await user.save();

        // Create reset URL
        // In production, this should be the frontend URL
        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

        const message = `You are receiving this email because you (or someone else) has requested the reset of a password.
Please click on the following link, or paste this into your browser to complete the process:

${resetUrl}

If you did not request this, please ignore this email and your password will remain unchanged.`;

        try {
            await sendEmail({
                email: user.userEmail,
                subject: 'Civic Sense Password Reset',
                message
            });

            res.status(200).json({ success: true, message: "Email sent" });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            return res.status(500).json({ message: "Email could not be sent", error: error.message });
        }

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { userPassword, userConfirmPassword } = req.body;

    // Validate password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    if (!passwordRegex.test(userPassword)) {
        return res.status(400).json({ message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character" });
    }

    if (userPassword !== userConfirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
    }

    try {
        // Get hashed token
        const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await userModel.findOne({
            resetPasswordToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // Set new password
        const salt = await bcrypt.genSalt(12);
        user.userPassword = await bcrypt.hash(userPassword, salt);

        // Clear reset fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).json({ success: true, message: "Password updated successfully" });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};



// --- New Controllers ---

const getUserStats = async (req, res) => {
    try {
        const userId = req.user._id; // From authMiddleware

        const stats = await Complaint.aggregate([
            { $match: { complaintUser: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: "$complaintUser",
                    totalComplaints: { $sum: 1 },
                    resolvedComplaints: {
                        $sum: {
                            $cond: [{ $eq: ["$complaintStatus", "Resolved"] }, 1, 0]
                        }
                    }
                }
            },
            {
                $project: {
                    totalComplaints: 1,
                    resolvedComplaints: 1,
                    impactPoints: {
                        $add: [
                            { $multiply: ["$totalComplaints", 10] },
                            { $multiply: ["$resolvedComplaints", 20] }
                        ]
                    }
                }
            }
        ]);

        if (stats.length === 0) {
            return res.status(200).json({ status: "success", data: { totalComplaints: 0, resolvedComplaints: 0, impactPoints: 0 } });
        }

        res.status(200).json({ status: "success", data: stats[0] });

    } catch (error) {
        console.error("Error fetching user stats:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(20);
        const unreadCount = await Notification.countDocuments({ userId, isRead: false });

        res.status(200).json({ status: "success", data: { notifications, unreadCount } });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;
        await Notification.findByIdAndUpdate(id, { isRead: true });
        res.status(200).json({ status: "success", message: "Marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    refreshToken,
    logoutUser,
    getLeaderboard,
    forgotPassword,
    resetPassword,
    getUserStats,
    getNotifications,
    markNotificationRead
};