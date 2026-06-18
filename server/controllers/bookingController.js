const express = require("express")
const Booking = require("../models/Booking")
const Tour = require("../models/Tour")
const { auth, customerAuth, employeeAuth } = require("../middleware/auth")
const Employee = require("../models/Employee")
const Notification = require("../models/Notification")
const Customer = require("../models/Customer")

const moment = require("moment") // THÊM moment
const querystring = require("qs") // Thư viện để xử lý query string
const crypto = require("crypto") // Thư viện để tạo chữ ký
const vnpayConfig = require("../config/vnpayConfig") // Config VNPAY

// Generate unique booking ID
const generateBookingId = () => {
  return "BOOK" + Date.now() + Math.floor(Math.random() * 1000)
}

// Hàm hỗ trợ sắp xếp các key của object (yêu cầu của VNPAY)
function sortObject(obj) {
  let sorted = {};
  let arr = [];
  let key;

  // 1. encode key rồi sort
  for (key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      arr.push(encodeURIComponent(key));
    }
  }
  arr.sort();

  // 2. với mỗi key đã sort, encode value theo kiểu VNPay
  for (let i = 0; i < arr.length; i++) {
    const encodedKey = arr[i];              // ví dụ: vnp_Amount
    const originalKey = decodeURIComponent(encodedKey);

    // value được encode + thay %20 = '+'
    sorted[encodedKey] = encodeURIComponent(obj[originalKey]).replace(/%20/g, '+');
  }

  return sorted;
}

