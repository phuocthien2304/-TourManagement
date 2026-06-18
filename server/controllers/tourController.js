const { QdrantClient } = require('@qdrant/js-client-rest');
const Tour = require("../models/Tour");
const { generateEmbedding, prepareTextForEmbedding } = require('../utils/aiUtils'); // <--- THÊM DÒNG NÀY

const qdrant = new QdrantClient({ url: 'http://localhost:6333' });
const QDRANT_COLLECTION_NAME = 'tours';

function mongoIdToUUID(id) {
  const paddedId = id.padStart(32, '0');
  return `${paddedId.substring(0, 8)}-${paddedId.substring(8, 12)}-${paddedId.substring(12, 16)}-${paddedId.substring(16, 20)}-${paddedId.substring(20)}`;
}

// Generate unique tour ID
const generateTourId = () => {
  return "TOUR" + Date.now() + Math.floor(Math.random() * 1000)
}

// Get tour categories and destinations 
const getTourCategories = async (req, res) => {
  try {
    // Get categories with counts
    const categoryStats = await Tour.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          destinations: { $addToSet: "$destination" },
          countries: { $addToSet: "$country" },
        },
      },
    ])

    // Get regions with counts
    const regionStats = await Tour.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: { category: "$category", region: "$region" },
          count: { $sum: 1 },
          destinations: { $addToSet: "$destination" },
        },
      },
    ])

    // Get all unique destinations and countries
    const destinations = await Tour.distinct("destination", { status: "active" })
    const countries = await Tour.distinct("country", { status: "active" })
    const departures = await Tour.distinct("departure", { status: "active" })

    // Total tours
    const totalTours = await Tour.countDocuments({ status: "active" })

    // Format response
    const categories = {
      all: { name: "Tất cả Tours", count: totalTours },
    }

    const regions = {
      domestic: {
        "mien-bac": { name: "Miền Bắc", count: 0, destinations: [] },
        "mien-trung": { name: "Miền Trung", count: 0, destinations: [] },
        "mien-nam": { name: "Miền Nam", count: 0, destinations: [] },
      },
      international: {
        "dong-nam-a": { name: "Đông Nam Á", count: 0, destinations: [] },
        "dong-a": { name: "Đông Á", count: 0, destinations: [] },
        "chau-au": { name: "Châu Âu", count: 0, destinations: [] },
        "chau-my": { name: "Châu Mỹ", count: 0, destinations: [] },
        "chau-uc": { name: "Châu Úc", count: 0, destinations: [] },
        "chau-phi": { name: "Châu Phi", count: 0, destinations: [] },
        other: { name: "Khác", count: 0, destinations: [] },
      },
    }

    // Process category stats
    categoryStats.forEach((cat) => {
      categories[cat._id] = {
        name: cat._id === "domestic" ? "Tour Trong Nước" : "Tour Nước Ngoài",
        count: cat.count,
        destinations: cat.destinations,
        countries: cat.countries,
      }
    })

    // Process region stats
    regionStats.forEach((region) => {
      const { category, region: regionKey } = region._id
      if (regions[category] && regions[category][regionKey]) {
        regions[category][regionKey].count = region.count
        regions[category][regionKey].destinations = region.destinations
      }
    })

    res.json({
      categories,
      regions,
      destinations,
      countries,
      departures,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get all tours (public)
const getAllTours = async (req, res) => {
  try {
    const {
      destination,
      departure,
      country,
      category,
      region,
      tourType,
      difficulty,
      startDate,
      endDate,
      minPrice,
      maxPrice,
      minDuration,
      maxDuration,
      featured,
      sort = "newest",
      page = 1,
      limit = 12,
    } = req.query

    const query = { status: "active" }

    // Add filters based on new model structure
    if (destination) {
      query.destination = { $regex: destination, $options: "i" }
    }

    if (departure) {
      query.departure = { $regex: departure, $options: "i" }
    }

    if (country) {
      query.country = { $regex: country, $options: "i" }
    }

    if (category) {
      query.category = category
    }

    if (region) {
      query.region = region
    }

    if (tourType) {
      query.tourType = tourType
    }

    if (difficulty) {
      query.difficulty = difficulty
    }

    if (featured === "true") {
      query.featured = true
    }

    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) }
    }

    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = Number(minPrice)
      if (maxPrice) query.price.$lte = Number(maxPrice)
    }

    if (minDuration || maxDuration) {
      query.duration = {}
      if (minDuration) query.duration.$gte = Number(minDuration)
      if (maxDuration) query.duration.$lte = Number(maxDuration)
    }

    // Sorting
    let sortOption = { createdAt: -1 } // default: newest
    switch (sort) {
      case "oldest":
        sortOption = { createdAt: 1 }
        break
      case "price-low":
        sortOption = { price: 1 }
        break
      case "price-high":
        sortOption = { price: -1 }
        break
      case "popular":
        sortOption = { reviewCount: -1, rating: -1 }
        break
      case "rating":
        sortOption = { rating: -1, reviewCount: -1 }
        break
      case "duration-short":
        sortOption = { duration: 1 }
        break
      case "duration-long":
        sortOption = { duration: -1 }
        break
      case "name-asc":
        sortOption = { tourName: 1 }
        break
      case "name-desc":
        sortOption = { tourName: -1 }
        break
      default:
        sortOption = { featured: -1, createdAt: -1 }
    }

    const tours = await Tour.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sortOption)

    const total = await Tour.countDocuments(query)

    res.json({
      tours,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// GET /api/tours/admin – Admin view (hiện tất cả)
const getAllToursForAdmin = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {}
    if (status) {
      query.status = status // nếu admin muốn lọc theo status
    }

    const tours = await Tour.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })

    const total = await Tour.countDocuments(query)

    res.json({
      tours,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Recommend Tour
const getSimilarTours = async (req, res) => {
  try {
    const mongoId = req.params.id; 
    const qdrantId = mongoIdToUUID(mongoId); 

    // 1. Lấy vector VÀ payload của tour gốc từ Qdrant
    const originalPoint = await qdrant.retrieve(QDRANT_COLLECTION_NAME, {
      ids: [qdrantId],
      with_vector: true,
      with_payload: true 
    });

    if (originalPoint.length === 0 || !originalPoint[0].vector) {
      return res.status(404).json("Tour không tìm thấy trong Qdrant.");
    }
    
    const vectorToSearch = originalPoint[0].vector;
    const payload = originalPoint[0].payload; // Lấy dữ liệu phụ (category, tourType,..)

    // 2. Gọi Qdrant để tìm kiếm với BỘ LỌC (Hybrid Search)
    const searchResults = await qdrant.search(QDRANT_COLLECTION_NAME, {
      vector: vectorToSearch,
      limit: 6, 
      with_payload: true,

      filter: {
        must: [
            {
                key: "category",
                match: { value: payload.category }
            }
        ],
        should: [
            {
                key: "destination",
                match: { value: payload.destination }
            },
            {
                key: "tourType",
                match: { value: payload.tourType }
            }
        ]
      }
    });

    // 3. Lọc bỏ chính nó và lấy ra các id khác
    const similarTourIds = searchResults
      .filter(point => point.id !== qdrantId) 
      .map(point => point.payload.mongo_id); 
    
    if (similarTourIds.length === 0) {
        return res.status(200).json([]); 
    }

    const similarTours = await Tour.find({
      _id: { $in: similarTourIds }
    }).select("tourName price images departure destination startDate endDate availableSlots rating"); 

    res.status(200).json(similarTours);

  } catch (err) {
    console.error("Lỗi khi lấy tour tương tự:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// Get tour by ID
const getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id)
    if (!tour) {
      return res.status(404).json({ message: "Tour not found" })
    }
    res.json(tour)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Helper function to calculate duration
const calculateDuration = (startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Create tour (Admin only)
// 1. CREATE TOUR (Đã thêm tự động tạo Vector)
const createTour = async (req, res) => {
  try {
    const startDate = new Date(req.body.startDate)
    const endDate = new Date(req.body.endDate)
    const duration = calculateDuration(startDate, endDate)

    const processArray = (data) => {
      if (!data) return []
      if (Array.isArray(data)) return data.filter((item) => item.trim() !== "")
      return data.split("\n").filter((item) => item.trim() !== "")
    }

    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : []

    const tourData = {
       // ... (Giữ nguyên logic mapping dữ liệu của bạn)
       tourId: generateTourId(),
       tourName: req.body.tourName,
       departure: req.body.departure,
       destination: req.body.destination,
       category: req.body.category,
       region: req.body.region,
       country: req.body.country || "Việt Nam",
       itinerary: req.body.itinerary,
       startDate: startDate,
       endDate: endDate,
       duration: duration,
       transportation: req.body.transportation,
       price: Number.parseFloat(req.body.price),
       availableSlots: Number.parseInt(req.body.availableSlots),
       totalSlots: Number.parseInt(req.body.totalSlots) || Number.parseInt(req.body.availableSlots),
       services: processArray(req.body.services),
       highlights: processArray(req.body.highlights),
       included: processArray(req.body.included),
       excluded: processArray(req.body.excluded),
       difficulty: req.body.difficulty || "easy",
       tourType: req.body.tourType || "group",
       status: req.body.status || "active",
       featured: req.body.featured === "true" || req.body.featured === true,
       images: images
    }

    // A. Lưu vào MongoDB
    const tour = new Tour(tourData)
    await tour.save()

    // B. --- AI LOGIC: Tự động tạo vector và lưu vào Qdrant ---
    try {
        console.log("Đang tạo vector cho tour mới...");
        const textToEmbed = prepareTextForEmbedding(tour);
        const vector = await generateEmbedding(textToEmbed);
        
        // Lưu vào Qdrant
        await qdrant.upsert(QDRANT_COLLECTION_NAME, {
            wait: true, // Đợi Qdrant lưu xong mới trả về response (đảm bảo real-time)
            points: [{
                id: mongoIdToUUID(tour._id.toString()), // Convert ID Mongo sang UUID
                vector: vector,
                payload: {
                    mongo_id: tour._id.toString(), // Lưu ID gốc để map ngược lại
                    category: tour.category,
                    destination: tour.destination,
                    tourType: tour.tourType,
                    price: tour.price
                }
            }]
        });
        console.log("Đã đồng bộ tour sang Qdrant thành công!");
    } catch (aiError) {
        // Nếu AI lỗi, chỉ log ra console chứ KHÔNG làm lỗi request tạo tour
        // (Tour vẫn được tạo trong Mongo, chỉ thiếu gợi ý)
        console.error("Lỗi khi tạo vector:", aiError);
    }
    res.status(201).json(tour)
  } catch (error) {
    console.error("Error creating tour:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}
// Update tour (Admin only)
const updateTour = async (req, res) => {
  try {
    let duration
    if (req.body.startDate && req.body.endDate) {
      duration = calculateDuration(req.body.startDate, req.body.endDate)
    }

    // ... (Giữ nguyên logic xử lý ảnh và dữ liệu update của bạn) ...
    const processArray = (data) => {
        if (!data) return []
        if (Array.isArray(data)) return data.filter((item) => item.trim() !== "")
        return data.split("\n").filter((item) => item.trim() !== "")
    }
    const newImages = req.files ? req.files.map(file => `/uploads/${file.filename}`) : []
    const imagesToRemove = req.body.imagesToRemove || []
    
    const tour = await Tour.findById(req.params.id)
    if (!tour) return res.status(404).json({ message: "Tour not found" })

    const updatedImages = tour.images.filter(img => !imagesToRemove.includes(img)).concat(newImages)
    
    const updateData = {
        // ... (Map dữ liệu update như code cũ của bạn)
        tourName: req.body.tourName,
        departure: req.body.departure,
        destination: req.body.destination,
        category: req.body.category,
        region: req.body.region,
        country: req.body.country || "Việt Nam",
        itinerary: req.body.itinerary,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        transportation: req.body.transportation,
        price: req.body.price ? Number.parseFloat(req.body.price) : undefined,
        availableSlots: req.body.availableSlots ? Number.parseInt(req.body.availableSlots) : undefined,
        totalSlots: req.body.totalSlots ? Number.parseInt(req.body.totalSlots) : undefined,
        services: processArray(req.body.services),
        highlights: processArray(req.body.highlights),
        included: processArray(req.body.included),
        excluded: processArray(req.body.excluded),
        difficulty: req.body.difficulty || "easy",
        tourType: req.body.tourType || "group",
        status: req.body.status || "active",
        featured: req.body.featured === "true" || req.body.featured === true,
        duration: duration,
        images: updatedImages
    }

    // A. Cập nhật MongoDB
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })

    // B. --- AI LOGIC: Cập nhật lại vector trong Qdrant ---
    // (Chỉ cần chạy nếu các trường quan trọng bị thay đổi)
    try {
        console.log("Đang cập nhật vector...");
        const textToEmbed = prepareTextForEmbedding(updatedTour);
        const vector = await generateEmbedding(textToEmbed);

        await qdrant.upsert(QDRANT_COLLECTION_NAME, {
            wait: true,
            points: [{
                id: mongoIdToUUID(updatedTour._id.toString()), // Ghi đè lên ID cũ
                vector: vector,
                payload: {
                    mongo_id: updatedTour._id.toString(),
                    category: updatedTour.category,
                    destination: updatedTour.destination,
                    tourType: updatedTour.tourType,
                    price: updatedTour.price
                }
            }]
        });
        console.log("Đã cập nhật vector Qdrant!");
    } catch (aiError) {
        console.error("Lỗi khi cập nhật vector:", aiError);
    }
    res.json(updatedTour)
  } catch (error) {
    console.error("Error updating tour:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}


// Delete tour (Admin only)
const deleteTour = async (req, res) => {
  try {
    // A. Xóa khỏi MongoDB
    const tour = await Tour.findByIdAndDelete(req.params.id)
    if (!tour) {
      return res.status(404).json({ message: "Tour not found" })
    }

    // B. --- AI LOGIC: Xóa khỏi Qdrant ---
    try {
        await qdrant.delete(QDRANT_COLLECTION_NAME, {
            wait: true,
            points: [mongoIdToUUID(req.params.id)] // Xóa point có ID tương ứng
        });
        console.log("Đã xóa vector khỏi Qdrant!");
    } catch (aiError) {
        console.error("Lỗi khi xóa vector:", aiError);
    }
    res.json({ message: "Tour deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

module.exports = {generateTourId, getTourCategories, getAllTours, getAllToursForAdmin, getSimilarTours, getTourById, calculateDuration, createTour, updateTour, deleteTour} 