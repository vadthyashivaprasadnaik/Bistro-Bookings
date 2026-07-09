const express = require('express');
const router = express.Router();
const {
  getReservations,
  createReservation,
  updateReservation,
  cancelReservation,
} = require('../controllers/reservationController');
const { protect } = require('../middleware/authMiddleware');

// All reservation routes require a logged-in user
router.use(protect);

router
  .route('/')
  .get(getReservations)
  .post(createReservation);

router
  .route('/:id')
  .put(updateReservation)
  .delete(cancelReservation); // Changes status to cancelled

module.exports = router;
