const { createBooking, deleteBooking, listBookingsByUser, listBookings } = require("../models/bookingModel");
const { emit } = require("../realtime/socketHub");

exports.listMyBookings = async (req, res) => {
    const rows = await listBookingsByUser(req.user.id);
    res.render("bookings", { title: "My Bookings", bookings: rows, user: req.user });
};

exports.bookFlight = async (req, res) => {
	const { flightId } = req.body;
	if (!flightId) return res.status(400).send("Missing flightId");
    const booking = await createBooking({ userId: req.user.id, flightId });
	emit("BOOKING_CREATED", { bookingId: booking?.id || null, userId: req.user.id, flightId });
	return res.redirect("/bookings");
};

exports.cancelBooking = async (req, res) => {
	const { id } = req.params;
    const ok = await deleteBooking(id, req.user.id);
	if (!ok) return res.status(404).send("Not found");
	emit("BOOKING_CANCELLED", { bookingId: id, userId: req.user.id });
	return res.redirect("/bookings");
};


exports.listAllBookings = async (req, res) => {
    const rows = await listBookings();
	res.render("bookings", { title: "All Bookings", bookings: rows, user: req.user });
};


