# AI Recipe Generator --- Frontend UI & Field Mapping

Dokumen ini adalah referensi implementasi frontend untuk menampilkan
hasil AI Recipe Generator berdasarkan response JSON yang saat ini
digunakan.

> **Catatan:** Struktur ini sengaja mengikuti response backend yang
> sudah ada agar tidak perlu mengubah API lagi menjelang deadline.

------------------------------------------------------------------------

## 1. Response Utama

Frontend menerima response dengan struktur:

``` json
{
  "success": true,
  "data": {
    "recipes": []
  }
}
```

### Field utama

  Field            Type        Digunakan untuk
  ---------------- ----------- ----------------------------------------
  `success`        `boolean`   Menentukan request berhasil atau tidak
  `data`           `object`    Container hasil AI
  `data.recipes`   `array`     Daftar recipe hasil generate

Contoh akses:

``` js
const recipes = response.data.recipes;
```

------------------------------------------------------------------------

# 2. Halaman Recipe Results

## Tujuan

Menampilkan beberapa recipe hasil generate dalam bentuk card.

### Wireframe

``` text
┌──────────────────────────────────────────────────────────┐
│ ← Back                                                   │
│                                                          │
│ Your AI Recipe Suggestions                               │
│ Recipes created from the ingredients in your pantry.     │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Ikan Pan-Seared dengan Kentang Tumbuk               │ │
│ │ & Tumis Bayam Lemon-Bawang Putih                    │ │
│ │                                                      │ │
│ │ Hidangan utama yang cepat dan bergizi...             │ │
│ │                                                      │ │
│ │ ⏱ 40 min     🔥 Kompor     🍳 Wajan     🍲 Panci    │ │
│ │                                                      │ │
│ │ Used Ingredients                                     │ │
│ │ [Fish] [Red potatoes] [Yams] [Spinach leaves]       │ │
│ │                                                      │ │
│ │ ┌────────────────┐  ┌─────────────────────────────┐ │ │
│ │ │ 💰 Rp35.000     │  │ ♻ 0.7 kg food saved        │ │ │
│ │ └────────────────┘  └─────────────────────────────┘ │ │
│ │                                                      │ │
│ │                         [ View Recipe → ]            │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Recipe 2 ...                                          │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ Recipe 3 ...                                          │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 3. Recipe Card

## Field yang digunakan

  UI Element      Variable                                     Contoh
  --------------- -------------------------------------------- ----------------------------
  Recipe title    `recipe.title`                               `"Ikan Pan-Seared..."`
  Description     `recipe.description`                         `"Hidangan utama..."`
  Total time      `recipe.totalTimeMinutes`                    `40`
  Cooking tools   `recipe.cookingTools`                        `["Kompor", "Wajan"]`
  Ingredients     `recipe.usedIngredients`                     `["Fish", "Red potatoes"]`
  Money saved     `recipe.estimatedSavings.moneySavedRupiah`   `35000`
  Food saved      `recipe.estimatedSavings.foodSavedKg`        `0.7`
  Detail action   `recipe.id`                                  `"recipe-1"`

### JSX Example

``` jsx
{recipes.map((recipe) => (
  <RecipeCard
    key={recipe.id}
    recipe={recipe}
  />
))}
```

Di dalam `RecipeCard`:

``` jsx
<h2>{recipe.title}</h2>

<p>{recipe.description}</p>

<div>
  <span>⏱ {recipe.totalTimeMinutes} min</span>

  <span>
    🛠 {recipe.cookingTools.join(", ")}
  </span>
</div>

<div>
  {recipe.usedIngredients.map((ingredient) => (
    <Badge key={ingredient}>
      {ingredient}
    </Badge>
  ))}
</div>

<div>
  <span>
    💰 Rp{recipe.estimatedSavings.moneySavedRupiah.toLocaleString("id-ID")}
  </span>

  <span>
    ♻ {recipe.estimatedSavings.foodSavedKg} kg saved
  </span>
</div>

<Button>
  View Recipe
