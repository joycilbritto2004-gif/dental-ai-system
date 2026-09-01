const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  consultationId: { type: String, required: true },
  sender: { type: String, required: true },
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  type: { type: String, required: true, default: 'text' },
  message: { type: String },
  text: { type: String }, // Legacy compatibility
  image: { type: String },
  report: { type: mongoose.Schema.Types.Mixed },
  amount: { type: Number },
  time: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

messageSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  }
});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
