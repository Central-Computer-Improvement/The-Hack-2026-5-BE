# 🚀 Smart Recipe AI - Frontend Integration & API Guide

Panduan ini dibuat untuk membantu tim **Frontend (React / Next.js / Flutter / Mobile App)** dalam mengintegrasikan API backend **Smart Recipe AI (Zero-Waste Kitchen)**.

---

## 📌 Base URL & Dokumentasi Interaktif

- **Base URL Backend**: `http://localhost:5000`
- **Swagger UI Interactive Docs**: **`http://localhost:5000/api-docs`**  
  *(Semua endpoint, request body, dan response dapat diuji langsung melalui Swagger UI)*.

---

## 🔑 Autentikasi (JWT Bearer Token)

Sebagian besar endpoint memerlukan autentikasi. Setelah user **Login** atau **Register**, backend akan mengembalikan `token` (JWT).

**Cara mengirimkan Token di Header HTTP:**
```http
Authorization: Bearer <token_jwt_user>
Content-Type: application/json
```

---

## ⚙️ Cara Mendapatkan Gemini API Key Sendiri (Gratis)

Agar kuota API Key tidak bentrok antar developer, setiap developer dapat menggunakan API Key Gemini gratis mereka masing-masing:

1. Buka Google AI Studio: **[https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)**
2. Login menggunakan akun Google Anda.
3. Klik tombol **"Create API Key"** (Buat Kunci API).
4. Salin kunci API yang dihasilkan.
5. Buka file `.env` di projek backend Anda, dan ganti nilainya:
   ```env
   GEMINI_API_KEY=AIzaSyYourOwnApiKeyHere...
   ```

---

## 🌐 Ringkasan Endpoint API

### 1. Authentication (`/api/auth`)

#### 🔹 `POST /api/auth/register` (Public)
Mendaftarkan akun user baru.
- **Request Body**:
  ```json
  {
    "name": "Anak Kos Test",
    "email": "anakkos@example.com",
    "password": "password123"
  }
  ```
- **Response Success (201)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "user": { "id": "uuid...", "name": "Anak Kos Test", "email": "anakkos@example.com" },
      "token": "eyJhbGciOi..."
    }
  }
  ```

#### 🔹 `POST /api/auth/login` (Public)
Login user ke aplikasi.
- **Request Body**:
  ```json
  {
    "email": "anakkos@example.com",
    "password": "password123"
  }
  ```
- **Response Success (200)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": { "id": "uuid...", "name": "Anak Kos Test", "email": "anakkos@example.com" },
      "token": "eyJhbGciOi..."
    }
  }
  ```

#### 🔹 `GET /api/auth/me` (Protected)
Mengambil profil user yang sedang login.
- **Headers**: `Authorization: Bearer <token>`
- **Response Success (200)**:
  ```json
  {
    "success": true,
    "data": {
      "user": { "id": "uuid...", "name": "Anak Kos Test", "email": "anakkos@example.com" }
    }
  }
  ```

---

### 2. AI Kitchen & Recipe Generator (`/api/ai`)

#### 🔹 `POST /api/ai/generate-recipes` (Optional Auth)
Menghasilkan 3+ opsi resep masakan berbasis stok bahan pengguna via Gemini 2.5 Flash AI.
- **Headers**: `Authorization: Bearer <token>` *(opsional, digunakan untuk mencatat riwayat)*
- **Request Body**:
  ```json
  {
    "ingredients": [
      { "name": "Telur", "quantity": "2 butir", "isExpiringSoon": true },
      { "name": "Nasi Putih Sisa", "quantity": "1 piring", "isExpiringSoon": true },
      { "name": "Kecap Manis", "quantity": "secukupnya" }
    ],
    "kitchenFilters": {
      "tools": ["Kompor", "Rice Cooker"],
      "maxDurationMinutes": 15
    }
  }
  ```
