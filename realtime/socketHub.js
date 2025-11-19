const { WebSocketServer } = require("ws");

let wss = null;

function initWebsocket(server) {
	if (wss) return wss;
	wss = new WebSocketServer({ server });
	wss.on("connection", (socket, req) => {
		console.log("WebSocket connected", req.socket.remoteAddress);
		socket.send(JSON.stringify({ type: "WELCOME", payload: { message: "Connected to Flight booking realtime feed" } }));
		socket.on("close", () => console.log("WebSocket disconnected"));
	});
	return wss;
}

function broadcast(event) {
	if (!wss) return;
	const data = JSON.stringify(event);
	wss.clients.forEach(client => {
		if (client.readyState === client.OPEN) client.send(data);
	});
}

function emit(type, payload) {
	broadcast({ type, payload, timestamp: Date.now() });
}

module.exports = { initWebsocket, broadcast, emit };



