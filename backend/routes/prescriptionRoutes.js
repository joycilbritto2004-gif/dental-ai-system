const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  createOrUpdatePrescription,
  getPrescriptionByConsultation,
  getPrescriptionsByPatient,
  getLatestPatientPrescription,
  getPrescriptionByScanId,
  getPrescriptionById
} = require('../controllers/prescriptionController');

// Doctor only: Create or update a prescription
router.post('/', protect, restrictTo('doctor'), createOrUpdatePrescription);
router.put('/:id', protect, restrictTo('doctor'), createOrUpdatePrescription);

// Get latest prescription for the authenticated patient
router.get('/latest', protect, getLatestPatientPrescription);

// Prescription by consultation ID
router.get('/consultation/:consultationId', protect, getPrescriptionByConsultation);

// All prescriptions for a given patient
router.get('/patient/:patientId', protect, getPrescriptionsByPatient);

// Prescription associated with a scan history ID
router.get('/scan/:scanId', protect, getPrescriptionByScanId);

// Single prescription by prescription ID
router.get('/:id', protect, getPrescriptionById);

module.exports = router;

