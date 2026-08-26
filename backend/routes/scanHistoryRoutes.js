const express = require('express');
const router = express.Router();
const { saveScanResult, getPatientScanHistory } = require('../controllers/scanHistoryController');

router.post('/', saveScanResult);
router.get('/:patientId', getPatientScanHistory);

module.exports = router;
