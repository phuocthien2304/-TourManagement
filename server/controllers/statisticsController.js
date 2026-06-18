const express = require("express");
const Booking = require("../models/Booking");
const Tour = require("../models/Tour");
const Review = require("../models/Review");
const { employeeAuth } = require("../middleware/auth");  // ✅ Sửa đúng middleware

const router = express.Router();

// Get booking statistics
const getBookingStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    // Total bookings
    const totalBookings = await Booking.countDocuments({
      ...dateFilter,
      status: { $in: ["confirmed", "paid"] },
    });

    // Total revenue
    const revenueResult = await Booking.aggregate([
      {
        $match: {
          ...dateFilter,
          status: "paid",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    // Bookings by month
    const bookingsByMonth = await Booking.aggregate([
      {
        $match: {
          ...dateFilter,
          status: { $in: ["confirmed", "paid"] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    res.json({
      totalBookings,
      totalRevenue,
      bookingsByMonth,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get tour statistics
const getTourStatistics = async (req, res) => {
  try {
    // Most popular tours
    const popularTours = await Booking.aggregate([
      {
        $match: {
          status: { $in: ["confirmed", "paid"] },
        },
      },
      {
        $group: {
          _id: "$tourId",
          bookingCount: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
      {
        $lookup: {
          from: "tours",
          localField: "_id",
          foreignField: "_id",
          as: "tour",
        },
      },
      {
        $unwind: "$tour",
      },
      {
        $sort: { bookingCount: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Revenue by tour
    const revenueByTour = await Booking.aggregate([
      {
        $match: {
          status: "paid",
        },
      },
      {
        $group: {
          _id: "$tourId",
          revenue: { $sum: "$totalAmount" },
          bookingCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "tours",
          localField: "_id",
          foreignField: "_id",
          as: "tour",
        },
      },
      {
        $unwind: "$tour",
      },
      {
        $sort: { revenue: -1 },
      },
    ]);

    res.json({
      popularTours,
      revenueByTour,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get review statistics
const getReviewStatistics = async (req, res) => {
  try {
    const totalReviews = await Review.countDocuments();
    const pendingReviews = await Review.countDocuments({ status: "pending" });
    const approvedReviews = await Review.countDocuments({ status: "approved" });

    // Average rating by tour
    const ratingsByTour = await Review.aggregate([
      {
        $match: { status: "approved" },
      },
      {
        $group: {
          _id: "$tourId",
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "tours",
          localField: "_id",
          foreignField: "_id",
          as: "tour",
        },
      },
      {
        $unwind: "$tour",
      },
      {
        $sort: { averageRating: -1 },
      },
    ]);

    res.json({
      totalReviews,
      pendingReviews,
      approvedReviews,
      ratingsByTour,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {getTourStatistics, getReviewStatistics, getBookingStatistics};
