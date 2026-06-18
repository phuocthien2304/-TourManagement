const express = require("express");
const upload = require("../middleware/upload");
const { customerAuth, employeeAuth } = require("../middleware/auth");
const {createReview, getAverageReview, getReviewDetail, checkCanReview, getAllReviews, updateReviewStatus} = require("../controllers/reviewsController");

const router = express.Router();

// Create review (customer only)
router.post("/", customerAuth, upload.array("images", 3), createReview);
router.get("/average/:tourId", getAverageReview);
// Get reviews for a tour (public)
router.get("/tour/:tourId", getReviewDetail);
// Check if customer can review this tour (customer only)
router.get("/can-review/:tourId", customerAuth, checkCanReview);
router.get("/", getAllReviews);
// Update review status (employee only)
router.put("/:id/status", employeeAuth, updateReviewStatus); 

module.exports = router;