</Button>
```

------------------------------------------------------------------------

# 4. Recipe Detail Page

Ketika user menekan `View Recipe`, frontend dapat menggunakan:

``` js
recipe.id
```

untuk menentukan recipe yang dipilih.

### Wireframe

``` text
┌──────────────────────────────────────────────────────────┐
│ ← Back to Recipes                                        │
│                                                          │
│ Ikan Pan-Seared dengan Kentang Tumbuk                    │
│ & Tumis Bayam Lemon-Bawang Putih                         │
│                                                          │
│ Hidangan utama yang cepat dan bergizi...                 │
│                                                          │
│ ┌────────────┐ ┌────────────┐ ┌────────────────────────┐ │
│ │ ⏱ 10 min   │ │ 🔥 30 min  │ │ ⏱ Total 40 min         │ │
│ │ Preparation │ │ Cooking    │ │                        │ │
│ └────────────┘ └────────────┘ └────────────────────────┘ │
│                                                          │
│ Cooking Tools                                            │
│ [Kompor] [Wajan] [Panci]                                │
│                                                          │
│ ──────────────────────────────────────────────────────── │
│                                                          │
│ Ingredients                                             │
│                                                          │
│ ✓ Fish                                                   │
│ ✓ Red potatoes                                           │
│ ✓ Yams                                                   │
│ ✓ Spinach leaves                                         │
│ ✓ Watercress                                             │
│ ✓ Green sprouts                                          │
│ ✓ Lemon                                                  │
│ ✓ Garlic                                                 │
│                                                          │
│ ──────────────────────────────────────────────────────── │
│                                                          │
│ Additional Ingredients                                   │
│                                                          │
│ ⚠ Cooking oil                                            │
│   Minyak sayur atau minyak zaitun.                       │
│                                                          │
│ ⚠ Salt                                                   │
│   Garam dapur atau garam laut.                           │
│                                                          │
│ ──────────────────────────────────────────────────────── │
│                                                          │
│ How to Cook                                              │
│                                                          │
│ ①  Persiapan Kentang                                    │
│     Kupas red potatoes dan yams...                       │
│     ⏱ 20 menit                                          │
│                                                          │
│ ②  Persiapan Ikan & Bumbu                               │
│     Bersihkan ikan...                                    │
│     ⏱ 5 menit                                           │
│                                                          │
│ ③  Memasak Ikan                                          │
│     Panaskan wajan...                                    │
│     ⏱ 7 menit                                           │
│                                                          │
│ ④  Menumis Sayuran                                      │
│     Gunakan wajan yang sama...                           │
│     ⏱ 5 menit                                           │
│                                                          │
│ ⑤  Penyelesaian                                         │
│     Sajikan ikan...                                      │
│     ⏱ 3 menit                                           │
│                                                          │
│ ──────────────────────────────────────────────────────── │
│                                                          │
│ ♻ Zero-Waste Impact                                     │
│                                                          │
│       💰 Rp35.000 saved                                  │
│       ♻ 0.7 kg food saved                                │
│                                                          │
│                  [ 🍳 Start Cooking ]                    │
└──────────────────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 5. Recipe Header

## Field

``` js
recipe.title
recipe.description
recipe.prepTimeMinutes
recipe.cookingTimeMinutes
recipe.totalTimeMinutes
```

### Example

``` jsx
<section>
  <h1>{recipe.title}</h1>

  <p>{recipe.description}</p>

  <div className="flex gap-3">
    <Badge>
      ⏱ Prep {recipe.prepTimeMinutes} min
    </Badge>

    <Badge>
      🔥 Cooking {recipe.cookingTimeMinutes} min
    </Badge>

    <Badge>
      ⏱ Total {recipe.totalTimeMinutes} min
    </Badge>
  </div>
</section>
```

------------------------------------------------------------------------

# 6. Cooking Tools

## Field

``` js
recipe.cookingTools
```

Type:

``` ts
string[]
```

Example:

``` json
[
  "Kompor",
  "Wajan",
  "Panci"
]
```

### UI

``` text
Cooking Tools

[ 🔥 Kompor ]
[ 🍳 Wajan ]
[ 🍲 Panci ]
```

