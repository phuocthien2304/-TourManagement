const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const Customer = require("../models/Customer")
const Employee = require("../models/Employee")
const { auth } = require("../middleware/auth")

const router = express.Router()

// Generate unique ID
const generateId = (prefix) => {
  return prefix + Date.now() + Math.floor(Math.random() * 1000)
}

// Customer Registration
const registerUser = async (req, res ) => {
  try {
    const { fullName, dateOfBirth, address, phoneNumber, email, password } = req.body

    // Check if customer exists
    const existingCustomer = await Customer.findOne({ email })
    if (existingCustomer) {
      return res.status(400).json({ message: "Customer already exists" })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Create customer
    const customer = new Customer({
      customerId: generateId("CUST"),
      fullName,
      dateOfBirth,
      address,
      phoneNumber,
      email,
      password: hashedPassword,
    })

    await customer.save()

    // Generate token
    const token = jwt.sign({ id: customer._id, role: customer.role }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "7d",
    })

    res.status(201).json({
      token,
      user: {
        id: customer._id,
        customerId: customer.customerId,
        fullName: customer.fullName,
        email: customer.email,
        role: customer.role,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    // Check customer first
    let user = await Customer.findOne({ email })
    let userType = "customer"

    // If not customer, check employee
    if (!user) {
      user = await Employee.findOne({ email })
      userType = "employee"
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Generate token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "7d",
    })

    res.json({
      token,
      user: {
        id: user._id,
        userId: userType === "customer" ? user.customerId : user.employeeId,
        fullName: user.fullName,
        email: user.email,
        address: user.address,
        phoneNumber: user.phoneNumber,  
        role: user.role,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user
    res.json({
      id: user._id,
      userId: user.customerId || user.employeeId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      address: user.address,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
}

module.exports = {registerUser, loginUser, getCurrentUser}
