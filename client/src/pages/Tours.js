"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Form, Pagination, ListGroup, Badge } from "react-bootstrap"
import { Link } from "react-router-dom"
import api from "../services/api"

const Tours = () => {
  const backendUrl = process.env.REACT_APP_API_URL || "http://localhost:5000"
  const [tours, setTours] = useState([])
  const [categories, setCategories] = useState({})
  const [loading, setLoading] = useState(true)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedDestination, setSelectedDestination] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [filters, setFilters] = useState({
    destination: "",
    departure: "",
    minPrice: "",
    maxPrice: "",
    startDate: "",
    endDate: "",
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchTours()
  }, [currentPage, filters, selectedCategory, selectedDestination, sortBy])

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true)
      const response = await api.get("/tours/categories")
      setCategories(response.data.categories)
    } catch (error) {
      console.error("Error fetching categories:", error)
    } finally {
      setCategoriesLoading(false)
    }
  }

  const fetchTours = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
        sort: sortBy,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== "")),
      })

      // Add category filter
      if (selectedCategory !== "all") {
        params.append("category", selectedCategory)
      }

      // Add specific destination filter
      if (selectedDestination) {
        params.append("destination", selectedDestination)
      }

      const response = await api.get(`/tours?${params}`)
      setTours(response.data.tours)
      setTotalPages(response.data.totalPages)
    } catch (error) {
      console.error("Error fetching tours:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
    setCurrentPage(1)
  }

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setSelectedDestination("")
    setCurrentPage(1)
  }

  const handleDestinationChange = (destination) => {
    setSelectedDestination(destination)
    setCurrentPage(1)
  }

  const handleSortChange = (e) => {
    setSortBy(e.target.value)
    setCurrentPage(1)
  }

  const resetFilters = () => {
    setFilters({
      destination: "",
      departure: "",
      minPrice: "",
      maxPrice: "",
      startDate: "",
      endDate: "",
    })
    setSelectedCategory("all")
    setSelectedDestination("")
    setSortBy("newest")
    setCurrentPage(1)
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

  const getCurrentCategoryDestinations = () => {
    if (selectedCategory === "all") return []
    return categories[selectedCategory]?.destinations || []
  }

  return (<>
    <Container style={{marginTop:"62px"}}>
      <Row>
        {/* Sidebar */}
        <Col lg={3} className="bg-light p-4">
          <div className="sticky-top" style={{ top: "82px" }}>
            <h4 className="mb-4">
              <i className="bi bi-funnel me-2"></i>
              Danh mục Tours
            </h4>

            {categoriesLoading ? (
              <div className="text-center">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Categories */}
                <Card className="mb-4">
                  <Card.Header>
                    <h6 className="mb-0">
                      <i className="bi bi-grid-3x3-gap me-2"></i>
                      Loại Tour
                    </h6>
                  </Card.Header>
                  <ListGroup variant="flush">
                    {Object.entries(categories).map(([key, categoryData]) => (
                      <ListGroup.Item
                        key={key}
                        action
                        active={selectedCategory === key}
                        onClick={() => handleCategoryChange(key)}
                        className="d-flex justify-content-between align-items-center"
                      >
                        <span>
                          {categoryData.name}
                          <Badge bg="secondary" className="ms-2">
                            {categoryData.count}
                          </Badge>
                        </span>
                        {selectedCategory === key && <i className="bi bi-check-circle-fill text-primary"></i>}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Card>

                {/* Destinations */}
                {selectedCategory !== "all" && getCurrentCategoryDestinations().length > 0 && (
                  <Card className="mb-4">
                    <Card.Header>
                      <h6 className="mb-0">
                        <i className="bi bi-geo-alt me-2"></i>
                        Điểm đến ({getCurrentCategoryDestinations().length})
                      </h6>
                    </Card.Header>
                    <ListGroup variant="flush" style={{ maxHeight: "300px", overflowY: "auto" }}>
                      <ListGroup.Item
                        action
                        active={selectedDestination === ""}
                        onClick={() => handleDestinationChange("")}
                      >
                        Tất cả điểm đến
                      </ListGroup.Item>
                      {getCurrentCategoryDestinations().map((destination) => (
                        <ListGroup.Item
                          key={destination}
                          action
                          active={selectedDestination === destination}
                          onClick={() => handleDestinationChange(destination)}
                          className="d-flex justify-content-between align-items-center"
                        >
                          <span>{destination}</span>
                          {selectedDestination === destination && (
                            <i className="bi bi-check-circle-fill text-primary"></i>
                          )}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </Card>
                )}
              </>
            )}
          </div>
        </Col>

        {/* Main Content */}
        <Col lg={9}>
          <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h1>{selectedCategory === "all" ? "Tất cả Tours" : categories[selectedCategory]?.name}</h1>
                {selectedDestination && (
                  <small className="text-muted">
                    <i className="bi bi-geo-alt me-1"></i>
                    {selectedDestination}
                  </small>
                )}
              </div>
            </div>

            {/* Filters & Sort */}
            <Card className="mb-4">
              <Card.Body>
                <Row className="align-items-end">
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Tìm kiếm</Form.Label>
                      <Form.Control
                        type="text"
                        name="destination"
                        value={filters.destination}
                        onChange={handleFilterChange}
                        placeholder="Điểm đến..."
                      />
                    </Form.Group>
                  </Col>
                  {/* <Col md={2}>
                    <Form.Group>
                      <Form.Label>Điểm khởi hành</Form.Label>
                      <Form.Control
                        type="text"
                        name="departure"
                        value={filters.departure}
                        onChange={handleFilterChange}
                        placeholder="Khởi hành từ..."
                      />
                    </Form.Group>
                  </Col> */}
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Giá từ</Form.Label>
                      <Form.Control
                        type="number"
                        name="minPrice"
                        value={filters.minPrice}
                        onChange={handleFilterChange}
                        placeholder="0"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Giá đến</Form.Label>
                      <Form.Control
                        type="number"
                        name="maxPrice"
                        value={filters.maxPrice}
                        onChange={handleFilterChange}
                        placeholder="Max"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Từ ngày</Form.Label>
                      <Form.Control
                        type="date"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleFilterChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Đến ngày</Form.Label>
                      <Form.Control type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group>
                      <Form.Label>Sắp xếp</Form.Label>
                      <Form.Select value={sortBy} onChange={handleSortChange}>
                        <option value="newest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                        <option value="price-low">Giá thấp đến cao</option>
                        <option value="price-high">Giá cao đến thấp</option>
                        <option value="name-asc">Tên A đến Z</option>
                        <option value="name-desc">Tên Z đến A</option>
                        <option value="popular">Phổ biến</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Tours Grid */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Đang tải tours...</p>
              </div>
            ) : tours.length > 0 ? (
              <>
                <Row>
                  {tours.map((tour) => (
                    <Col lg={4} md={6} key={tour._id} className="mb-4">
                      <Card className="h-100 shadow-sm tour-card">
                        <div className="position-relative">
                          <Card.Img
                            variant="top"
                              src={
                              tour.images?.[0]
                                ? `${backendUrl}${tour.images[0]}`
                                : "/placeholder.svg?height=200&width=300"
                            }
                            style={{ height: "200px", objectFit: "cover" }}
                          />
                          <Badge
                            bg={
                              tour.category === "domestic"
                                ? "success"
                                : tour.category === "international"
                                  ? "info"
                                  : "secondary"
                            }
                            className="position-absolute top-0 end-0 m-2"
                          >
                            {tour.category === "domestic"
                              ? "Trong nước"
                              : tour.category === "international"
                                ? "Nước ngoài"
                                : "Tour"}
                          </Badge>
                        </div>
                        <Card.Body className="d-flex flex-column">
                          <Card.Title className="tour-title">{tour.tourName}</Card.Title>
                          <Card.Text className="text-muted mb-2">
                            <small>
                              <i className="bi bi-geo-alt me-1"></i>
                              {tour.departure} → {tour.destination}
                            </small>
                          </Card.Text>
                          <Card.Text className="text-muted mb-2">
                            <small>
                              <i className="bi bi-calendar me-1"></i>
                              {formatDate(tour.startDate)} - {formatDate(tour.endDate)}
                            </small>
                          </Card.Text>
                          <Card.Text className="text-muted mb-3">
                            <small>
                              <i className="bi bi-bus-front me-1"></i>
                              {tour.transportation}
                            </small>
                          </Card.Text>
                          <Card.Text className="flex-grow-1 tour-description">
                            {tour.itinerary.substring(0, 120)}...
                          </Card.Text>
                          <div className="d-flex justify-content-between align-items-center mt-auto">
                            <div>
                              <span className="h5 text-primary mb-0">{formatPrice(tour.price)}</span>
                              <br />
                              <small className="text-muted">
                                <i className="bi bi-people me-1"></i>
                                Còn {tour.availableSlots} chỗ
                              </small>
                            </div>
                            <Link to={`/tours/${tour._id}`}>
                              <Button variant="primary" size="sm">
                                <i className="bi bi-eye me-1"></i>
                                Xem chi tiết
                              </Button>
                            </Link>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Row className="mt-4">
                    <Col className="d-flex justify-content-center">
                      <Pagination>
                        <Pagination.First disabled={currentPage === 1} onClick={() => setCurrentPage(1)} />
                        <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} />

                        {[...Array(Math.min(5, totalPages))].map((_, index) => {
                          const pageNum = Math.max(1, currentPage - 2) + index
                          if (pageNum <= totalPages) {
                            return (
                              <Pagination.Item
                                key={pageNum}
                                active={pageNum === currentPage}
                                onClick={() => setCurrentPage(pageNum)}
                              >
                                {pageNum}
                              </Pagination.Item>
                            )
                          }
                          return null
                        })}

                        <Pagination.Next
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(currentPage + 1)}
                        />
                        <Pagination.Last
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(totalPages)}
                        />
                      </Pagination>
                    </Col>
                  </Row>
                )}
              </>
            ) : (
              <Card className="text-center py-5">
                <Card.Body>
                  <i className="bi bi-search display-1 text-muted mb-3"></i>
                  <h4>Không tìm thấy tour nào</h4>
                  <p className="text-muted">Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác</p>
                  <Button variant="outline-primary" onClick={resetFilters}>
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Đặt lại bộ lọc
                  </Button>
                </Card.Body>
              </Card>
            )}
          </div>
        </Col>
      </Row>
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

export default Tours
