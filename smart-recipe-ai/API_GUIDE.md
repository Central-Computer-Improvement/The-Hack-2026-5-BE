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

## 🛠️ Catatan untuk Tim Frontend

1. **Stok Pantry**: Tidak ada pemotongan stok otomatis saat mencari resep. Pengguna bebas memasukkan bahan atau menggunakan tombol scan vision.
2. **Coba via Swagger**: Tim frontend sangat disarankan mencoba semua endpoint secara visual di `http://localhost:5000/api-docs` sebelum mengintegrasikan ke komponen UI.
