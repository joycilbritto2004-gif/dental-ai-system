const mongoose = require('mongoose');

const medicationItemSchema = new mongoose.Schema({
  medicineName: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required'],
    trim: true
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
    trim: true
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    trim: true
  },
  instructions: {
    type: String,
    trim: true,
    default: ''
  }
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
  consultationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation',
    required: [true, 'Associated consultation is required'],
    index: true
  },
  scanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScanHistory',
    default: null,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Patient ID is required'],
    index: true
  },
  patientName: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor ID is required'],
    index: true
  },
  doctorName: {
    type: String,
    required: [true, 'Doctor name is required'],
    trim: true
  },
  doctorSpecialization: {
    type: String,
    default: 'Dental Specialist',
    trim: true
  },
  clinicName: {
    type: String,
    default: 'DentaAI Specialist Clinic',
    trim: true
  },
  condition: {
    type: String,
    default: 'General Dental Assessment',
    trim: true
  },
  prescriptionDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Issued', 'Active', 'Completed', 'Cancelled'],
    default: 'Issued'
  },
  medications: {
    type: [medicationItemSchema],
    validate: {
      validator: function(val) {
        return Array.isArray(val) && val.length > 0;
      },
      message: 'Prescription must contain at least one medication'
    }
  },
  additionalInstructions: {
    type: String,
    default: '',
    trim: true
  },
  generalAdvice: {
    type: [String],
    default: []
  }
}, { timestamps: true });

// Virtuals to ensure .id is accessible cleanly
prescriptionSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
  }
});

prescriptionSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id;
  }
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);
module.exports = Prescription;

