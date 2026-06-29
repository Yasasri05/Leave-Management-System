// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllLeaves,
  approveLeave,
  rejectLeave,
  deleteLeave,
  getDashboardStats,
  getAllEmployees,
  getMonthlyReport,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes require login AND admin role
router.use(protect, adminOnly);

router.get('/leaves', getAllLeaves);
router.put('/leaves/:id/approve', approveLeave);
router.put('/leaves/:id/reject', rejectLeave);
router.delete('/leaves/:id', deleteLeave);
router.get('/stats', getDashboardStats);
router.get('/employees', getAllEmployees);
router.get('/report/monthly', getMonthlyReport);

module.exports = router;
