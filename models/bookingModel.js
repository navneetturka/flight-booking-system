const { query } = require("../config/db");

async function listBookings() {
	const rows = await query(
		"SELECT id, user_id AS userId, flight_id AS flightId, passengers, created_at AS createdAt FROM bookings ORDER BY id DESC"
	);
	// Parse passengers JSON
	return rows.map(row => {
		if (row.passengers) {
			try {
				row.passengers = JSON.parse(row.passengers);
			} catch (e) {
				row.passengers = null;
			}
		}
		return row;
	});
}

async function listBookingsByUser(userId) {
	const rows = await query(
		"SELECT id, user_id AS userId, flight_id AS flightId, passengers, created_at AS createdAt FROM bookings WHERE user_id = :userId ORDER BY id DESC",
		{ userId }
	);
	// Parse passengers JSON
	return rows.map(row => {
		if (row.passengers) {
			try {
				row.passengers = JSON.parse(row.passengers);
			} catch (e) {
				row.passengers = null;
			}
		}
		return row;
	});
}

async function createBooking({ userId, flightId, passengers }) {
	// Store passengers as JSON if provided
	const passengersJson = passengers ? JSON.stringify(passengers) : null;
	
	const res = await query(
		"INSERT INTO bookings (user_id, flight_id, passengers, created_at) VALUES (:userId, :flightId, :passengers, NOW())",
		{ userId, flightId, passengers: passengersJson }
	);
	const rows = await query(
		"SELECT id, user_id AS userId, flight_id AS flightId, passengers, created_at AS createdAt FROM bookings WHERE id = :id",
		{ id: res.insertId }
	);
	if (rows[0] && rows[0].passengers) {
		try {
			rows[0].passengers = JSON.parse(rows[0].passengers);
		} catch (e) {
			rows[0].passengers = null;
		}
	}
	return rows[0];
}

async function getBookingById(id, userId) {
	const rows = await query(
		"SELECT id, user_id AS userId, flight_id AS flightId, passengers, created_at AS createdAt FROM bookings WHERE id = :id AND user_id = :userId",
		{ id, userId }
	);
	if (rows[0] && rows[0].passengers) {
		try {
			rows[0].passengers = JSON.parse(rows[0].passengers);
		} catch (e) {
			rows[0].passengers = null;
		}
	}
	return rows[0] || null;
}

async function deleteBooking(id, userId) {
	const res = await query("DELETE FROM bookings WHERE id = :id AND user_id = :userId", { id, userId });
	return res.affectedRows > 0;
}

// Admin helpers (no user restriction)
async function getBookingByIdAny(id) {
	const rows = await query(
		"SELECT id, user_id AS userId, flight_id AS flightId, passengers, created_at AS createdAt FROM bookings WHERE id = :id",
		{ id }
	);
	if (rows[0] && rows[0].passengers) {
		try {
			rows[0].passengers = JSON.parse(rows[0].passengers);
		} catch (e) {
			rows[0].passengers = null;
		}
	}
	return rows[0] || null;
}

async function deleteBookingAny(id) {
	const res = await query("DELETE FROM bookings WHERE id = :id", { id });
	return res.affectedRows > 0;
}

module.exports = { listBookings, listBookingsByUser, createBooking, deleteBooking, getBookingById, getBookingByIdAny, deleteBookingAny };



