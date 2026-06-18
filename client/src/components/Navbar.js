"use client"

import { useState, useEffect, useRef } from "react"
import { Navbar, Nav, Container, Button } from "react-bootstrap"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { useSocket } from "../contexts/SocketContext"
import { toast } from "react-toastify"
import { FaBell } from "react-icons/fa"
import { getNotifications, markNotificationAsRead } from "../services/api"
import "./Navbar.css"

const NavigationBar = () => {
  const { user, logout } = useAuth()
  const socket = useSocket()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  // Calculate unread count from notifications array
  const unreadCount = notifications.filter((n) => !n.read).length

  // Fetch notifications when user logs in
  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const data = await getNotifications()
          setNotifications(data || []) // Ensure data is an array
        } catch (error) {
          console.error("Không thể tải thông báo:", error)
          setNotifications([]) // Set empty array on error
        }
      }
      fetchNotifications()
    } else {
      setNotifications([]) // Clear notifications on logout
    }
  }, [user])

  // Socket listener for real-time notifications
  useEffect(() => {
    if (socket && user) {
      const handleNotification = (notification) => {
        console.log("Received a notification:", notification)

        if (notification.type === "booking_status_update" && notification.data) {
          // Show toast notification
          toast.info(notification.data.message)

          // Add new notification to the beginning of the list
          setNotifications((prev) => [notification.data, ...prev])
        }
      }

      socket.on("getNotification", handleNotification)

      // Cleanup listener on unmount
      return () => {
        socket.off("getNotification", handleNotification)
      }
    }
  }, [socket, user])

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleNotificationClick = async (notification) => {
    try {
      // Check if notification has a valid ID before trying to mark as read
      if (notification && notification._id && !notification.read) {
        await markNotificationAsRead(notification._id)
        setNotifications((prev) => prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n)))
      }
      setShowDropdown(false)

      // Navigate to notification link if it exists
      if (notification && notification.link) {
        navigate(notification.link)
      }
    } catch (error) {
      console.error("Lỗi khi xử lý thông báo:", error)
      toast.error("Không thể xử lý thông báo")
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  return (
    <Navbar bg="primary" variant="dark" expand="lg" className="mb-4 fixed-top">
      <Container>
        <Navbar.Brand as={Link} to="/">
          TVMTravel
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">
              Trang chủ
            </Nav.Link>
            <Nav.Link as={Link} to="/tours">
              Tours
            </Nav.Link>
          </Nav>

          <Nav className="align-items-center">
            {user ? (
              <>
                {/* Role-based navigation */}
                {user.role === "customer" ? (
                  <Nav.Link as={Link} to="/bookings">
                    Lịch sử Booking
                  </Nav.Link>
                ) : (
                  <Nav.Link as={Link} to="/#">
                  </Nav.Link>
                )}

                {/* Admin link */}
                {user.role === "admin" && (
                  <Nav.Link as={Link} to="/admin">
                    Quản trị
                  </Nav.Link>
                )}

                {/* Notification Bell */}
                <div className="notification-wrapper me-3" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="notification-bell"
                    aria-label="Thông báo"
                  >
                    <FaBell size={20} />
                    {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                  </button>
                  {showDropdown && (
                    <div className="notification-dropdown">
                      <div className="notification-header">
                        <h6>Thông báo</h6>
                        {unreadCount > 0 && <small>{unreadCount} chưa đọc</small>}
                      </div>
                      <div className="notification-list">
                        {notifications.length > 0 ? (
                          notifications.slice(0, 10).map((n, index) => (
                            <div
                              key={n._id || index}
                              className={`notification-item ${n.read ? "read" : "unread"}`}
                              onClick={() => handleNotificationClick(n)}
                            >
                              <p className="notification-message">{n.message}</p>
                              <small className="notification-time">
                                {n.createdAt ? new Date(n.createdAt).toLocaleString("vi-VN") : "Vừa xong"}
                              </small>
                            </div>
                          ))
                        ) : (
                          <div className="notification-item no-notifications">Không có thông báo.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User greeting */}
                <Nav.Link as={Link} to="/dashboard" className="text-light">
                  Xin chào, {user.fullName}
                </Nav.Link>

                {/* Logout button */}
                <Button variant="outline-light" size="sm" onClick={handleLogout}>
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">
                  Đăng nhập
                </Nav.Link>
                <Nav.Link as={Link} to="/register">
                  Đăng ký
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}

export default NavigationBar