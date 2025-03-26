const express = require('express');
const app = express();
const cors = require('cors');
const connectToDatabase = require('./utils/db');
const port = process.env.PORT || 5000;
const fileUpload = require('express-fileupload');

// Import routes
const employeeRoutes = require('./routes/employeeRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const allocationRoutes = require('./routes/allocationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const resourseTypeRoutes = require('./routes/adminRoutes');

const corsOptions = {
  origin: "http://localhost:5173", 
  credentials: true,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  debug: process.env.NODE_ENV === 'development' // Enable debugging in development
}));

// Connect to services
connectToDatabase();

// API Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/resoursetype', resourseTypeRoutes);
app.use('/api/admin', adminRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});