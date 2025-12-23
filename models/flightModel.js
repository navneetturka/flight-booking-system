const { query } = require("../config/db");

// Check if a flight exists in the database (no fallback)
async function flightExists(id) {
	try {
		const rows = await query("SELECT id FROM flights WHERE id = :id LIMIT 1", { id });
		return rows.length > 0;
	} catch (err) {
		console.warn("flightExists lookup failed:", err.message);
		return false;
	}
}

async function listFlights() {
	try {
		// Include class-specific prices and real-time remaining seats
		return await query(
			"SELECT " +
			"  f.id, " +
			"  f.number, " +
			"  f.origin, " +
			"  f.destination, " +
			"  DATE_FORMAT(f.depart_at, '%Y-%m-%d %H:%i') AS departAt, " +
			"  DATE_FORMAT(f.arrive_at, '%Y-%m-%d %H:%i') AS arriveAt, " +
			"  f.price AS price, " +
			"  f.business_price AS businessPrice, " +
			"  f.first_price AS firstPrice " +
			"FROM flights f " +
			"ORDER BY f.id DESC"
		);
	} catch (err) {
		console.error('Error in listFlights (full columns):', err.message);
		// Retry with minimal required columns so UI still shows DB flights even if optional columns are absent.
		try {
			return await query(
				"SELECT " +
				"  f.id, " +
				"  f.number, " +
				"  f.origin, " +
				"  f.destination, " +
				"  DATE_FORMAT(f.depart_at, '%Y-%m-%d %H:%i') AS departAt, " +
				"  DATE_FORMAT(f.arrive_at, '%Y-%m-%d %H:%i') AS arriveAt, " +
				"  f.price AS price " +
				"FROM flights f " +
				"ORDER BY f.id DESC"
			);
		} catch (err2) {
			console.error('Error in listFlights (minimal columns):', err2.message);
			return [];
		}
	}
}

async function findById(id) {
	try {
		const rows = await query(
			"SELECT " +
			"  f.id, " +
			"  f.number, " +
			"  f.origin, " +
			"  f.destination, " +
			"  DATE_FORMAT(f.depart_at, '%Y-%m-%d %H:%i') AS departAt, " +
			"  DATE_FORMAT(f.arrive_at, '%Y-%m-%d %H:%i') AS arriveAt, " +
			"  f.price AS price, " +
			"  f.business_price AS businessPrice, " +
			"  f.first_price AS firstPrice " +
			"FROM flights f " +
			"WHERE f.id = :id",
			{ id }
		);
		return rows[0] || null;
	} catch (err) {
		console.error('Error in findById (full columns):', err.message);
		try {
			const rows = await query(
				"SELECT " +
				"  f.id, " +
				"  f.number, " +
				"  f.origin, " +
				"  f.destination, " +
				"  DATE_FORMAT(f.depart_at, '%Y-%m-%d %H:%i') AS departAt, " +
				"  DATE_FORMAT(f.arrive_at, '%Y-%m-%d %H:%i') AS arriveAt, " +
				"  f.price AS price " +
				"FROM flights f " +
				"WHERE f.id = :id",
				{ id }
			);
			return rows[0] || null;
		} catch (err2) {
			console.error('Error in findById (minimal columns):', err2.message);
			return null;
		}
	}
}

async function createFlight({ number, origin, destination, departAt, arriveAt, price, businessPrice, firstPrice }) {
	const basePrice = Number(price);
	// Try full insert (with optional class pricing). If columns don't exist, fall back to minimal insert.
	try {
		const res = await query(
			"INSERT INTO flights (number, origin, destination, depart_at, arrive_at, price, business_price, first_price, created_at) " +
			"VALUES (:number, :origin, :destination, :departAt, :arriveAt, :price, :businessPrice, :firstPrice, NOW())",
			{ 
				number, 
				origin, 
				destination, 
				departAt, 
				arriveAt, 
				price: basePrice,
				businessPrice: businessPrice ? Number(businessPrice) : null,
				firstPrice: firstPrice ? Number(firstPrice) : null
			}
		);
		const rows = await query(
			"SELECT id, number, origin, destination, DATE_FORMAT(depart_at, '%Y-%m-%d %H:%i') AS departAt, DATE_FORMAT(arrive_at, '%Y-%m-%d %H:%i') AS arriveAt, price, business_price AS businessPrice, first_price AS firstPrice FROM flights WHERE id = :id",
			{ id: res.insertId }
		);
		return rows[0];
	} catch (err) {
		// Likely missing optional columns; try minimal insert
		console.warn("createFlight fallback (minimal columns):", err.message);
		const res = await query(
			"INSERT INTO flights (number, origin, destination, depart_at, arrive_at, price, created_at) " +
			"VALUES (:number, :origin, :destination, :departAt, :arriveAt, :price, NOW())",
			{ number, origin, destination, departAt, arriveAt, price: basePrice }
		);
		const rows = await query(
			"SELECT id, number, origin, destination, DATE_FORMAT(depart_at, '%Y-%m-%d %H:%i') AS departAt, DATE_FORMAT(arrive_at, '%Y-%m-%d %H:%i') AS arriveAt, price FROM flights WHERE id = :id",
			{ id: res.insertId }
		);
		return rows[0];
	}
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
	if (updates.businessPrice) { fields.push("business_price = :businessPrice"); params.businessPrice = Number(updates.businessPrice); }
	if (updates.firstPrice) { fields.push("first_price = :firstPrice"); params.firstPrice = Number(updates.firstPrice); }
	if (!fields.length) {
		return await findById(id);
	}
	try {
		await query(`UPDATE flights SET ${fields.join(", ")} WHERE id = :id`, params);
		return await findById(id);
	} catch (err) {
		// If optional columns are missing, retry with only the base fields
		console.warn("updateFlight fallback (base columns):", err.message);
		const baseFields = [];
		const baseParams = { id };
		if (updates.number) { baseFields.push("number = :number"); baseParams.number = updates.number; }
		if (updates.origin) { baseFields.push("origin = :origin"); baseParams.origin = updates.origin; }
		if (updates.destination) { baseFields.push("destination = :destination"); baseParams.destination = updates.destination; }
		if (updates.departAt) { baseFields.push("depart_at = :departAt"); baseParams.departAt = updates.departAt; }
		if (updates.arriveAt) { baseFields.push("arrive_at = :arriveAt"); baseParams.arriveAt = updates.arriveAt; }
		if (updates.price) { baseFields.push("price = :price"); baseParams.price = Number(updates.price); }
		if (!baseFields.length) return await findById(id);
		await query(`UPDATE flights SET ${baseFields.join(", ")} WHERE id = :id`, baseParams);
		return await findById(id);
	}
}

async function deleteFlight(id) {
	try {
		const res = await query("DELETE FROM flights WHERE id = :id", { id });
		return res.affectedRows > 0;
	} catch (err) {
		console.error("Error deleting flight:", err.message);
		// Likely FK constraint (bookings reference flight). Surface false so controller can respond gracefully.
		return false;
	}
}

module.exports = { listFlights, findById, createFlight, updateFlight, deleteFlight, flightExists };