// Create booking (chỉ customer được phép tạo booking)
const createBooking = async (req, res) => {
  if (req.user.role !== "customer") {
    return res.status(403).json({ msg: "Chỉ khách hàng mới được tạo booking" })
  }

  // THAY ĐỔI: Thêm paymentMethod và mặc định là 'cash'
  const { tourId, numberOfPeople, notes, paymentMethod = 'cash' } = req.body 
  try {
    const tour = await Tour.findById(tourId)
    if (!tour) {
      return res.status(404).json({ message: "Tour not found" })
    }
    if (tour.availableSlots < numberOfPeople) {
      return res.status(400).json({ message: "Not enough available slots" })
    }
    
    const totalAmount = tour.price * numberOfPeople
    
    // Chỉ xử lý booking Tiền mặt (Cash) ở endpoint này
    if (paymentMethod === 'cash') {
        const booking = new Booking({
          bookingId: generateBookingId(),
          customerId: req.user._id,
          tourId,
          numberOfPeople,
          totalAmount,
          notes,
          paymentMethod, // Lưu phương thức 'cash'
        })
        await booking.save()
        console.log("[SERVER LOG]: Cash Booking created:", { bookingId: booking._id, tourId, customerId: req.user._id })

        // Cập nhật slot và thông báo (như logic cũ)
        tour.availableSlots -= numberOfPeople
        await tour.save()
        
        try {
            const admin = await Employee.findOne({ role: "admin" })
            if (admin) {
              const notification = new Notification({
                recipient: admin._id,
                recipientModel: "Employee",
                sender: req.user._id,
                senderModel: "Customer",
                type: "new_booking",
                message: `Khách hàng ${req.user.fullName} vừa đặt tour "${tour.tourName}" (Tiền mặt).`,
                link: `/admin?tab=bookings`,
              })
              await notification.save()
              const adminSocket = req.getUser(admin._id.toString())
              if (adminSocket) {
                req.io.to(adminSocket.socketId).emit("getNotification", {
                  type: "new_booking",
                  data: {
                    bookingId: booking._id,
                    tourName: tour.tourName,
                    customerName: req.user.fullName,
                    message: `Khách hàng ${req.user.fullName} vừa đặt tour "${tour.tourName}" (Tiền mặt).`,
                  },
                })
              }
            }
          } catch (notificationError) {
            console.error("[SERVER ERROR]: Error in creating or sending notification:", notificationError.message)
          }

        await booking.populate(["customerId", "tourId"])
        return res.status(201).json(booking) 
    } 
    else {
         return res.status(400).json({ message: "Phương thức thanh toán không hợp lệ cho endpoint này." })
    }

  } catch (error) {
    console.error("[SERVER ERROR]: Error in booking creation:", error.message)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// =========================================================================
// HÀM MỚI: TẠO YÊU CẦU THANH TOÁN VNPAY
// =========================================================================
const createVnpayPayment = async (req, res) => {
    if (req.user.role !== "customer") {
        return res.status(403).json({ msg: "Chỉ khách hàng mới được tạo thanh toán" })
    }

    // Lấy thông tin cần thiết. bankCode và language là tùy chọn
    const { tourId, numberOfPeople, notes, bankCode, language = 'vn' } = req.body; 
    
    try {
        const tour = await Tour.findById(tourId)
        if (!tour) {
            return res.status(404).json({ message: "Tour not found" })
        }
        if (tour.availableSlots < numberOfPeople) {
            return res.status(400).json({ message: "Not enough available slots" })
        }

        const totalAmount = tour.price * numberOfPeople
        
        // 1. Tạo booking mới với trạng thái pending và paymentMethod: vnpay
        const bookingId = generateBookingId();
        const booking = new Booking({
            bookingId: bookingId, // Sử dụng làm Mã giao dịch VNPAY (vnp_TxnRef)
            customerId: req.user._id,
            tourId,
            numberOfPeople,
            totalAmount,
            notes,
            paymentMethod: 'vnpay', 
            status: 'pending', 
            vnpayOrderInfo: `Thanh toan tour "${tour.tourName}" - KH: ${req.user.fullName}`,
        })
        await booking.save()
        console.log("[SERVER LOG]: VNPAY Booking (pending) created:", { bookingId: booking._id, tourId, customerId: req.user._id })

        // 2. Tạo URL thanh toán VNPAY
        const ipAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

        const date = new Date();
        const createDate = moment(date).format('YYYYMMDDHHmmss');
        const orderId = booking.bookingId; 
        const amount = totalAmount; 

        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = vnpayConfig.vnp_TmnCode;
        vnp_Params['vnp_Locale'] = language;
        vnp_Params['vnp_CurrCode'] = 'VND';
        vnp_Params['vnp_TxnRef'] = orderId; // Mã tham chiếu giao dịch = bookingId
        vnp_Params['vnp_OrderInfo'] = booking.vnpayOrderInfo;
        vnp_Params['vnp_OrderType'] = 'other'; 
        vnp_Params['vnp_Amount'] = amount * 100; // Số tiền * 100
        vnp_Params['vnp_ReturnUrl'] = vnpayConfig.vnp_ReturnUrl; 
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;
        
        if (bankCode) {            // chỉ add khi có giá trị thật
          vnp_Params['vnp_BankCode'] = bankCode;
        }

        vnp_Params = sortObject(vnp_Params);
        const secretKey = vnpayConfig.vnp_HashSecret;
        
        // Đã sửa lỗi Secure Hash
        let signData = '';
        const params = [];
        for (let key in vnp_Params) {
            params.push(key + '=' + vnp_Params[key]);
        }
        signData = params.join('&');
        // END SỬA LỖI
        
        // Tạo chữ ký SHA256
        const hmac = crypto.createHmac('sha512', secretKey); 
        const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
        
        vnp_Params['vnp_SecureHash'] = secureHash;
        
        const vnpUrl = vnpayConfig.vnp_Url + '?' +
        querystring.stringify(vnp_Params, { encode: false });

        console.log('--- VNPAY DEBUG ---');
        console.log('signData =', signData);
        console.log('secureHash =', secureHash);
        console.log('vnpUrl =', vnpUrl);

        // 3. Trả về URL cho client
        res.status(200).json({ 
            message: "Tạo URL thanh toán VNPAY thành công", 
            vnpUrl,
            bookingId: booking._id 
        });

    } catch (error) {
        console.error("[SERVER ERROR]: Error in VNPAY payment creation:", error.message)
        res.status(500).json({ message: "Server error", error: error.message })
    }
}

// =========================================================================
// HÀM MỚI: XỬ LÝ KẾT QUẢ TRẢ VỀ TỪ VNPAY (vnp_ReturnUrl/vnp_IpnUrl)
// =========================================================================
const vnpayReturn = async (req, res) => {
    let vnp_Params = req.query;
    let secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);
    const secretKey = vnpayConfig.vnp_HashSecret;
    
    // Đã sửa lỗi Secure Hash
    let signData = '';
    const params = [];
    for (let key in vnp_Params) {
        params.push(key + '=' + vnp_Params[key]);
    }
    signData = params.join('&');
    // END SỬA LỖI

    console.log(signData)
    
    // Tạo lại chữ ký để xác thực
    const hmac = crypto.createHmac('sha512', secretKey);
    const checkedHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Mặc định chuyển hướng về trang lịch sử đặt tour (client side)
    let redirectUrl = "http://localhost:3000/bookings"; 
    let message = "Thanh toán không thành công. Vui lòng kiểm tra lại.";
    
    try {
        if (secureHash === checkedHash) {
            const bookingId = vnp_Params['vnp_TxnRef']; 
            const vnp_ResponseCode = vnp_Params['vnp_ResponseCode'];
            const vnp_TransactionStatus = vnp_Params['vnp_TransactionStatus'];
            const amount = vnp_Params['vnp_Amount'] / 100;
            const vnp_TransactionNo = vnp_Params['vnp_TransactionNo'];
            
            // Tìm booking bằng bookingId
            const booking = await Booking.findOne({ bookingId: bookingId }).populate('tourId customerId');
            
            if (booking) {
                if (booking.totalAmount !== amount) {
                    message = "Lỗi: Số tiền thanh toán không khớp với đơn hàng.";
                    console.log("[VNPAY RETURN ERROR]: Amount mismatch for booking:", bookingId);
                } else if (booking.status === 'pending') {
                    
                    if (vnp_ResponseCode === "00" && vnp_TransactionStatus === "00") {
                        // Thanh toán thành công -> Tự động xác nhận & chuyển sang ĐÃ THANH TOÁN
                        booking.status = "paid"; // Chuyển tour thành ĐÃ THANH TOÁN
                        booking.paymentRef = vnp_TransactionNo; 
                        await booking.save();
                        
                        // Cập nhật slot tour
                        const tour = await Tour.findById(booking.tourId._id);
                        if (tour) {
                            tour.availableSlots -= booking.numberOfPeople;
                            await tour.save();
                        }

                        // SỬA LỖI: Thêm tên tour vào thông báo chuyển hướng (Alert)
                        message = `Thanh toán VNPAY cho tour "${booking.tourId.tourName}" thành công! Đơn hàng đã được xác nhận và thanh toán.`;
                        console.log("[VNPAY RETURN]: Payment success for booking:", bookingId);
                        
                        // THÊM LOGIC: Gửi thông báo persistent (lưu vào DB) cho khách hàng
                        try {
                            const notification = new Notification({
                                recipient: booking.customerId._id,
                                recipientModel: "Customer",
                                sender: null, // Không có người gửi cụ thể (System/Auto)
                                senderModel: "Employee", // Có thể dùng "Employee" để thống nhất với các thông báo khác, hoặc tạo model "System"
                                type: "booking_confirmation",
                                message: `Booking cho tour "${booking.tourId.tourName}" của bạn đã được thanh toán và xác nhận.`,
                                link: "/bookings",
                            });
                            await notification.save();
                        } catch (notificationError) {
                            console.error("[SERVER ERROR]: Error in creating persistent notification:", notificationError.message);
                        }

                        // Gửi thông báo real-time (socket) cho khách hàng
                        const customerId = booking.customerId._id.toString();
                        const customerSocket = req.getUser(customerId);
                        if (customerSocket) {
                          req.io.to(customerSocket.socketId).emit("getNotification", {
                            type: "booking_status_update",
                            data: {
                              bookingId: booking._id,
                              tourName: booking.tourId.tourName,
                              status: 'paid', // Cập nhật trạng thái trong socket
                              message: `Đơn đặt tour "${booking.tourId.tourName}" của bạn đã được thanh toán và xác nhận.`,
                            },
                          });
                        }
                        
                    } else {
                        // Thanh toán thất bại hoặc đơn hàng bị hủy
                        booking.status = "cancelled"; 
                        await booking.save();
                        message = "Thanh toán VNPAY thất bại. Đơn hàng đã bị hủy.";
                        console.log("[VNPAY RETURN]: Payment failed for booking:", bookingId);
                    }
                } else {
                    message = "Đơn hàng đã được xử lý trước đó.";
                    console.log("[VNPAY RETURN]: Booking already processed:", bookingId);
                }
            } else {
                message = "Lỗi: Không tìm thấy đơn hàng.";
                console.log("[VNPAY RETURN ERROR]: Booking not found with TxnRef:", bookingId);
            }
        } else {
            // Lỗi SecureHash
            message = "Lỗi: Chữ ký không hợp lệ (SecureHash mismatch).";
            console.log("[VNPAY RETURN ERROR]: SecureHash mismatch.");
        }
    } catch (error) {
        console.error("[VNPAY RETURN ERROR]: Processing error:", error.message);
        message = "Lỗi xử lý hệ thống khi nhận kết quả thanh toán.";
    }

    // Chuyển hướng người dùng về trang của họ và đính kèm thông báo
    const vnpStatus = vnp_Params['vnp_ResponseCode'] === "00" ? 'success' : 'failed'; // Dùng vnp_ResponseCode
    redirectUrl = `${redirectUrl}?vnp_status=${vnpStatus}&message=${encodeURIComponent(message)}`;
    res.redirect(redirectUrl);
}

// ... (giữ nguyên các hàm khác)
const getUserBooking = async (req, res) => {
  try {
    const bookings = await Booking.find({ customerId: req.user._id }).populate("tourId").sort({ createdAt: -1 })

    res.json(bookings)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

const getAllBooking = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query

    const query = {}
    if (status) {
      query.status = status
    }

    const bookings = await Booking.find(query)
      .populate(["customerId", "tourId"])
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })

    const total = await Booking.countDocuments(query)

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Update booking status (giữ nguyên logic cũ)
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate(
      "tourId customerId",
    )

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }

    // Nếu chuyển từ confirmed/paid sang cancelled, hoặc pending sang cancelled (chưa thanh toán VNPAY)
    if (status === "cancelled") {
      const tour = await Tour.findById(booking.tourId)
      if (tour) {
        // Chỉ hoàn slot nếu chưa từng bị hủy trước đó
        if (booking.status !== "cancelled" && booking.paymentMethod !== "vnpay") { 
            tour.availableSlots += booking.numberOfPeople
            await tour.save()
        } else if (booking.paymentMethod === "vnpay" && (booking.status === "confirmed" || booking.status === "paid")) {
            // LƯU Ý: Nếu booking VNPAY đã confirmed/paid và bị admin hủy, bạn cần thực hiện HOÀN TIỀN VNPAY ở đây.
            // Để đơn giản, tôi chỉ hoàn slot và coi như đã hủy/hoàn tiền.
            tour.availableSlots += booking.numberOfPeople
            await tour.save()
        }
      }
    }

    // Sửa lại phần notification khi status là 'confirmed'
    if (status === "confirmed" || status === "paid") { // Thêm status "paid" nếu admin tự cập nhật
      try {
        // Đảm bảo customerId đã được populate
        const customerId = booking.customerId._id || booking.customerId
        const finalStatus = status === "paid" ? "đã thanh toán và được xác nhận" : "đã được xác nhận"

        const notification = new Notification({
          recipient: customerId,
          recipientModel: "Customer",
          sender: req.user._id,
          senderModel: "Employee",
          type: "booking_confirmation",
          message: `Booking cho tour "${booking.tourId.tourName}" của bạn ${finalStatus}.`,
          link: "/bookings",
        })
        await notification.save()
        console.log("[SERVER LOG]: Notification saved for customer:", customerId)

        // Gửi thông báo qua socket
        const customerSocket = req.getUser(customerId.toString())
        if (customerSocket) {
          console.log("[SERVER LOG]: Sending notification to customer socket:", customerSocket.socketId)
          req.io.to(customerSocket.socketId).emit("getNotification", {
            type: "booking_status_update",
            data: {
              bookingId: booking._id,
              tourName: booking.tourId.tourName,
              status: booking.status,
              message: `Đơn đặt tour "${booking.tourId.tourName}" của bạn ${finalStatus}.`,
            },
          })
        } else {
          console.log("[SERVER LOG]: Customer not online:", customerId)
        }
      } catch (notificationError) {
        console.error(
          "[SERVER ERROR]: Error in creating or sending confirmation notification:",
          notificationError.message,
        )
      }
    }

    // Gửi thông báo cho các trạng thái khác
    if (status !== "confirmed" && status !== "paid") {
      try {
        const customerId = booking.customerId._id || booking.customerId
        const customerSocket = req.getUser(customerId.toString())

        if (customerSocket) {
          req.io.to(customerSocket.socketId).emit("getNotification", {
            type: "booking_status_update",
            data: {
              bookingId: booking._id,
              tourName: booking.tourId.tourName,
              status: booking.status,
              message: `Đơn đặt tour "${booking.tourId.tourName}" của bạn đã được ${status === "cancelled" ? "hủy" : "đánh dấu đã thanh toán"}.`,
            },
          })
        }
      } catch (socketError) {
        console.error("[SERVER ERROR]: Error sending socket notification:", socketError.message)
      }
    }

    res.json(booking)
  } catch (error) {
    console.error("[SERVER ERROR]: Error in updating booking status:", error.message)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// XUẤT CÁC HÀM MỚI
module.exports = {generateBookingId, createBooking, getUserBooking, getAllBooking, updateBookingStatus, createVnpayPayment, vnpayReturn}