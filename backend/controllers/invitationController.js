const Invitation = require('../models/Invitation');
const Assessment = require('../models/Assessment');
const crypto = require('crypto');
// In a real app, you would use a mailer service like Nodemailer here
// const sendEmail = require('../utils/sendEmail');

const nodemailer = require('nodemailer');

exports.inviteCandidate = async (req, res) => {
    try {
        const { assessmentId, email } = req.body;

        // Verify assessment belongs to recruiter
        const assessment = await Assessment.findOne({ _id: assessmentId, recruiterId: req.user.id });
        if (!assessment) {
            return res.status(404).json({ msg: 'Assessment not found or unauthorized' });
        }

        // Generate unique token with retry mechanism
        let token;
        let isUnique = false;

        while (!isUnique) {
            token = crypto.randomBytes(5).toString('hex'); // 10 chars
            const existing = await Invitation.findOne({ token });
            if (!existing) {
                isUnique = true;
            }
        }

        const invitation = new Invitation({
            assessmentId,
            recruiterId: req.user.id,
            email,
            token
        });

        await invitation.save();

        // Email logic removed as per requirements.
        // Recruiter will manually share the code.

        console.log(`Invitation generated for ${email}. Token: ${token}`);

        res.json({ msg: 'Invitation generated', token, previewUrl: null });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.getInvitations = async (req, res) => {
    try {
        const invitations = await Invitation.find({ recruiterId: req.user.id })
            .populate('assessmentId', 'title role')
            .sort({ createdAt: -1 });
        res.json(invitations);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.validateInvitation = async (req, res) => {
    try {
        const { token } = req.body;
        console.log("Validating token input:", token);

        // Case-insensitive search if needed, but let's check exact match first
        const invitation = await Invitation.findOne({ token });

        console.log("Invitation found:", invitation ? "YES" : "NO");

        if (!invitation) {
            console.log("Invalid token debug: Token not found in DB.");
            return res.status(404).json({ msg: 'Invalid invitation code' });
        }

        if (invitation.status === 'completed') {
            return res.status(400).json({ msg: 'This assessment has already been completed' });
        }

        // Check if expired based on assessment expiryDate ?? 
        // Or Invitation might have its own expiry logic, but usually it's tied to assessment.

        const assessment = await Assessment.findById(invitation.assessmentId)
            .select('-questions.answer')
            .populate('recruiterId', 'companyName');

        if (!assessment) {
            return res.status(404).json({ msg: 'Assessment not found' });
        }

        if (new Date() > new Date(assessment.expiryDate)) {
            return res.status(400).json({ msg: 'Assessment has expired' });
        }

        // Return relevant details to start the assessment
        res.json({
            invitationId: invitation._id,
            assessment: {
                title: assessment.title,
                role: assessment.role,
                description: assessment.description, // if exists
                questions: assessment.questions,
                timeLimit: assessment.timeLimit,
                companyName: assessment.recruiterId ? assessment.recruiterId.companyName : "Tech Corp"
            },
            candidateEmail: invitation.email
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.getInvitationsByCandidate = async (req, res) => {
    try {
        const { email } = req.params;
        const invitations = await Invitation.find({ email })
            .populate('assessmentId', 'title role timeLimit expiryDate')
            .sort({ createdAt: -1 });

        // Transform to match frontend interface
        const formattedInvitations = invitations.map(inv => ({
            _id: inv._id,
            companyName: "Tech Corp", // Placeholder or fetch from Recruiter/Company model if available
            role: inv.assessmentId ? inv.assessmentId.role : 'N/A',
            status: inv.status,
            title: inv.assessmentId ? inv.assessmentId.title : 'Assessment',
            assessment: {
                timeLimit: inv.assessmentId ? inv.assessmentId.timeLimit : 0,
                expiryDate: inv.assessmentId ? inv.assessmentId.expiryDate : null
            },
            createdAt: inv.createdAt
        }));

        res.json(formattedInvitations);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

const csv = require('csv-parser');
const fs = require('fs');

exports.bulkInvite = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        const { assessmentId } = req.body;
        const results = [];
        const invitations = [];

        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    // Process each row
                    for (const row of results) {
                        // Assuming CSV headers: FirstName, LastName, Email
                        // Case insensitive key mapping could be added for robustness
                        const email = row.Email || row.email;
                        const firstName = row.FirstName || row.firstname || row['First Name'];
                        const lastName = row.LastName || row.lastname || row['Last Name'];

                        if (email) {
                            // Generate unique token (simplified for bulk to avoid N DB calls, relying on 5 bytes entropy + error catch if needed, OR do check)
                            // For robustness as requested:
                            let token;
                            let isUnique = false;
                            while (!isUnique) {
                                token = crypto.randomBytes(5).toString('hex');
                                const existing = await Invitation.findOne({ token });
                                if (!existing) isUnique = true;
                            }

                            const invitation = new Invitation({
                                assessmentId,
                                recruiterId: req.user.id,
                                email,
                                firstName,
                                lastName,
                                token
                            });

                            await invitation.save();
                            invitations.push({
                                email,
                                firstName,
                                lastName,
                                token
                            });
                        }
                    }

                    // Clean up uploaded file
                    fs.unlinkSync(req.file.path);

                    res.json({ msg: 'Bulk invitations generated', count: invitations.length, invitations });
                } catch (err) {
                    console.error('Error processing CSV:', err);
                    res.status(500).json({ msg: 'Error processing CSV file' });
                }
            });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: `Server Error: ${err.message}` });
    }
};
