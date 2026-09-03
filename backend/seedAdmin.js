const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dental_ai');
    
    await User.deleteMany({ email: 'admin@dentaai.com' });

    const newAdmin = new User({
      name: 'System Admin',
      email: 'admin@dentaai.com',
      password: 'adminpassword123',
      role: 'admin'
    });

    await newAdmin.save();
    console.log("Admin account created successfully.");
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

seedAdmin();
