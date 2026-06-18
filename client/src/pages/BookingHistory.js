"use client"

import { useState, useEffect } from "react"
// THAY ĐỔI: Thêm useSearchParams
import { Container, Row, Col, Card, Button, Alert, Badge } from "react-bootstrap"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"

const BookingHistory = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })
  const [currentPage, setCurrentPage] = useState(1)
  const bookingsPerPage = 6
  
  // THÊM: Lấy searchParams từ URL
  const [searchParams, setSearchParams] = useSearchParams();

  const indexOfLastBooking = currentPage * bookingsPerPage
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage
  const currentBookings = bookings.slice(indexOfFirstBooking, indexOfLastBooking)
  const totalPages = Math.ceil(bookings.length / bookingsPerPage)

  useEffect(() => {
    fetchBookings()
    
    // LOGIC MỚI: Xử lý kết quả VNPAY
    const vnpayStatus = searchParams.get('vnp_status');
    const vnpayMessage = searchParams.get('message');
    
    if (vnpayStatus && vnpayMessage) {
        // '00' là mã thành công của VNPAY. 'success' là chuỗi tôi đặt ở backend.
        const variant = vnpayStatus === 'success' || vnpayStatus === '00' ? 'success' : 'danger'; 
        setAlert({
            show: true,
            message: decodeURIComponent(vnpayMessage),
            variant: variant,
        });
        
        // Xóa tham số khỏi URL sau khi hiển thị
        searchParams.delete('vnp_status');
        searchParams.delete('message');
        setSearchParams(searchParams, { replace: true }); 
    }
    
  }, [searchParams]) // Thêm searchParams vào dependencies

  const fetchBookings = async () => {
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

  const handleViewTour = (tourId) => {
    navigate(`/tours/${tourId}`)
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
    return <Badge bg={statusInfo.variant}>{statusInfo.text}</Badge>
  }
  
  // Hàm hiển thị phương thức thanh toán
  const getPaymentMethodText = (method, ref) => {
    let text = "";
    if (method === 'vnpay') {
        text = 'VNPAY (Online)';
    } else if (method === 'cash') {
        text = 'Tiền mặt';
    } else if (method === 'bankTransfer') {
        text = 'Chuyển khoản thủ công';
    } else {
        text = 'Chưa rõ';
    }

    return (
        <>
            <Badge bg="secondary" className="me-2">{text}</Badge>
            {ref && <small className="text-muted d-block mt-1">Ref: {ref}</small>}
        </>
    );
  };


  return (
    <Container style={{marginTop:"82px"}}>
      <Row>
        <Col>
          <h1 className="mb-4">Lịch sử đặt tour</h1>

          {alert.show && (
            <Alert variant={alert.variant} onClose={() => setAlert({ show: false })} dismissible>
              {alert.message}
            </Alert>
          )}

          {loading ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : bookings.length > 0 ? (
            <Row>
              
              {currentBookings.map((booking) => (
                <Col md={6} lg={4} key={booking._id} className="mb-4">
                  <Card className="h-100">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title">{booking.tourId?.tourName}</h5>
                        {getStatusBadge(booking.status)}
                      </div>

                      <p className="text-muted mb-2">
                        <small>Mã đơn: {booking.bookingId}</small>
                      </p>

                      <p className="mb-1">
                        <strong>Điểm đến:</strong> {booking.tourId?.destination}
                      </p>
                      <p className="mb-1">
                        <strong>Ngày đặt:</strong> {formatDate(booking.bookingDate)}
                      </p>
                      <p className="mb-1">
                        <strong>Số người:</strong> {booking.numberOfPeople}
                      </p>
                      {/* THÊM HIỂN THỊ PHƯƠNG THỨC THANH TOÁN */}
                      <p className="mb-2">
                          <strong>Thanh toán:</strong> {getPaymentMethodText(booking.paymentMethod, booking.paymentRef)}
                      </p>
                      {/* KẾT THÚC THÊM HIỂN THỊ PHƯƠNG THỨC THANH TOÁN */}
                      <p className="mb-3">
                        <strong>Tổng tiền:</strong> {formatPrice(booking.totalAmount)}
                      </p>

                      {booking.notes && (
                        <p className="mb-3">
                          <strong>Ghi chú:</strong> {booking.notes}
                        </p>
                      )}

                      <div className="d-flex gap-2">
                        <Button variant="outline-primary" size="sm" onClick={() => handleViewTour(booking.tourId?._id)}>
                          Xem chi tiết tour
                        </Button>
                        {booking.status === "paid" && (
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleViewTour(booking.tourId?._id)}
                          >
                            Đánh giá tour
                          </Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
              <div className="d-flex justify-content-center mt-3">
  <Button
    variant="outline-secondary"
    size="sm"
    disabled={currentPage === 1}
    onClick={() => setCurrentPage(prev => prev - 1)}
    className="me-2"
  >
    Trang trước
  </Button>

  <span className="align-self-center">Trang {currentPage} / {totalPages}</span>

  <Button
    variant="outline-secondary"
    size="sm"
    disabled={currentPage === totalPages}
    onClick={() => setCurrentPage(prev => prev + 1)}
    className="ms-2"
  >
    Trang sau
  </Button>
</div>
            </Row>
            
          ) : (
            <Card>
              <Card.Body className="text-center">
                <p className="text-muted">Bạn chưa có đơn đặt tour nào.</p>
                <Button variant="primary" href="/tours">
                  Khám phá tours
                </Button>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  )
}

export default BookingHistory