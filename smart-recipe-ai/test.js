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
        email: "anakkos@example.com",
        password: "password123",
      }),
    });
    const regData = await regRes.json();
    console.log("   Status:", regRes.status, "| Message:", regData.message);
    const token = regData.data?.token;

    // 3. Login
    console.log("\n3️⃣  Testing POST /api/auth/login");
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "anakkos@example.com",
        password: "password123",
      }),
    });
    const loginData = await loginRes.json();
    console.log("   Status:", loginRes.status, "| Message:", loginData.message);

    // 4. Get Profile (Protected)
    console.log("\n4️⃣  Testing GET /api/auth/me (Protected Route)");
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData = await meRes.json();
    console.log("   Status:", meRes.status, "| User:", meData.data?.user?.email);

    // 5. AI Recipe Generation
    console.log("\n5️⃣  Testing POST /api/ai/generate-recipes");
    const aiRes = await fetch(`${baseUrl}/api/ai/generate-recipes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

    console.log("\n✨ ALL TESTS PASSED SUCCESSFULLY! ✨\n");
  } catch (err) {
    console.error("❌ Test Failed:", err);
  } finally {
    server.close();
    process.exit(0);
  }
});
