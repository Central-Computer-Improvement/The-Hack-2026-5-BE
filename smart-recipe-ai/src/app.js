const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const aiRoutes = require("./routes/ai.routes");

const app = express();

app.use(cors());

// Express JSON middleware with increased payload limit for image base64 uploads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health Check / Welcome Endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Smart Recipe AI (Zero-Waste Kitchen) API is running",
    version: "1.0.0",
    docs: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        me: "GET /api/auth/me (Bearer Token required)"
      },
      ai: {
        generateRecipes: "POST /api/ai/generate-recipes",
        scanPantry: "POST /api/ai/scan-pantry"
      }
    }
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

module.exports = app;