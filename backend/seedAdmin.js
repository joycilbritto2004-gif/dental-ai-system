const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dental_ai');
    
    // Clean up old placeholder admin accounts
    await User.deleteMany({ email: 'admin@dentaai.com' });

    // Permanent Admin Account: joycilbritto2004@gmail.com
    const adminEmail = 'joycilbritto2004@gmail.com';
    let admin = await User.findOne({ email: adminEmail });
    if (admin) {
      admin.role = 'admin';
      admin.name = 'System Admin (Joycil)';
      admin.verificationStatus = 'Approved';
      admin.accountStatus = 'Active';
      admin.password = 'adminpassword123';
      await admin.save();
      console.log(`Admin account (${adminEmail}) updated successfully.`);
    } else {
      admin = new User({
        name: 'System Admin (Joycil)',
        email: adminEmail,
        password: 'adminpassword123',
        role: 'admin',
        verificationStatus: 'Approved',
        accountStatus: 'Active'
      });
      await admin.save();
      console.log(`Permanent admin account (${adminEmail}) created successfully.`);
    }
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

seedAdmin();
