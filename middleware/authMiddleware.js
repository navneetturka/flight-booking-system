const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";
const COOKIE_NAME = process.env.JWT_COOKIE_NAME || "token";

function getTokenFromRequest(req) {
	const authHeader = req.headers.authorization;
	if (authHeader && authHeader.startsWith("Bearer ")) {
		return authHeader.slice(7);
	}
	if (req.cookies && req.cookies[COOKIE_NAME]) {
		return req.cookies[COOKIE_NAME];
	}
	return null;
}

function attachUser(req, res, next) {
	const token = getTokenFromRequest(req);
	if (!token) {
		req.user = null;
		res.locals.user = null;
		return next();
	}
	try {
		const payload = jwt.verify(token, JWT_SECRET);
		req.user = payload;
		res.locals.user = payload;
	} catch (err) {
		req.user = null;
		res.locals.user = null;
	}
	return next();
}

function requireAuth(req, res, next) {
	if (req.user) return next();
	return res.redirect("/login");
}

function requireRole(role) {
	return (req, res, next) => {
		if (req.user && req.user.role === role) return next();
		return res.status(403).send("Forbidden");
	};
}

module.exports = { attachUser, requireAuth, requireRole };
