
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext'; // <-- Import SocketProvider
import { ToastContainer } from 'react-toastify'; // <-- Import ToastContainer
import 'react-toastify/dist/ReactToastify.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider> {/* <-- Bọc App bằng SocketProvider */}
        <App />
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} /> {/* <-- Thêm container cho toast */}
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>
);