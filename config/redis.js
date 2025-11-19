const { createClient } = require("redis");

const redisEnabled = (process.env.REDIS_ENABLED || "true").toLowerCase() !== "false";
const retryIntervalMs = Number(process.env.REDIS_RETRY_INTERVAL_MS || 30000);

let client;
let offlineSince = null;

function buildRedisUrl() {
	if (process.env.REDIS_URL) return process.env.REDIS_URL;
	const host = process.env.REDIS_HOST || "127.0.0.1";
	const port = process.env.REDIS_PORT || 6379;
	const username = process.env.REDIS_USERNAME;
	const password = process.env.REDIS_PASSWORD;
	if (password && username) return `redis://${username}:${password}@${host}:${port}`;
	if (password && !username) return `redis://:${password}@${host}:${port}`;
	return `redis://${host}:${port}`;
}

async function getRedisClient() {
	if (!redisEnabled) return null;
	if (offlineSince && Date.now() - offlineSince < retryIntervalMs) {
		return null;
	}
	if (!client) {
		client = createClient({
			url: buildRedisUrl(),
			socket: {
				reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
			}
		});
		client.on("error", (err) => {
			console.error("Redis client error", err);
		});
	}
	if (!client.isOpen) {
		try {
			await client.connect();
			offlineSince = null;
		} catch (err) {
			offlineSince = Date.now();
			await safeCloseClient();
			throw err;
		}
	}
	return client;
}

async function safeCloseClient() {
	if (client) {
		try {
			await client.quit();
		} catch (_) {
			// ignore
		} finally {
			client = null;
		}
	}
}

async function closeRedisClient() {
	await safeCloseClient();
}

module.exports = { getRedisClient, closeRedisClient, redisEnabled };

