const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'DOCTOR_APPROVED',
      'DOCTOR_REJECTED',
      'DOCTOR_UNDER_REVIEW',
      'DOCTOR_RESUBMISSION_REQUESTED',
      'ACCOUNT_BLOCKED',
      'ACCOUNT_ACTIVATED',
      'CREDENTIAL_VERIFIED',
      'APPOINTMENT_UPDATED',
      'PAYMENT_AUDITED',
      'SYSTEM_CONFIGURATION',
      'ADMIN_LOGIN',
    ],
    index: true,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  adminName: {
    type: String,
    required: true,
  },
  adminEmail: {
    type: String,
  },
  targetType: {
    type: String,
    enum: ['Doctor', 'Patient', 'Consultation', 'Scan', 'System', 'Payment'],
    required: true,
    index: true,
  },
  targetId: {
    type: String,
    index: true,
  },
  targetName: {
    type: String,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  reason: {
    type: String,
    default: '',
  },
  ipAddress: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, { timestamps: true });

auditLogSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
  }
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
