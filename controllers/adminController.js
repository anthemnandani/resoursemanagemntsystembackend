const Admin = require("../models/admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
    });

    await admin.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Registration failed.",
      error: error.message,
    });
  }
};


const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ error: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({
      token,
      adminId: admin._id,
      role: admin.role,
      name: admin.name,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Login failed.",
      error: error.message,
    });
  }
};

module.exports = {
  login, register
};