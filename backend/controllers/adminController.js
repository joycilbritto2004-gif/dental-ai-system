const User = require('../models/User');
const Consultation = require('../models/Consultation');
const ScanHistory = require('../models/ScanHistory');

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res) => {
  try {
    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const totalPredictions = await ScanHistory.countDocuments();
    const verifiedCases = await Consultation.countDocuments({ status: { $in: ['Completed', 'Verified'] } });
    
    const pendingReviews = await Consultation.countDocuments({ status: 'Pending' });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const predictionsToday = await ScanHistory.countDocuments({ createdAt: { $gte: startOfDay } });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newPatientsThisMonth = await User.countDocuments({ role: 'patient', createdAt: { $gte: startOfMonth } });

    // Recent activity can be mocked or fetched from recent consultations
    const recentConsultations = await Consultation.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('scanId');

    res.json({
      totalPatients,
      totalDoctors,
      totalPredictions,
      verifiedCases,
      pendingReviews,
      predictionsToday,
      newPatientsThisMonth,
      recentActivity: recentConsultations
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Doctor Verification Status
// @route   PUT /api/admin/users/:id/doctor-status
// @access  Private/Admin
const updateDoctorStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'doctor') {
      return res.status(400).json({ message: 'User is not a doctor' });
    }

    user.verificationStatus = status;
    await user.save();

    res.json({ message: 'Doctor status updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Account Block/Active Status
// @route   PUT /api/admin/users/:id/account-status
// @access  Private/Admin
const updateAccountStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const adminUserId = req.user._id.toString();

    if (!['Active', 'Blocked'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Prevent admin from blocking themselves
    if (req.params.id === adminUserId && status === 'Blocked') {
      return res.status(400).json({ message: 'You cannot block your own admin account.' });
    }

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.accountStatus = status;
    await user.save();

    res.json({ message: 'Account status updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStats,
  getUsers,
  updateDoctorStatus,
  updateAccountStatus
};
