const express = require('express');
const router = express.Router();
const { getStats, getUsers, updateDoctorStatus, updateAccountStatus } = require('../controllers/adminController');

const { protect, restrictTo } = require('../middleware/authMiddleware');

router.get('/stats', protect, restrictTo('admin'), getStats);
router.get('/users', protect, restrictTo('admin'), getUsers);
router.put('/users/:id/doctor-status', protect, restrictTo('admin'), updateDoctorStatus);
router.put('/users/:id/account-status', protect, restrictTo('admin'), updateAccountStatus);

module.exports = router;
