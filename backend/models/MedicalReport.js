const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dosage: { type: String, required: true }, // e.g. "500mg"
    timesPerDay: { type: Number, required: true }, // e.g. 2
    timings: [{ type: String }], // e.g. ["08:00 AM", "08:00 PM"]
    durationDays: { type: Number, required: true },
    instructions: { type: String } // e.g. "after food"
  },
  { _id: false }
);

const medicalReportSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    diagnosis: { type: String, required: true },
    notes: { type: String },
    medicines: [medicineSchema],

    // Sent to pharmacy for fulfillment
    pharmacyStatus: {
      type: String,
      enum: ['pending', 'dispensed'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicalReport', medicalReportSchema);
