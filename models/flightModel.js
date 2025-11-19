const { query } = require("../config/db");

const selectClause = `
	SELECT 
		id,
		number,
		origin,
		destination,
		TO_CHAR(depart_at, 'YYYY-MM-DD HH24:MI') AS "departAt",
		TO_CHAR(arrive_at, 'YYYY-MM-DD HH24:MI') AS "arriveAt",
		price
	FROM flights
`;

async function listFlights() {
	return await query(`${selectClause} ORDER BY id DESC`);
}

async function findById(id) {
	const rows = await query(`${selectClause} WHERE id = $1`, [id]);
	return rows[0] || null;
}

async function createFlight({ number, origin, destination, departAt, arriveAt, price }) {
	const rows = await query(
		`INSERT INTO flights (number, origin, destination, depart_at, arrive_at, price, created_at)
		 VALUES ($1, $2, $3, $4, $5, $6, NOW())
		 RETURNING id, number, origin, destination,
			TO_CHAR(depart_at, 'YYYY-MM-DD HH24:MI') AS "departAt",
			TO_CHAR(arrive_at, 'YYYY-MM-DD HH24:MI') AS "arriveAt",
			price`,
		[number, origin, destination, departAt, arriveAt, Number(price)]
	);
	return rows[0];
}

async function updateFlight(id, updates) {
	const fields = [];
	const values = [];
	let idx = 1;
	if (updates.number) { fields.push(`number = $${idx++}`); values.push(updates.number); }
	if (updates.origin) { fields.push(`origin = $${idx++}`); values.push(updates.origin); }
	if (updates.destination) { fields.push(`destination = $${idx++}`); values.push(updates.destination); }
	if (updates.departAt) { fields.push(`depart_at = $${idx++}`); values.push(updates.departAt); }
	if (updates.arriveAt) { fields.push(`arrive_at = $${idx++}`); values.push(updates.arriveAt); }
	if (updates.price) { fields.push(`price = $${idx++}`); values.push(Number(updates.price)); }
	if (!fields.length) {
		return await findById(id);
	}
	values.push(id);
	const rows = await query(
		`UPDATE flights SET ${fields.join(", ")} WHERE id = $${idx} RETURNING 
			id,
			number,
			origin,
			destination,
			TO_CHAR(depart_at, 'YYYY-MM-DD HH24:MI') AS "departAt",
			TO_CHAR(arrive_at, 'YYYY-MM-DD HH24:MI') AS "arriveAt",
			price`,
		values
	);
	return rows[0] || null;
}

async function deleteFlight(id) {
	const rows = await query("DELETE FROM flights WHERE id = $1 RETURNING id", [id]);
	return rows.length > 0;
}

module.exports = { listFlights, findById, createFlight, updateFlight, deleteFlight };