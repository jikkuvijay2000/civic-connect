const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    image: {
        type: String, // URL to image
        default: null
    },
    author: {
        type: String,
        required: true
    },
    role: {
        type: String, // e.g., "City Council", "Police Dept"
        required: true
    },
    tag: {
        type: String,
        enum: ['Alert', 'Event', 'Update', 'News', 'Notice'],
        default: 'Update'
    }
}, {
    timestamps: true
});

const CommunityPost = mongoose.model('CommunityPost', communityPostSchema);

module.exports = { CommunityPost };
