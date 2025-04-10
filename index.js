const express = require('express');
const cloudinaryConnection = require('./config/cloudinary');
const connectToDatabase = require('./config/db');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const dashboardRoutes = require("./routes/dashboard");
// const fileUpload = require('express-fileupload');

const employeeRoutes = require('./routes/employeeRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const resourceTypeRoutes = require('./routes/resourseTypeRoutes');
const allocationRoutes = require('./routes/allocationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const allowedOrigins = [
  "https://resoursemanagemntsystem.vercel.app",
  "http://localhost:5173"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json()); 
app.use(express.urlencoded({ extended: false })); 

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Enable express-fileupload middleware
// app.use(fileUpload({
//   useTempFiles: false, 
//   debug: process.env.NODE_ENV === 'development',  
// }));

cloudinaryConnection();
connectToDatabase();

// API Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/resourcestype', resourceTypeRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
