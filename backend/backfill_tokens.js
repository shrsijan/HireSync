const mongoose = require('mongoose');
const Invitation = require('./models/Invitation');
const Interview = require('./models/Interview');
require('dotenv').config();

const run = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/ai-interviewer';
        console.log(`Connecting to DB...`);
        await mongoose.connect(uri);
        console.log('Connected.');

        const interviews = await Interview.find({ token: { $exists: false } });
        console.log(`Found ${interviews.length} interviews without tokens.`);

        for (const interview of interviews) {
            if (interview.invitationId) {
                const invitation = await Invitation.findById(interview.invitationId);
                if (invitation && invitation.token) {
                    interview.token = invitation.token;
                    await interview.save();
                    console.log(`Updated Interview ${interview._id} with token ${invitation.token}`);
                } else {
                    console.log(`Could not find invitation or token for Interview ${interview._id}`);
                }
            } else {
                console.log(`Interview ${interview._id} has no invitationId.`);
            }
        }

        console.log('Migration complete.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
