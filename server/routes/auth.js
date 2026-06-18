const express = require("express")
const { auth } = require("../middleware/auth")
const {registerUser, loginUser, getCurrentUser } = require("../controllers/authController");

const router = express.Router()

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", auth, getCurrentUser);

module.exports = router;
