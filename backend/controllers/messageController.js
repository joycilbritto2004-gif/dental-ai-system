const Message = require('../models/Message');
const Consultation = require('../models/Consultation');

const getMessagesByConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.consultationId);
    if (!consultation) return res.status(404).json({ message: 'Consultation not found' });
    
    if (req.user.role !== 'admin' && consultation.patientId !== req.user._id.toString() && consultation.doctorId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view messages for this consultation' });
    }

    const messages = await Message.find({ consultationId: req.params.consultationId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createMessage = async (req, res) => {
  try {
    const { type, message, text, image, report, amount, consultationId } = req.body;
    
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) return res.status(404).json({ message: 'Consultation not found' });
    
    if (consultation.patientId !== req.user._id.toString() && consultation.doctorId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to send messages for this consultation' });
    }

    // Prevent saving purely empty text messages
    if (type === 'text' && !message?.trim() && !text?.trim()) {
      return res.status(400).json({ message: "Cannot send an empty message" });
    }

    const newMessage = new Message({
      ...req.body,
      senderId: req.user._id.toString(), // Enforce authentic sender
    });
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
