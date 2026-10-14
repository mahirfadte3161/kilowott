import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Eye,
  Sliders,
  Sparkles,
  FileText,
  Image as ImageIcon,
  DollarSign,
  Tag,
  Package,
  Layers,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { ProductDetailDrawer } from '../components/ProductDetailDrawer.tsx';

interface ProductAudit {
  id: string;
  wc_product_id: number | null;
  name: string;
  sku: string | null;
  price: number;
  hasSku: boolean;
  hasPrice: boolean;
  hasDescription: boolean;
  hasImage: boolean;
  hasCategory: boolean;
  hasAttributes: boolean;
  hasStock: boolean;
  completenessScore: number;
  missingFields: string[];
  status: string;
  product_type: string;
  updated_at: string;
}

interface QualitySummary {
  totalProducts: number;
  catalogCompletenessScore: number;
  requiringReview: number;
  tiers: {
    excellent: number;
    good: number;
    needsWork: number;
    poor: number;
  };
  missingCounts: {
    missingSku: number;
    missingPrice: number;
    missingDescription: number;
    missingImage: number;
    missingCategory: number;
    missingAttributes: number;
  };
}

export const QualityView: React.FC = () => {
  const [summary, setSummary] = useState<QualitySummary | null>(null);
  const [audits, setAudits] = useState<ProductAudit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const fetchQuality = async (filterKey = activeFilter) => {
    try {
      setLoading(true);
      const res = await api.getPimQuality(filterKey);
      if (res.success && res.data) {
        setSummary(res.data.summary);
        setAudits(res.data.audits);
      }
    } catch (err) {
      console.error('Failed to load quality audit:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuality(activeFilter);
  }, [activeFilter]);

  const filteredAudits = audits.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      (a.sku && a.sku.toLowerCase().includes(q))
    );
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--accent-green)';
    if (score >= 60) return 'var(--accent-blue)';
    if (score >= 40) return 'var(--accent-amber)';
    return 'var(--accent-red)';
  };

  const filterTabs = [
    { key: '', label: 'All Products', count: summary?.totalProducts ?? 0 },
    { key: 'review', label: 'Needs Review', count: summary?.requiringReview ?? 0, highlight: true },
    { key: 'missing_sku', label: 'Missing SKU', count: summary?.missingCounts?.missingSku ?? 0 },
    { key: 'missing_price', label: 'Missing Price', count: summary?.missingCounts?.missingPrice ?? 0 },
    { key: 'missing_description', label: 'Missing Description', count: summary?.missingCounts?.missingDescription ?? 0 },
    { key: 'missing_image', label: 'Missing Image', count: summary?.missingCounts?.missingImage ?? 0 },
    { key: 'missing_category', label: 'Missing Category', count: summary?.missingCounts?.missingCategory ?? 0 },
    { key: 'missing_attributes', label: 'No Attributes', count: summary?.missingCounts?.missingAttributes ?? 0 },
  ];

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 'var(--space-6)',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--accent-green)',
              }}
            >
              <ShieldCheck size={18} />
            </span>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              Product Data Quality & Completeness
            </h1>
          </div>
          <p style={{ margin: 'var(--space-1) 0 0 0', color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
            Automated completeness scoring across all WooCommerce catalog fields with actionable missing attribute auditing.
          </p>
        </div>

        <button
          onClick={() => fetchQuality()}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontSize: 'var(--font-sm)',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Recalculate Scores
        </button>
      </div>

      {/* Main Completeness Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        {/* Overall Score */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)',
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 'var(--radius-full)',
              border: `4px solid ${getScoreColor(summary?.catalogCompletenessScore ?? 0)}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: getScoreColor(summary?.catalogCompletenessScore ?? 0) }}>
              {summary?.catalogCompletenessScore ?? 0}%
            </span>
          </div>
          <div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Catalog Quality Index
            </div>
            <div style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
              {(summary?.catalogCompletenessScore ?? 0) >= 80 ? 'Excellent Health' : (summary?.catalogCompletenessScore ?? 0) >= 60 ? 'Moderate Health' : 'Needs Attention'}
            </div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>
              Average across {summary?.totalProducts || 0} catalog products
            </div>
          </div>
        </div>

        {/* Tiers Breakdown */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>
            Completeness Distribution
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '6px 4px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--accent-green)' }}>{summary?.tiers.excellent || 0}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>80-100%</div>
            </div>
            <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '6px 4px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--accent-blue)' }}>{summary?.tiers.good || 0}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>60-79%</div>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '6px 4px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--accent-amber)' }}>{summary?.tiers.needsWork || 0}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>40-59%</div>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '6px 4px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--accent-red)' }}>{summary?.tiers.poor || 0}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>&lt;40%</div>
            </div>
          </div>
        </div>

        {/* Action Priority */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <AlertTriangle size={14} style={{ color: 'var(--accent-amber)' }} /> Review Queue
          </div>
          <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 700, marginTop: 'var(--space-2)', color: (summary?.requiringReview || 0) > 0 ? 'var(--accent-amber)' : 'var(--accent-green)' }}>
            {summary?.requiringReview ?? 0}
          </div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
            Products with score below 70% threshold
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          overflowX: 'auto',
          paddingBottom: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid',
                borderColor: isActive ? 'var(--accent-blue)' : 'var(--border-color)',
                background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-surface)',
                color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                fontSize: 'var(--font-xs)',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  background: isActive ? 'var(--accent-blue)' : 'var(--bg-canvas)',
                  color: isActive ? '#ffffff' : 'var(--text-tertiary)',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-4)',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', width: 320 }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)',
            }}
          />
          <input
            type="text"
            placeholder="Search audit by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px 6px 32px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-xs)',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
          Showing {filteredAudits.length} products
        </div>
      </div>

      {/* Audit Table */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-xs)' }}>
            <thead>
              <tr style={{ background: 'var(--bg-canvas)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Product Name</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>SKU</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Completeness</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Price</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Desc</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Image</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Category</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Missing Attributes</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ padding: 48, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                    Auditing product data completeness...
                  </td>
                </tr>
              ) : filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 48, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    <CheckCircle2 size={32} style={{ margin: '0 auto 8px', color: 'var(--accent-green)' }} />
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No products in this filter criteria!</div>
                    <div style={{ fontSize: 'var(--font-xs)', marginTop: 4 }}>All products have satisfied this attribute quality requirement.</div>
                  </td>
                </tr>
              ) : (
                filteredAudits.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-canvas)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {/* Name */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Type: {item.product_type}</div>
                    </td>

                    {/* SKU */}
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)' }}>
                      {item.hasSku ? (
                        <span style={{ color: 'var(--text-primary)' }}>{item.sku}</span>
                      ) : (
                        <span style={{ color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <XCircle size={12} /> Missing SKU
                        </span>
                      )}
                    </td>

                    {/* Completeness Score */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: `${getScoreColor(item.completenessScore)}15`,
                            color: getScoreColor(item.completenessScore),
                            minWidth: 42,
                            textAlign: 'center',
                          }}
                        >
                          {item.completenessScore}%
                        </span>
                        <div style={{ width: 50, height: 4, background: 'var(--bg-canvas)', borderRadius: 2, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${item.completenessScore}%`,
                              height: '100%',
                              background: getScoreColor(item.completenessScore),
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Price check */}
                    <td style={{ padding: '12px 16px' }}>
                      {item.hasPrice ? (
                        <span style={{ color: 'var(--accent-green)' }} title="Price present"><CheckCircle2 size={15} /></span>
                      ) : (
                        <span style={{ color: 'var(--accent-red)' }} title="Missing price"><XCircle size={15} /></span>
                      )}
                    </td>

                    {/* Description check */}
                    <td style={{ padding: '12px 16px' }}>
                      {item.hasDescription ? (
                        <span style={{ color: 'var(--accent-green)' }} title="Description present"><CheckCircle2 size={15} /></span>
                      ) : (
                        <span style={{ color: 'var(--accent-red)' }} title="Missing description"><XCircle size={15} /></span>
                      )}
                    </td>

                    {/* Image check */}
                    <td style={{ padding: '12px 16px' }}>
                      {item.hasImage ? (
                        <span style={{ color: 'var(--accent-green)' }} title="Image present"><CheckCircle2 size={15} /></span>
                      ) : (
                        <span style={{ color: 'var(--accent-red)' }} title="Missing image"><XCircle size={15} /></span>
                      )}
                    </td>

                    {/* Category check */}
                    <td style={{ padding: '12px 16px' }}>
                      {item.hasCategory ? (
                        <span style={{ color: 'var(--accent-green)' }} title="Assigned to specific category"><CheckCircle2 size={15} /></span>
                      ) : (
                        <span style={{ color: 'var(--accent-red)' }} title="Uncategorized or empty"><XCircle size={15} /></span>
                      )}
                    </td>

                    {/* Missing Fields list */}
                    <td style={{ padding: '12px 16px' }}>
                      {item.missingFields.length === 0 ? (
                        <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>100% Complete</span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {item.missingFields.map((field, idx) => (
                            <span
                              key={idx}
                              style={{
                                padding: '1px 6px',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(239, 68, 68, 0.08)',
                                color: 'var(--accent-red)',
                                fontSize: 10,
                                fontWeight: 500,
                              }}
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Action */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedProductId(item.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-canvas)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          fontSize: 11,
                          fontWeight: 500,
                        }}
                      >
                        <Eye size={12} /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Detail Drawer */}
      <ProductDetailDrawer
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
      />
    </div>
  );
};
