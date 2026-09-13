const express = require('express');
const User = require('../models/User');
const MedicalReport = require('../models/MedicalReport');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();

// Get list of all doctors (used when booking - can filter by specialty)
router.get('/doctors', protect, async (req, res) => {
  try {
    const filter = { role: 'doctor', isActive: true };
    if (req.query.specialty) filter.specialty = req.query.specialty;

    const doctors = await User.find(filter).select('-password');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching doctors.' });
  }
});

// Get logged-in patient's own profile
router.get('/me', protect, allowRoles('patient'), async (req, res) => {
  try {
    const patient = await User.findById(req.user.id).select('-password');
    res.json(patient);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching profile.' });
  }
});

// Update patient details (health issue / symptoms can change over time)
router.put('/me', protect, allowRoles('patient'), async (req, res) => {
  try {
    const { age, healthIssue, symptoms } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { age, healthIssue, symptoms },
      { new: true }
    ).select('-password');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating profile.' });
  }
});

// Get all medical reports for the logged-in patient
router.get('/my-reports', protect, allowRoles('patient'), async (req, res) => {
  try {
    const reports = await MedicalReport.find({ patient: req.user.id })
      .populate('doctor', 'name specialty')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching reports.' });
  }
});

module.exports = router;
