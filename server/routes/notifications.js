const express = require('express');
const {auth} = require('../middleware/auth');
const {getAllNotifications, markNotification} = require("../controllers/notificationController");

const router = express.Router();

router.get('/', auth, getAllNotifications);
router.put('/:id/read', auth, markNotification); 

module.exports = router;