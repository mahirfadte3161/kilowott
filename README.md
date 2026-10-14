# Kilowatt — Production-Grade WooCommerce CRM

Kilowatt is an executive CRM web application engineered for WooCommerce store managers, developers, and researchers. It manages customer lifecycle metrics, order fulfillments, product catalogs, dynamic audience segmentation, marketing campaigns, and real-time webhook events.

Built strictly according to the **[DESIGN.md](file:///c:/Users/mahir/OneDrive/Desktop/kilowatt/DESIGN.md)** design system specification with monochromatic engineering aesthetics, Geist typography, shadow-as-border styling, and an animated Day/Night theme toggle.

---

## 1. Architecture Overview

- **Frontend**: React 18, TypeScript, Vite 6, Lucide icons, custom responsive SVG sparklines and data visualizations, CSS custom property tokens for Light (`#FAFAFA`) and Dark (`#0F1015`) themes.
- **Backend**: Node.js v26 + Express REST API server with typed service layer.
- **Database**: Native SQLite (`node:sqlite` in WAL mode) with zero external C++ build dependencies, featuring 11 normalized relational tables, foreign key constraints, and performance indexes.
- **Testing**: Automated test suite covering WooCommerce client security, email normalization/deduplication, CSV import validation, segment rules, and HMAC-SHA256 webhook signatures.

---

## 2. Key Features

1. **Executive Dashboard**:
   - Total Revenue, Total Orders, Active Customers, Average Order Value (AOV).
   - SVG Area velocity chart aggregating transaction volume over time.
   - Best-selling products ranked by units sold and revenue.
   - Recent orders with WooCommerce status indicators.
   - Customer retention metrics and repeat buyer ratios.

2. **Customer Directory**:
   - Searchable, sortable, and filterable by origin (`demo`, `sync`, `imported`) and tags.
   - Normalized email deduplication (`trim().toLowerCase()`).
   - Customer Detail Drawer: Contact details, order history, team notes, and tag management.
   - Manual customer creation with duplicate check.
   - Proper guest checkout association.

3. **Order Management**:
   - Filterable by official WooCommerce statuses (`pending`, `processing`, `on-hold`, `completed`, `cancelled`, `refunded`, `failed`).
   - Detailed financial breakdown: Subtotal, Shipping, Tax, Discounts, Total.
   - Line items table with SKU and unit prices.
   - Interactive order status updates.
   - Order history per customer.

4. **Product Catalogue**:
   - Stock status tracking (`instock`, `outofstock`, `onbackorder`).
   - Product occurrence across historical orders.
   - SKU, pricing, and category tagging.

5. **Dynamic Rule-Based Segments**:
   - High-Value Customers ($500+ spend).
   - Repeat Buyers (2+ orders).
   - Inactive Customers (60+ and 90+ days without order).
   - Recent Customers (purchased in last 30 days).
   - Customers with Pending Orders.
   - Custom rule generator with instant member query execution.
   - Automated behavioral intelligence insights.

6. **Campaigns & Outreach Workflows**:
   - Targeted campaign drafts with audience preview.
   - Personalized template variables (`{{first_name}}`, `{{email}}`).
   - Safe simulated dispatch with recipient confirmation and automatic logging into the customer activity stream.

7. **WooCommerce REST Integration & Webhooks**:
   - Server-side credentials encryption and masking.
   - HTTPS enforcement for remote stores (local HTTP permitted for localhost/local development).
   - Retry-safe idempotent upserting.
   - Incremental sync using `modified_after`.
   - Webhook endpoint (`/api/woocommerce/webhook`) with HMAC-SHA256 signature verification.

8. **CSV Data Center**:
   - 3-step CSV import wizard with automatic header mapping, preview, duplicate detection (`update` vs `skip`), and row-level error reporting.
   - CSV export for Customers, Orders, and Products.

9. **Demo Data Management**:
   - Every record explicitly flagged with `origin = 'demo'`, `'sync'`, or `'imported'`.
   - One-click reload or wipe of demo datasets.

---

## 3. Directory Structure

```
kilowatt/
├── DESIGN.md                   # Source of truth design specification
├── package.json                # Full-stack dependencies & scripts
├── tsconfig.json               # Client TypeScript config
├── tsconfig.server.json        # Server TypeScript config
├── vite.config.ts              # Vite configuration with /api proxy
├── .env.example                # Example environment variables
├── .env                        # Local active configuration
├── data/                       # SQLite database directory
│   └── crm.db                  # Relational SQLite database file
├── server/                     # Backend API & Database
│   ├── index.ts                # Express application entry point
│   ├── database/
│   │   ├── db.ts               # Database connection using node:sqlite
│   │   ├── schema.ts           # 11 normalized tables, indexes, constraints
│   │   └── seed.ts             # Realistic e-commerce demo dataset
│   ├── services/
│   │   ├── woocommerce.ts      # REST API client & webhook HMAC verifier
│   │   ├── segmentEngine.ts    # Rule evaluation & behavioral insights
│   │   └── csvEngine.ts        # CSV parsing, mapping & export engine
│   ├── routes/                 # Express route controllers
│   │   ├── dashboard.ts
│   │   ├── customers.ts
│   │   ├── orders.ts
│   │   ├── products.ts
│   │   ├── segments.ts
│   │   ├── campaigns.ts
│   │   ├── activity.ts
│   │   ├── woocommerce.ts
│   │   ├── csv.ts
│   │   └── demo.ts
│   └── tests/
│       └── crm.test.ts         # Automated test suite (13 passing tests)
└── src/                        # Frontend React Application
    ├── main.tsx                # React DOM mount
    ├── App.tsx                 # Main application shell & routing
    ├── index.css               # Global tokens, typography, shadow-as-border
    ├── services/
    │   └── api.ts              # API client methods
    ├── components/
    │   ├── Header.tsx          # 54px header with theme toggle & sync status
    │   ├── Sidebar.tsx         # Collapsible navigation sidebar
    │   ├── ThemeToggle.tsx     # Animated Day/Night theme toggle
    │   └── CSVImportModal.tsx  # 3-step CSV import wizard
    └── views/
        ├── DashboardView.tsx
        ├── CustomersView.tsx
        ├── OrdersView.tsx
        ├── ProductsView.tsx
        ├── SegmentsView.tsx
        ├── CampaignsView.tsx
        ├── ActivityView.tsx
        ├── IntegrationsView.tsx
        └── SettingsView.tsx
```

---

## 4. Setup & Running Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` (or copy from `.env.example`):
```env
PORT=5000
NODE_ENV=development

# WooCommerce REST API Credentials
WC_STORE_URL=http://crm-demo-store.local
WC_CONSUMER_KEY=ck_8dce953ec5bd6e26ab654f769fdbc5120d542bfa
WC_CONSUMER_SECRET=cs_b54c72d7e0bd84e371da5583dde2fd955ea40f64
WC_WEBHOOK_SECRET=your_webhook_secret_here

DATABASE_PATH=./data/crm.db
```

### 3. Run Development Server
Launches both Express backend (`localhost:5000`) and Vite frontend (`localhost:5173`) concurrently:
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 4. Run Automated Test Suite
```bash
npm test
```
Runs the 13 automated tests covering:
- Store URL validation & protocol security
- Credential masking and secret isolation
- Customer email normalization & duplicate prevention
- Order upserting & guest checkout mapping
- Dynamic customer segmentation & insight calculations
- CSV parsing, column mapping & row validation
- WooCommerce webhook HMAC-SHA256 signature verification

### 5. Build for Production
```bash
npm run build
```

---

## 5. Connecting a WooCommerce Test Store

1. In WordPress, navigate to **WooCommerce &gt; Settings &gt; Advanced &gt; REST API**.
2. Click **Add Key**, set Permissions to **Read/Write**, and click **Generate API Key**.
3. In Kilowatt, go to the **Integrations** tab in the sidebar.
4. Enter your **Store URL**, **Consumer Key**, and **Consumer Secret**.
5. Click **Test Handshake** to verify live communication.
6. Click **Incremental Sync** or **Full Sync** to synchronize products, customers, and orders into Kilowatt.
7. To configure webhooks, add a Webhook in WooCommerce pointing to:
   ```
   http://localhost:5000/api/woocommerce/webhook
   ```
   with topics `order.created`, `order.updated`, `customer.created`, or `customer.updated`.
