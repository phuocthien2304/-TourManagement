const dotenv = require('dotenv');
dotenv.config();

// LƯU Ý: VNPAY_RETURN_URL cần được cập nhật nếu bạn triển khai lên môi trường thật
const vnpayConfig = {
    // Thông tin cấu hình giả lập bạn cung cấp
    vnp_TmnCode: process.env.VNP_TMN_CODE,
    vnp_HashSecret: process.env.VNP_HASH_SECRET,
    vnp_Url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    
    // URL trả về sau khi thanh toán, dùng localhost:5000 (cổng server)
    vnp_ReturnUrl: process.env.VNP_RETURN_URL || 'http://localhost:5000/api/bookings/vnpay_return',
    
    // IPN URL (URL thông báo kết quả giao dịch) - thường dùng chung với Return URL trong demo
    vnp_IpnUrl: process.env.VNP_IPN_URL || 'http://localhost:5000/api/bookings/vnpay_return', 
};

module.exports = vnpayConfig;