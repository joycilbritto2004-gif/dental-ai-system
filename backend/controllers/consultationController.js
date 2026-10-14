const Consultation = require('../models/Consultation');
const Notification = require('../models/Notification');
const User = require('../models/User');
const sendEmail = require('../utils/emailService');
const { sendSMS } = require('../utils/smsService');

const sendNotificationEmail = async (options) => {
  try {
    await sendEmail(options);
  } catch (error) {
    console.error('Email notification failed:', error.message);
  }
};

// @desc    Create new consultation
// @route   POST /api/consultations
// @access  Public
const createConsultation = async (req, res) => {
  try {
    const { doctorId } = req.body;
    
    // Validate patient identity
    const patientId = req.user._id.toString();
    const patientName = req.user.name;

    const consultation = new Consultation({
      ...req.body,
      patientId,
      patientName,
    });
    
    const createdConsultation = await consultation.save();
    
    // Notify Doctor via in-app
    try {
      if (createdConsultation.doctorId) {
        await Notification.create({
          recipientId: createdConsultation.doctorId,
          recipientRole: 'doctor',
          title: 'New Consultation Request',
          message: `New consultation request from ${createdConsultation.patientName}.`,
          type: 'booking',
          consultationId: createdConsultation._id
        });
      }
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr);
    }
    
    // Notify Patient via email
    sendNotificationEmail({
      email: req.user.email,
      subject: 'Consultation Booking Confirmed - DentaAI',
      message: `Hello ${req.user.name},\n\nYour consultation booking request for ${createdConsultation.doctorName || 'a doctor'} has been successfully submitted.\n\nStatus: ${createdConsultation.status}\n\nYou can track the status in your dashboard.\n\nRegards,\nDentaAI Team`,
      deduplicationKey: `booking_${createdConsultation._id}_email`,
      event: 'consultation_booking',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #333;">
          <h2 style="color: #2563eb;">Consultation Booking Confirmed</h2>
          <p>Hello ${req.user.name},</p>
          <p>Your consultation booking request for <strong>${createdConsultation.doctorName || 'a doctor'}</strong> has been successfully submitted.</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px;">
            <p><strong>Status:</strong> ${createdConsultation.status}</p>
          </div>
          <p>You can track the status in your dashboard.</p>
          <p>Regards,<br /><strong>DentaAI Team</strong></p>
        </div>
      `,
    });

    // Notify Patient via SMS if phone on profile
    if (req.user && req.user.phone) {
      sendSMS({
        to: req.user.phone,
        templateName: 'CONSULTATION_BOOKING',
        templateData: {
          doctorName: createdConsultation.doctorName || 'Specialist',
          date: createdConsultation.date || 'Scheduled Date',
          time: createdConsultation.time || 'Scheduled Time',
          ref: createdConsultation._id.toString().slice(-6),
        },
        deduplicationKey: `booking_${createdConsultation._id}_sms`,
      }).catch((smsErr) => console.error('Booking SMS error:', smsErr.message));
    }

    res.status(201).json(createdConsultation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all consultations
// @route   GET /api/consultations
// @access  Public
const getConsultations = async (req, res) => {
  try {
    // Optionally allow filtering by doctorId or patient name if needed,
    // but returning all for now since frontend handles filtering, 
    // or we can just filter by doctorId here if provided in query.
    let filter = {};
    if (req.user.role === 'doctor') {
      filter.doctorId = req.user._id.toString();
    } else if (req.user.role === 'patient') {
      filter.patientId = req.user._id.toString();
    }
    
    // Allow admin to see all, or filter if query params exist (and admin is requesting)
    if (req.user.role === 'admin') {
       if (req.query.doctorId) filter.doctorId = req.query.doctorId;
       if (req.query.patientId) filter.patientId = req.query.patientId;
    }
    
    const consultations = await Consultation.find(filter).populate('scanId').sort({ createdAt: -1 });
    res.json(consultations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single consultation
// @route   GET /api/consultations/:id
// @access  Public
const getConsultationById = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id).populate('scanId');
    if (consultation) {
      // Ownership check
      if (req.user.role === 'patient' && consultation.patientId !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this consultation' });
      }
      if (req.user.role === 'doctor' && consultation.doctorId !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this consultation' });
      }
      res.json(consultation);
    } else {
      res.status(404).json({ message: 'Consultation not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update consultation status/diagnosis
// @route   PUT /api/consultations/:id
// @access  Private (Doctor or Admin)
const updateConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    // Role and ownership check
    if (req.user.role === 'doctor') {
      if (consultation.doctorId !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to update this consultation' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update consultations' });
    }

    // Disallow modifying protected immutable fields
    const immutableFields = [
      '_id', 'id', 'doctorId', 'patientId', 'patientName', 'doctorName',
      'transactionId', 'paymentStatus', 'fee', 'totalAmount', 'platformFee',
      'scanId', 'createdAt', 'updatedAt'
    ];
    for (const field of immutableFields) {
      if (req.body[field] !== undefined && String(req.body[field]) !== String(consultation[field])) {
        return res.status(400).json({ message: `Modifying protected field '${field}' is not permitted` });
      }
    }

    // Allowed updates
    if (req.body.status) {
      const allowedStatuses = ['Pending', 'Accepted', 'In Consultation', 'Completed', 'Rejected'];
      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({ message: `Invalid status '${req.body.status}'. Allowed: ${allowedStatuses.join(', ')}` });
      }
      consultation.status = req.body.status;
    }

    if (req.body.finalDiagnosis !== undefined) consultation.finalDiagnosis = req.body.finalDiagnosis;
    if (req.body.treatmentPlan !== undefined) consultation.treatmentPlan = req.body.treatmentPlan;
    if (req.body.verificationStatus !== undefined) {
      const allowedVerif = ['Pending', 'Verified', 'Requires further examination'];
      if (allowedVerif.includes(req.body.verificationStatus)) {
        consultation.verificationStatus = req.body.verificationStatus;
      }
    }
    if (req.body.followUpDate !== undefined) consultation.followUpDate = req.body.followUpDate;
    if (req.body.followUpNote !== undefined) consultation.followUpNote = req.body.followUpNote;
    if (req.body.rejectionReason !== undefined) consultation.rejectionReason = req.body.rejectionReason;

    const updatedConsultation = await consultation.save();
    res.json(updatedConsultation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Accept consultation
// @route   PUT /api/consultations/:id/accept
// @access  Public
const acceptConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) return res.status(404).json({ message: 'Consultation not found' });
    
    if (consultation.doctorId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept this consultation' });
    }
    
    // Verify Doctor Status
    if (consultation.doctorId) {
      const doctor = await User.findById(consultation.doctorId);
      if (doctor && doctor.verificationStatus !== 'Approved') {
        return res.status(403).json({ message: 'Your account must be approved by an Admin before accepting consultations.' });
      }
    }
    
    consultation.status = 'Accepted';
    await consultation.save();
    
    // Notify Patient via in-app and email
    try {
      if (consultation.patientId) {
        await Notification.create({
          recipientId: consultation.patientId,
          recipientRole: 'patient',
          title: 'Consultation Accepted',
          message: `${consultation.doctorName || 'Your doctor'} accepted your consultation.`,
          type: 'update',
          consultationId: consultation._id
        });
        
        const patientUser = await User.findById(consultation.patientId);
        if (patientUser) {
          sendNotificationEmail({
            email: patientUser.email,
            subject: 'Consultation Accepted - DentaAI',
            message: `Hello ${patientUser.name},\n\nYour consultation request has been accepted by ${consultation.doctorName || 'the doctor'}.\n\nThe doctor will review your scans and provide a diagnosis soon.\n\nRegards,\nDentaAI Team`,
            deduplicationKey: `accept_${consultation._id}_email`,
            event: 'consultation_accepted',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #333;">
                <h2 style="color: #2563eb;">Consultation Accepted</h2>
                <p>Hello ${patientUser.name},</p>
                <p>Your consultation request has been accepted by <strong>${consultation.doctorName || 'the doctor'}</strong>.</p>
                <p>The doctor will review your scans and provide a diagnosis soon.</p>
                <p>Regards,<br /><strong>DentaAI Team</strong></p>
              </div>
            `,
          });

          if (patientUser.phone) {
            sendSMS({
              to: patientUser.phone,
              templateName: 'DOCTOR_APPROVAL',
              templateData: {
                doctorName: consultation.doctorName || 'Specialist',
              },
              deduplicationKey: `accept_${consultation._id}_sms`,
            }).catch((smsErr) => console.error('Doctor approval SMS error:', smsErr.message));
          }
        }
      }
    } catch (notifErr) {
      console.error("Failed to notify patient:", notifErr);
    }

    res.json(consultation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Reject consultation
// @route   PUT /api/consultations/:id/reject
// @access  Private (Doctor only)
const rejectConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) return res.status(404).json({ message: 'Consultation not found' });
    
    if (consultation.doctorId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject this consultation' });
    }
    
    if (consultation.status === 'Completed') {
      return res.status(400).json({ message: 'Cannot reject an already completed consultation' });
    }

    const { reason, rejectionReason } = req.body;
    const finalReason = reason || rejectionReason || '';

    consultation.status = 'Rejected';
    if (finalReason) {
      consultation.rejectionReason = finalReason;
    }
    await consultation.save();
    
    // Notify Patient via in-app and email
    try {
      if (consultation.patientId) {
        await Notification.create({
          recipientId: consultation.patientId,
          recipientRole: 'patient',
          title: 'Consultation Declined',
          message: `${consultation.doctorName || 'Your doctor'} was unable to accept your consultation request.${finalReason ? ` Reason: ${finalReason}` : ''}`,
          type: 'update',
          consultationId: consultation._id.toString()
        });
        
        const patientUser = await User.findById(consultation.patientId);
        if (patientUser) {
          sendNotificationEmail({
            email: patientUser.email,
            subject: 'Consultation Request Update - DentaAI',
            message: `Hello ${patientUser.name},\n\nYour consultation request with ${consultation.doctorName || 'the doctor'} has been declined.${finalReason ? `\n\nReason: ${finalReason}` : ''}\n\nYou can select another specialist from the Doctor Directory.\n\nRegards,\nDentaAI Team`,
            deduplicationKey: `reject_${consultation._id}_email`,
            event: 'consultation_rejected',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #333;">
                <h2 style="color: #dc2626;">Consultation Request Update</h2>
                <p>Hello ${patientUser.name},</p>
                <p>Your consultation request with <strong>${consultation.doctorName || 'the doctor'}</strong> has been declined.</p>
                ${finalReason ? `<div style="background: #fef2f2; padding: 16px; border-radius: 8px; border-left: 4px solid #dc2626;"><p><strong>Reason provided:</strong> ${finalReason}</p></div>` : ''}
                <p>You can choose another specialist from the Doctor Directory in your dashboard.</p>
                <p>Regards,<br /><strong>DentaAI Team</strong></p>
              </div>
            `,
          });
        }
      }
    } catch (notifErr) {
      console.error("Failed to notify patient of rejection:", notifErr);
    }

    res.json(consultation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Start consultation
// @route   PUT /api/consultations/:id/start
// @access  Public
const startConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) return res.status(404).json({ message: 'Consultation not found' });
    
    if (consultation.doctorId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to start this consultation' });
    }
    
    consultation.status = 'In Consultation';
    await consultation.save();
    res.json(consultation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Complete consultation
// @route   PUT /api/consultations/:id/complete
// @access  Public
const completeConsultation = async (req, res) => {
  try {
    const { finalDiagnosis, treatmentPlan, verificationStatus, followUpDate, followUpNote } = req.body;
    
    if (!finalDiagnosis || !treatmentPlan) {
      return res.status(400).json({ message: 'Final diagnosis and treatment plan are required to complete the consultation.' });
    }
    
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) return res.status(404).json({ message: 'Consultation not found' });
    
    if (consultation.doctorId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to complete this consultation' });
    }

    // Validate verificationStatus
    if (verificationStatus) {
      const allowedVerif = ['Pending', 'Verified', 'Requires further examination'];
      if (!allowedVerif.includes(verificationStatus)) {
        return res.status(400).json({ message: `Invalid verification status. Allowed: ${allowedVerif.join(', ')}` });
      }
      consultation.verificationStatus = verificationStatus;
    } else {
      consultation.verificationStatus = 'Verified';
    }

    // Validate and save followUpDate
    if (followUpDate) {
      if (typeof followUpDate !== 'string' || (followUpDate.trim() && isNaN(new Date(followUpDate).getTime()))) {
        return res.status(400).json({ message: 'Invalid follow-up date format.' });
      }
      consultation.followUpDate = followUpDate.trim();
    } else if (followUpDate === '') {
      consultation.followUpDate = '';
    }

    if (followUpNote !== undefined) {
      consultation.followUpNote = String(followUpNote).trim();
    }
    
    consultation.status = 'Completed';
    consultation.finalDiagnosis = finalDiagnosis.trim();
    consultation.treatmentPlan = treatmentPlan.trim();
    
    await consultation.save();
    
    // Notify Patient via in-app and email
    try {
      if (consultation.patientId) {
        await Notification.create({
          recipientId: consultation.patientId,
          recipientRole: 'patient',
          title: 'Consultation Completed',
          message: `Your consultation has been completed. View your final diagnosis and treatment plan.`,
          type: 'update',
          consultationId: consultation._id.toString()
        });
        
        const patientUser = await User.findById(consultation.patientId);
        if (patientUser) {
          sendNotificationEmail({
            email: patientUser.email,
            subject: 'Consultation Completed - DentaAI',
            message: `Hello ${patientUser.name},\n\nYour consultation with ${consultation.doctorName || 'the doctor'} has been completed.\n\nPlease log in to DentaAI to view the completed consultation and access your diagnosis and treatment plan securely.\n\nRegards,\nDentaAI Team`,
            deduplicationKey: `complete_${consultation._id}_email`,
            event: 'consultation_completed',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #333;">
                <h2 style="color: #2563eb;">Consultation Completed</h2>
                <p>Hello ${patientUser.name},</p>
                <p>Your consultation with <strong>${consultation.doctorName || 'the doctor'}</strong> has been completed.</p>
                <p>Please log in to DentaAI to view the completed consultation and access your diagnosis and treatment plan securely.</p>
                <p>Regards,<br /><strong>DentaAI Team</strong></p>
              </div>
            `,
          });

          if (patientUser.phone) {
            sendSMS({
              to: patientUser.phone,
              templateName: 'CONSULTATION_COMPLETED',
              templateData: {
                doctorName: consultation.doctorName || 'Specialist',
              },
              deduplicationKey: `complete_${consultation._id}_sms`,
            }).catch((smsErr) => console.error('Consultation completed SMS error:', smsErr.message));
          }
        }
      }
    } catch (notifErr) {
      console.error("Failed to notify patient:", notifErr);
    }

    res.json(consultation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createConsultation,
  getConsultations,
  getConsultationById,
  updateConsultation,
  acceptConsultation,
  rejectConsultation,
  startConsultation,
  completeConsultation
};
