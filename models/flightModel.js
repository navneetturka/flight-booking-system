const { query } = require("../config/db");
const { getRedisClient, redisEnabled } = require("../config/redis");

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
	const cacheKey = "flights:all";
	const ttl = Number(process.env.FLIGHT_CACHE_TTL || 60);
	let redis = null;
	if (redisEnabled) {
		try {
			redis = await getRedisClient();
			if (redis) {
				const cached = await redis.get(cacheKey);
				if (cached) {
					return JSON.parse(cached);
				}
			}
		} catch (err) {
			redis = null;
			console.warn("Redis unavailable for flight cache", err?.message || err);
		}
	}
	const flights = await query(`${selectClause} ORDER BY id DESC`);
	if (redis) {
		try {
			await redis.setEx(cacheKey, ttl, JSON.stringify(flights));
		} catch (err) {
			console.warn("Failed to set flight cache", err?.message || err);
		}
	}
	return flights;
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
	const flight = rows[0];
	await invalidateFlightCache();
	return flight;
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
	const flight = rows[0] || null;
	if (flight) {
		await invalidateFlightCache();
	}
	return flight;
}

async function deleteFlight(id) {
	const rows = await query("DELETE FROM flights WHERE id = $1 RETURNING id", [id]);
	const deleted = rows.length > 0;
	if (deleted) {
		await invalidateFlightCache();
	}
	return deleted;
}

async function invalidateFlightCache() {
	if (!redisEnabled) return;
	try {
		const redis = await getRedisClient();
		if (redis) {
			await redis.del("flights:all");
		}
	} catch (err) {
		console.warn("Failed to invalidate flight cache", err?.message || err);
	}
}

module.exports = { listFlights, findById, createFlight, updateFlight, deleteFlight };