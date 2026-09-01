const Consultation = require('../models/Consultation');
const Notification = require('../models/Notification');

// @desc    Create new consultation
// @route   POST /api/consultations
// @access  Public
const createConsultation = async (req, res) => {
  try {
    const consultation = new Consultation(req.body);
    const createdConsultation = await consultation.save();
    
    // Notify Doctor
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
    if (req.query.doctorId) filter.doctorId = req.query.doctorId;
    
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
// @access  Public
const updateConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (consultation) {
      consultation.status = req.body.status || consultation.status;
      consultation.finalDiagnosis = req.body.finalDiagnosis || consultation.finalDiagnosis;
      consultation.treatmentPlan = req.body.treatmentPlan || consultation.treatmentPlan;
      
      const updatedConsultation = await consultation.save();
      res.json(updatedConsultation);
    } else {
      res.status(404).json({ message: 'Consultation not found' });
    }
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
    
    consultation.status = 'Accepted';
    await consultation.save();
    
    // Notify Patient
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
      }
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr);
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
    const { finalDiagnosis, treatmentPlan } = req.body;
    
    if (!finalDiagnosis || !treatmentPlan) {
      return res.status(400).json({ message: 'Final diagnosis and treatment plan are required to complete the consultation.' });
    }
    
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) return res.status(404).json({ message: 'Consultation not found' });
    
    consultation.status = 'Completed';
    consultation.finalDiagnosis = finalDiagnosis;
    consultation.treatmentPlan = treatmentPlan;
    
    await consultation.save();
    
    // Notify Patient
    try {
      if (consultation.patientId) {
        await Notification.create({
          recipientId: consultation.patientId,
          recipientRole: 'patient',
          title: 'Consultation Completed',
          message: `Your consultation has been completed. View your final diagnosis and treatment plan.`,
          type: 'update',
          consultationId: consultation._id
        });
      }
    } catch (notifErr) {
      console.error("Failed to create notification:", notifErr);
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
  startConsultation,
  completeConsultation
};
