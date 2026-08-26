const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/scans', require('./routes/scanHistoryRoutes'));

// Basic route
app.get('/', (req, res) => {
  res.send('DentaAI Backend is running');
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'DentaAI backend is running'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
