const Complaint = require("../Models/Complaints");
const cloudinary = require("../Utils/cloudinary");
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const crypto = require('crypto');
const userModel = require('../Models/User');
const sendEmail = require('../Utils/emailService');

const calculateFileHash = (filePath) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
    });
};

const getDepartmentFromCategory = (category) => {
    // If the category is already a full department name, return it
    if (category.includes('Department')) {
        return category;
    }

    switch (category) {
        case 'Roads': return 'Roads Department';
        case 'Garbage': return 'Sanitation Department';
        case 'Water': return 'Water Department';
        case 'Electricity': return 'Power Department';
        case 'Traffic': return 'Traffic Department';
        case 'Fire': return 'Fire Department';
        case 'Medical': return 'Health Department';
        default: return 'General Administration';
    }
};

const createComplaint = async (req, res) => {
    try {
        const { title, description, category, location, priority, aiScore } = req.body;
        console.log("Create Complaint Body:", req.body);
        console.log("Received AI Score:", aiScore); // Debug log
        const userId = req.user._id; // From authMiddleware (payload has userId)

        if (!title || !description || !category || !location || !priority) {
            return res.status(400).json({ message: "All fields are required" });
        }

        let imageUrl = "";

        let videoUrl = "";
        let aiVideoDescription = "";

        if (req.files && req.files.image) {
            // Calculate Image Hash
            const imageHash = await calculateFileHash(req.files.image[0].path);

            // Allow duplicates for demo purposes? NO, user asked to identify duplicates.
            // Check for duplicate image
            const existingImage = await Complaint.findOne({ complaintImageHash: imageHash });
            if (existingImage) {
                if (fs.existsSync(req.files.image[0].path)) fs.unlinkSync(req.files.image[0].path);
                if (req.files.video && fs.existsSync(req.files.video[0].path)) fs.unlinkSync(req.files.video[0].path);
                return res.status(400).json({ message: "Duplicate image detected. This image has already been used in a complaint." });
            }

            // Detect Fake Image
            try {
                const fakeFormData = new FormData();
                fakeFormData.append('image', fs.createReadStream(req.files.image[0].path));

                const fakeResponse = await axios.post('http://localhost:5004/detect_fake_image', fakeFormData, {
                    headers: { ...fakeFormData.getHeaders() }
                });

                if (fakeResponse.data.is_fake) {
                    if (fs.existsSync(req.files.image[0].path)) fs.unlinkSync(req.files.image[0].path);
                    if (req.files.video && fs.existsSync(req.files.video[0].path)) fs.unlinkSync(req.files.video[0].path);
                    return res.status(400).json({ message: "AI-generated content detected. Please upload real evidence." });
                }
            } catch (fakeError) {
                console.error("Fake Image Detection Failed:", fakeError.message);
            }

            // Upload image to Cloudinary
            const result = await cloudinary.uploader.upload(req.files.image[0].path, {
                folder: "civic-sense/complaints",
            });
            imageUrl = result.secure_url;

            // Store hash
            req.imageHash = imageHash;

            if (fs.existsSync(req.files.image[0].path)) {
                fs.unlinkSync(req.files.image[0].path);
            }
        } else {
            // Handle case where image might be missing if we used upload.fields but enforced it in code
            // Schema says required, so we should check.
            return res.status(400).json({ message: "Image evidence is required" });
        }

        if (req.files && req.files.video) {
            const videoPath = req.files.video[0].path;

            // Calculate Video Hash
            const videoHash = await calculateFileHash(videoPath);

            // Check for duplicate video
            const existingVideo = await Complaint.findOne({ complaintVideoHash: videoHash });
            if (existingVideo) {
                if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                return res.status(400).json({ message: "Duplicate video detected. This video has already been used in a complaint." });
            }
            req.videoHash = videoHash;

            // Detect Fake Video
            try {
                const fakeVideoForm = new FormData();
                fakeVideoForm.append('video', fs.createReadStream(videoPath));

                const fakeVideoResponse = await axios.post('http://localhost:5004/detect_fake_video', fakeVideoForm, {
                    headers: { ...fakeVideoForm.getHeaders() }
                });

                if (fakeVideoResponse.data.is_fake) {
                    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                    if (req.files.image && fs.existsSync(req.files.image[0].path)) {
                        // Current logic: image is already processed/uploaded potentially? 
                        // Actually we process image first. If video is fake, we should probably fail the whole request?
                        // But image is already uploaded to Cloudinary by now.
                        // Ideally we should do all checks before uploads. 
                        // But for now, we just fail the request.
                    }
                    return res.status(400).json({ message: "AI-generated video content detected. Please upload real evidence." });
                }
            } catch (fakeVideoError) {
                console.error("Fake Video Detection Failed:", fakeVideoError.message);
            }

            // 1. Analyze Video with AI Service (local file)
            try {
                // We need to send the file to the python service
                // Create a FormData instance
                const aiFormData = new FormData();
                aiFormData.append('video', fs.createReadStream(videoPath));

                const aiResponse = await axios.post('http://localhost:5003/analyze_video', aiFormData, {
                    headers: {
                        ...aiFormData.getHeaders()
                    }
                });

                if (aiResponse.data && aiResponse.data.description) {
                    aiVideoDescription = aiResponse.data.description;
                }

            } catch (aiError) {
                console.error("Video Analysis Failed:", aiError.message);
                // Continue without AI description
            }

            // 2. Upload Video to Cloudinary
            try {
                const videoResult = await cloudinary.uploader.upload(videoPath, {
                    resource_type: "video",
                    folder: "civic-sense/complaints/videos"
                });
                videoUrl = videoResult.secure_url;
            } catch (cloudError) {
                console.error("Cloudinary Video Upload Failed:", cloudError.message);
                // We might want to fail or continue without video? 
                // Let's continue but warn.
            }

            // 3. Cleanup
            if (fs.existsSync(videoPath)) {
                fs.unlinkSync(videoPath);
            }
        }

        let finalAIScore = (aiScore && !isNaN(parseFloat(aiScore))) ? parseFloat(aiScore) : 45;
        if (priority === 'Emergency') finalAIScore = 100;
        else if (priority === 'High') finalAIScore = Math.max(finalAIScore, 90);

        const newComplaint = new Complaint({
            complaintId: `CMP-${Date.now()}`,
            complaintDescription: description,
            complaintImage: imageUrl,
            complaintVideo: videoUrl,
            complaintImageHash: req.imageHash,
            complaintVideoHash: req.videoHash || "",
            complaintLocation: location,
            complaintType: category,
            complaintPriority: priority,
            complaintUser: userId,
            complaintAuthority: getDepartmentFromCategory(category),
            complaintAIScore: finalAIScore
        });

        // Re-mapping to match model
        let finalDescription = `**${title}**\n${description}`;
        if (aiVideoDescription) {
            finalDescription += `\n\n[AI Analysis]: ${aiVideoDescription}`;
        }
        newComplaint.complaintDescription = finalDescription;

        await newComplaint.save();

        // Check for High Priority / Emergency
        if (priority === 'High' || priority === 'Emergency') {
            const Notification = require('../Models/Notification');

            // Create notification for Authority
            const newNotification = new Notification({
                recipientRole: 'Authority',
                message: `EMERGENCY COMPLAINT: ${title} - ${category}`,
                type: 'Emergency',
                relatedId: newComplaint.complaintId
            });
            await newNotification.save();

            // Emit socket event to authorities
            const io = req.app.get('io');
            if (io) {
                io.emit('new_emergency_complaint', {
                    complaint: newComplaint,
                    notification: newNotification
                });
                console.log("Emitted new_emergency_complaint event");
            }

            // Send Email to Department Authorities
            try {
                const authorities = await userModel.find({ userRole: 'Authority', userDepartment: newComplaint.complaintAuthority });
                authorities.forEach(auth => {
                    sendEmail({
                        email: auth.userEmail,
                        subject: 'URGENT: New Emergency Complaint Received',
                        message: `An emergency complaint has been filed in your department (${newComplaint.complaintAuthority}).\n\nTitle: ${title}\nCategory: ${category}\nLocation: ${location}\nPriority: ${priority}\n\nPlease check your Civic Connect dashboard immediately for more details.`
                    }).catch(err => console.error(`Failed to send emergency email to authority ${auth.userEmail}:`, err.message));
                });
            } catch (authError) {
                console.error("Error fetching authorities for email notification:", authError.message);
            }
        }

        res.status(201).json({ message: "Complaint registered successfully", complaint: newComplaint });

    } catch (error) {
        console.error("Error creating complaint:", error);
        if (req.files) {
            if (req.files.image && fs.existsSync(req.files.image[0].path)) fs.unlinkSync(req.files.image[0].path);
            if (req.files.video && fs.existsSync(req.files.video[0].path)) fs.unlinkSync(req.files.video[0].path);
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getUserContributions = async (req, res) => {
    try {
        const userId = req.user._id;
        const contributions = await Complaint.find({ complaintUser: userId }).sort({ createdAt: -1 });

        res.status(200).json({
            status: "success",
            data: contributions
        });
    } catch (error) {
        console.error("Error fetching contributions:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const predictComplaint = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ message: "Text is required for prediction" });
        }

        // Call Python AI Microservice
        const response = await axios.post('http://localhost:5001/predict', { text });

        res.json(response.data);
    } catch (error) {
        console.error("Error connecting to AI service:", error.message);
        res.status(500).json({ message: "AI Service Unavailable", error: error.message });
    }
};

const generateCaption = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Image is required" });
        }

        // Prepare form data for Python API
        const formData = new FormData();
        formData.append('image', fs.createReadStream(req.file.path));

        // 1. Detect Fake Image
        try {
            const fakeFormData = new FormData();
            fakeFormData.append('image', fs.createReadStream(req.file.path));

            const fakeResponse = await axios.post('http://localhost:5004/detect_fake_image', fakeFormData, {
                headers: { ...fakeFormData.getHeaders() }
            });

            if (fakeResponse.data.is_fake) {
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                return res.status(400).json({ message: "AI-generated content detected. Please upload real evidence." });
            }
        } catch (fakeError) {
            console.error("Fake Image Detection Failed (Captioning):", fakeError.message);
            // Verify if we should block or continue. Safe to continue? 
            // Maybe better to block if service is critical? 
            // Let's log and continue for now to avoid breaking feature if service down.
        }

        // 2. Call Python Image Captioning Service
        const response = await axios.post('http://localhost:5002/caption', formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.json(response.data);
    } catch (error) {
        console.error("Error generating caption:", error.message);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: "Caption Service Unavailable", error: error.message });
    }
};

