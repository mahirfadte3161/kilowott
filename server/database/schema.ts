export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  wc_customer_id INTEGER,
  email_normalized TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postcode TEXT,
  address_1 TEXT,
  address_2 TEXT,
  origin TEXT NOT NULL DEFAULT 'demo', -- 'demo', 'sync', 'imported'
  is_guest INTEGER NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  lifetime_spend REAL NOT NULL DEFAULT 0.0,
  registered_at TEXT,
  last_order_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_wc_id ON customers(wc_customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_origin ON customers(origin);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email_normalized);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  wc_order_id INTEGER,
  customer_id TEXT,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  is_guest INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing', -- 'pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed'
  currency TEXT NOT NULL DEFAULT 'USD',
  subtotal REAL NOT NULL DEFAULT 0.0,
  tax_total REAL NOT NULL DEFAULT 0.0,
  shipping_total REAL NOT NULL DEFAULT 0.0,
  discount_total REAL NOT NULL DEFAULT 0.0,
  total REAL NOT NULL DEFAULT 0.0,
  payment_method TEXT,
  payment_method_title TEXT,
  shipping_method_title TEXT,
  origin TEXT NOT NULL DEFAULT 'demo',
  date_created TEXT NOT NULL,
  date_completed TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_wc_id ON orders(wc_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_origin ON orders(origin);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date_created);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT,
  wc_product_id INTEGER,
  name TEXT NOT NULL,
  sku TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  price REAL NOT NULL DEFAULT 0.0,
  subtotal REAL NOT NULL DEFAULT 0.0,
  total REAL NOT NULL DEFAULT 0.0,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  wc_product_id INTEGER,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  price REAL NOT NULL DEFAULT 0.0,
  regular_price REAL NOT NULL DEFAULT 0.0,
  sale_price REAL,
  stock_quantity INTEGER DEFAULT 0,
  stock_status TEXT NOT NULL DEFAULT 'instock', -- 'instock', 'outofstock', 'onbackorder'
  status TEXT NOT NULL DEFAULT 'publish', -- 'publish', 'draft', 'private', 'pending'
  product_type TEXT NOT NULL DEFAULT 'simple', -- 'simple', 'variable', 'grouped', 'external'
  featured INTEGER NOT NULL DEFAULT 0,
  manage_stock INTEGER NOT NULL DEFAULT 0,
  origin TEXT NOT NULL DEFAULT 'sync',
  categories TEXT,
  description TEXT,
  short_description TEXT,
  weight TEXT,
  dimensions_json TEXT,
  shipping_class TEXT,
  attributes_json TEXT,
  variations_json TEXT,
  permalink TEXT,
  tags_json TEXT,
  images_json TEXT,
  image_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_wc_id ON products(wc_product_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_origin ON products(origin);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_status);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);

CREATE TABLE IF NOT EXISTS product_categories (
  id TEXT PRIMARY KEY,
  wc_category_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  parent_id INTEGER DEFAULT 0,
  count INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_categories_wc_id ON product_categories(wc_category_id);

CREATE TABLE IF NOT EXISTS prm_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customer_notes (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Agent',
  note TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notes_customer_id ON customer_notes(customer_id);

CREATE TABLE IF NOT EXISTS customer_tags (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(customer_id, tag),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tags_customer_id ON customer_tags(customer_id);

CREATE TABLE IF NOT EXISTS segments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL, -- 'repeat', 'high_value', 'inactive_60', 'inactive_90', 'recent', 'pending_orders', 'custom'
  rule_config_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email', -- 'email', 'sms', 'task'
  target_segment_id TEXT,
  template_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'sent'
  sent_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (target_segment_id) REFERENCES segments(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS communication_activities (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  campaign_id TEXT,
  type TEXT NOT NULL DEFAULT 'email', -- 'email', 'note', 'reminder', 'system'
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- 'sent', 'delivered', 'pending', 'draft'
  timestamp TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_comm_customer_id ON communication_activities(customer_id);

CREATE TABLE IF NOT EXISTS sync_jobs (
  id TEXT PRIMARY KEY,
  job_type TEXT NOT NULL, -- 'full_sync', 'incremental_sync', 'webhook'
  status TEXT NOT NULL, -- 'in_progress', 'completed', 'failed'
  entity_type TEXT NOT NULL DEFAULT 'all',
  records_synced INTEGER NOT NULL DEFAULT 0,
  records_failed INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS integration_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;
