const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5002';

// Configure multer to save files temporarily
const upload = multer({ dest: path.join(__dirname, '..', 'uploads', 'temp') });

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
router.post('/predict', protect, restrictTo('patient'), upload.single('image'), async (req, res) => {
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

    // Return the response back to the frontend
    res.json(aiResponse.data);

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
