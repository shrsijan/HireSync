const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const interviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional for invited candidates
    },
    assessmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
        required: false
    },
    invitationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invitation',
        required: false
    },
    candidateEmail: {
        type: String, // For invited candidates without account
        required: false
    },
    type: {
        type: String,
        enum: ['algorithm', 'system-design', 'behavioral'],
        default: 'algorithm',
    },
    status: {
        type: String,
        enum: ['active', 'completed'],
        default: 'active',
    },
    messages: [messageSchema],
    code: {
        type: String,
        default: '',
    },
    language: {
        type: String,
        default: 'javascript',
    },
    score: {
        type: Number,
    },
    feedback: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Interview', interviewSchema);
