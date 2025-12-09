const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const invitationController = require('../controllers/invitationController');

router.post('/', auth, invitationController.inviteCandidate);
router.post('/validate', invitationController.validateInvitation); // Public route, no auth middleware needed for candidate? Or maybe strict checking?
// The candidate doesn't have a login, so no 'auth' middleware on this one usually.
router.get('/', auth, invitationController.getInvitations);
// Public route for candidate to check invitations (or secure via email verification later)
router.get('/candidate/:email', invitationController.getInvitationsByCandidate);

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
router.post('/bulk', auth, upload.single('file'), invitationController.bulkInvite);

module.exports = router;
