import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Package,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Star,
  Eye,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { ProductDetailDrawer } from '../components/ProductDetailDrawer.tsx';
import { AIDescriptionModal } from '../components/AIDescriptionModal.tsx';

interface ProductsViewProps {
  initialCategory?: string;
  initialFilter?: string;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ initialCategory, initialFilter }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory || 'all');
  const [stockStatus, setStockStatus] = useState('all');
  const [productType, setProductType] = useState('all');
  const [status, setStatus] = useState('all');
  const [featured, setFeatured] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState(initialFilter || '');

  // Sorting
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Categories list for dropdown
  const [categoriesList, setCategoriesList] = useState<any[]>([]);

  // Selected Product for Drawer
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  // Selected Product for AI Description Modal
  const [aiModalProduct, setAiModalProduct] = useState<{ id: string; name: string } | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await api.getCategories();
      if (res.success) {
        setCategoriesList(res.data);
      }
    } catch {
      // non-critical
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getProducts({
        page: pagination.page,
        limit: pagination.limit,
        search,
        category: category !== 'all' ? category : '',
        stockStatus: stockStatus !== 'all' ? stockStatus : '',
        productType: productType !== 'all' ? productType : '',
        status: status !== 'all' ? status : '',
        featured,
        inventoryFilter,
        sortBy,
        sortDir,
      });

      if (res.success) {
        setProducts(res.data.products);
        setPagination(res.data.pagination);
      } else {
        setError(res.error || 'Failed to retrieve products');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching products from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (initialCategory !== undefined) {
      setCategory(initialCategory || 'all');
      setPagination(p => ({ ...p, page: 1 }));
    }
  }, [initialCategory]);

  useEffect(() => {
    if (initialFilter !== undefined) {
      setInventoryFilter(initialFilter || '');
      setPagination(p => ({ ...p, page: 1 }));
    }
  }, [initialFilter]);

  useEffect(() => {
    fetchProducts();
  }, [pagination.page, category, stockStatus, productType, status, featured, inventoryFilter, sortBy, sortDir]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    fetchProducts();
  };

  const resetFilters = () => {
    setSearch('');
    setCategory('all');
    setStockStatus('all');
    setProductType('all');
    setStatus('all');
    setFeatured('');
    setInventoryFilter('');
    setPagination(p => ({ ...p, page: 1 }));
  };

  return (
    <div className="animate-fade-in" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, marginBottom: 4 }}>Product Catalogue & Management</h1>
          <p style={{ color: 'var(--fg-secondary)', margin: 0, fontSize: 13 }}>
            Full WooCommerce product catalog with stock states, category assignments, and pricing telemetry.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => window.open('/api/csv/export/products', '_blank')}>
            <Download size={13} /> Export Catalogue CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={fetchProducts} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Search Row */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--fg-muted)' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: 34 }}
              placeholder="Search by product name or SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0 16px' }}>
            Search
          </button>
          {(search || category !== 'all' || stockStatus !== 'all' || productType !== 'all' || status !== 'all' || featured || inventoryFilter) && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={resetFilters}>
              Clear Filters
            </button>
          )}
        </form>

        {/* Filters and Sorting Row */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', fontSize: 13 }}>
          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>Category:</span>
            <select
              className="input"
              style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}
              value={category}
              onChange={e => { setCategory(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            >
              <option value="all">All Categories</option>
              {categoriesList.map(c => (
                <option key={c.id} value={c.name}>{c.name} ({c.count || 0})</option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>Stock:</span>
            <select
              className="input"
              style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}
              value={stockStatus}
              onChange={e => { setStockStatus(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            >
              <option value="all">All Stock States</option>
              <option value="instock">In Stock</option>
              <option value="outofstock">Out of Stock</option>
              <option value="onbackorder">On Backorder</option>
            </select>
          </div>

          {/* Product Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>Type:</span>
            <select
              className="input"
              style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}
              value={productType}
              onChange={e => { setProductType(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            >
              <option value="all">All Types</option>
              <option value="simple">Simple</option>
              <option value="variable">Variable</option>
              <option value="grouped">Grouped</option>
              <option value="external">External</option>
            </select>
          </div>

          {/* Publication Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>Status:</span>
            <select
              className="input"
              style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}
              value={status}
              onChange={e => { setStatus(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            >
              <option value="all">All Statuses</option>
              <option value="publish">Published</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="private">Private</option>
            </select>
          </div>

          {/* Sort By */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <ArrowUpDown size={13} style={{ color: 'var(--fg-muted)' }} />
            <span style={{ color: 'var(--fg-muted)', fontSize: 12 }}>Sort:</span>
            <select
              className="input"
              style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="name">Product Name</option>
              <option value="price">Price</option>
              <option value="stock">Stock Quantity</option>
              <option value="updated_at">Last Modified</option>
            </select>

            <button
              className="btn btn-secondary btn-sm"
              style={{ padding: '4px 8px' }}
              onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
              title={`Sorting: ${sortDir.toUpperCase()}`}
            >
              {sortDir === 'asc' ? '▲ ASC' : '▼ DESC'}
            </button>
          </div>
        </div>
      </div>

      {/* Product Table View */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--fg-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto', color: 'var(--interactive)' }} />
            <div>Loading product catalogue...</div>
          </div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ color: 'var(--danger-fg)', marginBottom: 8 }}>{error}</div>
            <button className="btn btn-secondary btn-sm" onClick={fetchProducts}>Try Again</button>
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <Package size={36} style={{ color: 'var(--fg-muted)', margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: 16 }}>No Products Found</h3>
            <p style={{ color: 'var(--fg-secondary)', fontSize: 13, maxWidth: 400, margin: '0 auto 16px auto' }}>
              No items matched the active search and filter criteria. Try adjusting filters or syncing from WooCommerce.
            </p>
            <button className="btn btn-secondary btn-sm" onClick={resetFilters}>Reset All Filters</button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-recessed)' }}>
                  <th style={{ padding: '12px 16px', fontWeight: 600 }}>Product</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>SKU</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Type</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Price</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Stock</th>
                  <th style={{ padding: '12px 14px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(prod => {
                  const hasStock = prod.stock_status === 'instock';
                  const isManaged = prod.manage_stock === 1;

                  return (
                    <tr
                      key={prod.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s ease',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedProductId(prod.id)}
                    >
                      {/* Product Name & Image */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-recessed)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            border: '1px solid var(--border-color)',
                            flexShrink: 0,
                          }}>
                            {prod.image_url ? (
                              <img src={prod.image_url} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Package size={16} style={{ color: 'var(--fg-muted)' }} />
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--fg-primary)' }}>
                              {prod.name}
                              {prod.featured === 1 && (
                                <Star size={12} fill="var(--warning-fg)" style={{ color: 'var(--warning-fg)', marginLeft: 6, display: 'inline' }} />
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
                              ID: #{prod.wc_product_id || prod.id.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {prod.sku ? (
                          <span>{prod.sku}</span>
                        ) : (
                          <span style={{ color: 'var(--warning-fg)', fontSize: 11 }}>Missing SKU</span>
                        )}
                      </td>

                      {/* Category */}
                      <td style={{ padding: '12px 14px', color: 'var(--fg-secondary)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {prod.categories || 'Uncategorized'}
                      </td>

                      {/* Product Type */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-recessed)',
                          textTransform: 'capitalize',
                          color: 'var(--fg-secondary)',
                        }}>
                          {prod.product_type || 'simple'}
                        </span>
                      </td>

                      {/* Price */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600 }}>
                          {prod.price > 0 ? `$${parseFloat(prod.price).toFixed(2)}` : (
                            <span style={{ color: 'var(--warning-fg)', fontSize: 11 }}>Unpriced ($0.00)</span>
                          )}
                        </div>
                        {prod.sale_price && (
                          <div style={{ fontSize: 11, color: 'var(--fg-muted)', textDecoration: 'line-through' }}>
                            ${parseFloat(prod.regular_price).toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Stock Status & Quantity */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: hasStock ? 'var(--success-fg)' : 'var(--danger-fg)',
                          }} />
                          <span style={{
                            fontWeight: 500,
                            color: hasStock ? 'var(--success-fg)' : 'var(--danger-fg)',
                          }}>
                            {hasStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>
                          {isManaged ? `${prod.stock_quantity ?? 0} units` : 'Unmanaged'}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          background: prod.status === 'publish' ? 'var(--success-bg)' : 'var(--bg-recessed)',
                          color: prod.status === 'publish' ? 'var(--success-fg)' : 'var(--fg-muted)',
                          fontWeight: 500,
                          textTransform: 'capitalize',
                        }}>
                          {prod.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            className="btn btn-sm"
                            style={{
                              padding: '4px 8px',
                              background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(59,130,246,0.15))',
                              border: '1px solid rgba(168,85,247,0.35)',
                              color: 'var(--accent-purple)',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                            onClick={() => setAiModalProduct({ id: prod.id, name: prod.name })}
                            title="Generate AI Description with Gemini"
                          >
                            <Sparkles size={12} /> AI
                          </button>
                          <button
                            className="btn-ghost btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={() => setSelectedProductId(prod.id)}
                            title="View Specifications Drawer"
                          >
                            <Eye size={14} /> Specs
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
            fontSize: 13,
          }}>
            <span style={{ color: 'var(--fg-secondary)' }}>
              Showing {products.length} of {pagination.totalCount} products
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={pagination.page <= 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              >
                <ChevronLeft size={14} /> Prev
              </button>

              <span style={{ padding: '0 8px', fontWeight: 600 }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                className="btn btn-secondary btn-sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-out Product Detail Drawer */}
      <ProductDetailDrawer
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
      />

      {/* AI Description Generator Modal */}
      {aiModalProduct && (
        <AIDescriptionModal
          productId={aiModalProduct.id}
          productName={aiModalProduct.name}
          onClose={() => setAiModalProduct(null)}
        />
      )}
    </div>
  );
};
