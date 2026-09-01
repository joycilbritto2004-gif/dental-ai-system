const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: { type: String, required: true },
  recipientRole: { type: String, required: true, enum: ['patient', 'doctor', 'admin'] },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'info' },
  consultationId: { type: String },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

// We transform _id to id so frontend can just use .id
notificationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  }
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
