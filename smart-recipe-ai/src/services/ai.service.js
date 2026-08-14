const { GoogleGenAI } = require("@google/genai");

// Retrieve Gemini API key from environment variables
const apiKey = process.env.GEMINI_API_KEY;
let aiClient = null;

if (apiKey && apiKey !== "your_gemini_api_key_here") {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn("Failed to initialize GoogleGenAI client:", err.message);
  }
}

/**
 * Generate Zero-Waste Recipes using Gemini AI
 */
const generateRecipes = async ({ ingredients, kitchenFilters = {} }) => {
  const { tools = ["Kompor", "Rice Cooker"], maxDurationMinutes = 30 } = kitchenFilters;

  // Format ingredients list for prompt
  const ingredientsText = ingredients
    .map((item) => {
      let desc = `- ${item.name} (Jumlah: ${item.quantity || "secukupnya"})`;
      if (item.expiryDate || item.isExpiringSoon) {
        desc += ` [Hampir Basi / Perlu Segera Dipakai!]`;
      }
      return desc;
    })
    .join("\n");

  const promptText = `
Kamu adalah Chef Ahli Nutrisi dan Konsultan Anti-Food Waste (Zero-Waste Kitchen).
Tugasmu adalah merekomendasikan minimal 3 resep masakan berbasis bahan makanan yang dimiliki pengguna.

BAHAN YANG TERSEDIA:
${ingredientsText}

FILTER PERALATAN MAKANAN & WAKTU:
- Peralatan yang tersedia: ${tools.join(", ")}
- Durasi masak maksimal: ${maxDurationMinutes} menit

INSTRUKSI KHUSUS:
1. UTAMAKAN/PRIORITASKAN bahan yang hampir basi/kadaluarsa untuk meminimalkan sampah makanan.
2. Buat instruksi yang ramah anak kos / rumah tangga.
3. Berikan saran substitusi jika ada bahan pendukung kecil yang kurang.
4. Hitung perkiraan penghematan uang (Rupiah) dan berat makanan yang berhasil diselamatkan (kg).

KEMBALIKAN DALAM FORMAT JSON RIGID PERSIS SESUAI STRUKTUR DI BAWAH:
{
  "recipes": [
    {
      "id": "recipe-1",
      "title": "Nama Resep Lezat",
      "description": "Deskripsi singkat resep",
      "prepTimeMinutes": 15,
      "cookingTools": ["Kompor"],
      "usedIngredients": ["Nasi", "Telur"],
      "missingIngredients": [
        { "name": "Bawang Putih", "suggestion": "Bisa diganti bawang merah atau bumbu instan" }
      ],
      "estimatedSavings": {
        "moneySavedRupiah": 15000,
        "foodSavedKg": 0.3
      },
      "steps": [
        "Langkah 1...",
        "Langkah 2..."
      ]
    }
  ]
}
`;

  // If Gemini API Key is available, invoke real AI API
  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-1.5-flash",
        contents: promptText,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (responseText) {
        const parsed = JSON.parse(responseText);
        return parsed;
      }
    } catch (err) {
      console.error("Gemini API Call failed, switching to smart fallback:", err.message);
    }
  }

  // Smart Fallback / Mock Generator when API Key is missing or failing
  return getMockRecipes(ingredients, tools, maxDurationMinutes);
};

/**
 * Scan Pantry Vision: Extract ingredients from photo
 */
const scanPantryImage = async ({ imageBase64 }) => {
  const promptText = `
Analisis foto kulkas/meja dapur ini dan ekstrak daftar bahan makanan yang terlihat.
Kembalikan respon JSON persis seperti berikut:
{
  "detectedIngredients": [
    { "name": "Nama Bahan", "estimatedQuantity": "perkiraan jumlah", "confidence": 0.9 }
  ]
}
`;

  if (aiClient && imageBase64) {
    try {
      // Clean base64 string if data URI scheme is present
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const response = await aiClient.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          { text: promptText },
        ],
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (responseText) {
        return JSON.parse(responseText);
      }
    } catch (err) {
      console.error("Gemini Vision API Call failed, switching to smart fallback:", err.message);
    }
  }

  // Mock response for Pantry Scan
  return {
    detectedIngredients: [
      { name: "Telur Ayam", estimatedQuantity: "4 butir", confidence: 0.95 },
      { name: "Nasi Putih (Sisa)", estimatedQuantity: "1 piring", confidence: 0.91 },
      { name: "Kecap Manis", estimatedQuantity: "1 botol", confidence: 0.88 },
      { name: "Bawang Merah", estimatedQuantity: "3 siung", confidence: 0.82 },
    ],
  };
};

/**
 * Helper to generate smart fallback recipes when testing locally without AI key
 */
function getMockRecipes(ingredients, tools, maxDurationMinutes) {
  const mainNames = ingredients.map((i) => i.name).join(", ");
  return {
    recipes: [
      {
        id: "recipe-mock-1",
        title: `Nasi Goreng Spesial Zero-Waste (${ingredients[0]?.name || "Bahan Utama"})`,
        description: `Resep cepat hemat memanfaatkan ${mainNames} yang ada di kosan.`,
        prepTimeMinutes: Math.min(12, maxDurationMinutes),
        cookingTools: [tools[0] || "Kompor"],
        usedIngredients: ingredients.map((i) => i.name),
        missingIngredients: [
          {
            name: "Garam & Merica",
            suggestion: "Gunakan penyedap rasa instan bungkus jika ada",
          },
        ],
        estimatedSavings: {
          moneySavedRupiah: 18000,
          foodSavedKg: 0.4,
        },
        steps: [
          "Siapkan semua bahan yang tersedia di kulkas/meja.",
          `Panaskan alat ${tools[0] || "Kompor/Wajan"}.`,
          `Tumis dan masak ${ingredients.map((i) => i.name).join(" & ")} hingga matang beraroma.`,
          "Sajikan hangat dan selamat menghemat!",
        ],
      },
      {
        id: "recipe-mock-2",
        title: "Omelet Bumbu Kecap Hemat",
        description: "Kreasi olahan cepat dalam waktu kurang dari 15 menit.",
        prepTimeMinutes: 10,
        cookingTools: [tools[1] || tools[0] || "Kompor"],
        usedIngredients: ingredients.slice(0, 2).map((i) => i.name),
        missingIngredients: [
          {
            name: "Daun Bawang",
            suggestion: "Bisa di-skip atau pakai seledri",
          },
        ],
        estimatedSavings: {
          moneySavedRupiah: 12000,
          foodSavedKg: 0.25,
        },
        steps: [
          "Kocok bahan utama dengan bumbu dapur seadanya.",
          "Goreng dengan api sedang hingga kecokelatan.",
          "Angkat dan nikmati dengan nasi hangat.",
        ],
      },
    ],
  };
}

module.exports = {
  generateRecipes,
  scanPantryImage,
};
