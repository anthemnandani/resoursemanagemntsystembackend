const express = require('express');
const app = express();
const cors = require('cors');
const fileUpload = require('express-fileupload');
const port = process.env.PORT || 5000;
const cloudinaryConnection = require('./config/cloudinary');
const connectToDatabase = require('./config/db');

const employeeRoutes = require('./routes/employeeRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const resourceTypeRoutes = require('./routes/resourseTypeRoutes');
const allocationRoutes = require('./routes/allocationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const corsOptions = {
  origin: "https://resoursemanagemntsystem.vercel.app", 
  credentials: true,
};
app.use(cors(corsOptions));


app.use(express.json()); 
app.use(express.urlencoded({ extended: false })); 

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://resoursemanagemntsystem.vercel.app");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Enable express-fileupload middleware
app.use(fileUpload({
  useTempFiles: false, 
  debug: process.env.NODE_ENV === 'development',  
}));

cloudinaryConnection();
connectToDatabase();

// API Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/resourcestype', resourceTypeRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/admin', adminRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});