## PostgreSQL Setup

Create the database and tables (example schema):

```sql
CREATE DATABASE flight_booking;
\c flight_booking;

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS flights (
  id SERIAL PRIMARY KEY,
  number VARCHAR(50) NOT NULL,
  origin VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  depart_at TIMESTAMPTZ NOT NULL,
  arrive_at TIMESTAMPTZ NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  flight_id INT NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Environment variables (or use `DATABASE_URL`):

```env
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=postgres
PGPASSWORD=
PGDATABASE=flight_booking
# Optional:
# PGSSL=true
# DATABASE_URL=postgres://user:pass@host:5432/db
```

# Flight Booking System (Backend)

MVP backend with Node.js + Express + EJS + PostgreSQL. Focus: login, register, home.

## Prerequisites

- Install Node.js LTS from https://nodejs.org

## Setup

`ash
cd flight-booking-system
npm install
npm run dev

# or

npm start
`

Open http://localhost:3000

## Scripts

- dev: nodemon server.js
- start: node server.js

## Structure

See folder tree in the project.
