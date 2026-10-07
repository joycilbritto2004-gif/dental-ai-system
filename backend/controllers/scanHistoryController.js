const ScanHistory = require('../models/ScanHistory');

// @desc    Save a new AI scan result
// @route   POST /api/scans
// @access  Public (should ideally be protected, but keeping it simple as per current auth flow)
const saveScanResult = async (req, res) => {
  try {
    const { imagePath, condition, confidence, recommendation, scanId } = req.body;
    
    const patientId = req.user._id.toString();

    if (!condition || !confidence || !scanId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const scan = new ScanHistory({
      patientId,
      imagePath,
      condition,
      confidence,
      recommendation,
      scanId
    });

    const createdScan = await scan.save();
    res.status(201).json(createdScan);
  } catch (error) {
    console.error('Error saving scan result:', error);
    res.status(500).json({ message: 'Failed to save scan result' });
  }
};

// @desc    Get all scan history for a patient
// @route   GET /api/scans/:patientId
// @access  Public
const getPatientScanHistory = async (req, res) => {
  try {
    if (req.user.role === 'patient' && req.params.patientId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view these scans' });
    }
    
    const scans = await ScanHistory.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.json(scans);
  } catch (error) {
    console.error('Error fetching scan history:', error);
    res.status(500).json({ message: 'Failed to fetch scan history' });
  }
};

// @desc    Get all scan history across the platform (for admin)
// @route   GET /api/scans/all
// @access  Public (should ideally be protected, but keeping it simple as per current auth flow)
const getAllScans = async (req, res) => {
  try {
    const scans = await ScanHistory.find({}).sort({ createdAt: -1 });
    res.json(scans);
  } catch (error) {
    console.error('Error fetching all scans:', error);
    res.status(500).json({ message: 'Failed to fetch all scans' });
  }
};

module.exports = {
  saveScanResult,
  getPatientScanHistory,
  getAllScans
};
