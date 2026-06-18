"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Carousel } from "react-bootstrap"
import { Link } from "react-router-dom"
import api from "../services/api"

const Home = () => {
  const backendUrl = process.env.REACT_APP_API_URL || "http://localhost:5000"
  const [featuredTours, setFeaturedTours] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedTours()
  }, [])

  const fetchFeaturedTours = async () => {
    try {
      const response = await api.get("/tours?limit=9")
      setFeaturedTours(response.data.tours)
    } catch (error) {
      console.error("Error fetching tours:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  return (
    <div>
      {/* Hero Section */}
      <Carousel className="mb-5">
        <Carousel.Item>
          <div
            className="d-block w-100 position-relative"
            style={{
              height: "446px",
              backgroundImage: "url('../home/main-background.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Overlay */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                zIndex: 1,
                pointerEvents: "none",
              }}
            ></div>

            {/* Content */}
            <div
              className="text-center text-white position-relative"
              style={{
                zIndex: 2,
                textShadow: "2px 2px 8px rgba(0,0,0,0.8)",
                padding: "20px",
                top: "100px",
              }}
            >
              <h1 className="display-4 fw-bold mb-3">Khám phá thế giới cùng chúng tôi</h1>
              <p className="lead mb-4">Những chuyến du lịch tuyệt vời đang chờ đón bạn</p>
              <Link to="/tours">
                <Button variant="light" size="lg">Xem Tours</Button>
              </Link>
            </div>
          </div>
        </Carousel.Item>

        <Carousel.Item>
          <div
            className="d-block w-100 position-relative"
            style={{
              height: "446px",
              backgroundImage: "url('../home/phuquoc-background.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Overlay */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.4)",
                zIndex: 1,
                pointerEvents: "none",
              }}
            ></div>

            {/* Content */}
            <div
              className="text-center text-white position-relative"
              style={{
                zIndex: 2,
                textShadow: "2px 2px 8px rgba(0,0,0,0.8)",
                padding: "20px",
                top: "100px",
              }}
            >
              <h1 className="display-4 fw-bold mb-3">Trải nghiệm độc đáo</h1>
              <p className="lead mb-4">Tạo nên những kỷ niệm không thể quên</p>
              <Link to="/tours">
                <Button variant="light" size="lg">Đặt Tour Ngay</Button>
              </Link>
            </div>
          </div>
        </Carousel.Item>
      </Carousel>

      <Container>
        {/* Featured Tours Section */}
       <Row className="mb-5">
  <Col>
    <h2 className="text-center mb-4">Tours Nổi Bật</h2>
    {loading ? (
      <div className="text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    ) : (
      <>
        <Row>
          {featuredTours
            .filter((tour) => tour.featured === true)
            .slice(0, 9)
            .map((tour) => (
              <Col md={4} key={tour._id} className="mb-4">
                <Card className="h-100 shadow-sm">
                  <Card.Img
                    variant="top"
                    src={
                      tour.images?.[0]
                        ? `${backendUrl}${tour.images[0]}`
                        : "/placeholder.svg?height=200&width=300"
                    }
                    style={{ height: "200px", objectFit: "cover" }}
                  />
                  <Card.Body className="d-flex flex-column">
                    <Card.Title>{tour.tourName}</Card.Title>
                    <Card.Text className="text-muted">
                      <small>
                        <i className="bi bi-geo-alt"></i> {tour.departure} → {tour.destination}
                      </small>
                    </Card.Text>
                    <Card.Text className="flex-grow-1">
                      {tour.itinerary.substring(0, 100)}...
                    </Card.Text>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="h5 text-primary mb-0">{formatPrice(tour.price)}</span>
                      <Link to={`/tours/${tour._id}`}>
                        <Button variant="primary" size="sm">
                          Xem chi tiết
                        </Button>
                      </Link>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
        </Row>

        {featuredTours.filter((tour) => tour.featured === true).length >= 9 && (
          <div className="text-center mt-3">
            <Link to="/tours">
              <Button variant="outline-primary">Xem thêm</Button>
            </Link>
          </div>
        )}
      </>
    )}
  </Col>
</Row>

        {/* Features Section */}
        <Row className="mb-5">
          <Col>
            <h2 className="text-center mb-4">Tại sao chọn chúng tôi?</h2>
            <Row>
              <Col md={4} className="text-center mb-4">
                <div className="mb-3">
                  <i className="bi bi-shield-check text-primary" style={{ fontSize: "3rem" }}></i>
                </div>
                <h4>Uy tín & Chất lượng</h4>
                <p>Đội ngũ chuyên nghiệp với nhiều năm kinh nghiệm trong lĩnh vực du lịch</p>
              </Col>
              <Col md={4} className="text-center mb-4">
                <div className="mb-3">
                  <i className="bi bi-currency-dollar text-primary" style={{ fontSize: "3rem" }}></i>
                </div>
                <h4>Giá cả hợp lý</h4>
                <p>Cam kết mang đến những tour du lịch chất lượng với mức giá tốt nhất</p>
              </Col>
              <Col md={4} className="text-center mb-4">
                <div className="mb-3">
                  <i className="bi bi-headset text-primary" style={{ fontSize: "3rem" }}></i>
                </div>
                <h4>Hỗ trợ 24/7</h4>
                <p>Đội ngũ chăm sóc khách hàng luôn sẵn sàng hỗ trợ bạn mọi lúc mọi nơi</p>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>

      {/* --- Footer Section --- */}
      <footer className="bg-dark text-white pt-5 pb-4">
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
      </footer>
    </div>
  )
}

export default Home