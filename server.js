const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const session = require("express-session");
const { createClient } = require('redis');
const connectRedis = require('connect-redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Support HTML forms with _method override (e.g., DELETE)
app.use((req, res, next) => {
	if (req.method === "POST" && req.body && req.body._method) {
		req.method = String(req.body._method).toUpperCase();
		delete req.body._method;
	}
	return next();
});

// Sessions (use Redis-backed store when possible so sessions work across processes)
let sessionMiddleware;
// We'll create pub/sub clients for the socket.io adapter as well. Declare here so
// they can be used later when configuring the adapter.
let pubClient;
let subClient;
let redisClient;

// Use MemoryStore by default (no blocking)
sessionMiddleware = session({
	secret: process.env.SESSION_SECRET || "dev_secret",
	resave: false,
	saveUninitialized: false,
	cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
});
app.use(sessionMiddleware);
console.log('✓ Using MemoryStore for sessions');

// Try Redis in background (optional, non-blocking)
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
try {
	const RedisStore = connectRedis(session);
	redisClient = createClient({ url: redisUrl });
	redisClient.on('error', () => {}); // Silent errors
	
	// Try to connect, but don't wait
	redisClient.connect().then(() => {
		console.log('✓ Redis connected - you can manually switch to RedisStore if needed');
	}).catch(() => {
		// Silent fail - MemoryStore is fine
	});

	// Socket.IO Redis clients (optional)
	pubClient = createClient({ url: redisUrl });
	subClient = pubClient.duplicate();
	pubClient.on('error', () => {});
	subClient.on('error', () => {});
	pubClient.connect().catch(() => {});
	subClient.connect().catch(() => {});
} catch (err) {
	// Redis not available - that's fine, MemoryStore works
}

// Simple logger middleware
app.use((req, res, next) => { console.log(req.method, req.url); next(); });

// Routes
const authRoutes = require("./routes/authRoutes");
const flightRoutes = require("./routes/flightRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
app.use((req, res, next) => { 
	res.locals.user = req.session?.user;
	// Store login notification in session for the next request
	next(); 
});
app.use("/", authRoutes);
app.use("/", flightRoutes);
app.use("/", bookingRoutes);

const { requireAuth } = require("./middleware/authMiddleware");
const { listFlights } = require("./models/flightModel");
app.get("/", requireAuth, async (req, res) => {
	try {
		const flights = (await listFlights()).slice(0, 6);
		// Check for login notification
		const loginNotification = req.session?.loginNotification;
		if (loginNotification) {
			delete req.session.loginNotification;
		}
		res.render("index", { title: "Home", flights, user: req.session.user, loginNotification });
	} catch (err) {
		console.error('Error loading flights:', err.message);
		res.status(500).render("index", { 
			title: "Home", 
			flights: [], 
			user: req.session.user,
			error: "Unable to load flights. Please check database connection." 
		});
	}
});

// 404
app.use((req, res) => { res.status(404).send("Not Found"); });

// Create HTTP server and wire socket.io for real-time notifications
const server = http.createServer(app);
const io = new Server(server);

// Make the io instance available to request handlers
app.set('io', io);

// Configure Socket.IO Redis adapter if clients are available
// Wait for connections to be ready before configuring adapter
if (pubClient && subClient) {
	const configureAdapter = () => {
		// Check if clients are ready
		if (pubClient.isReady && subClient.isReady) {
			try {
				io.adapter(createAdapter(pubClient, subClient));
				console.log('✓ Socket.IO Redis adapter configured');
			} catch (err) {
				console.warn('✗ Failed to configure socket.io redis adapter:', err.message);
				console.warn('  Socket.IO will use default in-memory adapter');
			}
		} else {
			// Wait a bit and check again
			setTimeout(configureAdapter, 200);
		}
	};
	// Start checking after a short delay to allow connections to establish
	setTimeout(configureAdapter, 100);
}
// Use the same session middleware for socket.io so we can trust socket.request.session
io.use((socket, next) => {
	sessionMiddleware(socket.request, {}, (err) => {
		if (err) return next(err);
		// If there's no session or no user, we'll still allow the socket connection
		// but we won't join user/admin rooms. This prevents clients from spoofing
		// room membership because the server derives user/role from the session.
		return next();
	});
});

io.on('connection', (socket) => {
	console.log('Socket connected:', socket.id);

	try {
		const req = socket.request;
		const user = req.session && req.session.user;
		if (user && user.id) {
			const uid = String(user.id);
			socket.join('user:' + uid);
			if (user.role === 'admin') socket.join('admins');
			console.log(`Socket ${socket.id} joined user:${uid} ${user.role === 'admin' ? 'and admins' : ''}`);
		}
	} catch (err) {
		console.warn('Error joining rooms from session', err);
	}

	socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));
});

// Start server
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
