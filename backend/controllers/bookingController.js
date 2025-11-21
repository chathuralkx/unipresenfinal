const db = require('../config/database');

// Get all bookings
exports.getAllBookings = async (req, res) => {
  try {
    const { userId, role } = req.user;
    let query;
    let params = [];

    // Admin and office_staff can see all bookings
    if (role === 'admin' || role === 'office_staff') {
      query = `
        SELECT b.*, r.name as resource_name, r.type as resource_type, 
               u.name as user_name, u.email as user_email
        FROM bookings b
        JOIN resources r ON b.resource_id = r.resource_id
        JOIN users u ON b.user_id = u.user_id
        ORDER BY b.created_at DESC
      `;
    } else {
      // Students and lecturers see only their bookings
      query = `
        SELECT b.*, r.name as resource_name, r.type as resource_type
        FROM bookings b
        JOIN resources r ON b.resource_id = r.resource_id
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
      `;
      params = [userId];
    }

    const [bookings] = await db.query(query, params);
    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get single booking
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;

    const [bookings] = await db.query(`
      SELECT b.*, r.name as resource_name, r.type as resource_type,
             u.name as user_name, u.email as user_email
      FROM bookings b
      JOIN resources r ON b.resource_id = r.resource_id
      JOIN users u ON b.user_id = u.user_id
      WHERE b.booking_id = ?
    `, [id]);

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookings[0];

    // Check authorization
    if (role !== 'admin' && role !== 'office_staff' && booking.user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create new booking
exports.createBooking = async (req, res) => {
  try {
    const { resource_id, start_time, end_time, purpose } = req.body;
    const { userId } = req.user;

    // Validation
    if (!resource_id || !start_time || !end_time) {
      return res.status(400).json({ 
        message: 'Please provide resource_id, start_time, and end_time' 
      });
    }

    // Check if resource exists and is available
    const [resources] = await db.query(
      'SELECT * FROM resources WHERE resource_id = ?',
      [resource_id]
    );

    if (resources.length === 0) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (!resources[0].availability) {
      return res.status(400).json({ message: 'Resource is not available for booking' });
    }

    // Check for conflicting bookings
    const [conflicts] = await db.query(`
      SELECT * FROM bookings 
      WHERE resource_id = ? 
        AND status = 'approved'
        AND (
          (start_time <= ? AND end_time > ?) OR
          (start_time < ? AND end_time >= ?) OR
          (start_time >= ? AND end_time <= ?)
        )
    `, [resource_id, start_time, start_time, end_time, end_time, start_time, end_time]);

    if (conflicts.length > 0) {
      return res.status(400).json({ 
        message: 'This time slot is already booked. Please choose a different time.' 
      });
    }

    // Create booking
    const [result] = await db.query(
      `INSERT INTO bookings (user_id, resource_id, start_time, end_time, purpose, status) 
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [userId, resource_id, start_time, end_time, purpose || null]
    );

    console.log(`✅ Booking created: ID ${result.insertId} for resource ${resource_id}`);

    res.status(201).json({
      message: 'Booking created successfully. Awaiting approval.',
      bookingId: result.insertId
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update booking
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time, purpose } = req.body;
    const { userId, role } = req.user;

    // Check if booking exists
    const [existing] = await db.query('SELECT * FROM bookings WHERE booking_id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = existing[0];

    // Only booking owner can update (and only if pending)
    if (booking.user_id !== userId && role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Can only update pending bookings' 
      });
    }

    // Check for conflicts if time is being changed
    if (start_time || end_time) {
      const newStart = start_time || booking.start_time;
      const newEnd = end_time || booking.end_time;

      const [conflicts] = await db.query(`
        SELECT * FROM bookings 
        WHERE resource_id = ? 
          AND booking_id != ?
          AND status = 'approved'
          AND (
            (start_time <= ? AND end_time > ?) OR
            (start_time < ? AND end_time >= ?) OR
            (start_time >= ? AND end_time <= ?)
          )
      `, [booking.resource_id, id, newStart, newStart, newEnd, newEnd, newStart, newEnd]);

      if (conflicts.length > 0) {
        return res.status(400).json({ 
          message: 'This time slot is already booked' 
        });
      }
    }

    // Update booking
    await db.query(
      `UPDATE bookings 
       SET start_time = ?, end_time = ?, purpose = ?
       WHERE booking_id = ?`,
      [
        start_time || booking.start_time,
        end_time || booking.end_time,
        purpose !== undefined ? purpose : booking.purpose,
        id
      ]
    );

    console.log(`✅ Booking updated: ID ${id}`);

    res.json({ message: 'Booking updated successfully' });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Approve booking (admin/office_staff only)
exports.approveBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;

    if (role !== 'admin' && role !== 'office_staff') {
      return res.status(403).json({ message: 'Not authorized to approve bookings' });
    }

    const [existing] = await db.query('SELECT * FROM bookings WHERE booking_id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await db.query(
      'UPDATE bookings SET status = ? WHERE booking_id = ?',
      ['approved', id]
    );

    console.log(`✅ Booking approved: ID ${id}`);

    res.json({ message: 'Booking approved successfully' });
  } catch (error) {
    console.error('Approve booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reject booking (admin/office_staff only)
exports.rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;
    const { reason } = req.body;

    if (role !== 'admin' && role !== 'office_staff') {
      return res.status(403).json({ message: 'Not authorized to reject bookings' });
    }

    const [existing] = await db.query('SELECT * FROM bookings WHERE booking_id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await db.query(
      'UPDATE bookings SET status = ?, notes = ? WHERE booking_id = ?',
      ['rejected', reason || 'Rejected by staff', id]
    );

    console.log(`✅ Booking rejected: ID ${id}`);

    res.json({ message: 'Booking rejected successfully' });
  } catch (error) {
    console.error('Reject booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;

    const [existing] = await db.query('SELECT * FROM bookings WHERE booking_id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = existing[0];

    // Only booking owner or admin can cancel
    if (booking.user_id !== userId && role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    await db.query(
      'UPDATE bookings SET status = ? WHERE booking_id = ?',
      ['cancelled', id]
    );

    console.log(`✅ Booking cancelled: ID ${id}`);

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete booking (admin only)
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;

    if (role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete bookings' });
    }

    const [existing] = await db.query('SELECT * FROM bookings WHERE booking_id = ?', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await db.query('DELETE FROM bookings WHERE booking_id = ?', [id]);

    console.log(`✅ Booking deleted: ID ${id}`);

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};