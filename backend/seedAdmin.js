const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const { assertLocalDatabase } = require('./utils/seedGuard');

// Admin accounts cannot be self-registered (see authController), so this script is the only
// way one is created. Both the address and the password come from the environment — never
// hardcode them, or every deployment of this repository ships the same known admin login.
const seedAdmin = async () => {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('Refusing to seed: set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in backend/.env first.');
    process.exit(1);
  }
  if (adminPassword.length < 12) {
    console.error('Refusing to seed: SEED_ADMIN_PASSWORD must be at least 12 characters.');
    process.exit(1);
  }

  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dental_ai';
    assertLocalDatabase(uri);
    await mongoose.connect(uri);

    let admin = await User.findOne({ email: adminEmail });
    if (admin) {
      admin.role = 'admin';
      admin.verificationStatus = 'Approved';
      admin.accountStatus = 'Active';
      admin.password = adminPassword;
      await admin.save();
      console.log(`Admin account (${adminEmail}) updated successfully.`);
    } else {
      admin = new User({
        name: process.env.SEED_ADMIN_NAME || 'System Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        verificationStatus: 'Approved',
        accountStatus: 'Active'
      });
      await admin.save();
      console.log(`Admin account (${adminEmail}) created successfully.`);
    }

    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
};

seedAdmin();
