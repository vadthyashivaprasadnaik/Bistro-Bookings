require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const seedDB = require('./utils/seed');
const { errorHandler } = require('./middleware/errorMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const tableRoutes = require('./routes/tableRoutes');
const reservationRoutes = require('./routes/reservationRoutes');

const app = express();

// Connect to Database and Seed
const startServer = async () => {
  // Connect to DB
  await connectDB();
  
  // Seed Database (tables & default users if empty)
  await seedDB();

  // Enable CORS
  app.use(cors({
    origin: '*', // For development accessibility, can be restricted in production
    credentials: true
  }));

  // Body parser middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Mount routers
  app.use('/api/auth', authRoutes);
  app.use('/api/tables', tableRoutes);
  app.use('/api/reservations', reservationRoutes);

  // Home route
  app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Restaurant Reservation Management System API' });
  });

  // Centralized Error handler middleware
  app.use(errorHandler);

  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  // Export app & server for integration tests
  return { app, server };
};

// Start the server (only if run directly, not when required by tests)
if (require.main === module) {
  startServer();
}

module.exports = startServer;
