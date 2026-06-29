// utils/runNotificationWorker.js
//
// Helper function that spins up a Worker Thread to process the
// (simulated) email notification in the background, keeping the
// main Express server responsive to other requests.

const path = require('path');
const { Worker } = require('worker_threads');

/**
 * Spawns a worker thread to "send" a leave status notification email.
 * This is fire-and-forget from the controller's point of view -
 * the HTTP response to the admin is sent immediately, while the
 * notification is processed asynchronously in the background.
 */
const runNotificationWorker = (notificationData) => {
  const workerPath = path.join(__dirname, '..', 'workers', 'notificationWorker.js');

  const worker = new Worker(workerPath, {
    workerData: notificationData,
  });

  worker.on('message', (result) => {
    if (result.success) {
      console.log(
        `[Worker Thread] ✅ Email notification sent to ${result.to} | Subject: "${result.subject}" | at ${result.sentAt}`
      );
    } else {
      console.error(`[Worker Thread] ❌ Failed to send notification: ${result.error}`);
    }
  });

  worker.on('error', (err) => {
    console.error('[Worker Thread] Error:', err.message);
  });

  worker.on('exit', (code) => {
    if (code !== 0) {
      console.error(`[Worker Thread] stopped with exit code ${code}`);
    } else {
      console.log('[Worker Thread] Notification worker finished and exited cleanly.');
    }
  });
};

module.exports = runNotificationWorker;
