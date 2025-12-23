const { createBooking, deleteBooking, listBookingsByUser, listBookings, getBookingById, getBookingByIdAny, deleteBookingAny } = require("../models/bookingModel");
const { findById, flightExists } = require("../models/flightModel");
const { sendBookingConfirmation } = require("../utils/notifications");

exports.listMyBookings = async (req, res) => {
    const rows = await listBookingsByUser(req.session.user.id);
    res.render("bookings", { title: "My Bookings", bookings: rows, user: req.session.user });
};

exports.bookFlight = async (req, res) => {
	const { flightId, passengers } = req.body;
	if (!flightId) return res.status(400).json({ error: "Missing flightId" });
	if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
		return res.status(400).json({ error: "At least one passenger is required" });
	}

	try {
		// Ensure the flight exists in the DB (avoid FK errors)
		const exists = await flightExists(flightId);
		if (!exists) {
			return res.status(400).json({ error: "Flight not available in the database. Please refresh the page." });
		}

		// Persist booking with passenger data
		const booking = await createBooking({ userId: req.session.user.id, flightId, passengers });
		
		// Get flight details for notifications
		const flight = await findById(flightId);
		
		// Send notifications to primary passenger (first passenger)
		if (passengers && passengers.length > 0 && flight) {
			const primaryPassenger = passengers[0];
			try {
				const notificationResults = await sendBookingConfirmation(
					primaryPassenger,
					booking,
					flight
				);
				// Log notification summary
				const successful = Object.values(notificationResults).filter(r => r.success).length;
				const total = Object.values(notificationResults).filter(r => r.message).length;
				console.log(`📧 Booking notifications: ${successful}/${total} sent successfully`);
				console.log('   Email:', notificationResults.email.success ? '✅' : '❌');
				console.log('   SMS:', notificationResults.sms.success ? '✅' : '❌');
				console.log('   WhatsApp:', notificationResults.whatsapp.success ? '✅' : '❌');
			} catch (notifErr) {
				console.error('Notification error (non-fatal):', notifErr);
				// Don't fail the booking if notifications fail
			}
		}
		
		// Emit real-time notification
		try {
			const io = req.app.get('io');
			if (io) {
				const userRoom = `user:${req.session.user.id}`;
				const adminRoom = 'admins';
				const payload = {
					title: 'Booking Confirmed! ✈️',
					message: `Your flight ${flight?.number || flightId} is confirmed. Check your email/SMS for details.`,
					type: 'success',
					booking
				};
				io.to(userRoom).emit('notification', payload);
				io.to(adminRoom).emit('notification', payload);
			}
		} catch (err) {
			console.warn('Failed to emit booking notification', err);
		}

		return res.json({ success: true, booking });
	} catch (err) {
		console.error('Booking error:', err);
		const isFk = err && err.code && err.code.startsWith('ER_NO_REFERENCED_ROW');
		return res.status(isFk ? 400 : 500).json({ error: isFk ? "Flight not available in the database. Please refresh the page." : ("Booking failed: " + err.message) });
	}
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

// Admin cancel (no user restriction)
exports.cancelBookingAdmin = async (req, res) => {
	const { id } = req.params;
    const ok = await deleteBookingAny(id);
	if (!ok) return res.status(404).send("Not found");
	return res.redirect("/bookings/all");
};


exports.listAllBookings = async (req, res) => {
    const rows = await listBookings();
	// Get flight details for each booking
	const bookingsWithFlights = await Promise.all(rows.map(async (booking) => {
		const flight = await findById(booking.flightId);
		return { ...booking, flight };
	}));
	res.render("bookings", { title: "All Bookings", bookings: bookingsWithFlights, user: req.session.user });
};

exports.showTicket = async (req, res) => {
	const { id } = req.params;
	const booking = await getBookingById(id, req.session.user.id);
	if (!booking) return res.status(404).send("Booking not found");

	const flight = await findById(booking.flightId);
	if (!flight) return res.status(404).send("Flight not found");

	res.render("ticket", { 
		title: "Ticket", 
		booking, 
		flight, 
		user: req.session.user 
	});
};

// Admin ticket (no user restriction)
exports.showTicketAdmin = async (req, res) => {
	const { id } = req.params;
	const booking = await getBookingByIdAny(id);
	if (!booking) return res.status(404).send("Booking not found");

	const flight = await findById(booking.flightId);
	if (!flight) return res.status(404).send("Flight not found");

	res.render("ticket", { 
		title: "Ticket", 
		booking, 
		flight, 
		user: req.session.user 
	});
};


