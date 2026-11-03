const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const { assertLocalDatabase } = require('./utils/seedGuard');

// Provisions the synthetic demo dentist used to explore the doctor portal.
// The password comes from the environment so the repository does not publish a working login.
const seedDoctor = async () => {
  const doctorEmail = process.env.SEED_DOCTOR_EMAIL || 'priya.menon@dentaai.com';
  const doctorPassword = process.env.SEED_DOCTOR_PASSWORD;

  if (!doctorPassword) {
    console.error('Refusing to seed: set SEED_DOCTOR_PASSWORD in backend/.env first.');
    process.exit(1);
  }

  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dental_ai';
    assertLocalDatabase(uri);
    await mongoose.connect(uri);

    await User.deleteMany({ email: doctorEmail });

    const newDoctor = new User({
      name: 'Dr. Priya Menon (Demo)',
      email: doctorEmail,
      password: doctorPassword,
      role: 'doctor',
      // The demo account is pre-approved so the doctor workflow can be explored end to end;
      // doctors who register themselves stay 'Pending' until an admin verifies them.
      verificationStatus: 'Approved',
      accountStatus: 'Active',
      specialization: 'General Dentistry',
      clinic: 'DentaAI Demo Clinic',
      location: 'Mangaluru',
      fee: 500
    });

    await newDoctor.save();
    console.log(`Demo doctor account (${doctorEmail}) created successfully.`);

    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
};

seedDoctor();
