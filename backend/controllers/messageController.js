const mongoose = require('mongoose');
const Message = require('../models/Message');
const Consultation = require('../models/Consultation');

const getMessagesByConsultation = async (req, res) => {
  try {
    const { consultationId } = req.params;
    if (!consultationId) {
      return res.status(400).json({ message: 'Invalid or missing consultation ID' });
    }

    let consultation = null;
    if (mongoose.Types.ObjectId.isValid(consultationId)) {
      consultation = await Consultation.findById(consultationId);
    }
    if (!consultation) {
      consultation = await Consultation.findOne({ id: consultationId });
    }
    if (!consultation) return res.status(404).json({ message: 'Consultation not found' });
    
    const userId = req.user._id.toString();
    const isPatient = consultation.patientId === userId;
    const isDoctor = consultation.doctorId === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view messages for this consultation' });
    }

    const messages = await Message.find({ consultationId: consultation._id.toString() }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createMessage = async (req, res) => {
  try {
    const { type = 'text', message, text, image, report, amount, consultationId } = req.body;
    
    if (!consultationId) {
      return res.status(400).json({ message: 'Invalid or missing consultation ID' });
    }

    let consultation = null;
    if (mongoose.Types.ObjectId.isValid(consultationId)) {
      consultation = await Consultation.findById(consultationId);
    }
    if (!consultation) {
      consultation = await Consultation.findOne({ id: consultationId });
    }
    if (!consultation) return res.status(404).json({ message: 'Consultation not found' });
    
    const userId = req.user._id.toString();
    const isPatient = consultation.patientId === userId;
    const isDoctor = consultation.doctorId === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to send messages for this consultation' });
    }

    // Business rule: Enforce status locking
    // 1. Pending / Booked — locked until doctor accepts
    if (consultation.status === 'Pending' || consultation.status === 'Booked') {
      return res.status(400).json({
        message: 'Your doctor has not accepted this consultation yet. Messaging will unlock after acceptance.'
      });
    }

    // 2. Completed / Verified — read-only; new messages cannot be sent
    if (consultation.status === 'Completed' || consultation.status === 'Verified') {
      return res.status(400).json({
        message: 'This consultation has been completed. New messages cannot be sent.'
      });
    }

    // 3. Rejected / Cancelled — disabled; new messages cannot be sent
    if (consultation.status === 'Rejected' || consultation.status === 'Cancelled') {
      return res.status(400).json({
        message: 'This consultation has been cancelled. New messages cannot be sent.'
      });
    }

    // 4. Any other non-active status
    const activeMessagingStatuses = ['Accepted', 'Confirmed', 'In Consultation', 'In Progress'];
    if (!activeMessagingStatuses.includes(consultation.status)) {
      return res.status(400).json({
        message: 'Messaging is unavailable for this consultation status.'
      });
    }

    const messageContent = (message || text || '').trim();
    if (type === 'text' && !messageContent && !image && !report) {
      return res.status(400).json({ message: 'Cannot send an empty message' });
    }

    const receiverId = isDoctor ? consultation.patientId : consultation.doctorId;
    const senderRole = req.user.role;

    const newMessage = new Message({
      consultationId: consultation._id.toString(),
      sender: senderRole,
      senderId: userId,
      receiverId,
      type,
      message: messageContent,
      text: messageContent,
      image: image || undefined,
      report: report || undefined,
      amount: amount || undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date()
    });

    const createdMessage = await newMessage.save();

    // Emit new-message in real time via Socket.IO
    try {
      const { getIO } = require('../socket');
      const io = getIO();
      if (io) {
        io.to(`consultation_${consultation._id}`).emit('new-message', createdMessage);
        if (consultation.id && consultation.id !== consultation._id.toString()) {
          io.to(`consultation_${consultation.id}`).emit('new-message', createdMessage);
        }
        if (receiverId) {
          io.to(`user_${receiverId}`).emit('new-message', createdMessage);
        }
      }
    } catch (sockErr) {
      console.error('Socket emission error in createMessage:', sockErr.message);
    }

    res.status(201).json(createdMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getMessagesByConsultation,
  createMessage,
};

