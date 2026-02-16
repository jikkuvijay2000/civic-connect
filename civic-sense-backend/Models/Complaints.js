const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({

    complaintId: {
        type: String,
        required: true,
        unique: true
    },
    complaintDescription: {
        type: String,
        required: true
    },
    complaintImage: {
        type: String,
        required: true
    },
    complaintVideo: {
        type: String,
        required: false,
        default: ""
    },
    complaintImageHash: {
        type: String,
        required: true
    },
    complaintVideoHash: {
        type: String,
        required: false,
        default: ""
    },
    complaintLocation: {
        type: String,
        required: true
    },
    complaintStatus: {
        type: String,
        required: true,
        default: "pending"
    },
    complaintType: {
        type: String,
        required: true
    },
    complaintPriority: {
        type: String,
        required: true,
        default: "Low"
    },
    complaintDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    complaintUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    complaintAuthority: {
        type: String,
        required: false,
        default: null
    },
    complaintAIScore: {
        type: Number,
        required: false,
        default: 0
    },
    complaintResolvedDate: {
        type: Date,
        default: null
    },
    complaintResolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
        default: null
    },
    expenses: [{
        item: { type: String, required: true },
        cost: { type: Number, required: true }
    }],
    feedback: {
        message: { type: String, default: "" },
        date: { type: Date, default: null }
    }

}, { timestamps: true })

const complaintModel = mongoose.model("Complaint", complaintSchema);
module.exports = complaintModel;
