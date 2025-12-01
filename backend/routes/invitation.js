const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const invitationController = require('../controllers/invitationController');

router.post('/', auth, invitationController.inviteCandidate);
router.get('/', auth, invitationController.getInvitations);

module.exports = router;
