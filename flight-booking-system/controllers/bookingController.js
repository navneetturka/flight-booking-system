const { createBooking, deleteBooking, listBookingsByUser, listBookings } = require("../models/bookingModel");

exports.listMyBookings = async (req, res) => {
    const rows = await listBookingsByUser(req.session.user.id);
    res.render("bookings", { title: "My Bookings", bookings: rows, user: req.session.user });
};

exports.bookFlight = async (req, res) => {
	const { flightId } = req.body;
	if (!flightId) return res.status(400).send("Missing flightId");
	// Persist booking and emit a real-time notification
	const booking = await createBooking({ userId: req.session.user.id, flightId });
	try {
		const io = req.app.get('io');
		if (io) {
			// Notify only the booking user and admins
			const userRoom = `user:${req.session.user.id}`;
			const adminRoom = 'admins';
			const payload = {
				title: 'New booking',
				message: `${req.session.user.email || 'User ' + req.session.user.id} booked flight ${flightId}`,
				type: 'success',
				booking
			};
			io.to(userRoom).emit('notification', payload);
			io.to(adminRoom).emit('notification', payload);
		}
	} catch (err) {
		console.warn('Failed to emit booking notification', err);
	}

	return res.redirect("/bookings");
};

exports.cancelBooking = async (req, res) => {
	const { id } = req.params;
    const ok = await deleteBooking(id, req.session.user.id);
	if (!ok) return res.status(404).send("Not found");

	try {
		const io = req.app.get('io');
		if (io) {
			const userRoom = `user:${req.session.user.id}`;
			const adminRoom = 'admins';
			const payload = {
				title: 'Booking cancelled',
				message: `${req.session.user.email || 'User ' + req.session.user.id} cancelled booking ${id}`,
				type: 'info',
				bookingId: id
			};
			io.to(userRoom).emit('notification', payload);
			io.to(adminRoom).emit('notification', payload);
		}
	} catch (err) {
		console.warn('Failed to emit cancel notification', err);
	}

	return res.redirect("/bookings");
};


exports.listAllBookings = async (req, res) => {
    const rows = await listBookings();
	res.render("bookings", { title: "All Bookings", bookings: rows, user: req.session.user });
};


