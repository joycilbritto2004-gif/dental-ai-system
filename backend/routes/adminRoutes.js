const express = require('express');
const router = express.Router();
const { 
  getStats, 
  getPatients,
  getDoctors,
  updateDoctorStatus, 
  updateAccountStatus,
  getScans,
  getAppointments,
  getPayments,
  getAuditLogs,
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  getUsers,
  getSystemHealth,
  getAIModelStatus
} = require('../controllers/adminController');

const { protect, restrictTo } = require('../middleware/authMiddleware');

// All administrative endpoints require valid authentication and admin role authorization
router.use(protect);
router.use(restrictTo('admin'));

// 1. Dashboard Overview Statistics
router.get('/stats', getStats);

// 2. Patient Management
router.get('/patients', getPatients);

// 3. Doctor Verification & Management
router.get('/doctors', getDoctors);
router.put('/doctors/:id/verify', updateDoctorStatus);
router.put('/users/:id/doctor-status', updateDoctorStatus); // Backward compatibility

// 4. Account Blocking & Activation
router.put('/users/:id/account-status', updateAccountStatus);

// 5. Dental Scan Management (Monitoring AI Triage & Doctor Verifications)
router.get('/scans', getScans);

// 6. Appointment Management
router.get('/appointments', getAppointments);

// 7. Payment Management (Financial Ledger & Real-Time Statistics)
router.get('/payments', getPayments);

// 8. Audit & Activity Trail
router.get('/audit-logs', getAuditLogs);

// 9. Admin Notifications
router.get('/notifications', getAdminNotifications);
router.put('/notifications/:id/read', markAdminNotificationRead);
router.put('/notifications/read-all', markAllAdminNotificationsRead);

// 10. System Health & AI Model Status
router.get('/users', getUsers);
router.get('/system-health', getSystemHealth);
router.get('/ai-status', getAIModelStatus);

module.exports = router;
