const Table = require('../models/Table');

// @desc    Get all tables
// @route   GET /api/tables
// @access  Private
exports.getTables = async (req, res, next) => {
  try {
    // If admin, show all. If customer, only show active tables.
    const filter = req.user.role === 'admin' ? {} : { isActive: true };
    const tables = await Table.find(filter).sort({ tableNumber: 1 });
    res.json(tables);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a table
// @route   POST /api/tables
// @access  Private/Admin
exports.createTable = async (req, res, next) => {
  try {
    const { tableNumber, capacity, isActive } = req.body;

    // Check if table number exists
    const tableExists = await Table.findOne({ tableNumber });
    if (tableExists) {
      return res.status(400).json({ message: `Table number ${tableNumber} already exists` });
    }

    const table = await Table.create({
      tableNumber,
      capacity,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json(table);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a table
// @route   PUT /api/tables/:id
// @access  Private/Admin
exports.updateTable = async (req, res, next) => {
  try {
    const { tableNumber, capacity, isActive } = req.body;

    let table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check if duplicate tableNumber
    if (tableNumber && tableNumber !== table.tableNumber) {
      const tableExists = await Table.findOne({ tableNumber });
      if (tableExists) {
        return res.status(400).json({ message: `Table number ${tableNumber} already exists` });
      }
    }

    table.tableNumber = tableNumber !== undefined ? tableNumber : table.tableNumber;
    table.capacity = capacity !== undefined ? capacity : table.capacity;
    table.isActive = isActive !== undefined ? isActive : table.isActive;

    const updatedTable = await table.save();
    res.json(updatedTable);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a table
// @route   DELETE /api/tables/:id
// @access  Private/Admin
exports.deleteTable = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Optional check: are there active reservations for this table?
    // Let's import Reservation here to check
    const Reservation = require('../models/Reservation');
    const activeBooking = await Reservation.findOne({ table: table._id, status: 'confirmed' });
    if (activeBooking) {
      return res.status(400).json({
        message: 'Cannot delete table. There are active reservations associated with this table.'
      });
    }

    await Table.findByIdAndDelete(req.params.id);
    res.json({ message: 'Table removed' });
  } catch (error) {
    next(error);
  }
};
