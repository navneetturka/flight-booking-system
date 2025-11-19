const { query } = require("../config/db");

const selectBase = `
	SELECT 
		id, 
		user_id AS "userId", 
		flight_id AS "flightId", 
		TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') AS "createdAt"
	FROM bookings
`;

async function listBookings() {
	return await query(`${selectBase} ORDER BY id DESC`);
}

async function listBookingsByUser(userId) {
	return await query(`${selectBase} WHERE user_id = $1 ORDER BY id DESC`, [userId]);
}

async function createBooking({ userId, flightId }) {
	const rows = await query(
		`INSERT INTO bookings (user_id, flight_id, created_at)
		 VALUES ($1, $2, NOW())
		 RETURNING id, user_id AS "userId", flight_id AS "flightId", TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI') AS "createdAt"`,
		[userId, flightId]
	);
	return rows[0];
}

async function deleteBooking(id, userId) {
	const rows = await query("DELETE FROM bookings WHERE id = $1 AND user_id = $2 RETURNING id", [id, userId]);
	return rows.length > 0;
}

module.exports = { listBookings, listBookingsByUser, createBooking, deleteBooking };