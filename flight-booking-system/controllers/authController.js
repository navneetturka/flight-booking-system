const bcrypt = require("bcrypt");
const { findByEmail, createUser } = require("../models/userModel");

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
    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
	return res.redirect("/");
};

exports.register = async (req, res) => {
	const { name, email, password, role } = req.body;
	if (!name || !email || !password) {
		return res.status(400).render("register", { title: "Register", error: "All fields are required", name, email, role });
	}
	try {
		const passwordHash = await bcrypt.hash(password, 10);
        const user = await createUser({ name, email, passwordHash, role: role === "admin" ? "admin" : "user" });
        req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
		return res.redirect("/");
	} catch (e) {
		const msg = e && e.message === "EMAIL_EXISTS" ? "Email already registered" : "Registration failed";
		return res.status(400).render("register", { title: "Register", error: msg, name, email, role });
	}
};

exports.logout = (req, res) => {
	if (req.session) req.session.destroy(() => res.redirect("/login"));
	else res.redirect("/login");
};
