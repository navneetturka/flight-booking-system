const express = require("express");
const router = express.Router();
const { getFlights, createFlight, updateFlight, deleteFlight } = require("../controllers/flightController");
const { requireAuth, requireRole } = require("../middleware/authMiddleware");

router.get("/flights", requireAuth, getFlights);

// Admin-only CRUD
router.post("/flights", requireAuth, requireRole("admin"), createFlight);
router.post("/flights/:id", requireAuth, requireRole("admin"), updateFlight);
router.post("/flights/:id/delete", requireAuth, requireRole("admin"), deleteFlight);

module.exports = router;


