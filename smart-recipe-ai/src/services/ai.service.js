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
      console.warn(
        "Failed to initialize GoogleGenAI client:",
        err.message
      );
    }
  }

  return null;
};

/**
 * Generate Zero-Waste Recipes using Gemini AI
 */
const generateRecipes = async ({
  ingredients,
  kitchenFilters = {},
  userId = null,
}) => {
  const {
    tools = ["Kompor", "Rice Cooker"],
    maxDurationMinutes = 30,
  } = kitchenFilters;

  // Format ingredients list for prompt
  const ingredientsText = ingredients
    .map((item) => {
      if (typeof item === "string") {
        return `- ${item} (Jumlah: secukupnya)`;
      }

      const name = item.name || item.title || "Bahan";
      const quantity =
        item.quantity ||
        item.estimatedQuantity ||
        "secukupnya";

      let desc = `- ${name} (Jumlah: ${quantity})`;

      if (item.expiryDate || item.isExpiringSoon) {
        desc += " [Hampir Basi / Perlu Segera Dipakai!]";
      }

      return desc;
    })
    .join("\n");

  const toolsText = tools.join(", ");

  const promptText = `
Kamu adalah Chef Ahli Nutrisi dan Konsultan Anti-Food Waste (Zero-Waste Kitchen).

TUGAS:
Buat minimal 3 resep masakan yang realistis, mudah dibuat, dan sesuai dengan bahan serta peralatan yang tersedia.

========================
BAHAN YANG TERSEDIA
========================

${ingredientsText}

========================
PERALATAN YANG TERSEDIA
========================

${toolsText}

========================
BATAS WAKTU
========================

Maksimal waktu memasak: ${maxDurationMinutes} menit.

========================
ATURAN UTAMA
========================

1. Prioritaskan bahan yang hampir basi atau perlu segera digunakan.

2. Jangan memaksakan semua bahan untuk digunakan dalam satu resep.

3. Tentukan secara cerdas fungsi setiap bahan:
   - bahan utama
   - bahan pendamping
   - bumbu
   - topping
   - pelengkap
   - bahan opsional

4. Bahan yang tidak cocok untuk dimasak tidak boleh dipaksakan untuk dimasak.

5. Contoh:
   - Pisang dapat digunakan sebagai pelengkap, topping, dessert, atau dimakan langsung jika lebih sesuai.
   - Garam digunakan sebagai bumbu.
   - Minyak digunakan untuk memasak.
   - Bawang dapat digunakan sebagai bumbu.
   - Buah tidak selalu harus dimasak.

6. Jangan membuat resep hanya dengan menggabungkan seluruh bahan yang tersedia.

7. Jangan menggunakan bahan yang tidak tersedia sebagai bahan utama.

8. Jika membutuhkan bahan kecil yang tidak tersedia, masukkan ke "missingIngredients".

9. Jika bahan tambahan tidak tersedia tetapi resep masih dapat dibuat tanpa bahan tersebut, jadikan bahan tersebut opsional.

10. Gunakan hanya peralatan yang tersedia pada daftar:
${toolsText}

11. Jangan mengasumsikan tools[0] sebagai alat utama. Tentukan sendiri alat yang tepat berdasarkan kebutuhan setiap resep.

12. Jangan membuat langkah yang menggunakan alat yang tidak tersedia.

13. Jika metode memasak tertentu membutuhkan alat yang tidak tersedia, pilih metode alternatif yang menggunakan alat yang tersedia.

14. Semua instruction, action, description, title, dan suggestion harus menggunakan Bahasa Indonesia.

========================
ATURAN KHUSUS STEPS
========================

1. Steps HARUS berupa array of objects.

2. Setiap step WAJIB memiliki struktur:

{
  "step": 1,
  "action": "Persiapan",
  "instruction": "Instruksi yang jelas",
  "durationMinutes": 2
}

3. JANGAN PERNAH mengembalikan steps sebagai array of strings.

SALAH:
"steps": [
  "Potong bawang.",
  "Masukkan ke wajan."
]

BENAR:
"steps": [
  {
    "step": 1,
    "action": "Persiapan",
    "instruction": "Potong bawang menjadi irisan tipis.",
    "durationMinutes": 2
  },
  {
    "step": 2,
    "action": "Tumis",
    "instruction": "Tumis bawang dengan api sedang hingga harum.",
    "durationMinutes": 2
  }
]

4. Setiap recipe harus memiliki 4-8 steps.

5. Setiap step hanya boleh memiliki satu aktivitas utama.

6. Semua steps harus dibuat berdasarkan recipe yang telah dipilih AI.

7. JANGAN membuat steps dengan cara menggabungkan seluruh ingredients.

8. JANGAN mengasumsikan semua ingredients harus dimasak.

9. AI HARUS menentukan terlebih dahulu fungsi setiap bahan:
   - main ingredient
   - seasoning
   - side dish
   - topping
   - garnish
   - optional
   - unused

10. Jika buah lebih cocok dimakan segar, jangan masukkan buah tersebut ke dalam proses memasak.

11. Jika suatu bahan hanya digunakan sebagai pelengkap, jelaskan penggunaannya sebagai pelengkap.

12. Jangan memasukkan bahan ke dalam instruction jika bahan tersebut tidak digunakan dalam recipe.

13. Jangan menggunakan alat yang tidak tersedia.

14. Jangan menganggap tools[0] sebagai alat utama.

15. cookingTools hanya berisi alat yang benar-benar digunakan.

16. Jika recipe tidak membutuhkan alat memasak, seperti salad buah, cookingTools boleh berupa [].

17. durationMinutes harus berupa angka.

18. Jumlah seluruh durationMinutes pada steps harus konsisten dengan totalTimeMinutes.

19. totalTimeMinutes tidak boleh melebihi ${maxDurationMinutes} menit.

20. Jangan membuat instruksi generik seperti:
   - "Masak semua bahan."
   - "Campurkan semua bahan."
   - "Masak hingga matang."

21. Instruksi harus spesifik terhadap recipe yang dibuat.

22. Jangan menambahkan bahan yang tidak tersedia sebagai usedIngredients.

23. Bahan yang tidak tersedia hanya boleh muncul pada missingIngredients.

24. Jangan mengklaim suatu bahan digunakan jika bahan tersebut tidak benar-benar digunakan dalam steps.

========================
ATURAN COOKING TOOLS
========================

"cookingTools" hanya boleh berisi alat yang benar-benar digunakan pada resep.

Jangan memasukkan semua tools yang tersedia jika tidak digunakan.

Contoh:

Jika tersedia:
["Pisau", "Kompor", "Blender"]

dan resep hanya membutuhkan pisau dan kompor, maka:

"cookingTools": ["Pisau", "Kompor"]

Jangan:

"cookingTools": ["Pisau", "Kompor", "Blender"]

========================
ATURAN ZERO-WASTE
========================

1. Prioritaskan bahan yang hampir basi.
2. Usahakan menggunakan bahan yang mudah rusak terlebih dahulu.
3. Jangan mengorbankan kewajaran resep hanya untuk menghabiskan semua bahan.
4. Jika suatu bahan lebih cocok dijadikan pelengkap daripada bahan utama, gunakan sebagai pelengkap.
5. Jangan membuat klaim penyelamatan makanan yang tidak realistis.

========================
ATURAN ESTIMATED SAVINGS
========================

Berikan perkiraan yang masuk akal untuk:

- moneySavedRupiah
- foodSavedKg

Jangan memberikan angka yang terlalu tinggi atau tidak realistis.

========================
FORMAT OUTPUT
========================

Kembalikan HANYA JSON VALID.

{
  "recipes": [
    {
      "id": "recipe-1",
      "title": "Nama Resep",
      "description": "Deskripsi singkat",
      
      "prepTimeMinutes": 5,
      "cookingTimeMinutes": 10,
      "totalTimeMinutes": 15,

      "cookingTools": [
        "Kompor",
        "Wajan"
      ],

      "usedIngredients": [
        "Nasi",
        "Telur"
      ],

      "missingIngredients": [
        {
          "name": "Bawang Putih",
          "suggestion": "Bisa diganti bawang merah."
        }
      ],

      "estimatedSavings": {
        "moneySavedRupiah": 15000,
        "foodSavedKg": 0.3
      },

      "steps": [
        {
          "step": 1,
          "action": "Persiapan",
          "instruction": "Siapkan nasi dan kocok telur dalam mangkuk.",
          "durationMinutes": 3
        },
        {
          "step": 2,
          "action": "Panaskan",
          "instruction": "Panaskan wajan dengan api sedang dan tambahkan sedikit minyak.",
          "durationMinutes": 1
        },
        {
          "step": 3,
          "action": "Masak",
          "instruction": "Masukkan telur dan orak-arik hingga matang.",
          "durationMinutes": 3
        },
        {
          "step": 4,
          "action": "Campurkan",
          "instruction": "Masukkan nasi dan aduk hingga tercampur rata dengan telur.",
          "durationMinutes": 4
        },
        {
          "step": 5,
          "action": "Sajikan",
          "instruction": "Koreksi rasa, angkat, dan sajikan selagi hangat.",
          "durationMinutes": 1
        }
      ]
    }
  ]
}

ATURAN JSON:

- recipes harus array.
- Minimal 3 recipes.
- Setiap recipe wajib memiliki steps.
- steps WAJIB berupa array of objects.
- DILARANG menggunakan array of strings untuk steps.
- Setiap step WAJIB memiliki:
  "step"
  "action"
  "instruction"
  "durationMinutes"
- step harus integer.
- step dimulai dari 1.
- step harus berurutan.
- durationMinutes harus integer.
- Jangan memasukkan Markdown.
- Jangan memasukkan penjelasan di luar JSON.
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

        const responseText =
          response.text ||
          response.candidates?.[0]?.content?.parts?.[0]?.text;

        if (responseText) {
          resultData = JSON.parse(responseText);

          // Basic validation
          if (
            resultData &&
            Array.isArray(resultData.recipes)
          ) {
            resultData.recipes = resultData.recipes.map(
              (recipe, index) => ({
                ...recipe,

                id:
                  recipe.id ||
                  `recipe-${index + 1}-${Date.now()}`,

                steps: Array.isArray(recipe.steps)
                  ? recipe.steps
                  : [],
              })
            );
          }

          break;
        }
      } catch (err) {
        console.warn(
          `Gemini API Call with model ${modelName} failed:`,
          err.message
        );
      }
    }
  }

  // Fallback when Gemini is unavailable
  if (
    !resultData ||
    !Array.isArray(resultData.recipes) ||
    resultData.recipes.length === 0
  ) {
    console.warn(
      "All Gemini API models failed or API Key missing, switching to smart mock generator"
    );

    resultData = getMockRecipes(
      ingredients,
      tools,
      maxDurationMinutes
    );
  }

  // Save to history if userId is provided
  if (
    userId &&
    resultData &&
    Array.isArray(resultData.recipes)
  ) {
    await saveToHistory(userId, resultData.recipes);
  }

  return resultData;
};

/**
 * Save generated recipes to user history
 * Max 10 history items
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
            prepTimeMinutes:
              recipe.prepTimeMinutes || 15,
            cookingTools:
              recipe.cookingTools || [],
            usedIngredients:
              recipe.usedIngredients || [],
            missingIngredients:
              recipe.missingIngredients || [],
            estimatedSavings:
              recipe.estimatedSavings || {},
            steps: recipe.steps || [],
          },
        });
      }

      // Maintain maximum 10 history items
      const allHistory =
        await prisma.recipeHistory.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });

      if (allHistory.length > 10) {
        const excessItems = allHistory.slice(10);

        const excessIds = excessItems.map(
          (item) => item.id
        );

        await prisma.recipeHistory.deleteMany({
          where: {
            id: {
              in: excessIds,
            },
          },
        });
      }

      return;
    } catch (err) {
      console.warn(
        "DB operation failed, using in-memory recipe history:",
        err.message
      );
    }
  }

  // Fallback in-memory history handling
  if (!inMemoryHistory.has(userId)) {
    inMemoryHistory.set(userId, []);
  }

  const userHistory =
    inMemoryHistory.get(userId);

  for (const recipe of recipes) {
    const historyItem = {
      id: `hist_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 5)}`,
      ...recipe,
      createdAt: new Date().toISOString(),
    };

    userHistory.unshift(historyItem);
  }

  // Trim to maximum 10 items
  if (userHistory.length > 10) {
    inMemoryHistory.set(
      userId,
      userHistory.slice(0, 10)
    );
  }
};

/**
 * Get user recipe history
 * Max 10 history items
 */
const getRecipeHistory = async (userId) => {
  if (prisma) {
    try {
      const history =
        await prisma.recipeHistory.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 10,
        });

      if (history && history.length > 0) {
        return history;
      }
    } catch (err) {
      console.warn(
        "DB operation failed, fetching in-memory recipe history:",
        err.message
      );
    }
  }

  return (
    inMemoryHistory.get(userId) || []
  ).slice(0, 10);
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
      console.warn(
        "DB operation failed for clearing recipe history:",
        err.message
      );
    }
  }

  inMemoryHistory.set(userId, []);

  return {
    message: "Recipe history cleared successfully",
  };
};

/**
 * Scan Pantry Vision:
 * Extract ingredients from photo
 * Supports Base64 or Image URL
 */
const scanPantryImage = async ({
  imageBase64,
  imageUrl,
}) => {
  let targetBase64 = imageBase64;

  // Auto-fetch if image URL is passed instead of base64
  const potentialUrl =
    imageUrl ||
    (typeof imageBase64 === "string" &&
      imageBase64.startsWith("http")
      ? imageBase64
      : null);

  if (potentialUrl) {
    try {
      const fetchRes = await fetch(potentialUrl);

      const arrayBuffer =
        await fetchRes.arrayBuffer();

      targetBase64 =
        Buffer.from(arrayBuffer).toString("base64");
    } catch (err) {
      console.warn(
        "Failed to fetch image from URL, using fallback:",
        err.message
      );
    }
  }

  const promptText = `
