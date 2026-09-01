const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const seedDoctor = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dental_ai');
    
    await User.deleteMany({ email: 'priya.menon@dentaai.com' });

    const newDoctor = new User({
      name: 'Dr. Priya Menon',
      email: 'priya.menon@dentaai.com',
      password: 'password123',
      role: 'doctor'
    });

    await newDoctor.save();
    console.log("Dr. Priya Menon account created successfully.");
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

seedDoctor();
