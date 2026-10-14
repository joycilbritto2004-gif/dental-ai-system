const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  channel: {
    type: String,
    enum: ['email', 'sms'],
    required: true,
  },
  recipient: {
    type: String,
    required: true,
  },
  event: {
    type: String,
    default: 'generic',
  },
  status: {
    type: String,
    enum: ['sent', 'failed', 'mocked', 'duplicate'],
    default: 'sent',
  },
  errorMessage: {
    type: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000, // 30 days TTL
  },
});

const NotificationLog = mongoose.model('NotificationLog', notificationLogSchema);

module.exports = NotificationLog;
