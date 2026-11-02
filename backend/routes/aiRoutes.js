const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ScanHistory = require('../models/ScanHistory');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5002';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

// Configure multer to save files temporarily
const upload = multer({
  dest: path.join(__dirname, '..', 'uploads', 'temp'),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Only JPG and PNG dental images are accepted'));
    }
    cb(null, true);
  },
});

// Reject oversized or non-image uploads with a clear message instead of a 500.
const handleUploadErrors = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'Image is too large. Maximum size is 10 MB.'
        : err.message || 'Invalid image upload';
      return res.status(400).json({ error: message });
    }
    next();
  });
};

// @desc    Check health of Python AI service
// @route   GET /api/ai/health
// @access  Public
router.get('/health', async (req, res) => {
  try {
    const aiResponse = await axios.get(`${AI_SERVICE_URL}/api/ai/health`, { timeout: 4000 });
    res.json(aiResponse.data);
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      message: `Python AI service unreachable at ${AI_SERVICE_URL}` 
    });
  }
});

// @desc    Forward image to Python AI service
// @route   POST /api/ai/predict
// @access  Protected
router.post('/predict', protect, restrictTo('patient'), handleUploadErrors, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  try {
    // Create form data to send to Python server
    const formData = new FormData();
    formData.append('image', fs.createReadStream(req.file.path), req.file.originalname);

    // Forward the request to Python AI backend running on configured port
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/ai/predict`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000,
    });

    // Clean up temporary file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    const prediction = aiResponse.data || {};
    if (!prediction.condition || prediction.confidence === undefined) {
      return res.status(502).json({ error: 'AI service returned an incomplete prediction' });
    }

    // Persist the result here, from the model's own response, rather than trusting the
    // browser to post it back afterwards — otherwise a patient can substitute any
    // condition or confidence value and attach the forged finding to a consultation.
    let savedScan = null;
    try {
      savedScan = await ScanHistory.create({
        patientId: req.user._id,
        imagePath: prediction.imagePath || null,
        condition: prediction.condition,
        confidence: prediction.confidence,
        recommendation: prediction.recommendation,
        scanId: `SCAN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      });
    } catch (saveError) {
      // The SDS requires that a failed write is never reported as a saved scan.
      console.error('Failed to persist scan result:', saveError.message);
      return res.status(500).json({
        error: 'The analysis completed but the result could not be saved. Please try again.',
      });
    }

    res.json({
      _id: savedScan._id,
      scanId: savedScan.scanId,
      condition: savedScan.condition,
      confidence: savedScan.confidence,
      recommendation: savedScan.recommendation,
      imagePath: savedScan.imagePath,
      date: savedScan.createdAt,
      // Passed through from the model for display only; not persisted on the scan record.
      classProbabilities: prediction.classProbabilities,
    });

  } catch (error) {
    console.error('Error connecting to AI service:', error.message);
    
    // Clean up temporary file on error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }

    if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
      return res.status(503).json({ 
        error: `AI analysis service is currently unavailable. Please ensure the Python service is running on port 5002 (${AI_SERVICE_URL}).` 
      });
    }

    if (error.response) {
      // The Python server responded with a status code that falls out of the range of 2xx
      return res.status(error.response.status).json(error.response.data);
    }
    
    res.status(500).json({ error: 'Failed to communicate with AI analysis service: ' + (error.message || 'Unknown network error') });
  }
});

module.exports = router;
