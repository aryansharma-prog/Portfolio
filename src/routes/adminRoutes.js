const express = require("express");
const adminAuth = require("../middleware/adminAuth");
const {
  getMessages,
  getMessageById,
  updateMessageStatus,
  deleteMessage,
  getStats,
} = require("../controllers/adminController");

const router = express.Router();

// Enforce admin authentication on all administrative endpoints
router.use(adminAuth);

// GET /api/admin/messages/stats
router.get("/stats", getStats);

// GET /api/admin/messages
router.get("/", getMessages);

// GET /api/admin/messages/:id
router.get("/:id", getMessageById);

// PATCH /api/admin/messages/:id/status
router.patch("/:id/status", updateMessageStatus);

// DELETE /api/admin/messages/:id
router.delete("/:id", deleteMessage);

module.exports = router;
