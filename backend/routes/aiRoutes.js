const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configure multer to save files temporarily
const upload = multer({ dest: path.join(__dirname, '..', 'uploads', 'temp') });

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

    // Forward the request to Python AI backend running on port 5002
    const aiResponse = await axios.post('http://127.0.0.1:5002/api/ai/predict', formData, {
      headers: {
        ...formData.getHeaders(),
      },
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

    if (error.response) {
      // The Python server responded with a status code that falls out of the range of 2xx
      return res.status(error.response.status).json(error.response.data);
    }
    
    res.status(500).json({ error: 'Failed to communicate with AI analysis service.' });
  }
});

module.exports = router;
