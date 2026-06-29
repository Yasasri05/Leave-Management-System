// controllers/adminController.js
// Handles all Admin/Manager-facing operations: view all leaves with
// search/filter, approve/reject/delete leaves, and dashboard stats.

const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const runNotificationWorker = require('../utils/runNotificationWorker');

// @desc    Get all leave requests with optional search/filter (employee, date, type, status)
// @route   GET /api/admin/leaves
// @access  Private (Admin)
const getAllLeaves = async (req, res, next) => {
  try {
    const { employee, leaveType, status, startDate, endDate } = req.query;

    const filter = {};

    // Search by employee name or employee ID (case-insensitive partial match)
    if (employee) {
      filter.$or = [
        { employeeName: { $regex: employee, $options: 'i' } },
        { employeeId: { $regex: employee, $options: 'i' } },
      ];
    }

    if (leaveType) filter.leaveType = leaveType;
    if (status) filter.status = status;

    // Filter leaves that fall within the given date range
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) filter.startDate.$gte = new Date(startDate);
      if (endDate) filter.startDate.$lte = new Date(endDate);
    }

    const leaves = await Leave.find(filter).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: leaves.length, data: leaves });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a leave request
// @route   PUT /api/admin/leaves/:id/approve
// @access  Private (Admin)
const approveLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      res.status(404);
      throw new Error('Leave request not found');
    }

    leave.status = 'Approved';
    leave.reviewedBy = req.user.name;
    await leave.save();

    // Deduct from employee's leave balance
    const employee = await Employee.findById(leave.employeeRef);
    if (employee && employee.leaveBalance[leave.leaveType] !== undefined) {
      employee.leaveBalance[leave.leaveType] = Math.max(
        0,
        employee.leaveBalance[leave.leaveType] - leave.totalDays
      );
      await employee.save();
    }

    // Run background worker thread to simulate sending the email notification
    // The HTTP response below is sent immediately - the server is NOT blocked.
    runNotificationWorker({
      employeeName: leave.employeeName,
      employeeEmail: employee ? employee.email : 'unknown@company.com',
      leaveType: leave.leaveType,
      status: 'Approved',
      startDate: leave.startDate,
      endDate: leave.endDate,
    });

    res.status(200).json({ success: true, message: 'Leave approved successfully', data: leave });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a leave request
// @route   PUT /api/admin/leaves/:id/reject
// @access  Private (Admin)
const rejectLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      res.status(404);
      throw new Error('Leave request not found');
    }

    leave.status = 'Rejected';
    leave.reviewedBy = req.user.name;
    await leave.save();

    const employee = await Employee.findById(leave.employeeRef);

    // Background worker thread - keeps main server responsive
    runNotificationWorker({
      employeeName: leave.employeeName,
      employeeEmail: employee ? employee.email : 'unknown@company.com',
      leaveType: leave.leaveType,
      status: 'Rejected',
      startDate: leave.startDate,
      endDate: leave.endDate,
    });

    res.status(200).json({ success: true, message: 'Leave rejected successfully', data: leave });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a leave request
// @route   DELETE /api/admin/leaves/:id
// @access  Private (Admin)
const deleteLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      res.status(404);
      throw new Error('Leave request not found');
    }

    await leave.deleteOne();
    res.status(200).json({ success: true, message: 'Leave request deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getDashboardStats = async (req, res, next) => {
  try {
    const totalEmployees = await Employee.countDocuments({ role: 'employee' });
    const totalLeaves = await Leave.countDocuments();
    const approvedLeaves = await Leave.countDocuments({ status: 'Approved' });
    const rejectedLeaves = await Leave.countDocuments({ status: 'Rejected' });
    const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });

    // Breakdown by leave type (useful for charts)
    const leaveTypeBreakdown = await Leave.aggregate([
      { $group: { _id: '$leaveType', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalEmployees,
        totalLeaves,
        approvedLeaves,
        rejectedLeaves,
        pendingLeaves,
        leaveTypeBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of all employees (for admin "Employees" view)
// @route   GET /api/admin/employees
// @access  Private (Admin)
const getAllEmployees = async (req, res, next) => {
  try {
    const employees = await Employee.find({ role: 'employee' }).select('-password');
    res.status(200).json({ success: true, count: employees.length, data: employees });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate a simple monthly leave report (bonus feature)
// @route   GET /api/admin/report/monthly?month=6&year=2026
// @access  Private (Admin)
const getMonthlyReport = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1; // 1-12
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const leaves = await Leave.find({
      startDate: { $gte: start, $lte: end },
    }).sort({ startDate: 1 });

    const summary = {
      month,
      year,
      totalRequests: leaves.length,
      approved: leaves.filter((l) => l.status === 'Approved').length,
      rejected: leaves.filter((l) => l.status === 'Rejected').length,
      pending: leaves.filter((l) => l.status === 'Pending').length,
      totalDaysTaken: leaves
        .filter((l) => l.status === 'Approved')
        .reduce((sum, l) => sum + l.totalDays, 0),
    };

    res.status(200).json({ success: true, summary, data: leaves });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllLeaves,
  approveLeave,
  rejectLeave,
  deleteLeave,
  getDashboardStats,
  getAllEmployees,
  getMonthlyReport,
};
