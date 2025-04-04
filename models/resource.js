const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    resourceType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResourceType",
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    images: [
      {
        url: String,
        public_id: String,
      },
    ],
    totalResourceCount: {
      type: Number,
      default: 1,
      min: 0,
    },
    avaliableResourceCount: {
      type: Number,
      default: 1,
      min: 0,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Available", "Allocated", "maintenance"],
      default: "Available",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

// Virtual property to easily access the type name
ResourceSchema.virtual("typeName", {
  ref: "ResourceType",
  localField: "resourceType",
  foreignField: "_id",
  justOne: true,
  options: { select: "name" },
});

const Resource =
  mongoose.models.Resource || mongoose.model("Resource", ResourceSchema);

module.exports = Resource;
