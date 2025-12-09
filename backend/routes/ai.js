const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const geminiController = require('../controllers/geminiController');
// Add auth middleware here if needed
// const auth = require('../middleware/auth');

router.post('/chat', aiController.chat);
router.post('/gemini-chat', geminiController.chat);

module.exports = router;
