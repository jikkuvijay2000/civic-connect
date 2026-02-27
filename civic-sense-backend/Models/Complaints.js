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
    feedbackHistory: [{
        message: { type: String, required: true },
        action: { type: String, required: true, enum: ['Reopen', 'Accept', 'General'] },
        date: { type: Date, default: Date.now }
    }],
    accepted: {
        type: Boolean,
        default: false
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    activityLog: [{
        action: { type: String, required: true },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
        performedByName: { type: String, default: 'Unknown' },
        performedByRole: { type: String, default: 'Citizen', enum: ['Citizen', 'Authority', 'System'] },
        note: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now }
    }]

}, { timestamps: true })

const complaintModel = mongoose.model("Complaint", complaintSchema);
module.exports = complaintModel;
