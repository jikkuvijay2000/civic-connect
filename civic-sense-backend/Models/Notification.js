const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },
    recipientRole: {
        type: String,
        default: null
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["info", "success", "warning", "error", "Emergency"],
        default: "info"
    },
    isRead: {
        type: Boolean,
        default: false
    },
    link: {
        type: String,
        default: null
    }
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
