// Test email configuration
// Run: node utils/test-email.js

require('dotenv').config();
const { sendEmail } = require('./notifications');

async function testEmail() {
	console.log('🧪 Testing email configuration...\n');
	
	console.log('Environment variables:');
	console.log('  EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'gmail (default)');
	console.log('  EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Not set');
	console.log('  EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ Set' : '❌ Not set');
	console.log('  EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? '✅ Set' : '❌ Not set');
	console.log('');

	const testEmail = process.env.EMAIL_USER || 'test@example.com';
	const testSubject = 'Test Email from SkyReserve';
	const testHtml = `
		<h1>Test Email</h1>
		<p>If you receive this email, your email configuration is working correctly!</p>
		<p>This is a test from your SkyReserve booking system.</p>
	`;

	const result = await sendEmail(testEmail, testSubject, testHtml);
	
	console.log('\n📧 Test Result:');
	console.log('  Success:', result.success ? '✅' : '❌');
	console.log('  Message:', result.message);
	if (result.messageId) {
		console.log('  Message ID:', result.messageId);
	}
	if (result.error) {
		console.log('  Error Code:', result.error);
	}

	process.exit(result.success ? 0 : 1);
}

testEmail().catch(err => {
	console.error('Test failed:', err);
	process.exit(1);
});

