// workers/notificationWorker.js
//
// This script runs INSIDE a separate Worker Thread (see utils/runNotificationWorker.js).
// It simulates sending an email notification to the employee whenever
// their leave request is approved or rejected, WITHOUT blocking the
// main Node.js event loop / Express server.

const { parentPort, workerData } = require('worker_threads');

// Simulate processing/network delay for sending an email (1.5 - 3 seconds)
const simulateEmailDelay = () => {
  return new Promise((resolve) => {
    const delay = 1500 + Math.random() * 1500;
    setTimeout(resolve, delay);
  });
};

const sendNotification = async () => {
  const { employeeName, employeeEmail, leaveType, status, startDate, endDate } = workerData;

  // Simulate the time it takes to connect to an email service & send mail
  await simulateEmailDelay();

  const subject =
    status === 'Approved'
      ? `Your ${leaveType} Leave has been Approved`
      : `Your ${leaveType} Leave has been Rejected`;

  const emailBody = `
    Dear ${employeeName},
    Your leave request (${leaveType}) from ${new Date(startDate).toDateString()}
    to ${new Date(endDate).toDateString()} has been ${status}.
    This is an automated notification from the Leave Management System.
  `;

  // In a real app, this is where you'd call nodemailer / SendGrid / SES etc.
  // Here we just log it to simulate the email being "sent".
  const result = {
    success: true,
    to: employeeEmail,
    subject,
    body: emailBody.trim(),
    sentAt: new Date().toISOString(),
  };

  // Send the result back to the main thread
  parentPort.postMessage(result);
};

sendNotification().catch((err) => {
  parentPort.postMessage({ success: false, error: err.message });
});
