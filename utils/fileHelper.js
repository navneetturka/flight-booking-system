const fs = require("fs");
const path = require("path");

function ensureAbsolute(filePath) {
	return path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
}

function readJson(filePath, fallback = []) {
	const target = ensureAbsolute(filePath);
	try {
		if (!fs.existsSync(target)) return fallback;
		const raw = fs.readFileSync(target, "utf8");
		if (!raw.trim()) return fallback;
		return JSON.parse(raw);
	} catch (err) {
		console.error("readJson error:", err.message);
		return fallback;
	}
}

function writeJson(filePath, data) {
	const target = ensureAbsolute(filePath);
	const dir = path.dirname(target);
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(target, JSON.stringify(data, null, 2), "utf8");
}

module.exports = { readJson, writeJson };


