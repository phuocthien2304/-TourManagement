const mongoose = require("mongoose")

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: true,
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    numberOfPeople: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "paid", "cancelled"],
      default: "pending",
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
    },
    paymentMethod: { // Phương thức thanh toán
      type: String,
      enum: ["cash", "vnpay"],
      required: true,
      default: "cash",
    },
    paymentRef: { // Mã tham chiếu giao dịch (cho VNPAY)
        type: String,
    },
    vnpayOrderInfo: { // Thông tin mô tả thêm cho VNPAY
        type: String,
    }
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Booking", bookingSchema)
