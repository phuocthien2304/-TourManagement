const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const connectDB = require("./config/database")
const path = require("path")

const http = require('http');
const { Server } = require("socket.io");

// Load environment variables
dotenv.config()

// Connect to database
connectDB()

const app = express()
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", 
        methods: ["GET", "POST"]
    }
});

let onlineUsers = [];

// thêm người dùng vào danh sách online
const addUser = (userData) => {
    !onlineUsers.some(user => user.userId === userData.userId) &&
        onlineUsers.push(userData);
};

// xóa người dùng khi ngắt kết nối
const removeUser = (socketId) => {
    onlineUsers = onlineUsers.filter(user => user.socketId !== socketId);
};

// tìm thông tin socket của một người dùng
const getUser = (userId) => {
    return onlineUsers.find(user => user.userId === userId);
};

// Lắng nghe các sự kiện chính của Socket.IO
io.on("connection", (socket) => {
    console.log(`[SERVER LOG]: User connected with socket ID: ${socket.id}`);

    // Khi client gửi thông tin định danh ("addUser")
    socket.on("addUser", (userData) => {
        // Gắn thêm socketId vào object và thêm vào danh sách
        addUser({ ...userData, socketId: socket.id });
        console.log("[SERVER LOG]: User added. Current online users:", onlineUsers);
        // Gửi lại danh sách user online cho tất cả client (nếu cần)
        io.emit("getUsers", onlineUsers);
    });

    // Khi client ngắt kết nối
    socket.on("disconnect", () => {
        removeUser(socket.id);
        console.log(`[SERVER LOG]: User with socket ID ${socket.id} disconnected.`);
        io.emit("getUsers", onlineUsers);
    });
});

// Middlewares
app.use(cors())
app.use(express.json({limit :"10mb"}))
app.use(express.urlencoded({ extended: true,limit:"10mb" }))

// gắn io và getUser vào mỗi request, giúp các route có thể sử dụng
app.use((req, res, next) => {
    req.io = io;
    req.getUser = getUser;
    next();
});

// Serve static files 
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use("/api/auth", require("./routes/auth"))
app.use("/api/tours", require("./routes/tours"))
app.use("/api/bookings", require("./routes/bookings"))
app.use("/api/reviews", require("./routes/reviews"))
app.use("/api/statistics", require("./routes/statistics"))
app.use('/api/notifications', require('./routes/notifications'));


// Health check route
app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcome to TVMTravel API!" })
})

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({ message: "Something went wrong!" })
})

// 404 handler for unknown routes
app.use("*", (req, res) => {
    res.status(404).json({ message: "Route not found" })
})

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

