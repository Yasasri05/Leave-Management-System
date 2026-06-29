// server.js
// Entry point of the Leave Management System backend.
// Sets up Express, connects to MongoDB, wires up routes/middleware,
// and serves the static frontend (HTML/CSS/JS) from /public and /views.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Connect to MongoDB
connectDB();

const app = express();

// ---------- Global Middleware ----------
app.use(cors());
app.use(express.json()); // parse JSON request bodies
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets (CSS, JS)
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));

// ---------- API Routes ----------
app.use('/api/auth', authRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/admin', adminRoutes);

// Simple health check route
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Leave Management System API is running' });
});

// ---------- Frontend Pages (server-rendered as static HTML) ----------
const viewsPath = path.join(__dirname, 'views');
app.get('/', (req, res) => res.sendFile(path.join(viewsPath, 'index.html')));
app.get('/register', (req, res) => res.sendFile(path.join(viewsPath, 'register.html')));
app.get('/employee-dashboard', (req, res) => res.sendFile(path.join(viewsPath, 'employee-dashboard.html')));
app.get('/apply-leave', (req, res) => res.sendFile(path.join(viewsPath, 'apply-leave.html')));
app.get('/leave-history', (req, res) => res.sendFile(path.join(viewsPath, 'leave-history.html')));
app.get('/admin-dashboard', (req, res) => res.sendFile(path.join(viewsPath, 'admin-dashboard.html')));

// ---------- Error Handling Middleware (must be last) ----------
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  ========================================================
   Leave Management System Server
   Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}
   Visit: http://localhost:${PORT}
  ========================================================
  `);
});
