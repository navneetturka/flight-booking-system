# Notification Setup Guide

## Database Migration

**IMPORTANT**: Run this SQL in your MySQL database FIRST to fix the booking error:

```sql
-- Add passengers column to bookings table
ALTER TABLE bookings 
ADD COLUMN passengers TEXT NULL 
COMMENT 'JSON array of passenger details' 
AFTER flight_id;

-- Add indexes for better performance
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_flight_id ON bookings(flight_id);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);
```

## Email + SMS/WhatsApp Notification Setup

The system sends **ALL THREE** types of notifications (Email, SMS, WhatsApp) when a booking is confirmed:
- ✅ **Email**: HTML formatted confirmation email
- ✅ **SMS**: Text message via Twilio
- ✅ **WhatsApp**: WhatsApp message via Twilio

All notifications are sent **in parallel** and won't block the booking process.

## Email Notification Setup

Add these to your `.env` file for email notifications:

```env
# Email Configuration (Gmail example)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
# OR use EMAIL_APP_PASSWORD if using Gmail App Password
```

**Gmail Setup:**
1. Enable 2-factor authentication on your Google account
2. Generate an App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password (without spaces)
3. In your `.env` file, use:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   ```
   **Important**: Use the app password (not your regular Gmail password)

**Test Your Email Configuration:**
Run: `npm run test-email`
This will test your email setup and show detailed error messages if something is wrong.

## SMS/WhatsApp Setup with Twilio (Optional)

For SMS and WhatsApp notifications, add to `.env`:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # Twilio WhatsApp sandbox number
```

**Twilio Setup:**
1. Sign up at https://www.twilio.com
2. Get your Account SID and Auth Token from dashboard
3. Get a phone number (or use WhatsApp sandbox)

## Install Dependencies

Run:
```bash
npm install
```

This will install:
- `nodemailer` - for email notifications
- `twilio` - for SMS/WhatsApp notifications (optional)

## Quick Setup Summary

Add these to your `.env` file:

```env
# Email (REQUIRED for email notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password

# SMS/WhatsApp (REQUIRED for SMS/WhatsApp notifications)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

## Current Behavior

**The system attempts to send ALL notifications:**
- ✅ **Email**: Sends to primary passenger's email (if EMAIL_USER configured)
- ✅ **SMS**: Sends to primary passenger's mobile (if TWILIO configured)
- ✅ **WhatsApp**: Sends to primary passenger's mobile (if TWILIO configured)
- ✅ **Real-time**: Always works via Socket.IO (no config needed)

**Without Configuration:**
- Notifications log to console (won't fail booking)
- Real-time notifications via Socket.IO still work

**With Configuration:**
- All configured channels send notifications simultaneously
- Non-fatal errors won't break the booking process
- Success/failure is logged in console

## Testing

1. Run the database migration SQL
2. Install dependencies: `npm install`
3. (Optional) Configure email/SMS/WhatsApp in `.env`
4. Restart server: `npm run dev`
5. Make a booking - notifications will be sent automatically!

