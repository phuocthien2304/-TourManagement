const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Người nhận thông báo (có thể là Customer hoặc Employee)
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientModel'
  },
  recipientModel: {
    type: String,
    required: true,
    enum: ['Customer', 'Employee']
  },
  // Người gửi thông báo
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderModel'
  },
  senderModel: {
    type: String,
    required: true,
    enum: ['Customer', 'Employee']
  },
  // Loại thông báo
  type: {
    type: String,
    required: true,
    enum: ['new_booking', 'booking_confirmation', 'cancellation', 'new_review', 'system_update', 'direct_message']
  },
  // Nội dung thông báo
  message: {
    type: String,
    required: true
  },
  // Trạng thái đã đọc hay chưa
  read: {
    type: Boolean,
    default: false
  },
  // (Tùy chọn) Đường dẫn để điều hướng khi nhấp vào thông báo
  link: {
    type: String
    
  }
}, {
  timestamps: true // Tự động thêm createdAt và updatedAt
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;