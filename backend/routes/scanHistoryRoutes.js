const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { getPatientScanHistory, getAllScans, getScanImage } = require('../controllers/scanHistoryController');

// Scan records are written only by POST /api/ai/predict, from the model's own response.
// There is deliberately no client-writable create route here.
router.get('/all', protect, restrictTo('admin'), getAllScans);
router.get('/image/:filename', protect, getScanImage);
router.get('/:patientId', protect, getPatientScanHistory);

module.exports = router;
