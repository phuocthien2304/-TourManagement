const jwt = require("jsonwebtoken");
const Customer = require("../models/Customer");
const Employee = require("../models/Employee");
require('dotenv').config();

// Xác thực chung (đăng nhập thành công hay chưa)
const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Kiểm tra người dùng thuộc loại nào
    let user = await Customer.findById(decoded.id);
    if (user) {
      req.user = { ...user.toObject(), role: "customer" };
    } else {
      user = await Employee.findById(decoded.id);
      if (user) {
        req.user = { ...user.toObject(), role: "admin" };  
      }
    }

    if (!req.user) {
      return res.status(401).json({ message: "Token is not valid" });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Chỉ cho phép Customer
const customerAuth = async (req, res, next) => {
  await auth(req, res, () => {
    if (req.user.role !== "customer") {
      return res.status(403).json({ message: "Access denied. Customer only." });
    }
    next();
  });
};

// Chỉ cho phép Employee (Admin)
const employeeAuth = async (req, res, next) => {
  await auth(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Employee only." });
    }
    next();
  });
};

module.exports = { auth, customerAuth, employeeAuth };
