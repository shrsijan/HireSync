const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');

router.post('/submit', interviewController.submitInterview);
router.get('/assessment/:assessmentId', interviewController.getInterviewsByAssessment);

module.exports = router;
