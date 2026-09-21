const mongoose = require("mongoose");

const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
      maxlength: [255, "Email cannot exceed 255 characters"],
    },
    subject: {
      type: String,
      trim: true,
      default: "Portfolio Contact Inquiry",
      maxlength: [200, "Subject cannot exceed 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [5000, "Message cannot exceed 5000 characters"],
    },
    status: {
      type: String,
      enum: {
        values: ["unread", "read", "replied", "archived"],
        message: "Status must be unread, read, replied, or archived",
      },
      default: "unread",
      index: true,
    },
    emailDeliveryStatus: {
      type: String,
      enum: ["pending", "sent", "failed", "skipped"],
      default: "pending",
    },
    emailError: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for performant querying of recent messages by status
contactMessageSchema.index({ createdAt: -1, status: 1 });

const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);

module.exports = ContactMessage;
