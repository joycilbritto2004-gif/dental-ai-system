const express = require('express');
const router = express.Router();
const { getStats, getUsers, updateDoctorStatus, updateAccountStatus } = require('../controllers/adminController');

// Simple middleware to check if user ID was passed in query params and is admin
// (Assuming frontend sends ?userId=... for demo purposes based on existing auth patterns)
// Ideally we'd use JWT but for this project we'll check User ID existence in DB
const User = require('../models/User');

const adminGuard = async (req, res, next) => {
  try {
    const userId = req.query.userId || req.headers['user-id'];
    if (!userId) {
      return res.status(401).json({ message: 'Not authorized, no ID' });
    }

    const user = await User.findById(userId);
    if (user && user.role === 'admin') {
      next();
    } else {
      res.status(401).json({ message: 'Not authorized as an admin' });
    }
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

router.get('/stats', adminGuard, getStats);
router.get('/users', adminGuard, getUsers);
router.put('/users/:id/doctor-status', adminGuard, updateDoctorStatus);
router.put('/users/:id/account-status', adminGuard, updateAccountStatus);

module.exports = router;
