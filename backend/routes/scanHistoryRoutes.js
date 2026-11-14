const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  getPatientScanHistory,
  getAllScans,
  getScanImage,
  verifyScan,
  getPendingScans,
  getScanById,
} = require('../controllers/scanHistoryController');

// Scan records are written only by POST /api/ai/predict, from the model's own response.
// There is deliberately no client-writable create route here.
router.get('/all', protect, restrictTo('admin'), getAllScans);
router.get('/pending', protect, restrictTo('doctor', 'admin'), getPendingScans);
router.get('/detail/:id', protect, getScanById);
router.put('/verify/:id', protect, restrictTo('doctor', 'admin'), verifyScan);
router.get('/image/:filename', protect, getScanImage);
router.get('/:patientId', protect, getPatientScanHistory);

module.exports = router;
