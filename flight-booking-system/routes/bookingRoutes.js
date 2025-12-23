const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/authMiddleware");
const { bookFlight, cancelBooking, listMyBookings, listAllBookings } = require("../controllers/bookingController");

// Protect all booking routes
router.use(requireAuth);

// User actions
router.post("/bookings", bookFlight);
router.get("/bookings", listMyBookings);
router.delete("/bookings/:id", cancelBooking);

// Admin only
router.get("/bookings/all", requireRole("admin"), listAllBookings);

module.exports = router;



