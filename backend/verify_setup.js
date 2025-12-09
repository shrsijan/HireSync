const mongoose = require('mongoose');
const User = require('./models/User');
const Assessment = require('./models/Assessment');
const Invitation = require('./models/Invitation');
const crypto = require('crypto');
require('dotenv').config();

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hiresync');
        console.log('MongoDB Connected');

        // 1. Create Recruiter
        let recruiter = await User.findOne({ email: 'testrecruiter@example.com' });
        if (!recruiter) {
            recruiter = new User({
                name: 'Test Recruiter',
                email: 'testrecruiter@example.com',
                password: 'password123',
                role: 'recruiter',
                companyName: 'Test Corp'
            });
            await recruiter.save();
            console.log('Recruiter created');
        } else {
            console.log('Recruiter exists');
        }

        // 2. Create Assessment
        let assessment = await Assessment.findOne({ title: 'Test Assessment', recruiterId: recruiter._id });
        if (!assessment) {
            assessment = new Assessment({
                recruiterId: recruiter._id,
                title: 'Test Assessment',
                role: 'Senior Developer',
                questions: [
                    {
                        title: 'Reverse a String',
                        description: 'Write a function that reverses a string. The input string is given as an array of characters s. You must do this by modifying the input array in-place with O(1) extra memory.',
                        difficulty: 'easy',
                        timeLimit: 15
                    },
                    {
                        title: 'Two Sum',
                        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
                        difficulty: 'medium',
                        timeLimit: 20
                    }
                ],
                timeLimit: 60,
                expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
            });
            await assessment.save();
            console.log('Assessment created');
        } else {
            console.log('Assessment exists');
        }

        // 3. Create Invitation
        const token = crypto.randomBytes(4).toString('hex'); // Short code like '8f3a2b1c' matches usual length requests
        const invitation = new Invitation({
            assessmentId: assessment._id,
            recruiterId: recruiter._id,
            email: 'candidate@example.com',
            token: token
        });
        await invitation.save();

        console.log('------------------------------------------------');
        console.log('VERIFICATION DATA GENERATED');
        console.log('Assessment Code (Token):', token);
        console.log('------------------------------------------------');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verify();
