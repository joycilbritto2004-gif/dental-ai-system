const mongoose = require('mongoose');

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
  }
}, { timestamps: true });

const ScanHistory = mongoose.model('ScanHistory', scanHistorySchema);
module.exports = ScanHistory;
