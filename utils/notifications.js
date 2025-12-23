// Notification service for SMS, Email, and WhatsApp
// This is a mock implementation - integrate with actual services like Twilio, SendGrid, etc.

const nodemailer = require('nodemailer');

// Email configuration (using Gmail as example - configure in .env)
const createEmailTransporter = () => {
	let nodemailerLib;
	try {
		nodemailerLib = require('nodemailer');
	} catch (e) {
		console.warn('⚠️ nodemailer package not installed. Run: npm install nodemailer');
		return null;
	}
	
	const emailUser = process.env.EMAIL_USER;
	const emailPassword = process.env.EMAIL_PASSWORD || process.env.EMAIL_APP_PASSWORD;
	const emailService = process.env.EMAIL_SERVICE || 'gmail';
	
	if (!emailUser || !emailPassword) {
		console.warn('⚠️ Email credentials not found in environment variables');
		return null;
	}

	// For Gmail, use specific configuration
	if (emailService.toLowerCase() === 'gmail') {
		return nodemailerLib.createTransport({
			service: 'gmail',
			host: 'smtp.gmail.com',
			port: 587,
			secure: false, // true for 465, false for other ports
			auth: {
				user: emailUser,
				pass: emailPassword
			},
			tls: {
				rejectUnauthorized: false
			}
		});
	}
	
	// For other email services
	return nodemailerLib.createTransport({
		service: emailService,
		auth: {
			user: emailUser,
			pass: emailPassword
		}
	});
};

// Send email notification
async function sendEmail(to, subject, html) {
	const emailUser = process.env.EMAIL_USER;
	const emailPassword = process.env.EMAIL_PASSWORD || process.env.EMAIL_APP_PASSWORD;
	
	if (!emailUser || !emailPassword) {
		console.log('⚠️ Email not configured. Missing EMAIL_USER or EMAIL_PASSWORD in .env');
		console.log('   Would send email to:', to);
		console.log('   Subject:', subject);
		return { success: false, message: 'Email service not configured - check .env file' };
	}

	try {
		const transporter = createEmailTransporter();
		if (!transporter) {
			return { success: false, message: 'Email transporter not available - check credentials' };
		}

		// Verify transporter connection
		await transporter.verify();

		const mailOptions = {
			from: `"SkyReserve" <${emailUser}>`,
			to: to,
			subject: subject,
			html: html
		};

		const info = await transporter.sendMail(mailOptions);
		console.log('✅ Email sent successfully!');
		console.log('   To:', to);
		console.log('   Message ID:', info.messageId);
		return { success: true, message: 'Email sent successfully', messageId: info.messageId };
	} catch (error) {
		console.error('❌ Email sending failed:', error.message);
		console.error('   Full error:', error);
		
		// Provide helpful error messages
		let errorMessage = error.message;
		if (error.code === 'EAUTH') {
			errorMessage = 'Authentication failed - check your email password (use App Password for Gmail)';
		} else if (error.code === 'ECONNECTION') {
			errorMessage = 'Connection failed - check your internet or email service settings';
		} else if (error.responseCode === 535) {
			errorMessage = 'Authentication failed - make sure you\'re using an App Password, not your regular password';
		}
		
		return { success: false, message: errorMessage, error: error.code };
	}
}

// Send SMS notification (mock - integrate with Twilio)
async function sendSMS(phoneNumber, message) {
	console.log('📱 SMS notification:', phoneNumber);
	console.log('Message:', message);
	
	if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
		try {
			let twilio;
			try {
				twilio = require('twilio');
			} catch (e) {
				console.warn('⚠️ Twilio package not installed. Run: npm install twilio');
				return { success: false, message: 'Twilio package not installed' };
			}
			const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
			const result = await client.messages.create({
				body: message,
				to: phoneNumber,
				from: process.env.TWILIO_PHONE_NUMBER
			});
			console.log('✅ SMS sent via Twilio:', result.sid);
			return { success: true, message: 'SMS sent successfully', sid: result.sid };
		} catch (error) {
			console.error('❌ SMS sending failed:', error.message);
			return { success: false, message: error.message };
		}
	}
	
	return { success: false, message: 'SMS service not configured' };
}

