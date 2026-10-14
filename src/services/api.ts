export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const api = {
  // PRM Dashboard
  getDashboardMetrics: async () => {
    const res = await fetch('/api/dashboard/metrics');
    return res.json();
  },

  // Products
  getProducts: async (params: Record<string, string | number | boolean> = {}) => {
    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        cleanParams[k] = String(v);
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    const res = await fetch(`/api/products?${query}`);
    return res.json();
  },

  getProduct: async (id: string | number) => {
    const res = await fetch(`/api/products/${id}`);
    return res.json();
  },

  // Inventory & Stock Monitoring
  getInventoryMetrics: async () => {
    const res = await fetch('/api/products/inventory/metrics');
    return res.json();
  },

  // Categories
  getCategories: async () => {
    const res = await fetch('/api/products/categories');
    return res.json();
  },

  // PRM Settings
  getPrmSettings: async () => {
    const res = await fetch('/api/products/settings/prm');
    return res.json();
  },

  updatePrmSettings: async (settings: { lowStockThreshold?: number }) => {
    const res = await fetch('/api/products/settings/prm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  // PIM Data Quality & Completeness
  getPimQuality: async (filter = '') => {
    const url = filter ? `/api/pim/quality?filter=${encodeURIComponent(filter)}` : '/api/pim/quality';
    const res = await fetch(url);
    return res.json();
  },

  // PIM Attributes & Taxonomy Intelligence
  getPimAttributes: async () => {
    const res = await fetch('/api/pim/attributes');
    return res.json();
  },

  // CSV Import / Export
  previewCSV: async (file?: File, csvText?: string) => {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/csv/preview', {
        method: 'POST',
        body: formData,
      });
      return res.json();
    } else {
      const res = await fetch('/api/csv/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText }),
      });
      return res.json();
    }
  },

  importProductsCSV: async (rows: any[], columnMapping: any) => {
    const res = await fetch('/api/csv/import/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows, columnMapping }),
    });
    return res.json();
  },

  // WooCommerce Integration
  getWooCommerceStatus: async () => {
    const res = await fetch('/api/woocommerce/status');
    return res.json();
  },

  saveWooCommerceSettings: async (settings: any) => {
    const res = await fetch('/api/woocommerce/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  testWooCommerceConnection: async (creds?: any) => {
    const res = await fetch('/api/woocommerce/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds || {}),
    });
    return res.json();
  },

  syncWooCommerce: async (incremental = false) => {
    const res = await fetch('/api/woocommerce/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incremental }),
    });
    return res.json();
  },

  getHealth: async () => {
    const res = await fetch('/api/health');
    return res.json();
  },

  // Gemini AI — Product Description Generator
  getAiStatus: async () => {
    const res = await fetch('/api/ai/status');
    return res.json();
  },

  generateDescription: async (productId: string, tone: string) => {
    const res = await fetch('/api/ai/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, tone }),
    });
    return res.json();
  },

  // Legacy / Secondary helpers
  importCustomersCSV: async (rows: any[], columnMapping: any, onDuplicate = 'update') => {
    const res = await fetch('/api/csv/import/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows, columnMapping, onDuplicate }),
    });
    return res.json();
  },

  importOrdersCSV: async (rows: any[], columnMapping: any) => {
    const res = await fetch('/api/csv/import/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows, columnMapping }),
    });
    return res.json();
  },

  getActivities: async (): Promise<any> => ({ success: true, data: { activities: [] } }),
  getCustomers: async (params?: any): Promise<any> => ({ success: true, data: { customers: [], pagination: { page: 1, limit: 10, totalCount: 0, totalPages: 1 } } }),
  getCustomer: async (id: any): Promise<any> => ({ success: false, data: null, error: 'Customer management is not active in PIM mode' }),
  createCustomer: async (data: any): Promise<any> => ({ success: false, data: null, error: 'Disabled' }),
  addCustomerNote: async (id: any, note: any): Promise<any> => ({ success: false, data: null }),
  addCustomerTag: async (id: any, tag: any): Promise<any> => ({ success: false, data: null }),
  removeCustomerTag: async (id: any, tag: any): Promise<any> => ({ success: false, data: null }),
  getOrders: async (params?: any): Promise<any> => ({ success: true, data: { orders: [], pagination: { page: 1, limit: 10, totalCount: 0, totalPages: 1 } } }),
  getOrder: async (id: any): Promise<any> => ({ success: false, data: null, error: 'Order management is not active in PIM mode' }),
  updateOrderStatus: async (id: any, status: any): Promise<any> => ({ success: false, data: null }),
  getCampaigns: async (): Promise<any> => ({ success: true, data: [] }),
  getCampaign: async (id: any): Promise<any> => ({ success: false, data: null }),
  createCampaign: async (data: any): Promise<any> => ({ success: false, data: null }),
  sendCampaign: async (id: any): Promise<any> => ({ success: false, data: null }),
  getSegments: async (): Promise<any> => ({ success: true, data: [] }),
  getSegmentCustomers: async (id: any): Promise<any> => ({ success: true, data: { customers: [] } }),
  createSegment: async (data: any): Promise<any> => ({ success: false, data: null }),
  getInsights: async (): Promise<any> => ({ success: true, data: {} }),
  createFollowUpTask: async (...args: any[]): Promise<any> => ({ success: false, data: null }),
  updateActivityStatus: async (id: any, status: any): Promise<any> => ({ success: false, data: null }),
  resetDemoData: async (): Promise<any> => ({ success: true }),
  clearDemoData: async (): Promise<any> => ({ success: true }),
};
