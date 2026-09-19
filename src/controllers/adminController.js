const ContactMessage = require("../models/ContactMessage");
const { isConnected } = require("../config/db");
const { memoryFallbackStore } = require("./contactController");

/**
 * Get all contact messages with optional filtering, search, and pagination
 */
const getMessages = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    if (isConnected()) {
      const query = {};
      if (status && status !== "all") {
        query.status = status;
      }
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { subject: { $regex: search, $options: "i" } },
          { message: { $regex: search, $options: "i" } },
        ];
      }

      const [messages, total, unreadCount] = await Promise.all([
        ContactMessage.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
        ContactMessage.countDocuments(query),
        ContactMessage.countDocuments({ status: "unread" }),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          messages,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
          stats: {
            unreadCount,
            totalCount: total,
          },
        },
      });
    }

    // Memory Fallback Store
    let filtered = [...memoryFallbackStore];
    if (status && status !== "all") {
      filtered = filtered.filter((m) => m.status === status);
    }
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(s) ||
          m.email.toLowerCase().includes(s) ||
          m.subject.toLowerCase().includes(s) ||
          m.message.toLowerCase().includes(s)
      );
    }

    const unreadCount = memoryFallbackStore.filter((m) => m.status === "unread").length;
    const paginated = filtered.slice(skip, skip + limitNum);

    return res.status(200).json({
      success: true,
      data: {
        messages: paginated,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / limitNum),
        },
        stats: {
          unreadCount,
          totalCount: memoryFallbackStore.length,
        },
      },
    });
  } catch (error) {
    console.error(`[Admin Controller] getMessages error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve messages.",
    });
  }
};

/**
 * Get single message by ID
 */
const getMessageById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isConnected()) {
      const message = await ContactMessage.findById(id);
      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found.",
        });
      }

      // Auto-mark as read if viewing unread message
      if (message.status === "unread") {
        message.status = "read";
        await message.save();
      }

      return res.status(200).json({
        success: true,
        data: message,
      });
    }

    // Fallback store
    const message = memoryFallbackStore.find((m) => m._id === id || String(m._id) === String(id));
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    if (message.status === "unread") {
      message.status = "read";
    }

    return res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error(`[Admin Controller] getMessageById error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve message.",
    });
  }
};

/**
 * Update message status (unread, read, replied, archived)
 */
const updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["unread", "read", "replied", "archived"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid values: ${validStatuses.join(", ")}`,
      });
    }

    if (isConnected()) {
      const updated = await ContactMessage.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
      );

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Message not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: `Message status updated to ${status}.`,
        data: updated,
      });
    }

    // Fallback store
    const item = memoryFallbackStore.find((m) => m._id === id || String(m._id) === String(id));
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    item.status = status;
    item.updatedAt = new Date();

    return res.status(200).json({
      success: true,
      message: `Message status updated to ${status}.`,
      data: item,
    });
  } catch (error) {
    console.error(`[Admin Controller] updateMessageStatus error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to update message status.",
    });
  }
};

/**
 * Delete message by ID
 */
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    if (isConnected()) {
      const deleted = await ContactMessage.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Message not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Message deleted successfully.",
      });
    }

    // Fallback store
    const index = memoryFallbackStore.findIndex((m) => m._id === id || String(m._id) === String(id));
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    memoryFallbackStore.splice(index, 1);

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully.",
    });
  } catch (error) {
    console.error(`[Admin Controller] deleteMessage error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to delete message.",
    });
  }
};

/**
 * Get messages overview stats
 */
const getStats = async (req, res) => {
  try {
    if (isConnected()) {
      const [total, unread, read, replied, archived] = await Promise.all([
        ContactMessage.countDocuments(),
        ContactMessage.countDocuments({ status: "unread" }),
        ContactMessage.countDocuments({ status: "read" }),
        ContactMessage.countDocuments({ status: "replied" }),
        ContactMessage.countDocuments({ status: "archived" }),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          total,
          unread,
          read,
          replied,
          archived,
        },
      });
    }

    const total = memoryFallbackStore.length;
    const unread = memoryFallbackStore.filter((m) => m.status === "unread").length;
    const read = memoryFallbackStore.filter((m) => m.status === "read").length;
    const replied = memoryFallbackStore.filter((m) => m.status === "replied").length;
    const archived = memoryFallbackStore.filter((m) => m.status === "archived").length;

    return res.status(200).json({
      success: true,
      data: {
        total,
        unread,
        read,
        replied,
        archived,
      },
    });
  } catch (error) {
    console.error(`[Admin Controller] getStats error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stats.",
    });
  }
};

module.exports = {
  getMessages,
  getMessageById,
  updateMessageStatus,
  deleteMessage,
  getStats,
};
