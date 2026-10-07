const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getNotifications, markAsRead } = require('../controllers/notificationController');

router.route('/:userId').get(protect, getNotifications);
router.route('/:id/read').put(protect, markAsRead);

module.exports = router;
