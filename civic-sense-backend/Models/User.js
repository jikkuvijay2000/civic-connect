const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true,
        unique: true
    },
    userAddress: {
        type: String,
        required: true
    },
    userRole: {
        type: String,
        required: true,
        default: "Citizen"
    },
    userDepartment: {
        type: String,
        default: null
    },
    userPassword: {
        type: String,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    refreshToken: {
        type: String,
        default: null
    },
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    verificationOTP: {
        type: String,
        default: null
    }

}, { timestamps: true })

const userModel = mongoose.model("User", userSchema);
module.exports = userModel;