### JSX

``` jsx
<div className="flex flex-wrap gap-2">
  {recipe.cookingTools.map((tool) => (
    <Badge key={tool}>
      {tool}
    </Badge>
  ))}
</div>
```

### Empty State

Beberapa recipe seperti salad buah memiliki:

``` json
"cookingTools": []
```

Frontend sebaiknya tidak menampilkan section kosong.

``` jsx
{recipe.cookingTools?.length > 0 && (
  <section>
    <h2>Cooking Tools</h2>

    {recipe.cookingTools.map((tool) => (
      <Badge key={tool}>{tool}</Badge>
    ))}
  </section>
)}
```

------------------------------------------------------------------------

# 7. Used Ingredients

## Field

``` js
recipe.usedIngredients
```

Type:

``` ts
string[]
```

Contoh:

``` json
[
  "Fish",
  "Red potatoes",
  "Yams",
  "Spinach leaves"
]
```

### UI

Gunakan badge/chip dengan style positif:

``` text
Ingredients

[ ✓ Fish ]
[ ✓ Red potatoes ]
[ ✓ Yams ]
[ ✓ Spinach leaves ]
[ ✓ Watercress ]
[ ✓ Green sprouts ]
```

### JSX

``` jsx
<div className="flex flex-wrap gap-2">
  {recipe.usedIngredients.map((ingredient) => (
    <Badge key={ingredient}>
      ✓ {ingredient}
    </Badge>
  ))}
</div>
```

------------------------------------------------------------------------

# 8. Missing Ingredients

## Field

``` js
recipe.missingIngredients
```

Type:

``` ts
{
  name: string;
  suggestion: string;
}[]
```

Contoh:

``` json
[
  {
    "name": "Cooking oil",
    "suggestion": "Minyak sayur atau minyak zaitun."
  },
  {
    "name": "Salt",
    "suggestion": "Garam dapur atau garam laut."
  }
]
```

### UI

Gunakan card/warning yang berbeda dari used ingredients.

``` text
Additional Ingredients

┌───────────────────────────────────────────┐
│ ⚠ Cooking oil                             │
│   Minyak sayur atau minyak zaitun.        │
└───────────────────────────────────────────┘

┌───────────────────────────────────────────┐
│ ⚠ Salt                                    │
│   Garam dapur atau garam laut.             │
└───────────────────────────────────────────┘
```

### JSX

``` jsx
{recipe.missingIngredients?.length > 0 && (
  <section>
    <h2>Additional Ingredients</h2>

    <div className="space-y-3">
      {recipe.missingIngredients.map((ingredient) => (
        <div key={ingredient.name}>
          <h3>⚠ {ingredient.name}</h3>
          <p>{ingredient.suggestion}</p>
        </div>
      ))}
    </div>
  </section>
)}
```

------------------------------------------------------------------------

# 9. Recipe Steps

Ini adalah bagian utama dari Recipe Detail.

## Field

``` js
recipe.steps
```

Setiap item memiliki:

``` js
step.step
step.action
step.instruction
step.durationMinutes
```

### TypeScript Interface

``` ts
interface RecipeStep {
  step: number;
  action: string;
  instruction: string;
  durationMinutes: number;
}
```

### Example

``` json
{
  "step": 3,
  "action": "Memasak Ikan",
  "instruction": "Panaskan wajan dengan sedikit cooking oil. Masukkan ikan...",
  "durationMinutes": 7
}
```

------------------------------------------------------------------------

# 10. Step UI --- Timeline

Recommended UI:

``` text
●
│
├── 01  Persiapan Kentang
│
│   Kupas red potatoes dan yams...
│
│   ⏱ 20 menit
│
●
│
├── 02  Persiapan Ikan & Bumbu
│
│   Bersihkan ikan...
│
│   ⏱ 5 menit
│
●
│
├── 03  Memasak Ikan
│
│   Panaskan wajan...
│
│   ⏱ 7 menit
│
●
```

### JSX

