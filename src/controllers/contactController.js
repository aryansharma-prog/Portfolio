const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const ContactMessage = require("../models/ContactMessage");
const OtpVerification = require("../models/OtpVerification");
const { sendContactNotification, sendVerificationOtpEmail } = require("../services/emailService");
const { isConnected } = require("../config/db");

// In-memory fallback stores for resilient message retention and offline OTP tracking
const memoryFallbackStore = [];
const memoryOtpStore = new Map();

/**
 * Clean up expired OTPs from memory store periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of memoryOtpStore.entries()) {
    if (record.expiresAt < now) {
      memoryOtpStore.delete(email);
    }
  }
}, 5 * 60 * 1000);

/**
 * Validation rules for contact message submission & OTP initiation
 */
const contactValidationRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Full name is required.")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters.")
    .escape(),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email address is required.")
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("Email address is too long."),

  body("subject")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage("Subject cannot exceed 200 characters.")
    .escape(),

  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required.")
    .isLength({ min: 5, max: 5000 })
    .withMessage("Message must be between 5 and 5000 characters.")
    .escape(),
];

/**
 * Validation rules for OTP verification and submission
 */
const otpVerifyValidationRules = [
  ...contactValidationRules,
  body("otp")
    .trim()
    .notEmpty()
    .withMessage("Verification code (OTP) is required.")
    .isLength({ min: 6, max: 6 })
    .withMessage("Verification code must be 6 digits.")
    .isNumeric()
    .withMessage("Verification code must contain digits only."),
];

/**
 * Helper to generate a 6-digit numeric OTP
 */
const generateSixDigitOtp = () => {
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
};

/**
 * 1. SEND OTP ENDPOINT:
 * Generates and emails a 6-digit verification code to the visitor's email address.
 * Stores OTP in MongoDB / memory with 10 minute expiration.
 */
const sendVerificationOtp = async (req, res) => {
  console.log("[Diagnostic] OTP_SEND_REQUEST_RECEIVED");
  try {
    // 1. Check Anti-Spam Honeypot
    const honeypot = req.body?._gotcha || req.body?.botcheck;
    if (honeypot) {
      console.warn(`[Anti-Spam] Bot trap triggered in sendVerificationOtp from IP: ${req.ip}`);
      return res.status(200).json({
        success: true,
        message: "Verification code sent to your email.",
        email: req.body?.email || "",
      });
    }

    // 2. Validate Request Fields
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid contact information.",
        errors: errors.array().map((err) => ({
          field: err.path || err.param,
          msg: err.msg,
        })),
      });
    }

    const { name, email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const otp = generateSixDigitOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 3. Persist OTP in MongoDB (if connected) or memory
    if (isConnected()) {
      try {
        await OtpVerification.deleteMany({ email: normalizedEmail });
        await OtpVerification.create({
          email: normalizedEmail,
          otp: otp,
          expiresAt: expiresAt,
          attempts: 0,
          verified: false,
        });
      } catch (dbErr) {
        console.warn(`[OTP] MongoDB save warning: ${dbErr.message}. Storing in memory store.`);
      }
    }

    // Always keep in memory store as fallback
    memoryOtpStore.set(normalizedEmail, {
      otp: otp,
      expiresAt: expiresAt.getTime(),
      attempts: 0,
      verified: false,
    });

    console.log(`[Diagnostic] OTP_GENERATED for ${normalizedEmail}: ${otp}`);

    // 4. Send Email via Nodemailer
    const emailResult = await sendVerificationOtpEmail({
      email: normalizedEmail,
      name: name,
      otp: otp,
    });

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}. Please check your inbox.`,
      email: normalizedEmail,
      expiresInMinutes: 10,
      // Provide devOtp for localhost / local testing
      ...(process.env.NODE_ENV !== "production" || !process.env.VERCEL || req.ip === "127.0.0.1" || req.ip === "::1" || req.hostname === "localhost"
        ? { devOtp: otp }
        : {}),
    });
  } catch (error) {
    console.error(`[Diagnostic] OTP_SEND_ERROR: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Unable to send verification code. Please try again or email me directly.",
    });
  }
};

/**
 * 2. VERIFY OTP & DELIVER MESSAGE ENDPOINT:
 * Validates the 6-digit OTP code against MongoDB/Memory store.
 * If valid, persists the contact message and triggers notifications.
 */
