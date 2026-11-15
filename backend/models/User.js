const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    default: 'patient',
  },
  phone: {
    type: String,
  },
  profileImage: {
    type: String,
  },
  verificationStatus: {
    type: String,
    enum: ['Pending', 'Under Review', 'Approved', 'Rejected', 'Requires Resubmission'],
    default: 'Pending',
  },
  accountStatus: {
    type: String,
    enum: ['Active', 'Blocked'],
    default: 'Active',
  },
  // Doctor specific fields
  specialization: { type: String },
  clinic: { type: String },
  location: { type: String },
  fee: { type: Number, default: 500 },
  experience: { type: String, default: '10 Years' },
  languages: { type: String, default: 'English, Hindi' },
  bio: { type: String, default: '' },
  qualifications: { type: String, default: 'BDS' },
  dentalCouncilNumber: { type: String },
  stateDentalCouncil: { type: String },
  clinicAddress: { type: String },
  certificates: [{
    title: { type: String },
    url: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],
  rejectionReason: { type: String, default: '' },
  verificationNotes: { type: String, default: '' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedByName: { type: String },
  verifiedAt: { type: Date },
  verificationHistory: [{
    status: { type: String },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminName: { type: String },
    notes: { type: String },
    reason: { type: String },
    date: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
