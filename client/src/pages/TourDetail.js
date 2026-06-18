import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Container, Row, Col, Card, Button, Form, Alert,
  Badge, Carousel, Modal, Image, FormCheck
} from "react-bootstrap"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"
import { Link } from "react-router-dom"

function PaymentModal({ isOpen, onClose, paymentInfo, onConfirm }) {
  const [copied, setCopied] = useState({ accountNumber: false, amount: false, content: false, all: false })

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(prev => ({ ...prev, [field]: true }))
      setTimeout(() => setCopied(prev => ({ ...prev, [field]: false })), 2000)
    } catch (err) { console.error("Failed to copy: ", err) }
  }

  const copyAllToClipboard = async () => {
    const allText = `Ngân hàng: MBBank\nChủ tài khoản: NGUYEN PHUOC THIEN\nSố tài khoản: 6923042004\nSố tiền: ${paymentInfo.amount}\nNội dung: ${paymentInfo.content}`
    try {
      await navigator.clipboard.writeText(allText)
      setCopied(prev => ({ ...prev, all: true }))
      setTimeout(() => setCopied(prev => ({ ...prev, all: false })), 2000)
    } catch (err) { console.error("Failed to copy: ", err) }
  }

  return (<Modal show={isOpen} onHide={onClose} centered size="lg" scrollable>
  <Modal.Header>
    <Modal.Title>Thông tin thanh toán chuyển khoản</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Row>
      <Col md={6}>
        <h5>Thông tin đơn hàng</h5>
        <Card className="p-3 ">
          <div className="d-flex flex-nowrap">
          <div className="me-2">
            <p className="mb-1 text-muted small">Ngân hàng:</p>
            <p className="mb-1 text-muted small">Chủ tài khoản:</p>
          </div>
          <div>
          <p className="fw-bold text-primary mb-0">MBBank</p>
          <p className="fw-bold mb-0 ">NGUYEN PHUOC THIEN</p>
          </div>
          </div>
        </Card>
        <Card className="p-3 mb-3">
          <p className="mb-1 text-muted small">Số tài khoản</p>
          <div className="d-flex justify-content-between align-items-center">
            <p className="fw-bold mb-0 font-monospace">6923042004</p>
            <Button
              variant="link"
              size="sm"
              className="p-0 text-primary"
              style={{ whiteSpace: "nowrap" }}
              onClick={() => copyToClipboard("6923042004", "accountNumber")}
            >
              {copied.accountNumber ? "Đã sao chép" : "Sao chép"}
            </Button>
          </div>
        </Card>
        <Card className="p-3 mb-3">
          <p className="mb-1 text-muted small">Số tiền cần chuyển</p>
          <div className="d-flex justify-content-between align-items-center">
            <p className="fw-bold text-danger fs-4 mb-0">{paymentInfo.amount || "..."}</p>
            <Button
              variant="link"
              size="sm"
              className="p-0 text-primary"
              style={{ whiteSpace: "nowrap" }}
              onClick={() => copyToClipboard(paymentInfo.amount.replace(/[^\d]/g, ""), "amount")}
            >
              {copied.amount ? "Đã sao chép" : "Sao chép"}
            </Button>
          </div>
        </Card>

        <Card className="p-3 mb-3">
          <p className="mb-1 text-muted small">Nội dung chuyển khoản</p>
          <div className="d-flex justify-content-between align-items-center">
            <p className="fw-bold mb-0 text-break">{paymentInfo.content || "..."}</p>
            <Button
              variant="link"
              size="sm"
              className="p-0 text-priamry"
              style={{ whiteSpace: "nowrap" }}
              onClick={() => copyToClipboard(paymentInfo.content, "content")}
            >
              {copied.content ? "Đã sao chép" : "Sao chép"}
            </Button>
          </div>
        </Card>

        

        
      </Col>

      <Col md={6} className="text-center">
        <p className="text-muted mb-2 large"><strong>Quét mã qua ứng dụng Ngân hàng/Ví điện tử</strong></p>
        <Image
          src="http://localhost:5000/uploads/qr_payment.jpg"
          alt="QR Code"
          fluid
          style={{ maxWidth: "80%", height: "auto" }}
        />
        <p className="mt-2 small text-muted">Scan to Pay</p>
        <Alert variant="primary" className="text-center">
          <p className="mb-0 small">Sau khi chuyển khoản, tour sẽ được xác nhận trong 15 phút</p>
        </Alert>
      </Col>
    </Row>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={onClose}>Hủy</Button>
    <Button variant="primary" onClick={onConfirm}>Đã chuyển khoản</Button>
  </Modal.Footer>
</Modal>

  )
}

