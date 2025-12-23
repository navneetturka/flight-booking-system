const mysql = require("mysql2/promise");

let pool;

function getPool() {
	if (pool) return pool;
	pool = mysql.createPool({
		host: process.env.MYSQL_HOST || "127.0.0.1",
		port: Number(process.env.MYSQL_PORT || 3306),
		user: process.env.MYSQL_USER || "root",
		password: process.env.MYSQL_PASSWORD || "Navroot",
		database: process.env.MYSQL_DATABASE || "flight_booking",
		connectionLimit: 10,
		namedPlaceholders: true,
		connectTimeout: 10000, // 10 seconds timeout
		acquireTimeout: 10000,
		timeout: 10000
	});
	return pool;
}

async function query(sql, params = {}) {
	let conn;
	try {
		conn = await getPool().getConnection();
		const [rows] = await conn.execute(sql, params);
		return rows;
	} catch (err) {
		console.error('Database query error:', err.message);
		throw err;
	} finally {
		if (conn) conn.release();
	}
}

module.exports = { getPool, query };


