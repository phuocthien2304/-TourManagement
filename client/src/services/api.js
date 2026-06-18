import axios from "axios"

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})


export const getNotifications = async () => {
  try {
    const res = await api.get('/notifications');
    return res.data;
  } catch (err) {
    console.error("Lỗi khi lấy thông báo:", err.response?.data?.msg || err.message);
    throw err;
  }
};

/**
 * Đánh dấu thông báo đã đọc
 * @param {string} id ID của thông báo
 */
export const markNotificationAsRead = async (id) => {
  try {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  } catch (err) {
    console.error("Lỗi khi đánh dấu đã đọc:", err.response?.data?.msg || err.message);
    throw err;
  }
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

export default api
