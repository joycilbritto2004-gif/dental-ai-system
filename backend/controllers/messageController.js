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
    const { type, message, text, image, report, amount } = req.body;
    
    // Prevent saving purely empty text messages
    if (type === 'text' && !message?.trim() && !text?.trim()) {
      return res.status(400).json({ message: "Cannot send an empty message" });
    }

    const newMessage = new Message(req.body);
    const createdMessage = await newMessage.save();
    res.status(201).json(createdMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getMessagesByConsultation,
  createMessage,
};
