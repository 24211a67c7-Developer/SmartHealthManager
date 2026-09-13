const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// ---------------- REGISTER ----------------
// Handles patient, doctor, and owner registration from one endpoint
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, age, healthIssue, symptoms, specialty } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    if (role === 'doctor' && !specialty) {
      return res.status(400).json({ message: 'Doctors must select a specialty.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      age: role === 'patient' ? age : undefined,
      healthIssue: role === 'patient' ? healthIssue : undefined,
      symptoms: role === 'patient' ? symptoms : undefined,
      specialty: role === 'doctor' ? specialty : undefined
    });

    await newUser.save();

    res.status(201).json({ message: 'Registration successful. You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// ---------------- LOGIN ----------------
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email: email.toLowerCase(), role });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials or wrong role selected.' });
    }

    if (user.role === 'doctor' && !user.isActive) {
      return res.status(403).json({ message: 'This doctor account has been removed by the admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialty: user.specialty
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

module.exports = router;
