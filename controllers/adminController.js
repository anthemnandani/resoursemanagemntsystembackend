const Admin = require("../models/admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sec="Nandani@123";

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    
    // Hash password only if it's defined
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

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ error: "admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ adminId: admin._id }, sec, {
      expiresIn: "1h",
    });
    res.json({ token, adminId: admin._id, role: admin.role, name: admin.name });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "login failed.",
      error: error.message,
    });
  }
};