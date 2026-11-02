const express = require('express');
const router = express.Router();
const { 
  getStats, 
  getUsers, 
  updateDoctorStatus, 
  updateAccountStatus,
  getSystemHealth,
  getAIModelStatus
} = require('../controllers/adminController');

const { protect, restrictTo } = require('../middleware/authMiddleware');

router.get('/stats', protect, restrictTo('admin'), getStats);
router.get('/users', protect, restrictTo('admin'), getUsers);
router.get('/system-health', protect, restrictTo('admin'), getSystemHealth);
router.get('/ai-status', protect, restrictTo('admin'), getAIModelStatus);
router.put('/users/:id/doctor-status', protect, restrictTo('admin'), updateDoctorStatus);
router.put('/users/:id/account-status', protect, restrictTo('admin'), updateAccountStatus);

module.exports = router;
