const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const { bookFlight, cancelBooking, cancelBookingAdmin, listMyBookings, listAllBookings, showTicket, showTicketAdmin } = require("../controllers/bookingController");

// Protect all booking routes
router.use(requireAuth);

// User actions
router.post("/bookings", express.json(), bookFlight);
router.get("/bookings", listMyBookings);
router.get("/bookings/:id/ticket", showTicket);
router.delete("/bookings/:id", cancelBooking);

// Admin only
router.get("/bookings/all", requireRole("admin"), listAllBookings);
router.get("/bookings/admin/:id/ticket", requireRole("admin"), showTicketAdmin);
router.delete("/bookings/admin/:id", requireRole("admin"), cancelBookingAdmin);

module.exports = router;



