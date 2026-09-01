const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const checkDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1/dental-ai-system');
    
    const users = await User.find({ role: 'doctor' });
    console.log("Doctors found:");
    console.log(users.map(u => ({ id: u._id, name: u.name, email: u.email })));
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

checkDB();