- **Response Success (200)**:
  ```json
  {
    "success": true,
    "data": {
      "recipes": [
        {
          "id": "recipe-1",
          "title": "Nasi Goreng Spesial Zero-Waste",
          "description": "Resep cepat hemat memanfaatkan Nasi Putih Sisa & Telur.",
          "prepTimeMinutes": 12,
          "cookingTools": ["Kompor"],
          "usedIngredients": ["Nasi Putih Sisa", "Telur", "Kecap Manis"],
          "missingIngredients": [
            { "name": "Garam & Merica", "suggestion": "Gunakan bumbu penyedap instan bungkus" }
          ],
          "estimatedSavings": {
            "moneySavedRupiah": 18000,
            "foodSavedKg": 0.4
          },
          "steps": [
            "Panaskan kompor.",
            "Tumis telur dan nasi sisa hingga harum.",
            "Tambahkan kecap manis dan sajikan hangat."
          ]
        }
      ]
    }
  }
  ```

#### 🔹 `POST /api/ai/scan-pantry` (Public)
Mendeteksi bahan makanan secara otomatis dari foto kulkas/meja dapur (Gemini Multimodal Vision).
- **Request Body (Bisa kirim Base64 ATAU URL Gambar)**:
  - *Option A (Base64)*:
    ```json
    {
      "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    }
    ```
  - *Option B (Image URL)*:
    ```json
    {
      "imageUrl": "https://images.unsplash.com/photo-1540420773420-3366772f4999"
    }
    ```
- **Response Success (200)**:
  ```json
  {
    "success": true,
    "data": {
      "detectedIngredients": [
        { "name": "Telur Ayam", "estimatedQuantity": "4 butir", "confidence": 0.95 },
        { "name": "Tomat", "estimatedQuantity": "2 buah", "confidence": 0.91 }
      ]
    }
  }
  ```

#### 🔹 `GET /api/ai/history` (Protected)
Mengambil riwayat resep yang pernah dihasilkan AI (**Maksimal 10 riwayat terbaru**).
- **Headers**: `Authorization: Bearer <token>`
- **Response Success (200)**:
  ```json
  {
    "success": true,
    "count": 3,
    "data": {
      "history": [ /* Array resep riwayat */ ]
    }
  }
  ```

---

### 3. Manual Pantry Tracker (`/api/pantry`)

- `GET /api/pantry` -> Ambil seluruh stok bahan makanan user.
- `POST /api/pantry` -> Tambah stok bahan baru:
  ```json
  {
    "name": "Bawang Merah",
    "quantity": "5 siung",
    "category": "Bumbu",
    "isExpiringSoon": true
  }
  ```
- `PUT /api/pantry/:id` -> Edit stok bahan.
- `DELETE /api/pantry/:id` -> Hapus bahan.

---

### 4. Favorites Recipes (`/api/favorites`)

- `GET /api/favorites` -> Ambil seluruh resep favorit tersimpan.
- `POST /api/favorites` -> Simpan resep ke favorit (Kirimkan objek resep dari AI).
- `DELETE /api/favorites/:id` -> Hapus resep dari favorit.

---

### 5. Savings & Zero-Waste Impact Tracker (`/api/savings`)

Fitur ini digunakan untuk mencatat dan melacak dampak penghematan uang (Rupiah) dan makanan yang diselamatkan (Kg) ketika pengguna telah **menyelesaikan memasak suatu resep**.

