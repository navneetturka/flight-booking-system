# ✈️ Flight Booking System (Full Stack)

A full-stack Flight Booking System built using **Node.js, Express, MySQL, Redis, and EJS**.
This application allows users to search and book flights, while admins can manage flight data and bookings efficiently.

---

## 🚀 Features

### 🔐 Authentication & Authorization

* User Registration & Login
* Secure password hashing using bcrypt
* Session-based authentication using Redis

### 👥 Role-Based Access Control (RBAC)

#### 👤 User

* Search flights
* View available flights
* Book flights
* Manage personal bookings

#### 🛠️ Admin

* Add new flights
* Edit flight details
* Delete flights
* Manage all bookings

---

### ✈️ Core Functionalities

* Flight search and listing
* Booking system
* Real-time updates using Socket.io
* Session management using Redis
* Server-side rendering using EJS

---

### 📩 Email Notification System

* Automated booking confirmation emails
* HTML formatted email templates
* Sent to user's registered email
* Implemented using Nodemailer

---

## 🛠️ Tech Stack

### Backend

* Node.js
* Express.js
* MySQL
* Redis
* Socket.io
* bcrypt
* dotenv
* Nodemailer

### Frontend

* EJS Templates
* HTML, CSS, JavaScript

---

## 📁 Project Structure

```
flight-booking-system/
│── config/
│── controllers/
│── data/
│── middleware/
│── models/
│── public/
│── routes/
│── utils/
│── views/
│── server.js
│── package.json
│── README.md
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone Repository

```bash
git clone <your-repo-link>
cd flight-booking-system
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Environment Variables

Create `.env` file:

```env
PORT=3000

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=flight_booking

REDIS_URL=redis://127.0.0.1:6379
SESSION_SECRET=your_secret_key

EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

---

## 🗄️ Database Setup

Run this SQL:

```sql
CREATE DATABASE IF NOT EXISTS flight_booking;
USE flight_booking;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(200) UNIQUE,
  password_hash VARCHAR(255),
  role ENUM('user','admin') DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE flights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  number VARCHAR(50),
  origin VARCHAR(100),
  destination VARCHAR(100),
  depart_at DATETIME,
  arrive_at DATETIME,
  price DECIMAL(10,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  flight_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (flight_id) REFERENCES flights(id) ON DELETE CASCADE
);
```

---

## ⚠️ Database Migration (Important)

Run this to support passenger details and improve performance:

```sql
ALTER TABLE bookings 
ADD COLUMN passengers TEXT NULL 
COMMENT 'JSON array of passenger details' 
AFTER flight_id;

CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_flight_id ON bookings(flight_id);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);
```

---

## ▶️ Run the Project

```bash
npm run dev
# or
npm start
```

Open:
👉 http://localhost:3000

---

## 📌 Scripts

* `npm run dev` → nodemon
* `npm start` → production

---

## 🚀 Deployment Notes

* Local MySQL will NOT work in production
* Use cloud database (PlanetScale / Railway)
* Use cloud Redis (Upstash)
* Email works with Gmail App Password

---

## 🔐 Authorization Flow

* Session-based authentication
* bcrypt password hashing
* Middleware for role checking
* Protected routes:

  * `/admin/*` → Admin only
  * `/bookings` → Authenticated users

---

## ⚠️ Notes

* Redis must be running
* MySQL must be configured
* SMS/WhatsApp notifications can be added using Twilio (optional)

---

## 👨‍💻 Author

Navneet Kaur
