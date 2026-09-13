const express = require('express');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const MedicalReport = require('../models/MedicalReport');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();

// All routes here are owner-only
router.use(protect, allowRoles('owner'));

// ---------------- DASHBOARD SUMMARY ----------------
router.get('/dashboard', async (req, res) => {
  try {
    const [totalPatients, totalDoctors, totalAppointments, totalReports] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'doctor', isActive: true }),
      Appointment.countDocuments(),
      MedicalReport.countDocuments()
    ]);

    res.json({ totalPatients, totalDoctors, totalAppointments, totalReports });
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching dashboard.' });
  }
});

// ---------------- LIST ALL PATIENTS ----------------
router.get('/patients', async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' }).select('-password');
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching patients.' });
  }
});

// ---------------- LIST ALL DOCTORS ----------------
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('-password');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching doctors.' });
  }
});

// ---------------- REMOVE (DEACTIVATE) A DOCTOR ----------------
router.put('/doctors/:id/remove', async (req, res) => {
  try {
    const doctor = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'doctor' },
      { isActive: false },
      { new: true }
    );
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });
    res.json({ message: `${doctor.name} has been removed.` });
  } catch (err) {
    res.status(500).json({ message: 'Server error removing doctor.' });
  }
});

// ---------------- REINSTATE A DOCTOR ----------------
router.put('/doctors/:id/reinstate', async (req, res) => {
  try {
    const doctor = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'doctor' },
      { isActive: true },
      { new: true }
    );
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });
    res.json({ message: `${doctor.name} has been reinstated.` });
  } catch (err) {
    res.status(500).json({ message: 'Server error reinstating doctor.' });
  }
});

// ---------------- ALL APPOINTMENTS (overview) ----------------
router.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('patient', 'name age')
      .populate('doctor', 'name specialty')
      .sort({ createdAt: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching appointments.' });
  }
});

module.exports = router;
