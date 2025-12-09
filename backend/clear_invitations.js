const mongoose = require('mongoose');
const Invitation = require('./models/Invitation');
const dotenv = require('dotenv');

dotenv.config();

const clearInvitations = async () => {
    try {
        const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-interviewer';
        await mongoose.connect(dbURI);
        console.log('MongoDB Connected to:', dbURI);

        // Delete all invitations
        await Invitation.deleteMany({});
        console.log('All invitations cleared.');

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

clearInvitations();
