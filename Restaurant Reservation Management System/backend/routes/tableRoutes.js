const express = require('express');
const router = express.Router();
const {
  getTables,
  createTable,
  updateTable,
  deleteTable,
} = require('../controllers/tableController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All table routes are private (require login)
router.use(protect);

router
  .route('/')
  .get(getTables)
  .post(authorize('admin'), createTable);

router
  .route('/:id')
  .put(authorize('admin'), updateTable)
  .delete(authorize('admin'), deleteTable);

module.exports = router;
