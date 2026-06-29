// controllers/authController.js
// Handles Employee/Admin registration, login, and profile retrieval

const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

// Helper to generate a signed JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
};

// @desc    Register a new employee (or admin)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { employeeId, name, email, password, role, department } = req.body;

    if (!employeeId || !name || !email || !password) {
      res.status(400);
      throw new Error('Please fill in all required fields');
    }

    // Check if user already exists
    const existingUser = await Employee.findOne({ $or: [{ email }, { employeeId }] });
    if (existingUser) {
      res.status(400);
      throw new Error('An account with this Employee ID or Email already exists');
    }

    const user = await Employee.create({
      employeeId,
      name,
      email,
      password,
      role: role === 'admin' ? 'admin' : 'employee', // default to employee for safety
      department: department || 'General',
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login employee/admin
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    // Explicitly select password since schema hides it by default
    const user = await Employee.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        leaveBalance: user.leaveBalance,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user's profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await Employee.findById(req.user._id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser, getProfile };
