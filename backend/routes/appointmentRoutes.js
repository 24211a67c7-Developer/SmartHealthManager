const express = require('express');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();

// ---------------- BOOK APPOINTMENT (patient) ----------------
router.post('/', protect, allowRoles('patient'), async (req, res) => {
  try {
    const { doctorId, specialty, symptoms, healthIssue, preferredDate } = req.body;

    const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });

    const appointment = new Appointment({
      patient: req.user.id,
      doctor: doctorId,
      specialty: specialty || doctor.specialty,
      symptoms,
      healthIssue,
      preferredDate
    });

    await appointment.save();
    res.status(201).json(appointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error booking appointment.' });
  }
});

// ---------------- PATIENT: view own appointments ----------------
router.get('/my', protect, allowRoles('patient'), async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user.id })
      .populate('doctor', 'name specialty isAvailable')
      .sort({ createdAt: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching appointments.' });
  }
});

// ---------------- DOCTOR: view assigned appointments ----------------
router.get('/doctor', protect, allowRoles('doctor'), async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user.id })
      .populate('patient', 'name age healthIssue symptoms')
      .sort({ createdAt: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching appointments.' });
  }
});

// ---------------- DOCTOR: accept an appointment ----------------
router.put('/:id/accept', protect, allowRoles('doctor'), async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, doctor: req.user.id },
      { status: 'accepted' },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Server error accepting appointment.' });
  }
});

// ---------------- DOCTOR: reassign to another doctor (busy with another case) ----------------
router.put('/:id/reassign', protect, allowRoles('doctor'), async (req, res) => {
  try {
    const { newDoctorId, reason } = req.body;

    const appointment = await Appointment.findOne({ _id: req.params.id, doctor: req.user.id });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });

    const newDoctor = await User.findOne({ _id: newDoctorId, role: 'doctor', isActive: true });
    if (!newDoctor) return res.status(404).json({ message: 'Target doctor not found.' });

    appointment.reassignmentHistory.push({
      fromDoctor: appointment.doctor,
      toDoctor: newDoctorId,
      reason: reason || 'Doctor unavailable'
    });
    appointment.doctor = newDoctorId;
    appointment.status = 'reassigned';

    await appointment.save();
    res.json(appointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error reassigning appointment.' });
  }
});

// ---------------- DOCTOR: mark appointment completed ----------------
router.put('/:id/complete', protect, allowRoles('doctor'), async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, doctor: req.user.id },
      { status: 'completed' },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Server error completing appointment.' });
  }
});

// ---------------- DOCTOR: toggle own availability ----------------
router.put('/toggle-availability', protect, allowRoles('doctor'), async (req, res) => {
  try {
    const doctor = await User.findById(req.user.id);
    doctor.isAvailable = !doctor.isAvailable;
    await doctor.save();
    res.json({ isAvailable: doctor.isAvailable });
  } catch (err) {
    res.status(500).json({ message: 'Server error updating availability.' });
  }
});

module.exports = router;
