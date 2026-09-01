const Message = require('../models/Message');

const getMessagesByConsultation = async (req, res) => {
  try {
    const messages = await Message.find({ consultationId: req.params.consultationId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createMessage = async (req, res) => {
  try {
    const message = new Message(req.body);
    const createdMessage = await message.save();
    res.status(201).json(createdMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getMessagesByConsultation,
  createMessage,
};
