import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    userName: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    isEmailVerified: {
        type: Boolean,
        default: true
    },
    profileImage: {
        type: String,
        default: ""
    },
    coverImage: {
        type: String,
        default: ""
    },
    headline: {
        type: String,
        default: ""
    },
    bio: {
        type: String,
        default: ""
    },
    skills: [{
        type: String,
        trim: true
    }],
    education: [
        {
            college: { type: String, trim: true },
            degree: { type: String, trim: true },
            fieldOfStudy: { type: String, trim: true },
            startYear: { type: Number },
            endYear: { type: Number },
            description: { type: String }
        }
    ],
    experience: [
        {
            title: { type: String, trim: true },
            company: { type: String, trim: true },
            location: { type: String, trim: true },
            startDate: { type: Date },
            endDate: { type: Date },
            current: { type: Boolean, default: false },
            description: { type: String }
        }
    ],
    location: {
        type: String,
        default: "India"
    },
    website: {
        type: String,
        default: ""
    },
    phoneNumber: {
        type: String,
        default: ""
    },
    gender: {
        type: String,
        enum: ["male", "female", "other", ""],
        default: ""
    },
    // CRITICAL FIX: Add connection field
    connection: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;