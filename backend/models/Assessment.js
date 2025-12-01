const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
    recruiterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    questions: [{
        title: String,
        description: String,
        image: String, // Path to uploaded image
        timeLimit: Number, // in minutes
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard'],
            default: 'medium'
        }
    }],
    timeLimit: {
        type: Number, // Total time limit in minutes
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Assessment', AssessmentSchema);