const verifyAndSendContactMessage = async (req, res) => {
  console.log("[Diagnostic] OTP_VERIFY_AND_SEND_RECEIVED");
  try {
    // 1. Check Anti-Spam Honeypot
    const honeypot = req.body?._gotcha || req.body?.botcheck;
    if (honeypot) {
      console.warn(`[Anti-Spam] Bot trap triggered in verifyAndSend from IP: ${req.ip}`);
      return res.status(200).json({
        success: true,
        message: "Message sent successfully! I'll get back to you soon.",
      });
    }

    // 2. Validate Request Fields
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Please correct the errors in the form.",
        errors: errors.array().map((err) => ({
          field: err.path || err.param,
          msg: err.msg,
        })),
      });
    }

    const { name, email, subject, message, otp } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();
    const now = new Date();

    // 3. Verify OTP from DB or memory fallback
    let otpRecord = null;
    let isFromDb = false;

    if (isConnected()) {
      try {
        otpRecord = await OtpVerification.findOne({
          email: normalizedEmail,
          verified: false,
          expiresAt: { $gt: now },
        }).sort({ createdAt: -1 });
        if (otpRecord) isFromDb = true;
      } catch (dbErr) {
        console.warn(`[OTP] MongoDB query notice: ${dbErr.message}`);
      }
    }

    // Memory fallback check if not found in DB
    if (!otpRecord && memoryOtpStore.has(normalizedEmail)) {
      const memRecord = memoryOtpStore.get(normalizedEmail);
      if (memRecord.expiresAt > Date.now() && !memRecord.verified) {
        otpRecord = memRecord;
      }
    }

    // Check if OTP exists and is valid
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired or does not exist. Please request a new code.",
        errorType: "EXPIRED_OR_NOT_FOUND",
      });
    }

    // Check attempt limits
    if (otpRecord.attempts >= 5) {
      if (isFromDb) {
        await OtpVerification.deleteOne({ _id: otpRecord._id }).catch(() => {});
      }
      memoryOtpStore.delete(normalizedEmail);
      return res.status(400).json({
        success: false,
        message: "Too many incorrect attempts. Please request a new verification code.",
        errorType: "MAX_ATTEMPTS_EXCEEDED",
      });
    }

    // Check OTP Match
    if (otpRecord.otp !== cleanOtp) {
      if (isFromDb) {
        otpRecord.attempts = (otpRecord.attempts || 0) + 1;
        await otpRecord.save().catch(() => {});
      }
      if (memoryOtpStore.has(normalizedEmail)) {
        const mem = memoryOtpStore.get(normalizedEmail);
        mem.attempts = (mem.attempts || 0) + 1;
      }
      return res.status(400).json({
        success: false,
        message: "Incorrect verification code. Please check your email and try again.",
        errorType: "INVALID_OTP",
        remainingAttempts: Math.max(0, 5 - ((otpRecord.attempts || 0) + 1)),
      });
    }

    // OTP is VALID -> Invalidate OTP so it cannot be reused
    if (isFromDb) {
      await OtpVerification.deleteOne({ _id: otpRecord._id }).catch(() => {});
    }
    memoryOtpStore.delete(normalizedEmail);

    // 4. Save Verified Message to MongoDB Atlas (with in-memory fallback)
    const clientIp = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || req.ip || "Unknown";
    const userAgent = req.headers["user-agent"] || "Unknown";
    const cleanSubject = subject && subject.trim() ? subject.trim() : `Portfolio Message from ${name}`;

    let savedMessage = null;

    if (isConnected()) {
      try {
        const createPromise = ContactMessage.create({
          name,
          email: normalizedEmail,
          subject: cleanSubject,
          message,
          status: "unread",
          emailDeliveryStatus: "pending",
          ipAddress: clientIp,
          userAgent: userAgent,
        });

        const dbTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("DB insertion timed out")), 3000)
        );

        savedMessage = await Promise.race([createPromise, dbTimeout]);
      } catch (dbErr) {
        console.warn(`[Contact] MongoDB Save Warning: ${dbErr.message}`);
      }
    }

    if (!savedMessage) {
      savedMessage = {
        _id: "mem_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        name,
        email: normalizedEmail,
        subject: cleanSubject,
        message,
        status: "unread",
        emailDeliveryStatus: "pending",
        ipAddress: clientIp,
        userAgent: userAgent,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryFallbackStore.unshift(savedMessage);
    }

    // 5. Return 201 Created confirmation to the client
    res.status(201).json({
      success: true,
      message: "Email verified and message sent successfully! I'll get back to you soon.",
      data: {
        id: savedMessage._id,
        createdAt: savedMessage.createdAt,
      },
    });

    // 6. Asynchronous Background Email Dispatch to Portfolio Owner
    (async () => {
      try {
        const emailResult = await sendContactNotification({
          name,
          email: normalizedEmail,
          subject: cleanSubject,
          message,
          createdAt: savedMessage.createdAt,
        });

        const deliveryStatus = emailResult.success ? "sent" : "failed";
        if (savedMessage && isConnected() && typeof savedMessage._id === "object") {
          await ContactMessage.findByIdAndUpdate(savedMessage._id, {
            emailDeliveryStatus: deliveryStatus,
            emailError: emailResult.error || null,
          }).catch(() => {});
        }
      } catch (e) {
        console.warn(`[Email Notification Notice] ${e.message}`);
      }
    })();
  } catch (error) {
    console.error(`[Diagnostic] OTP_VERIFY_ERROR: ${error.message}`);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong while verifying your code. Please try again or email me directly.",
      });
    }
  }
};

