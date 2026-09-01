const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  transactionId: { type: String, required: true },
  patientId: { type: String },
  patientName: { type: String, required: true },
  doctorId: { type: String, required: true },
  doctorName: { type: String, required: true },
  doctorSpecialization: { type: String },
  scanId: { type: mongoose.Schema.Types.ObjectId, ref: 'ScanHistory' },
  condition: { type: String },
  confidence: { type: String },
  recommendation: { type: String },
  message: { type: String },
  consultationType: { type: String },
  date: { type: String },
  time: { type: String },
  fee: { type: Number },
  platformFee: { type: Number },
  totalAmount: { type: Number },
  paymentStatus: { type: String, default: 'Paid' },
  status: { type: String, default: 'Pending', enum: ['Pending', 'Accepted', 'In Consultation', 'Completed', 'Rejected'] },
  finalDiagnosis: { type: String },
  treatmentPlan: { type: String }
}, { timestamps: true });

// We transform _id to id so frontend can just use .id
consultationSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
  }
});

const Consultation = mongoose.model('Consultation', consultationSchema);
module.exports = Consultation;
