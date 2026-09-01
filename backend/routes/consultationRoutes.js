const express = require('express');
const router = express.Router();
const { 
  getConsultations, 
  createConsultation,
  getConsultationById,
  updateConsultation,
  acceptConsultation,
  startConsultation,
  completeConsultation
} = require('../controllers/consultationController');

router.route('/').get(getConsultations).post(createConsultation);
router.route('/:id').get(getConsultationById).put(updateConsultation);

router.route('/:id/accept').put(acceptConsultation);
router.route('/:id/start').put(startConsultation);
router.route('/:id/complete').put(completeConsultation);

module.exports = router;
