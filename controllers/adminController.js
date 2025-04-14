const Admin = require("../models/admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

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
    if (!admin)
      return res
        .status(400)
        .json({ success: false, error: "Employee with this email not exists" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, error: "Incorrect password" });

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
    console.log("Error is: ", error);
    res.status(500).json({
      success: false,
      message: "Login failed.",
      error: error.message,
    });
  }
};

const forgetPassword = async (req, res) => {
  try {
    const user = await Admin.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign({ adminId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });

    console.log("env: ", process.env.EMAIL, process.env.PASSWORD_APP_EMAIL);

    const transporter = nodemailer.createTransport({
      service: "gmail", 
      auth: {
        user: "neeraj@antheminfotech.com", 
        pass: "pcwgfixsrnvingtv",
      },
    });

    const resetLink = `https://resoursemanagemntsystem.vercel.app/resetpassword/${token}`;

    const mailOptions = {
      from: process.env.EMAIL,
      to: req.body.email,
      subject: "Reset Password",
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password. The link is valid for 10 minutes.</p>
        <a href="${resetLink}">${resetLink}</a>
        <br />
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("Email send error:", err);
        return res.status(500).json({ message: "Failed to send email" });
      }
      res.status(200).json({ message: "Email sent successfully" });
    });
  } catch (err) {
    console.error("Forget error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const decodedToken = jwt.verify(req.params.token, process.env.JWT_SECRET);

    if (!decodedToken) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await Admin.findById(decodedToken.adminId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

     // Password validation
     const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
     if (!passwordRegex.test(newPassword)) {
       return res.status(400).json({
         message:
           "Password must contain at least 1 uppercase letter, 1 number, and 1 special character, and be at least 6 characters long",
       });
     }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset error:", err);
    res.status(500).json({ message: err.message || "Something went wrong" });
  }
};

module.exports = {
  login,
  register,
  resetPassword,
  forgetPassword,
};
