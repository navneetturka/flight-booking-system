const { query } = require("../config/db");

async function listFlights() {
	try {
		return await query(
			"SELECT id, number, origin, destination, DATE_FORMAT(depart_at, '%Y-%m-%d %H:%i') AS departAt, DATE_FORMAT(arrive_at, '%Y-%m-%d %H:%i') AS arriveAt, price FROM flights ORDER BY id DESC"
		);
	} catch (err) {
		console.error('Error in listFlights:', err.message);
		throw err;
	}
}

async function findById(id) {
	const rows = await query(
		"SELECT id, number, origin, destination, DATE_FORMAT(depart_at, '%Y-%m-%d %H:%i') AS departAt, DATE_FORMAT(arrive_at, '%Y-%m-%d %H:%i') AS arriveAt, price FROM flights WHERE id = :id",
		{ id }
	);
	return rows[0] || null;
}

async function createFlight({ number, origin, destination, departAt, arriveAt, price }) {
	const res = await query(
		"INSERT INTO flights (number, origin, destination, depart_at, arrive_at, price, created_at) VALUES (:number, :origin, :destination, :departAt, :arriveAt, :price, NOW())",
		{ number, origin, destination, departAt, arriveAt, price: Number(price) }
	);
	const rows = await query(
		"SELECT id, number, origin, destination, DATE_FORMAT(depart_at, '%Y-%m-%d %H:%i') AS departAt, DATE_FORMAT(arrive_at, '%Y-%m-%d %H:%i') AS arriveAt, price FROM flights WHERE id = :id",
		{ id: res.insertId }
	);
	return rows[0];
}

async function updateFlight(id, updates) {
	const fields = [];
	const params = { id };
	if (updates.number) { fields.push("number = :number"); params.number = updates.number; }
	if (updates.origin) { fields.push("origin = :origin"); params.origin = updates.origin; }
	if (updates.destination) { fields.push("destination = :destination"); params.destination = updates.destination; }
	if (updates.departAt) { fields.push("depart_at = :departAt"); params.departAt = updates.departAt; }
	if (updates.arriveAt) { fields.push("arrive_at = :arriveAt"); params.arriveAt = updates.arriveAt; }
	if (updates.price) { fields.push("price = :price"); params.price = Number(updates.price); }
	if (!fields.length) {
		return await findById(id);
	}
	await query(`UPDATE flights SET ${fields.join(", ")} WHERE id = :id`, params);
	return await findById(id);
}

async function deleteFlight(id) {
	const res = await query("DELETE FROM flights WHERE id = :id", { id });
	return res.affectedRows > 0;
}

module.exports = { listFlights, findById, createFlight, updateFlight, deleteFlight };



