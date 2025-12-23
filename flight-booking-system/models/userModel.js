const { query } = require("../config/db");

async function findByEmail(email) {
	const rows = await query(
		"SELECT id, name, email, password_hash AS passwordHash, role, created_at AS createdAt FROM users WHERE LOWER(email) = LOWER(:email) LIMIT 1",
		{ email }
	);
	return rows[0] || null;
}

async function createUser({ name, email, passwordHash, role = "user" }) {
	const exists = await query("SELECT id FROM users WHERE LOWER(email) = LOWER(:email) LIMIT 1", { email });
	if (exists.length) throw new Error("EMAIL_EXISTS");
	const res = await query(
		"INSERT INTO users (name, email, password_hash, role, created_at) VALUES (:name, :email, :passwordHash, :role, NOW())",
		{ name, email, passwordHash, role }
	);
	const inserted = await query(
		"SELECT id, name, email, password_hash AS passwordHash, role, created_at AS createdAt FROM users WHERE id = :id",
		{ id: res.insertId }
	);
	return inserted[0];
}

module.exports = { findByEmail, createUser };


