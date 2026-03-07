const Reward = require('../Models/Reward');
const RewardClaim = require('../Models/RewardClaim');
const Complaint = require('../Models/Complaints');
const cloudinary = require('../Utils/cloudinary');
const mongoose = require('mongoose');
const fs = require('fs');
const sendEmail = require('../Utils/emailService');

/* ── Helper: compute impact points for a user ── */
const getUserImpactPoints = async (userId) => {
    const result = await Complaint.aggregate([
        { $match: { complaintUser: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: '$complaintUser',
                totalComplaints: { $sum: 1 },
                resolvedComplaints: {
                    $sum: { $cond: [{ $eq: ['$complaintStatus', 'Resolved'] }, 1, 0] }
                }
            }
        },
        {
            $project: {
                impactPoints: {
                    $add: [
                        { $multiply: ['$totalComplaints', 10] },
                        { $multiply: ['$resolvedComplaints', 20] }
                    ]
                }
            }
        }
    ]);
    return result.length > 0 ? result[0].impactPoints : 0;
};

/* ── Create Reward (Authority) ── */
const createReward = async (req, res) => {
    try {
        const { title, description, pointsRequired, promoCode } = req.body;

        if (!title || !description || !pointsRequired || !promoCode) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'All fields are required' });
        }

        let imageUrl = '';
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'civic-sense/rewards',
            });
            imageUrl = result.secure_url;
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        }

        const reward = new Reward({
            title,
            description,
            image: imageUrl,
            pointsRequired: parseInt(pointsRequired),
            promoCode,
            createdBy: req.user._id,
        });

        await reward.save();
        res.status(201).json({ status: 'success', data: reward });
    } catch (error) {
        console.error('Error creating reward:', error);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/* ── Get all active rewards with claim status for current user ── */
const getRewards = async (req, res) => {
    try {
        const userId = req.user._id;
        const rewards = await Reward.find({ isActive: true }).sort({ pointsRequired: 1 });

        // Get user's impact points
        const myPoints = await getUserImpactPoints(userId);

        // Find rewards already claimed by this user
        const myClaims = await RewardClaim.find({ claimedBy: userId }).select('reward promoCode');
        const claimMap = new Map(myClaims.map(c => [c.reward.toString(), c]));

        // Get claim counts per reward
        const claimCounts = await RewardClaim.aggregate([
            { $group: { _id: '$reward', count: { $sum: 1 } } }
        ]);
        const countMap = new Map(claimCounts.map(c => [c._id.toString(), c.count]));

        const enriched = rewards.map(r => {
            const rId = r._id.toString();
            const claim = claimMap.get(rId);
            return {
                _id: r._id,
                title: r.title,
                description: r.description,
                image: r.image,
                pointsRequired: r.pointsRequired,
                claimedByMe: !!claim,
                promoCode: claim ? r.promoCode : null,   // only reveal if claimed
                claimCount: countMap.get(rId) || 0,
                createdAt: r.createdAt,
            };
        });

        res.status(200).json({ status: 'success', data: enriched, myPoints });
    } catch (error) {
        console.error('Error fetching rewards:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/* ── Claim a reward (Citizen) ── */
const claimReward = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const reward = await Reward.findById(id);
        if (!reward || !reward.isActive) {
            return res.status(404).json({ message: 'Reward not found' });
        }

        // Check already claimed
        const existing = await RewardClaim.findOne({ reward: id, claimedBy: userId });
        if (existing) {
            return res.status(400).json({ message: 'Already claimed', promoCode: reward.promoCode });
        }

        // Check points
        const myPoints = await getUserImpactPoints(userId);
        if (myPoints < reward.pointsRequired) {
            return res.status(400).json({
                message: `Not enough points. You have ${myPoints} pts, need ${reward.pointsRequired} pts.`,
                myPoints,
                required: reward.pointsRequired
            });
        }

        const claim = await RewardClaim.create({ reward: id, claimedBy: userId });

        // Send promo code email (non-blocking — don't fail the claim if email fails)
        try {
            const userModel = require('../Models/User');
            const user = await userModel.findById(userId).select('userEmail userName');
            if (user) {
                await sendEmail({
                    email: user.userEmail,
                    subject: `🎁 Your Civic Connect Reward: ${reward.title}`,
                    message: `Hi ${user.userName},\n\nCongratulations! You have successfully claimed the reward "${reward.title}".\n\nYour promo code: ${reward.promoCode}\n\nThank you for contributing to your community through Civic Connect!\n\n– The Civic Connect Team`,
                    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:36px 40px;text-align:center;">
      <div style="font-size:40px;margin-bottom:8px;">🎁</div>
      <h1 style="color:white;margin:0;font-size:1.5rem;font-weight:800;">Reward Claimed!</h1>
      <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:0.9rem;">Your promo code is ready to use</p>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#374151;font-size:0.95rem;margin-top:0;">Hi <strong>${user.userName}</strong>,</p>
      <p style="color:#6b7280;font-size:0.9rem;line-height:1.6;">You've successfully claimed <strong>${reward.title}</strong> using your Civic Connect impact points. Here's your exclusive promo code:</p>
      <div style="background:#0f172a;border-radius:12px;padding:20px 24px;text-align:center;margin:24px 0;border:1px solid rgba(251,191,36,0.3);">
        <p style="color:#94a3b8;font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px;">Promo Code</p>
        <span style="font-family:monospace;color:#fbbf24;font-size:1.6rem;font-weight:800;letter-spacing:0.15em;">${reward.promoCode}</span>
      </div>
      <p style="color:#6b7280;font-size:0.82rem;line-height:1.6;">${reward.description}</p>
      <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0;"/>
      <p style="color:#9ca3af;font-size:0.78rem;margin:0;">Thank you for making your community better through Civic Connect. Every complaint resolved earns you more impact points!</p>
    </div>
    <div style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:0.75rem;margin:0;">© ${new Date().getFullYear()} Civic Connect — Civic Sense Platform</p>
    </div>
  </div>
</body>
</html>`
                });
            }
        } catch (emailErr) {
            console.error('Reward email failed (non-fatal):', emailErr.message);
        }

        res.status(200).json({
            status: 'success',
            message: 'Reward claimed!',
            promoCode: reward.promoCode
        });
    } catch (error) {
        if (error.code === 11000) {
            // Duplicate key (race condition) — still return the promo code
            const reward = await Reward.findById(req.params.id);
            return res.status(400).json({ message: 'Already claimed', promoCode: reward?.promoCode });
        }
        console.error('Error claiming reward:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/* ── Get all rewards for Authority management view (includes promo code) ── */
const getRewardsAuthority = async (req, res) => {
    try {
        const rewards = await Reward.find().sort({ createdAt: -1 });
        const claimCounts = await RewardClaim.aggregate([
            { $group: { _id: '$reward', count: { $sum: 1 } } }
        ]);
        const countMap = new Map(claimCounts.map(c => [c._id.toString(), c.count]));

        const enriched = rewards.map(r => ({
            ...r.toObject(),
            claimCount: countMap.get(r._id.toString()) || 0,
        }));

        res.status(200).json({ status: 'success', data: enriched });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/* ── Delete Reward (Authority) ── */
const deleteReward = async (req, res) => {
    try {
        const { id } = req.params;
        const reward = await Reward.findByIdAndDelete(id);
        if (!reward) return res.status(404).json({ message: 'Reward not found' });
        res.status(200).json({ status: 'success', message: 'Reward deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/* ── Toggle active/inactive ── */
const toggleReward = async (req, res) => {
    try {
        const { id } = req.params;
        const reward = await Reward.findById(id);
        if (!reward) return res.status(404).json({ message: 'Reward not found' });
        reward.isActive = !reward.isActive;
        await reward.save();
        res.status(200).json({ status: 'success', data: reward });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/* ── Update Reward (Authority) ── */
const updateReward = async (req, res) => {
    try {
        const { id } = req.params;
        const reward = await Reward.findById(id);
        if (!reward) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'Reward not found' });
        }

        const { title, description, pointsRequired, promoCode } = req.body;

        if (title !== undefined) reward.title = title;
        if (description !== undefined) reward.description = description;
        if (pointsRequired !== undefined) reward.pointsRequired = parseInt(pointsRequired);
        if (promoCode !== undefined) reward.promoCode = promoCode;

        // Replace image if a new one was uploaded
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'civic-sense/rewards',
            });
            reward.image = result.secure_url;
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        }

        await reward.save();
        res.status(200).json({ status: 'success', data: reward });
    } catch (error) {
        console.error('Error updating reward:', error);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

/* ── Get claimants for a reward (Authority) ── */
const getClaimants = async (req, res) => {
    try {
        const { id } = req.params;
        const reward = await Reward.findById(id);
        if (!reward) return res.status(404).json({ message: 'Reward not found' });

        const claims = await RewardClaim.find({ reward: id })
            .populate('claimedBy', 'userName userEmail userAddress')
            .sort({ claimedAt: -1 });

        const claimants = claims.map(c => ({
            claimId: c._id,
            claimedAt: c.claimedAt || c.createdAt,
            user: c.claimedBy ? {
                _id: c.claimedBy._id,
                name: c.claimedBy.userName,
                email: c.claimedBy.userEmail,
                address: c.claimedBy.userAddress,
            } : null,
        }));

        res.status(200).json({ status: 'success', data: claimants, rewardTitle: reward.title });
    } catch (error) {
        console.error('Error fetching claimants:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { createReward, getRewards, claimReward, getRewardsAuthority, deleteReward, toggleReward, updateReward, getClaimants };
