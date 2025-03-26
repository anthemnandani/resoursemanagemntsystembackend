const express = require('express');
const app = express();
const cors = require('cors');
const connectToDatabase = require('./utils/db');
const fileUpload = require('express-fileupload');  // Use express-fileupload only
const port = process.env.PORT || 5000;

const employeeRoutes = require('./routes/employeeRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const allocationRoutes = require('./routes/allocationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const corsOptions = {
  origin: "https://resoursemanagemntsystem.vercel.app", 
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable express-fileupload middleware
app.use(fileUpload({
  useTempFiles: false, 
  debug: process.env.NODE_ENV === 'development',  // Enable debugging in development
}));

connectToDatabase();

// API Routes
app.use('/api/employees', employeeRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/admin', adminRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});