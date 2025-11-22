import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingAPI, resourceAPI } from '../services/api';
import './Bookings.css';

const Bookings = () => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    resource_id: '',
    start_time: '',
    end_time: '',
    purpose: ''
  });

  const canApprove = currentUser?.role === 'admin' || currentUser?.role === 'office_staff';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, resourcesRes] = await Promise.all([
        bookingAPI.getAll(),
        resourceAPI.getAll()
      ]);
      setBookings(bookingsRes.data);
      setResources(resourcesRes.data.filter(r => r.availability));
    } catch (error) {
      console.error('Fetch data error:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await bookingAPI.create(formData);
      alert('Booking created successfully! Awaiting approval.');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Create booking error:', error);
      alert(error.response?.data?.message || 'Failed to create booking');
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this booking?')) return;
    try {
      await bookingAPI.approve(id);
      alert('Booking approved!');
      fetchData();
    } catch (error) {
      console.error('Approve error:', error);
      alert('Failed to approve booking');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await bookingAPI.reject(id);
      alert('Booking rejected!');
      fetchData();
    } catch (error) {
      console.error('Reject error:', error);
      alert('Failed to reject booking');
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await bookingAPI.cancel(id);
      alert('Booking cancelled!');
      fetchData();
    } catch (error) {
      console.error('Cancel error:', error);
      alert('Failed to cancel booking');
    }
  };

  const resetForm = () => {
    setFormData({
      resource_id: '',
      start_time: '',
      end_time: '',
      purpose: ''
    });
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  if (loading) {
    return <div className="loading">Loading bookings...</div>;
  }

  return (
    <div className="bookings-page page-animate">
      <div className="bookings-header">
        <div>
          <h1> Bookings Management</h1>
          <p>Manage your resources bookings</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + New Booking
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={`tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({bookings.length})
        </button>
        <button 
          className={`tab ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({bookings.filter(b => b.status === 'pending').length})
        </button>
        <button 
          className={`tab ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          Approved ({bookings.filter(b => b.status === 'approved').length})
        </button>
        <button 
          className={`tab ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Rejected ({bookings.filter(b => b.status === 'rejected').length})
        </button>
      </div>

      {/* Bookings List */}
      <div className="bookings-list">
        {filteredBookings.length === 0 ? (
          <div className="no-bookings">
            <p>No bookings found</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking.booking_id} className="booking-item">
              <div className="booking-main">
                <div className="booking-info">
                  <h4>{booking.resource_name}</h4>
                  <p className="booking-meta">
                    {canApprove && <span><strong>By :</strong> {booking.user_name}</span>}
                  </p>
                  <p className="booking-time">
                    <strong>Start Time :</strong> {new Date(booking.start_time).toLocaleString()} 
                    <br />
                    <strong>End Time :</strong> {new Date(booking.end_time).toLocaleString()}
                  </p>
                  {booking.purpose && (
                    <p className="booking-purpose">
                      <strong>Purpose :</strong> {booking.purpose}
                    </p>
                  )}
                </div>
                <span className={`status-badge ${booking.status}`}>
                  {booking.status}
                </span>
              </div>

              <div className="booking-actions">
                {canApprove && booking.status === 'pending' && (
                  <>
                    <button 
                      className="btn-approve"
                      onClick={() => handleApprove(booking.booking_id)}
                    >
                      Approve
                    </button>
                    <button 
                      className="btn-reject"
                      onClick={() => handleReject(booking.booking_id)}
                    >
                      Reject
                    </button>
                  </>
                )}
                {!canApprove && booking.status === 'pending' && (
                  <button 
                    className="btn-cancel"
                    onClick={() => handleCancel(booking.booking_id)}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Booking Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Booking</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="booking-form">
              <div className="form-group">
                <label>Select Resource *</label>
                <select
                  value={formData.resource_id}
                  onChange={(e) => setFormData({ ...formData, resource_id: e.target.value })}
                  required
                >
                  <option value="">Choose a resource...</option>
                  {resources.map((resource) => (
                    <option key={resource.resource_id} value={resource.resource_id}>
                      {resource.name} - {resource.location} ({resource.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Start Date & Time *</label>
                <input
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="form-group">
                <label>End Date & Time *</label>
                <input
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                  min={formData.start_time || new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="form-group">
                <label>Purpose</label>
                <textarea
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  rows="3"
                  placeholder="Enter the purpose of this booking..."
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel-modal" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;