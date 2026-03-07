const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    image: { type: String, default: '' },          // Cloudinary URL
    pointsRequired: { type: Number, required: true, min: 1 },
    promoCode: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Reward', rewardSchema);
