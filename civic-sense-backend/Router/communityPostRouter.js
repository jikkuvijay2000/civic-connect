const express = require('express');
const router = express.Router();
const { CommunityPost } = require('../Models/CommunityPost');

// Get all posts (for User Dashboard)
router.get('/', async (req, res) => {
    try {
        const posts = await CommunityPost.find().sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: "Error fetching posts", error });
    }
});

const multer = require("multer");
const path = require("path");
const fs = require('fs');

// Configure Multer (Same as complaintRouter)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, "post-" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const cloudinary = require('../Utils/cloudinary');



// Create a new post (for Authority Dashboard)
router.post('/create', upload.single("image"), async (req, res) => {
    // req.body contains text fields, req.file contains the image
    const { title, content, tag, author, role } = req.body;

    if (!title || !content || !author || !role) {
        return res.status(400).json({ message: "Please fill all required fields" });
    }

    try {
        let imageUrl = null;
        if (req.file) {
            // Upload image to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "civic-sense/community-posts",
            });
            imageUrl = result.secure_url;

            // Remove file from local storage after upload
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
        }

        const newPost = new CommunityPost({
            title,
            content,
            tag: tag || 'Update',
            author,
            role,
            image: imageUrl // Save the Cloudinary URL
        });

        await newPost.save();

        // Emit socket event if it's an alert
        if (newPost.tag === 'Alert') {
            const io = req.app.get('io');
            if (io) {
                io.emit('new_alert', newPost);
                console.log("Emitted new_alert event");
            }
        }

        res.status(201).json({ message: "Community post created successfully", post: newPost });
    } catch (error) {
        console.error("Error creating post:", error);
        // Clean up if error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: "Error creating post", error });
    }
});

module.exports = { communityPostRouter: router };
