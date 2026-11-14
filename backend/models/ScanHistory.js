const mongoose = require('mongoose');

const classProbabilityValidator = (val) => {
  if (val === undefined || val === null) return true;
  return typeof val === 'number' && Number.isFinite(val) && val >= 0 && val <= 100;
};

const classProbabilitiesSchema = new mongoose.Schema({
  Calculus: { type: Number, validate: { validator: classProbabilityValidator, message: 'Invalid Calculus probability' } },
  Caries: { type: Number, validate: { validator: classProbabilityValidator, message: 'Invalid Caries probability' } },
  Gingivitis: { type: Number, validate: { validator: classProbabilityValidator, message: 'Invalid Gingivitis probability' } },
  Hypodontia: { type: Number, validate: { validator: classProbabilityValidator, message: 'Invalid Hypodontia probability' } },
  Mouth_Ulcer: { type: Number, validate: { validator: classProbabilityValidator, message: 'Invalid Mouth_Ulcer probability' } },
  Tooth_Discoloration: { type: Number, validate: { validator: classProbabilityValidator, message: 'Invalid Tooth_Discoloration probability' } }
}, { _id: false });

const auditEntrySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['CONFIRMED', 'OVERRIDDEN', 'REJECTED', 'RESCAN_REQUESTED', 'INITIAL_SCAN'],
    required: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  previousDiagnosis: {
    type: String,
    default: null,
  },
  newDiagnosis: {
    type: String,
    default: null,
  },
  notes: {
    type: String,
    default: '',
  },
}, { _id: true });

const scanHistorySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  imagePath: {
    type: String,
    default: null,
  },
  condition: {
    type: String,
    required: true,
  },
  confidence: {
    type: Number,
    required: true,
  },
  recommendation: {
    type: String,
  },
  scanId: {
    type: String,
    required: true,
  },
  prescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription',
    default: null
  },
  classProbabilities: {
    type: classProbabilitiesSchema,
    default: null
  },

  // === Doctor Verification & Clinical Assessment Fields ===
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'Rejected', 'Needs Rescan'],
    default: 'Pending',
    index: true,
  },
  finalDiagnosis: {
    type: String,
    default: null,
  },
  isOverridden: {
    type: Boolean,
    default: false,
  },
  secondaryFindings: {
    type: [String],
    default: [],
  },
  doctorNotes: {
    type: String,
    default: '',
  },
  treatmentPlan: {
    type: String,
    default: '',
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  verifiedAt: {
    type: Date,
    default: null,
  },

  // === Clinical Audit Trail ===
  auditTrail: {
    type: [auditEntrySchema],
    default: [],
  },
}, { timestamps: true });

// Virtual alias: predictedCondition maps to condition for seamless naming compatibility
scanHistorySchema.virtual('predictedCondition').get(function () {
  return this.condition;
});

scanHistorySchema.set('toJSON', { virtuals: true });
scanHistorySchema.set('toObject', { virtuals: true });

const ScanHistory = mongoose.model('ScanHistory', scanHistorySchema);
module.exports = ScanHistory;
