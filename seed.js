// seed.js
// Populates the database with sample data for demo / viva presentation.
// Run with: npm run seed

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Employee = require('./models/Employee');
const Leave = require('./models/Leave');

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Employee.deleteMany();
    await Leave.deleteMany();
    console.log('Old data cleared...');

    // ---------- Create Admin ----------
    const admin = await Employee.create({
      employeeId: 'ADM001',
      name: 'laxmi',
      email: process.env.ADMIN_EMAIL || 'laxmi@company.com',
      password: process.env.ADMIN_PASSWORD || 'laxmi@1234',
      role: 'admin',
      department: 'Human Resources',
    });

    // ---------- Create Sample Employees ----------
    const employeesData = [
      { employeeId: 'EMP001', name: 'Subrahamanyam', email: 'subbu@company.com', password: 'subbu@1234', department: 'Engineering' },
      { employeeId: 'EMP002', name: 'Rajyalaxmi', email: 'chitti@company.com', password: 'chitti@1234', department: 'Marketing' },
      { employeeId: 'EMP003', name: 'susmitha', email: 'susmi@company.com', password: 'susmi@1234', department: 'Sales' },
      { employeeId: 'EMP004', name: 'yasasri', email: 'yasu@company.com', password: 'yasu@1234', department: 'Engineering' },
    ];

    const employees = await Employee.insertMany(employeesData);
    console.log(`${employees.length} sample employees created`);

    // ---------- Create Sample Leave Requests ----------
    const leavesData = [
      {
        employeeId: employees[0].employeeId,
        employeeName: employees[0].name,
        employeeRef: employees[0]._id,
        leaveType: 'Sick',
        startDate: new Date('2026-06-10'),
        endDate: new Date('2026-06-11'),
        reason: 'I have fever and need rest for two days',
        reasonSummary: 'Fever, needs rest',
        totalDays: 2,
        status: 'Approved',
        autoApproved: true,
        reviewedBy: 'laxmi',
      },
      {
        employeeId: employees[1].employeeId,
        employeeName: employees[1].name,
        employeeRef: employees[1]._id,
        leaveType: 'Casual',
        startDate: new Date('2026-06-15'),
        endDate: new Date('2026-06-20'),
        reason: 'Attending my cousin\'s wedding function out of town with family',
        reasonSummary: 'Cousin wedding function out town',
        totalDays: 6,
        status: 'Pending',
        autoApproved: false,
      },
      {
        employeeId: employees[2].employeeId,
        employeeName: employees[2].name,
        employeeRef: employees[2]._id,
        leaveType: 'Earned',
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-07-05'),
        reason: 'Planned family vacation to Goa booked in advance',
        reasonSummary: 'Planned family vacation Goa',
        totalDays: 5,
        status: 'Rejected',
        autoApproved: false,
        reviewedBy: 'laxmi',
      },
      {
        employeeId: employees[3].employeeId,
        employeeName: employees[3].name,
        employeeRef: employees[3]._id,
        leaveType: 'Casual',
        startDate: new Date('2026-06-22'),
        endDate: new Date('2026-06-22'),
        reason: 'Personal work at home, need a day off',
        reasonSummary: 'Personal work home day off',
        totalDays: 1,
        status: 'Approved',
        autoApproved: true,
        reviewedBy: 'laxmi',
      },
      {
        employeeId: employees[0].employeeId,
        employeeName: employees[0].name,
        employeeRef: employees[0]._id,
        leaveType: 'Other',
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-08-04'),
        reason: 'Need to relocate to a new apartment, require time for shifting',
        reasonSummary: 'Relocate apartment, time shifting',
        totalDays: 4,
        status: 'Pending',
        autoApproved: false,
      },
    ];

    const leaves = await Leave.insertMany(leavesData);
    console.log(`${leaves.length} sample leave requests created`);

    console.log('\n========== SEED COMPLETE ==========');
    console.log(`Admin login   -> email: ${admin.email}  | password: ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
    console.log('Employee login -> email: username@company.com | password: xr@54%&*(twUOpSl');
    console.log('====================================\n');

    process.exit();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
