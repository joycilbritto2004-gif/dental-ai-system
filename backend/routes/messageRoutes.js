const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getMessagesByConsultation, createMessage } = require('../controllers/messageController');

router.route('/:consultationId').get(protect, getMessagesByConsultation);
router.route('/').post(protect, createMessage);

module.exports = router;
