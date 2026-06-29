// middleware/auth.js
// JWT authentication & role-based authorization middleware

const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

// Verifies the JWT token sent in the Authorization header
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Authorization header format: "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Verify token using secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach the logged-in user (without password) to the request object
      req.user = await Employee.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found, authorization denied' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

// Restrict route access to admin role only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
  }
};

module.exports = { protect, adminOnly };
