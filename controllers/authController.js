const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { findByEmail, createUser } = require("../models/userModel");

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const COOKIE_NAME = process.env.JWT_COOKIE_NAME || "token";
const BASE_COOKIE_OPTIONS = {
	httpOnly: true,
	sameSite: "lax",
	secure: process.env.NODE_ENV === "production"
};
const AUTH_COOKIE_OPTIONS = {
	...BASE_COOKIE_OPTIONS,
	maxAge: 1000 * 60 * 60 // 1 hour
};

function buildPayload(user) {
	return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function issueToken(user) {
	return jwt.sign(buildPayload(user), JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function setAuthCookie(res, token) {
	res.cookie(COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
}

exports.showLogin = (req, res) => { res.render("login", { title: "Login" }); };
exports.showRegister = (req, res) => { res.render("register", { title: "Register" }); };

exports.login = async (req, res) => {
	const { email, password, role } = req.body;
    const user = await findByEmail(email);
	if (!user) return res.status(400).render("login", { title: "Login", error: "Invalid credentials" });
	const ok = await bcrypt.compare(password, user.passwordHash);
	if (!ok) return res.status(400).render("login", { title: "Login", error: "Invalid credentials" });
	// Optional: if role selected, ensure it matches stored role
	if (role && role !== user.role) {
		return res.status(400).render("login", { title: "Login", error: "Role does not match account" });
	}
	const token = issueToken(user);
	setAuthCookie(res, token);
	return res.redirect("/");
};

exports.register = async (req, res) => {
	const { name, email, password, role } = req.body;
	if (!name || !email || !password) {
		return res.status(400).render("register", { title: "Register", error: "All fields are required" });
	}
	try {
		const passwordHash = await bcrypt.hash(password, 10);
        const user = await createUser({ name, email, passwordHash, role: role === "admin" ? "admin" : "user" });
		const token = issueToken(user);
		setAuthCookie(res, token);
		return res.redirect("/");
	} catch (e) {
		const msg = e && e.message === "EMAIL_EXISTS" ? "Email already registered" : "Registration failed";
		return res.status(400).render("register", { title: "Register", error: msg });
	}
};

exports.logout = (req, res) => {
	res.clearCookie(COOKIE_NAME, BASE_COOKIE_OPTIONS);
	return res.redirect("/login");
};
