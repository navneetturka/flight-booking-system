const { query } = require("../config/db");

const baseSelect = `
	SELECT 
		id, 
		name, 
		email, 
		password_hash AS "passwordHash", 
		role, 
		created_at AS "createdAt"
	FROM users
`;

async function findByEmail(email) {
	const rows = await query(
		`${baseSelect} WHERE LOWER(email) = LOWER($1) LIMIT 1`,
		[email]
	);
	return rows[0] || null;
}

async function createUser({ name, email, passwordHash, role = "user" }) {
	const exists = await query("SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1", [email]);
	if (exists.length) throw new Error("EMAIL_EXISTS");
	const inserted = await query(
		`INSERT INTO users (name, email, password_hash, role, created_at)
		 VALUES ($1, $2, $3, $4, NOW())
		 RETURNING id, name, email, password_hash AS "passwordHash", role, created_at AS "createdAt"`,
		[name, email, passwordHash, role]
	);
	return inserted[0];
}

module.exports = { findByEmail, createUser };


