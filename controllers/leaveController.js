// controllers/leaveController.js
// Handles all Employee-facing leave operations: apply, view history,
// check status, cancel. Also exposes the AI suggestion endpoints.

const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const { suggestLeaveType, summarizeReason, evaluateAutoApproval } = require('../utils/aiHelper');
const runNotificationWorker = require('../utils/runNotificationWorker');

// @desc    Apply for a new leave
// @route   POST /api/leaves
// @access  Private (Employee)
const applyLeave = async (req, res, next) => {
  try {
    const { employeeId, employeeName, leaveType, startDate, endDate, reason } = req.body;

    if (!employeeId || !employeeName || !leaveType || !startDate || !endDate || !reason) {
      res.status(400);
      throw new Error('All fields are required to apply for leave');
    }

    if (new Date(startDate) > new Date(endDate)) {
      res.status(400);
      throw new Error('Start date cannot be after end date');
    }

    // AI Feature: Auto-approval rule for short (1-2 day) leaves
    const { autoApproved, status, totalDays } = evaluateAutoApproval(startDate, endDate);

    // AI Feature: Summarize the long reason text
    const reasonSummary = summarizeReason(reason);

    const leave = await Leave.create({
      employeeId,
      employeeName,
      employeeRef: req.user._id,
      leaveType,
      startDate,
      endDate,
      reason,
      reasonSummary,
      totalDays,
      status,
      autoApproved,
    });

    // If auto-approved, fire a background worker thread to "send" the notification email
    if (autoApproved) {
      runNotificationWorker({
        employeeName: req.user.name,
        employeeEmail: req.user.email,
        leaveType,
        status: 'Approved',
        startDate,
        endDate,
      });
    }

    res.status(201).json({
      success: true,
      message: autoApproved
        ? 'Leave applied and AUTO-APPROVED (1-2 day rule)'
        : 'Leave request submitted and is pending admin approval',
      data: leave,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged-in employee's leave history
// @route   GET /api/leaves/my
// @access  Private (Employee)
const getMyLeaves = async (req, res, next) => {
  try {
    const leaves = await Leave.find({ employeeRef: req.user._id }).sort({ createdAt: -1 });

    // Dashboard-style stats for the logged-in employee
    const stats = {
      total: leaves.length,
      pending: leaves.filter((l) => l.status === 'Pending').length,
      approved: leaves.filter((l) => l.status === 'Approved').length,
      rejected: leaves.filter((l) => l.status === 'Rejected').length,
    };

    res.status(200).json({ success: true, data: leaves, stats, leaveBalance: req.user.leaveBalance });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a pending leave request
// @route   DELETE /api/leaves/:id/cancel
// @access  Private (Employee - own leave only)
const cancelLeave = async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      res.status(404);
      throw new Error('Leave request not found');
    }

    // Ensure employees can only cancel their own leave requests
    if (leave.employeeRef.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('You are not authorized to cancel this leave request');
    }

    if (leave.status !== 'Pending') {
      res.status(400);
      throw new Error('Only pending leave requests can be cancelled');
    }

    await leave.deleteOne();

    res.status(200).json({ success: true, message: 'Leave request cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    AI - Suggest leave type based on the reason text (live, as user types)
// @route   POST /api/leaves/ai/suggest-type
// @access  Private (Employee)
const aiSuggestLeaveType = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const suggestion = suggestLeaveType(reason || '');
    res.status(200).json({ success: true, suggestion });
  } catch (error) {
    next(error);
  }
};

module.exports = { applyLeave, getMyLeaves, cancelLeave, aiSuggestLeaveType };