``` jsx
<div className="space-y-6">
  {recipe.steps.map((step, index) => (
    <div
      key={step.step}
      className="flex gap-4"
    >
      <div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full">
          {step.step}
        </div>
      </div>

      <div className="flex-1">
        <h3>{step.action}</h3>

        <p>{step.instruction}</p>

        <span>
          ⏱ {step.durationMinutes} menit
        </span>
      </div>
    </div>
  ))}
</div>
```

------------------------------------------------------------------------

# 11. Zero-Waste Impact

## Fields

``` js
recipe.estimatedSavings.moneySavedRupiah
recipe.estimatedSavings.foodSavedKg
```

Type:

``` ts
interface EstimatedSavings {
  moneySavedRupiah: number;
  foodSavedKg: number;
}
```

### UI

``` text
┌─────────────────────────────────────────────────┐
│ ♻ Zero-Waste Impact                             │
│                                                 │
│  💰                     ♻                       │
│  Rp35.000               0.7 kg                  │
│  Estimated savings      Food saved              │
└─────────────────────────────────────────────────┘
```

### JSX

``` jsx
<div>
  <div>
    <span>💰</span>

    <strong>
      Rp
      {recipe.estimatedSavings.moneySavedRupiah
        .toLocaleString("id-ID")}
    </strong>

    <span>Estimated savings</span>
  </div>

  <div>
    <span>♻</span>

    <strong>
      {recipe.estimatedSavings.foodSavedKg} kg
    </strong>

    <span>Food saved</span>
  </div>
</div>
```

------------------------------------------------------------------------

# 12. Start Cooking / Cooking Mode

Fitur ini optional untuk deadline.

Button:

``` text
[ 🍳 Start Cooking ]
```

Saat diklik, frontend menyimpan:

``` js
const [currentStep, setCurrentStep] = useState(0);
```

Ambil step:

``` js
const currentRecipeStep = recipe.steps[currentStep];
```

### UI

``` text
┌─────────────────────────────────────────────┐
│              COOKING MODE                   │
│                                             │
│                 Step 3 / 5                  │
│                                             │
│              Memasak Ikan                   │
│                                             │
│ Panaskan wajan dengan sedikit cooking oil.  │
│ Masukkan ikan, masak masing-masing sisi... │
│                                             │
│                 ⏱ 7 menit                   │
│                                             │
│       [ ← Previous ] [ Next → ]             │
└─────────────────────────────────────────────┘
```

### Logic

``` jsx
const nextStep = () => {
  if (currentStep < recipe.steps.length - 1) {
    setCurrentStep((prev) => prev + 1);
  }
};

const previousStep = () => {
  if (currentStep > 0) {
    setCurrentStep((prev) => prev - 1);
  }
};
```

------------------------------------------------------------------------

# 13. Recommended Component Structure

Untuk Next.js + React:

``` text
components/
└── recipe/
    ├── RecipeCard.tsx
    ├── RecipeHeader.tsx
    ├── RecipeIngredients.tsx
    ├── RecipeMissingIngredients.tsx
    ├── RecipeTools.tsx
    ├── RecipeSteps.tsx
    ├── RecipeStep.tsx
    ├── RecipeSavings.tsx
    └── CookingMode.tsx
```

Halaman:

``` text
app/
└── recipes/
    ├── page.tsx
    └── [id]/
        └── page.tsx
```

------------------------------------------------------------------------

# 14. Recommended TypeScript Interface

Sangat disarankan membuat satu interface agar frontend mudah mengolah
response.

``` ts
export interface MissingIngredient {
  name: string;
  suggestion: string;
}

export interface RecipeStep {
  step: number;
  action: string;
  instruction: string;
  durationMinutes: number;
}

export interface EstimatedSavings {
  moneySavedRupiah: number;
  foodSavedKg: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;

  prepTimeMinutes: number;
  cookingTimeMinutes: number;
  totalTimeMinutes: number;

  cookingTools: string[];

  usedIngredients: string[];

  missingIngredients: MissingIngredient[];

  estimatedSavings: EstimatedSavings;

  steps: RecipeStep[];
}
```

