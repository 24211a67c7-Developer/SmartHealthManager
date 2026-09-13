const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    specialty: { type: String, required: true },
    symptoms: { type: String, required: true },
    healthIssue: { type: String },
    preferredDate: { type: Date },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'reassigned', 'completed', 'cancelled'],
      default: 'pending'
    },

    // Keeps a history of doctor reassignments (e.g. if a doctor is busy)
    reassignmentHistory: [
      {
        fromDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        toDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: String,
        date: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
