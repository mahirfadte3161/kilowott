export type RecordOrigin = 'demo' | 'sync' | 'imported';

export type WooCommerceOrderStatus = 
  | 'pending'
  | 'processing'
  | 'on-hold'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed';

export interface Customer {
  id: string;
  wc_customer_id: number | null;
  email_normalized: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postcode: string | null;
  address_1: string | null;
  address_2: string | null;
  origin: RecordOrigin;
  is_guest: number;
  total_orders: number;
  lifetime_spend: number;
  registered_at: string | null;
  last_order_at: string | null;
  created_at: string;
  updated_at: string;
  tags?: string[];
  notes_count?: number;
}

export interface CustomerNote {
  id: string;
  customer_id: string;
  author: string;
  note: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  wc_product_id: number | null;
  name: string;
  sku: string | null;
  quantity: number;
  price: number;
  subtotal: number;
  total: number;
}

export interface Order {
  id: string;
  wc_order_id: number | null;
  customer_id: string | null;
  customer_email: string;
  customer_name: string | null;
  is_guest: number;
  status: WooCommerceOrderStatus;
  currency: string;
  subtotal: number;
  tax_total: number;
  shipping_total: number;
  discount_total: number;
  total: number;
  payment_method: string | null;
  payment_method_title: string | null;
  shipping_method_title: string | null;
  origin: RecordOrigin;
  date_created: string;
  date_completed: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface Product {
  id: string;
  wc_product_id: number | null;
  name: string;
  sku: string | null;
  price: number;
  regular_price: number;
  sale_price: number | null;
  stock_quantity: number | null;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  status: 'publish' | 'draft' | 'private' | 'pending';
  product_type: 'simple' | 'variable' | 'grouped' | 'external';
  featured: number;
  manage_stock: number;
  origin: RecordOrigin;
  categories: string | null;
  description: string | null;
  short_description: string | null;
  weight: string | null;
  dimensions_json: string | null;
  shipping_class: string | null;
  attributes_json: string | null;
  variations_json: string | null;
  permalink: string | null;
  tags_json: string | null;
  images_json: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductCategory {
  id: string;
  wc_category_id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number;
  count: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PRMDashboardMetrics {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  outOfStockProducts: number;
  lowStockProducts: number;
  totalCategories: number;
  averagePrice: number;
  attentionNeededCount: number;
  stockDistribution: {
    inStock: number;
    outOfStock: number;
    onBackorder: number;
  };
  typeDistribution: { type: string; count: number }[];
  categoryDistribution: { category: string; count: number }[];
  priceDistribution: { range: string; count: number }[];
  recentlyUpdated: Product[];
}

export interface Segment {
  id: string;
  name: string;
  description: string | null;
  rule_type: 'repeat' | 'high_value' | 'inactive_60' | 'inactive_90' | 'recent' | 'pending_orders' | 'custom';
  rule_config_json: string;
  member_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  subject: string;
  channel: 'email' | 'sms' | 'task';
  target_segment_id: string | null;
  target_segment_name?: string | null;
  template_body: string;
  status: 'draft' | 'scheduled' | 'sent';
  sent_count: number;
  created_at: string;
  updated_at: string;
}

export interface CommunicationActivity {
  id: string;
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  campaign_id: string | null;
  type: 'email' | 'note' | 'reminder' | 'system';
  subject: string;
  message: string;
  status: 'sent' | 'delivered' | 'pending' | 'draft';
  timestamp: string;
}

export interface SyncJob {
  id: string;
  job_type: 'full_sync' | 'incremental_sync' | 'webhook';
  status: 'in_progress' | 'completed' | 'failed';
  entity_type: string;
  records_synced: number;
  records_failed: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface WooCommerceCredentials {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
  webhookSecret?: string;
}
