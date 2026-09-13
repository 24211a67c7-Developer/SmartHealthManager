const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const ownerRoutes = require('./routes/ownerRoutes');

const app = express();

app.use(cors()); // allows the frontend (different origin/port) to call this API
app.use(express.json()); // parses incoming JSON bodies

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Route groups
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/owner', ownerRoutes);

// Catch-all 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

module.exports = app;
