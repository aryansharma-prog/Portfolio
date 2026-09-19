const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  contactValidationRules,
  submitContactMessage,
} = require("../controllers/contactController");

const router = express.Router();

/**
 * Rate Limiter for Contact Submissions:
 * In production: 5 submissions per 15 minutes per IP to prevent spam and abuse.
 * In development/test: 50 submissions per 15 minutes to allow smooth testing.
 */
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 15 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many messages sent from this IP. Please try again in 15 minutes or email me directly.",
  },
});

// POST /api/contact
router.post("/", contactLimiter, contactValidationRules, submitContactMessage);

module.exports = router;
