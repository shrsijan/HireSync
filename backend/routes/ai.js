const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
// Add auth middleware here if needed
// const auth = require('../middleware/auth');

router.post('/chat', aiController.chat);

module.exports = router;
