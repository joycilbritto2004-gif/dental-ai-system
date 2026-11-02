const mongoose = require('mongoose');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Consultation = require('../models/Consultation');
const ScanHistory = require('../models/ScanHistory');
const Notification = require('../models/Notification');

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

// @desc    Get real-time system health and audit events
// @route   GET /api/admin/system-health
// @access  Private/Admin
const getSystemHealth = async (req, res) => {
  try {
    const nodeStatus = {
      status: 'online',
      port: process.env.PORT || 5000,
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version
    };

    const mongoStatus = {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      host: mongoose.connection.host || '127.0.0.1',
      port: 27017,
      database: mongoose.connection.name || 'dental_ai'
    };

    // Check Flask AI service on port 5002
    let aiStatus = {
      status: 'offline',
      port: 5002,
      latencyMs: null
    };
    try {
      const start = Date.now();
      const aiRes = await axios.get('http://127.0.0.1:5002/api/ai/health', { timeout: 2000 });
      if (aiRes.status === 200) {
        aiStatus = {
          status: 'ready',
          port: 5002,
          latencyMs: Date.now() - start
        };
      }
    } catch (e) {
      aiStatus = {
        status: 'offline',
        port: 5002,
        latencyMs: null
      };
    }

    // Fetch real audit events from notifications, consultations, and users
    const [recentNotifs, recentConsults, recentUsers] = await Promise.all([
      Notification.find().sort({ createdAt: -1 }).limit(10),
      Consultation.find().sort({ createdAt: -1 }).limit(10),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt')
    ]);

    const auditLogs = [];

    recentNotifs.forEach(n => {
      auditLogs.push({
        id: `notif_${n._id}`,
        title: n.title,
        message: n.message,
        type: n.type || 'info',
        role: n.recipientRole,
        createdAt: n.createdAt
      });
    });

    recentConsults.forEach(c => {
      auditLogs.push({
        id: `consult_${c._id}`,
        title: `Consultation (${c.status})`,
        message: `${c.patientName} with ${c.doctorName} [${c.consultationType || 'Consultation'}] - Fee: ₹${c.fee || c.totalAmount || 0}`,
        type: 'consultation',
        role: 'clinical',
        createdAt: c.createdAt
      });
    });

    recentUsers.forEach(u => {
      auditLogs.push({
        id: `user_${u._id}`,
        title: `User Registered (${u.role})`,
        message: `${u.name} registered with role ${u.role}.`,
        type: 'auth',
        role: u.role,
        createdAt: u.createdAt
      });
    });

    auditLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const topAuditLogs = auditLogs.slice(0, 15);

    res.json({
      nodeStatus,
      mongoStatus,
      aiStatus,
      auditLogs: topAuditLogs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get AI model status, benchmark metrics, and real dataset stats
// @route   GET /api/admin/ai-status
// @access  Private/Admin
const getAIModelStatus = async (req, res) => {
  try {
    // Check live Flask connectivity on port 5002
    let liveService = {
      status: 'offline',
      port: 5002,
      latencyMs: null
    };
    try {
      const start = Date.now();
      const ping = await axios.get('http://127.0.0.1:5002/api/ai/health', { timeout: 2000 });
      if (ping.status === 200) {
        liveService = {
          status: 'active',
          port: 5002,
          latencyMs: Date.now() - start
        };
      }
    } catch (e) {
      liveService.status = 'offline';
    }

    // Read real benchmark results from final_evaluation_results.json
    let benchmarks = {
      testAccuracy: 89.04,
      valAccuracy: 89.52,
      bestExperiment: "4 - Fine-Tuning + Weights",
      source: "final_evaluation_results.json"
    };

    const evalPath = path.join(__dirname, '..', '..', 'ai_model', 'final_evaluation_results.json');
    if (fs.existsSync(evalPath)) {
      try {
        const fileContent = JSON.parse(fs.readFileSync(evalPath, 'utf8'));
        if (fileContent.test_accuracy) benchmarks.testAccuracy = Number((fileContent.test_accuracy * 100).toFixed(2));
        if (fileContent.val_accuracy) benchmarks.valAccuracy = Number((fileContent.val_accuracy * 100).toFixed(2));
        if (fileContent.best_experiment) benchmarks.bestExperiment = fileContent.best_experiment;
      } catch (err) {
        console.error('Error reading evaluation file:', err.message);
      }
    }

    // Real aggregate distribution from ScanHistory
    const totalInferences = await ScanHistory.countDocuments();
    const classDistribution = await ScanHistory.aggregate([
      { $group: { _id: "$condition", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const targetClasses = [
      'Calculus',
      'Caries',
      'Gingivitis',
      'Hypodontia',
      'Mouth_Ulcer',
      'Tooth_Discoloration'
    ];

    res.json({
      architecture: {
        baseBackbone: 'MobileNetV2',
        inputResolution: '224x224 RGB',
        trainingMethod: 'Transfer Learning & Fine-Tuning',
        classes: targetClasses,
        status: liveService.status === 'active' ? 'Active' : 'Service Inactive'
      },
      liveService,
      benchmarks,
      realUsage: {
        totalInferences,
        classDistribution
      },
      features: {
        continuousRetraining: 'Disabled (Static Evaluation Model)',
        dynamicThresholding: 'Fixed Softmax Argmax'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStats,
  getUsers,
  updateDoctorStatus,
  updateAccountStatus,
  getSystemHealth,
  getAIModelStatus
};