// Send WhatsApp notification (using Twilio WhatsApp API)
async function sendWhatsApp(phoneNumber, message) {
	// Format: whatsapp:+1234567890
	const whatsappNumber = phoneNumber.startsWith('whatsapp:') ? phoneNumber : `whatsapp:${phoneNumber}`;
	
	console.log('📱 WhatsApp notification:', whatsappNumber);
	console.log('Message:', message);
	
	if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_NUMBER) {
		try {
			let twilio;
			try {
				twilio = require('twilio');
			} catch (e) {
				console.warn('⚠️ Twilio package not installed. Run: npm install twilio');
				return { success: false, message: 'Twilio package not installed' };
			}
			const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
			const result = await client.messages.create({
				body: message,
				to: whatsappNumber,
				from: process.env.TWILIO_WHATSAPP_NUMBER // Format: whatsapp:+14155238886
			});
			console.log('✅ WhatsApp message sent:', result.sid);
			return { success: true, message: 'WhatsApp message sent successfully', sid: result.sid };
		} catch (error) {
			console.error('❌ WhatsApp sending failed:', error.message);
			return { success: false, message: error.message };
		}
	}
	
	return { success: false, message: 'WhatsApp service not configured' };
}

// Send booking confirmation notification (tries all methods)
async function sendBookingConfirmation(primaryPassenger, bookingDetails, flightDetails) {
	const results = {
		email: { success: false },
		sms: { success: false },
		whatsapp: { success: false }
	};

	const emailSubject = `Flight Booking Confirmed - ${flightDetails.number}`;
	const emailHtml = `
		<!DOCTYPE html>
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background: #5bc0eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
				.content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
				.detail-row { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
				.footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>✈️ Flight Booking Confirmed!</h1>
				</div>
				<div class="content">
					<h2>Hello ${primaryPassenger.firstName} ${primaryPassenger.lastName},</h2>
					<p>Thank you for choosing SkyReserve! Your flight booking has been confirmed.</p>
					
					<div class="detail-row">
						<strong>Booking ID:</strong> ${bookingDetails.id}<br>
						<strong>Flight:</strong> ${flightDetails.number}<br>
						<strong>Route:</strong> ${flightDetails.origin} → ${flightDetails.destination}<br>
						<strong>Departure:</strong> ${flightDetails.departAt}<br>
						<strong>Arrival:</strong> ${flightDetails.arriveAt}<br>
						<strong>Total Amount:</strong> $${flightDetails.price}<br>
						<strong>Passengers:</strong> ${bookingDetails.passengers ? bookingDetails.passengers.length : 1}
					</div>
					
					<p>Please arrive at the airport at least 2 hours before departure time.</p>
					<p>Have a safe journey! ✈️</p>
				</div>
				<div class="footer">
					<p>SkyReserve - Your trusted flight booking partner</p>
				</div>
			</div>
		</body>
		</html>
	`;

	const smsMessage = `Hi ${primaryPassenger.firstName}! Your flight ${flightDetails.number} from ${flightDetails.origin} to ${flightDetails.destination} is confirmed. Booking ID: ${bookingDetails.id}. Departure: ${flightDetails.departAt}. Thank you for using SkyReserve!`;

	// Send ALL notifications in parallel (email, SMS, WhatsApp)
	const notificationPromises = [];

	// Send email
	if (primaryPassenger.email) {
		notificationPromises.push(
			sendEmail(primaryPassenger.email, emailSubject, emailHtml).then(result => {
				results.email = result;
			}).catch(err => {
				results.email = { success: false, message: err.message };
			})
		);
	}

	// Send SMS and WhatsApp if mobile number is provided
	if (primaryPassenger.mobile) {
		// Format phone number (add country code if needed)
		let phoneNumber = primaryPassenger.mobile;
		// Remove any spaces or dashes
		phoneNumber = phoneNumber.replace(/[\s\-]/g, '');
		if (!phoneNumber.startsWith('+')) {
			// Default to +91 for India, adjust as needed
			phoneNumber = `+91${phoneNumber}`;
		}

		// Send SMS
		notificationPromises.push(
			sendSMS(phoneNumber, smsMessage).then(result => {
				results.sms = result;
			}).catch(err => {
				results.sms = { success: false, message: err.message };
			})
		);

		// Send WhatsApp
		notificationPromises.push(
			sendWhatsApp(phoneNumber, smsMessage).then(result => {
				results.whatsapp = result;
			}).catch(err => {
				results.whatsapp = { success: false, message: err.message };
			})
		);
	}

	// Wait for all notifications to complete
	await Promise.all(notificationPromises);

	// Log summary
	const successCount = Object.values(results).filter(r => r.success).length;
	const totalAttempted = Object.values(results).filter(r => r.message).length;
	console.log(`📧 Notifications sent: ${successCount}/${totalAttempted} successful`);

	return results;
}

module.exports = {
	sendEmail,
	sendSMS,
	sendWhatsApp,
	sendBookingConfirmation
};

