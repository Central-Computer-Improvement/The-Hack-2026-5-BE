const jwt = require("jsonwebtoken");

const getJwtSecret = () => process.env.JWT_SECRET || "smart_recipe_ai_secret_key_2026";

/**
 * Express Middleware to Protect Routes
 * Checks JWT Bearer Token in Header
 */
const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, getJwtSecret());
      req.user = decoded; // Attach user info to request
      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token invalid or expired",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided",
    });
  }
};

/**
 * Express Middleware for Optional Authentication
 * Attaches req.user if Bearer Token exists, otherwise proceeds
 */
const optionalProtect = (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, getJwtSecret());
      req.user = decoded;
    } catch (error) {
      // Ignore token verification errors for optional auth
    }
  }
  next();
};

module.exports = { protect, optionalProtect };


