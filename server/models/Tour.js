const mongoose = require("mongoose")

const tourSchema = new mongoose.Schema(
  {
    tourId: {
      type: String,
      required: true,
      unique: true,
    },
    tourName: {
      type: String,
      required: true,
    },
    departure: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    // Thêm các thuộc tính mới cho phân loại
    category: {
      type: String,
      enum: ["domestic", "international"],
      required: true,
      default: "domestic",
    },
    region: {
      type: String,
      enum: [
        // Trong nước
        "mien-bac",
        "mien-trung",
        "mien-nam",
        // Nước ngoài
        "dong-nam-a",
        "dong-a",
        "chau-au",
        "chau-my",
        "chau-uc",
        "chau-phi",
        "other",
      ],
      required: true,
    },
    country: {
      type: String,
      required: true,
      default: "Việt Nam",
    },
    itinerary: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // Số ngày
      required: true,
    },
    transportation: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    availableSlots: {
      type: Number,
      required: true,
    },
    totalSlots: {
      type: Number,
      required: true,
    },
    services: [
      {
        type: String,
      },
    ],
    images: [
      {
        type: String,
      },
    ],
    highlights: [
      {
        type: String,
      },
    ],
    included: [
      {
        type: String,
      },
    ],
    excluded: [
      {
        type: String,
      },
    ],
    difficulty: {
      type: String,
      enum: ["easy", "moderate", "challenging"],
      default: "easy",
    },
    tourType: {
      type: String,
      enum: ["group", "private", "family", "luxury", "adventure", "cultural", "beach", "city", "nature"],
      default: "group",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "draft"],
      default: "active",
    },
    featured: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

// Index for better performance
tourSchema.index({ category: 1, region: 1 })
tourSchema.index({ destination: 1 })
tourSchema.index({ price: 1 })
tourSchema.index({ startDate: 1 })
tourSchema.index({ featured: 1 })

module.exports = mongoose.model("Tour", tourSchema)
