import React, { useEffect, useState } from 'react';
import {
  X,
  Package,
  ExternalLink,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
  Scale,
  Maximize2,
  Calendar,
  DollarSign,
  Truck,
  Sparkles,
  Info,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { AIDescriptionModal } from './AIDescriptionModal.tsx';

interface ProductDetailDrawerProps {
  productId: string | null;
  onClose: () => void;
}

export const ProductDetailDrawer: React.FC<ProductDetailDrawerProps> = ({ productId, onClose }) => {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    if (!productId) {
      setProduct(null);
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await api.getProduct(productId);
        if (res.success) {
          setProduct(res.data);
          if (res.data.images && res.data.images.length > 0) {
            setActiveImage(res.data.images[0].src);
          } else {
            setActiveImage(res.data.image_url || null);
          }
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [productId]);

  if (!productId) return null;

  return (
    <>
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(3px)',
      }}
      onClick={onClose}
    >
      <div
        className="card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: 580,
          height: '100vh',
          borderRadius: 0,
          borderLeft: '1px solid var(--border-color)',
          background: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={18} style={{ color: 'var(--interactive)' }} />
            <h3 style={{ margin: 0, fontSize: 16 }}>Product Specifications</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {product && (
              <button
                onClick={() => setShowAiModal(true)}
                title="Generate AI Description"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(168,85,247,0.4)',
                }}
              >
                <Sparkles size={13} /> AI Describe
              </button>
            )}
            <button className="btn-ghost" style={{ padding: 6, borderRadius: 'var(--radius-sm)' }} onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {loading && !product ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-muted)' }}>
              Loading product attributes and specifications...
            </div>
          ) : product ? (
            <>
              {/* Product Gallery & Main Image */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{
                  width: '100%',
                  height: 240,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-recessed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                }}>
                  {activeImage ? (
                    <img src={activeImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--fg-muted)' }}>
                      <Package size={36} />
                      <span style={{ fontSize: 12 }}>No image provided in WooCommerce</span>
                    </div>
                  )}
                </div>

                {/* Thumbnails if multiple images */}
                {product.images && product.images.length > 1 && (
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                    {product.images.map((img: any, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => setActiveImage(img.src)}
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 'var(--radius-sm)',
                          border: activeImage === img.src ? '2px solid var(--interactive)' : '1px solid var(--border-color)',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        <img src={img.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Title & Badges */}
              <div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  <span style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: product.status === 'publish' ? 'var(--success-bg)' : 'var(--bg-recessed)',
                    color: product.status === 'publish' ? 'var(--success-fg)' : 'var(--fg-muted)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}>
                    {product.status}
                  </span>
                  <span style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--interactive-subtle)',
                    color: 'var(--interactive)',
                    fontWeight: 500,
                    textTransform: 'capitalize',
                  }}>
                    {product.product_type || 'Simple Product'}
                  </span>
                  {product.featured === 1 && (
                    <span style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--warning-bg)',
                      color: 'var(--warning-fg)',
                      fontWeight: 600,
                    }}>
                      Featured
                    </span>
                  )}
                </div>

                <h2 style={{ fontSize: 20, margin: '0 0 6px 0' }}>{product.name}</h2>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span>ID: #{product.wc_product_id || product.id}</span>
                  <span>SKU: {product.sku || 'None (Missing SKU)'}</span>
                  <span>Origin: {product.origin || 'sync'}</span>
                </div>
              </div>

              {/* Price & Stock Highlight Card */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                padding: 14,
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-recessed)',
                border: '1px solid var(--border-color)',
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 2 }}>Current Price</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--fg-primary)' }}>
                    {product.price > 0 ? `$${parseFloat(product.price).toFixed(2)}` : 'Unpriced ($0.00)'}
                  </div>
                  {product.sale_price && (
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)', textDecoration: 'line-through' }}>
                      Regular: ${parseFloat(product.regular_price).toFixed(2)}
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: 11, color: 'var(--fg-secondary)', marginBottom: 2 }}>Inventory Status</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: product.stock_status === 'instock' ? 'var(--success-fg)' : 'var(--danger-fg)',
                    }} />
                    <span style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>
                      {product.stock_status === 'instock' ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>
                    {product.manage_stock === 1 ? (
                      `${product.stock_quantity ?? 0} units available`
                    ) : (
                      'Stock management disabled'
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {(product.short_description || product.description) && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Description</div>
                  <div
                    style={{ fontSize: 13, color: 'var(--fg-secondary)', lineHeight: 1.6 }}
                    dangerouslySetInnerHTML={{ __html: product.short_description || product.description }}
                  />
                </div>
              )}

              {/* Technical Specifications Table */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Physical & Shipping Specs</div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  fontSize: 12,
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: 10,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--fg-secondary)' }}>Weight</span>
                    <span style={{ fontWeight: 500 }}>{product.weight ? `${product.weight} kg` : 'Not specified'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--fg-secondary)' }}>Dimensions (L x W x H)</span>
                    <span style={{ fontWeight: 500 }}>
                      {product.dimensions && (product.dimensions.length || product.dimensions.width || product.dimensions.height)
                        ? `${product.dimensions.length || 0} × ${product.dimensions.width || 0} × ${product.dimensions.height || 0} cm`
                        : 'Not specified'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span style={{ color: 'var(--fg-secondary)' }}>Shipping Class</span>
                    <span style={{ fontWeight: 500 }}>{product.shipping_class || 'Standard'}</span>
                  </div>
                </div>
              </div>

              {/* Categories & Tags */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Categories & Taxonomy</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {product.categoriesList && product.categoriesList.length > 0 ? (
                    product.categoriesList.map((cat: string, i: number) => (
                      <span
                        key={i}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-recessed)',
                          fontSize: 12,
                          color: 'var(--fg-secondary)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        {cat}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Uncategorized</span>
                  )}
                </div>
              </div>

              {/* Product Variations / Attributes if variable */}
              {product.attributes && product.attributes.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Product Attributes</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                    {product.attributes.map((attr: any, idx: number) => (
                      <div key={idx} style={{ padding: 8, background: 'var(--bg-recessed)', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontWeight: 600 }}>{attr.name}: </span>
                        <span>{Array.isArray(attr.options) ? attr.options.join(', ') : attr.options}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Store Permalink Link Out */}
              {product.permalink && (
                <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                  <a
                    href={product.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <ExternalLink size={14} /> Open in WooCommerce Store
                  </a>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>

    {/* AI Description Generator Modal */}
    {showAiModal && product && (
      <AIDescriptionModal
        productId={product.id}
        productName={product.name}
        onClose={() => setShowAiModal(false)}
      />
    )}
    </>
  );
};

