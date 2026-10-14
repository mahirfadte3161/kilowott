import React, { useEffect, useState } from 'react';
import {
  Package,
  CheckCircle2,
  FileEdit,
  FolderTree,
  DollarSign,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Boxes,
  Layers,
  Sparkles,
  ShieldCheck,
  Tags,
  AlertTriangle,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { NavItem } from '../components/Sidebar.tsx';

interface DashboardViewProps {
  onNavigate: (view: NavItem) => void;
  onSelectProduct?: (productId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onSelectProduct }) => {
  const [data, setData] = useState<any>(null);
  const [qualityData, setQualityData] = useState<any>(null);
  const [attributesData, setAttributesData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [metricsRes, qualityRes, attrRes] = await Promise.all([
        api.getDashboardMetrics(),
        api.getPimQuality(),
        api.getPimAttributes(),
      ]);

      if (metricsRes.success) {
        setData(metricsRes.data);
      } else {
        setError(metricsRes.error || 'Failed to fetch PIM dashboard metrics');
      }

      if (qualityRes.success) {
        setQualityData(qualityRes.data);
      }

      if (attrRes.success) {
        setAttributesData(attrRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to PIM backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
        <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--interactive)' }} />
        <span style={{ color: 'var(--fg-secondary)', fontSize: 13 }}>Analyzing product catalog & PIM quality metrics...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="card" style={{ padding: 'var(--space-6)', maxWidth: 500, margin: '40px auto', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--danger-fg)', marginBottom: 8 }}>Unable to load PIM Dashboard</h3>
        <p style={{ color: 'var(--fg-secondary)', marginBottom: 16 }}>{error}</p>
        <button className="btn btn-primary" onClick={fetchMetrics}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const {
    metrics,
    stockDistribution = { inStock: 0, outOfStock: 0, onBackorder: 0 },
    typeDistribution = [],
    categoryDistribution = [],
    priceDistribution = [],
    recentlyUpdated = [],
  } = data || {};

  const totalProds = metrics?.totalProducts || 0;
  const inStockPct = totalProds > 0 ? Math.round((stockDistribution.inStock / totalProds) * 100) : 0;
  const outOfStockPct = totalProds > 0 ? Math.round((stockDistribution.outOfStock / totalProds) * 100) : 0;

  const catalogQualityScore = qualityData?.summary?.catalogCompletenessScore ?? 0;
  const attrCoverage = attributesData?.attributeCoveragePct ?? 0;
  const missingCounts = qualityData?.summary?.missingCounts || {};

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', padding: 'var(--space-6)' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 style={{ margin: 0 }}>Product Information Management</h1>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--interactive-subtle)',
              color: 'var(--interactive)',
              border: '1px solid var(--interactive)',
            }}>
              PIM Overview
            </span>
          </div>
          <p style={{ color: 'var(--fg-secondary)', margin: 0, fontSize: 13 }}>
            Centralized product catalog analytics, data completeness scores, taxonomy, and attribute coverage.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchMetrics} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh Telemetry
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate('products')}>
            <Package size={13} /> Product Catalog
          </button>
        </div>
      </div>

      {/* PIM Core KPI Grid (8 Cards) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 'var(--space-3)',
      }}>
        {/* 1. Total Products */}
        <div
          className="card"
          style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}
          onClick={() => onNavigate('products')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)' }}>Total Products</span>
            <div style={{ padding: 6, borderRadius: 'var(--radius-sm)', background: 'var(--interactive-subtle)', color: 'var(--interactive)' }}>
              <Package size={15} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{metrics?.totalProducts ?? 0}</div>
          <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Catalog items stored in PIM</span>
        </div>

        {/* 2. Published & Draft */}
        <div
          className="card"
          style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}
          onClick={() => onNavigate('products')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)' }}>Published / Drafts</span>
            <div style={{ padding: 6, borderRadius: 'var(--radius-sm)', background: 'var(--success-bg)', color: 'var(--success-fg)' }}>
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--success-fg)' }}>
            {metrics?.publishedProducts ?? 0}
            <span style={{ fontSize: 13, color: 'var(--fg-muted)', fontWeight: 400, marginLeft: 6 }}>
              / {metrics?.draftProducts ?? 0} draft
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Live vs draft publication states</span>
        </div>

        {/* 3. Catalog Data Completeness Score */}
        <div
          className="card"
          style={{
            padding: 'var(--space-4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            cursor: 'pointer',
            border: '1px solid var(--interactive)',
          }}
          onClick={() => onNavigate('quality')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)' }}>Data Quality Score</span>
            <div style={{ padding: 6, borderRadius: 'var(--radius-sm)', background: 'var(--interactive-subtle)', color: 'var(--interactive)' }}>
              <ShieldCheck size={15} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: catalogQualityScore >= 70 ? 'var(--success-fg)' : 'var(--warning-fg)' }}>
            {catalogQualityScore}%
          </div>
          <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Average completeness across catalog</span>
        </div>

        {/* 4. Attribute Coverage */}
        <div
          className="card"
          style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}
          onClick={() => onNavigate('attributes')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)' }}>Attribute Coverage</span>
            <div style={{ padding: 6, borderRadius: 'var(--radius-sm)', background: 'var(--bg-recessed)', color: 'var(--fg-primary)' }}>
              <Tags size={15} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{attrCoverage}%</div>
          <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{attributesData?.productsWithAttributes ?? 0} items with attributes</span>
        </div>

        {/* 5. Product Categories */}
        <div
          className="card"
          style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}
          onClick={() => onNavigate('categories')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)' }}>Categories</span>
            <div style={{ padding: 6, borderRadius: 'var(--radius-sm)', background: 'var(--interactive-subtle)', color: 'var(--interactive)' }}>
              <FolderTree size={15} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{metrics?.totalCategories ?? 0}</div>
          <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Organized taxonomies</span>
        </div>

        {/* 6. Products Missing Information */}
        <div
          className="card"
          style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}
          onClick={() => onNavigate('quality')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)' }}>Missing Info Review</span>
            <div style={{ padding: 6, borderRadius: 'var(--radius-sm)', background: 'var(--warning-bg)', color: 'var(--warning-fg)' }}>
              <AlertCircle size={15} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--warning-fg)' }}>
            {qualityData?.summary?.requiringReview ?? metrics?.attentionNeededCount ?? 0}
          </div>
          <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Items missing SKU, image, or price</span>
        </div>

        {/* 7. Stock Monitoring */}
        <div
          className="card"
          style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}
          onClick={() => onNavigate('inventory')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)' }}>Stock Status</span>
            <div style={{ padding: 6, borderRadius: 'var(--radius-sm)', background: 'var(--bg-recessed)', color: 'var(--interactive)' }}>
              <Boxes size={15} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>
            {stockDistribution.inStock} <span style={{ fontSize: 13, color: 'var(--fg-muted)', fontWeight: 400 }}>in stock</span>
          </div>
          <span style={{ fontSize: 11, color: stockDistribution.outOfStock > 0 ? 'var(--danger-fg)' : 'var(--fg-muted)' }}>
            {stockDistribution.outOfStock} out of stock &bull; {metrics?.lowStockProducts ?? 0} low stock
          </span>
        </div>

        {/* 8. Average Price */}
        <div
          className="card"
          style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}
          onClick={() => onNavigate('products')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-secondary)' }}>Average Price</span>
            <div style={{ padding: 6, borderRadius: 'var(--radius-sm)', background: 'var(--bg-recessed)', color: 'var(--fg-primary)' }}>
              <DollarSign size={15} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>
            {metrics?.averagePrice > 0 ? `$${metrics.averagePrice.toFixed(2)}` : '$0.00'}
          </div>
          <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Priced products in store</span>
        </div>
      </div>

      {/* Grid: Quality Breakdown & Category Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 'var(--space-4)' }}>
        {/* PIM Data Quality Checklist */}
        <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} style={{ color: 'var(--interactive)' }} />
              <h3 style={{ margin: 0, fontSize: 15 }}>Product Data Quality Health</h3>
            </div>
            <button className="btn-ghost btn-sm" onClick={() => onNavigate('quality')}>
              Audit Queue <ArrowRight size={12} />
            </button>
          </div>

          <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-secondary)' }}>
            Completeness tracking ensures all products meet marketplace and SEO standards before publishing.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <div
              style={{ padding: 10, borderRadius: 'var(--radius-sm)', background: 'var(--bg-recessed)', cursor: 'pointer' }}
              onClick={() => onNavigate('quality')}
            >
              <div style={{ fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 2 }}>Missing SKUs</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: (missingCounts.missingSku || 0) > 0 ? 'var(--warning-fg)' : 'inherit' }}>
                {missingCounts.missingSku ?? 0}
              </div>
            </div>

            <div
              style={{ padding: 10, borderRadius: 'var(--radius-sm)', background: 'var(--bg-recessed)', cursor: 'pointer' }}
              onClick={() => onNavigate('quality')}
            >
              <div style={{ fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 2 }}>Missing Descriptions</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: (missingCounts.missingDescription || 0) > 0 ? 'var(--warning-fg)' : 'inherit' }}>
                {missingCounts.missingDescription ?? 0}
              </div>
            </div>

            <div
              style={{ padding: 10, borderRadius: 'var(--radius-sm)', background: 'var(--bg-recessed)', cursor: 'pointer' }}
              onClick={() => onNavigate('quality')}
            >
              <div style={{ fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 2 }}>Missing Images</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: (missingCounts.missingImage || 0) > 0 ? 'var(--warning-fg)' : 'inherit' }}>
                {missingCounts.missingImage ?? 0}
              </div>
            </div>

            <div
              style={{ padding: 10, borderRadius: 'var(--radius-sm)', background: 'var(--bg-recessed)', cursor: 'pointer' }}
              onClick={() => onNavigate('quality')}
            >
              <div style={{ fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 2 }}>Unassigned Categories</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: (missingCounts.missingCategory || 0) > 0 ? 'var(--warning-fg)' : 'inherit' }}>
                {missingCounts.missingCategory ?? 0}
              </div>
            </div>
          </div>

          {/* Completeness Tier Meter */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
              <span style={{ color: 'var(--fg-secondary)' }}>Catalog Completeness</span>
              <span style={{ fontWeight: 600 }}>{catalogQualityScore}% Target 100%</span>
            </div>
            <div style={{ height: 8, borderRadius: 'var(--radius-full)', background: 'var(--bg-recessed)', overflow: 'hidden' }}>
              <div style={{
                width: `${catalogQualityScore}%`,
                height: '100%',
                background: catalogQualityScore >= 70 ? 'var(--success-fg)' : 'var(--interactive)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        </div>

        {/* Product Count by Category */}
        <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FolderTree size={18} style={{ color: 'var(--interactive)' }} />
              <h3 style={{ margin: 0, fontSize: 15 }}>Product Count by Category</h3>
            </div>
            <button className="btn-ghost btn-sm" onClick={() => onNavigate('categories')}>
              All Categories <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {categoryDistribution.slice(0, 6).map((cat: any) => {
              const maxCount = Math.max(...categoryDistribution.map((c: any) => c.count || 0), 1);
              const pct = Math.round(((cat.count || 0) / maxCount) * 100);

              return (
                <div key={cat.category} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ fontWeight: 500 }} dangerouslySetInnerHTML={{ __html: cat.category }} />
                    <span style={{ color: 'var(--fg-secondary)', fontWeight: 600 }}>{cat.count} items</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 'var(--radius-full)', background: 'var(--bg-recessed)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${cat.count > 0 ? Math.max(pct, 5) : 0}%`,
                      height: '100%',
                      background: 'var(--interactive)',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid: Recently Updated Products & Stock Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 'var(--space-4)' }}>
        {/* Recently Modified / Synced Products */}
        <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} style={{ color: 'var(--interactive)' }} />
              <h3 style={{ margin: 0, fontSize: 15 }}>Recently Modified Products</h3>
            </div>
            <button className="btn-ghost btn-sm" onClick={() => onNavigate('products')}>
              Browse Catalog <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentlyUpdated.slice(0, 5).map((prod: any) => (
              <div
                key={prod.id}
                onClick={() => {
                  if (onSelectProduct) onSelectProduct(prod.id);
                  else onNavigate('products');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-recessed)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)',
                  }}>
                    {prod.image_url ? (
                      <img src={prod.image_url} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Package size={14} style={{ color: 'var(--fg-muted)' }} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{prod.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
                      SKU: {prod.sku || 'N/A'} &bull; ID: #{prod.wc_product_id || prod.id.slice(0, 6)}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {prod.price > 0 ? `$${parseFloat(prod.price).toFixed(2)}` : 'Unpriced'}
                  </div>
                  <span style={{
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    background: prod.stock_status === 'instock' ? 'var(--success-bg)' : 'var(--danger-bg)',
                    color: prod.stock_status === 'instock' ? 'var(--success-fg)' : 'var(--danger-fg)',
                    fontWeight: 500,
                  }}>
                    {prod.stock_status === 'instock' ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Breakdown & Quick Actions */}
        <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Boxes size={18} style={{ color: 'var(--interactive)' }} />
              <h3 style={{ margin: 0, fontSize: 15 }}>Inventory Telemetry</h3>
            </div>
            <button className="btn-ghost btn-sm" onClick={() => onNavigate('inventory')}>
              Audit Inventory <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div style={{ padding: 12, background: 'var(--bg-recessed)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 4 }}>In Stock</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--success-fg)' }}>{stockDistribution.inStock}</div>
              <div style={{ fontSize: 10, color: 'var(--fg-muted)' }}>{inStockPct}% of catalog</div>
            </div>

            <div style={{ padding: 12, background: 'var(--bg-recessed)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 4 }}>Out of Stock</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: stockDistribution.outOfStock > 0 ? 'var(--danger-fg)' : 'inherit' }}>
                {stockDistribution.outOfStock}
              </div>
              <div style={{ fontSize: 10, color: 'var(--fg-muted)' }}>{outOfStockPct}% of catalog</div>
            </div>

            <div style={{ padding: 12, background: 'var(--bg-recessed)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 4 }}>Backorders</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{stockDistribution.onBackorder}</div>
              <div style={{ fontSize: 10, color: 'var(--fg-muted)' }}>Active backorder state</div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('sync')}>
              <RefreshCw size={12} /> Live Sync
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('import-export')}>
              <FileSpreadsheet size={12} /> Export CSV
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('attributes')}>
              <Tags size={12} /> Attribute Engine
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