#### 🔹 `POST /api/savings` (Protected)
Menyimpan riwayat penghematan ketika pengguna selesai memasak (`Finish Recipe`).
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "recipeTitle": "Nasi Goreng Spesial Zero-Waste",
    "moneySavedRupiah": 18000,
    "foodSavedKg": 0.4
  }
  ```
- **Response Success (201)**:
  ```json
  {
    "success": true,
    "message": "Saving record created successfully",
    "data": {
      "id": "40ce7b38-e5d0-465b-8b4c-9e453474ae13",
      "userId": "d748f219-c782-4f36-a364-e4cfa2281861",
      "recipeTitle": "Nasi Goreng Spesial Zero-Waste",
      "moneySavedRupiah": 18000,
      "foodSavedKg": 0.4,
      "createdAt": "2026-08-28T11:03:33.456Z"
    }
  }
  ```

#### 🔹 `GET /api/savings` (Protected)
Mengambil daftar riwayat seluruh resep yang pernah diselesaikan dan disimpan oleh pengguna (diurutkan dari yang terbaru).
- **Headers**: `Authorization: Bearer <token>`
- **Response Success (200)**:
  ```json
  {
    "success": true,
    "count": 1,
    "data": {
      "savings": [
        {
          "id": "40ce7b38-e5d0-465b-8b4c-9e453474ae13",
          "userId": "d748f219-c782-4f36-a364-e4cfa2281861",
          "recipeTitle": "Nasi Goreng Spesial Zero-Waste",
          "moneySavedRupiah": 18000,
          "foodSavedKg": 0.4,
          "createdAt": "2026-08-28T11:03:33.456Z"
        }
      ]
    }
  }
  ```

#### 🔹 `GET /api/savings/summary` (Protected)
Mengambil ringkasan metrik akumulasi total penghematan serta perbandingan bulan ini vs bulan lalu untuk **Savings Dashboard**.
- **Headers**: `Authorization: Bearer <token>`
- **Response Success (200)**:
  ```json
  {
    "success": true,
    "data": {
      "totalMoneySaved": 18000,
      "totalFoodSaved": 0.4,
      "thisMonth": 18000,
      "lastMonth": 0,
      "growthPercentage": 0
    }
  }
  ```
  *(Catatan: Jika `lastMonth` bernilai `0`, `growthPercentage` aman bernilai `0` tanpa menyebabkan `Infinity`/`NaN`)*.

---

## 🔄 Alur Integrasi Frontend untuk Fitur Savings (End-to-End Flow)

Berikut adalah panduan alur kerja (*flow*) implementasi di sisi Frontend:

```text
[1. Generate Recipe]
      │
      ▼ (POST /api/ai/generate-recipes)
      │ Respon resep memiliki:
      │ - recipe.title
      │ - recipe.estimatedSavings.moneySavedRupiah
      │ - recipe.estimatedSavings.foodSavedKg
      │ - recipe.steps
      ▼
[2. Recipe Detail Page]
      │ User melihat bahan, alat, dan badge Zero-Waste Impact
      │ Tombol: [ 🍳 Start Cooking ]
      ▼
[3. Cooking Mode (Step-by-Step)]
      │ User menjalankan panduan memasak langkah per langkah (Step 1, 2, ..., N)
      ▼
[4. Selesaikan Memasak (Finish Recipe)]
      │ Di langkah terakhir (currentStep === steps.length - 1), tampilkan tombol:
      │ [ ✅ Selesai Memasak & Simpan ke Dashboard ]
      ▼
[5. Panggil API Simpan (POST /api/savings)]
      │ Frontend mengirim payload:
      │ {
      │   recipeTitle: recipe.title,
      │   moneySavedRupiah: recipe.estimatedSavings.moneySavedRupiah,
      │   foodSavedKg: recipe.estimatedSavings.foodSavedKg
      │ }
      ▼
[6. Arahkan ke Savings Dashboard (/savings)]
      │ Frontend memanggil:
      │ - GET /api/savings/summary -> Tampilkan kartu total Rp, total Kg, & growth %
      │ - GET /api/savings         -> Tampilkan list riwayat resep yang telah dimasak
```

### 💡 Contoh Kode Panggilan API di Komponen `CookingMode.tsx`:

```tsx
// Fungsi yang dipanggil saat user menekan "Finish Recipe" pada step terakhir
const handleFinishCooking = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("http://localhost:5000/api/savings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recipeTitle: recipe.title,
        moneySavedRupiah: recipe.estimatedSavings?.moneySavedRupiah || 0,
        foodSavedKg: recipe.estimatedSavings?.foodSavedKg || 0,
      }),
    });

    const result = await response.json();
    if (result.success) {
      alert("Selamat! Penghematan Anda berhasil disimpan.");
      // Redirect ke halaman Savings Dashboard
      router.push("/savings");
    }
  } catch (error) {
    console.error("Gagal menyimpan saving:", error);
  }
};
```

---

## 🛠️ Catatan untuk Tim Frontend

1. **Stok Pantry**: Tidak ada pemotongan stok otomatis saat mencari resep. Pengguna bebas memasukkan bahan atau menggunakan tombol scan vision.
2. **Pencatatan Savings**: Nilai penghematan hanya dicatat ketika pengguna menekan tombol selesai memasak di Cooking Mode (`POST /api/savings`), bukan saat resep di-generate pertama kali.
3. **Coba via Swagger**: Tim frontend sangat disarankan mencoba semua endpoint secara visual di `http://localhost:5000/api-docs` sebelum mengintegrasikan ke komponen UI.
