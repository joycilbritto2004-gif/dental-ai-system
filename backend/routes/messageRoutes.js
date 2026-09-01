const express = require('express');
const router = express.Router();
const { getMessagesByConsultation, createMessage } = require('../controllers/messageController');

router.route('/:consultationId').get(getMessagesByConsultation);
router.route('/').post(createMessage);

module.exports = router;
