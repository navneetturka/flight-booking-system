const { Pool } = require("pg");

let pool;

function resolveConfig() {
	if (process.env.DATABASE_URL) {
		return {
			connectionString: process.env.DATABASE_URL,
			ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined
		};
	}
	return {
		host: process.env.PGHOST || process.env.POSTGRES_HOST || "127.0.0.1",
		port: Number(process.env.PGPORT || process.env.POSTGRES_PORT || 5432),
		user: process.env.PGUSER || process.env.POSTGRES_USER || "postgres",
		password: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || "postgres",
		database: process.env.PGDATABASE || process.env.POSTGRES_DB || "flight_booking",
		ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : undefined,
		max: Number(process.env.PG_POOL_MAX || 10)
	};
}

function getPool() {
	if (pool) return pool;
	pool = new Pool(resolveConfig());
	pool.on("error", (err) => {
		console.error("PostgreSQL pool error", err);
	});
	return pool;
}

async function query(text, params = []) {
	const client = await getPool().connect();
	try {
		const result = await client.query(text, params);
		return result.rows;
	} finally {
		client.release();
	}
}

module.exports = { getPool, query };


