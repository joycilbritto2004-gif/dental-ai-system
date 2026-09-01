const Consultation = require('../models/Consultation');

// @desc    Create new consultation
// @route   POST /api/consultations
// @access  Public
const createConsultation = async (req, res) => {
  try {
    const consultation = new Consultation(req.body);
    const createdConsultation = await consultation.save();
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
      consultation.doctorNotes = req.body.doctorNotes || consultation.doctorNotes;
      
      const updatedConsultation = await consultation.save();
      res.json(updatedConsultation);
    } else {
      res.status(404).json({ message: 'Consultation not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createConsultation,
  getConsultations,
  getConsultationById,
  updateConsultation,
};
