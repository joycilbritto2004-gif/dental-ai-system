const express = require('express');
const router = express.Router();
const {
  createConsultation,
  getConsultations,
  getConsultationById,
  updateConsultation,
} = require('../controllers/consultationController');

router.route('/')
  .post(createConsultation)
  .get(getConsultations);

router.route('/:id')
  .get(getConsultationById)
  .put(updateConsultation);

module.exports = router;
