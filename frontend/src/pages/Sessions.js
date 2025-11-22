import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sessionAPI, resourceAPI } from '../services/api';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'react-toastify';
import './Sessions.css';

const Sessions = () => {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_code: '',
    venue_id: '',
    start_time: '',
    end_time: ''
  });

  const canManage = currentUser?.role === 'lecturer' || currentUser?.role === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, resourcesRes] = await Promise.all([
        sessionAPI.getAll(),
        resourceAPI.getAll()
      ]);
      setSessions(sessionsRes.data);
      setResources(resourcesRes.data);
    } catch (error) {
      console.error('Fetch data error:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await sessionAPI.create(formData);
      toast.success('Session created successfully with QR code!');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Create session error:', error);
      toast.error(error.response?.data?.message || 'Failed to create session');
    }
  };

  const handleShowQR = async (session) => {
    try {
      const response = await sessionAPI.getById(session.session_id);
      setSelectedSession(response.data);
      setShowQRModal(true);
    } catch (error) {
      console.error('Get session error:', error);
      toast.error('Failed to load QR code');
    }
  };

  const handleViewAttendance = (sessionId) => {
    window.location.href = `/attendance/${sessionId}`;
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      course_code: '',
      venue_id: '',
      start_time: '',
      end_time: ''
    });
  };

  const downloadQR = () => {
    const canvas = document.getElementById('qr-code-canvas');
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `QR-${selectedSession.title}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  if (loading) {
    return <div className="loading">Loading sessions...</div>;
  }

  return (
    <div className="sessions-page page-animate">
      <div className="sessions-header">
        <div>
          <h1>Sessions & Attendance</h1>
          <p>Manage lecture sessions and track attendance with QR codes</p>
        </div>
        {canManage && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Create New Session
          </button>
        )}
      </div>

      {/* Sessions List */}
      <div className="sessions-grid">
        {sessions.length === 0 ? (
          <div className="no-sessions">
            <p>No sessions found</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.session_id} className="session-card">
              <div className="session-header">
                <h3>{session.title}</h3>
                <span className="course-badge">{session.course_code}</span>
              </div>

              <div className="session-info">
                <p><strong>Lecturer :</strong> {session.lecturer_name}</p>
                <p><strong>Venue :</strong> {session.venue_name || 'Online'}</p>
                <p><strong>Date :</strong> {new Date(session.start_time).toLocaleString()}</p>
                <p><strong>Duration :</strong> {new Date(session.start_time).toLocaleTimeString()} - {new Date(session.end_time).toLocaleTimeString()}</p>
                {session.description && (
                  <p><strong>Description :</strong> {session.description}</p>
                )}
              </div>

              {/* Student view - show if attended */}
              {currentUser?.role === 'student' && (
                <div className="attendance-status">
                  {session.attendance_status ? (
                    <span className={`status-badge ${session.attendance_status}`}>
                      ✅ {session.attendance_status.toUpperCase()}
                    </span>
                  ) : (
                    <span className="status-badge absent">
                       Not Marked
                    </span>
                  )}
                </div>
              )}

              {/* Lecturer view - show QR and attendance buttons */}
              {canManage && (
                <div className="session-actions">
                  <button 
                    className="btn-qr"
                    onClick={() => handleShowQR(session)}
                  >
                     Show QR Code
                  </button>
                  <button 
                    className="btn-attendance"
                    onClick={() => handleViewAttendance(session.session_id)}
                  >
                    View Attendance
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Session Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Session</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="session-form">
              <div className="form-group">
                <label>Session Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Data Structures Lecture 01"
                />
              </div>

              <div className="form-group">
                <label>Course Code *</label>
                <input
                  type="text"
                  value={formData.course_code}
                  onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                  required
                  placeholder="e.g., CS101"
                />
              </div>

              <div className="form-group">
                <label>Venue</label>
                <select
                  value={formData.venue_id}
                  onChange={(e) => setFormData({ ...formData, venue_id: e.target.value })}
                >
                  <option value="">Select venue (optional)</option>
                  {resources.map((resource) => (
                    <option key={resource.resource_id} value={resource.resource_id}>
                      {resource.name} - {resource.location}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Time *</label>
                  <input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  placeholder="Brief description of the session..."
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create Session & Generate QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedSession && (
        <div className="modal-overlay" onClick={() => setShowQRModal(false)}>
          <div className="modal-content qr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>QR Code - {selectedSession.title}</h2>
              <button className="close-btn" onClick={() => setShowQRModal(false)}>×</button>
            </div>

            <div className="qr-content">
              <div className="qr-info">
                <h3>{selectedSession.title}</h3>
                <p><strong>Course:</strong> {selectedSession.course_code}</p>
                <p><strong>Time:</strong> {new Date(selectedSession.start_time).toLocaleString()}</p>
                <p className="scan-instruction">
                  Scan the QR code to mark your attendance
                </p>
              </div>

              <div className="qr-code-container">
                <QRCodeCanvas
                    id="qr-code-canvas"
                    value={selectedSession.qr_code}
                    size={300}
                    level="H"
                    includeMargin ={true}
                />
              </div>

              <div className="qr-actions">
                <button className="btn-download" onClick={downloadQR}>
                  Download QR Code
                </button>
                <button className="btn-print" onClick={() => window.print()}>
                  Print QR Code
                </button>
              </div>

              <div className="qr-expiry">
                QR Code expires at: {new Date(selectedSession.qr_expires_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sessions;