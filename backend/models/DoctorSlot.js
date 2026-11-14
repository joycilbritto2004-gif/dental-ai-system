const mongoose = require('mongoose');

const doctorSlotSchema = new mongoose.Schema({
  slotKey: {
    type: String,
    required: true,
    unique: true, // MongoDB UNIQUE INDEX guarantees atomic concurrency protection at database level
    index: true
  },
  doctorId: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: String,
    required: true,
    index: true
  },
  time: {
    type: String,
    required: true
  },
  patientId: {
    type: String,
    index: true
  },
  consultationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation',
    index: true
  },
  consultationType: {
    type: String
  },
  status: {
    type: String,
    enum: ['RESERVED', 'CONFIRMED', 'RELEASED'],
    default: 'CONFIRMED',
    index: true
  },
  reservationExpiresAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Virtual id for convenience
doctorSlotSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id;
  }
});

doctorSlotSchema.set('toObject', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id;
  }
});

const DoctorSlot = mongoose.model('DoctorSlot', doctorSlotSchema);
module.exports = DoctorSlot;

