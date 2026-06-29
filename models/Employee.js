// models/Employee.js
// Mongoose schema for the Employees collection
// Stores both Employees and Admins/Managers (differentiated by "role")

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // never return password by default
    },
    role: {
      type: String,
      enum: ['employee', 'admin'],
      default: 'employee',
    },
    department: {
      type: String,
      default: 'General',
    },
    // Leave balance tracking (bonus feature)
    leaveBalance: {
      Sick: { type: Number, default: 10 },
      Casual: { type: Number, default: 10 },
      Earned: { type: Number, default: 15 },
      Maternity: { type: Number, default: 90 },
      Other: { type: Number, default: 5 },
    },
  },
  { timestamps: true }
);

// Hash password before saving, only if it was modified
employeeSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare entered password with hashed password
employeeSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Employee', employeeSchema);
