const mongoose = require('mongoose');
const Interview = require('./models/Interview');
require('dotenv').config();

const run = async () => {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/ai-interviewer';
        console.log(`Connecting to DB...`);
        await mongoose.connect(uri);
        console.log('Connected.');

        const targetAssessmentId = '6939bf8db1f7dad80eae8b45'; // From user report
        console.log(`Querying for Assessment ID: ${targetAssessmentId}`);

        // 1. String Query
        const resultsString = await Interview.find({ assessmentId: targetAssessmentId });
        console.log(`Found using String ID: ${resultsString.length}`);

        // 2. ObjectId Query
        const resultsObjectId = await Interview.find({ assessmentId: new mongoose.Types.ObjectId(targetAssessmentId) });
        console.log(`Found using ObjectId: ${resultsObjectId.length}`);

        if (resultsObjectId.length > 0) {
            console.log('Sample Interview:', JSON.stringify(resultsObjectId[0], null, 2));
        } else {
            console.log('No interviews found for this assessment.');
            // Dump all assessment IDs in interviews to see what's there
            const all = await Interview.find({}, 'assessmentId');
            console.log('Existing Assessment IDs in Interviews:', all.map(i => i.assessmentId));
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
