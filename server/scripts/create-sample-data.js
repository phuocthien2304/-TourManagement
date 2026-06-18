// Simple script to create sample data
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

// Kết nối trực tiếp không qua file config
mongoose
  .connect("mongodb://localhost:27017/tour_management")
  .then(() => {
    console.log("✅ Connected to MongoDB")
    createSampleData()
  })
  .catch((err) => {
    console.error("❌ Connection failed:", err.message)
    process.exit(1)
  })

// Define schemas
const employeeSchema = new mongoose.Schema(
  {
    employeeId: String,
    fullName: String,
    dateOfBirth: Date,
    address: String,
    phoneNumber: String,
    email: String,
    password: String,
    role: { type: String, default: "admin" },
  },
  { timestamps: true },
)

const tourSchema = new mongoose.Schema(
  {
    tourId: String,
    tourName: String,
    departure: String,
    destination: String,
    itinerary: String,
    startDate: Date,
    endDate: Date,
    transportation: String,
    price: Number,
    availableSlots: Number,
    services: [String],
    status: { type: String, default: "active" },
  },
  { timestamps: true },
)

const Employee = mongoose.model("Employee", employeeSchema)
const Tour = mongoose.model("Tour", tourSchema)

async function createSampleData() {
  try {
    console.log("🔄 Clearing existing data...")
    await Employee.deleteMany({})
    await Tour.deleteMany({})

    console.log("🔄 Creating admin user...")
    const hashedPassword = await bcrypt.hash("admin123", 10)

    const admin = await Employee.create({
      employeeId: "EMP001",
      fullName: "Quản trị viên",
      dateOfBirth: new Date("1990-01-01"),
      address: "123 Đường ABC, Quận 1, TP.HCM",
      phoneNumber: "0901234567",
      email: "admin@tourmanagement.com",
      password: hashedPassword,
      role: "admin",
    })
    console.log("✅ Admin created:", admin.email)

    console.log("🔄 Creating tours...")
    const tours = await Tour.insertMany([
      {
        tourId: "TOUR001",
        tourName: "Du lịch Hạ Long - Sapa 4N3Đ",
        departure: "Hà Nội",
        destination: "Hạ Long - Sapa",
        itinerary:
          "Ngày 1: Hà Nội - Hạ Long, tham quan vịnh Hạ Long. Ngày 2: Hạ Long - Sapa, tham quan thị trấn Sapa. Ngày 3: Chinh phục đỉnh Fansipan. Ngày 4: Sapa - Hà Nội.",
        startDate: new Date("2024-06-15"),
        endDate: new Date("2024-06-18"),
        transportation: "Xe khách, cáp treo",
        price: 3500000,
        availableSlots: 20,
        services: ["Khách sạn 3 sao", "Ăn 3 bữa/ngày", "Hướng dẫn viên", "Vé tham quan"],
      },
      {
        tourId: "TOUR002",
        tourName: "Phú Quốc - Thiên đường biển đảo 3N2Đ",
        departure: "TP.HCM",
        destination: "Phú Quốc",
        itinerary:
          "Ngày 1: TP.HCM - Phú Quốc, check-in resort, tự do tắm biển. Ngày 2: Tour 4 đảo, lặn ngắm san hô. Ngày 3: Tham quan làng chài, mua sắm, về TP.HCM.",
        startDate: new Date("2024-06-20"),
        endDate: new Date("2024-06-22"),
        transportation: "Máy bay, tàu cao tốc",
        price: 4200000,
        availableSlots: 15,
        services: ["Resort 4 sao", "Ăn sáng buffet", "Tour lặn biển", "Vé máy bay khứ hồi"],
      },
      {
        tourId: "TOUR003",
        tourName: "Đà Lạt - Thành phố ngàn hoa 2N1Đ",
        departure: "TP.HCM",
        destination: "Đà Lạt",
        itinerary:
          "Ngày 1: TP.HCM - Đà Lạt, tham quan hồ Xuân Hương, chợ đêm Đà Lạt. Ngày 2: Tham quan thác Elephant, làng hoa Vạn Thành, về TP.HCM.",
        startDate: new Date("2024-06-25"),
        endDate: new Date("2024-06-26"),
        transportation: "Xe khách giường nằm",
        price: 1800000,
        availableSlots: 25,
        services: ["Khách sạn 3 sao", "Ăn 2 bữa", "Hướng dẫn viên", "Vé tham quan các điểm"],
      },
      {
        tourId: "TOUR004",
        tourName: "Nha Trang - Biển xanh cát trắng 3N2Đ",
        departure: "TP.HCM",
        destination: "Nha Trang",
        itinerary:
          "Ngày 1: TP.HCM - Nha Trang, tắm biển, thưởng thức hải sản. Ngày 2: Tour 4 đảo Nha Trang, lặn ngắm san hô. Ngày 3: Tham quan Vinpearl Land, về TP.HCM.",
        startDate: new Date("2024-07-01"),
        endDate: new Date("2024-07-03"),
        transportation: "Tàu hỏa, tàu cao tốc",
        price: 2800000,
        availableSlots: 18,
        services: ["Khách sạn 4 sao", "Ăn 3 bữa/ngày", "Vé Vinpearl Land", "Tour 4 đảo"],
      },
      {
        tourId: "TOUR005",
        tourName: "Hội An - Huế - Di sản văn hóa 4N3Đ",
        departure: "Đà Nẵng",
        destination: "Hội An - Huế",
        itinerary:
          "Ngày 1: Đà Nẵng - Hội An, tham quan phố cổ. Ngày 2: Làng gốm Thanh Hà, rừng dừa Bảy Mẫu. Ngày 3: Hội An - Huế, tham quan Đại Nội. Ngày 4: Chùa Thiên Mụ, lăng Khải Định, về Đà Nẵng.",
        startDate: new Date("2024-07-05"),
        endDate: new Date("2024-07-08"),
        transportation: "Xe khách, thuyền dragon",
        price: 3200000,
        availableSlots: 22,
        services: ["Khách sạn 3 sao", "Ăn đặc sản địa phương", "Hướng dẫn viên chuyên nghiệp", "Vé tham quan di tích"],
      },
    ])

    console.log(`✅ Created ${tours.length} tours`)

    console.log("🎉 Sample data created successfully!")
    console.log("📧 Admin login: admin@tourmanagement.com / admin123")

    // Verify data
    const employeeCount = await Employee.countDocuments()
    const tourCount = await Tour.countDocuments()
    console.log(`📊 Total employees: ${employeeCount}`)
    console.log(`📊 Total tours: ${tourCount}`)
  } catch (error) {
    console.error("❌ Error creating data:", error)
  } finally {
    mongoose.connection.close()
    console.log("🔌 Connection closed")
  }
}
