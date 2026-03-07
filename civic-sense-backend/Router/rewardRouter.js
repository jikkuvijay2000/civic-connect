const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, verifyAuthority } = require('../Middlewares/authMiddleware');
const { createReward, getRewards, claimReward, getRewardsAuthority, deleteReward, toggleReward, updateReward, getClaimants } = require('../Controllers/RewardController');

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// Authority routes
router.post('/create', protect, verifyAuthority, upload.single('image'), createReward);
router.get('/authority-list', protect, verifyAuthority, getRewardsAuthority);
router.get('/:id/claimants', protect, verifyAuthority, getClaimants);
router.put('/:id', protect, verifyAuthority, upload.single('image'), updateReward);
router.delete('/:id', protect, verifyAuthority, deleteReward);
router.patch('/:id/toggle', protect, verifyAuthority, toggleReward);

// Citizen routes
router.get('/list', protect, getRewards);
router.post('/claim/:id', protect, claimReward);

module.exports = { rewardRouter: router };
