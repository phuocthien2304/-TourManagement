const express = require("express");
const { employeeAuth } = require("../middleware/auth"); 
const {getBookingStatistics, getTourStatistics, getReviewStatistics} = require("../controllers/statisticsController");

const router = express.Router();

router.get("/bookings", employeeAuth, getBookingStatistics); 
router.get("/tours", employeeAuth, getTourStatistics);
router.get("/reviews", employeeAuth, getReviewStatistics);

module.exports = router;
