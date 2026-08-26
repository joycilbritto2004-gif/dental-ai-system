const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI || process.env.MONGODB_URI === 'PASTE_MY_MONGODB_CONNECTION_STRING_HERE') {
      console.warn('⚠️  MONGODB_URI is not set to a valid connection string in .env');
      console.warn('⚠️  Skipping MongoDB connection. Server will run in disconnected mode.');
      return;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Not exiting the process so the server can still run and return the /api/health route.
    // process.exit(1);
  }
};

module.exports = connectDB;
