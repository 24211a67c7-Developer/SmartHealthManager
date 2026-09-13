const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['patient', 'doctor', 'owner'], required: true },

    // ---- Patient-only fields ----
    age: { type: Number },
    healthIssue: { type: String },
    symptoms: { type: String },

    // ---- Doctor-only fields ----
    specialty: {
      type: String,
      enum: [
        'Cardiologist',
        'Neurologist',
        'General Surgeon',
        'Nephrologist',
        'Dermatologist',
        'Orthopedic',
        'Pediatrician',
        'General Physician'
      ]
    },
    isAvailable: { type: Boolean, default: true }, // false = busy with another case
    isActive: { type: Boolean, default: true } // owner can deactivate/remove a doctor
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
