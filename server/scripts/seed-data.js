const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const path = require("path")
require("dotenv").config({ path: path.join(__dirname, "../.env") })

// Import models
const Customer = require("../models/Customer")
const Employee = require("../models/Employee")
const Tour = require("../models/Tour")
const Booking = require("../models/Booking")
const Review = require("../models/Review")
const Notification = require('../models/Notification');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/tour_management", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error("❌ Database connection error:", error)
    process.exit(1)
  }
}

// Generate unique IDs
const generateId = (prefix) => {
  return prefix + Date.now() + Math.floor(Math.random() * 1000)
}

async function seedData() {
  try {
    await connectDB()

    console.log("🧹 Clearing existing data...")
    // Clear existing data
    await Customer.deleteMany({})
    await Employee.deleteMany({})
    await Tour.deleteMany({})
    await Booking.deleteMany({})
    await Review.deleteMany({})
    await Notification.deleteMany({});

    console.log("👤 Creating admin user...")
    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10)
    const admin = new Employee({
      employeeId: generateId("EMP"),
      fullName: "Quản trị viên hệ thống",
      dateOfBirth: new Date("1990-01-01"),
      address: "123 Đường Nguyễn Huệ, Quận 1, TP.HCM",
      phoneNumber: "0901234567",
      email: "admin@tourmanagement.com",
      password: hashedPassword,
      role: "admin",
    })
    await admin.save()

    console.log("👥 Creating sample customers...")
    // Create sample customers
    const customers = []
    const customerData = [
      {
        fullName: "Nguyễn Văn An",
        email: "nguyenvanan@gmail.com",
        phoneNumber: "0987654321",
        address: "456 Đường Lê Lợi, Quận 3, TP.HCM",
        dateOfBirth: new Date("1995-05-15"),
      },
      {
        fullName: "Trần Thị Bình",
        email: "tranthibinh@gmail.com",
        phoneNumber: "0976543210",
        address: "789 Đường Trần Hưng Đạo, Quận 5, TP.HCM",
        dateOfBirth: new Date("1988-08-20"),
      },
      {
        fullName: "Lê Minh Cường",
        email: "leminhcuong@gmail.com",
        phoneNumber: "0965432109",
        address: "321 Đường Võ Văn Tần, Quận 3, TP.HCM",
        dateOfBirth: new Date("1992-12-10"),
      },
    ]

    for (const customerInfo of customerData) {
      const hashedCustomerPassword = await bcrypt.hash("123456", 10)
      const customer = new Customer({
        customerId: generateId("CUST"),
        ...customerInfo,
        password: hashedCustomerPassword,
      })
      const savedCustomer = await customer.save()
      customers.push(savedCustomer)
    }

    console.log("🏖️ Creating sample tours...")
    // Create sample tours
    const tours = []
    const tourData = [
      // 7 tour trong nước
      {
        tourName: "Khám phá Vịnh Hạ Long 2N1Đ",
        departure: "Hà Nội",
        destination: "Hạ Long",
        category: "domestic",
        region: "mien-bac",
        country: "Việt Nam",
        itinerary:
          "Ngày 1: Hà Nội - Hạ Long, du thuyền tham quan vịnh, hang Sửng Sốt. Ngày 2: Khám phá đảo Titop, chèo kayak, trở về Hà Nội.",
        startDate: new Date("2025-07-01"),
        endDate: new Date("2025-07-02"),
        duration: 2,
        transportation: "Xe limousine, du thuyền",
        price: 2500000,
        availableSlots: 15,
        totalSlots: 15,
        services: [
          "Du thuyền 3 sao",
          "Ăn 3 bữa",
          "Hướng dẫn viên",
          "Vé tham quan",
          "Bảo hiểm du lịch",
        ],
        images: ["/images/halong.jpg"],
        highlights: ["Vịnh Hạ Long", "Hang Sửng Sốt", "Đảo Titop"],
        included: ["Du thuyền", "Ăn uống", "Vé tham quan", "Hướng dẫn viên"],
        excluded: ["Chi phí cá nhân", "Đồ uống ngoài thực đơn"],
        difficulty: "easy",
        tourType: "adventure",
        status: "active",
        featured: true,
        rating: 0,
        reviewCount: 0,
      },
      {
        tourName: "Phú Quốc - Nghỉ dưỡng biển đảo 4N3Đ",
        departure: "TP.HCM",
        destination: "Phú Quốc",
        category: "domestic",
        region: "mien-nam",
        country: "Việt Nam",
        itinerary:
          "Ngày 1: TP.HCM - Phú Quốc, check-in resort, tự do tắm biển. Ngày 2: Tour 4 đảo, lặn ngắm san hô. Ngày 3: Tham quan Bãi Sao, làng chài Hàm Ninh. Ngày 4: Chợ đêm, bay về TP.HCM.",
        startDate: new Date("2025-07-05"),
        endDate: new Date("2025-07-08"),
        duration: 4,
        transportation: "Máy bay, xe đưa đón",
        price: 5500000,
        availableSlots: 20,
        totalSlots: 20,
        services: [
          "Resort 4 sao",
          "Vé máy bay khứ hồi",
          "Ăn sáng buffet",
          "Tour 4 đảo",
          "Hướng dẫn viên",
        ],
        images: ["/images/phuquoc.jpg"],
        highlights: ["Bãi Sao", "Lặn san hô", "Làng chài Hàm Ninh"],
        included: ["Resort", "Vé máy bay", "Ăn sáng", "Tour đảo"],
        excluded: ["Chi phí cá nhân", "Ăn trưa/tối"],
        difficulty: "easy",
        tourType: "beach",
        status: "active",
        featured: true,
        rating: 0,
        reviewCount: 0,
      },
      {
        tourName: "Đà Lạt - Lãng mạn ngàn hoa 3N2Đ",
        departure: "TP.HCM",
        destination: "Đà Lạt",
        category: "domestic",
        region: "mien-nam",
        country: "Việt Nam",
        itinerary:
          "Ngày 1: TP.HCM - Đà Lạt, hồ Xuân Hương, chợ đêm. Ngày 2: Thác Datanla, đồi chè Cầu Đất, làng Cù Lần. Ngày 3: Cây thông cô đơn, trở về TP.HCM.",
        startDate: new Date("2025-07-10"),
        endDate: new Date("2025-07-12"),
        duration: 3,
        transportation: "Xe giường nằm VIP",
        price: 2200000,
        availableSlots: 25,
        totalSlots: 25,
        services: [
          "Khách sạn 3 sao",
          "Ăn 2 bữa/ngày",
          "Hướng dẫn viên",
          "Vé tham quan",
        ],
        images: ["/images/dalat.jpg"],
        highlights: ["Hồ Xuân Hương", "Đồi chè Cầu Đất", "Cây thông cô đơn"],
        included: ["Khách sạn", "Ăn uống", "Vé tham quan", "Hướng dẫn viên"],
        excluded: ["Chi phí cá nhân", "VAT"],
        difficulty: "easy",
        tourType: "nature",
        status: "active",
        featured: false,
        rating: 0,
        reviewCount: 0,
      },
      {
        tourName: "Huế - Di sản miền Trung 3N2Đ",
        departure: "Đà Nẵng",
        destination: "Huế",
        category: "domestic",
        region: "mien-trung",
        country: "Việt Nam",
        itinerary:
          "Ngày 1: Đà Nẵng - Huế, tham quan Đại Nội, chùa Thiên Mụ. Ngày 2: Lăng Khải Định, lăng Tự Đức, thuyền sông Hương. Ngày 3: Chợ Đông Ba, trở về Đà Nẵng.",
        startDate: new Date("2025-07-15"),
        endDate: new Date("2025-07-17"),
        duration: 3,
        transportation: "Xe khách, thuyền sông Hương",
        price: 2800000,
        availableSlots: 18,
        totalSlots: 18,
        services: [
          "Khách sạn 3 sao",
          "Ăn 3 bữa/ngày",
          "Hướng dẫn viên",
          "Vé tham quan",
          "Thuyền sông Hương",
        ],
        images: ["/images/hue.jpg"],
        highlights: ["Đại Nội", "Lăng Khải Định", "Sông Hương"],
        included: ["Khách sạn", "Ăn uống", "Vé tham quan", "Hướng dẫn viên"],
        excluded: ["Chi phí cá nhân"],
        difficulty: "moderate",
        tourType: "cultural",
        status: "active",
        featured: true,
        rating: 0,
        reviewCount: 0,
      },
      {
        tourName: "Sapa - Chinh phục Fansipan 3N2Đ",
        departure: "Hà Nội",
        destination: "Sapa",
        category: "domestic",
        region: "mien-bac",
        country: "Việt Nam",
        itinerary:
          "Ngày 1: Hà Nội - Sapa, bản Cát Cát, núi Hàm Rồng. Ngày 2: Chinh phục Fansipan bằng cáp treo. Ngày 3: Thác Bạc, trở về Hà Nội.",
        startDate: new Date("2025-07-20"),
        endDate: new Date("2025-07-22"),
        duration: 3,
        transportation: "Xe limousine, cáp treo Fansipan",
        price: 3000000,
        availableSlots: 15,
        totalSlots: 15,
        services: [
          "Khách sạn 3 sao",
          "Ăn 3 bữa/ngày",
          "Hướng dẫn viên",
          "Vé cáp treo Fansipan",
        ],
        images: ["/images/sapa.jpg"],
        highlights: ["Fansipan", "Bản Cát Cát", "Thác Bạc"],
        included: ["Khách sạn", "Ăn uống", "Vé cáp treo", "Hướng dẫn viên"],
        excluded: ["Chi phí cá nhân"],
        difficulty: "moderate",
        tourType: "adventure",
        status: "active",
        featured: true,
        rating: 0,
        reviewCount: 0,
      },
      {
        tourName: "Mũi Né - Sa mạc cát bay 2N1Đ",
        departure: "TP.HCM",
        destination: "Mũi Né",
        category: "domestic",
        region: "mien-nam",
        country: "Việt Nam",
        itinerary:
          "Ngày 1: TP.HCM - Mũi Né, đồi cát bay, suối Tiên. Ngày 2: Bình minh đồi cát trắng, làng chài, trở về TP.HCM.",
        startDate: new Date("2025-07-25"),
        endDate: new Date("2025-07-26"),
        duration: 2,
        transportation: "Xe giường nằm VIP",
        price: 1800000,
        availableSlots: 25,
        totalSlots: 25,
        services: [
          "Resort 3 sao",
          "Ăn sáng buffet",
          "Xe jeep đồi cát",
          "Hướng dẫn viên",
        ],
        images: ["/images/muine.jpg"],
        highlights: ["Đồi cát bay", "Suối Tiên", "Làng chài Mũi Né"],
        included: ["Resort", "Ăn sáng", "Xe jeep", "Hướng dẫn viên"],
        excluded: ["Chi phí cá nhân"],
        difficulty: "easy",
        tourType: "nature",
        status: "active",
        featured: false,
        rating: 0,
        reviewCount: 0,
      },
      {
        tourName: "Hội An - Phố cổ rực rỡ 2N1Đ",
        departure: "Đà Nẵng",
        destination: "Hội An",
        category: "domestic",
        region: "mien-trung",
        country: "Việt Nam",
        itinerary:
          "Ngày 1: Đà Nẵng - Hội An, phố cổ, chùa Cầu, thả đèn hoa đăng. Ngày 2: Làng gốm Thanh Hà, rừng dừa Bảy Mẫu, trở về Đà Nẵng.",
        startDate: new Date("2025-07-28"),
        endDate: new Date("2025-07-29"),
        duration: 2,
        transportation: "Xe khách",
        price: 2000000,
        availableSlots: 20,
        totalSlots: 20,
        services: [
          "Khách sạn 3 sao",
          "Ăn 2 bữa/ngày",
          "Hướng dẫn viên",
          "Vé tham quan",
        ],
        images: ["/images/hoian.jpg"],
        highlights: ["Phố cổ Hội An", "Chùa Cầu", "Rừng dừa Bảy Mẫu"],
        included: ["Khách sạn", "Ăn uống", "Vé tham quan", "Hướng dẫn viên"],
        excluded: ["Chi phí cá nhân"],
        difficulty: "easy",
        tourType: "cultural",
        status: "active",
        featured: true,
        rating: 0,
        reviewCount: 0,
      },
      // 3 tour nước ngoài
      {
        tourName: "Khám phá Bangkok - Pattaya 5N4Đ",
        departure: "TP.HCM",
        destination: "Bangkok - Pattaya",
        category: "international",
        region: "dong-nam-a",
        country: "Thái Lan",
        itinerary:
          "Ngày 1: TP.HCM - Bangkok, chùa Vàng, chợ nổi. Ngày 2: Cung điện Hoàng gia, chùa Phật Ngọc. Ngày 3: Pattaya, đảo Coral, show Alcazar. Ngày 4: Vườn Nong Nooch, phố đi bộ. Ngày 5: Mua sắm, bay về TP.HCM.",
        startDate: new Date("2025-08-01"),
        endDate: new Date("2025-08-05"),
        duration: 5,
        transportation: "Máy bay, xe đưa đón",
        price: 8500000,
        availableSlots: 18,
        totalSlots: 18,
        services: [
          "Khách sạn 4 sao",
          "Vé máy bay khứ hồi",
          "Ăn sáng buffet",
          "Hướng dẫn viên",
          "Vé tham quan",
        ],
        images: ["/images/bangkok.jpg"],
        highlights: ["Cung điện Hoàng gia", "Đảo Coral", "Vườn Nong Nooch"],
        included: ["Khách sạn", "Vé máy bay", "Ăn sáng", "Vé tham quan", "Hướng dẫn viên"],
        excluded: ["Chi phí cá nhân", "Visa", "Ăn trưa/tối"],
        difficulty: "easy",
        tourType: "city",
        status: "active",
        featured: true,
        rating: 0,
        reviewCount: 0,
      },
      {
        tourName: "Singapore - Thành phố sư tử 4N3Đ",
        departure: "Hà Nội",
        destination: "Singapore",
        category: "international",
        region: "dong-nam-a",
        country: "Singapore",
        itinerary:
          "Ngày 1: Hà Nội - Singapore, Merlion Park, Marina Bay Sands. Ngày 2: Gardens by the Bay, Sentosa Island. Ngày 3: Universal Studios, Orchard Road. Ngày 4: Mua sắm, bay về Hà Nội.",
        startDate: new Date("2025-08-05"),
        endDate: new Date("2025-08-08"),
        duration: 4,
        transportation: "Máy bay, xe đưa đón",
        price: 9500000,
        availableSlots: 15,
        totalSlots: 15,
        services: [
          "Khách sạn 4 sao",
          "Vé máy bay khứ hồi",
          "Ăn sáng buffet",
          "Hướng dẫn viên",
          "Vé tham quan",
        ],
        images: ["/images/singapore.jpg"],
        highlights: ["Merlion Park", "Gardens by the Bay", "Universal Studios"],
        included: ["Khách sạn", "Vé máy bay", "Ăn sáng", "Vé tham quan", "Hướng dẫn viên"],
        excluded: ["Chi phí cá nhân", "Ăn trưa/tối"],
        difficulty: "easy",
        tourType: "city",
        status: "active",
        featured: false,
        rating: 0,
        reviewCount: 0,
      },
      {
        tourName: "Khám phá Seoul - Hàn Quốc 5N4Đ",
        departure: "TP.HCM",
        destination: "Seoul",
        category: "international",
        region: "dong-a",
        country: "Hàn Quốc",
        itinerary:
          "Ngày 1: TP.HCM - Seoul, tháp Namsan. Ngày 2: Cung điện Gyeongbokgung, làng Hanok Bukchon. Ngày 3: Đảo Nami, công viên Everland. Ngày 4: Phố Myeongdong, mua sắm. Ngày 5: Bay về TP.HCM.",
        startDate: new Date("2025-08-10"),
        endDate: new Date("2025-08-14"),
        duration: 5,
        transportation: "Máy bay, xe đưa đón",
        price: 10500000,
        availableSlots: 12,
        totalSlots: 12,
        services: [
          "Khách sạn 4 sao",
          "Vé máy bay khứ hồi",
          "Ăn sáng buffet",
          "Hướng dẫn viên",
          "Vé tham quan",
        ],
        images: ["/images/seoul.jpg"],
        highlights: ["Cung điện Gyeongbokgung", "Đảo Nami", "Phố Myeongdong"],
        included: ["Khách sạn", "Vé máy bay", "Ăn sáng", "Vé tham quan", "Hướng dẫn viên"],
        excluded: ["Chi phí cá nhân", "Visa", "Ăn trưa/tối"],
        difficulty: "easy",
        tourType: "cultural",
        status: "active",
        featured: true,
        rating: 0,
        reviewCount: 0,
      },
    ]

    for (const tourInfo of tourData) {
      const tour = new Tour({
        tourId: generateId("TOUR"),
        ...tourInfo,
      })
      const savedTour = await tour.save()
      tours.push(savedTour)
    }

    console.log("📝 Creating sample bookings...")
    // Create sample bookings
    const bookings = []
    const bookingData = [
      {
        customerId: customers[0]._id,
        tourId: tours[0]._id,
        numberOfPeople: 2,
        status: "paid",
        notes: "Yêu cầu phòng đôi, không hút thuốc",
      },
      {
        customerId: customers[1]._id,
        tourId: tours[1]._id,
        numberOfPeople: 4,
        status: "confirmed",
        notes: "Có trẻ em 8 tuổi, cần ghế ngồi trẻ em",
      },
      {
        customerId: customers[2]._id,
        tourId: tours[2]._id,
        numberOfPeople: 1,
        status: "pending",
        notes: "Đi một mình, mong được sắp xếp phòng đơn",
      },
      {
        customerId: customers[0]._id,
        tourId: tours[3]._id,
        numberOfPeople: 3,
        status: "paid",
        notes: "Gia đình có người cao tuổi, cần hỗ trợ di chuyển",
      },
    ]

    for (const bookingInfo of bookingData) {
      const tour = tours.find((t) => t._id.equals(bookingInfo.tourId))
      const booking = new Booking({
        bookingId: generateId("BOOK"),
        ...bookingInfo,
        totalAmount: tour.price * bookingInfo.numberOfPeople,
        bookingDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
      })
      const savedBooking = await booking.save()
      bookings.push(savedBooking)

      // Update tour available slots
      tour.availableSlots -= bookingInfo.numberOfPeople
      await tour.save()
    }

    console.log("⭐ Creating sample reviews...")
    // Create sample reviews for paid bookings
    const reviewData = [
      {
        customer: customers[0],
        tour: tours[0],
        rating: 5,
        comment:
          "Tour rất tuyệt vời! Hướng dẫn viên nhiệt tình, lịch trình hợp lý. Đặc biệt ấn tượng với cảnh đẹp Hạ Long. Sẽ giới thiệu cho bạn bè.",
        status: "approved",
      },
      {
        customer: customers[0],
        tour: tours[3],
        rating: 4,
        comment:
          "Tour Huế rất thú vị, di sản văn hóa ấn tượng. Tuy nhiên lịch trình hơi gấp, mong có thêm thời gian nghỉ ngơi. Nhìn chung rất hài lòng với chuyến đi.",
        status: "approved",
      },
    ]

    console.log('--- Bắt đầu tạo dữ liệu cho Notification ---');
    const sampleCustomer = customers[0];
    const sampleAdmin = await Employee.findOne({ role: 'admin' });

    if (sampleCustomer && sampleAdmin) {
      const notifications = [
        {
          recipient: sampleAdmin._id,
          recipientModel: 'Employee',
          sender: sampleCustomer._id,
          senderModel: 'Customer',
          type: 'new_booking',
          message: `${sampleCustomer.fullName} vừa đặt một tour mới.`,
          link: `/admin`
        },
        {
          recipient: sampleCustomer._id,
          recipientModel: 'Customer',
          sender: sampleAdmin._id,
          senderModel: 'Employee',
          type: 'booking_confirmation',
          message: 'Booking của bạn đã được quản trị viên xác nhận.',
          link: '/bookings'
        },
        {
          recipient: sampleAdmin._id,
          recipientModel: 'Employee',
          sender: sampleCustomer._id,
          senderModel: 'Customer',
          type: 'new_review',
          message: `${sampleCustomer.fullName} đã để lại một đánh giá mới.`,
          link: '/admin?tab=reviews'
        }
      ];

      await Notification.insertMany(notifications);
      console.log(`✅ ${notifications.length} thông báo mẫu đã được tạo.`);
    } else {
      console.log('⚠️ Không tìm thấy customer hoặc admin mẫu để tạo thông báo.');
    }

    for (const reviewInfo of reviewData) {
      const review = new Review({
        reviewId: generateId("REV"),
        customerId: reviewInfo.customer._id,
        tourId: reviewInfo.tour._id,
        rating: reviewInfo.rating,
        comment: reviewInfo.comment,
        images: [], // Có thể thêm image url ở đây nếu bạn muốn demo
        reviewerName: reviewInfo.customer.fullName,
        reviewerPhone: reviewInfo.customer.phoneNumber,
        reviewDate: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000),
        status: reviewInfo.status,
      })

      await review.save()
    }

    console.log("✅ Seed data created successfully!")
    console.log("📊 Summary:")
    console.log(`   - Admin account: admin@tourmanagement.com / admin123`)
    console.log(`   - Sample customers: ${customers.length}`)
    console.log(`   - Sample tours: ${tours.length}`)
    console.log(`   - Sample bookings: ${bookings.length}`)
    console.log(`   - Sample reviews: ${reviewData.length}`)
    console.log("")
    console.log("🔐 Test accounts:")
    console.log("   Admin: admin@tourmanagement.com / admin123")
    console.log("   Customer 1: nguyenvanan@gmail.com / 123456")
    console.log("   Customer 2: tranthibinh@gmail.com / 123456")
    console.log("   Customer 3: leminhcuong@gmail.com / 123456")
  } catch (error) {
    console.error("❌ Error seeding data:", error)
  } finally {
    mongoose.connection.close()
    console.log("🔌 Database connection closed")
  }
}

// Run the seed function
seedData()