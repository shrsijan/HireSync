const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const assessmentController = require('../controllers/assessmentController');

router.post('/', auth, assessmentController.createAssessment);
router.get('/', auth, assessmentController.getAssessments);
router.get('/:id', auth, assessmentController.getAssessmentById);

module.exports = router;
