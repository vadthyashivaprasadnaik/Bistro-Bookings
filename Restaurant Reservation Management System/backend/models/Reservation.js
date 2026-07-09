const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: true,
    },
    date: {
      type: String, // Stored as YYYY-MM-DD
      required: [true, 'Please add a reservation date'],
    },
    timeSlot: {
      type: String,
      required: [true, 'Please add a time slot'],
      enum: [
        '12:00 - 14:00',
        '14:00 - 16:00',
        '18:00 - 20:00',
        '20:00 - 22:00'
      ],
    },
    guests: {
      type: Number,
      required: [true, 'Please add the number of guests'],
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Reservation', reservationSchema);
