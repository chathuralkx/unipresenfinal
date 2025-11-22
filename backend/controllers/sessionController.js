const db = require('../config/database');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// Create session with QR code
exports.createSession = async (req, res) => {
  try {
    const { title, description, course_code, venue_id, start_time, end_time } = req.body;
    const { userId, role } = req.user;

    // Only lecturers and staff can create sessions
    if (role !== 'lecturer' && role !== 'office_staff' && role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Generate unique QR code
    const qrCode = uuidv4();
    const qrExpiresAt = end_time;

    // Insert session
    const [result] = await db.query(
      `INSERT INTO sessions (title, description, lecturer_id, course_code, venue_id, start_time, end_time, qr_code, qr_expires_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, userId, course_code, venue_id, start_time, end_time, qrCode, qrExpiresAt]
    );

    console.log(`✅ Session created with QR code: ${qrCode}`);

    res.status(201).json({
      message: 'Session created successfully',
      sessionId: result.insertId,
      qrCode: qrCode
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all sessions
exports.getAllSessions = async (req, res) => {
  try {
    const { userId, role } = req.user;
    let query;
    let params = [];

    if (role === 'lecturer' || role === 'office_staff') {
      query = `
        SELECT s.*, u.name as lecturer_name, r.name as venue_name
        FROM sessions s
        JOIN users u ON s.lecturer_id = u.user_id
        LEFT JOIN resources r ON s.venue_id = r.resource_id
        WHERE s.lecturer_id = ?
        ORDER BY s.start_time DESC
      `;
      params = [userId];
    } else if (role === 'admin') {
      query = `
        SELECT s.*, u.name as lecturer_name, r.name as venue_name
        FROM sessions s
        JOIN users u ON s.lecturer_id = u.user_id
        LEFT JOIN resources r ON s.venue_id = r.resource_id
        ORDER BY s.start_time DESC
      `;
    } else {
      // Students see all sessions
      query = `
        SELECT s.*, u.name as lecturer_name, r.name as venue_name,
               a.attendance_id, a.status as attendance_status
        FROM sessions s
        JOIN users u ON s.lecturer_id = u.user_id
        LEFT JOIN resources r ON s.venue_id = r.resource_id
        LEFT JOIN attendance a ON s.session_id = a.session_id AND a.student_id = ?
        ORDER BY s.start_time DESC
      `;
      params = [userId];
    }

    const [sessions] = await db.query(query, params);
    res.json(sessions);
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get session by ID with QR code
exports.getSessionById = async (req, res) => {
  try {
    const { id } = req.params;

    const [sessions] = await db.query(`
      SELECT s.*, u.name as lecturer_name, r.name as venue_name
      FROM sessions s
      JOIN users u ON s.lecturer_id = u.user_id
      LEFT JOIN resources r ON s.venue_id = r.resource_id
      WHERE s.session_id = ?
    `, [id]);

    if (sessions.length === 0) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const session = sessions[0];

    // Generate QR code image
    const qrCodeUrl = await QRCode.toDataURL(session.qr_code);

    res.json({
      ...session,
      qrCodeImage: qrCodeUrl
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark attendance by scanning QR
exports.markAttendance = async (req, res) => {
  try {
    const { qrCode } = req.body;
    const { userId, role } = req.user;

    // Only students can mark attendance
    if (role !== 'student') {
      return res.status(403).json({ message: 'Only students can mark attendance' });
    }

    // Find session by QR code
    const [sessions] = await db.query(
      'SELECT * FROM sessions WHERE qr_code = ?',
      [qrCode]
    );

    if (sessions.length === 0) {
      return res.status(404).json({ message: 'Invalid QR code' });
    }

    const session = sessions[0];

    // Check if session is expired
    if (new Date() > new Date(session.qr_expires_at)) {
      return res.status(400).json({ message: 'Session has ended. Cannot mark attendance.' });
    }

    // Check if already marked
    const [existing] = await db.query(
      'SELECT * FROM attendance WHERE session_id = ? AND student_id = ?',
      [session.session_id, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Attendance already marked for this session' });
    }

    // Determine status (present or late)
    const now = new Date();
    const sessionStart = new Date(session.start_time);
    const lateThreshold = new Date(sessionStart.getTime() + 15 * 60000); // 15 minutes
    const status = now > lateThreshold ? 'late' : 'present';

    // Mark attendance
    await db.query(
      'INSERT INTO attendance (session_id, student_id, status, ip_address) VALUES (?, ?, ?, ?)',
      [session.session_id, userId, status, req.ip]
    );

    console.log(`✅ Attendance marked: Student ${userId} for session ${session.session_id}`);

    res.json({
      message: 'Attendance marked successfully',
      status: status,
      session: {
        title: session.title,
        course_code: session.course_code
      }
    });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get attendance report for a session
exports.getSessionAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;

    // Only lecturers and admin can view reports
    if (role !== 'lecturer' && role !== 'office_staff' && role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const [attendance] = await db.query(`
      SELECT a.*, u.name as student_name, u.email as student_email
      FROM attendance a
      JOIN users u ON a.student_id = u.user_id
      WHERE a.session_id = ?
      ORDER BY a.marked_at
    `, [id]);

    res.json(attendance);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get student's attendance history
exports.getStudentAttendance = async (req, res) => {
  try {
    const { userId } = req.user;

    const [attendance] = await db.query(`
      SELECT a.*, s.title, s.course_code, s.start_time, u.name as lecturer_name
      FROM attendance a
      JOIN sessions s ON a.session_id = s.session_id
      JOIN users u ON s.lecturer_id = u.user_id
      WHERE a.student_id = ?
      ORDER BY s.start_time DESC
    `, [userId]);

    res.json(attendance);
  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};