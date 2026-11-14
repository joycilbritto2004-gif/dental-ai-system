const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
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

    const scans = await ScanHistory.find({ patientId })
      .populate('verifiedBy', 'name email specialization licenseNumber')
      .sort({ createdAt: -1 });
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
    const scans = await ScanHistory.find({})
      .populate('patientId', 'name email phone')
      .populate('verifiedBy', 'name email specialization')
      .sort({ createdAt: -1 });
    res.json(scans);
  } catch (error) {
    console.error('Error fetching all scans:', error);
    res.status(500).json({ message: 'Failed to fetch all scans' });
  }
};

// @desc    Stream an uploaded dental image to an authorised viewer
// @route   GET /api/scans/image/:filename
// @access  Private (owning patient, assigned doctor, or admin)
const getScanImage = async (req, res) => {
  try {
    const { filename } = req.params;

    // Reject traversal attempts outright: the stored name is always a plain basename.
    if (filename !== path.basename(filename)) {
      return res.status(400).json({ message: 'Invalid image reference' });
    }

    const escapedFilename = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const scan = await ScanHistory.findOne({
      $or: [
        { imagePath: `/uploads/${filename}` },
        { imagePath: `uploads/${filename}` },
        { imagePath: filename },
        { imagePath: { $regex: new RegExp(`[/\\\\]${escapedFilename}$`) } }
      ]
    });
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

// @desc    Verify or override AI scan diagnosis by a licensed doctor
// @route   PUT /api/scans/verify/:id (and PUT /api/ai/verify/:id)
// @access  Private (approved doctor or admin only)
const verifyScan = async (req, res) => {
  try {
    const { id } = req.params;
    const { finalDiagnosis, secondaryFindings, doctorNotes, treatmentPlan, status } = req.body;

    // 1. Role validation: Doctor or Admin only
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only medical practitioners can clinically verify scans' });
    }

    // 2. Doctor Approval Check: If doctor, verificationStatus must be 'Approved' and accountStatus !== 'Blocked'
    if (req.user.role === 'doctor') {
      if (req.user.verificationStatus !== 'Approved') {
        return res.status(403).json({ message: 'Doctor credentials must be approved by an administrator before verifying clinical scans' });
      }
      if (req.user.accountStatus === 'Blocked') {
        return res.status(403).json({ message: 'Account is blocked. Contact administrator.' });
      }
    }

    // 3. Scan ID validation
    if (!id || id.trim() === '') {
      return res.status(400).json({ message: 'Scan ID is required' });
    }

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { scanId: id }] }
      : { scanId: id };

    const scan = await ScanHistory.findOne(query);
    if (!scan) {
      return res.status(404).json({ message: 'Scan record not found' });
    }

    // 4. Clinical Diagnosis validation
    if (!finalDiagnosis || typeof finalDiagnosis !== 'string' || finalDiagnosis.trim() === '') {
      return res.status(400).json({ message: 'Final clinical diagnosis is required' });
    }

    const cleanDiagnosis = finalDiagnosis.trim();
    const wasOverridden = (cleanDiagnosis.toLowerCase() !== scan.condition.toLowerCase());

    const verificationAction = wasOverridden ? 'OVERRIDDEN' : 'CONFIRMED';
    const targetStatus = status && ['Verified', 'Rejected', 'Needs Rescan'].includes(status) ? status : 'Verified';

    // 5. Append to Audit Trail
    scan.auditTrail.push({
      action: verificationAction,
      performedBy: req.user._id,
      timestamp: new Date(),
      previousDiagnosis: scan.finalDiagnosis || scan.condition,
      newDiagnosis: cleanDiagnosis,
      notes: typeof doctorNotes === 'string' ? doctorNotes.trim() : '',
    });

    // 6. Update Doctor Verification Fields (Original condition, confidence, classProbabilities are NEVER modified)
    scan.finalDiagnosis = cleanDiagnosis;
    scan.isOverridden = wasOverridden;
    scan.secondaryFindings = Array.isArray(secondaryFindings)
      ? secondaryFindings.filter(f => typeof f === 'string' && f.trim() !== '')
      : [];
    scan.doctorNotes = typeof doctorNotes === 'string' ? doctorNotes.trim() : '';
    scan.treatmentPlan = typeof treatmentPlan === 'string' ? treatmentPlan.trim() : '';
    scan.status = targetStatus;
    scan.verifiedBy = req.user._id;
    scan.verifiedAt = new Date();

    await scan.save();

    const populatedScan = await ScanHistory.findById(scan._id)
      .populate('patientId', 'name email phone')
      .populate('verifiedBy', 'name email specialization experience');

    return res.json({
      success: true,
      message: wasOverridden ? 'AI diagnosis overridden and report finalized' : 'AI diagnosis confirmed and report finalized',
      scan: populatedScan,
    });
  } catch (error) {
    console.error('Error verifying scan:', error);
    return res.status(500).json({ message: 'Failed to process clinical verification: ' + error.message });
  }
};

// @desc    Get all scans awaiting doctor review
// @route   GET /api/scans/pending (and GET /api/ai/pending-reviews)
// @access  Private (approved doctor or admin only)
const getPendingScans = async (req, res) => {
  try {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view pending clinical reviews' });
    }

    if (req.user.role === 'doctor' && req.user.verificationStatus !== 'Approved') {
      return res.status(403).json({ message: 'Doctor credentials must be approved to access pending clinical reviews' });
    }

    const scans = await ScanHistory.find({ status: 'Pending' })
      .populate('patientId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json(scans);
  } catch (error) {
    console.error('Error fetching pending scans:', error);
    res.status(500).json({ message: 'Failed to fetch pending scans' });
  }
};

// @desc    Get a single scan by MongoDB _id or scanId
// @route   GET /api/scans/detail/:id
// @access  Private (owning patient, assigned doctor, or admin)
const getScanById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { scanId: id }] }
      : { scanId: id };

    const scan = await ScanHistory.findOne(query)
      .populate('patientId', 'name email phone')
      .populate('verifiedBy', 'name email specialization experience');

    if (!scan) {
      return res.status(404).json({ message: 'Scan not found' });
    }

    const requesterId = req.user._id.toString();
    const isOwner = scan.patientId?._id?.toString() === requesterId || scan.patientId?.toString() === requesterId;
    const isAdmin = req.user.role === 'admin';
    const isApprovedDoctor =
      req.user.role === 'doctor' &&
      req.user.verificationStatus === 'Approved' &&
      req.user.accountStatus === 'Active';

    if (!isOwner && !isAdmin && !isApprovedDoctor) {
      return res.status(403).json({ message: 'Not authorized to view this scan record' });
    }

    res.json(scan);
  } catch (error) {
    console.error('Error fetching scan details:', error);
    res.status(500).json({ message: 'Failed to fetch scan details' });
  }
};

module.exports = {
  getPatientScanHistory,
  getAllScans,
  getScanImage,
  verifyScan,
  getPendingScans,
  getScanById,
};
