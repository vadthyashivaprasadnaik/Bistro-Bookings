const Reservation = require('../models/Reservation');
const Table = require('../models/Table');

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Private
exports.getReservations = async (req, res, next) => {
  try {
    let query = {};

    // Customers can only see their own reservations
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    } else {
      // Admins can filter by date if provided
      if (req.query.date) {
        query.date = req.query.date;
      }
    }

    const reservations = await Reservation.find(query)
      .populate('user', 'name email role')
      .populate('table', 'tableNumber capacity')
      .sort({ date: 1, timeSlot: 1 });

    res.json(reservations);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a reservation
// @route   POST /api/reservations
// @access  Private
exports.createReservation = async (req, res, next) => {
  try {
    const { date, timeSlot, guests } = req.body;

    if (!date || !timeSlot || !guests) {
      return res.status(400).json({ message: 'Please provide date, time slot, and number of guests' });
    }

    const guestCount = parseInt(guests, 10);
    if (isNaN(guestCount) || guestCount <= 0) {
      return res.status(400).json({ message: 'Number of guests must be a valid positive integer' });
    }

    // Date validation - check if date format is YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ message: 'Date must be in YYYY-MM-DD format' });
    }

    // Prevent bookings in the past (based on date comparison at midnight local time)
    const todayStr = new Date().toISOString().split('T')[0];
    if (date < todayStr) {
      return res.status(400).json({ message: 'Reservations cannot be made for past dates' });
    }

    // 1. Fetch active tables that can fit the party
    const candidateTables = await Table.find({
      isActive: true,
      capacity: { $gte: guestCount }
    }).sort({ capacity: 1 }); // Sort ascending to choose the smallest suitable table first

    if (candidateTables.length === 0) {
      return res.status(400).json({
        message: `No tables are available that can accommodate a party of ${guestCount} guests.`
      });
    }

    // 2. Find tables already reserved for the same date and time slot
    const activeReservations = await Reservation.find({
      date,
      timeSlot,
      status: 'confirmed'
    });

    const bookedTableIds = activeReservations.map(resv => resv.table.toString());

    // 3. Find the first candidate table that is NOT booked
    const availableTable = candidateTables.find(table => !bookedTableIds.includes(table._id.toString()));

    if (!availableTable) {
      return res.status(400).json({
        message: 'No tables of sufficient capacity are available for the selected date and time slot.'
      });
    }

    // 4. Create the reservation
    const reservation = await Reservation.create({
      user: req.user._id,
      table: availableTable._id,
      date,
      timeSlot,
      guests: guestCount,
      status: 'confirmed'
    });

    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('user', 'name email')
      .populate('table', 'tableNumber capacity');

    res.status(201).json(populatedReservation);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a reservation (Admin only or Owner)
// @route   PUT /api/reservations/:id
// @access  Private
exports.updateReservation = async (req, res, next) => {
  try {
    const { date, timeSlot, guests, status } = req.body;
    let reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Authorization check: Only Admin or the owner can update
    if (req.user.role !== 'admin' && reservation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this reservation' });
    }

    // Customers can only cancel or update details of their own confirmed reservations
    // Admins can update any details including status

    const newDate = date || reservation.date;
    const newTimeSlot = timeSlot || reservation.timeSlot;
    const newGuests = guests ? parseInt(guests, 10) : reservation.guests;
    const newStatus = status || reservation.status;

    if (newGuests <= 0) {
      return res.status(400).json({ message: 'Number of guests must be a valid positive integer' });
    }

    let assignedTableId = reservation.table;

    // Re-check table availability if date, timeslot, or guest count changed, OR if status is changed back to confirmed
    const detailsChanged =
      newDate !== reservation.date ||
      newTimeSlot !== reservation.timeSlot ||
      newGuests !== reservation.guests ||
      (newStatus === 'confirmed' && reservation.status === 'cancelled');

    if (detailsChanged && newStatus === 'confirmed') {
      // Find candidate tables
      const candidateTables = await Table.find({
        isActive: true,
        capacity: { $gte: newGuests }
      }).sort({ capacity: 1 });

      if (candidateTables.length === 0) {
        return res.status(400).json({
          message: `No active tables can accommodate ${newGuests} guests.`
        });
      }

      // Find other active reservations (excluding the current one) during this slot
      const otherReservations = await Reservation.find({
        _id: { $ne: reservation._id },
        date: newDate,
        timeSlot: newTimeSlot,
        status: 'confirmed'
      });

      const bookedTableIds = otherReservations.map(resv => resv.table.toString());

      // Find first free table
      const availableTable = candidateTables.find(table => !bookedTableIds.includes(table._id.toString()));

      if (!availableTable) {
        return res.status(400).json({
          message: 'No tables of sufficient capacity are available for the new date and time slot.'
        });
      }

      assignedTableId = availableTable._id;
    }

    // Update fields
    reservation.date = newDate;
    reservation.timeSlot = newTimeSlot;
    reservation.guests = newGuests;
    reservation.status = newStatus;
    reservation.table = assignedTableId;

    const updatedReservation = await reservation.save();

    const populated = await Reservation.findById(updatedReservation._id)
      .populate('user', 'name email role')
      .populate('table', 'tableNumber capacity');

    res.json(populated);
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a reservation
// @route   DELETE /api/reservations/:id
// @access  Private
exports.cancelReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Authorization check: Only Admin or the owner can cancel
    if (req.user.role !== 'admin' && reservation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this reservation' });
    }

    // Change status to cancelled
    reservation.status = 'cancelled';
    await reservation.save();

    res.json({ message: 'Reservation successfully cancelled', reservation });
  } catch (error) {
    next(error);
  }
};
