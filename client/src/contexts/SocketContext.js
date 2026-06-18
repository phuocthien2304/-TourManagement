import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const newSocket = io("http://localhost:5000", {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    return () => {
      console.log("[CLIENT LOG]: Disconnecting socket on unmount.");
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && user) {
      console.log("[CLIENT LOG]: User available:", { userId: user.id, role: user.role });
      socket.emit("addUser", { userId: user.id, role: user.role });

      socket.on("connect", () => {
        console.log("[CLIENT LOG]: Socket connected! Emitting 'addUser' to server.");
        socket.emit("addUser", { userId: user.id, role: user.role });
      });

      // Lắng nghe getNotification cho admin/employee
      if (user.role === 'admin') {
        socket.on('getNotification', (notification) => {
          console.log("[CLIENT LOG]: Received getNotification:", notification);
          if (notification.type === 'new_booking') {
            toast.info(
              <div>
                <p><strong>Thông báo mới!</strong></p>
                <p>{notification.data.message}</p>
              </div>,
              {
                toastId: notification.data.bookingId,
                autoClose: 5000,
              }
            );
          }
        });
      }
    } else if (socket && !user) {
      console.log("[CLIENT LOG]: No user, clearing socket user data.");
      socket.emit("removeUser", socket.id);
    }

    // Cleanup sự kiện getNotification
    return () => {
      if (socket) {
        socket.off('getNotification');
      }
    };
  }, [socket, user]);

  useEffect(() => {
    if (socket && user) {
      console.log("[CLIENT LOG]: User available:", { userId: user.id, role: user.role });
      socket.emit("addUser", { userId: user.id, role: user.role });

      socket.on("connect", () => {
        console.log("[CLIENT LOG]: Socket connected! Emitting 'addUser' to server.");
        socket.emit("addUser", { userId: user.id, role: user.role });
      });

      // Lắng nghe getNotification cho admin/employee
      if (user.role === 'customer') {
        socket.on('getNotification', (notification) => {
          console.log("[CLIENT LOG]: Received getNotification:", notification);
          if (notification.type === 'new_booking') {
            toast.info(
              <div>
                <p><strong>Thông báo mới!</strong></p>
                <p>{notification.data.message}</p>
              </div>,
              {
                toastId: notification.data.bookingId,
                autoClose: 5000,
              }
            );
          }
        });
      }
    } else if (socket && !user) {
      console.log("[CLIENT LOG]: No user, clearing socket user data.");
      socket.emit("removeUser", socket.id);
    }

    // Cleanup sự kiện getNotification
    return () => {
      if (socket) {
        socket.off('getNotification');
      }
    };
  }, [socket, user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};