const mongoose = require("mongoose");

const ResourceTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

const ResourceType =
  mongoose.models.ResourceType ||
  mongoose.model("ResourceType", ResourceTypeSchema);

module.exports = ResourceType;
