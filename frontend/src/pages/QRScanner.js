import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { sessionAPI } from '../services/api';
import { toast } from 'react-toastify';
import './QRScanner.css';
import { FaCamera } from 'react-icons/fa';

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanner]);

  const startScanning = () => {
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    );

    html5QrcodeScanner.render(onScanSuccess, onScanError);
    setScanner(html5QrcodeScanner);
    setScanning(true);
  };

  const onScanSuccess = async (decodedText) => {
    try {
      // Stop scanning
      if (scanner) {
        scanner.clear();
      }
      setScanning(false);

      // Mark attendance
      const response = await sessionAPI.markAttendance(decodedText);
      
      toast.success(` ${response.data.message}`, {
        autoClose: 5000,
      });

      // Show session details
      const session = response.data.session;
      toast.info(`${session.title} (${session.course_code})`, {
        autoClose: 5000,
      });

    } catch (error) {
      console.error('Mark attendance error:', error);
      const message = error.response?.data?.message || 'Failed to mark attendance';
      toast.error(message);
      
      // Restart scanner after error
      setTimeout(() => {
        startScanning();
      }, 2000);
    }
  };

  const onScanError = (error) => {
    // Ignore common scanning errors
    if (error && !error.includes('NotFoundException')) {
      console.warn('QR Scan Error:', error);
    }
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.clear();
      setScanning(false);
    }
  };

  return (
    <div className="qr-scanner-page page-animate">
      <div className="scanner-header">
        <h1>Scan QR Code</h1>
        <p>Scan the QR code displayed by your lecturer to mark attendance</p>
      </div>

      <div className="scanner-container">
        {!scanning ? (
          <div className="start-screen">
            <div className="scan-icon">
                <FaCamera/>
            </div>
            <h2>Ready to Scan</h2>
            <p>Click the button below to start scanning</p>
            <button className="btn-start-scan" onClick={startScanning}>
              Start Scanning
            </button>
            
            <div className="instructions">
              <h3>Instructions:</h3>
              <ul>
                <li>Make sure you're in the correct lecture/lab</li>
                <li>Allow camera access when prompted</li>
                <li>Point your camera at the QR code</li>
                <li>Scan within the session time to mark attendance</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="scanning-screen">
            <div id="qr-reader"></div>
            <button className="btn-stop-scan" onClick={stopScanning}>
              Stop Scanning
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;