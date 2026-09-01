const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead } = require('../controllers/notificationController');

router.route('/:userId').get(getNotifications);
router.route('/:id/read').put(markAsRead);

module.exports = router;
