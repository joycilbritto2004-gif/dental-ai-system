const Notification = require('../models/Notification');

// @desc    Get all notifications for a user
// @route   GET /api/notifications/:userId
// @access  Public (should be private in prod)
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.params.userId })
                                           .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Public
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (notification) {
      notification.isRead = true;
      const updatedNotification = await notification.save();
      res.json(updatedNotification);
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead
};
