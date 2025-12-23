// Booking Modal and Form Handling
(function() {
	if (typeof document === 'undefined') return;

	let currentFlightId = null;
	let currentFlightData = null;
	let passengerCount = 1;

	function getClassMultiplier(travelClass) {
		if (!travelClass) return 1;
		switch (travelClass.toLowerCase()) {
			case 'business':
				return 1.5;
			case 'first':
				return 2.0;
			default:
				return 1.0; // economy and unknown
		}
	}

	function formatPrice(value) {
		const num = Number(value) || 0;
		return num.toFixed(2);
	}

	// Indian states list
	const indianStates = [
		'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
		'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
		'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
		'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
		'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
		'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
		'Chandigarh', 'Dadra and Nagar Haveli', 'Daman and Diu', 'Delhi',
		'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
	];

	// Countries list
	const countries = [
		'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
		'Germany', 'France', 'Italy', 'Spain', 'Japan', 'China', 'Singapore',
		'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Thailand', 'Malaysia',
		'Indonesia', 'Philippines', 'South Korea', 'Brazil', 'Argentina',
		'Mexico', 'South Africa', 'Egypt', 'Turkey', 'Russia', 'Netherlands',
		'Belgium', 'Switzerland', 'Sweden', 'Norway', 'Denmark', 'Finland',
		'Poland', 'Portugal', 'Greece', 'Ireland', 'New Zealand', 'Other'
	];

	function createBookingModal(flightId, flightData) {
		currentFlightId = flightId;
		currentFlightData = flightData;
		passengerCount = 1;

		const modal = document.createElement('div');
		modal.className = 'modal-overlay';
		modal.id = 'bookingModal';
		modal.innerHTML = `
			<div class="modal-content">
				<div class="modal-header">
					<h2 class="modal-title">Book Flight ${flightData.number}</h2>
					<button class="modal-close" onclick="closeBookingModal()">&times;</button>
				</div>
				<div style="margin-bottom: 16px; padding: 12px; background: rgba(91, 192, 235, 0.1); border-radius: 8px;">
					<div><strong>Route:</strong> ${flightData.origin} → ${flightData.destination}</div>
					<div><strong>Departure:</strong> ${flightData.departAt}</div>
					<div><strong>Arrival:</strong> ${flightData.arriveAt}</div>
					<div><strong>Base Price (Economy):</strong> ₹${formatPrice(flightData.price)}</div>
				</div>
				<form id="bookingForm" onsubmit="submitBooking(event)">
					<div id="passengersContainer"></div>
					<div style="margin-top: 12px; text-align: right; font-size: 0.9em; color: var(--muted);">
						<strong>Total Fare:</strong> ₹<span id="bookingTotalPrice">${formatPrice(flightData.price)}</span>
					</div>
					<button type="button" class="add-passenger-btn" onclick="addPassenger()">+ Add Another Passenger</button>
					<div style="margin-top: 24px; display: flex; gap: 12px;">
						<button type="submit" class="btn-primary" style="flex: 1;">Confirm Booking</button>
						<button type="button" class="btn-secondary" onclick="closeBookingModal()" style="flex: 1;">Cancel</button>
					</div>
				</form>
			</div>
		`;

		document.body.appendChild(modal);
		renderPassengers();

		// Close on overlay click
		modal.addEventListener('click', function(e) {
			if (e.target === modal) {
				closeBookingModal();
			}
		});
	}

	function renderPassengers() {
		const container = document.getElementById('passengersContainer');
		if (!container) return;

		container.innerHTML = '';
		for (let i = 0; i < passengerCount; i++) {
			const isFirst = i === 0;
			const passengerHtml = `
				<div class="passenger-section" data-passenger-index="${i}">
					<div class="passenger-header">
						<div class="passenger-title">${isFirst ? 'Primary Passenger' : `Passenger ${i + 1}`}</div>
						${!isFirst ? `<button type="button" class="remove-passenger" onclick="removePassenger(${i})">Remove</button>` : ''}
					</div>
					<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
						<div class="field">
							<label>Class *</label>
							<select name="passengers[${i}][class]" id="classSelect-${i}" required onchange="updatePassengerFare(${i})">
								<option value="Economy" selected>Economy</option>
								<option value="Business">Business</option>
								<option value="First">First</option>
							</select>
						</div>
						<div class="field">
							<label>Fare (per passenger)</label>
							<input type="text" id="fareDisplay-${i}" value="₹${formatPrice(currentFlightData.price)}" readonly />
							<input type="hidden" name="passengers[${i}][price]" id="fareValue-${i}" value="${formatPrice(currentFlightData.price)}" />
						</div>
						<div class="field">
							<label>First Name *</label>
							<input type="text" name="passengers[${i}][firstName]" required 
								${isFirst ? `value="${window.CURRENT_USER?.name?.split(' ')[0] || ''}"` : ''} />
						</div>
						<div class="field">
							<label>Last Name *</label>
							<input type="text" name="passengers[${i}][lastName]" required 
								${isFirst ? `value="${window.CURRENT_USER?.name?.split(' ').slice(1).join(' ') || ''}"` : ''} />
						</div>
						<div class="field">
							<label>Email *</label>
							<input type="email" name="passengers[${i}][email]" required 
								${isFirst ? `value="${window.CURRENT_USER?.email || ''}"` : ''} />
						</div>
						<div class="field">
							<label>Mobile Number *</label>
							<input type="tel" name="passengers[${i}][mobile]" required 
								pattern="[0-9]{10}" placeholder="10 digits" />
						</div>
						<div class="field">
							<label>Country *</label>
							<select name="passengers[${i}][country]" required onchange="updateStateDropdown(${i}, this.value)">
								<option value="">Select Country</option>
								${countries.map(c => `<option value="${c}" ${c === 'India' ? 'selected' : ''}>${c}</option>`).join('')}
							</select>
						</div>
						<div class="field">
							<label id="stateLabel-${i}">State *</label>
							<select name="passengers[${i}][state]" id="stateSelect-${i}" required>
								<option value="">Select State</option>
								${indianStates.map(s => `<option value="${s}">${s}</option>`).join('')}
							</select>
						</div>
					</div>
				</div>
			`;
			container.innerHTML += passengerHtml;
		}
	}

	window.addPassenger = function() {
		passengerCount++;
		renderPassengers();
	};

	window.removePassenger = function(index) {
		if (passengerCount <= 1) return;
		passengerCount--;
		renderPassengers();
	};

	window.updateStateDropdown = function(index, country) {
		const select = document.getElementById(`stateSelect-${index}`);
		const label = document.getElementById(`stateLabel-${index}`);
		
		if (country === 'India') {
			label.textContent = 'State *';
			select.innerHTML = '<option value="">Select State</option>' + 
				indianStates.map(s => `<option value="${s}">${s}</option>`).join('');
		} else if (country) {
			label.textContent = 'State/Province *';
			select.innerHTML = '<option value="">Enter State/Province</option>';
			select.outerHTML = `<input type="text" name="passengers[${index}][state]" id="stateSelect-${index}" required class="field" style="width: 100%; padding: 10px; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: var(--text);" placeholder="Enter State/Province" />`;
		}
	};

	window.updatePassengerFare = function(index) {
		if (!currentFlightData) return;
		const basePrice = Number(currentFlightData.economyPrice || currentFlightData.price) || 0;
		const classSelect = document.getElementById(`classSelect-${index}`);
		const fareDisplay = document.getElementById(`fareDisplay-${index}`);
		const fareValue = document.getElementById(`fareValue-${index}`);
		if (!classSelect || !fareDisplay || !fareValue) return;
		let price = basePrice;
		const cls = classSelect.value;
		if (cls === 'Business') {
			price = currentFlightData.businessPrice ? Number(currentFlightData.businessPrice) : basePrice * 1.5;
		} else if (cls === 'First') {
			price = currentFlightData.firstPrice ? Number(currentFlightData.firstPrice) : basePrice * 2.0;
		}
		fareDisplay.value = '₹' + formatPrice(price);
		fareValue.value = formatPrice(price);
		updateTotalPrice();
	};

	function updateTotalPrice() {
		if (!currentFlightData) return;
		let total = 0;
		for (let i = 0; i < passengerCount; i++) {
			const fareValue = document.getElementById(`fareValue-${i}`);
			if (fareValue) {
				total += Number(fareValue.value) || 0;
			}
		}
		const totalEl = document.getElementById('bookingTotalPrice');
		if (totalEl) {
			// If total is zero (e.g. no fares yet), fall back to base price
			totalEl.textContent = formatPrice(total || currentFlightData.price);
		}
	}

	window.closeBookingModal = function() {
		const modal = document.getElementById('bookingModal');
		if (modal) {
			modal.remove();
		}
	};

	window.submitBooking = async function(e) {
		e.preventDefault();
		const form = document.getElementById('bookingForm');
		const formData = new FormData(form);
		
		const passengers = [];
		for (let i = 0; i < passengerCount; i++) {
			passengers.push({
				firstName: formData.get(`passengers[${i}][firstName]`),
				lastName: formData.get(`passengers[${i}][lastName]`),
				email: formData.get(`passengers[${i}][email]`),
				mobile: formData.get(`passengers[${i}][mobile]`),
				country: formData.get(`passengers[${i}][country]`),
				state: formData.get(`passengers[${i}][state]`) || document.getElementById(`stateSelect-${i}`)?.value || '',
				travelClass: formData.get(`passengers[${i}][class]`) || 'Economy',
				price: Number(formData.get(`passengers[${i}][price]`)) || Number(currentFlightData.price) || 0
			});
		}

		try {
			const response = await fetch('/bookings', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					flightId: currentFlightId,
					passengers: passengers
				})
			});

			const result = await response.json();
			
			if (response.ok) {
				// Show success popup
				showBookingSuccess(result.booking, passengers);
				closeBookingModal();
			} else {
				alert('Booking failed: ' + (result.error || 'Unknown error'));
			}
		} catch (error) {
			console.error('Error:', error);
			alert('An error occurred. Please try again.');
		}
	};

	function showBookingSuccess(booking, passengers) {
		const modal = document.createElement('div');
		modal.className = 'modal-overlay';
		modal.id = 'successModal';
		
		const seatNumbers = passengers.map((_, i) => String.fromCharCode(65 + Math.floor(i / 6)) + (i % 6 + 1)).join(', ');
		
		modal.innerHTML = `
			<div class="modal-content" style="text-align: center;">
				<div style="font-size: 64px; margin-bottom: 16px;">✅</div>
				<h2 class="modal-title" style="color: var(--success);">Seats Booked Successfully!</h2>
				<p style="margin: 16px 0; font-size: 18px;">
					Your booking has been confirmed. Seat${passengers.length > 1 ? 's' : ''}: <strong>${seatNumbers}</strong>
				</p>
				<p style="margin: 16px 0; color: var(--muted);">
					Confirmation details have been sent to your registered email.
				</p>
				<div style="margin-top: 32px;">
					<button class="btn-primary" onclick="closeSuccessModal(); window.location.href='/bookings'">
						View My Bookings
					</button>
					<button class="btn-secondary" onclick="closeSuccessModal()" style="margin-left: 12px;">
						Close
					</button>
				</div>
			</div>
		`;

		document.body.appendChild(modal);

		// Show notification
		if (typeof showToast !== 'undefined') {
			showToast({
				title: 'Booking Confirmed!',
				message: `Thank you for using SkyReserve! Your ticket${passengers.length > 1 ? 's have' : ' has'} been booked successfully.`,
				type: 'success',
				duration: 8000
			});
		}
	}

	window.closeSuccessModal = function() {
		const modal = document.getElementById('successModal');
		if (modal) {
			modal.remove();
		}
	};

	// Make createBookingModal available globally
	window.openBookingModal = function(flightId, flightData) {
		createBookingModal(flightId, flightData);
	};

	// Handle book button clicks
	document.addEventListener('DOMContentLoaded', function() {
		document.addEventListener('click', function(e) {
			const bookBtn = e.target.closest('[data-book-flight]');
			if (bookBtn) {
				e.preventDefault();
				const flightId = bookBtn.dataset.bookFlight;
				const flightCard = bookBtn.closest('.flight-card');
				
				// Extract flight data from the card
				// Get flight data from data attributes if available, otherwise parse from DOM
				const basePrice = bookBtn.dataset.flightPrice || flightCard.querySelector('.price')?.textContent?.replace('$', '') || '0';
				const flightData = {
					id: flightId,
					number: bookBtn.dataset.flightNumber || (flightCard.querySelector('.flight-airline') && flightCard.querySelector('.flight-airline').textContent) || 'N/A',
					origin: bookBtn.dataset.flightOrigin || (flightCard.querySelector('.flight-route') && flightCard.querySelector('.flight-route').textContent.split('→')[0].trim()) || '',
					destination: bookBtn.dataset.flightDestination || (flightCard.querySelector('.flight-route') && flightCard.querySelector('.flight-route').textContent.split('→')[1].trim()) || '',
					departAt: bookBtn.dataset.flightDepart || (flightCard.querySelector('.time') && flightCard.querySelector('.time').textContent.replace('Depart ', '')) || '',
					arriveAt: bookBtn.dataset.flightArrive || (flightCard.textContent.match(/Arrive\s+([^\n]+)/) ? flightCard.textContent.match(/Arrive\s+([^\n]+)/)[1].trim() : '') || '',
					price: basePrice,
					economyPrice: bookBtn.dataset.flightEconomy || basePrice,
					businessPrice: bookBtn.dataset.flightBusiness || '',
					firstPrice: bookBtn.dataset.flightFirst || '',
					totalSeats: bookBtn.dataset.flightTotalSeats || '',
					remainingSeats: bookBtn.dataset.flightRemaining || ''
				};

				window.openBookingModal(flightId, flightData);
			}
		});
	});
})();

