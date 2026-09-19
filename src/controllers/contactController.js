const { body, validationResult } = require("express-validator");
const ContactMessage = require("../models/ContactMessage");
const { sendContactNotification } = require("../services/emailService");
const { isConnected } = require("../config/db");

// In-memory fallback message store for resilient message retention
const memoryFallbackStore = [];

/**
 * Validation rules for contact message submission
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
 * Submits a contact inquiry:
 * 1. Validates & sanitizes input
 * 2. Checks honeypot spam traps
 * 3. Persists to MongoDB (with fail-fast timeout and memory fallback)
 * 4. Dispatches email notification with direct Reply-To (with timeout guarantee)
 * 5. Returns client confirmation
 */
const submitContactMessage = async (req, res) => {
  console.log("[Diagnostic] CONTACT_REQUEST_RECEIVED");
  try {
    // 1. Check Anti-Spam Honeypot
    const honeypot = req.body?._gotcha || req.body?.botcheck;
    if (honeypot) {
      console.warn(`[Anti-Spam] Bot trap triggered from IP: ${req.ip}`);
      console.log("[Diagnostic] CONTACT_REQUEST_SUCCESS");
      return res.status(200).json({
        success: true,
        message: "Message sent successfully! I'll get back to you soon.",
      });
    }

    // 2. Validate Request Fields
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("[Diagnostic] CONTACT_ERROR: Validation Failed (HTTP 400)");
      return res.status(400).json({
        success: false,
        message: "Please correct the errors in the form.",
        errors: errors.array().map((err) => ({
          field: err.path || err.param,
          msg: err.msg,
        })),
      });
    }

    console.log("[Diagnostic] CONTACT_VALIDATION_PASSED");

    const { name, email, subject, message } = req.body;
    const clientIp = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || req.ip || "Unknown";
    const userAgent = req.headers["user-agent"] || "Unknown";
    const cleanSubject = subject && subject.trim() ? subject.trim() : `Portfolio Message from ${name}`;

    let savedMessage = null;

    // 3. Persist message to MongoDB Atlas with timeout protection
    console.log("[Diagnostic] MONGODB_SAVE_STARTED");
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
        console.log("[Diagnostic] MONGODB_SAVE_SUCCESS");
      } catch (dbErr) {
        console.warn(`[Contact] MongoDB Save Notice: ${dbErr.message}. Storing in fallback store.`);
      }
    }

    // In-memory Fallback store if DB is offline or connecting
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
      console.log("[Diagnostic] MONGODB_SAVE_SUCCESS (in-memory fallback)");
    }

    // 4. Return instant 201 Created confirmation to the client
    const responsePayload = {
      id: savedMessage._id,
      createdAt: savedMessage.createdAt,
    };

    console.log("[Diagnostic] CONTACT_REQUEST_SUCCESS (HTTP 201)");
    res.status(201).json({
      success: true,
      message: "Message sent successfully! I'll get back to you soon.",
      data: responsePayload,
    });

    // 5. Asynchronous Non-blocking Email Dispatch in Background
    (async () => {
      console.log("[Diagnostic] EMAIL_SEND_STARTED");
      try {
        const emailResult = await sendContactNotification({
          name,
          email,
          subject: cleanSubject,
          message,
          createdAt: savedMessage.createdAt,
        });

        const deliveryStatus = emailResult.success ? "sent" : "failed";
        if (emailResult.success) {
          console.log("[Diagnostic] EMAIL_SEND_SUCCESS");
        } else {
          console.log(`[Diagnostic] EMAIL_SEND_NOTICE: ${emailResult.error}`);
        }

        if (savedMessage && isConnected() && typeof savedMessage._id === "object") {
          try {
            await ContactMessage.findByIdAndUpdate(savedMessage._id, {
              emailDeliveryStatus: deliveryStatus,
              emailError: emailResult.error || null,
            });
          } catch (e) {
            // Background update notice
          }
        }
      } catch (emailErr) {
        console.log(`[Diagnostic] EMAIL_SEND_NOTICE: ${emailErr.message}`);
      }
    })();
  } catch (error) {
    console.error(`[Diagnostic] CONTACT_ERROR: ${error.name} - ${error.message} (HTTP 500)`);
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
  submitContactMessage,
  memoryFallbackStore,
};
