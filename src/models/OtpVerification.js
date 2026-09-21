const mongoose = require("mongoose");

const otpVerificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
      index: true,
    },
    otp: {
      type: String,
      required: [true, "OTP is required"],
      trim: true,
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index to automatically remove expired documents
    },
  },
  {
    timestamps: true,
  }
);

// Index to efficiently look up recent OTP requests by email
otpVerificationSchema.index({ email: 1, createdAt: -1 });

const OtpVerification = mongoose.model("OtpVerification", otpVerificationSchema);

module.exports = OtpVerification;
