const express = require('express');
const router = express.Router();
const { getDoctors, getDoctorById } = require('../controllers/doctorController');

router.get('/', getDoctors);
router.get('/:id', getDoctorById);

module.exports = router;
