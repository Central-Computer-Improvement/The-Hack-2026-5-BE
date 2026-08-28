const swaggerUi = require("swagger-ui-express");

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Smart Recipe AI (Zero-Waste Kitchen) API",
    version: "1.0.0",
    description:
      "Dokumentasi API interaktif untuk aplikasi Smart Recipe AI (SDG 12 - Responsible Consumption & Production).\nFitur meliputi Authentication, AI Recipe Generator, Vision Pantry Scan, History (Max 10), Pantry Management, & Favorite Recipes.",
    contact: {
      name: "Tim Smart Recipe AI",
    },
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Development Server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Masukkan JWT Token hasil login/register (Format: Bearer <token>)",
      },
    },
  },
  tags: [
    { name: "Authentication", description: "Register, Login, & User Profile" },
    { name: "AI Kitchen", description: "AI Recipe Generator, Vision Scan, & History" },
    { name: "Pantry Tracker", description: "Manajemen Stok Bahan Makanan" },
    { name: "Favorites", description: "Manajemen Resep Favorit" },
  ],
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register user baru",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Anak Kos Test" },
                  email: { type: "string", example: "anakkos@example.com" },
                  password: { type: "string", example: "password123" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User registered successfully" },
          400: { description: "Validation error / Email already exists" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Login user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", example: "anakkos@example.com" },
                  password: { type: "string", example: "password123" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Login successful" },
          401: { description: "Invalid email or password" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Ambil profil user yang sedang login",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Profile user berhasil diambil" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/ai/generate-recipes": {
      post: {
        tags: ["AI Kitchen"],
        summary: "Hasilkan 3+ resep zero-waste berbasis stok bahan",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["ingredients"],
                properties: {
                  ingredients: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", example: "Telur Ayam" },
                        quantity: { type: "string", example: "2 butir" },
                        isExpiringSoon: { type: "boolean", example: true },
                      },
                    },
                  },
                  kitchenFilters: {
                    type: "object",
                    properties: {
                      tools: {
                        type: "array",
                        items: { type: "string" },
                        example: ["Kompor", "Rice Cooker"],
                      },
                      maxDurationMinutes: { type: "integer", example: 15 },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Daftar resep berhasil dihasilkan oleh AI" },
        },
      },
    },
    "/api/ai/scan-pantry": {
      post: {
        tags: ["AI Kitchen"],
        summary: "Pindai foto isi kulkas/meja dapur (Multimodal Vision AI)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["imageBase64"],
                properties: {
                  imageBase64: {
                    type: "string",
                    example: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
                    description: "String Base64 foto kulkas / bahan makanan",
                  },
                  imageUrl: {
                    type: "string",
                    example: "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7",
                    description: "URL publik gambar foto kulkas / bahan makanan dari internet",
                  },
                },

              },
            },
          },
        },
        responses: {
          200: { description: "Bahan makanan berhasil terdeteksi" },
        },
      },
    },
    "/api/ai/history": {
      get: {
        tags: ["AI Kitchen"],
        summary: "Ambil riwayat resep yang dihasilkan AI (Maksimal 10 entri)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Daftar riwayat resep" },
        },
      },
      delete: {
        tags: ["AI Kitchen"],
        summary: "Hapus seluruh riwayat resep pengguna",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Riwayat resep berhasil dihapus" },
        },
      },
    },
    "/api/pantry": {
      get: {
        tags: ["Pantry Tracker"],
        summary: "Ambil seluruh daftar stok bahan makanan milik user",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Daftar stok bahan makanan" },
        },
      },
      post: {
        tags: ["Pantry Tracker"],
        summary: "Tambah stok bahan makanan baru",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Bawang Merah" },
                  quantity: { type: "string", example: "5 siung" },
                  category: { type: "string", example: "Bumbu" },
                  isExpiringSoon: { type: "boolean", example: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Bahan makanan berhasil ditambahkan" },
        },
      },
    },
    "/api/pantry/{id}": {
      put: {
        tags: ["Pantry Tracker"],
        summary: "Update data bahan makanan",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  quantity: { type: "string" },
                  isExpiringSoon: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Bahan makanan berhasil diperbarui" },
        },
      },
      delete: {
        tags: ["Pantry Tracker"],
        summary: "Hapus bahan makanan dari pantry",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Bahan makanan berhasil dihapus" },
          404: { description: "Bahan makanan tidak ditemukan atau tidak memiliki izin" },
        },
      },
    },
    "/api/favorites": {
      get: {
        tags: ["Favorites"],
        summary: "Ambil daftar resep favorit user",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Daftar resep favorit" },
        },
      },
      post: {
        tags: ["Favorites"],
        summary: "Tambahkan resep ke daftar favorit",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: { type: "string", example: "Nasi Goreng Spesial Zero-Waste" },
                  description: { type: "string", example: "Resep cepat ramah anak kos" },
                  prepTimeMinutes: { type: "integer", example: 15 },
                  cookingTools: { type: "array", items: { type: "string" }, example: ["Kompor"] },
                  usedIngredients: { type: "array", items: { type: "string" }, example: ["Nasi", "Telur"] },
                  missingIngredients: { type: "array", items: { type: "object" }, example: [] },
                  estimatedSavings: { type: "object", example: { moneySavedRupiah: 15000, foodSavedKg: 0.3 } },
                  steps: { type: "array", items: { type: "string" }, example: ["Tumis bahan", "Sajikan"] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Resep berhasil disimpan ke favorit" },
        },
      },
    },
    "/api/favorites/{id}": {
      delete: {
        tags: ["Favorites"],
        summary: "Hapus resep dari favorit",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Resep favorit berhasil dihapus" },
          404: { description: "Resep favorit tidak ditemukan atau tidak memiliki izin" },
        },
      },
    },
  },
};

const setupSwagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
};

module.exports = setupSwagger;
