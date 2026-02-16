const mongoose = require("mongoose");
const Complaint = require("./Models/Complaints");
const User = require("./Models/User");
require("dotenv").config();

const debugStats = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Connected to DB");

        // 1. Find ANY user with complaints
        const complaint = await Complaint.findOne();
        if (!complaint) {
            console.log("No complaints found in DB at all.");
            return;
        }

        const userId = complaint.complaintUser;
        console.log("Found a complaint for user ID:", userId);

        const user = await User.findById(userId);
        if (user) {
            console.log("User found:", user.userEmail);
        } else {
            console.log("User not found for this complaint ID.");
        }

        // 2. Count raw complaints for this user
        const rawCount = await Complaint.countDocuments({ complaintUser: userId });
        console.log("Raw count matching user ID:", rawCount);

        // 3. Run Aggregation
        const stats = await Complaint.aggregate([
            { $match: { complaintUser: userId } },
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
            }
        ]);

        console.log("Aggregation Result:", stats);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
};

debugStats();
