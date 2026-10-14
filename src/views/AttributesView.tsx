import React, { useState, useEffect } from 'react';
import {
  Tags,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  GitBranch,
  Layers,
  Sparkles,
  ExternalLink,
  Sliders,
  Filter,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { ProductDetailDrawer } from '../components/ProductDetailDrawer.tsx';

interface AttributeItem {
  name: string;
  productCount: number;
  coveragePct: number;
  values: string[];
}

interface TagItem {
  tag: string;
  count: number;
}

interface AttributesData {
  totalProducts: number;
  productsWithAttributes: number;
  attributeCoveragePct: number;
  productsWithTags: number;
  tagCoveragePct: number;
  variableProducts: number;
  simpleProducts: number;
  attributesList: AttributeItem[];
  tagsList: TagItem[];
}

export const AttributesView: React.FC = () => {
  const [data, setData] = useState<AttributesData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'attributes' | 'tags' | 'variable'>('attributes');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const res = await api.getPimAttributes();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load attributes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  const filteredAttributes = (data?.attributesList || []).filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.values.some((v) => v.toLowerCase().includes(q))
    );
  });

  const filteredTags = (data?.tagsList || []).filter((t) =>
    t.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                background: 'rgba(168, 85, 247, 0.1)',
                color: 'var(--accent-purple)',
              }}
            >
              <Tags size={18} />
            </span>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              Attributes & Taxonomy Intelligence
            </h1>
          </div>
          <p style={{ margin: 'var(--space-1) 0 0 0', color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
            Monitor product attributes (size, color, material, etc.), variation configurations, and taxonomy tags.
          </p>
        </div>

        <button
          onClick={fetchAttributes}
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
          Refresh Intelligence
        </button>
      </div>

      {/* KPI Highlights */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Sliders size={14} /> Attribute Coverage
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--font-3xl)', fontWeight: 700, color: (data?.attributeCoveragePct || 0) >= 70 ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
              {data?.attributeCoveragePct ?? 0}%
            </span>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
              ({data?.productsWithAttributes || 0} / {data?.totalProducts || 0} products)
            </span>
          </div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
            Products with at least one custom attribute
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Tags size={14} /> Tag Coverage
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--font-3xl)', fontWeight: 700, color: 'var(--accent-purple)' }}>
              {data?.tagCoveragePct ?? 0}%
            </span>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
              ({data?.productsWithTags || 0} products tagged)
            </span>
          </div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
            {data?.tagsList?.length || 0} unique product tags discovered
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <GitBranch size={14} /> Product Types
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <div>
              <span style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
                {data?.simpleProducts ?? 0}
              </span>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginLeft: 4 }}>Simple</span>
            </div>
            <span style={{ color: 'var(--border-color)' }}>|</span>
            <div>
              <span style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--accent-blue)' }}>
                {data?.variableProducts ?? 0}
              </span>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginLeft: 4 }}>Variable</span>
            </div>
          </div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
            Simple vs multi-variation product breakdown
          </div>
        </div>
      </div>

      {/* Tabs & Search Navigation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: 'var(--space-3)',
          marginBottom: 'var(--space-5)',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            onClick={() => setActiveTab('attributes')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'attributes' ? 'var(--accent-purple)' : 'transparent',
              color: activeTab === 'attributes' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: 'var(--font-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Sliders size={14} /> Attributes ({data?.attributesList?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('tags')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'tags' ? 'var(--accent-purple)' : 'transparent',
              color: activeTab === 'tags' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: 'var(--font-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Tags size={14} /> Tags ({data?.tagsList?.length || 0})
          </button>
        </div>

        <div style={{ position: 'relative', width: 280 }}>
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
            placeholder={activeTab === 'attributes' ? 'Search attributes or values...' : 'Search tags...'}
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
      </div>

      {/* Content Area */}
      {loading ? (
        <div
          style={{
            padding: 'var(--space-12)',
            textAlign: 'center',
            color: 'var(--text-tertiary)',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
          }}
        >
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto var(--space-3)' }} />
          <div>Analyzing product attributes and variations...</div>
        </div>
      ) : activeTab === 'attributes' ? (
        filteredAttributes.length === 0 ? (
          <div
            style={{
              padding: 'var(--space-12)',
              textAlign: 'center',
              color: 'var(--text-tertiary)',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
            }}
          >
            <Sliders size={36} style={{ margin: '0 auto var(--space-3)', opacity: 0.5 }} />
            <div style={{ fontWeight: 600, fontSize: 'var(--font-base)', color: 'var(--text-primary)' }}>
              No attributes found
            </div>
            <div style={{ fontSize: 'var(--font-sm)', marginTop: 'var(--space-1)' }}>
              None of the synced products currently define custom attributes in WooCommerce, or your search didn't match.
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 'var(--space-4)' }}>
            {filteredAttributes.map((attr, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-5)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {attr.name}
                    </h3>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                      Attribute Taxonomy
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: 'var(--font-xs)',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(168, 85, 247, 0.1)',
                      color: 'var(--accent-purple)',
                    }}
                  >
                    {attr.productCount} {attr.productCount === 1 ? 'product' : 'products'} ({attr.coveragePct}%)
                  </span>
                </div>

                {/* Progress Coverage Bar */}
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <div
                    style={{
                      width: '100%',
                      height: 5,
                      borderRadius: 3,
                      background: 'var(--bg-canvas)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, attr.coveragePct)}%`,
                        height: '100%',
                        borderRadius: 3,
                        background: 'var(--accent-purple)',
                      }}
                    />
                  </div>
                </div>

                {/* Values Sample */}
                <div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginBottom: 6, fontWeight: 500 }}>
                    Sample Discovered Values:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {attr.values.length > 0 ? (
                      attr.values.map((val, vIdx) => (
                        <span
                          key={vIdx}
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-canvas)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            fontSize: 'var(--font-xs)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {val}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                        No discrete values recorded
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // Tags Cloud / List View
        filteredTags.length === 0 ? (
          <div
            style={{
              padding: 'var(--space-12)',
              textAlign: 'center',
              color: 'var(--text-tertiary)',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
            }}
          >
            <Tags size={36} style={{ margin: '0 auto var(--space-3)', opacity: 0.5 }} />
            <div style={{ fontWeight: 600, fontSize: 'var(--font-base)', color: 'var(--text-primary)' }}>
              No product tags discovered
            </div>
            <div style={{ fontSize: 'var(--font-sm)', marginTop: 'var(--space-1)' }}>
              Assign tags to products in WooCommerce to improve searchability and organization.
            </div>
          </div>
        ) : (
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Discovered Product Tags ({filteredTags.length})
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {filteredTags.map((t, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--bg-canvas)',
                    border: '1px solid var(--border-color)',
                    fontSize: 'var(--font-xs)',
                    color: 'var(--text-primary)',
                    fontWeight: 500,
                  }}
                >
                  <Tags size={12} style={{ color: 'var(--accent-purple)' }} />
                  <span>{t.tag}</span>
                  <span
                    style={{
                      background: 'rgba(168, 85, 247, 0.1)',
                      color: 'var(--accent-purple)',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {t.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Product Drawer */}
      <ProductDetailDrawer
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
      />
    </div>
  );
};