const getAuthorityComplaints = async (req, res) => {
    try {
        const authorityDepartment = req.user.userDepartment; // Assuming added to token or fetched

        // If authority has no department (e.g. Super Admin), show all? Or handle error.
        // Assuming "General Administration" sees all or specific.
        // For now, strict matching.

        let query = {};
        if (authorityDepartment && authorityDepartment !== 'General Administration') {
            query = { complaintAuthority: authorityDepartment };
        }

        const complaints = await Complaint.find(query)
            .populate('complaintUser', 'userName email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: "success",
            data: complaints
        });
    } catch (error) {
        console.error("Error fetching authority complaints:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


const getAuthorityStats = async (req, res) => {
    try {
        const authorityDepartment = req.user.userDepartment;

        // Base query
        let query = {};
        if (authorityDepartment && authorityDepartment !== 'General Administration') {
            query = { complaintAuthority: authorityDepartment };
        }

        // Get total count
        const totalComplaints = await Complaint.countDocuments(query);

        // Get resolved count
        const resolvedComplaints = await Complaint.countDocuments({ ...query, complaintStatus: 'Resolved' });

        // Get pending count (Pending + In Progress)
        const pendingComplaints = await Complaint.countDocuments({ ...query, complaintStatus: { $in: ['Pending', 'In Progress'] } });

        // Calculate Average AI Confidence
        const complaintsWithScore = await Complaint.find({ ...query, complaintAIScore: { $gt: 0 } });
        let avgConfidence = 0;
        if (complaintsWithScore.length > 0) {
            const totalScore = complaintsWithScore.reduce((acc, curr) => acc + curr.complaintAIScore, 0);
            avgConfidence = Math.round(totalScore / complaintsWithScore.length);
        }

        // AI Confidence Distribution
        const confidenceDistribution = [
            { name: 'High (>80%)', value: await Complaint.countDocuments({ ...query, complaintAIScore: { $gt: 80 } }) },
            { name: 'Medium (50-80%)', value: await Complaint.countDocuments({ ...query, complaintAIScore: { $gte: 50, $lte: 80 } }) },
            { name: 'Low (<50%)', value: await Complaint.countDocuments({ ...query, complaintAIScore: { $lt: 50, $gt: 0 } }) }
        ];

        // Category Stats for AI Chart
        const categoryStats = await Complaint.aggregate([
            { $match: query },
            { $group: { _id: "$complaintType", count: { $sum: 1 } } }
        ]);

        // Priority Stats for Emergency Tracking
        const priorityStats = await Complaint.aggregate([
            { $match: query },
            { $group: { _id: "$complaintPriority", count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            status: "success",
            data: {
                total: totalComplaints,
                resolved: resolvedComplaints,
                pending: pendingComplaints,
                avgConfidence: avgConfidence,
                confidenceDistribution,
                categoryStats,
                priorityStats
            }
        });

    } catch (error) {
        console.error("Error fetching authority stats:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const updateComplaintStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        // Try to find by complaintId (custom ID) first, or fallback to _id if it looks like an ObjectId
        let complaint = await Complaint.findOne({ complaintId: id });

        if (!complaint && id.match(/^[0-9a-fA-F]{24}$/)) {
            complaint = await Complaint.findById(id);
        }

        if (!complaint) {
            return res.status(404).json({ message: "Complaint not found" });
        }

        complaint.complaintStatus = status;
        if (notes !== undefined) {
            complaint.complaintNotes = notes;
        }
        if (status === 'Resolved') {
            complaint.complaintResolvedDate = Date.now();
            complaint.complaintResolvedBy = req.user._id;

            // Handle Expenses
            if (req.body.expenses && Array.isArray(req.body.expenses)) {
                complaint.expenses = req.body.expenses;
            }
        }

        await complaint.save();

        // Create Notification for User
        const Notification = require('../Models/Notification');
        const notificationMessage = `Your complaint "${complaint.complaintType}" has been updated to: ${status}`;
        const newNotification = new Notification({
            userId: complaint.complaintUser,
            message: notificationMessage,
            type: status === 'Resolved' ? 'success' : 'info',
            relatedId: complaint.complaintId
        });
        await newNotification.save();

        // Emit Socket Event
        const io = req.app.get('io');
        if (io) {
            io.to(complaint.complaintUser.toString()).emit('notification', newNotification);
            console.log(`Notification emitted to user ${complaint.complaintUser}`);
        }

        res.status(200).json({ message: "Status updated successfully", complaint });
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getResolvedComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({
            complaintStatus: { $in: ['Resolved', 'Closed'] }
        })
            .populate('complaintUser', 'userName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: "success",
            data: complaints
        });
    } catch (error) {
        console.error("Error fetching resolved complaints:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const addFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { message, action } = req.body; // action: 'Accept' | 'Reopen' | 'General'

        if (!message) {
            return res.status(400).json({ message: "Feedback message is required" });
        }

        // Try to find by complaintId (custom ID) first, or fallback to _id
        let complaint = await Complaint.findOne({ complaintId: id });
        if (!complaint && id.match(/^[0-9a-fA-F]{24}$/)) {
            complaint = await Complaint.findById(id);
        }

        if (!complaint) {
            return res.status(404).json({ message: "Complaint not found" });
        }

        const feedbackEntry = {
            message: message,
            action: action || 'General',
            date: Date.now()
        };

        if (!complaint.feedbackHistory) {
            complaint.feedbackHistory = [];
        }

        // Push to array
        complaint.feedbackHistory.push(feedbackEntry);

        // Also support old UI falling back to last message
        complaint.feedback = {
            message: message,
            date: Date.now()
        };

        const Notification = require('../Models/Notification');

        if (action === 'Accept') {
            complaint.complaintStatus = "Closed";
            complaint.accepted = true;

            const newNotification = new Notification({
                recipientRole: 'Authority',
                message: `User accepted resolution for ticket: ${complaint.complaintType} - ${complaint.complaintId}`,
                type: 'success',
                relatedId: complaint.complaintId
            });
            await newNotification.save();
        } else {
            complaint.complaintStatus = "Pending";

            const newNotification = new Notification({
                recipientRole: 'Authority',
                message: `Feedback received, ticket reopened: ${complaint.complaintType} - ${complaint.complaintId}`,
                type: 'warning',
                relatedId: complaint.complaintId
            });
            await newNotification.save();
        }

        await complaint.save();

        // Emit Socket Event to Authority Room (or broadcast to authorities)
        const io = req.app.get('io');
        if (io) {
            io.emit('authority_notification', {
                message: `User updated feedback on ${complaint.complaintId}`,
                complaintId: complaint.complaintId,
                department: complaint.complaintAuthority
            });
        }

        res.status(200).json({ message: "Feedback action processed", complaint });

    } catch (error) {
        console.error("Error adding feedback:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


const analyzeVideo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Video is required" });
        }

        const videoPath = req.file.path;
        console.log("Analyzing video at:", videoPath);

        // Call Python AI Microservice
        const aiFormData = new FormData();
        aiFormData.append('video', fs.createReadStream(videoPath));

        // 1. Detect Fake Video
        try {
            const fakeVideoForm = new FormData();
            fakeVideoForm.append('video', fs.createReadStream(videoPath));

            const fakeResponse = await axios.post('http://localhost:5004/detect_fake_video', fakeVideoForm, {
                headers: { ...fakeVideoForm.getHeaders() }
            });

            if (fakeResponse.data.is_fake) {
                if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
                return res.status(400).json({ message: "AI-generated video content detected. Please upload real evidence." });
            }
        } catch (fakeError) {
            console.error("Fake Video Detection Failed (Analysis):", fakeError.message);
        }

        // 2. Analyze Video

        const response = await axios.post('http://localhost:5003/analyze_video', aiFormData, {
            headers: {
                ...aiFormData.getHeaders()
            }
        });

        // Clean up uploaded file
        if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
        }

        res.json(response.data);

    } catch (error) {
        console.error("Error analyzing video:", error.message);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: "Video Analysis Service Unavailable", error: error.message });
    }
};

module.exports = { createComplaint, getUserContributions, predictComplaint, generateCaption, getAuthorityComplaints, getAuthorityStats, updateComplaintStatus, addFeedback, getResolvedComplaints, analyzeVideo };
