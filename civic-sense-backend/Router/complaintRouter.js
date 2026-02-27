const express = require("express");
const router = express.Router();
const { createComplaint, getUserContributions, predictComplaint, generateCaption, getAuthorityComplaints, getAuthorityStats, updateComplaintStatus, analyzeVideo, addFeedback, getResolvedComplaints, editComplaint } = require("../Controllers/ComplaintController");
const { protect, verifyAuthority } = require("../Middlewares/authMiddleware");
const multer = require("multer");
const path = require("path");

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // Make sure this folder exists
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });

const fs = require('fs');
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

router.post("/create", protect, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), createComplaint);
router.post("/predict", protect, predictComplaint);
router.post("/caption", protect, upload.single("image"), generateCaption);
router.post("/analyze-video", protect, upload.single("video"), analyzeVideo);
router.get("/my-contributions", protect, getUserContributions);

// Authority Route
router.get("/authority-complaints", protect, verifyAuthority, getAuthorityComplaints);
router.get("/authority-stats", protect, verifyAuthority, getAuthorityStats);
router.put("/update-status/:id", protect, verifyAuthority, updateComplaintStatus);

// Feedback Route
router.post("/feedback/:id", protect, addFeedback);

// Edit Complaint Route (user can edit their own pending complaint)
router.put("/edit/:id", protect, editComplaint);

// Global Resolved Complaints Route
router.get("/resolved", protect, getResolvedComplaints);

module.exports = { complaintRouter: router };
