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

        const token = crypto.randomBytes(20).toString('hex');

        const invitation = new Invitation({
            assessmentId,
            recruiterId: req.user.id,
            email,
            token
        });

        await invitation.save();

        // Create Nodemailer transporter (using Ethereal for testing)
        // In production, use real SMTP credentials
        let testAccount = await nodemailer.createTestAccount();

        let transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass, // generated ethereal password
            },
        });

        const inviteLink = `http://localhost:3000/interview/new?invite=${token}`;

        let info = await transporter.sendMail({
            from: '"Hiresync Recruiter" <recruiter@hiresync.com>', // sender address
            to: email, // list of receivers
            subject: `Invitation to Assessment: ${assessment.title}`, // Subject line
            text: `You have been invited to take the assessment: ${assessment.title}. Click the link to start: ${inviteLink}`, // plain text body
            html: `
                <h3>You have been invited to take the assessment: ${assessment.title}</h3>
                <p><strong>Role:</strong> ${assessment.role}</p>
                <p><strong>Time Limit:</strong> ${assessment.timeLimit} minutes</p>
                <p>Please click the link below to start your assessment:</p>
                <a href="${inviteLink}">${inviteLink}</a>
                <p>This link will expire on ${new Date(assessment.expiryDate).toLocaleDateString()}.</p>
            `, // html body
        });

        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

        res.json({ msg: 'Invitation sent', token, previewUrl: nodemailer.getTestMessageUrl(info) });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
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
        res.status(500).send('Server Error');
    }
};
