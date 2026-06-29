// models/Leave.js
// Mongoose schema for the Leaves collection

const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
    },
    employeeName: {
      type: String,
      required: true,
    },
    // Reference to the Employee document (useful for population/joins)
    employeeRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    leaveType: {
      type: String,
      enum: ['Sick', 'Casual', 'Earned', 'Maternity', 'Other'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    // AI generated short summary of the reason (bonus AI feature)
    reasonSummary: {
      type: String,
      default: '',
    },
    totalDays: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    // Tracks whether the system auto-approved this leave
    autoApproved: {
      type: Boolean,
      default: false,
    },
    reviewedBy: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Leave', leaveSchema);