/**
 * 3. LEGACY DIRECT SUBMIT ENDPOINT (Maintained for backward compatibility and automated tests):
 */
const submitContactMessage = async (req, res) => {
  console.log("[Diagnostic] CONTACT_REQUEST_RECEIVED (direct)");
  try {
    const honeypot = req.body?._gotcha || req.body?.botcheck;
    if (honeypot) {
      console.warn(`[Anti-Spam] Bot trap triggered from IP: ${req.ip}`);
      return res.status(200).json({
        success: true,
        message: "Message sent successfully! I'll get back to you soon.",
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Please correct the errors in the form.",
        errors: errors.array().map((err) => ({
          field: err.path || err.param,
          msg: err.msg,
        })),
      });
    }

    const { name, email, subject, message } = req.body;
    const clientIp = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || req.ip || "Unknown";
    const userAgent = req.headers["user-agent"] || "Unknown";
    const cleanSubject = subject && subject.trim() ? subject.trim() : `Portfolio Message from ${name}`;

    let savedMessage = null;

    if (isConnected()) {
      try {
        const createPromise = ContactMessage.create({
          name,
          email,
          subject: cleanSubject,
          message,
          status: "unread",
          emailDeliveryStatus: "pending",
          ipAddress: clientIp,
          userAgent: userAgent,
        });

        const dbTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("DB insertion timed out")), 3000)
        );

        savedMessage = await Promise.race([createPromise, dbTimeout]);
      } catch (dbErr) {
        console.warn(`[Contact] MongoDB Save Notice: ${dbErr.message}`);
      }
    }

    if (!savedMessage) {
      savedMessage = {
        _id: "mem_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        name,
        email,
        subject: cleanSubject,
        message,
        status: "unread",
        emailDeliveryStatus: "pending",
        ipAddress: clientIp,
        userAgent: userAgent,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryFallbackStore.unshift(savedMessage);
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully! I'll get back to you soon.",
      data: {
        id: savedMessage._id,
        createdAt: savedMessage.createdAt,
      },
    });

    (async () => {
      try {
        const emailResult = await sendContactNotification({
          name,
          email,
          subject: cleanSubject,
          message,
          createdAt: savedMessage.createdAt,
        });

        const deliveryStatus = emailResult.success ? "sent" : "failed";
        if (savedMessage && isConnected() && typeof savedMessage._id === "object") {
          await ContactMessage.findByIdAndUpdate(savedMessage._id, {
            emailDeliveryStatus: deliveryStatus,
            emailError: emailResult.error || null,
          }).catch(() => {});
        }
      } catch (e) {}
    })();
  } catch (error) {
    console.error(`[Diagnostic] CONTACT_ERROR: ${error.message}`);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong while sending your message. Please try again or email me directly.",
      });
    }
  }
};

module.exports = {
  contactValidationRules,
  otpVerifyValidationRules,
  sendVerificationOtp,
  verifyAndSendContactMessage,
  submitContactMessage,
  memoryFallbackStore,
  memoryOtpStore,
};
