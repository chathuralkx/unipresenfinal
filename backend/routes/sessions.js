const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { auth } = require('../middleware/auth');

// Session management
router.post('/', auth, sessionController.createSession);
router.get('/', auth, sessionController.getAllSessions);
router.get('/:id', auth, sessionController.getSessionById);

// Attendance
router.post('/mark-attendance', auth, sessionController.markAttendance);
router.get('/:id/attendance', auth, sessionController.getSessionAttendance);
router.get('/student/attendance', auth, sessionController.getStudentAttendance);

module.exports = router;