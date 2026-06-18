"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Alert, Nav, Button, Form, Modal } from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"

const Dashboard = () => {
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState("profile")
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })
  const [showEditModal, setShowEditModal] = useState(false)
  const [editData, setEditData] = useState({
    fullName: user?.fullName || "",
    phoneNumber: user?.phoneNumber || "",
    address: user?.address || "",
  })

  const [currentPage, setCurrentPage] = useState(1)
  const bookingsPerPage = 10

  const indexOfLastBooking = currentPage * bookingsPerPage
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage
  const currentBookings = bookings.slice(indexOfFirstBooking, indexOfLastBooking)
  const totalPages = Math.ceil(bookings.length / bookingsPerPage)

  useEffect(() => {
    if (activeTab === "bookings") {
      fetchBookings()
    }
  }, [activeTab])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const response = await api.get("/bookings/my-bookings")
      setBookings(response.data)
    } catch (error) {
      console.error("Error fetching bookings:", error)
      setAlert({
        show: true,
        message: "Không thể tải lịch sử đặt tour",
        variant: "danger",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    try {
      const response = await api.put("/auth/profile", editData)
      updateUser(response.data.user)
      setAlert({
        show: true,
        message: "Cập nhật thông tin thành công",
        variant: "success",
      })
      setShowEditModal(false)
    } catch (error) {
      setAlert({
        show: true,
        message: error.response?.data?.message || "Có lỗi xảy ra khi cập nhật thông tin",
        variant: "danger",
      })
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN")
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: "Chờ xác nhận", variant: "warning" },
      confirmed: { text: "Đã xác nhận", variant: "info" },
      paid: { text: "Đã thanh toán", variant: "success" },
      cancelled: { text: "Đã hủy", variant: "danger" },
    }

    const statusInfo = statusMap[status] || { text: status, variant: "secondary" }
    return <span className={`badge bg-${statusInfo.variant}`}>{statusInfo.text}</span>
  }

  const renderProfileContent = () => (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h4>Thông tin cá nhân</h4>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => {
            setEditData({
              fullName: user?.fullName || "",
              phoneNumber: user?.phoneNumber || "",
              address: user?.address || "",
            })
            setShowEditModal(true)
          }}
        >
          <i className="bi bi-pencil"></i> Chỉnh sửa
        </Button>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={6}>
            <div className="mb-3">
              <strong>Họ tên:</strong>
              <p className="mb-0">{user?.fullName || "Chưa cập nhật"}</p>
            </div>
            <div className="mb-3">
              <strong>Email:</strong>
              <p className="mb-0">{user?.email}</p>
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-3">
              <strong>Số điện thoại:</strong>
              <p className="mb-0">{user?.phoneNumber || "Chưa cập nhật"}</p>
            </div>
            <div className="mb-3">
              <strong>Địa chỉ:</strong>
              <p className="mb-0">{user?.address || "Chưa cập nhật"}</p>
            </div>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <div className="mb-3">
              <strong>Vai trò:</strong>
              <p className="mb-0">
                <span className={`badge ${user?.role === "admin" ? "bg-danger" : "bg-primary"}`}>
                  {user?.role === "admin" ? "Quản trị viên" : "Khách hàng"}
                </span>
              </p>
            </div>
          </Col>
          {/* <Col md={6}>
            <div className="mb-3">
              <strong>Ngày tham gia:</strong>
              <p className="mb-0">{formatDate(user?.createdAt)}</p>
            </div>
          </Col> */}
        </Row>
      </Card.Body>
    </Card>
  )

  const renderBookingsContent = () => (
    <Card>
      <Card.Header>
        <h4>Lịch sử đặt tour</h4>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : bookings.length > 0 ? (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Tour</th>
                  <th>Ngày đặt</th>
                  <th>Số người</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {currentBookings.map((booking) => (
                  <tr key={booking._id}>
                    <td>{booking.bookingId}</td>
                    <td>{booking.tourId?.tourName}</td>
                    <td>{formatDate(booking.bookingDate)}</td>
                    <td>{booking.numberOfPeople}</td>
                    <td>{formatPrice(booking.totalAmount)}</td>
                    <td>{getStatusBadge(booking.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="d-flex justify-content-between align-items-center mt-3">
  <div>
    Trang {currentPage} / {totalPages}
  </div>
  <div>
    <Button
      variant="outline-secondary"
      size="sm"
      disabled={currentPage === 1}
      onClick={() => setCurrentPage(prev => prev - 1)}
      className="me-2"
    >
      Trang trước
    </Button>
    <Button
      variant="outline-secondary"
      size="sm"
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage(prev => prev + 1)}
    >
      Trang sau
    </Button>
  </div>
</div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-muted">Bạn chưa có đơn đặt tour nào.</p>
            <Button variant="primary" href="/tours">
              Khám phá tours
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  )

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return renderProfileContent()
      case "bookings":
        return renderBookingsContent()
      default:
        return renderProfileContent()
    }
  }

  return (
    <Container>
      <Row>
        <Col>
          <h1 className="mb-4">Tài khoản của tôi</h1>

          {alert.show && (
            <Alert variant={alert.variant} onClose={() => setAlert({ show: false })} dismissible>
              {alert.message}
            </Alert>
          )}

          <Row>
            {/* Sidebar */}
            <Col md={3}>
              <Card className="mb-4">
                <Card.Header>
                  <div className="text-center">
                    <div
                      className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center"
                      style={{ width: "60px", height: "60px", fontSize: "24px" }}
                    >
                      {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <h6 className="mt-2 mb-0">{user?.fullName}</h6>
                    <small className="text-muted">{user?.email}</small>
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  <Nav variant="pills" className="flex-column">
                    <Nav.Item>
                      <Nav.Link
                        active={activeTab === "profile"}
                        onClick={() => setActiveTab("profile")}
                        className="d-flex align-items-center"
                      >
                        <i className="bi bi-person me-2"></i>
                        Hồ sơ của tôi
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link
                        active={activeTab === "bookings"}
                        onClick={() => setActiveTab("bookings")}
                        className="d-flex align-items-center"
                      >
                        <i className="bi bi-calendar-check me-2"></i>
                        Lịch sử đặt tour
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                </Card.Body>
              </Card>
            </Col>

            {/* Main Content */}
            <Col md={9}>{renderContent()}</Col>
          </Row>
        </Col>
      </Row>

      {/* Edit Profile Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Chỉnh sửa thông tin</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateProfile}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Họ tên</Form.Label>
              <Form.Control
                type="text"
                value={editData.fullName}
                onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Số điện thoại</Form.Label>
              <Form.Control
                type="tel"
                value={editData.phoneNumber}
                onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Địa chỉ</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={editData.address}
                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              Lưu thay đổi
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}

export default Dashboard
