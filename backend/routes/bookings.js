const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { auth } = require('../middleware/auth');

// All routes require authentication
router.get('/', auth, bookingController.getAllBookings);
router.get('/:id', auth, bookingController.getBookingById);
router.post('/', auth, bookingController.createBooking);
router.put('/:id', auth, bookingController.updateBooking);
router.delete('/:id', auth, bookingController.deleteBooking);

// Approval routes (admin/office_staff only)
router.put('/:id/approve', auth, bookingController.approveBooking);
router.put('/:id/reject', auth, bookingController.rejectBooking);
router.put('/:id/cancel', auth, bookingController.cancelBooking);

module.exports = router;