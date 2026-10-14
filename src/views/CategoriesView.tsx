import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Search,
  Package,
  ExternalLink,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { NavItem } from '../components/Sidebar.tsx';

interface Category {
  id: number;
  wc_category_id: number;
  name: string;
  slug: string;
  parent_id: number;
  description: string | null;
  count: number;
  active_count?: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface CategoriesViewProps {
  onNavigate?: (view: NavItem) => void;
  onFilterByCategory?: (categoryName: string) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  onNavigate,
  onFilterByCategory,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getCategories();
      if (res.success && Array.isArray(res.data)) {
        setCategories(res.data);
      } else {
        setError(res.error || 'Failed to fetch product categories');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const totalProducts = categories.reduce((sum, c) => sum + (c.active_count || c.count || 0), 0);

  const filteredCategories = categories.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  const handleSelectCategory = (catName: string) => {
    if (onFilterByCategory) {
      onFilterByCategory(catName);
    }
    if (onNavigate) {
      onNavigate('products');
    }
  };

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 1400, margin: '0 auto' }}>
      {/* Page Header */}
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
                background: 'rgba(59, 130, 246, 0.1)',
                color: 'var(--accent-blue)',
              }}
            >
              <FolderTree size={18} />
            </span>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              Product Categories
            </h1>
          </div>
          <p style={{ margin: 'var(--space-1) 0 0 0', color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
            Taxonomy structure and category distribution synchronized live from WooCommerce store.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            onClick={fetchCategories}
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
            Refresh Categories
          </button>
        </div>
      </div>

      {/* Overview Metric Banner */}
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
            <Layers size={14} /> Total Categories
          </div>
          <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 700, marginTop: 'var(--space-2)', color: 'var(--text-primary)' }}>
            {categories.length}
          </div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
            Live taxonomy nodes from store
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
            <Package size={14} /> Catalog Products Mapped
          </div>
          <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 700, marginTop: 'var(--space-2)', color: 'var(--accent-blue)' }}>
            {totalProducts}
          </div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
            Across all organized groups
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
            <Sparkles size={14} /> Top Category
          </div>
          <div style={{ fontSize: 'var(--font-xl)', fontWeight: 700, marginTop: 'var(--space-2)', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {categories[0]?.name || 'None'}
          </div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
            {categories[0] ? `${categories[0].active_count || categories[0].count} products assigned` : 'No products'}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
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
        <div style={{ position: 'relative', minWidth: 280, flex: 1, maxWidth: 450 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)',
            }}
          />
          <input
            type="text"
            placeholder="Search categories by name, slug, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-sm)',
              outline: 'none',
            }}
          />
        </div>
        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
          Showing {filteredCategories.length} of {categories.length} categories
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && categories.length === 0 && (
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
          <div>Loading WooCommerce category taxonomy...</div>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--accent-red)',
            color: 'var(--accent-red)',
            marginBottom: 'var(--space-4)',
            fontSize: 'var(--font-sm)',
          }}
        >
          {error}
        </div>
      )}

      {/* Category Grid */}
      {!loading && filteredCategories.length === 0 && (
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
          <FolderOpen size={36} style={{ margin: '0 auto var(--space-3)', opacity: 0.5 }} />
          <div style={{ fontWeight: 600, fontSize: 'var(--font-base)', color: 'var(--text-primary)' }}>
            No categories match your search
          </div>
          <div style={{ fontSize: 'var(--font-sm)', marginTop: 'var(--space-1)' }}>
            Try refining your search keyword or sync with WooCommerce to load new categories.
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        {filteredCategories.map((cat) => {
          const productCount = cat.active_count ?? cat.count ?? 0;
          const pct = totalProducts > 0 ? Math.round((productCount / totalProducts) * 100) : 0;
          const isUncategorized = cat.name.toLowerCase() === 'uncategorized';

          return (
            <div
              key={cat.id || cat.wc_category_id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-5)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                boxShadow: 'var(--shadow-sm)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.borderColor = 'var(--accent-blue)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 'var(--radius-md)',
                        background: isUncategorized ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        color: isUncategorized ? 'var(--accent-red)' : 'var(--accent-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FolderTree size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {cat.name}
                      </h3>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        /{cat.slug}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 'var(--font-xs)',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: productCount > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                      color: productCount > 0 ? 'var(--accent-green)' : 'var(--text-tertiary)',
                    }}
                  >
                    <Package size={12} />
                    {productCount} {productCount === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {cat.description && (
                  <p
                    style={{
                      margin: 'var(--space-3) 0 0 0',
                      fontSize: 'var(--font-xs)',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {cat.description}
                  </p>
                )}

                {/* Catalog Share Bar */}
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)', marginBottom: 4 }}>
                    <span>Catalog Share</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{pct}%</span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: 6,
                      borderRadius: 3,
                      background: 'var(--bg-canvas)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(100, pct)}%`,
                        height: '100%',
                        borderRadius: 3,
                        background: isUncategorized ? 'var(--accent-red)' : 'var(--accent-blue)',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div
                style={{
                  marginTop: 'var(--space-5)',
                  paddingTop: 'var(--space-3)',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                  WC ID: {cat.wc_category_id}
                </span>

                <button
                  onClick={() => handleSelectCategory(cat.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-canvas)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--font-xs)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent-blue)';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.borderColor = 'var(--accent-blue)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-canvas)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  View Products <ArrowRight size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
