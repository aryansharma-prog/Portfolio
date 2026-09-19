/**
 * Admin Authentication Middleware
 * Protects administrative endpoints using a secret Admin API Key header.
 */
const adminAuth = (req, res, next) => {
  const configuredKey = process.env.ADMIN_API_KEY;

  if (!configuredKey) {
    return res.status(500).json({
      success: false,
      message: "Admin API Key is not configured on the server. Please set ADMIN_API_KEY in .env.",
    });
  }

  // Extract from x-admin-key header or Authorization: Bearer <key>
  const headerKey = req.headers["x-admin-key"];
  const authHeader = req.headers.authorization;
  let bearerToken = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    bearerToken = authHeader.split(" ")[1];
  }

  const providedKey = headerKey || bearerToken;

  if (!providedKey || providedKey !== configuredKey) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. A valid Admin API Key is required to access this resource.",
    });
  }

  next();
};

module.exports = adminAuth;
