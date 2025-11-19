// Hero slider auto-advance (no dependencies)
(function () {
	if (typeof document === "undefined") return;
	const slider = document.querySelector('.hero-slider');
	if (!slider) return;
	const slides = Array.from(slider.querySelectorAll('.slide'));
	const dotsContainer = slider.querySelector('.slider-dots');
	if (slides.length === 0 || !dotsContainer) return;

	let current = 0;
	const intervalMs = Number(slider.getAttribute('data-interval') || 3000);

	// Build dots
	slides.forEach((_, idx) => {
		const b = document.createElement('button');
		b.setAttribute('aria-label', 'Slide ' + (idx + 1));
		b.addEventListener('click', () => goTo(idx));
		dotsContainer.appendChild(b);
	});
	const dots = Array.from(dotsContainer.querySelectorAll('button'));

	function render() {
		slides.forEach((el, i) => el.classList.toggle('active', i === current));
		dots.forEach((el, i) => el.classList.toggle('active', i === current));
	}

	function goTo(index) {
		current = (index + slides.length) % slides.length;
		render();
		resetTimer();
	}

	let timerId = null;
	function startTimer() {
		stopTimer();
		timerId = setInterval(() => goTo(current + 1), intervalMs);
	}
	function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }
	function resetTimer() { stopTimer(); startTimer(); }

	// Start after a small delay (2s) as requested
	setTimeout(() => {
		render();
		startTimer();
	}, 2000);

	// Pause on hover (desktop)
	slider.addEventListener('mouseenter', stopTimer);
	slider.addEventListener('mouseleave', startTimer);
})();

(function () {
	if (typeof window === "undefined" || typeof document === "undefined") return;
	const indicator = document.querySelector("[data-realtime-indicator]");
	const labelEl = indicator ? indicator.querySelector("[data-realtime-label]") : null;
	const feed = document.createElement("div");
	feed.className = "realtime-feed";
	document.addEventListener("DOMContentLoaded", () => {
		document.body.appendChild(feed);
	});

	const protocol = window.location.protocol === "https:" ? "wss" : "ws";
	const wsUrl = `${protocol}://${window.location.host}/ws`;
	let socket = null;
	let retryMs = 1500;

	function setStatus(state, text) {
		if (!indicator) return;
		indicator.setAttribute("data-status", state);
		if (labelEl) labelEl.textContent = text;
	}

	function pushToast(message) {
		if (!message || !feed) return;
		const toast = document.createElement("div");
		toast.className = "realtime-toast";
		toast.textContent = message;
		feed.appendChild(toast);
		setTimeout(() => toast.classList.add("visible"), 10);
		setTimeout(() => {
			toast.classList.remove("visible");
			setTimeout(() => toast.remove(), 250);
		}, 5000);
	}

	function describeEvent(event) {
		if (!event || !event.type) return null;
		switch (event.type) {
			case "BOOKING_CREATED":
				return `New booking for flight ${event.payload?.flightId || ""}`;
			case "BOOKING_CANCELLED":
				return `Booking ${event.payload?.bookingId || ""} cancelled`;
			case "FLIGHT_CREATED":
				return `Flight ${event.payload?.flight?.number || ""} added`;
			case "FLIGHT_UPDATED":
				return `Flight ${event.payload?.flight?.number || ""} updated`;
			case "FLIGHT_DELETED":
				return `Flight removed`;
			case "WELCOME":
				return event.payload?.message || null;
			default:
				return null;
		}
	}

	function bindSocket(ws) {
		ws.addEventListener("open", () => {
			setStatus("live", "Live");
			retryMs = 1500;
		});

		ws.addEventListener("message", (evt) => {
			try {
				const data = JSON.parse(evt.data);
				const text = describeEvent(data);
				if (text) pushToast(text);
				window.dispatchEvent(new CustomEvent("realtime:event", { detail: data }));
			} catch (err) {
				console.warn("Realtime parse error", err);
			}
		});

		ws.addEventListener("close", () => {
			setStatus("offline", "Reconnecting…");
			scheduleReconnect();
		});

		ws.addEventListener("error", () => {
			ws.close();
		});
	}

	function connect() {
		setStatus("connecting", "Connecting");
		socket = new WebSocket(wsUrl);
		bindSocket(socket);
	}

	function scheduleReconnect() {
		setTimeout(() => {
			retryMs = Math.min(retryMs * 1.5, 10000);
			connect();
		}, retryMs);
	}

	if (indicator) {
		connect();
	}
})();
