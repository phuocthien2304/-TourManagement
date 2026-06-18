const express = require("express")
const upload = require("../middleware/upload");
const { auth, employeeAuth } = require("../middleware/auth")
const {getTourCategories, getAllTours, getAllToursForAdmin, getSimilarTours, getTourById, createTour, updateTour, deleteTour} = require("../controllers/tourController");

const router = express.Router()

// Get tour categories and destinations from database
router.get("/categories", getTourCategories);
// Get all tours (public)
router.get("/", getAllTours); 
router.get("/admin", employeeAuth, getAllToursForAdmin); 
router.post("/", employeeAuth, upload.array("images", 5),createTour); 
router.get("/:id", getTourById); 
router.get("/:id/similar", getSimilarTours);

router.put("/:id", employeeAuth, upload.array("images", 5), updateTour); 
router.delete("/:id", employeeAuth, deleteTour); 

module.exports = router;