Analisis foto kulkas atau meja dapur ini dan ekstrak daftar bahan makanan yang terlihat.

Identifikasi bahan dengan hati-hati.

Jangan mengarang bahan yang tidak terlihat.

Jika jumlah tidak dapat diketahui secara pasti, gunakan perkiraan yang masuk akal.

Kembalikan respon JSON persis seperti berikut:

{
  "detectedIngredients": [
    {
      "name": "Nama Bahan",
      "estimatedQuantity": "perkiraan jumlah",
      "confidence": 0.9
    }
  ]
}

confidence harus berupa angka antara 0 dan 1.
`;

  const aiClient = getAiClient();

  if (aiClient && targetBase64) {
    const cleanBase64 =
      targetBase64.replace(
        /^data:image\/\w+;base64,/,
        ""
      );

    const candidateModels = [
      "gemini-2.5-flash",
    ];

    for (const modelName of candidateModels) {
      try {
        const response =
          await aiClient.models.generateContent({
            model: modelName,
            contents: [
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: cleanBase64,
                },
              },
              {
                text: promptText,
              },
            ],
            config: {
              responseMimeType: "application/json",
            },
          });

        const responseText =
          response.text ||
          response.candidates?.[0]?.content?.parts?.[0]
            ?.text;

        if (responseText) {
          return JSON.parse(responseText);
        }
      } catch (err) {
        console.warn(
          `Gemini Vision API Call with model ${modelName} failed:`,
          err.message
        );
      }
    }
  }

  return {
    detectedIngredients: [
      {
        name: "Telur Ayam",
        estimatedQuantity: "4 butir",
        confidence: 0.95,
      },
      {
        name: "Nasi Putih (Sisa)",
        estimatedQuantity: "1 piring",
        confidence: 0.91,
      },
      {
        name: "Kecap Manis",
        estimatedQuantity: "1 botol",
        confidence: 0.88,
      },
      {
        name: "Bawang Merah",
        estimatedQuantity: "3 siung",
        confidence: 0.82,
      },
    ],
  };
};

/**
 * Helper to generate fallback recipes
 * when API key is missing or Gemini fails.
 *
 * IMPORTANT:
 * Fallback menggunakan resep yang sudah ditentukan,
 * bukan menggabungkan seluruh ingredients secara otomatis.
 */
function getMockRecipes(
  ingredients,
  tools,
  maxDurationMinutes
) {
  const hasIngredient = (keyword) =>
    ingredients.some((item) => {
      const name =
        typeof item === "string"
          ? item
          : item.name || item.title || "";

      return name
        .toLowerCase()
        .includes(keyword.toLowerCase());
    });

  const hasRice = hasIngredient("nasi");
  const hasEgg = hasIngredient("telur");
  const hasBanana = hasIngredient("pisang");

  const recipes = [];

  /**
   * Recipe 1: Nasi Goreng
   * Only generate if rice exists.
   */
  if (hasRice) {
    recipes.push({
      id: `recipe-mock-1-${Date.now()}`,
      title: "Nasi Goreng Sederhana Zero-Waste",
      description:
        "Nasi goreng sederhana untuk memanfaatkan nasi yang tersedia.",
      prepTimeMinutes: Math.min(
        15,
        maxDurationMinutes
      ),
      cookingTools: tools.includes("Kompor")
        ? ["Kompor"]
        : tools.slice(0, 1),
      usedIngredients: [
        ...(hasRice ? ["Nasi"] : []),
        ...(hasEgg ? ["Telur"] : []),
      ],
      missingIngredients: [
        {
          name: "Bawang Putih",
          suggestion:
            "Bisa diganti dengan bawang merah atau bumbu instan.",
        },
      ],
      estimatedSavings: {
        moneySavedRupiah: 15000,
        foodSavedKg: 0.3,
      },
      steps: [
        {
          step: 1,
          action: "Persiapan",
          instruction:
            "Siapkan nasi dan bahan lain yang akan digunakan.",
          durationMinutes: 2,
        },
        {
          step: 2,
          action: "Panaskan",
          instruction:
            "Panaskan wajan dengan api sedang dan tambahkan sedikit minyak.",
          durationMinutes: 1,
        },
        {
          step: 3,
          action: "Masak",
          instruction: hasEgg
            ? "Masukkan telur dan orak-arik hingga matang."
            : "Masukkan bumbu yang tersedia dan tumis hingga harum.",
          durationMinutes: 3,
        },
        {
          step: 4,
          action: "Campurkan",
          instruction:
            "Masukkan nasi dan aduk hingga tercampur rata dengan bumbu.",
          durationMinutes: 5,
        },
        {
          step: 5,
          action: "Sajikan",
          instruction:
            "Koreksi rasa, angkat, dan sajikan selagi hangat.",
          durationMinutes: 1,
        },
      ],
    });
  }

  /**
   * Recipe 2: Omelet
   * Only generate if egg exists.
   */
  if (hasEgg) {
    recipes.push({
      id: `recipe-mock-2-${Date.now()}`,
      title: "Omelet Telur Hemat",
      description:
        "Omelet sederhana yang cocok untuk sarapan atau lauk cepat.",
      prepTimeMinutes: Math.min(
        10,
        maxDurationMinutes
      ),
      cookingTools: tools.includes("Kompor")
        ? ["Kompor"]
        : tools.slice(0, 1),
      usedIngredients: ["Telur"],
      missingIngredients: [
        {
          name: "Daun Bawang",
          suggestion:
            "Bisa dihilangkan atau diganti dengan bawang merah.",
        },
      ],
      estimatedSavings: {
        moneySavedRupiah: 12000,
        foodSavedKg: 0.2,
      },
      steps: [
        {
          step: 1,
          action: "Persiapan",
          instruction:
            "Pecahkan telur ke dalam mangkuk lalu kocok hingga tercampur rata.",
          durationMinutes: 2,
        },
        {
          step: 2,
          action: "Panaskan",
          instruction:
            "Panaskan wajan dengan api sedang dan tambahkan sedikit minyak.",
          durationMinutes: 1,
        },
        {
          step: 3,
          action: "Masak",
          instruction:
            "Tuangkan telur ke dalam wajan dan masak hingga bagian bawahnya mulai matang.",
          durationMinutes: 3,
        },
        {
          step: 4,
          action: "Balik",
          instruction:
            "Balik omelet secara perlahan dan masak sisi lainnya hingga matang.",
          durationMinutes: 2,
        },
        {
          step: 5,
          action: "Sajikan",
          instruction:
            "Angkat omelet dan sajikan selagi hangat.",
          durationMinutes: 1,
        },
      ],
    });
  }

  /**
   * Recipe 3: Simple banana serving
   * Banana is NOT forced to be cooked.
   */
  if (hasBanana) {
    recipes.push({
      id: `recipe-mock-3-${Date.now()}`,
      title: "Pisang Segar dengan Topping Sederhana",
      description:
        "Cara sederhana memanfaatkan pisang matang tanpa perlu dimasak.",
      prepTimeMinutes: Math.min(
        5,
        maxDurationMinutes
      ),
      cookingTools: [],
      usedIngredients: ["Pisang"],
      missingIngredients: [],
      estimatedSavings: {
        moneySavedRupiah: 8000,
        foodSavedKg: 0.2,
      },
      steps: [
        {
          step: 1,
          action: "Persiapan",
          instruction:
            "Kupas pisang dan periksa bagian yang terlalu matang atau rusak.",
          durationMinutes: 1,
        },
        {
          step: 2,
          action: "Potong",
          instruction:
            "Potong pisang menjadi beberapa bagian sesuai selera.",
          durationMinutes: 2,
        },
        {
          step: 3,
          action: "Sajikan",
          instruction:
            "Sajikan pisang sebagai camilan atau pelengkap makanan.",
          durationMinutes: 1,
        },
      ],
    });
  }

  /**
   * Generic fallback if no specific recipe
   * could be determined.
   */
  if (recipes.length === 0) {
    recipes.push({
      id: `recipe-mock-${Date.now()}`,
      title: "Menu Sederhana Zero-Waste",
      description:
        "Gunakan bahan yang tersedia dengan metode memasak sederhana.",
      prepTimeMinutes: Math.min(
        15,
        maxDurationMinutes
      ),
      cookingTools: tools.slice(0, 1),
      usedIngredients: ingredients
        .slice(0, 2)
        .map((item) =>
          typeof item === "string"
            ? item
            : item.name || item.title
        ),
      missingIngredients: [],
      estimatedSavings: {
        moneySavedRupiah: 10000,
        foodSavedKg: 0.15,
      },
      steps: [
        {
          step: 1,
          action: "Persiapan",
          instruction:
            "Siapkan bahan yang akan digunakan dan bersihkan sebelum memasak.",
          durationMinutes: 3,
        },
        {
          step: 2,
          action: "Masak",
          instruction:
            "Gunakan metode memasak yang sesuai dengan jenis bahan dan peralatan yang tersedia.",
          durationMinutes: 7,
        },
        {
          step: 3,
          action: "Sajikan",
          instruction:
            "Periksa rasa dan kematangan makanan sebelum disajikan.",
          durationMinutes: 2,
        },
      ],
    });
  }

  return {
    recipes: recipes.slice(0, 3),
  };
}

module.exports = {
  generateRecipes,
  scanPantryImage,
  getRecipeHistory,
  clearRecipeHistory,
};
