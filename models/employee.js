const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email!`,
      },
    },
    position: {
      type: String,
      enum: [
        "Developer", 
        "Senior Developer",
        "Team Lead",
        "HR Manager",
        "Recruiter",
        "Business Development Manager",
        "Sales Manager",
        "Project Manager",
        "Admin",
        "Accountant",
        "Designer"
      ],
      default: "Developer",
      required: true
    },
    department: {
      type: String,
      enum: [
        "Software Development",
        "Recruitment",
        "Business Development",
        "Sales",
        "Marketing",
        "Finance",
        "Management",
        "Administration",
        "Design",
        "Customer Support",
      ],
      default: "Software Development",
      required: true
    },
    hireDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    profilePicture: {
      type: String,
      default:
        "https://res.cloudinary.com/dmyq2ymj9/image/upload/v1742888485/4288270_nuia5s.png",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Employee =
  mongoose.models.Employee || mongoose.model("Employee", EmployeeSchema);

module.exports = Employee;
