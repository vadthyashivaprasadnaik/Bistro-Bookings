import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' or 'tables'

  // Booking Filters
  const [filterDate, setFilterDate] = useState('');

  // Add Table Form State
  const [tableNumber, setTableNumber] = useState('');
  const [tableCapacity, setTableCapacity] = useState('');
  const [addTableError, setAddTableError] = useState('');
  const [addTableSuccess, setAddTableSuccess] = useState('');

  // Edit Reservation Modal State
  const [editingRes, setEditingRes] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editSlot, setEditSlot] = useState('');
  const [editGuests, setEditGuests] = useState('');
  const [editStatus, setEditStatus] = useState('confirmed');
  const [editError, setEditError] = useState('');

  // Fetch all reservations
  const fetchReservations = async (dateParam = '') => {
    try {
      setLoading(true);
      let url = '/api/reservations';
      if (dateParam) {
        url += `?date=${dateParam}`;
      }
      const res = await axios.get(url);
      setReservations(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch reservations.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all tables
  const fetchTables = async () => {
    try {
      setTablesLoading(true);
      const res = await axios.get('/api/tables');
      setTables(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load tables inventory.');
    } finally {
      setTablesLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
    fetchTables();
  }, []);

  // Handle Date Filter Change
  const handleDateFilterChange = (e) => {
    const dateVal = e.target.value;
    setFilterDate(dateVal);
    fetchReservations(dateVal);
  };

  const handleClearFilter = () => {
    setFilterDate('');
    fetchReservations('');
  };

  // Cancel Booking
  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await axios.delete(`/api/reservations/${id}`);
      setSuccess('Reservation successfully cancelled.');
      fetchReservations(filterDate);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to cancel reservation');
    }
  };

  // Open Edit Modal
  const openEditModal = (resv) => {
    setEditingRes(resv);
    setEditDate(resv.date);
    setEditSlot(resv.timeSlot);
    setEditGuests(resv.guests);
    setEditStatus(resv.status);
    setEditError('');
  };

  // Submit Edit Form
  const handleUpdateReservation = async (e) => {
    e.preventDefault();
    setEditError('');
    setSuccess('');

    try {
      await axios.put(`/api/reservations/${editingRes._id}`, {
        date: editDate,
        timeSlot: editSlot,
        guests: parseInt(editGuests, 10),
        status: editStatus,
      });

      setSuccess('Reservation updated successfully.');
      setEditingRes(null);
      fetchReservations(filterDate);
    } catch (err) {
      console.error(err);
      setEditError(err.response?.data?.message || 'Failed to update reservation');
    }
  };

  // Create Table
  const handleAddTable = async (e) => {
    e.preventDefault();
    setAddTableError('');
    setAddTableSuccess('');

    if (!tableNumber || !tableCapacity) {
      setAddTableError('Please specify table number and capacity');
      return;
    }

    try {
      await axios.post('/api/tables', {
        tableNumber: parseInt(tableNumber, 10),
        capacity: parseInt(tableCapacity, 10),
      });

      setAddTableSuccess(`Table ${tableNumber} created successfully.`);
      setTableNumber('');
      setTableCapacity('');
      fetchTables();
    } catch (err) {
      console.error(err);
      setAddTableError(err.response?.data?.message || 'Failed to add table');
    }
  };

  // Toggle Table Active Status
  const handleToggleTable = async (table) => {
    setError('');
    setSuccess('');
    try {
      await axios.put(`/api/tables/${table._id}`, {
        isActive: !table.isActive,
      });
      setSuccess(`Table ${table.tableNumber} status updated.`);
      fetchTables();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update table status');
    }
  };

  // Delete Table
  const handleDeleteTable = async (id, number) => {
    if (!window.confirm(`Are you sure you want to remove Table ${number}?`)) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await axios.delete(`/api/tables/${id}`);
      setSuccess(`Table ${number} deleted successfully.`);
      fetchTables();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to delete table');
    }
  };

  // Stats Calculations
  const totalBookings = reservations.length;
  const activeBookings = reservations.filter(r => r.status === 'confirmed').length;
  const cancelledBookings = reservations.filter(r => r.status === 'cancelled').length;

  return (
    <div>
      <h1 className="mb-3">Administrator Dashboard</h1>

      {/* Tabs */}
      <div className="d-flex gap-2 mb-3" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('bookings')}
          className="btn btn-secondary btn-inline"
          style={{
            borderColor: activeTab === 'bookings' ? 'var(--accent-color)' : 'var(--border-color)',
            color: activeTab === 'bookings' ? 'var(--accent-color)' : 'var(--text-secondary)',
            backgroundColor: activeTab === 'bookings' ? 'var(--accent-light)' : 'transparent',
          }}
        >
          Manage Bookings
        </button>
        <button
          onClick={() => setActiveTab('tables')}
          className="btn btn-secondary btn-inline"
          style={{
            borderColor: activeTab === 'tables' ? 'var(--accent-color)' : 'var(--border-color)',
            color: activeTab === 'tables' ? 'var(--accent-color)' : 'var(--text-secondary)',
            backgroundColor: activeTab === 'tables' ? 'var(--accent-light)' : 'transparent',
          }}
        >
          Manage Tables ({tables.length})
        </button>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* TAB 1: BOOKINGS */}
      {activeTab === 'bookings' && (
        <div>
          {/* Stats Bar */}
          <div className="stats-grid">
            <div className="stat-card">
              <div>Total Bookings (Filtered)</div>
              <div className="stat-val">{totalBookings}</div>
            </div>
            <div className="stat-card">
              <div>Confirmed</div>
              <div className="stat-val" style={{ color: 'var(--success-color)' }}>{activeBookings}</div>
            </div>
            <div className="stat-card">
              <div>Cancelled</div>
              <div className="stat-val" style={{ color: 'var(--danger-color)' }}>{cancelledBookings}</div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="d-flex justify-between align-center mb-3">
              <h3>Reservations Directory</h3>
              
              {/* Date Filter */}
              <div className="d-flex align-center gap-1" style={{ fontSize: '0.9rem' }}>
                <label htmlFor="filter-date" style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Filter Date:</label>
                <input
                  type="date"
                  id="filter-date"
                  className="form-control"
                  style={{ width: '170px', padding: '0.4rem' }}
                  value={filterDate}
                  onChange={handleDateFilterChange}
                />
                {filterDate && (
                  <button onClick={handleClearFilter} className="btn btn-secondary btn-inline" style={{ padding: '0.4rem 0.6rem' }}>
                    Clear
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <p>Loading reservations list...</p>
            ) : reservations.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No reservations found for the selected filter.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Email</th>
                      <th>Date</th>
                      <th>Time Slot</th>
                      <th>Guests</th>
                      <th>Table Assigned</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((resv) => (
                      <tr key={resv._id}>
                        <td><strong>{resv.user ? resv.user.name : 'Unknown User'}</strong></td>
                        <td>{resv.user ? resv.user.email : 'N/A'}</td>
                        <td>{resv.date}</td>
                        <td>{resv.timeSlot}</td>
                        <td className="text-center">{resv.guests}</td>
                        <td>
                          {resv.table ? `Table ${resv.table.tableNumber} (Cap: ${resv.table.capacity})` : 'N/A'}
                        </td>
                        <td>
                          <span className={`badge badge-${resv.status === 'confirmed' ? 'success' : 'danger'}`}>
                            {resv.status}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <button
                              onClick={() => openEditModal(resv)}
                              className="btn btn-secondary btn-inline"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            >
                              Edit
                            </button>
                            {resv.status === 'confirmed' && (
                              <button
                                onClick={() => handleCancelBooking(resv._id)}
                                className="btn btn-danger btn-inline"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TABLES MANAGEMENT */}
      {activeTab === 'tables' && (
        <div className="dashboard-grid">
          {/* Left Panel: Create Table */}
          <div>
            <div className="dashboard-card">
              <h3 className="mb-2">Add New Table</h3>
              
              {addTableSuccess && <div className="alert alert-success">{addTableSuccess}</div>}
              {addTableError && <div className="alert alert-danger">{addTableError}</div>}
              
              <form onSubmit={handleAddTable}>
                <div className="form-group">
                  <label htmlFor="table-num">Table Number</label>
                  <input
                    type="number"
                    id="table-num"
                    className="form-control"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="e.g. 7"
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="table-cap">Seating Capacity</label>
                  <input
                    type="number"
                    id="table-cap"
                    className="form-control"
                    value={tableCapacity}
                    onChange={(e) => setTableCapacity(e.target.value)}
                    placeholder="e.g. 4"
                    min="1"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary mt-1">
                  Add Table
                </button>
              </form>
            </div>
          </div>

          {/* Right Panel: Tables List */}
          <div>
            <div className="dashboard-card">
              <h3 className="mb-2">Tables Inventory</h3>
              {tablesLoading ? (
                <p>Loading table inventory...</p>
              ) : tables.length === 0 ? (
                <p>No tables registered in the system.</p>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Table Number</th>
                        <th>Seating Capacity</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tables.map((tbl) => (
                        <tr key={tbl._id}>
                          <td><strong>Table {tbl.tableNumber}</strong></td>
                          <td>{tbl.capacity} Guests</td>
                          <td>
                            <span className={`badge badge-${tbl.isActive ? 'success' : 'danger'}`}>
                              {tbl.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <button
                                onClick={() => handleToggleTable(tbl)}
                                className="btn btn-secondary btn-inline"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                              >
                                Toggle Status
                              </button>
                              <button
                                onClick={() => handleDeleteTable(tbl._id, tbl.tableNumber)}
                                className="btn btn-danger btn-inline"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                              >
                                Delete
                              </button>
                            </div>
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
      )}

      {/* EDIT MODAL */}
      {editingRes && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="mb-2">Edit Reservation</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Modifying booking for <strong>{editingRes.user?.name}</strong> ({editingRes.user?.email})
            </p>

            {editError && <div className="alert alert-danger">{editError}</div>}

            <form onSubmit={handleUpdateReservation}>
              <div className="form-group">
                <label htmlFor="edit-date">Date</label>
                <input
                  type="date"
                  id="edit-date"
                  className="form-control"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-slot">Time Slot</label>
                <select
                  id="edit-slot"
                  className="form-control"
                  value={editSlot}
                  onChange={(e) => setEditSlot(e.target.value)}
                  required
                >
                  <option value="12:00 - 14:00">12:00 PM - 02:00 PM</option>
                  <option value="14:00 - 16:00">02:00 PM - 04:00 PM</option>
                  <option value="18:00 - 20:00">06:00 PM - 08:00 PM</option>
                  <option value="20:00 - 22:00">08:00 PM - 10:00 PM</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit-guests">Number of Guests</label>
                <input
                  type="number"
                  id="edit-guests"
                  className="form-control"
                  value={editGuests}
                  onChange={(e) => setEditGuests(e.target.value)}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-status">Status</label>
                <select
                  id="edit-status"
                  className="form-control"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  required
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="d-flex gap-2 mt-3">
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingRes(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
