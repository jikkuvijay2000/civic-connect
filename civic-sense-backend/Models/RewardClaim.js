const mongoose = require('mongoose');

const rewardClaimSchema = new mongoose.Schema({
    reward: { type: mongoose.Schema.Types.ObjectId, ref: 'Reward', required: true },
    claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    claimedAt: { type: Date, default: Date.now },
}, { timestamps: false });

// One claim per user per reward
rewardClaimSchema.index({ reward: 1, claimedBy: 1 }, { unique: true });

module.exports = mongoose.model('RewardClaim', rewardClaimSchema);
