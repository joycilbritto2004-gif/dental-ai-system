const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { saveScanResult, getPatientScanHistory } = require('../controllers/scanHistoryController');

router.post('/', protect, restrictTo('patient'), saveScanResult);
router.get('/:patientId', protect, getPatientScanHistory);

module.exports = router;
