const request = require('supertest');
const mongoose = require('mongoose');
const startServer = require('../server');
const User = require('../models/User');
const Table = require('../models/Table');
const Reservation = require('../models/Reservation');

let appInstance;
let serverInstance;
let customerToken;
let secondCustomerToken;
let adminToken;
let customerId;
let secondCustomerId;

beforeAll(async () => {
  // Start the server (which connects to MongoMemoryServer and seeds default tables/users)
  const { app, server } = await startServer();
  appInstance = app;
  serverInstance = server;

  // Let's retrieve tokens for our seeded users
  // 1. Admin login
  const adminRes = await request(appInstance)
    .post('/api/auth/login')
    .send({
      email: 'admin@restaurant.com',
      password: 'Admin123!',
    });
  adminToken = adminRes.body.token;

  // 2. Customer login
  const custRes = await request(appInstance)
    .post('/api/auth/login')
    .send({
      email: 'customer@restaurant.com',
      password: 'Customer123!',
    });
  customerToken = custRes.body.token;
  customerId = custRes.body._id;

  // 3. Register a second customer for testing conflicts
  const secondCustRes = await request(appInstance)
    .post('/api/auth/register')
    .send({
      name: 'Second Customer',
      email: 'customer2@restaurant.com',
      password: 'Customer123!',
      role: 'customer',
    });
  secondCustomerToken = secondCustRes.body.token;
  secondCustomerId = secondCustRes.body._id;
});

afterAll(async () => {
  // Disconnect mongoose and stop server
  await mongoose.connection.close();
  await new Promise((resolve) => serverInstance.close(resolve));
});

describe('Reservation System API Tests', () => {
  beforeEach(async () => {
    // Clear reservations before each test to start clean
    await Reservation.deleteMany({});
  });

  test('Should block creating a reservation for past dates', async () => {
    const res = await request(appInstance)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        date: '2020-01-01', // definitely in the past
        timeSlot: '18:00 - 20:00',
        guests: 2
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('past dates');
  });

  test('Should block creating a reservation if party exceeds maximum capacity of any table', async () => {
    const res = await request(appInstance)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        date: '2028-10-10',
        timeSlot: '18:00 - 20:00',
        guests: 15 // Largest table is capacity 8
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('accommodate');
  });

  test('Should auto-allocate the smallest sufficient table', async () => {
    // Booking for 2 guests. Available tables with capacity >= 2 are:
    // Table 1 (cap 2), Table 2 (cap 2), Table 3 (cap 4), Table 4 (cap 4), Table 5 (cap 6), Table 6 (cap 8).
    // Sorted by capacity, Table 1 should be selected first.
    const res = await request(appInstance)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        date: '2028-10-10',
        timeSlot: '18:00 - 20:00',
        guests: 2
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('table');
    expect(res.body.table.tableNumber).toBe(1); // Smallest table should be allocated
  });

  test('Should prevent double booking a table and fall back to next available table', async () => {
    // 1st Booking for 2 guests on 2028-10-10, 18:00 - 20:00. This should allocate Table 1 (cap 2).
    const res1 = await request(appInstance)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        date: '2028-10-10',
        timeSlot: '18:00 - 20:00',
        guests: 2
      });
    expect(res1.body.table.tableNumber).toBe(1);

    // 2nd Booking for 2 guests on 2028-10-10, 18:00 - 20:00 (same date and slot).
    // Table 1 is busy. It should allocate Table 2 (cap 2).
    const res2 = await request(appInstance)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${secondCustomerToken}`)
      .send({
        date: '2028-10-10',
        timeSlot: '18:00 - 20:00',
        guests: 2
      });
    expect(res2.statusCode).toBe(201);
    expect(res2.body.table.tableNumber).toBe(2);

    // 3rd Booking for 2 guests on 2028-10-10, 18:00 - 20:00.
    // Table 1 & 2 (cap 2) are busy. It should fall back to Table 3 (cap 4) since it has capacity >= 2.
    const res3 = await request(appInstance)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        date: '2028-10-10',
        timeSlot: '18:00 - 20:00',
        guests: 2
      });
    expect(res3.statusCode).toBe(201);
    expect(res3.body.table.tableNumber).toBe(3);
  });

  test('Should reject booking when all suitable tables are fully booked', async () => {
    // We have:
    // Two 2-cap tables (Table 1, 2)
    // Two 4-cap tables (Table 3, 4)
    // One 6-cap table (Table 5)
    // One 8-cap table (Table 6)
    //
    // Let's book a large party of 8. Table 6 is the only table of capacity >= 8.
    const res1 = await request(appInstance)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        date: '2028-10-10',
        timeSlot: '18:00 - 20:00',
        guests: 8
      });
    expect(res1.statusCode).toBe(201);
    expect(res1.body.table.tableNumber).toBe(6);

    // Now try booking another party of 8 (or 7) for the same date/slot.
    // Since Table 6 is the only suitable table and it is already booked, this should fail.
    const res2 = await request(appInstance)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${secondCustomerToken}`)
      .send({
        date: '2028-10-10',
        timeSlot: '18:00 - 20:00',
        guests: 7
      });
    expect(res2.statusCode).toBe(400);
    expect(res2.body.message).toContain('No tables of sufficient capacity are available');
  });

  test('Should restrict viewing all bookings to Admins', async () => {
    // Insert a reservation first
    await request(appInstance)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        date: '2028-10-10',
        timeSlot: '18:00 - 20:00',
        guests: 2
      });

    // Customer tries to list reservations
    const customerListRes = await request(appInstance)
      .get('/api/reservations')
      .set('Authorization', `Bearer ${customerToken}`);
    
    // Customer should only see their own (1 reservation)
    expect(customerListRes.statusCode).toBe(200);
    expect(customerListRes.body.length).toBe(1);

    // Second Customer tries to list reservations
    const customer2ListRes = await request(appInstance)
      .get('/api/reservations')
      .set('Authorization', `Bearer ${secondCustomerToken}`);
    
    // Customer 2 should see 0 reservations
    expect(customer2ListRes.statusCode).toBe(200);
    expect(customer2ListRes.body.length).toBe(0);

    // Admin tries to list reservations
    const adminListRes = await request(appInstance)
      .get('/api/reservations')
      .set('Authorization', `Bearer ${adminToken}`);
    
    // Admin should see all reservations
    expect(adminListRes.statusCode).toBe(200);
    expect(adminListRes.body.length).toBe(1);
    expect(adminListRes.body[0].user.name).toBe('Default Customer');
  });
});
