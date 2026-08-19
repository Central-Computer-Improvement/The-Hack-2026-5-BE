const { GoogleGenAI } = require("@google/genai");
const prisma = require("../config/db");

// In-memory fallback recipe history store: Map<userId, Array<Recipe>>
const inMemoryHistory = new Map();

/**
 * Get GoogleGenAI client instance
 */
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "your_gemini_api_key_here") {
    try {
      return new GoogleGenAI({ apiKey });
    } catch (err) {
      console.warn("Failed to initialize GoogleGenAI client:", err.message);
    }
  }
  return null;
};

/**
 * Generate Zero-Waste Recipes using Gemini AI
 */
const generateRecipes = async ({ ingredients, kitchenFilters = {}, userId = null }) => {
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

  let resultData = null;
  const aiClient = getAiClient();

  if (aiClient) {
    const candidateModels = ["gemini-2.5-flash"];



    for (const modelName of candidateModels) {
      try {
        const response = await aiClient.models.generateContent({
          model: modelName,
          contents: promptText,
          config: {
            responseMimeType: "application/json",
          },
        });

        const responseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (responseText) {
          resultData = JSON.parse(responseText);
          break; // Successfully got response from Gemini AI
        }
      } catch (err) {
        console.warn(`Gemini API Call with model ${modelName} failed:`, err.message);
      }
    }
  }

  if (!resultData) {
    console.warn("All Gemini API models failed or API Key missing, switching to smart mock generator");
    resultData = getMockRecipes(ingredients, tools, maxDurationMinutes);
  }


  // Save to history if userId is provided
  if (userId && resultData && Array.isArray(resultData.recipes)) {
    await saveToHistory(userId, resultData.recipes);
  }

  return resultData;
};

/**
 * Save generated recipes to user history (Max 10 history items)
 */
const saveToHistory = async (userId, recipes) => {
  // Prisma DB Operation if connected
  if (prisma) {
    try {
      for (const recipe of recipes) {
        await prisma.recipeHistory.create({
          data: {
            userId,
            title: recipe.title || "Resep Zero-Waste",
            description: recipe.description || "",
            prepTimeMinutes: recipe.prepTimeMinutes || 15,
            cookingTools: recipe.cookingTools || [],
            usedIngredients: recipe.usedIngredients || [],
            missingIngredients: recipe.missingIngredients || [],
            estimatedSavings: recipe.estimatedSavings || {},
            steps: recipe.steps || [],
          },
        });
      }

      // Maintain Max 10 History items: fetch all items sorted descending
      const allHistory = await prisma.recipeHistory.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      if (allHistory.length > 10) {
        const excessItems = allHistory.slice(10);
        const excessIds = excessItems.map((item) => item.id);
        await prisma.recipeHistory.deleteMany({
          where: { id: { in: excessIds } },
        });
      }
      return;
    } catch (err) {
      console.warn("DB operation failed, using in-memory recipe history:", err.message);
    }
  }

  // Fallback in-memory history handling
  if (!inMemoryHistory.has(userId)) {
    inMemoryHistory.set(userId, []);
  }
  const userHistory = inMemoryHistory.get(userId);

  for (const recipe of recipes) {
    const historyItem = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      ...recipe,
      createdAt: new Date().toISOString(),
    };
    userHistory.unshift(historyItem); // insert at start
  }

  // Trim to max 10 items
  if (userHistory.length > 10) {
    inMemoryHistory.set(userId, userHistory.slice(0, 10));
  }
};

/**
 * Get user recipe history (Max 10 items)
 */
const getRecipeHistory = async (userId) => {
  if (prisma) {
    try {
      const history = await prisma.recipeHistory.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
      if (history && history.length > 0) {
        return history;
      }
    } catch (err) {
      console.warn("DB operation failed, fetching in-memory recipe history:", err.message);
    }
  }

  return (inMemoryHistory.get(userId) || []).slice(0, 10);
};

/**
 * Clear recipe history for a user
 */
const clearRecipeHistory = async (userId) => {
  if (prisma) {
    try {
      await prisma.recipeHistory.deleteMany({
        where: { userId },
      });
    } catch (err) {
      console.warn("DB operation failed for clearing recipe history:", err.message);
    }
  }

  inMemoryHistory.set(userId, []);
  return { message: "Recipe history cleared successfully" };
};

/**
/**
 * Scan Pantry Vision: Extract ingredients from photo (Supports Base64 or Image URL)
 */
const scanPantryImage = async ({ imageBase64, imageUrl }) => {
  let targetBase64 = imageBase64;

  // Auto-fetch if image URL is passed instead of base64
  const potentialUrl = imageUrl || (typeof imageBase64 === "string" && imageBase64.startsWith("http") ? imageBase64 : null);

  if (potentialUrl) {
    try {
      const fetchRes = await fetch(potentialUrl);
      const arrayBuffer = await fetchRes.arrayBuffer();
      targetBase64 = Buffer.from(arrayBuffer).toString("base64");
    } catch (err) {
      console.warn("Failed to fetch image from URL, using fallback:", err.message);
    }
  }

  const promptText = `
Analisis foto kulkas/meja dapur ini dan ekstrak daftar bahan makanan yang terlihat.
Kembalikan respon JSON persis seperti berikut:
{
  "detectedIngredients": [
    { "name": "Nama Bahan", "estimatedQuantity": "perkiraan jumlah", "confidence": 0.9 }
  ]
}
`;

  const aiClient = getAiClient();

  if (aiClient && targetBase64) {
    const cleanBase64 = targetBase64.replace(/^data:image\/\w+;base64,/, "");
    const candidateModels = ["gemini-2.5-flash"];




    for (const modelName of candidateModels) {
      try {
        const response = await aiClient.models.generateContent({
          model: modelName,
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
        console.warn(`Gemini Vision API Call with model ${modelName} failed:`, err.message);
      }
    }
  }



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
 * Helper to generate smart fallback recipes when API key is missing or failing
 */
function getMockRecipes(ingredients, tools, maxDurationMinutes) {
  const mainNames = ingredients.map((i) => i.name).join(", ");
  return {
    recipes: [
      {
        id: `recipe-mock-1-${Date.now()}`,
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
        id: `recipe-mock-2-${Date.now()}`,
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
  getRecipeHistory,
  clearRecipeHistory,
};

