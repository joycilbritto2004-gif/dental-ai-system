const path = require('path');
const fs = require('fs');
const ScanHistory = require('../models/ScanHistory');
const Consultation = require('../models/Consultation');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// A doctor may see a patient's scans only through a consultation they are assigned to.
const doctorHasCaseFor = async (doctorId, patientId) => {
  const consultation = await Consultation.findOne({
    doctorId: String(doctorId),
    patientId: String(patientId),
  }).select('_id');
  return Boolean(consultation);
};

// @desc    Get all scan history for a patient
// @route   GET /api/scans/:patientId
// @access  Private (own records, assigned doctor, or admin)
const getPatientScanHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const requesterId = req.user._id.toString();

    if (req.user.role === 'patient' && patientId !== requesterId) {
      return res.status(403).json({ message: 'Not authorized to view these scans' });
    }
    if (req.user.role === 'doctor' && !(await doctorHasCaseFor(requesterId, patientId))) {
      return res.status(403).json({ message: 'Not authorized to view these scans' });
    }

    const scans = await ScanHistory.find({ patientId }).sort({ createdAt: -1 });
    res.json(scans);
  } catch (error) {
    console.error('Error fetching scan history:', error);
    res.status(500).json({ message: 'Failed to fetch scan history' });
  }
};

// @desc    Get all scan history across the platform
// @route   GET /api/scans/all
// @access  Private (admin)
const getAllScans = async (req, res) => {
  try {
    const scans = await ScanHistory.find({}).sort({ createdAt: -1 });
    res.json(scans);
  } catch (error) {
    console.error('Error fetching all scans:', error);
    res.status(500).json({ message: 'Failed to fetch all scans' });
  }
};

// @desc    Stream an uploaded dental image to an authorised viewer
// @route   GET /api/scans/image/:filename
// @access  Private (owning patient, assigned doctor, or admin)
//
// Replaces the old express.static('/uploads') mount, which served every patient's
// intraoral photograph to anyone who had or guessed the URL.
const getScanImage = async (req, res) => {
  try {
    const { filename } = req.params;

    // Reject traversal attempts outright: the stored name is always a plain basename.
    if (filename !== path.basename(filename)) {
      return res.status(400).json({ message: 'Invalid image reference' });
    }

    const scan = await ScanHistory.findOne({ imagePath: `/uploads/${filename}` });
    if (!scan) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const requesterId = req.user._id.toString();
    const isOwner = scan.patientId.toString() === requesterId;
    const isAdmin = req.user.role === 'admin';
    const isAssignedDoctor =
      req.user.role === 'doctor' && (await doctorHasCaseFor(requesterId, scan.patientId));

    if (!isOwner && !isAdmin && !isAssignedDoctor) {
      return res.status(403).json({ message: 'Not authorized to view this image' });
    }

    const filePath = path.join(UPLOAD_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Image file is no longer available' });
    }

    res.setHeader('Cache-Control', 'private, max-age=0, no-store');
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving scan image:', error);
    res.status(500).json({ message: 'Failed to load image' });
  }
};

module.exports = {
  getPatientScanHistory,
  getAllScans,
  getScanImage,
};
