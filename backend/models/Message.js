const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  consultationId: { type: String, required: true },
  sender: { type: String, required: true },
  type: { type: String, required: true, default: 'text' },
  text: { type: String },
  image: { type: String },
  report: { type: mongoose.Schema.Types.Mixed },
  amount: { type: Number },
  time: { type: String, required: true },
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
