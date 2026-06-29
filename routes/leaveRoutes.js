// routes/leaveRoutes.js
const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getMyLeaves,
  cancelLeave,
  aiSuggestLeaveType,
} = require('../controllers/leaveController');
const { protect } = require('../middleware/auth');

// All routes below require a logged-in user
router.use(protect);

router.post('/', applyLeave);
router.get('/my', getMyLeaves);
router.delete('/:id/cancel', cancelLeave);
router.post('/ai/suggest-type', aiSuggestLeaveType);

module.exports = router;
