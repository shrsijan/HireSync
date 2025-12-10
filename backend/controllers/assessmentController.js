const Assessment = require('../models/Assessment');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, 'assessment-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).any(); // Accept any files, we'll map them manually

// Check File Type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

exports.upload = upload;

exports.createAssessment = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ msg: err });
        }

        try {
            let { title, role, questions, timeLimit, expiryDate } = req.body;

            // Parse questions if it's a string (which it will be with FormData)
            if (typeof questions === 'string') {
                questions = JSON.parse(questions);
            }

            // Map uploaded files to questions
            if (req.files && req.files.length > 0) {
                req.files.forEach(file => {
                    // Assuming frontend sends fieldname as "question-index-image"
                    // But with .any(), we might need a better strategy. 
                    // Let's assume the frontend sends files with fieldnames matching the question index
                    // e.g. "questions[0][image]"

                    // Actually, a simpler way is to just look for the file in the files array
                    // and update the question object.
                    // For now, let's assume the frontend handles the mapping or we just store the path
                    // if the fieldname matches.

                    // Better approach: Frontend sends `questions` as JSON string.
                    // Files are sent separately. We need to link them.
                    // Let's assume the frontend sends a `questionIndex` in the file fieldname or we iterate.

                    // Simplest for MVP:
                    // Frontend sends files with fieldname "image_{questionIndex}"
                    const match = file.fieldname.match(/image_(\d+)/);
                    if (match && questions[match[1]]) {
                        questions[match[1]].image = file.path;
                    }
                });
            }

            const assessment = new Assessment({
                recruiterId: req.user.id,
                title,
                role,
                questions,
                timeLimit,
                expiryDate
            });

            await assessment.save();
            res.json(assessment);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });
};

exports.getAssessments = async (req, res) => {
    try {
        // Use aggregation to get stats joined with assessments
        const assessments = await Assessment.aggregate([
            { $match: { recruiterId: new mongoose.Types.ObjectId(req.user.id) } },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: 'invitations',
                    localField: '_id',
                    foreignField: 'assessmentId',
                    as: 'invitations'
                }
            },
            {
                $lookup: {
                    from: 'interviews', // Assuming collection name is lowercase plural
                    localField: '_id',
                    foreignField: 'assessmentId',
                    as: 'interviews'
                }
            },
            {
                $addFields: {
                    totalCandidates: { $size: "$invitations" },
                    completedCandidates: {
                        $size: {
                            $filter: {
                                input: "$interviews",
                                as: "interview",
                                cond: { $eq: ["$$interview.status", "completed"] }
                            }
                        }
                    },
                    avgScore: {
                        $avg: {
                            $map: {
                                input: {
                                    $filter: {
                                        input: "$interviews",
                                        as: "interview",
                                        cond: { $eq: ["$$interview.status", "completed"] }
                                    }
                                },
                                as: "interview",
                                in: "$$interview.score"
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    invitations: 0,
                    interviews: 0 // Remove heavy arrays, keep only calculated fields + original doc
                }
            }
        ]);

        res.json(assessments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getAssessmentById = async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id);
        if (!assessment) {
            return res.status(404).json({ msg: 'Assessment not found' });
        }
        res.json(assessment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
