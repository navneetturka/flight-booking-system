function requireAuth(req, res, next) {
	if (req.session && req.session.user) return next();
	return res.redirect("/login");
}

function requireRole(role) {
	return (req, res, next) => {
		if (req.session && req.session.user && req.session.user.role === role) return next();
		return res.status(403).send("Forbidden");
	};
}

module.exports = { requireAuth, requireRole };


