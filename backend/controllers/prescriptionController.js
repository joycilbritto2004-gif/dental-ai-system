const mongoose = require('mongoose');
const Prescription = require('../models/Prescription');
const Consultation = require('../models/Consultation');
const ScanHistory = require('../models/ScanHistory');
const User = require('../models/User');

// @desc    Create or update a prescription for a consultation
// @route   POST /api/prescriptions
// @access  Private (Doctor only)
const createOrUpdatePrescription = async (req, res) => {
  try {
    const { 
      consultationId, 
      medications, 
      additionalInstructions, 
      generalAdvice 
    } = req.body;

    if (!consultationId) {
      return res.status(400).json({ message: 'Consultation ID is required' });
    }

    // Resolve consultation by ObjectId or custom id
    let consultation = null;
    if (mongoose.Types.ObjectId.isValid(consultationId)) {
      consultation = await Consultation.findById(consultationId);
    }
    if (!consultation) {
      consultation = await Consultation.findOne({ id: consultationId });
    }

    if (!consultation) {
      return res.status(404).json({ message: 'Associated consultation not found' });
    }

    // Authorization: Only the assigned doctor can prescribe
    if (String(consultation.doctorId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to create a prescription for this consultation' });
    }

    // Guard against cancelled or rejected consultations
    if (['Cancelled', 'Rejected'].includes(consultation.status)) {
      return res.status(400).json({ message: `Cannot issue prescription for an already ${consultation.status.toLowerCase()} consultation` });
    }

    // Validate medications list
    if (!Array.isArray(medications) || medications.length === 0) {
      return res.status(400).json({ message: 'At least one medication is required with name, dosage, frequency, and duration' });
    }

    for (let i = 0; i < medications.length; i++) {
      const med = medications[i];
      if (!med.medicineName || !med.medicineName.trim()) {
        return res.status(400).json({ message: `Medication #${i + 1} is missing a medicine name` });
      }
      if (!med.dosage || !med.dosage.trim()) {
        return res.status(400).json({ message: `Medication #${i + 1} (${med.medicineName}) is missing dosage` });
      }
      if (!med.frequency || !med.frequency.trim()) {
        return res.status(400).json({ message: `Medication #${i + 1} (${med.medicineName}) is missing frequency` });
      }
      if (!med.duration || !med.duration.trim()) {
        return res.status(400).json({ message: `Medication #${i + 1} (${med.medicineName}) is missing duration` });
      }
    }

    // Fetch doctor record for specialization and clinic branding
    const doctorUser = await User.findById(req.user._id);

    // Look for existing prescription for this consultation
    let prescription = await Prescription.findOne({ consultationId: consultation._id });

    if (prescription) {
      // Ensure only authoring doctor can modify
      if (String(prescription.doctorId) !== String(req.user._id)) {
        return res.status(403).json({ message: 'Not authorized to modify this prescription' });
      }

      prescription.medications = medications.map(m => ({
        medicineName: m.medicineName.trim(),
        dosage: m.dosage.trim(),
        frequency: m.frequency.trim(),
        duration: m.duration.trim(),
        instructions: (m.instructions || '').trim()
      }));
      prescription.additionalInstructions = (additionalInstructions || '').trim();
      if (generalAdvice && Array.isArray(generalAdvice)) {
        prescription.generalAdvice = generalAdvice;
      }
      prescription.prescriptionDate = new Date();
      prescription.status = 'Issued';
      await prescription.save();
    } else {
      prescription = new Prescription({
        consultationId: consultation._id,
        scanId: consultation.scanId || null,
        patientId: consultation.patientId,
        patientName: consultation.patientName,
        doctorId: req.user._id,
        doctorName: doctorUser?.name || consultation.doctorName || req.user.name,
        doctorSpecialization: doctorUser?.specialization || consultation.doctorSpecialization || 'Dental Specialist',
        clinicName: doctorUser?.clinic || 'DentaAI Dental Clinic',
        condition: consultation.condition || 'Dental Condition',
        prescriptionDate: new Date(),
        status: 'Issued',
        medications: medications.map(m => ({
          medicineName: m.medicineName.trim(),
          dosage: m.dosage.trim(),
          frequency: m.frequency.trim(),
          duration: m.duration.trim(),
          instructions: (m.instructions || '').trim()
        })),
        additionalInstructions: (additionalInstructions || '').trim(),
        generalAdvice: generalAdvice && Array.isArray(generalAdvice) ? generalAdvice : []
      });
      await prescription.save();
    }

    // Link prescription to consultation
    consultation.prescriptionId = prescription._id;
    await consultation.save();

    // Link prescription to scanHistory if exists
    if (consultation.scanId) {
      try {
        await ScanHistory.findByIdAndUpdate(consultation.scanId, { prescriptionId: prescription._id });
      } catch (scanErr) {
        console.warn('Could not link prescription to scanHistory:', scanErr.message);
      }
    }

    res.status(201).json(prescription);
  } catch (error) {
    console.error('Error saving prescription:', error);
    res.status(500).json({ message: error.message || 'Failed to save prescription' });
  }
};

// @desc    Get prescription by consultation ID
// @route   GET /api/prescriptions/consultation/:consultationId
// @access  Private (Patient of consultation, assigned Doctor, or Admin)
const getPrescriptionByConsultation = async (req, res) => {
  try {
    const { consultationId } = req.params;

    let consultation = null;
    if (mongoose.Types.ObjectId.isValid(consultationId)) {
      consultation = await Consultation.findById(consultationId);
    }
    if (!consultation) {
      consultation = await Consultation.findOne({ id: consultationId });
    }

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    // Role and ownership check
    const isPatient = req.user.role === 'patient' && String(consultation.patientId) === String(req.user._id);
    const isDoctor = req.user.role === 'doctor' && String(consultation.doctorId) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this prescription' });
    }

    const prescription = await Prescription.findOne({ consultationId: consultation._id });
    if (!prescription) {
      return res.json(null);
    }

    res.json(prescription);
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all prescriptions for a patient
// @route   GET /api/prescriptions/patient/:patientId
// @access  Private (Patient self, Doctor, or Admin)
const getPrescriptionsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (req.user.role === 'patient' && String(req.user._id) !== String(patientId)) {
      return res.status(403).json({ message: 'Not authorized to view another patient’s prescriptions' });
    }

    const prescriptions = await Prescription.find({ patientId }).sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get latest prescription for current authenticated patient
// @route   GET /api/prescriptions/latest
// @access  Private (Patient only)
const getLatestPatientPrescription = async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can access their latest prescription' });
    }

    const { condition, scanId } = req.query;
    let query = { patientId: req.user._id };

    if (scanId && mongoose.Types.ObjectId.isValid(scanId)) {
      query.scanId = scanId;
    } else if (condition) {
      query.condition = new RegExp(`^${condition.replace('_', ' ')}`, 'i');
    }

    const latest = await Prescription.findOne(query).sort({ createdAt: -1 });
    if (!latest) {
      return res.json(null);
    }
    res.json(latest);
  } catch (error) {
    console.error('Error fetching latest prescription:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get prescription by ScanHistory ID
// @route   GET /api/prescriptions/scan/:scanId
// @access  Private (Patient self, Doctor, or Admin)
const getPrescriptionByScanId = async (req, res) => {
  try {
    const { scanId } = req.params;

    let scan = null;
    if (mongoose.Types.ObjectId.isValid(scanId)) {
      scan = await ScanHistory.findById(scanId);
    }
    if (!scan) {
      scan = await ScanHistory.findOne({ scanId });
    }

    if (!scan) {
      return res.status(404).json({ message: 'Scan not found' });
    }

    // Patient ownership check
    if (req.user.role === 'patient' && String(scan.patientId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this prescription' });
    }

    // Find prescription by scanId or find consultation that references this scan
    let prescription = await Prescription.findOne({ scanId: scan._id });
    if (!prescription) {
      const consultation = await Consultation.findOne({ scanId: scan._id });
      if (consultation) {
        prescription = await Prescription.findOne({ consultationId: consultation._id });
      }
    }

    if (!prescription) {
      return res.json(null);
    }

    res.json(prescription);
  } catch (error) {
    console.error('Error fetching prescription by scan:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single prescription by ID
// @route   GET /api/prescriptions/:id
// @access  Private (Assigned Patient, Doctor, or Admin)
const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    const isPatient = req.user.role === 'patient' && String(prescription.patientId) === String(req.user._id);
    const isDoctor = req.user.role === 'doctor' && String(prescription.doctorId) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isDoctor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this prescription' });
    }

    res.json(prescription);
  } catch (error) {
    console.error('Error fetching prescription by id:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrUpdatePrescription,
  getPrescriptionByConsultation,
  getPrescriptionsByPatient,
  getLatestPatientPrescription,
  getPrescriptionByScanId,
  getPrescriptionById
};

