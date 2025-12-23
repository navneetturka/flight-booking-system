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

// Real-time notifications (socket.io) + simple toast UI
(function () {
	if (typeof document === 'undefined') return;

	// Ensure toast container exists
	let container = document.getElementById('toast-container');
	if (!container) {
		container = document.createElement('div');
		container.id = 'toast-container';
		document.body.appendChild(container);
	}

	function showToast({ title = '', message = '', type = 'info', duration = 5000 }) {
		const el = document.createElement('div');
		el.className = 'toast toast-' + type;
		const h = document.createElement('div');
		h.className = 'toast-title';
		h.textContent = title;
		const p = document.createElement('div');
		p.className = 'toast-message';
		p.textContent = message;
		const close = document.createElement('button');
		close.className = 'toast-close';
		close.innerHTML = '&times;';
		close.addEventListener('click', () => { container.removeChild(el); });
		el.appendChild(h);
		el.appendChild(p);
		el.appendChild(close);
		container.appendChild(el);
		setTimeout(() => {
			try { if (el.parentNode) el.parentNode.removeChild(el); } catch (e) {}
		}, duration);
	}

	// Connect to socket.io if available
	try {
		if (typeof io !== 'undefined') {
			const socket = io();
			socket.on('connect', () => {
				console.log('Connected to notifications socket');
				// Server will validate session and assign this socket to user/admin rooms.
			});
			socket.on('notification', (data) => {
				try { showToast(data); } catch (e) { console.error('Toast failed', e); }
			});
		} else {
			// If socket.io client wasn't loaded via script tag, try loading it dynamically
			const s = document.createElement('script');
			s.src = '/socket.io/socket.io.js';
			s.onload = () => {
				const socket = io();
				socket.on('connect', () => {
					// Server will validate session and assign this socket to user/admin rooms.
				});
				socket.on('notification', (data) => showToast(data));
			};
			s.onerror = () => console.warn('Failed to load socket.io client');
			document.head.appendChild(s);
		}
	} catch (err) {
		console.warn('Notification init error', err);
	}

	// Show login notification if available
	if (typeof window.LOGIN_NOTIFICATION !== 'undefined' && window.LOGIN_NOTIFICATION) {
		setTimeout(() => {
			showToast({
				title: 'Welcome Back!',
				message: window.LOGIN_NOTIFICATION,
				type: 'success',
				duration: 7000
			});
		}, 500);
	}
})();


