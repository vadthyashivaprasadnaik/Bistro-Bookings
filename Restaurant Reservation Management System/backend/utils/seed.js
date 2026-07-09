const User = require('../models/User');
const Table = require('../models/Table');

const seedDB = async () => {
  try {
    // 1. Seed tables if none exist
    const tableCount = await Table.countDocuments();
    if (tableCount === 0) {
      console.log('No tables found in database. Seeding tables...');
      
      const tablesToSeed = [
        { tableNumber: 1, capacity: 2, isActive: true },
        { tableNumber: 2, capacity: 2, isActive: true },
        { tableNumber: 3, capacity: 4, isActive: true },
        { tableNumber: 4, capacity: 4, isActive: true },
        { tableNumber: 5, capacity: 6, isActive: true },
        { tableNumber: 6, capacity: 8, isActive: true },
      ];

      await Table.insertMany(tablesToSeed);
      console.log('Tables seeded successfully.');
    }

    // 2. Seed default users if none exist
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('No users found in database. Seeding default users...');

      // Note: passwords will be hashed by the User pre-save middleware
      await User.create({
        name: 'Default Administrator',
        email: 'admin@restaurant.com',
        password: 'Admin123!',
        role: 'admin',
      });

      await User.create({
        name: 'Default Customer',
        email: 'customer@restaurant.com',
        password: 'Customer123!',
        role: 'customer',
      });

      console.log('Default users (admin@restaurant.com / Admin123! and customer@restaurant.com / Customer123!) seeded successfully.');
    }
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
};

module.exports = seedDB;
