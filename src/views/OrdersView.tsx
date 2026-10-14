import React, { useEffect, useState } from 'react';
import {
  Search,
  Download,
  RefreshCw,
  X,
  ShoppingBag,
  User,
  CreditCard,
  Truck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api.ts';

interface OrdersViewProps {
  onOpenCsvModal?: (type: 'customers' | 'products' | 'orders') => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ onOpenCsvModal }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('');

  // Selected Order for Drawer
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getOrders({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter,
        origin: originFilter,
      });

      if (res.success) {
        setOrders(res.data.orders);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, statusFilter, originFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    fetchOrders();
  };

  const openOrderDrawer = async (id: string) => {
    setSelectedOrderId(id);
    try {
      setDetailsLoading(true);
      const res = await api.getOrder(id);
      if (res.success) {
        setOrderDetails(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch order details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedOrderId) return;
    try {
      setStatusUpdating(true);
      const res = await api.updateOrderStatus(selectedOrderId, newStatus);
      if (res.success) {
        setOrderDetails((prev: any) => ({
          ...prev,
          order: res.data,
        }));
        fetchOrders();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  const statusOptions = [
    { id: 'all', label: 'All Statuses' },
    { id: 'completed', label: 'Completed' },
    { id: 'processing', label: 'Processing' },
    { id: 'on-hold', label: 'On-Hold' },
    { id: 'pending', label: 'Pending Payment' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'refunded', label: 'Refunded' },
  ];

  return (
    <div className="animate-fade-in" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Orders</h1>
          <p style={{ color: 'var(--fg-secondary)' }}>
            Real-time WooCommerce order tracking, line item breakdowns, and fulfillment status.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => window.open('/api/csv/export/orders', '_blank')}>
            <Download size={13} /> Export Orders CSV
          </button>
          {onOpenCsvModal && (
            <button className="btn btn-secondary btn-sm" onClick={() => onOpenCsvModal('orders')}>
              <Download size={13} style={{ transform: 'rotate(180deg)' }} /> Import Orders CSV
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: 'var(--space-3)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: 260, display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--fg-muted)' }} />
            <input
              type="text"
              className="input"
              style={{ paddingLeft: 32 }}
              placeholder="Search by order ID, customer name, or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm">Search</button>
        </form>

        {/* Status Filter */}
        <select
          className="select"
          style={{ width: 'auto', minWidth: 150 }}
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value);
            setPagination(p => ({ ...p, page: 1 }));
          }}
        >
          {statusOptions.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>

        {/* Origin Filter */}
        <select
          className="select"
          style={{ width: 'auto', minWidth: 140 }}
          value={originFilter}
          onChange={e => {
            setOriginFilter(e.target.value);
            setPagination(p => ({ ...p, page: 1 }));
          }}
        >
          <option value="">All Origins</option>
          <option value="demo">Demo Orders</option>
          <option value="sync">WooCommerce Synced</option>
          <option value="imported">CSV Imported</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-recessed)', color: 'var(--fg-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 14px' }}>Order</th>
                <th style={{ padding: '10px 14px' }}>Customer</th>
                <th style={{ padding: '10px 14px' }}>Date</th>
                <th style={{ padding: '10px 14px' }}>Origin</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
                <th style={{ padding: '10px 14px' }}>Items</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--fg-muted)' }}>
                    <RefreshCw size={18} className="animate-spin" style={{ margin: '0 auto 8px auto', color: 'var(--interactive)' }} />
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--fg-muted)' }}>
                    No orders match the current criteria.
                  </td>
                </tr>
              ) : (
                orders.map(o => (
                  <tr
                    key={o.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'background-color 0.1s ease',
                    }}
                    onClick={() => openOrderDrawer(o.id)}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        #{o.wc_order_id || o.id.slice(0, 8)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 500 }}>{o.customer_name || 'Guest Customer'}</span>
                        {o.is_guest === 1 && (
                          <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'var(--bg-recessed)', color: 'var(--fg-muted)' }}>
                            Guest
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{o.customer_email}</div>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--fg-secondary)', whiteSpace: 'nowrap' }}>
                      {o.date_created?.slice(0, 10)}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className={`badge badge-${o.origin}`}>{o.origin}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className={`badge badge-status-${o.status}`}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--fg-secondary)' }}>
                      {o.item_count} items
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600 }}>
                      ${parseFloat(o.total || '0').toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openOrderDrawer(o.id);
                        }}
                      >
                        Inspect &rarr;
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderTop: '1px solid var(--border-color)',
          fontSize: 12,
          color: 'var(--fg-secondary)',
        }}>
          <div>
            Showing {orders.length} of {pagination.totalCount} orders
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span>Page {pagination.page} of {pagination.totalPages || 1}</span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Order Detail Drawer */}
      {selectedOrderId && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'flex-end',
        }} onClick={() => setSelectedOrderId(null)}>
          <div
            className="drawer-content animate-fade-in"
            style={{
              width: '100%',
              maxWidth: 620,
              height: '100%',
              background: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-elevated)',
              overflowY: 'auto',
              padding: 'var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Top */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className={`badge badge-${orderDetails?.order?.origin || 'demo'}`} style={{ marginBottom: 6 }}>
                  {orderDetails?.order?.origin} ORDER
                </span>
                <h2>
                  Order #{orderDetails?.order?.wc_order_id || orderDetails?.order?.id?.slice(0, 8)}
                </h2>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
                  Placed on {orderDetails?.order?.date_created?.slice(0, 16).replace('T', ' ')}
                </div>
              </div>
              <button className="btn-ghost" onClick={() => setSelectedOrderId(null)}>
                <X size={18} />
              </button>
            </div>

            {detailsLoading || !orderDetails ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-muted)' }}>
                <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto', color: 'var(--interactive)' }} />
                Loading order details...
              </div>
            ) : (
              <>
                {/* Status Changer Header */}
                <div className="card" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 2 }}>Current Status</div>
                    <span className={`badge badge-status-${orderDetails.order.status}`} style={{ fontSize: 12 }}>
                      {orderDetails.order.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Change:</span>
                    <select
                      className="select"
                      style={{ width: 'auto', padding: '4px 8px', fontSize: 12 }}
                      value={orderDetails.order.status}
                      disabled={statusUpdating}
                      onChange={e => handleStatusChange(e.target.value)}
                    >
                      <option value="pending">Pending Payment</option>
                      <option value="processing">Processing</option>
                      <option value="on-hold">On-Hold</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="refunded">Refunded</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="card" style={{ padding: 14 }}>
                  <h4 style={{ marginBottom: 8 }}>Customer Association</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600 }}>{orderDetails.order.customer_name}</span>
                      {orderDetails.order.is_guest === 1 && (
                        <span className="badge badge-demo">Guest Checkout</span>
                      )}
                    </div>
                    <div style={{ color: 'var(--fg-secondary)' }}>{orderDetails.order.customer_email}</div>
                    {orderDetails.customer && (
                      <div style={{ fontSize: 11, color: 'var(--interactive)', marginTop: 4 }}>
                        Linked to Registered Customer Profile &bull; {orderDetails.customer.total_orders} lifetime orders
                      </div>
                    )}
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="card" style={{ padding: 14 }}>
                  <h4 style={{ marginBottom: 10 }}>Order Line Items ({orderDetails.order.items?.length || 0})</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {orderDetails.order.items?.map((item: any) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 10px',
                          background: 'var(--bg-recessed)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{item.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
                            SKU: {item.sku || 'N/A'} &bull; Qty: {item.quantity} &times; ${parseFloat(item.price || '0').toFixed(2)}
                          </div>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          ${parseFloat(item.total || '0').toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Financial Breakdown */}
                  <div style={{
                    marginTop: 14,
                    paddingTop: 12,
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    fontSize: 12,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--fg-secondary)' }}>
                      <span>Subtotal</span>
                      <span>${parseFloat(orderDetails.order.subtotal || '0').toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--fg-secondary)' }}>
                      <span>Shipping ({orderDetails.order.shipping_method_title || 'Ground'})</span>
                      <span>${parseFloat(orderDetails.order.shipping_total || '0').toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--fg-secondary)' }}>
                      <span>Tax (EST 8%)</span>
                      <span>${parseFloat(orderDetails.order.tax_total || '0').toFixed(2)}</span>
                    </div>
                    {orderDetails.order.discount_total > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success-fg)' }}>
                        <span>Discounts Applied</span>
                        <span>-${parseFloat(orderDetails.order.discount_total || '0').toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 15,
                      fontWeight: 600,
                      marginTop: 4,
                      paddingTop: 8,
                      borderTop: '1px solid var(--border-color)',
                    }}>
                      <span>Total</span>
                      <span>${parseFloat(orderDetails.order.total || '0').toFixed(2)} {orderDetails.order.currency}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Purchase History Cohort */}
                {orderDetails.previousOrders?.length > 0 && (
                  <div className="card" style={{ padding: 14 }}>
                    <h4 style={{ marginBottom: 8 }}>Customer's Other Recent Orders</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {orderDetails.previousOrders.map((po: any) => (
                        <div
                          key={po.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: 12,
                            padding: '6px 8px',
                            background: 'var(--bg-recessed)',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          <span>#{po.wc_order_id || po.id.slice(0, 8)} ({po.date_created?.slice(0, 10)})</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span className={`badge badge-status-${po.status}`}>{po.status}</span>
                            <span style={{ fontWeight: 600 }}>${parseFloat(po.total).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
