# ⚡ Kilowatt PIM — Product Information Management

> **Enterprise-grade Product Information Management (PIM) and Catalog Intelligence platform for WooCommerce, powered by Google Gemini AI.**

---

## 📖 Overview

**Kilowatt PIM** transforms WooCommerce product operations into a centralized, intelligent single source of truth. Instead of managing complex eCommerce catalogs across scattered spreadsheets or sluggish store backends, Kilowatt PIM provides instant catalog search, deep attribute governance, automated data quality scoring, bi-directional store synchronization, and **native AI product copywriting** powered by Google Gemini.

Built strictly with **React 18, TypeScript, Node.js/Express, SQLite**, and a custom dark-mode design system following the [DESIGN.md](DESIGN.md) specification.

---

## ✨ Key Features

### 1. 📦 Master Product Catalog & Specifications
- **Instant Multi-Facet Search & Filtering:** Filter products by categories, stock status, product type (`simple`, `variable`, `grouped`, `external`), publish status, and price range.
- **Interactive Specifications Drawer:** Slide-out inspection drawer displaying high-resolution media galleries, SKUs, weight, dimensions, custom attributes, variations, and direct WooCommerce store links.
- **Real-Time Catalog Metrics:** Live statistics for total SKUs, active listings, unmanaged stock, and variation counts.

### 2. 🤖 Google Gemini AI Product Description Generator
- **Multi-Tone Copywriting:** Choose between **Marketing** (high conversion & energy), **Professional** (authoritative & formal), **SEO Optimized** (keyword-dense for Google rankings), or **Casual & Friendly** (approachable & conversational).
- **Automated Generation in Under 3 Seconds:** Powered by `gemini-3.5-flash-lite` with automatic fallback to `gemini-2.5-flash`.
- **Structured Output Deliverables:**
  - 📝 **Short Excerpt:** 1–2 sentence compelling summary for product cards.
  - 📄 **Long Description:** 2–3 structured, benefits-driven paragraphs.
  - 🔍 **SEO Page Title:** Optimized under 60 characters for search engines.
  - 🏷️ **Target Keywords:** 5 hyper-relevant eCommerce search tags.
- **One-Click Clipboard Copy:** Instant one-click copy with visual status feedback.
- **One-Click Quick Action:** Accessible directly from table rows (`✨ AI`) or within the specifications drawer (`✨ AI Describe`).

### 3. 📊 Catalog Data Quality & Completeness Scoring
- **Automated Health Engine:** Calculates real-time catalog quality scores (0–100%).
- **Gap Detection:** Automatically detects:
  - Products missing SKUs
  - Unpriced or zero-dollar products
  - Products without descriptions or short excerpts
  - Products missing gallery images
  - Uncategorized products
- **Actionable Remediation:** Direct shortcuts from quality reports to edit or AI-enrich incomplete products.

### 4. 📉 Inventory Health & Stock Depletion Monitoring
- **Stock Depletion Tiers:** Instantly groups catalog into *In Stock*, *Low Stock* (threshold configurable), and *Out of Stock*.
- **Managed vs. Unmanaged Inventory:** Highlights products tracking stock quantities versus unmanaged items.

### 5. 🏷️ Taxonomy & Category Governance
- **Category Distribution Visualizations:** Breakdown of catalog volume by category with direct filtering shortcuts.
- **Attribute Coverage:** Monitor custom attributes across all products.

### 6. 🔄 Bi-Directional WooCommerce REST API Sync
- **Full & Incremental Sync:** Fetch products, taxonomies, and variations from WooCommerce REST API v3 without store downtime.
- **Non-Blocking Architecture:** Background sync jobs with real-time status reporting and error diagnostics.

### 7. 📂 Streaming CSV Import & Export Engine
- **Export Full Catalog:** Instant CSV export of products, attributes, SKUs, and pricing.
- **Bulk CSV Import:** Upload external vendor CSVs with interactive column mapping and duplicate resolution policies.

