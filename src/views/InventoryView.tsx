import React, { useEffect, useState } from 'react';
import {
  Boxes,
  AlertTriangle,
  Flame,
  CheckCircle2,
  AlertCircle,
  Package,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Tag,
  Sliders,
  Eye,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { ProductDetailDrawer } from '../components/ProductDetailDrawer.tsx';

export const InventoryView: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'low_stock' | 'out_of_stock' | 'in_stock' | 'missing_sku' | 'unpriced' | 'unmanaged'>('all');
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Settings
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [isEditingThreshold, setIsEditingThreshold] = useState(false);
  const [newThreshold, setNewThreshold] = useState('5');

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const [metricsRes, prodsRes] = await Promise.all([
        api.getInventoryMetrics(),
        api.getProducts({
          inventoryFilter: activeTab !== 'all' ? activeTab : '',
          search,
          limit: 50,
          sortBy: 'stock',
          sortDir: 'asc',
        }),
      ]);

      if (metricsRes.success) {
        setMetrics(metricsRes.data);
        setLowStockThreshold(metricsRes.data.lowStockThreshold || 5);
        setNewThreshold(String(metricsRes.data.lowStockThreshold || 5));
      }

      if (prodsRes.success) {
        setProducts(prodsRes.data.products);
      }
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  const handleSaveThreshold = async () => {
    const val = parseInt(newThreshold, 10);
    if (isNaN(val) || val < 1) return;
    try {
      await api.updatePrmSettings({ lowStockThreshold: val });
      setLowStockThreshold(val);
      setIsEditingThreshold(false);
      fetchInventory();
    } catch (err) {
      console.error('Failed to save threshold:', err);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, marginBottom: 4 }}>Inventory & Stock Monitoring</h1>
          <p style={{ color: 'var(--fg-secondary)', margin: 0, fontSize: 13 }}>
            Real-time stock level monitoring, threshold alerts, missing SKU audits, and catalog health.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            background: 'var(--bg-recessed)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12,
            border: '1px solid var(--border-color)',
          }}>
            <Sliders size={13} style={{ color: 'var(--interactive)' }} />
            <span>Low Stock Alert:</span>
            {isEditingThreshold ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="number"
                  className="input"
                  style={{ width: 50, padding: '2px 4px', fontSize: 12, height: 24 }}
                  min="1"
                  max="100"
                  value={newThreshold}
                  onChange={e => setNewThreshold(e.target.value)}
                />
                <button className="btn btn-primary btn-sm" style={{ padding: '2px 6px', fontSize: 11 }} onClick={handleSaveThreshold}>
                  Save
                </button>
                <button className="btn-ghost btn-sm" style={{ padding: '2px 4px', fontSize: 11 }} onClick={() => setIsEditingThreshold(false)}>
                  ✕
                </button>
              </div>
            ) : (
              <span
                style={{ fontWeight: 600, color: 'var(--interactive)', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setIsEditingThreshold(true)}
                title="Click to configure low stock threshold"
              >
                &le; {lowStockThreshold} units
              </span>
            )}
          </div>

          <button className="btn btn-secondary btn-sm" onClick={fetchInventory} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 'var(--space-3)',
      }}>
        {/* In Stock */}
        <div
          className="card"
          style={{
            padding: 14,
            cursor: 'pointer',
            border: activeTab === 'in_stock' ? '1px solid var(--interactive)' : '1px solid var(--border-color)',
            background: activeTab === 'in_stock' ? 'var(--interactive-subtle)' : 'var(--bg-surface)',
          }}
          onClick={() => setActiveTab(activeTab === 'in_stock' ? 'all' : 'in_stock')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>In Stock</span>
            <CheckCircle2 size={15} style={{ color: 'var(--success-fg)' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success-fg)' }}>
            {metrics?.inStock ?? 0}
          </div>
          <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Healthy inventory</span>
        </div>

        {/* Low Stock */}
        <div
          className="card"
          style={{
            padding: 14,
            cursor: 'pointer',
            border: activeTab === 'low_stock' ? '1px solid var(--warning-fg)' : '1px solid var(--border-color)',
            background: activeTab === 'low_stock' ? 'var(--warning-bg)' : 'var(--bg-surface)',
          }}
          onClick={() => setActiveTab(activeTab === 'low_stock' ? 'all' : 'low_stock')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Low Stock Alert</span>
            <Flame size={15} style={{ color: 'var(--warning-fg)' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: metrics?.lowStock > 0 ? 'var(--warning-fg)' : 'inherit' }}>
            {metrics?.lowStock ?? 0}
          </div>
          <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>&le; {lowStockThreshold} units remaining</span>
        </div>

        {/* Out of Stock */}
        <div
          className="card"
          style={{
            padding: 14,
            cursor: 'pointer',
            border: activeTab === 'out_of_stock' ? '1px solid var(--danger-fg)' : '1px solid var(--border-color)',
            background: activeTab === 'out_of_stock' ? 'var(--danger-bg)' : 'var(--bg-surface)',
          }}
          onClick={() => setActiveTab(activeTab === 'out_of_stock' ? 'all' : 'out_of_stock')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Out of Stock</span>
            <AlertTriangle size={15} style={{ color: 'var(--danger-fg)' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: metrics?.outOfStock > 0 ? 'var(--danger-fg)' : 'inherit' }}>
            {metrics?.outOfStock ?? 0}
          </div>
          <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Requires replenishment</span>
        </div>

        {/* Missing SKU */}
        <div
          className="card"
          style={{
            padding: 14,
            cursor: 'pointer',
            border: activeTab === 'missing_sku' ? '1px solid var(--interactive)' : '1px solid var(--border-color)',
            background: activeTab === 'missing_sku' ? 'var(--interactive-subtle)' : 'var(--bg-surface)',
          }}
          onClick={() => setActiveTab(activeTab === 'missing_sku' ? 'all' : 'missing_sku')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Missing SKU</span>
            <Tag size={15} style={{ color: 'var(--warning-fg)' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {metrics?.missingSku ?? 0}
          </div>
          <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Needs barcode identifier</span>
        </div>

        {/* Unpriced */}
        <div
          className="card"
          style={{
            padding: 14,
            cursor: 'pointer',
            border: activeTab === 'unpriced' ? '1px solid var(--interactive)' : '1px solid var(--border-color)',
            background: activeTab === 'unpriced' ? 'var(--interactive-subtle)' : 'var(--bg-surface)',
          }}
          onClick={() => setActiveTab(activeTab === 'unpriced' ? 'all' : 'unpriced')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Unpriced ($0.00)</span>
            <DollarSign size={15} style={{ color: 'var(--warning-fg)' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {metrics?.unpriced ?? 0}
          </div>
          <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Missing sale value</span>
        </div>

        {/* Unmanaged Stock */}
        <div
          className="card"
          style={{
            padding: 14,
            cursor: 'pointer',
            border: activeTab === 'unmanaged' ? '1px solid var(--interactive)' : '1px solid var(--border-color)',
            background: activeTab === 'unmanaged' ? 'var(--interactive-subtle)' : 'var(--bg-surface)',
          }}
          onClick={() => setActiveTab(activeTab === 'unmanaged' ? 'all' : 'unmanaged')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Unmanaged Stock</span>
            <Boxes size={15} style={{ color: 'var(--fg-muted)' }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {metrics?.stockUnmanaged ?? 0}
          </div>
          <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>WC stock tracking disabled</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="card" style={{ padding: 'var(--space-3)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          {[
            { id: 'all', label: `All Items (${metrics?.total ?? 0})` },
            { id: 'low_stock', label: `Low Stock (${metrics?.lowStock ?? 0})` },
            { id: 'out_of_stock', label: `Out of Stock (${metrics?.outOfStock ?? 0})` },
            { id: 'in_stock', label: `In Stock (${metrics?.inStock ?? 0})` },
            { id: 'missing_sku', label: `Missing SKU (${metrics?.missingSku ?? 0})` },
            { id: 'unpriced', label: `Unpriced (${metrics?.unpriced ?? 0})` },
            { id: 'unmanaged', label: `Unmanaged (${metrics?.stockUnmanaged ?? 0})` },
          ].map(tab => (
            <button
              key={tab.id}
              className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 6, minWidth: 220 }}>
          <input
            type="text"
            className="input"
            style={{ padding: '4px 10px', fontSize: 12 }}
            placeholder="Search items in view..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary btn-sm">
            <Search size={12} />
          </button>
        </form>
      </div>

      {/* Inventory Audit Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--fg-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto', color: 'var(--interactive)' }} />
            <div>Auditing stock levels...</div>
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <CheckCircle2 size={36} style={{ color: 'var(--success-fg)', margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: 16 }}>No Issues in Current View</h3>
            <p style={{ color: 'var(--fg-secondary)', fontSize: 13 }}>
              All products in this category meet standard inventory thresholds.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-recessed)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Product</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>SKU</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Stock Status</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Quantity</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Stock Management</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Price</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(prod => {
                  const isManaged = prod.manage_stock === 1;
                  const qty = prod.stock_quantity ?? 0;
                  const isLow = isManaged && prod.stock_status === 'instock' && qty > 0 && qty <= lowStockThreshold;
                  const isOOS = prod.stock_status === 'outofstock' || (isManaged && qty === 0);

                  return (
                    <tr
                      key={prod.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        background: isOOS ? 'rgba(239, 68, 68, 0.03)' : isLow ? 'rgba(245, 158, 11, 0.03)' : 'transparent',
                      }}
                      onClick={() => setSelectedProductId(prod.id)}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-recessed)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            border: '1px solid var(--border-color)',
                          }}>
                            {prod.image_url ? (
                              <img src={prod.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Package size={14} style={{ color: 'var(--fg-muted)' }} />
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{prod.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>ID: #{prod.wc_product_id || prod.id.slice(0, 8)}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {prod.sku ? (
                          prod.sku
                        ) : (
                          <span style={{ color: 'var(--warning-fg)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <AlertCircle size={12} /> Missing SKU
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: isOOS ? 'var(--danger-bg)' : isLow ? 'var(--warning-bg)' : 'var(--success-bg)',
                          color: isOOS ? 'var(--danger-fg)' : isLow ? 'var(--warning-fg)' : 'var(--success-fg)',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}>
                          {isOOS && <AlertTriangle size={11} />}
                          {isLow && <Flame size={11} />}
                          {!isOOS && !isLow && <CheckCircle2 size={11} />}
                          {isOOS ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>

                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                        {isManaged ? (
                          <span style={{ color: isOOS ? 'var(--danger-fg)' : isLow ? 'var(--warning-fg)' : 'inherit' }}>
                            {qty} units
                          </span>
                        ) : (
                          <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>Quantity N/A</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 12, color: isManaged ? 'var(--success-fg)' : 'var(--fg-muted)' }}>
                          {isManaged ? '● Tracked in WC' : '○ Disabled'}
                        </span>
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        {prod.price > 0 ? (
                          `$${parseFloat(prod.price).toFixed(2)}`
                        ) : (
                          <span style={{ color: 'var(--warning-fg)', fontSize: 11 }}>Unpriced ($0.00)</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <button
                          className="btn-ghost btn-sm"
                          onClick={() => setSelectedProductId(prod.id)}
                        >
                          <Eye size={13} /> Specs
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-out Product Detail Drawer */}
      <ProductDetailDrawer
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
      />
    </div>
  );
};
