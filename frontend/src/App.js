import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Resources from './pages/Resources';
import Bookings from './pages/Bookings';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import Departments from './pages/Departments';
import Sessions from './pages/Sessions';
import QRScanner from './pages/QRScanner';
import AttendanceReport from './pages/AttendanceReport';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <ToastContainer 
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            pauseOnHover
            draggable
            theme="colored"
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/resources" 
              element={
                <ProtectedRoute>
                  <Resources />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/bookings" 
              element={
                <ProtectedRoute>
                  <Bookings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/sessions" 
              element={
                <ProtectedRoute>
                  <Sessions />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/scan-qr" 
              element={
                <ProtectedRoute>
                  <QRScanner />
                </ProtectedRoute>
            } 
            />
            <Route 
              path="/attendance/:sessionId" 
              element={
                <ProtectedRoute>
                  <AttendanceReport />
                </ProtectedRoute>
            } 
            />

            <Route 
              path="/departments" 
              element={
                <ProtectedRoute>
                  <Departments />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;