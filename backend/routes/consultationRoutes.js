const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { 
  getConsultations, 
  createConsultation,
  getConsultationById,
  updateConsultation,
  acceptConsultation,
  startConsultation,
  completeConsultation
} = require('../controllers/consultationController');

router.route('/').get(protect, getConsultations).post(protect, restrictTo('patient'), createConsultation);
router.route('/:id').get(protect, getConsultationById).put(protect, updateConsultation);

router.route('/:id/accept').put(protect, restrictTo('doctor'), acceptConsultation);
router.route('/:id/start').put(protect, restrictTo('doctor'), startConsultation);
router.route('/:id/complete').put(protect, restrictTo('doctor'), completeConsultation);

module.exports = router;
