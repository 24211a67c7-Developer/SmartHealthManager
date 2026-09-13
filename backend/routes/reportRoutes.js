const express = require('express');
const MedicalReport = require('../models/MedicalReport');
const Appointment = require('../models/Appointment');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();

// ---------------- DOCTOR: create a medical report after seeing a patient ----------------
router.post('/', protect, allowRoles('doctor'), async (req, res) => {
  try {
    const { appointmentId, diagnosis, notes, medicines } = req.body;

    const appointment = await Appointment.findOne({ _id: appointmentId, doctor: req.user.id });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });

    const report = new MedicalReport({
      appointment: appointmentId,
      patient: appointment.patient,
      doctor: req.user.id,
      diagnosis,
      notes,
      medicines // [{ name, dosage, timesPerDay, timings, durationDays, instructions }]
    });

    await report.save();

    appointment.status = 'completed';
    await appointment.save();

    res.status(201).json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating report.' });
  }
});

// ---------------- PHARMACY (owner/doctor view): all pending reports ----------------
router.get('/pharmacy/pending', protect, async (req, res) => {
  try {
    const reports = await MedicalReport.find({ pharmacyStatus: 'pending' })
      .populate('patient', 'name age')
      .populate('doctor', 'name specialty')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching pharmacy queue.' });
  }
});

// ---------------- PHARMACY: mark medicines as dispensed ----------------
router.put('/:id/dispense', protect, async (req, res) => {
  try {
    const report = await MedicalReport.findByIdAndUpdate(
      req.params.id,
      { pharmacyStatus: 'dispensed' },
      { new: true }
    );
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: 'Server error dispensing medicines.' });
  }
});

module.exports = router;
