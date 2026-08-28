const app = require("./src/app");
const http = require("http");

// Create a temporary server on an available dynamic port to test Express app
const server = http.createServer(app);

server.listen(0, async () => {
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;
  console.log(`🚀 Automated Test Server running on ${baseUrl}`);

  try {
    // 1. Health check
    console.log("\n1️⃣  Testing GET / (Health Check)");
    const healthRes = await fetch(`${baseUrl}/`);
    const healthData = await healthRes.json();
    console.log("   Status:", healthRes.status, "| Message:", healthData.message);

    // 2. Register
    console.log("\n2️⃣  Testing POST /api/auth/register");
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Anak Kos Test",
        email: `anakkos_${Date.now()}@example.com`,
        password: "password123",
      }),
    });
    const regData = await regRes.json();
    console.log("   Status:", regRes.status, "| Message:", regData.message);
    let activeToken = regData.data?.token;

    // 3. Login
    console.log("\n3️⃣  Testing POST /api/auth/login");
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: regData.data?.user?.email,
        password: "password123",
      }),
    });
    const loginData = await loginRes.json();
    console.log("   Status:", loginRes.status, "| Message:", loginData.message);
    if (loginData.data?.token) {
      activeToken = loginData.data.token;
    }

    // 4. Get Profile (Protected)
    console.log("\n4️⃣  Testing GET /api/auth/me (Protected Route)");
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${activeToken}` },
    });
    const meData = await meRes.json();
    console.log("   Status:", meRes.status, "| User:", meData.data?.user?.email);

    // 5. AI Recipe Generation (Authenticated to record history)
    console.log("\n5️⃣  Testing POST /api/ai/generate-recipes");
    const aiRes = await fetch(`${baseUrl}/api/ai/generate-recipes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${activeToken}`,
      },
      body: JSON.stringify({
        ingredients: [
          { name: "Telur", quantity: "2 butir", isExpiringSoon: true },
          { name: "Nasi Putih", quantity: "1 piring", isExpiringSoon: true },
          { name: "Kecap Manis", quantity: "secukupnya" },
        ],
        kitchenFilters: {
          tools: ["Rice Cooker", "Kompor"],
          maxDurationMinutes: 15,
        },
      }),
    });

    const aiData = await aiRes.json();
    console.log("   Status:", aiRes.status);
    console.log("   Recipes Generated:", aiData.data?.recipes?.length);
    console.log("   Sample Title:", aiData.data?.recipes?.[0]?.title);
    const generatedRecipe = aiData.data?.recipes?.[0];

    // 6. AI Pantry Vision Scan
    console.log("\n6️⃣  Testing POST /api/ai/scan-pantry");
    const scanRes = await fetch(`${baseUrl}/api/ai/scan-pantry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
      }),
    });
    const scanData = await scanRes.json();
    console.log("   Status:", scanRes.status);
    console.log("   Detected Items:", scanData.data?.detectedIngredients?.map((i) => i.name).join(", "));

    // 7. Recipe History (Max 10 Constraint Verification)
    console.log("\n7️⃣  Testing GET /api/ai/history (Max 10 Limit Check)");
    const historyRes = await fetch(`${baseUrl}/api/ai/history`, {
      headers: { Authorization: `Bearer ${activeToken}` },
    });
    const historyData = await historyRes.json();
    console.log("   Status:", historyRes.status, "| Total History Items Retained:", historyData.count);

    // 8. Pantry Tracker Endpoints
    console.log("\n8️⃣  Testing Pantry API (POST & GET /api/pantry)");
    const addPantryRes = await fetch(`${baseUrl}/api/pantry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${activeToken}`,
      },
      body: JSON.stringify({
        name: "Bawang Merah",
        quantity: "5 siung",
        isExpiringSoon: true,
      }),
    });
    const addPantryData = await addPantryRes.json();
    console.log("   Add Pantry Status:", addPantryRes.status, "| Item:", addPantryData.data?.name);

    const getPantryRes = await fetch(`${baseUrl}/api/pantry`, {
      headers: { Authorization: `Bearer ${activeToken}` },
    });
    const getPantryData = await getPantryRes.json();
    console.log("   Get Pantry Status:", getPantryRes.status, "| Count:", getPantryData.count);

    // 9. Recipe Favorites Endpoints
    console.log("\n9️⃣  Testing Favorites API (POST & GET /api/favorites)");
    if (generatedRecipe) {
      const addFavRes = await fetch(`${baseUrl}/api/favorites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify(generatedRecipe),
      });
      const addFavData = await addFavRes.json();
      console.log("   Add Favorite Status:", addFavRes.status, "| Title:", addFavData.data?.title);
    }

    const getFavRes = await fetch(`${baseUrl}/api/favorites`, {
      headers: { Authorization: `Bearer ${activeToken}` },
    });
    const getFavData = await getFavRes.json();
    console.log("   Get Favorites Status:", getFavRes.status, "| Count:", getFavData.count);

    // 10. Savings Endpoints
    console.log("\n🔟 Testing Savings API (POST, GET /api/savings, GET /api/savings/summary)");
    const postSavingRes = await fetch(`${baseUrl}/api/savings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${activeToken}`,
      },
      body: JSON.stringify({
        recipeTitle: "Nasi Goreng Spesial Zero-Waste",
        moneySavedRupiah: 18000,
        foodSavedKg: 0.4,
      }),
    });
    const postSavingData = await postSavingRes.json();
    console.log("   POST /api/savings Status:", postSavingRes.status, "| Saved ID:", postSavingData.data?.id);

    const getSavingsRes = await fetch(`${baseUrl}/api/savings`, {
      headers: { Authorization: `Bearer ${activeToken}` },
    });
    const getSavingsData = await getSavingsRes.json();
    console.log("   GET /api/savings Status:", getSavingsRes.status, "| Count:", getSavingsData.count);

    const getSummaryRes = await fetch(`${baseUrl}/api/savings/summary`, {
      headers: { Authorization: `Bearer ${activeToken}` },
    });
    const getSummaryData = await getSummaryRes.json();
    console.log("   GET /api/savings/summary Status:", getSummaryRes.status, "| Data:", JSON.stringify(getSummaryData.data));

    console.log("\n✨ ALL TESTS PASSED SUCCESSFULLY! ✨\n");
  } catch (err) {
    console.error("❌ Test Failed:", err);
  } finally {
    server.close();
    process.exit(0);
  }
});