Response:

``` ts
export interface RecipeResponse {
  success: boolean;
  data: {
    recipes: Recipe[];
  };
}
```

------------------------------------------------------------------------

# 15. Field Mapping --- Quick Reference

  ----------------------------------------------------------------------------------------------------------
  Backend Field                         Frontend Variable                            UI
  ------------------------------------- -------------------------------------------- -----------------------
  `id`                                  `recipe.id`                                  React key / detail
                                                                                     route

  `title`                               `recipe.title`                               Recipe title

  `description`                         `recipe.description`                         Description

  `prepTimeMinutes`                     `recipe.prepTimeMinutes`                     Preparation time

  `cookingTimeMinutes`                  `recipe.cookingTimeMinutes`                  Cooking time

  `totalTimeMinutes`                    `recipe.totalTimeMinutes`                    Total time

  `cookingTools`                        `recipe.cookingTools`                        Tool badges

  `usedIngredients`                     `recipe.usedIngredients`                     Available ingredient
                                                                                     badges

  `missingIngredients`                  `recipe.missingIngredients`                  Additional ingredient
                                                                                     cards

  `estimatedSavings.moneySavedRupiah`   `recipe.estimatedSavings.moneySavedRupiah`   Money saved

  `estimatedSavings.foodSavedKg`        `recipe.estimatedSavings.foodSavedKg`        Food saved

  `steps`                               `recipe.steps`                               Cooking timeline

  `steps[].step`                        `step.step`                                  Step number

  `steps[].action`                      `step.action`                                Step title

  `steps[].instruction`                 `step.instruction`                           Cooking instruction

  `steps[].durationMinutes`             `step.durationMinutes`                       Step duration
  ----------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------

# 16. Recommended Page Flow

``` text
Generate Recipe
      │
      ▼
┌──────────────────────┐
│ Recipe Results       │
│                      │
│ Recipe Card 1        │
│ Recipe Card 2        │
│ Recipe Card 3        │
└──────────┬───────────┘
           │
           │ View Recipe
           ▼
┌──────────────────────┐
│ Recipe Detail        │
│                      │
│ Header               │
│ ├── Title            │
│ ├── Description      │
│ └── Time             │
│                      │
│ Cooking Tools        │
│                      │
│ Used Ingredients     │
│                      │
│ Missing Ingredients  │
│                      │
│ Cooking Steps        │
│ ├── Step 1           │
│ ├── Step 2           │
│ ├── Step 3           │
│ └── ...              │
│                      │
│ Zero-Waste Impact    │
│                      │
│ [ Start Cooking ]    │
└──────────────────────┘
```

------------------------------------------------------------------------

# 17. MVP Priority untuk Deadline

Jika waktu sangat terbatas, implementasikan dalam urutan berikut:

### Priority 1 --- Wajib

-   Recipe Results
-   Recipe Card
-   Recipe Detail
-   Used Ingredients
-   Missing Ingredients
-   Recipe Steps
-   Estimated Savings

### Priority 2 --- Jika masih ada waktu

-   Cooking Tools
-   Preparation/Cooking/Total Time
-   Responsive mobile UI
-   Empty states

### Priority 3 --- Optional

-   Cooking Mode
-   Step navigation
-   Timer
-   Favorite recipe
-   Share recipe

------------------------------------------------------------------------

# 18. Important Frontend Rule

Jangan membuat data recipe baru di frontend.

Gunakan langsung data dari AI:

``` js
recipe.title
recipe.description
recipe.steps
recipe.usedIngredients
recipe.missingIngredients
recipe.estimatedSavings
```

Hindari membuat instruction seperti:

``` js
`Masak ${ingredients.join(", ")}`
```

Frontend hanya bertugas **menampilkan hasil AI**, sedangkan logic recipe
dan instruction berasal dari backend/Gemini.

Dengan begitu:

``` text
Gemini AI
    ↓
Backend
    ↓
JSON Response
    ↓
Frontend
    ↓
Recipe UI
```

Frontend tidak perlu menebak atau membuat ulang isi recipe.
