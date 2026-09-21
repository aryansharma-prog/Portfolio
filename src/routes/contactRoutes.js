const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  contactValidationRules,
  otpVerifyValidationRules,
  sendVerificationOtp,
  verifyAndSendContactMessage,
  submitContactMessage,
} = require("../controllers/contactController");

const router = express.Router();

/**
 * Rate Limiter for Sending OTPs:
 * Production: max 10 OTP requests per 15 minutes per IP.
 * Dev/Test: max 100 per 15 minutes.
 */
const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification requests. Please wait a few minutes before trying again.",
  },
});

/**
 * Rate Limiter for OTP Verification:
 * Production: max 25 attempts per 15 minutes per IP.
 * Dev/Test: max 150 per 15 minutes.
 */
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 25 : 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many verification attempts. Please wait a few minutes before trying again.",
  },
});

/**
 * Legacy rate limiter for direct contact submissions
 */
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 15 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many messages sent from this IP. Please try again in 15 minutes or email me directly.",
  },
});

// POST /api/contact/send-otp - Step 1: Send 6-digit OTP code to user's email
router.post("/send-otp", otpSendLimiter, contactValidationRules, sendVerificationOtp);

// POST /api/contact/verify-and-send - Step 2: Verify OTP and deliver message
router.post(
  "/verify-and-send",
  otpVerifyLimiter,
  otpVerifyValidationRules,
  verifyAndSendContactMessage
);

// POST /api/contact - Legacy direct submission
router.post("/", contactLimiter, contactValidationRules, submitContactMessage);

module.exports = router;
