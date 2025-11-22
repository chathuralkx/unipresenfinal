import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { sessionAPI } from '../services/api';
import { toast } from 'react-toastify';
import './AttendanceReport.css';

const AttendanceReport = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [sessionId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionRes, attendanceRes] = await Promise.all([
        sessionAPI.getById(sessionId),
        sessionAPI.getSessionAttendance(sessionId)
      ]);
      setSession(sessionRes.data);
      setAttendance(attendanceRes.data);
    } catch (error) {
      console.error('Fetch attendance error:', error);
      toast.error('Failed to load attendance report');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Student Name', 'Email', 'Status', 'Marked At'];
    const rows = attendance.map(a => [
      a.student_name,
      a.student_email,
      a.status,
      new Date(a.marked_at).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${session?.title}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return <div className="loading">Loading attendance report...</div>;
  }

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const lateCount = attendance.filter(a => a.status === 'late').length;
  const totalStudents = attendance.length;
  const attendanceRate = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) : 0;

  return (
    <div className="attendance-report-page page-animate">
      <div className="report-header">
        <div>
          <h1>Attendance Report</h1>
          <h2>{session?.title}</h2>
          <p className="session-details">
            {session?.course_code} • {new Date(session?.start_time).toLocaleDateString()}
          </p>
        </div>
        <div className="report-actions">
          <button className="btn-export" onClick={exportToCSV}>
            Export CSV
          </button>
          <button className="btn-print" onClick={printReport}>
            Print
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="attendance-stats">
        <div className="stat-box present">
          <div className="stat-number">{presentCount}</div>
          <div className="stat-label">Present</div>
        </div>
        <div className="stat-box late">
          <div className="stat-number">{lateCount}</div>
          <div className="stat-label">Late</div>
        </div>
        <div className="stat-box total">
          <div className="stat-number">{totalStudents}</div>
          <div className="stat-label">Total Attended</div>
        </div>
        <div className="stat-box rate">
          <div className="stat-number">{attendanceRate}%</div>
          <div className="stat-label">Attendance Rate</div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="attendance-table-container">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Time Marked</th>
            </tr>
          </thead>
          <tbody>
            {attendance.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                  No attendance records yet
                </td>
              </tr>
            ) : (
              attendance.map((record, index) => (
                <tr key={record.attendance_id}>
                  <td>{index + 1}</td>
                  <td>{record.student_name}</td>
                  <td>{record.student_email}</td>
                  <td>
                    <span className={`status-badge ${record.status}`}>
                      {record.status === 'present' ? '✅' : '⏰'} {record.status.toUpperCase()}
                    </span>
                  </td>
                  <td>{new Date(record.marked_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceReport;