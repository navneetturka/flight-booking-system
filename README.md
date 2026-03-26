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
* Access admin-level controls

---

### ✈️ Core Functionalities

* Flight search and listing
* Booking system
* Real-time updates using Socket.io
* Session management using Redis
* Server-side rendering using EJS

---

## 🛠️ Tech Stack

### Backend

* Node.js (Runtime)
* Express.js (Framework)
* MySQL (Database)
* Redis (Session Store & Caching)
* Socket.io (Real-time communication)
* bcrypt (Authentication)
* dotenv (Environment configuration)

### Frontend

* EJS (Templating Engine)
* HTML, CSS, JavaScript

---

## 📁 Project Structure

```
flight-booking-system/
│── config/           # DB & Redis configuration
│── controllers/      # Business logic
│── data/             # Sample/seed data
│── middleware/       # Auth & role middleware
│── models/           # SQL queries
│── public/           # Static files (CSS, JS)
│── routes/           # Application routes
│── utils/            # Helper functions
│── views/            # EJS templates
│── server.js         # Entry point
│── package.json
│── README.md
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone <your-repo-link>
cd flight-booking-system
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Configure Environment Variables

Create a `.env` file:

```env
PORT=3000

MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=flight_booking

REDIS_URL=redis://localhost:6379
SESSION_SECRET=your_secret_key
```

---

## 🗄️ Database Setup (MySQL)

Run the following SQL queries:

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

## ▶️ Running the Project

```bash
npm run dev
# or
npm start
```

Open in browser:
👉 http://localhost:3000

---

## 📌 Scripts

* `npm run dev` → Run with nodemon
* `npm start` → Production server

---

## 🔐 Authorization Flow

* Authentication handled via sessions
* Passwords hashed using bcrypt
* Middleware enforces role-based access
* Protected routes:

  * `/admin/*` → Admin only
  * `/bookings` → Logged-in users

---

## ⚠️ Notes

* Redis must be running (local/cloud)
* MySQL must be configured