function BookingConfirmationModal({ isOpen, onClose, bookingData, tour, user, onConfirm }) {
  // THAY ĐỔI: Đổi default từ "onTour" thành "cash"
  const [paymentMethod, setPaymentMethod] = useState("cash") 
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const handleConfirm = () => {
    onConfirm(paymentMethod)
  }

  return (
    <Modal show={isOpen} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Xác nhận thông tin đặt tour</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Card className="mb-3">
          <Card.Body>
            <h5>Thông tin khách hàng</h5>
            <p><strong>Họ và tên:</strong> {user?.fullName}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Số điện thoại:</strong> {user?.phoneNumber}</p>
          </Card.Body>
        </Card>
        <Card className="mb-3">
          <Card.Body>
            <h5>Thông tin tour</h5>
            <p><strong>Tên tour:</strong> {tour?.tourName}</p>
            <p><strong>Số lượng chỗ:</strong> {bookingData?.numberOfPeople}</p>
            <p><strong>Giá tiền:</strong> {formatPrice(tour?.price * bookingData?.numberOfPeople)}</p>
            <p><strong>Ghi chú:</strong> {bookingData?.notes || "Không có"}</p>
          </Card.Body>
        </Card>
        <Card>
          <Card.Body>
            <h5>Chọn phương thức thanh toán</h5>
            <Form>
              <FormCheck
                type="radio"
                label="Thanh toán khi đi tour (Tiền mặt)"
                name="paymentMethod"
                value="cash"
                checked={paymentMethod === "cash"}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mb-2"
              />
              <FormCheck
                type="radio"
                label="Thanh toán chuyển khoản (Thủ công)"
                name="paymentMethod"
                value="bankTransfer"
                checked={paymentMethod === "bankTransfer"}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mb-2"
              />
              {/* THÊM VNPAY */}
              <FormCheck
                type="radio"
                label="Thanh toán VNPAY (Thanh toán trực tuyến)"
                name="paymentMethod"
                value="vnpay"
                checked={paymentMethod === "vnpay"}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              {/* KẾT THÚC THÊM VNPAY */}
            </Form>
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Hủy</Button>
        <Button variant="primary" onClick={handleConfirm}>
            {paymentMethod === 'vnpay' ? 'Thanh toán ngay' : 'Xác nhận đặt tour'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

function BookingCompletionModal({ isOpen, onClose }) {
  return (
    <Modal show={isOpen} onHide={onClose} centered size="md">
      <Modal.Header closeButton>
        <Modal.Title>Hoàn tất đặt tour</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="success" className="text-center">
          <p className="mb-1 fw-medium">Đặt tour thành công!</p>
          <p className="mb-0 small">Vui lòng kiểm tra lịch sử đặt tour hoặc email để xem chi tiết.</p>
        </Alert>
        <Card className="text-center">
          <Card.Body>
            <p className="text-muted small mb-1">📞 Hotline hỗ trợ: <span className="fw-medium">1900-1234</span></p>
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onClose}>Đóng</Button>
      </Modal.Footer>
    </Modal>
  )
}

const TourDetail = () => {
  const backendUrl = process.env.REACT_APP_API_URL || "http://localhost:5000"
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tour, setTour] = useState(null)
  const [reviews, setReviews] = useState([])
  const [canReview, setCanReview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showCompletion, setShowCompletion] = useState(false)
  const [relatedTours, setRelatedTours] = useState([])
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0 })

  // Bỏ state paymentMethod vì đã có trong modal
  const [error, setError] = useState(null); // Giữ nguyên


  const [bookingData, setBookingData] = useState({
    numberOfPeople: 1,
    notes: "",
  })
  const [paymentInfo, setPaymentInfo] = useState({ amount: "", content: "" })

  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: "",
    images: [],
    reviewerName: user?.fullName || "",
    reviewerPhone: user?.phoneNumber || "",
  })
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })

  useEffect(() => {
    fetchTourDetail()
    fetchReviews()
    if (user) {
      checkCanReview()
    }
  }, [id, user])

   useEffect(() => {
    if (tour) {
      fetchRelatedTours()
    }
  }, [tour])

  useEffect(() => {
    if (user) {
      setReviewData((prev) => ({
        ...prev,
        reviewerName: user.fullName || "",
        reviewerPhone: user.phoneNumber || "",
      }))
    }
  }, [user])
  useEffect(() => {
  const fetchReviewStats = async () => {
    try {
      const res = await api.get(`/reviews/average/${id}`)
      setReviewStats(res.data)
    } catch (error) {
      console.error("Lỗi khi lấy thống kê đánh giá:", error)
    }
  }

  fetchReviewStats()
}, [id])

  const fetchTourDetail = async () => {
    try {
      const response = await api.get(`/tours/${id}`)
      setTour(response.data)
    } catch (error) {
      console.error("Error fetching tour detail:", error)
      setAlert({
        show: true,
        message: "Không thể tải thông tin tour",
        variant: "danger",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/reviews/tour/${id}`)
      setReviews(response.data)
    } catch (error) {
      console.error("Error fetching reviews:", error)
    }
  }

  const checkCanReview = async () => {
    try {
      const response = await api.get(`/reviews/can-review/${id}`)
      setCanReview(response.data.canReview)
    } catch (error) {
      console.error("Error checking review permission:", error)
    }
  }


  const handleBooking = (e) => {
    e.preventDefault()

    if (!user) {
      navigate("/login")
      return
    }
    
    // Kiểm tra số lượng người trước khi mở modal
    if (bookingData.numberOfPeople <= 0 || bookingData.numberOfPeople > tour.availableSlots) {
        setError("Số lượng người không hợp lệ.");
        return;
    }
    setError(null);
    setShowConfirmation(true)
  }
  
  // Hàm tạo booking cho phương thức CASH hoặc BANK_TRANSFER (thủ công)
  const createBooking = async (method) => {
    const response = await api.post("/bookings", { 
      tourId: id,
      numberOfPeople: bookingData.numberOfPeople,
      notes: bookingData.notes,
      paymentMethod: method, 
    })
    return response.data;
  }
  
  // Hàm tạo booking và chuyển hướng cho VNPAY
  const createVnpayPayment = async () => {
      const response = await api.post("/bookings/vnpay", {
        tourId: id,
        numberOfPeople: bookingData.numberOfPeople,
        notes: bookingData.notes,
      })
      return response.data.vnpUrl; 
  }


// THAY ĐỔI: Xử lý logic 3 phương thức thanh toán
const handleConfirmation = async (method) => {
    setShowConfirmation(false)

    try {
        if (method === "vnpay") {
            // 1. VNPAY: Tạo thanh toán và chuyển hướng
            const vnpUrl = await createVnpayPayment();
            window.location.href = vnpUrl; // Chuyển hướng ngay lập tức
            return; 
        } 
        
        if (method === "bankTransfer") {
            // 2. BANK TRANSFER (Thủ công): Tạo booking và hiển thị modal thông tin chuyển khoản
            await createBooking("bankTransfer"); 
            
            setPaymentInfo({
                amount: formatPrice(tour.price * bookingData.numberOfPeople),
                content: `THANH TOAN TOUR ${tour.tourName.toUpperCase().replace(/\s/g, '-')}`, // Tạo nội dung chuyển khoản
            });
            setShowPayment(true); // Hiển thị modal chuyển khoản thủ công
            
        } else { // 'cash'
            // 3. CASH (Thanh toán khi đi tour): Tạo booking và hiển thị hoàn tất
            await createBooking("cash");
            setShowCompletion(true);
        }

        // Reset form data sau khi thành công
        setBookingData({ numberOfPeople: 1, notes: "" });
        
        // Cập nhật slot (vì cả cash/bankTransfer đều trừ slot ở backend)
        setTour((prev) => ({
            ...prev,
            availableSlots: prev.availableSlots - bookingData.numberOfPeople,
        }));


    } catch (error) {
        setError(error.response?.data?.message || "Có lỗi xảy ra khi xử lý đặt tour.");
        setAlert({
            show: true,
            message: error.response?.data?.message || "Có lỗi xảy ra khi xử lý đặt tour.",
            variant: "danger",
        });
        setShowConfirmation(false);
    }
}


  // Giữ nguyên logic cũ của handlePaymentConfirm: người dùng xác nhận đã chuyển khoản
  const handlePaymentConfirm = async () => {
    try {
      // Vì booking đã được tạo ở handleConfirmation, hàm này chỉ để đóng modal và thông báo thành công.
      // Tuy nhiên, dựa trên logic file cũ, nó gọi createBooking() ở đây, tôi sẽ giữ
      // (Nhưng nên xem xét lại việc gọi createBooking 2 lần) -> Tối ưu hóa: bỏ createBooking trong handleConfirmation cho BankTransfer
      setShowPayment(false)
      setShowCompletion(true)
    } catch (error) {
      setAlert({
        show: true,
        message: error.response?.data?.message || "Có lỗi xảy ra khi đặt tour",
        variant: "danger",
      })
    setShowPayment(false)
    }
  }


  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + reviewData.images.length > 3) {
      setAlert({
        show: true,
        message: "Chỉ được tải lên tối đa 3 ảnh",
        variant: "warning",
      })
      return
    }

      setReviewData((prev) => ({
        ...prev,
        images: [...prev.images, ...files], 
      }))
    
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        setReviewData((prev) => ({
          ...prev,
          images: [...prev.images, e.target.result],
        }))
      }
      reader.readAsDataURL(file)
    })
    }
   

    const removeImage = (index) => {
      setReviewData((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }))
    }

  const submitReview = async (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append("tourId", id)
    formData.append("rating", reviewData.rating)
    formData.append("comment", reviewData.comment)
    formData.append("reviewerName", reviewData.reviewerName)
    formData.append("reviewerPhone", reviewData.reviewerPhone)

    reviewData.images.forEach((file) => {
      formData.append("images", file) // đúng tên field theo multer backend
    })

      try {
      await api.post("/reviews", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })

      setAlert({
        show: true,
        message: "Đánh giá của bạn đã được gửi và đang chờ admin duyệt",
        variant: "success",
      })

      setShowReviewModal(false)
      setReviewData({
        rating: 5,
        comment: "",
        images: [],
        reviewerName: user?.fullName || "",
        reviewerPhone: user?.phoneNumber || "",
      })
      setCanReview(false)
      fetchReviews()
    } catch (error) {
      setAlert({
        show: true,
        message: error.response?.data?.message || "Có lỗi xảy ra khi gửi đánh giá",
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

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <i key={index} className={`bi bi-star${index < rating ? "-fill" : ""} text-warning`}></i>
    ))
  }

  const getRatingText = (rating) => {
    const ratingTexts = {
      1: "Rất tệ",
      2: "Tệ",
      3: "Tạm ổn",
      4: "Tốt",
      5: "Rất tốt",
    }
    return ratingTexts[rating] || ""
  }
  const fetchRelatedTours = async () => {
    if (!id) return; // Kiểm tra an toàn để đảm bảo có ID

    try {
      const response = await api.get(`/tours/${id}/similar`);
      const aiSuggestedTours = response.data;

      setRelatedTours(aiSuggestedTours.slice(0, 4));

    } catch (error) {
      console.error("Error fetching related tours:", error);
      setRelatedTours([]); 
    }
  }

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    )
  }

  if (!tour) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">Tour không tồn tại</Alert>
      </Container>
    )
  }

  return (<>
    <Container style={{marginTop:"82px"}}>
      {alert.show && (
        <Alert variant={alert.variant} onClose={() => setAlert({ show: false })} dismissible>
          {alert.message}
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          {/* Tour Images */}
          {tour.images && tour.images.length > 0 ? (
            <Carousel className="mb-4">
              {tour.images.map((image, index) => (
                <Carousel.Item key={index}>
                  <img
                    className="d-block w-100"
                    src={`http://localhost:5000${image}` || "/placeholder.svg"}
                    alt={`${tour.tourName} ${index + 1}`}
                    style={{ height: "400px", objectFit: "cover" }}
                  />
                </Carousel.Item>
              ))}
            </Carousel>
          ) : (
            <img
              src="/placeholder.svg?height=400&width=600"
              alt={tour.tourName}
              className="img-fluid mb-4 rounded"
              style={{ height: "400px", width: "100%", objectFit: "cover" }}
            />
          )}

          <Card className="mb-4">
            <Card.Body>
              <h1 className="mb-3">{tour.tourName}</h1>

              <Row className="mb-3">
                <Col md={6}>
                  <p><strong>Điểm khởi hành:</strong> {tour.departure}</p>
                  <p><strong>Điểm đến:</strong> {tour.destination}</p>
                  <p><strong>Phương tiện:</strong> {tour.transportation}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Ngày bắt đầu:</strong> {formatDate(tour.startDate)}</p>
                  <p><strong>Ngày kết thúc:</strong> {formatDate(tour.endDate)}</p>
                  <p><strong>Còn lại:</strong> <Badge bg="info">{tour.availableSlots} chỗ</Badge></p>
                </Col>
              </Row>

              <h4>Lịch trình</h4>
              <p className="mb-3">{tour.itinerary}</p>

              {tour.services && tour.services.length > 0 && (
                <>
                  <h4>Dịch vụ bao gồm</h4>
                  <ul>
                    {tour.services.map((service, index) => (
                      <li key={index}>{service}</li>
                    ))}
                  </ul>
                </>
              )}
            </Card.Body>
          </Card>

          {/* Reviews */}
          <Card>
             <Card.Header className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h4 className="mb-3">
                  Đánh giá từ khách hàng{" "}
                  {reviewStats.totalReviews > 0 && (
                    <small className="text-muted ms-2"><i class="bi bi-star-fill text-warning"></i> 
                    {reviewStats.averageRating} / 5 ({reviewStats.totalReviews} đánh giá)
                    </small>
                  )}
                </h4>
              </div>
              {user && canReview && (
                <Button variant="primary" size="sm" onClick={() => setShowReviewModal(true)}>
                  Viết đánh giá
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review._id} className="mb-4 pb-3 border-bottom">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <strong>{review.reviewerName}</strong>
                        <div className="mb-2">{renderStars(review.rating)}</div>
                      </div>
                      <small className="text-muted">{formatDate(review.reviewDate)}</small>
                    </div>
                    <p className="mb-2">{review.comment}</p>
                    {review.images && review.images.length > 0 && (
                      <div className="d-flex gap-2 mb-2">
                        {review.images.map((image, index) => (
                          <img
                            key={index}
                            src={`${backendUrl}${image}` || "/placeholder.svg"}
                            alt={`Review ${index + 1}`}
                            style={{ width: "100px", height: "100px", objectFit: "cover" }}
                            className="rounded"
                          />
                        ))}
                      </div>
                      
                    )}                  
                  </div>
                ))
              ) : (
                <p className="text-muted">Chưa có đánh giá nào cho tour này.</p>
              )}
            </Card.Body>
          </Card>
          </Col>
        

        <Col lg={4}>
          {/* Booking Form */}
          <Card className="sticky-top" style={{ top: "82px" }}>
            <Card.Header>
              <h4 className="mb-0">Đặt Tour</h4>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-center mb-3">
                <h3 className="text-primary">{formatPrice(tour.price)}</h3>
                <small className="text-muted">/ chỗ</small>
              </div>

              {tour.availableSlots > 0 ? (
                <Form onSubmit={handleBooking}>
                  <Form.Group className="mb-3">
                    <Form.Label>Số lượng chỗ</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      max={tour.availableSlots}
                      value={bookingData.numberOfPeople}
                      onChange={(e) =>
                        setBookingData({
                          ...bookingData,
                          numberOfPeople: Number.parseInt(e.target.value),
                        })
                      }
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Ghi chú</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={bookingData.notes}
                      onChange={(e) =>
                        setBookingData({
                          ...bookingData,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Yêu cầu đặc biệt..."
                    />
                  </Form.Group>
                  {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
                  <div className="mb-3">
                    <strong>Tổng tiền: {formatPrice(tour.price * bookingData.numberOfPeople)}</strong>
                  </div>

                  <Button type="submit" variant="primary" size="lg" className="w-100" disabled={ user?.role === "admin"}>
                    {user ? "Đặt Tour" : "Đăng nhập để đặt tour"}
                  </Button>
                </Form>
              ) : (
                <Alert variant="warning">Tour này đã hết chỗ</Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
    <Col>
      {/* Related Tours Section */}
          {relatedTours.length > 0 && (
            <Card>
              <Card.Header>
                <h4 className="mb-0">Tour gợi ý</h4>
              </Card.Header>
              <Card.Body>
                <Row>
                  {relatedTours.map((relatedTour) => (
                    <Col md={3} key={relatedTour._id} className="mb-3">
                      <Card className="h-100 shadow-sm">
                        <div style={{ height: "150px", overflow: "hidden" }}>
                          <Card.Img
                            variant="top"
                            src={
                              relatedTour.images && relatedTour.images.length > 0
                                ? `${backendUrl}${relatedTour.images[0]}`
                                : "/placeholder.svg?height=150&width=200"
                            }
                            style={{ height: "150px", objectFit: "cover" }}
                          />
                        </div>
                        <Card.Body className="d-flex flex-column">
                          <Card.Title className="h6 mb-2" style={{ minHeight: "2.5rem" }}>
                            {relatedTour.tourName}
                          </Card.Title>
                          <div className="mb-2">
                            <small className="text-muted">
                              <i className="bi bi-geo-alt me-1"></i>
                              {relatedTour.departure} → {relatedTour.destination}
                            </small>
                          </div>
                          <div className="mb-2">
                            <small className="text-muted">
                              <i className="bi bi-calendar me-1"></i>
                              {formatDate(relatedTour.startDate)}
                            </small>
                          </div>
                          <div className="mt-auto">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="fw-bold text-primary">{formatPrice(relatedTour.price)}</span>
                              <Badge bg="info" className="small">
                                {relatedTour.availableSlots} chỗ
                              </Badge>
                            </div>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="w-100"
                              onClick={() => window.location.href = `/tours/${relatedTour._id}`}
                            >
                              Xem chi tiết
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>

                {relatedTours.length >= 4 && (
                  <div className="text-center mt-3">
                    <Button
                      variant="outline-primary"
                      onClick={() => navigate(`/tours?destination=${encodeURIComponent(tour.destination)}`)}
                    >
                      Xem tất cả tour
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
        

      <BookingConfirmationModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        bookingData={bookingData}
        tour={tour}
        user={user}
        onConfirm={handleConfirmation}
      />

      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        paymentInfo={paymentInfo}
        onConfirm={handlePaymentConfirm}
      />

      <BookingCompletionModal
        isOpen={showCompletion}
        onClose={() => {
          setShowCompletion(false)
          setBookingData({ numberOfPeople: 1, notes: "" })
          // Chuyển hướng người dùng về lịch sử đặt tour sau khi đặt thành công (trừ VNPAY)
          navigate('/bookings');
        }}
      />

      <Modal show={showReviewModal} onHide={() => setShowReviewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Đánh giá tour: {tour.tourName}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={submitReview}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Đánh giá của bạn *</Form.Label>
                  <div className="d-flex align-items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`bi bi-star${star <= reviewData.rating ? "-fill" : ""} text-warning`}
                        style={{ fontSize: "1.5rem", cursor: "pointer" }}
                        onMouseEnter={() =>
                          setReviewData((prev) => ({ ...prev, hoverRating: star }))
                        }
                        onMouseLeave={() =>
                          setReviewData((prev) => ({ ...prev, hoverRating: undefined }))
                        }
                        onClick={() =>
                          setReviewData((prev) => ({ ...prev, rating: star }))
                        }
                      ></i>
                    ))}
                    <span className="text-muted">
                      ({getRatingText(reviewData.hoverRating || reviewData.rating)})
                    </span>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Họ tên *</Form.Label>
                  <Form.Control
                    type="text"
                    value={reviewData.reviewerName}
                    onChange={(e) =>
                      setReviewData({
                        ...reviewData,
                        reviewerName: e.target.value,
                      })
                    }
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Số điện thoại *</Form.Label>
                  <Form.Control
                    type="tel"
                    value={reviewData.reviewerPhone}
                    onChange={(e) =>
                      setReviewData({
                        ...reviewData,
                        reviewerPhone: e.target.value,
                      })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ảnh thực tế (tối đa 3 ảnh)</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={reviewData.images.length >= 3}
                  />
                  {reviewData.images.length > 0 && (
                    <div className="mt-2">
                      <div className="d-flex flex-wrap gap-2">
                        {reviewData.images.map((file, index) => {
                          const src = typeof file === "string" ? file : URL.createObjectURL(file)
                          return (
                            <div key={index} className="position-relative">
                              <img
                                src={src}
                                alt={`Preview ${index + 1}`}
                                style={{ width: "80px", height: "80px", objectFit: "cover" }}
                                className="rounded"
                              />
                              <Button
                                variant="danger"
                                size="sm"
                                className="position-absolute top-0 end-0"
                                style={{ padding: "2px 6px", fontSize: "12px" }}
                                onClick={() => removeImage(index)}
                              >
                                ×
                              </Button>
                            </div>
                          )
})}
                      </div>
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Nhận xét của bạn *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={reviewData.comment}
                onChange={(e) =>
                  setReviewData({
                    ...reviewData,
                    comment: e.target.value,
                  })
                }
                placeholder="Chia sẻ trải nghiệm của bạn về tour này..."
                required
              />
            </Form.Group>

            <Alert variant="info">
              <small>
                <i className="bi bi-info-circle me-2"></i>
                Đánh giá của bạn sẽ được admin xem xét và duyệt trước khi hiển thị công khai.
              </small>
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              Gửi đánh giá
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container> 
    <footer className="bg-dark text-white pt-5 pb-4 mt-5">
        <Container>
          <Row>
            {/* About Us */}
            <Col lg={3} md={6} className="mb-4 mb-lg-0">
              <h5 className="text-uppercase fw-bold mb-4">Về chúng tôi</h5>
              <p className="text-white-50">
                Chúng tôi cam kết mang đến những chuyến đi đáng nhớ và trải nghiệm du lịch tuyệt vời nhất cho bạn. Khám phá thế giới cùng chúng tôi!
              </p>
            </Col>

            {/* Quick Links */}
            <Col lg={3} md={6} className="mb-4 mb-lg-0">
              <h5 className="text-uppercase fw-bold mb-4">Liên kết nhanh</h5>
              <ul className="list-unstyled">
                <li className="mb-2">
                  <Link to="/" className="text-white-50 text-decoration-none">
                    Trang chủ
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/tours" className="text-white-50 text-decoration-none">
                    Tours
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/about" className="text-white-50 text-decoration-none">
                    Về chúng tôi
                  </Link>
                </li>
                <li className="mb-2">
                  <Link to="/contact" className="text-white-50 text-decoration-none">
                    Liên hệ
                  </Link>
                </li>
              </ul>
            </Col>

            {/* Contact Info */}
            <Col lg={3} md={6} className="mb-4 mb-md-0">
              <h5 className="text-uppercase fw-bold mb-4">Liên hệ</h5>
              <ul className="list-unstyled text-white-50">
                <li className="mb-2">
                  <i className="bi bi-house-door-fill me-2"></i> 123 Đường ABC, Quận XYZ, TP.HCM
                </li>
                <li className="mb-2">
                  <i className="bi bi-envelope-fill me-2"></i> info@yourtravelsite.com
                </li>
                <li className="mb-2">
                  <i className="bi bi-phone-fill me-2"></i> +84 123 456 789
                </li>
                <li className="mb-2">
                  <i className="bi bi-printer-fill me-2"></i> +84 987 654 321
                </li>
              </ul>
            </Col>

            {/* Social Media */}
            <Col lg={3} md={6}>
              <h5 className="text-uppercase fw-bold mb-4">Theo dõi chúng tôi</h5>
              <div>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white me-3">
                  <i className="bi bi-facebook" style={{ fontSize: "1.8rem" }}></i>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white me-3">
                  <i className="bi bi-twitter" style={{ fontSize: "1.8rem" }}></i>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white me-3">
                  <i className="bi bi-instagram" style={{ fontSize: "1.8rem" }}></i>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-white">
                  <i className="bi bi-linkedin" style={{ fontSize: "1.8rem" }}></i>
                </a>
              </div>
            </Col>
          </Row>
          <hr className="my-4 border-secondary" />
          <Row>
            <Col className="text-center text-white-50">
              <p className="mb-0">
                &copy; {new Date().getFullYear()} Your Travel Site. All Rights Reserved.
              </p>
            </Col>
          </Row>
        </Container>
      </footer></>
  ) 
}
export default TourDetail