### 8. 🌓 Engineering Design System
- Monochromatic styling with high-contrast Dark (`#0F1015`) and Light (`#FAFAFA`) themes.
- Custom typography, subtle border elevation, and zero third-party UI framework overhead.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite 6 | Fast single-page application with reactive state |
| **Icons & UI** | Lucide React | High-performance vector iconography |
| **Backend API** | Node.js v26, Express 4, TypeScript (`tsx`) | Typed REST API with modular route handlers |
| **Database** | SQLite (`node:sqlite` in WAL mode) | High-speed local indexing and caching |
| **AI Intelligence** | Google Gemini Generative AI SDK (`@google/generative-ai`) | Multi-tone eCommerce product copywriter |
| **Integration** | WooCommerce REST API v3 | Store catalog synchronization |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ (tested on Node.js v22/v26)
- **npm** v9+
- A running WooCommerce store with REST API keys (Consumer Key & Consumer Secret)
- A Google Gemini API key (from [Google AI Studio](https://aistudio.google.com/))

---

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mahirfadte3161/kilowott.git
   cd kilowott
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

   Open `.env` and fill in your store credentials and Gemini API key:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # WooCommerce Integration
   WC_STORE_URL=https://your-store.com
   WC_CONSUMER_KEY=ck_your_consumer_key_here
   WC_CONSUMER_SECRET=cs_your_consumer_secret_here

   # Google Gemini AI Key
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development environment:**
   ```bash
   npm run dev
   ```
   This concurrently launches:
   - **Backend API Server:** `http://localhost:5000`
   - **Vite Frontend Client:** `http://localhost:5173`

5. **Open in browser:**
   Navigate to **[http://localhost:5173](http://localhost:5173)**.

---

## 📜 Available Scripts

| Command | Action |
|---|---|
| `npm run dev` | Runs both backend server and Vite client concurrently |
| `npm run dev:server` | Runs backend server with hot-reload via `tsx watch` |
| `npm run dev:client` | Runs frontend Vite dev server |
| `npm run build` | Builds TypeScript code and production Vite bundle |
| `npm test` | Runs the automated backend test suite |
| `npm run seed` | Seeds local SQLite database with demo catalog data |

---

## 📡 API Reference Overview

### AI Copywriting Endpoints
- `GET /api/ai/status` — Checks if Gemini AI is configured and reports the active model.
- `POST /api/ai/generate-description` — Generates rich product descriptions and SEO keywords.
  ```json
  {
    "productId": "optional-uuid",
    "name": "Product Name",
    "category": "Electronics",
    "price": 99.99,
    "tone": "marketing" // "marketing" | "professional" | "seo" | "casual"
  }
  ```

### PIM Catalog Endpoints
- `GET /api/pim/dashboard` — Aggregated catalog health metrics and KPIs.
- `GET /api/pim/categories` — Taxonomy cards with product distribution.
- `GET /api/pim/quality` — Quality completeness scoring and gap audits.
- `GET /api/pim/inventory` — Stock depletion analysis and inventory monitoring.
- `GET /api/products` — Filtered, searchable, and paginated product list.
- `GET /api/products/:id` — Full product specifications, attributes, and variations.

### Sync & CSV Endpoints
- `POST /api/woocommerce/sync` — Triggers a full or incremental WooCommerce sync.
- `POST /api/woocommerce/test` — Validates connection to the WooCommerce store.
- `GET /api/csv/export/products` — Streams full catalog as a downloadable CSV.
- `POST /api/csv/import/products` — Imports vendor CSV with custom column mapping.

---

## 🔒 Security Best Practices

- All WooCommerce Consumer Keys, Secrets, and Gemini API keys are kept strictly on the backend in `.env` and are never exposed to frontend bundles.
- `.env` and SQLite database files (`*.db`) are ignored in `.gitignore` to prevent credential exposure.

---

## 📄 License

MIT License. Engineered for modern eCommerce merchants and developers.
