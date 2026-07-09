# Bistro Bookings - Restaurant Reservation Management System

A full-stack Restaurant Reservation Management System designed to handle table bookings, prevent capacity/seating conflicts, and provide separate customer and administrative interfaces.

## Technology Stack

* **Frontend**: React (Vite, React Router, Axios)
* **Backend**: Node.js with Express, Mongoose
* **Database**: MongoDB (with automatic local MongoMemoryServer fallback)
* **Styling**: Modern, clean, high-performance vanilla CSS (Minimalist light theme)
* **Authentication**: JSON Web Tokens (JWT) & bcryptjs password hashing
* **Testing**: Jest & Supertest (6 integration tests written and passing)

---

## Features

1. **User Roles & Access Control**:
   * **Customer**: Can sign up, log in, make a new reservation, view their own reservation list, and cancel their reservations.
   * **Admin**: Can view all reservations, filter bookings by date, edit reservation details (date, slot, guest count, status) via a modal interface, create tables, delete tables, and toggle table active/inactive status.
2. **Table Allocation & Conflict Resolution**:
   * Ensures that double bookings for the same table during the same time slot are prevented.
   * Dynamically assigns the smallest available table that meets or exceeds the guest count (preventing seat waste).
   * Gracefully handles capacity limits and returns explanatory error messages.
3. **Database Seeding**:
   * Pre-seeds tables and sample demo accounts automatically if the database is empty on server startup.
4. **Self-Contained Run Mode**:
   * Automatically spins up a temporary in-memory MongoDB server (`mongodb-memory-server`) if no external `MONGO_URI` is provided, requiring zero database installation steps.

---

## Setup & Running Locally

### Prerequisites

* Node.js (v18 or higher recommended)
* NPM (v9 or higher)

### Installation

1. Clone or open the project folder in your terminal.
2. Install all dependencies across the monorepo using the root helper script:
   ```bash
   npm run install-all
   ```

### Configuration

You can configure environment variables in `backend/.env`. A default `.env` is already configured for development:
```env
PORT=5000
JWT_SECRET=supersecretkey_restaurant_reservation_jwt_auth_13579
# MONGO_URI=mongodb://localhost:27017/restaurant-reservation
```
* **Note**: Leave `MONGO_URI` commented out to run using the built-in in-memory database fallback.

### Running the Application

To run both the backend server and the frontend development server concurrently, run:
```bash
npm run dev
```
* The backend API will start on: [http://localhost:5000](http://localhost:5000)
* The frontend React app will start on: [http://localhost:5173](http://localhost:5173) (or next available port)

---

## Demo Accounts (Auto-seeded)

Use the following pre-configured credentials to test the role capabilities, or register new accounts directly:

* **Administrator**:
  * Email: `admin@restaurant.com`
  * Password: `Admin123!`
* **Customer**:
  * Email: `customer@restaurant.com`
  * Password: `Customer123!`

---

## Core Reservation & Seating Allocation Logic

The booking allocation workflow is implemented in `backend/controllers/reservationController.js` and behaves as follows:

1. **Capacity Filtering**: The system retrieves all active tables whose capacity is greater than or equal to the requested number of guests:
   ```javascript
   const candidateTables = await Table.find({ isActive: true, capacity: { $gte: guestCount } });
   ```
2. **Table Optimization**: Candidate tables are sorted in ascending order of capacity (`{ capacity: 1 }`). This ensures that the system allocates the *smallest* matching table first (e.g., placing a party of 2 on a 2-seat table rather than wasting a 6-seat table).
3. **Conflict Detection**: The system queries all active, confirmed reservations for the selected date and time slot:
   ```javascript
   const activeReservations = await Reservation.find({ date, timeSlot, status: 'confirmed' });
   const bookedTableIds = activeReservations.map(r => r.table.toString());
   ```
4. **Allocation**: It filters out the booked tables from the candidate list and selects the first available table. If no tables remain, the transaction is aborted, and a `400 Bad Request` error is returned to the client:
   ```javascript
   const availableTable = candidateTables.find(t => !bookedTableIds.includes(t._id.toString()));
   ```

When updating a reservation, the system performs the same calculation, but excludes the reservation currently being modified from the conflict query to prevent it from blocking itself.

---

## Known Limitations

1. **Fixed Seating Configurations**: Tables cannot be dynamically merged (e.g., joining two 2-person tables to seat a party of 4).
2. **Fixed Time Slots**: Bookings are restricted to standard 2-hour dining windows (12:00-14:00, 14:00-16:00, 18:00-20:00, 20:00-22:00).
3. **Local Storage Session Persistence**: Auth token is saved in `localStorage`, which could be vulnerable to XSS in a wider application compared to secure HTTP-only cookies.

---

## Areas for Improvement (with more time)

1. **Table Combination Algorithm**: Dynamically calculate combinations of tables when no single table has large enough capacity.
2. **Custom Booking Hours**: Support flexible booking durations and custom start/end times with overlapping calendar interval math.
3. **Email / SMS Confirmations**: Integrate Nodemailer or Twilio to send booking notifications and QR codes for table check-ins.
4. **Analytics Dashboard**: Add chart widgets showing busy times, seating utilization rates, and booking trends.
