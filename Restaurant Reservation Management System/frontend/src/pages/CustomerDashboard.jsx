import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CustomerDashboard = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('12:00 - 14:00');
  const [guests, setGuests] = useState(2);

  // Today's date string for HTML5 input min limit
  const todayStr = new Date().toISOString().split('T')[0];

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/reservations');
      setReservations(res.data);
    } catch (err) {
      console.error(err);
      setError('Could not load reservations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleBookTable = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!date || !timeSlot || !guests) {
      setError('Please fill in all booking fields');
      return;
    }

    if (guests <= 0) {
      setError('Guests count must be greater than zero');
      return;
    }

    try {
      setSubmitLoading(true);
      const res = await axios.post('/api/reservations', {
        date,
        timeSlot,
        guests: parseInt(guests, 10),
      });

      setSuccess(`Table booked successfully! You are assigned Table ${res.data.table.tableNumber} (Capacity: ${res.data.table.capacity}).`);
      
      // Reset form fields
      setDate('');
      setTimeSlot('12:00 - 14:00');
      setGuests(2);
      
      // Refresh list
      fetchReservations();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to complete booking. No tables might be available.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await axios.delete(`/api/reservations/${id}`);
      setSuccess('Reservation cancelled successfully.');
      fetchReservations();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to cancel reservation');
    }
  };

  return (
    <div>
      <h1 className="mb-3">Customer Reservation System</h1>
      
      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="dashboard-grid">
        {/* Left Column: Book Table Form */}
        <div>
          <div className="dashboard-card">
            <h3 className="mb-2">Book a Table</h3>
            <form onSubmit={handleBookTable}>
              <div className="form-group">
                <label htmlFor="booking-date">Reservation Date</label>
                <input
                  type="date"
                  id="booking-date"
                  className="form-control"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={todayStr}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="booking-slot">Select Time Slot</label>
                <select
                  id="booking-slot"
                  className="form-control"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  required
                >
                  <option value="12:00 - 14:00">12:00 PM - 02:00 PM (Lunch)</option>
                  <option value="14:00 - 16:00">02:00 PM - 04:00 PM (Late Lunch)</option>
                  <option value="18:00 - 20:00">06:00 PM - 08:00 PM (Dinner)</option>
                  <option value="20:00 - 22:00">08:00 PM - 10:00 PM (Late Dinner)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="booking-guests">Number of Guests</label>
                <input
                  type="number"
                  id="booking-guests"
                  className="form-control"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  min="1"
                  max="12"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary mt-1"
                disabled={submitLoading}
              >
                {submitLoading ? 'Reserving...' : 'Book Now'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Reservation List */}
        <div>
          <div className="dashboard-card" style={{ height: '100%' }}>
            <h3 className="mb-2">My Reservations</h3>
            
            {loading ? (
              <p>Loading your reservations...</p>
            ) : reservations.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>You have no reservations booked.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time Slot</th>
                      <th>Guests</th>
                      <th>Assigned Table</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((resv) => (
                      <tr key={resv._id}>
                        <td>{resv.date}</td>
                        <td>{resv.timeSlot}</td>
                        <td className="text-center">{resv.guests}</td>
                        <td>
                          Table {resv.table ? resv.table.tableNumber : 'N/A'} (Cap: {resv.table ? resv.table.capacity : 'N/A'})
                        </td>
                        <td>
                          <span className={`badge badge-${resv.status === 'confirmed' ? 'success' : 'danger'}`}>
                            {resv.status}
                          </span>
                        </td>
                        <td>
                          {resv.status === 'confirmed' ? (
                            <button
                              onClick={() => handleCancelBooking(resv._id)}
                              className="btn btn-danger btn-inline"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              Cancel
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
