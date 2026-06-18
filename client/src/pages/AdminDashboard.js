"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Modal,
  Form,
  Badge,
  Tabs,
  Tab,
  Image,
  Spinner,
  ProgressBar,
  Pagination,
  InputGroup,
} from "react-bootstrap"
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaStar,
  FaChartLine,
  FaUsers,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaDollarSign,
  FaImage,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaSearch,
  FaFilter,
} from "react-icons/fa"
import api from "../services/api"
import { useSocket } from "../contexts/SocketContext"
import { useAuth } from "../contexts/AuthContext"
import { toast } from "react-toastify"

const NewBookingToast = ({ notification, onUpdateStatus }) => (
  <div>
    <p>
      <strong>Thông báo mới!</strong>
    </p>
    <p>{notification.data.message}</p>
    <div style={{ marginTop: "10px" }}>
      <Button
        variant="success"
        size="sm"
        onClick={() => onUpdateStatus(notification.data.bookingId, "confirmed")}
        style={{ marginRight: "10px" }}
      >
        Xác nhận
      </Button>
      <Button variant="danger" size="sm" onClick={() => onUpdateStatus(notification.data.bookingId, "cancelled")}>
        Hủy
      </Button>
    </div>
  </div>
)


const AdminDashboard = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const socket = useSocket()
  const { user } = useAuth()

  const getTabFromURL = () => {
    const params = new URLSearchParams(location.search)
    return params.get("tab") || "overview"
  }

  const [activeTab, setActiveTab] = useState(getTabFromURL)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [tours, setTours] = useState([])
  const [reviews, setReviews] = useState([])
  const [statistics, setStatistics] = useState({})
  const [showTourModal, setShowTourModal] = useState(false)
  const [editingTour, setEditingTour] = useState(null)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [notification, setNotification] = useState({ type: "success", title: "", message: "", icon: null })
  const [tourData, setTourData] = useState({
    tourName: "",
    departure: "",
    destination: "",
    itinerary: "",
    startDate: "",
    endDate: "",
    transportation: "",
    price: "",
    availableSlots: "",
    totalSlots: "",
    services: [],
    images: [],
    imagesToRemove: [],
    category: "domestic",
    region: "",
    country: "Việt Nam",
    difficulty: "easy",
    tourType: "group",
    status: "active",
    featured: false,
    highlights: [],
    included: [],
    excluded: [],
  })

  // Pagination states
  const [tourPagination, setTourPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
  })

  const [bookingPagination, setBookingPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
  })

  const [reviewPagination, setReviewPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
  })

  // Filter states
  const [tourFilter, setTourFilter] = useState({
    status: "",
    category: "",
    keyword: "",
    region: "",
    featured: "",
  })

  const [bookingFilter, setBookingFilter] = useState({
    status: "",
    keyword: "",
    dateFrom: "",
    dateTo: "",
  })

  const [reviewFilter, setReviewFilter] = useState({
    status: "",
    keyword: "",
    rating: "",
    dateFrom: "",
    dateTo: "",
  })

  // Filtered and paginated data
  const [filteredTours, setFilteredTours] = useState([])
  const [filteredBookings, setFilteredBookings] = useState([])
  const [filteredReviews, setFilteredReviews] = useState([])

  const handleTabSelect = (selectedTab) => {
    setActiveTab(selectedTab)
    const params = new URLSearchParams(location.search)
    params.set("tab", selectedTab)
    navigate(`${location.pathname}?${params.toString()}`, { replace: true })
  }

  useEffect(() => {
    fetchData()
  }, [activeTab])

  useEffect(() => {
    if (socket && (user?.role === "admin" || user?.role === "employee") && activeTab === "bookings") {
      socket.on("getNotification", (notification) => {
        if (notification.type === "new_booking") {
          fetchData()
        }
      })
      return () => {
        socket.off("getNotification")
      }
    }
  }, [socket, user, activeTab])

  // Filter and pagination effects
  useEffect(() => {
    if (activeTab === "tours") {
      applyTourFilters()
    }
  }, [tours, tourFilter, tourPagination.currentPage])

  useEffect(() => {
    if (activeTab === "bookings") {
      applyBookingFilters()
    }
  }, [bookings, bookingFilter, bookingPagination.currentPage])

  useEffect(() => {
    if (activeTab === "reviews") {
      applyReviewFilters()
    }
  }, [reviews, reviewFilter, reviewPagination.currentPage])

  const fetchData = async () => {
    try {
      setLoading(true)
      if (activeTab === "bookings") {
        const response = await api.get("/bookings")
        setBookings(response.data.bookings)
      } else if (activeTab === "tours") {
        const response = await api.get("/tours/admin?limit=1000")
        setTours(response.data.tours)
      } else if (activeTab === "reviews") {
        const response = await api.get("/reviews")
        setReviews(response.data.reviews)
      } else if (activeTab === "overview") {
        const [bookingStats, tourStats, reviewStats] = await Promise.all([
          api.get("/statistics/bookings"),
          api.get("/statistics/tours"),
          api.get("/statistics/reviews"),
        ])
        setStatistics({
          bookings: bookingStats.data,
          tours: tourStats.data,
          reviews: reviewStats.data,
        })
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Lỗi khi tải dữ liệu.")
    } finally {
      setLoading(false)
    }
  }

  // Tour filtering and pagination
  const applyTourFilters = () => {
    let filtered = [...tours]

    // Apply filters
    if (tourFilter.keyword) {
      filtered = filtered.filter(
        (tour) =>
          tour.tourName.toLowerCase().includes(tourFilter.keyword.toLowerCase()) ||
          tour.destination.toLowerCase().includes(tourFilter.keyword.toLowerCase()) ||
          tour.departure.toLowerCase().includes(tourFilter.keyword.toLowerCase()),
      )
    }

    if (tourFilter.status) {
      filtered = filtered.filter((tour) => tour.status === tourFilter.status)
    }

    if (tourFilter.category) {
      filtered = filtered.filter((tour) => tour.category === tourFilter.category)
    }

    if (tourFilter.region) {
      filtered = filtered.filter((tour) => tour.region === tourFilter.region)
    }

    if (tourFilter.featured !== "") {
      filtered = filtered.filter((tour) => tour.featured === (tourFilter.featured === "true"))
    }

    // Update pagination
    const totalItems = filtered.length
    const totalPages = Math.ceil(totalItems / tourPagination.itemsPerPage)
    const startIndex = (tourPagination.currentPage - 1) * tourPagination.itemsPerPage
    const endIndex = startIndex + tourPagination.itemsPerPage

    setTourPagination((prev) => ({
      ...prev,
      totalItems,
      totalPages,
    }))

    setFilteredTours(filtered.slice(startIndex, endIndex))
  }

  // Booking filtering and pagination
  const applyBookingFilters = () => {
    let filtered = [...bookings]

    // Apply filters
    if (bookingFilter.keyword) {
      filtered = filtered.filter(
        (booking) =>
          booking.bookingId.toLowerCase().includes(bookingFilter.keyword.toLowerCase()) ||
          booking.customerId?.fullName.toLowerCase().includes(bookingFilter.keyword.toLowerCase()) ||
          booking.tourId?.tourName.toLowerCase().includes(bookingFilter.keyword.toLowerCase()),
      )
    }

    if (bookingFilter.status) {
      filtered = filtered.filter((booking) => booking.status === bookingFilter.status)
    }

    if (bookingFilter.dateFrom) {
      filtered = filtered.filter((booking) => new Date(booking.bookingDate) >= new Date(bookingFilter.dateFrom))
    }

    if (bookingFilter.dateTo) {
      filtered = filtered.filter((booking) => new Date(booking.bookingDate) <= new Date(bookingFilter.dateTo))
    }

    // Update pagination
    const totalItems = filtered.length
    const totalPages = Math.ceil(totalItems / bookingPagination.itemsPerPage)
    const startIndex = (bookingPagination.currentPage - 1) * bookingPagination.itemsPerPage
    const endIndex = startIndex + bookingPagination.itemsPerPage

    setBookingPagination((prev) => ({
      ...prev,
      totalItems,
      totalPages,
    }))

    setFilteredBookings(filtered.slice(startIndex, endIndex))
  }

  // Review filtering and pagination
  const applyReviewFilters = () => {
    let filtered = [...reviews]

    // Apply filters
    if (reviewFilter.keyword) {
      filtered = filtered.filter(
        (review) =>
          review.customerId?.fullName.toLowerCase().includes(reviewFilter.keyword.toLowerCase()) ||
          review.tourId?.tourName.toLowerCase().includes(reviewFilter.keyword.toLowerCase()) ||
          review.comment.toLowerCase().includes(reviewFilter.keyword.toLowerCase()),
      )
    }

    if (reviewFilter.status) {
      filtered = filtered.filter((review) => review.status === reviewFilter.status)
    }

    if (reviewFilter.rating) {
      filtered = filtered.filter((review) => review.rating === Number.parseInt(reviewFilter.rating))
    }

    if (reviewFilter.dateFrom) {
      filtered = filtered.filter((review) => new Date(review.reviewDate) >= new Date(reviewFilter.dateFrom))
    }

    if (reviewFilter.dateTo) {
      filtered = filtered.filter((review) => new Date(review.reviewDate) <= new Date(reviewFilter.dateTo))
    }

    // Update pagination
    const totalItems = filtered.length
    const totalPages = Math.ceil(totalItems / reviewPagination.itemsPerPage)
    const startIndex = (reviewPagination.currentPage - 1) * reviewPagination.itemsPerPage
    const endIndex = startIndex + reviewPagination.itemsPerPage

    setReviewPagination((prev) => ({
      ...prev,
      totalItems,
      totalPages,
    }))

    setFilteredReviews(filtered.slice(startIndex, endIndex))
  }

  // Reset filters
  const resetTourFilters = () => {
    setTourFilter({ status: "", category: "", keyword: "", region: "", featured: "" })
    setTourPagination((prev) => ({ ...prev, currentPage: 1 }))
  }

  const resetBookingFilters = () => {
    setBookingFilter({ status: "", keyword: "", dateFrom: "", dateTo: "" })
    setBookingPagination((prev) => ({ ...prev, currentPage: 1 }))
  }

  const resetReviewFilters = () => {
    setReviewFilter({ status: "", keyword: "", rating: "", dateFrom: "", dateTo: "" })
    setReviewPagination((prev) => ({ ...prev, currentPage: 1 }))
  }

  // Pagination handlers
  const handleTourPageChange = (pageNumber) => {
    setTourPagination((prev) => ({ ...prev, currentPage: pageNumber }))
  }

  const handleBookingPageChange = (pageNumber) => {
    setBookingPagination((prev) => ({ ...prev, currentPage: pageNumber }))
  }

  const handleReviewPageChange = (pageNumber) => {
    setReviewPagination((prev) => ({ ...prev, currentPage: pageNumber }))
  }

  const showNotification = (type, title, message) => {
    const icons = {
      success: <FaCheckCircle className="text-success" size={48} />,
      error: <FaTimesCircle className="text-danger" size={48} />,
      warning: <FaExclamationTriangle className="text-warning" size={48} />,
      info: <FaInfoCircle className="text-info" size={48} />,
    }

    setNotification({
      type,
      title,
      message,
      icon: icons[type],
    })
    setShowNotificationModal(true)
  }

  const validateTourData = () => {
    const required = [
      "tourName",
      "departure",
      "destination",
      "itinerary",
      "startDate",
      "endDate",
      "transportation",
      "price",
      "availableSlots",
      "totalSlots",
      "region",
    ]
    const missing = required.filter((field) => !tourData[field] || tourData[field].toString().trim() === "")

    if (missing.length > 0) {
      const fieldNames = {
        tourName: "Tên Tour",
        departure: "Điểm khởi hành",
        destination: "Điểm đến",
        itinerary: "Lịch trình",
        startDate: "Ngày bắt đầu",
        endDate: "Ngày kết thúc",
        transportation: "Phương tiện",
        price: "Giá",
        availableSlots: "Chỗ còn lại",
        totalSlots: "Tổng số chỗ",
        region: "Vùng miền",
      }

      const missingNames = missing.map((field) => fieldNames[field]).join(", ")
      showNotification("warning", "Thông tin chưa đầy đủ", `Vui lòng điền đầy đủ các trường: ${missingNames}`)
      return false
    }

    if (new Date(tourData.startDate) > new Date(tourData.endDate)) {
      showNotification("warning", "Ngày không hợp lệ", "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu")
      return false
    }

    if (Number.parseInt(tourData.availableSlots) > Number.parseInt(tourData.totalSlots)) {
      showNotification("warning", "Số chỗ không hợp lệ", "Chỗ còn lại không thể lớn hơn tổng số chỗ")
      return false
    }

    return true
  }

  const handleTourSubmit = async (e) => {
    e.preventDefault()

    if (!validateTourData()) {
      return
    }

    try {
      const formData = new FormData()

      // Append các field thông thường
      for (const key in tourData) {
        if (key === "services" || key === "highlights" || key === "included" || key === "excluded") {
          tourData[key].forEach((item) => formData.append(key, item))
        } else if (key === "images" || key === "imagesToRemove") {
          // Xử lý riêng ở dưới
        } else {
          formData.append(key, tourData[key])
        }
      }

      // Append images mới
      tourData.images.forEach((file) => {
        formData.append("images", file)
      })

      // Append imagesToRemove (nếu có)
      tourData.imagesToRemove.forEach((filePath) => {
        formData.append("imagesToRemove", filePath)
      })

      const url = editingTour ? `/tours/${editingTour._id}` : "/tours"
      const method = editingTour ? "put" : "post"

      await api[method](url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      showNotification(
        "success",
        editingTour ? "Cập nhật thành công" : "Tạo tour thành công",
        `Tour "${tourData.tourName}" đã được ${editingTour ? "cập nhật" : "tạo"} thành công!`,
      )

      setShowTourModal(false)
      resetTourForm()
      fetchData()
    } catch (error) {
      showNotification(
        "error",
        editingTour ? "Lỗi cập nhật tour" : "Lỗi tạo tour",
        error.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại.",
      )
    }
  }

  const handleEditTour = (tour) => {
    setEditingTour(tour)
    setTourData({
      tourName: tour.tourName,
      departure: tour.departure,
      destination: tour.destination,
      itinerary: tour.itinerary,
      startDate: tour.startDate.split("T")[0],
      endDate: tour.endDate.split("T")[0],
      transportation: tour.transportation,
      price: tour.price.toString(),
      availableSlots: tour.availableSlots.toString(),
      totalSlots: tour.totalSlots?.toString() || tour.availableSlots.toString(),
      services: tour.services || [],
      images: [],
      imagesToRemove: [],
      category: tour.category || "domestic",
      region: tour.region || "",
      country: tour.country || "Việt Nam",
      difficulty: tour.difficulty || "easy",
      tourType: tour.tourType || "group",
      status: tour.status || "active",
      featured: tour.featured || false,
      highlights: tour.highlights || [],
      included: tour.included || [],
      excluded: tour.excluded || [],
    })
    setShowTourModal(true)
  }

  const handleDeleteTour = async (tour) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa tour "${tour.tourName}"?`)) {
      try {
        await api.delete(`/tours/${tour._id}`)
        showNotification("success", "Xóa thành công", `Tour "${tour.tourName}" đã được xóa thành công!`)
        fetchData()
      } catch (error) {
        showNotification("error", "Lỗi xóa tour", "Có lỗi xảy ra khi xóa tour. Vui lòng thử lại.")
      }
    }
  }

  const handleBookingStatusUpdate = async (bookingId, status) => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status })
      const statusText = {
        confirmed: "xác nhận",
        cancelled: "hủy",
        paid: "đánh dấu đã thanh toán",
      }

      toast.success(`Đã ${statusText[status]} đơn đặt tour.`)
      toast.dismiss(bookingId)
      fetchData()
    } catch (error) {
      toast.error("Lỗi khi cập nhật trạng thái đơn đặt tour.")
    }
  }

  const handleReviewStatusUpdate = async (review, status) => {
    try {
      await api.put(`/reviews/${review._id}/status`, { status })
      const statusText = {
        approved: "duyệt",
        rejected: "từ chối",
      }
      showNotification(
        "success",
        "Cập nhật thành công",
        `Đã ${statusText[status]} đánh giá của ${review.customerId?.fullName}`,
      )
      fetchData()
    } catch (error) {
      showNotification("error", "Lỗi cập nhật", "Có lỗi xảy ra khi cập nhật trạng thái đánh giá.")
    }
  }

  const resetTourForm = () => {
    setEditingTour(null)
    setTourData({
      tourName: "",
      departure: "",
      destination: "",
      itinerary: "",
      startDate: "",
      endDate: "",
      transportation: "",
      price: "",
      availableSlots: "",
      totalSlots: "",
      services: [],
      images: [],
      imagesToRemove: [],
      category: "domestic",
      region: "",
      country: "Việt Nam",
      difficulty: "easy",
      tourType: "group",
      status: "active",
      featured: false,
      highlights: [],
      included: [],
      excluded: [],
    })
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

  const getStatusBadge = (status, type = "booking") => {
    let statusMap = {}

    if (type === "booking") {
      statusMap = {
        pending: { text: "Chờ xác nhận", variant: "warning" },
        confirmed: { text: "Đã xác nhận", variant: "info" },
        paid: { text: "Đã thanh toán", variant: "success" },
        cancelled: { text: "Đã hủy", variant: "danger" },
      }
    } else if (type === "review") {
      statusMap = {
        pending: { text: "Chờ duyệt", variant: "warning" },
        approved: { text: "Đã duyệt", variant: "success" },
        rejected: { text: "Từ chối", variant: "danger" },
      }
    }

    const statusInfo = statusMap[status] || { text: status, variant: "secondary" }
    return <Badge bg={statusInfo.variant}>{statusInfo.text}</Badge>
  }

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FaStar key={index} className={index < rating ? "text-warning" : "text-muted"} />
    ))
  }

  const getRegionOptions = () => {
    if (tourData.category === "domestic") {
      return [
        { value: "mien-bac", label: "Miền Bắc" },
        { value: "mien-trung", label: "Miền Trung" },
        { value: "mien-nam", label: "Miền Nam" },
      ]
    } else {
      return [
        { value: "dong-nam-a", label: "Đông Nam Á" },
        { value: "dong-a", label: "Đông Á" },
        { value: "chau-au", label: "Châu Âu" },
        { value: "chau-my", label: "Châu Mỹ" },
        { value: "chau-uc", label: "Châu Úc" },
        { value: "chau-phi", label: "Châu Phi" },
      ]
    }
  }

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card className="h-100 shadow-sm border-0">
      <Card.Body className="d-flex align-items-center">
        <div className={`rounded-circle p-3 me-3 bg-${color} bg-opacity-10`}>
          <div className={`text-${color}`} style={{ fontSize: "1.5rem" }}>
            {icon}
          </div>
        </div>
        <div className="flex-grow-1">
          <h6 className="text-muted mb-1">{title}</h6>
          <h4 className="mb-0">{value}</h4>
          {subtitle && <small className="text-muted">{subtitle}</small>}
        </div>
      </Card.Body>
    </Card>
  )

  // Render pagination component
  const renderPagination = (pagination, onPageChange) => {
    if (pagination.totalPages <= 1) return null

    const items = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    // First page
    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => onPageChange(1)}>
          1
        </Pagination.Item>,
      )
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="start-ellipsis" />)
      }
    }

    // Visible pages
    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item key={page} active={page === pagination.currentPage} onClick={() => onPageChange(page)}>
          {page}
        </Pagination.Item>,
      )
    }

    // Last page
    if (endPage < pagination.totalPages) {
      if (endPage < pagination.totalPages - 1) {
        items.push(<Pagination.Ellipsis key="end-ellipsis" />)
      }
      items.push(
        <Pagination.Item key={pagination.totalPages} onClick={() => onPageChange(pagination.totalPages)}>
          {pagination.totalPages}
        </Pagination.Item>,
      )
    }

    return (
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="text-muted">
          Hiển thị {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} -{" "}
          {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} trong tổng số{" "}
          {pagination.totalItems} mục
        </div>
        <Pagination className="mb-0">
          <Pagination.Prev
            disabled={pagination.currentPage === 1}
            onClick={() => onPageChange(pagination.currentPage - 1)}
          />
          {items}
          <Pagination.Next
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => onPageChange(pagination.currentPage + 1)}
          />
        </Pagination>
      </div>
    )
  }

  return (
    <Container className="py-4" style={{marginTop:"62px"}}>
      <h1 className="h3 mb-0">Quản trị hệ thống</h1>
      <p className="text-muted mb-0">Quản lý tours, đặt chỗ và đánh giá</p>

      <Tabs activeKey={activeTab} onSelect={handleTabSelect} className="mt-4 mb-4 nav-pills">
        <Tab
          eventKey="overview"
          title={
            <>
              <FaChartLine className="me-2" />
              Tổng quan
            </>
          }
        >
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <>
              <Row className="mb-4">
                <Col md={3}>
                  <StatCard
                    title="Tổng đơn đặt"
                    value={statistics.bookings?.totalBookings || 0}
                    icon={<FaUsers />}
                    color="info"
                  />
                </Col>
                <Col md={3}>
                  <StatCard
                    title="Doanh thu"
                    value={formatPrice(statistics.bookings?.totalRevenue || 0)}
                    icon={<FaDollarSign />}
                    color="success"
                  />
                </Col>
                <Col md={3}>
                  <StatCard
                    title="Tổng đánh giá"
                    value={statistics.reviews?.totalReviews || 0}
                    icon={<FaStar />}
                    color="warning"
                    subtitle={`${statistics.reviews?.pendingReviews || 0} chờ duyệt`}
                  />
                </Col>
                <Col md={3}>
                  <StatCard
                    title="Tours hoạt động"
                    value={tours.filter((t) => t.status === "active").length}
                    icon={<FaMapMarkerAlt />}
                    color="info"
                  />
                </Col>
              </Row>

              <Row>
                <Col md={8}>
                  <Card className="shadow-sm border-0">
                    <Card.Header className="bg-white border-bottom">
                      <h5 className="mb-0">Tours phổ biến</h5>
                    </Card.Header>
                    <Card.Body>
                      {statistics.tours?.popularTours?.slice(0, 5).map((tour, index) => (
                        <div
                          key={index}
                          className="d-flex justify-content-between align-items-center py-2 border-bottom"
                        >
                          <div>
                            <h6 className="mb-1">{tour.tour.tourName}</h6>
                            <small className="text-muted">{tour.tour.destination}</small>
                          </div>
                          <Badge bg="primary">{tour.bookingCount} lượt đặt</Badge>
                        </div>
                      ))}
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="shadow-sm border-0">
                    <Card.Header className="bg-white border-bottom">
                      <h5 className="mb-0">Thống kê đặt Tour</h5>
                    </Card.Header>
                    <Card.Body>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <small>Đã duyệt</small>
                          <small>
                            {statistics.reviews?.approvedReviews || 0}/{statistics.reviews?.totalReviews || 0}
                          </small>
                        </div>
                        <ProgressBar
                          now={
                            ((statistics.reviews?.approvedReviews || 0) / (statistics.reviews?.totalReviews || 1)) * 100
                          }
                          variant="success"
                        />
                      </div>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <small>Chờ duyệt</small>
                          <small>
                            {statistics.reviews?.pendingReviews || 0}/{statistics.reviews?.totalReviews || 0}
                          </small>
                        </div>
                        <ProgressBar
                          now={
                            ((statistics.reviews?.pendingReviews || 0) / (statistics.reviews?.totalReviews || 1)) * 100
                          }
                          variant="warning"
                        />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Tab>

        <Tab
          eventKey="tours"
          title={
            <>
              <FaMapMarkerAlt className="me-2" />
              Quản lý Tours
            </>
          }
        >
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="mb-0">Danh sách Tours</h4>
              <p className="text-muted mb-0">Quản lý tất cả các tour du lịch</p>
            </div>
            <Button
              variant="primary"
              className="d-flex align-items-center"
              onClick={() => {
                resetTourForm()
                setShowTourModal(true)
              }}
            >
              <FaPlus className="me-2" />
              Thêm Tour Mới
            </Button>
          </div>

          {/* Tour Filters */}
          <Card className="mb-4">
            <Card.Header className="bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <FaFilter className="me-2" />
                  Bộ lọc
                </h6>
                <Button variant="outline-secondary" size="sm" onClick={resetTourFilters}>
                  Xóa bộ lọc
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tìm kiếm</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaSearch />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Tên tour, điểm đến..."
                        value={tourFilter.keyword}
                        onChange={(e) => setTourFilter({ ...tourFilter, keyword: e.target.value })}
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Trạng thái</Form.Label>
                    <Form.Select
                      value={tourFilter.status}
                      onChange={(e) => setTourFilter({ ...tourFilter, status: e.target.value })}
                    >
                      <option value="">Tất cả</option>
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Không hoạt động</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Danh mục</Form.Label>
                    <Form.Select
                      value={tourFilter.category}
                      onChange={(e) => setTourFilter({ ...tourFilter, category: e.target.value })}
                    >
                      <option value="">Tất cả</option>
                      <option value="domestic">Trong nước</option>
                      <option value="international">Nước ngoài</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Vùng miền</Form.Label>
                    <Form.Select
                      value={tourFilter.region}
                      onChange={(e) => setTourFilter({ ...tourFilter, region: e.target.value })}
                    >
                      <option value="">Tất cả</option>
                      <option value="mien-bac">Miền Bắc</option>
                      <option value="mien-trung">Miền Trung</option>
                      <option value="mien-nam">Miền Nam</option>
                      <option value="dong-nam-a">Đông Nam Á</option>
                      <option value="dong-a">Đông Á</option>
                      <option value="chau-au">Châu Âu</option>
                      <option value="chau-my">Châu Mỹ</option>
                      <option value="chau-uc">Châu Úc</option>
                      <option value="chau-phi">Châu Phi</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tour nổi bật</Form.Label>
                    <Form.Select
                      value={tourFilter.featured}
                      onChange={(e) => setTourFilter({ ...tourFilter, featured: e.target.value })}
                    >
                      <option value="">Tất cả</option>
                      <option value="true">Có</option>
                      <option value="false">Không</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Đang tải danh sách tours...</p>
            </div>
          ) : (
            <Card className="shadow-sm border-0">
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 px-4 py-3">Tour</th>
                      <th className="border-0 py-3">Danh mục</th>
                      <th className="border-0 py-3">Điểm đến</th>
                      <th className="border-0 py-3">Giá</th>
                      <th className="border-0 py-3">Chỗ trống</th>
                      <th className="border-0 py-3">Ngày bắt đầu</th>
                      <th className="border-0 py-3">Trạng thái</th>
                      <th className="border-0 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTours.map((tour) => (
                      <tr key={tour._id}>
                        <td className="px-4 py-3">
                          <div>
                            <h6 className="mb-1">{tour.tourName}</h6>
                            {tour.featured && (
                              <Badge bg="warning" className="me-1">
                                <FaStar className="me-1" size={10} />
                                Nổi bật
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge bg={tour.category === "domestic" ? "success" : "info"}>
                            {tour.category === "domestic" ? "Trong nước" : "Nước ngoài"}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <FaMapMarkerAlt className="text-muted me-1" />
                          {tour.destination}
                        </td>
                        <td className="py-3">
                          <strong className="text-success">{formatPrice(tour.price)}</strong>
                        </td>
                        <td className="py-3">
                          <span className={tour.availableSlots === 0 ? "text-danger" : "text-success"}>
                            {tour.availableSlots}/{tour.totalSlots || tour.availableSlots}
                          </span>
                        </td>
                        <td className="py-3">
                          <FaCalendarAlt className="text-muted me-1" />
                          {formatDate(tour.startDate)}
                        </td>
                        <td className="py-3">
                          <Badge bg={tour.status === "active" ? "success" : "secondary"}>
                            {tour.status === "active" ? "Hoạt động" : "Không hoạt động"}
                          </Badge>
                        </td>
                        <td className="py-3 text-center">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEditTour(tour)}
                          >
                            <FaEdit />
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDeleteTour(tour)}>
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                {renderPagination(tourPagination, handleTourPageChange)}
              </Card.Body>
            </Card>
          )}
        </Tab>

        <Tab
          eventKey="bookings"
          title={
            <>
              <FaUsers className="me-2" />
              Quản lý Đặt Tour
            </>
          }
        >
          <div className="mb-4">
            <h4 className="mb-0">Danh sách Đặt Tour</h4>
            <p className="text-muted mb-0">Quản lý tất cả các đơn đặt tour</p>
          </div>

          {/* Booking Filters */}
          <Card className="mb-4">
            <Card.Header className="bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <FaFilter className="me-2" />
                  Bộ lọc
                </h6>
                <Button variant="outline-secondary" size="sm" onClick={resetBookingFilters}>
                  Xóa bộ lọc
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tìm kiếm</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaSearch />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Mã đơn, tên khách hàng, tour..."
                        value={bookingFilter.keyword}
                        onChange={(e) => setBookingFilter({ ...bookingFilter, keyword: e.target.value })}
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Trạng thái</Form.Label>
                    <Form.Select
                      value={bookingFilter.status}
                      onChange={(e) => setBookingFilter({ ...bookingFilter, status: e.target.value })}
                    >
                      <option value="">Tất cả</option>
                      <option value="pending">Chờ xác nhận</option>
                      <option value="confirmed">Đã xác nhận</option>
                      <option value="paid">Đã thanh toán</option>
                      <option value="cancelled">Đã hủy</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Từ ngày</Form.Label>
                    <Form.Control
                      type="date"
                      value={bookingFilter.dateFrom}
                      onChange={(e) => setBookingFilter({ ...bookingFilter, dateFrom: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Đến ngày</Form.Label>
                    <Form.Control
                      type="date"
                      value={bookingFilter.dateTo}
                      onChange={(e) => setBookingFilter({ ...bookingFilter, dateTo: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Đang tải danh sách đặt tour...</p>
            </div>
          ) : (
            <Card className="shadow-sm border-0">
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 px-4 py-3">Mã đơn</th>
                      <th className="border-0 py-3">Khách hàng</th>
                      <th className="border-0 py-3">Tour</th>
                      <th className="border-0 py-3">Số người</th>
                      <th className="border-0 py-3">Tổng tiền</th>
                      <th className="border-0 py-3">Ngày đặt</th>
                      <th className="border-0 py-3">Trạng thái</th>
                      <th className="border-0 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => (
                      <tr key={booking._id}>
                        <td className="px-4 py-3">
                          <code>{booking.bookingId}</code>
                        </td>
                        <td className="py-3">{booking.customerId?.fullName}</td>
                        <td className="py-3">{booking.tourId?.tourName}</td>
                        <td className="py-3">
                          <FaUsers className="text-muted me-1" />
                          {booking.numberOfPeople}
                        </td>
                        <td className="py-3">
                          <strong className="text-success">{formatPrice(booking.totalAmount)}</strong>
                        </td>
                        <td className="py-3">{formatDate(booking.bookingDate)}</td>
                        <td className="py-3">{getStatusBadge(booking.status, "booking")}</td>
                        <td className="py-3 text-center">
                          {booking.status === "pending" && (
                            <>
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="me-2"
                                onClick={() => handleBookingStatusUpdate(booking._id, "confirmed")}
                              >
                                <FaCheck className="me-1" />
                                Xác nhận
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleBookingStatusUpdate(booking._id, "cancelled")}
                              >
                                <FaTimes className="me-1" />
                                Hủy
                              </Button>
                            </>
                          )}
                          {booking.status === "confirmed" && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleBookingStatusUpdate(booking._id, "paid")}
                            >
                              <FaDollarSign className="me-1" />
                              Đã thanh toán
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                {renderPagination(bookingPagination, handleBookingPageChange)}
              </Card.Body>
            </Card>
          )}
        </Tab>

        <Tab
          eventKey="reviews"
          title={
            <>
              <FaStar className="me-2" />
              Quản lý Đánh giá
            </>
          }
        >
          <div className="mb-4">
            <h4 className="mb-0">Danh sách Đánh giá</h4>
            <p className="text-muted mb-0">Quản lý tất cả các đánh giá từ khách hàng</p>
          </div>

          {/* Review Filters */}
          <Card className="mb-4">
            <Card.Header className="bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <FaFilter className="me-2" />
                  Bộ lọc
                </h6>
                <Button variant="outline-secondary" size="sm" onClick={resetReviewFilters}>
                  Xóa bộ lọc
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tìm kiếm</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaSearch />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Tên khách hàng, tour, nội dung..."
                        value={reviewFilter.keyword}
                        onChange={(e) => setReviewFilter({ ...reviewFilter, keyword: e.target.value })}
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Trạng thái</Form.Label>
                    <Form.Select
                      value={reviewFilter.status}
                      onChange={(e) => setReviewFilter({ ...reviewFilter, status: e.target.value })}
                    >
                      <option value="">Tất cả</option>
                      <option value="pending">Chờ duyệt</option>
                      <option value="approved">Đã duyệt</option>
                      <option value="rejected">Từ chối</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Đánh giá</Form.Label>
                    <Form.Select
                      value={reviewFilter.rating}
                      onChange={(e) => setReviewFilter({ ...reviewFilter, rating: e.target.value })}
                    >
                      <option value="">Tất cả</option>
                      <option value="5">5 sao</option>
                      <option value="4">4 sao</option>
                      <option value="3">3 sao</option>
                      <option value="2">2 sao</option>
                      <option value="1">1 sao</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Từ ngày</Form.Label>
                    <Form.Control
                      type="date"
                      value={reviewFilter.dateFrom}
                      onChange={(e) => setReviewFilter({ ...reviewFilter, dateFrom: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Đến ngày</Form.Label>
                    <Form.Control
                      type="date"
                      value={reviewFilter.dateTo}
                      onChange={(e) => setReviewFilter({ ...reviewFilter, dateTo: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Đang tải danh sách đánh giá...</p>
            </div>
          ) : (
            <Card className="shadow-sm border-0">
              <Card.Body className="p-0">
                <Table responsive hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 px-4 py-3">Khách hàng</th>
                      <th className="border-0 py-3">Tour</th>
                      <th className="border-0 py-3">Đánh giá</th>
                      <th className="border-0 py-3">Nội dung</th>
                      <th className="border-0 py-3">Ngày đánh giá</th>
                      <th className="border-0 py-3">Trạng thái</th>
                      <th className="border-0 py-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReviews.map((review) => (
                      <tr key={review._id}>
                        <td className="px-4 py-3">{review.customerId?.fullName}</td>
                        <td className="py-3">{review.tourId?.tourName}</td>
                        <td className="py-3">
                          <div className="d-flex align-items-center">
                            {renderStars(review.rating)}
                            <span className="ms-2 text-muted">({review.rating}/5)</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div style={{ maxWidth: "200px" }}>
                            {review.comment.substring(0, 100)}
                            {review.comment.length > 100 && "..."}
                          </div>
                        </td>
                        <td className="py-3">{formatDate(review.reviewDate)}</td>
                        <td className="py-3">{getStatusBadge(review.status, "review")}</td>
                        <td className="py-3 text-center">
                          {review.status === "pending" && (
                            <>
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="me-2"
                                onClick={() => handleReviewStatusUpdate(review, "approved")}
                              >
                                <FaCheck className="me-1" />
                                Duyệt
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleReviewStatusUpdate(review, "rejected")}
                              >
                                <FaTimes className="me-1" />
                                Từ chối
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                {renderPagination(reviewPagination, handleReviewPageChange)}
              </Card.Body>
            </Card>
          )}
        </Tab>
      </Tabs>

      {/* Notification Modal */}
      <Modal show={showNotificationModal} onHide={() => setShowNotificationModal(false)} centered size="sm">
        <Modal.Body className="text-center py-4">
          <div className="mb-3">{notification.icon}</div>
          <h5 className="mb-2">{notification.title}</h5>
          <p className="text-muted mb-3">{notification.message}</p>
          <Button
            variant={notification.type === "error" ? "danger" : "primary"}
            onClick={() => setShowNotificationModal(false)}
          >
            Đóng
          </Button>
        </Modal.Body>
      </Modal>

      {/* Tour Modal */}
      <Modal show={showTourModal} onHide={() => setShowTourModal(false)} size="xl">
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title>
            <FaMapMarkerAlt className="me-2" />
            {editingTour ? "Sửa Tour" : "Thêm Tour Mới"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleTourSubmit}>
          <Modal.Body>
            <Tabs defaultActiveKey="basic" className="mb-3">
              <Tab
                eventKey="basic"
                title={
                  <>
                    <FaInfoCircle className="me-2" />
                    Thông tin cơ bản
                  </>
                }
              >
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tên Tour *</Form.Label>
                      <Form.Control
                        type="text"
                        value={tourData.tourName}
                        onChange={(e) => setTourData({ ...tourData, tourName: e.target.value })}
                        required
                        placeholder="Nhập tên tour..."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Điểm khởi hành *</Form.Label>
                      <Form.Control
                        type="text"
                        value={tourData.departure}
                        onChange={(e) => setTourData({ ...tourData, departure: e.target.value })}
                        required
                        placeholder="Nhập điểm khởi hành..."
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Điểm đến *</Form.Label>
                      <Form.Control
                        type="text"
                        value={tourData.destination}
                        onChange={(e) => setTourData({ ...tourData, destination: e.target.value })}
                        required
                        placeholder="Nhập điểm đến..."
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phương tiện *</Form.Label>
                      <Form.Control
                        type="text"
                        value={tourData.transportation}
                        onChange={(e) => setTourData({ ...tourData, transportation: e.target.value })}
                        required
                        placeholder="Ví dụ: Xe khách, Máy bay..."
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Danh mục Tour *</Form.Label>
                      <Form.Select
                        value={tourData.category}
                        onChange={(e) => setTourData({ ...tourData, category: e.target.value, region: "" })}
                        required
                      >
                        <option value="domestic">Trong nước</option>
                        <option value="international">Nước ngoài</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Vùng miền *</Form.Label>
                      <Form.Select
                        value={tourData.region}
                        onChange={(e) => setTourData({ ...tourData, region: e.target.value })}
                        required
                      >
                        <option value="">Chọn vùng miền</option>
                        {getRegionOptions().map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Quốc gia</Form.Label>
                      <Form.Control
                        type="text"
                        value={tourData.country}
                        onChange={(e) => setTourData({ ...tourData, country: e.target.value })}
                        placeholder="Nhập quốc gia..."
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Loại tour</Form.Label>
                      <Form.Select
                        value={tourData.tourType}
                        onChange={(e) => setTourData({ ...tourData, tourType: e.target.value })}
                      >
                        <option value="group">Theo đoàn</option>
                        <option value="private">Riêng tư</option>
                        <option value="luxury">Cao cấp</option>
                        <option value="adventure">Phiêu lưu</option>
                        <option value="cultural">Văn hóa</option>
                        <option value="beach">Biển đảo</option>
                        <option value="mountain">Núi rừng</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Độ khó</Form.Label>
                      <Form.Select
                        value={tourData.difficulty}
                        onChange={(e) => setTourData({ ...tourData, difficulty: e.target.value })}
                      >
                        <option value="easy">Dễ</option>
                        <option value="moderate">Trung bình</option>
                        <option value="challenging">Khó</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Trạng thái</Form.Label>
                      <Form.Select
                        value={tourData.status}
                        onChange={(e) => setTourData({ ...tourData, status: e.target.value })}
                      >
                        <option value="active">Hoạt động</option>
                        <option value="inactive">Không hoạt động</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3 d-flex align-items-end">
                      <Form.Check
                        type="checkbox"
                        label="Tour nổi bật"
                        checked={tourData.featured}
                        onChange={(e) => setTourData({ ...tourData, featured: e.target.checked })}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Ngày bắt đầu *</Form.Label>
                      <Form.Control
                        type="date"
                        value={tourData.startDate}
                        onChange={(e) => setTourData({ ...tourData, startDate: e.target.value })}
                        required

                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Ngày kết thúc *</Form.Label>
                      <Form.Control
                        type="date"
                        value={tourData.endDate}
                        onChange={(e) => setTourData({ ...tourData, endDate: e.target.value })}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Giá (VND) *</Form.Label>
                      <Form.Control
                        type="number"
                        value={tourData.price}
                        onChange={(e) => setTourData({ ...tourData, price: e.target.value })}
                        required
                        min="0"
                        placeholder="0"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tổng số chỗ *</Form.Label>
                      <Form.Control
                        type="number"
                        value={tourData.totalSlots}
                        onChange={(e) =>
                          setTourData({
                            ...tourData,
                            totalSlots: e.target.value,
                            availableSlots:
                              tourData.availableSlots > e.target.value ? e.target.value : tourData.availableSlots,
                          })
                        }
                        required
                        min="1"
                        placeholder="0"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Chỗ còn lại *</Form.Label>
                      <Form.Control
                        type="number"
                        value={tourData.availableSlots}
                        onChange={(e) => setTourData({ ...tourData, availableSlots: e.target.value })}
                        required
                        min="0"
                        max={tourData.totalSlots}
                        placeholder="0"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Tab>

              <Tab
                eventKey="details"
                title={
                  <>
                    <FaEdit className="me-2" />
                    Chi tiết
                  </>
                }
              >
                <Form.Group className="mb-3">
                  <Form.Label>Lịch trình *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={tourData.itinerary}
                    onChange={(e) => setTourData({ ...tourData, itinerary: e.target.value })}
                    required
                    placeholder="Mô tả chi tiết lịch trình tour..."
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Điểm nổi bật (mỗi điểm một dòng)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={tourData.highlights.join("\n")}
                    onChange={(e) =>
                      setTourData({
                        ...tourData,
                        highlights: e.target.value.split("\n"),
                      })
                    }
                    placeholder="Ví dụ:&#10;Khám phá vịnh Hạ Long&#10;Thăm động Thiên Cung&#10;Trải nghiệm kayak"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Dịch vụ bao gồm (mỗi dịch vụ một dòng)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={tourData.included.join("\n")}
                    onChange={(e) =>
                      setTourData({
                        ...tourData,
                        included: e.target.value.split("\n"),
                      })
                    }
                    placeholder="Ví dụ:&#10;Khách sạn 4 sao&#10;Ăn 3 bữa/ngày&#10;Hướng dẫn viên"
                  />
                </Form.Group>

               <Form.Group className="mb-3">
  <Form.Label>Dịch vụ không bao gồm (mỗi dịch vụ một dòng)</Form.Label>
  <Form.Control
  as="textarea"
  rows={3}
  value={tourData.excluded.join("\n")}
  onChange={(e) =>
    setTourData({
      ...tourData,
      excluded: e.target.value.split("\n"),
    })
  }
  placeholder={`Ví dụ:\nVé máy bay quốc tế\nChi phí cá nhân\nBảo hiểm du lịch`}
  style={{ whiteSpace: "pre-wrap !important" }}
/>
</Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Dịch vụ khác (mỗi dịch vụ một dòng)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={tourData.services.join("\n")}
                    onChange={(e) =>
                      setTourData({
                        ...tourData,
                        services: e.target.value.split("\n"),
                      })
                    }
                    placeholder="Ví dụ:&#10;Xe đưa đón sân bay&#10;Nước suối miễn phí&#10;WiFi trên xe"
                  />
                </Form.Group>
              </Tab>

              <Tab
                eventKey="images"
                title={
                  <>
                    <FaImage className="me-2" />
                    Hình ảnh
                  </>
                }
              >
                <Form.Group className="mb-3">
                  <Form.Label>Hình ảnh (tối đa 5 ảnh, định dạng .jpg, .jpeg, .png, tối đa 5MB mỗi ảnh)</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(e) => {
                      const maxImages =
                        5 - (editingTour ? editingTour.images?.length - tourData.imagesToRemove.length : 0)
                      const newImages = Array.from(e.target.files).slice(0, maxImages)
                      if (newImages.length !== e.target.files.length) {
                        showNotification("warning", "Giới hạn ảnh", `Bạn chỉ có thể thêm tối đa ${maxImages} ảnh mới`)
                      }
                      setTourData({ ...tourData, images: newImages })
                    }}
                  />
                  <Form.Text className="text-muted">
                    {editingTour
                      ? `Còn ${5 - ((editingTour.images?.length || 0) - tourData.imagesToRemove.length)} slot ảnh`
                      : "Chọn tối đa 5 ảnh (mỗi ảnh tối đa 5MB)"}
                  </Form.Text>
                </Form.Group>

                {tourData.images.length > 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label>Hình ảnh mới chọn</Form.Label>
                    <Row>
                      {tourData.images.map((image, index) => (
                        <Col md={4} key={index} className="mb-2">
                          <div className="position-relative">
                            <Image
                              src={URL.createObjectURL(image) || "/placeholder.svg"}
                              alt={`New image ${index + 1}`}
                              thumbnail
                              style={{ maxHeight: "150px", objectFit: "cover", width: "100%" }}
                            />
                            <Button
                              variant="danger"
                              size="sm"
                              className="position-absolute top-0 end-0 m-1"
                              onClick={() =>
                                setTourData({
                                  ...tourData,
                                  images: tourData.images.filter((_, i) => i !== index),
                                })
                              }
                            >
                              <FaTimes />
                            </Button>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </Form.Group>
                )}

                {editingTour && editingTour.images && editingTour.images.length > 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label>Hình ảnh hiện tại</Form.Label>
                    <Row>
                      {editingTour.images
                        .filter((image) => !tourData.imagesToRemove.includes(image))
                        .map((image, index) => (
                          <Col md={4} key={index} className="mb-2">
                            <div className="position-relative">
                              <Image
                                src={`${process.env.REACT_APP_API_URL || "http://localhost:5000"}${image}`}
                                alt={`Tour image ${index + 1}`}
                                thumbnail
                                style={{ maxHeight: "150px", objectFit: "cover", width: "100%" }}
                              />
                              <Button
                                variant="danger"
                                size="sm"
                                className="position-absolute top-0 end-0 m-1"
                                onClick={() =>
                                  setTourData({
                                    ...tourData,
                                    imagesToRemove: [...tourData.imagesToRemove, image],
                                  })
                                }
                              >
                                <FaTimes />
                              </Button>
                            </div>
                          </Col>
                        ))}
                    </Row>
                  </Form.Group>
                )}
              </Tab>
            </Tabs>
          </Modal.Body>
          <Modal.Footer className="border-top">
            <Button variant="outline-secondary" onClick={() => setShowTourModal(false)}>
              <FaTimes className="me-2" />
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              <FaCheck className="me-2" />
              {editingTour ? "Cập nhật Tour" : "Tạo Tour"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}

export default AdminDashboard