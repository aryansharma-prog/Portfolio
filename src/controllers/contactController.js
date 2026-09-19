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
  try {
    // 1. Check Anti-Spam Honeypot
    const honeypot = req.body._gotcha || req.body.botcheck;
    if (honeypot) {
      console.warn(`[Anti-Spam] Bot trap triggered from IP: ${req.ip}`);
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

    const { name, email, subject, message } = req.body;
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || req.ip;
    const userAgent = req.headers["user-agent"] || "Unknown";
    const cleanSubject = subject && subject.trim() ? subject.trim() : `Portfolio Message from ${name}`;

    let savedMessage = null;

    // 3. Persist message to database with timeout protection
    if (isConnected()) {
      try {
        const createPromise = ContactMessage.create({
          name,
          email,
          subject: cleanSubject,
          message,
          status: "unread",
          emailDeliveryStatus: "skipped",
          ipAddress: clientIp,
          userAgent: userAgent,
        });

        const dbTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("DB insertion timed out")), 3000)
        );

        savedMessage = await Promise.race([createPromise, dbTimeout]);
        console.log(`[Contact] Saved message #${savedMessage._id} to MongoDB from ${email}`);
      } catch (dbErr) {
        console.warn(`[Contact] MongoDB Save notice: ${dbErr.message}. Storing in memory fallback.`);
      }
    }

    // Resilient Fallback store if DB is offline or connecting
    if (!savedMessage) {
      savedMessage = {
        _id: "mem_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        name,
        email,
        subject: cleanSubject,
        message,
        status: "unread",
        emailDeliveryStatus: "skipped",
        ipAddress: clientIp,
        userAgent: userAgent,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryFallbackStore.unshift(savedMessage);
      console.log(`[Contact] Saved message to in-memory store (${email})`);
    }

    // 4. Send Email Notification (Non-blocking with timeout guarantee)
    const emailResult = await sendContactNotification({
      name,
      email,
      subject: cleanSubject,
      message,
      createdAt: savedMessage.createdAt,
    });

    // Update delivery status on stored message
    if (savedMessage) {
      const status = emailResult.success ? "sent" : "failed";
      savedMessage.emailDeliveryStatus = status;
      if (!emailResult.success) {
        savedMessage.emailError = emailResult.error;
      }

      if (isConnected() && typeof savedMessage._id === "object") {
        try {
          await ContactMessage.findByIdAndUpdate(savedMessage._id, {
            emailDeliveryStatus: status,
            emailError: emailResult.error || null,
          });
        } catch (updateErr) {
          // Non-blocking
        }
      }
    }

    // 5. Return success to client
    return res.status(201).json({
      success: true,
      message: "Message sent successfully! I'll get back to you soon.",
      data: {
        id: savedMessage._id,
        createdAt: savedMessage.createdAt,
      },
    });
  } catch (error) {
    console.error(`[Contact Controller] Internal Error: ${error.stack || error.message}`);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while sending your message. Please try again or email me directly.",
    });
  }
};

module.exports = {
  contactValidationRules,
  submitContactMessage,
  memoryFallbackStore,
};
