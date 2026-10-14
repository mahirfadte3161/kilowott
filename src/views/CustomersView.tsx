import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Upload,
  Plus,
  RefreshCw,
  X,
  Tag,
  FileText,
  ShoppingBag,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from 'lucide-react';
import { api } from '../services/api.ts';

interface CustomersViewProps {}

export const CustomersView: React.FC<CustomersViewProps> = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [origin, setOrigin] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Drawer / Details Modal State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // New Note / New Tag inline states
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [createForm, setCreateForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    country: 'US',
  });
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers({
        page: pagination.page,
        limit: pagination.limit,
        search,
        origin,
        sortBy,
        sortDir,
      });

      if (res.success) {
        setCustomers(res.data.customers);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, origin, sortBy, sortDir]);

  // Handle Search submit / debounce
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    fetchCustomers();
  };

  // Open Customer Drawer
  const openCustomerDetails = async (id: string) => {
    setSelectedCustomerId(id);
    try {
      setDetailsLoading(true);
      const res = await api.getCustomer(id);
      if (res.success) {
        setCustomerDetails(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch customer details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Add Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedCustomerId) return;

    try {
      const res = await api.addCustomerNote(selectedCustomerId, newNote);
      if (res.success) {
        setCustomerDetails((prev: any) => ({
          ...prev,
          notes: [res.data, ...(prev.notes || [])],
        }));
        setNewNote('');
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  // Add Tag
  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim() || !selectedCustomerId) return;

    try {
      const res = await api.addCustomerTag(selectedCustomerId, newTag.trim());
      if (res.success) {
        setCustomerDetails((prev: any) => ({
          ...prev,
          tags: res.data,
        }));
        setNewTag('');
        // Also refresh customer in list
        fetchCustomers();
      }
    } catch (err) {
      console.error('Failed to add tag:', err);
    }
  };

  // Remove Tag
  const handleRemoveTag = async (tag: string) => {
    if (!selectedCustomerId) return;
    try {
      const res = await api.removeCustomerTag(selectedCustomerId, tag);
      if (res.success) {
        setCustomerDetails((prev: any) => ({
          ...prev,
          tags: res.data,
        }));
        fetchCustomers();
      }
    } catch (err) {
      console.error('Failed to remove tag:', err);
    }
  };

  // Create Customer Manual
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    try {
      const res = await api.createCustomer(createForm);
      if (res.success) {
        setIsCreatingCustomer(false);
        setCreateForm({ first_name: '', last_name: '', email: '', phone: '', city: '', state: '', country: 'US' });
        fetchCustomers();
        openCustomerDetails(res.data.id);
      } else {
        setCreateError(res.error || 'Failed to create customer');
      }
    } catch (err: any) {
      setCreateError(err.message || 'Error creating customer');
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Top Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Customers</h1>
          <p style={{ color: 'var(--fg-secondary)' }}>
            Searchable customer database with order histories, segmentation, and tags.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => window.open('/api/csv/export/customers', '_blank')}>
            <Download size={13} /> Export CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setIsCreatingCustomer(true)}>
            <Plus size={13} /> Add Customer
          </button>
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
              placeholder="Search by name, email, phone, or city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary btn-sm">Search</button>
        </form>

        {/* Origin filter */}
        <select
          className="select"
          style={{ width: 'auto', minWidth: 140 }}
          value={origin}
          onChange={e => {
            setOrigin(e.target.value);
            setPagination(p => ({ ...p, page: 1 }));
          }}
        >
          <option value="">All Origins</option>
          <option value="demo">Demo Records</option>
          <option value="sync">WooCommerce Synced</option>
          <option value="imported">CSV Imported</option>
        </select>

        {/* Sort By */}
        <select
          className="select"
          style={{ width: 'auto', minWidth: 160 }}
          value={`${sortBy}:${sortDir}`}
          onChange={e => {
            const [by, dir] = e.target.value.split(':');
            setSortBy(by);
            setSortDir(dir as any);
          }}
        >
          <option value="created_at:desc">Newest First</option>
          <option value="lifetime_spend:desc">Highest Lifetime Spend</option>
          <option value="total_orders:desc">Most Orders</option>
          <option value="name:asc">Name (A-Z)</option>
        </select>
      </div>

      {/* Customer Data Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-recessed)', color: 'var(--fg-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 14px' }}>Customer</th>
                <th style={{ padding: '10px 14px' }}>Origin</th>
                <th style={{ padding: '10px 14px' }}>Contact</th>
                <th style={{ padding: '10px 14px' }}>Location</th>
                <th style={{ padding: '10px 14px' }}>Orders</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Spend</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--fg-muted)' }}>
                    <RefreshCw size={18} className="animate-spin" style={{ margin: '0 auto 8px auto', color: 'var(--interactive)' }} />
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--fg-muted)' }}>
                    No customer records found matching your filters.
                  </td>
                </tr>
              ) : (
                customers.map(c => {
                  const fullName = `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Guest Customer';
                  return (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'background-color 0.1s ease',
                      }}
                      onClick={() => openCustomerDetails(c.id)}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 500, color: 'var(--fg-primary)' }}>{fullName}</div>
                        <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
                          {c.wc_customer_id ? `WC #${c.wc_customer_id}` : `ID: ${c.id.slice(0, 8)}`}
                        </div>
                        {c.tags && c.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                            {c.tags.slice(0, 2).map((t: string) => (
                              <span key={t} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'var(--bg-recessed)', color: 'var(--fg-secondary)' }}>
                                {t}
                              </span>
                            ))}
                            {c.tags.length > 2 && (
                              <span style={{ fontSize: 10, color: 'var(--fg-muted)' }}>+{c.tags.length - 2}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span className={`badge badge-${c.origin}`}>
                          {c.origin}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ color: 'var(--fg-secondary)' }}>{c.email}</div>
                        {c.phone && <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{c.phone}</div>}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--fg-secondary)' }}>
                        {[c.city, c.state, c.country].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontWeight: 500 }}>{c.total_orders}</span>
                        {c.total_orders >= 2 && (
                          <span style={{ fontSize: 10, marginLeft: 4, color: 'var(--success-fg)', fontWeight: 600 }}>Repeat</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 600 }}>
                        ${parseFloat(c.lifetime_spend || '0').toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCustomerDetails(c.id);
                          }}
                        >
                          View &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
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
            Showing {customers.length} of {pagination.totalCount} customers
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

      {/* Customer Details Drawer */}
      {selectedCustomerId && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'flex-end',
        }} onClick={() => setSelectedCustomerId(null)}>
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
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className={`badge badge-${customerDetails?.customer?.origin || 'demo'}`} style={{ marginBottom: 6 }}>
                  {customerDetails?.customer?.origin} RECORD
                </span>
                <h2>
                  {customerDetails?.customer?.first_name} {customerDetails?.customer?.last_name}
                </h2>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
                  ID: {customerDetails?.customer?.id}
                </div>
              </div>
              <button className="btn-ghost" onClick={() => setSelectedCustomerId(null)}>
                <X size={18} />
              </button>
            </div>

            {detailsLoading || !customerDetails ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-muted)' }}>
                <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto', color: 'var(--interactive)' }} />
                Loading customer profile...
              </div>
            ) : (
              <>
                {/* Stats summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <div style={{ padding: 12, background: 'var(--bg-recessed)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Total Orders</div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>{customerDetails.customer.total_orders}</div>
                  </div>
                  <div style={{ padding: 12, background: 'var(--bg-recessed)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Lifetime Spend</div>
                    <div style={{ fontSize: 18, fontWeight: 600 }}>${parseFloat(customerDetails.customer.lifetime_spend || '0').toFixed(2)}</div>
                  </div>
                  <div style={{ padding: 12, background: 'var(--bg-recessed)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Registered</div>
                    <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}>
                      {customerDetails.customer.registered_at?.slice(0, 10) || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Contact information */}
                <div className="card" style={{ padding: 14 }}>
                  <h4 style={{ marginBottom: 10 }}>Contact & Address</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Mail size={14} style={{ color: 'var(--fg-muted)' }} />
                      <a href={`mailto:${customerDetails.customer.email}`} style={{ color: 'var(--interactive)', textDecoration: 'none' }}>
                        {customerDetails.customer.email}
                      </a>
                    </div>
                    {customerDetails.customer.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Phone size={14} style={{ color: 'var(--fg-muted)' }} />
                        <span>{customerDetails.customer.phone}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <MapPin size={14} style={{ color: 'var(--fg-muted)', marginTop: 2 }} />
                      <span>
                        {[
                          customerDetails.customer.address_1,
                          customerDetails.customer.city,
                          customerDetails.customer.state,
                          customerDetails.customer.postcode,
                          customerDetails.customer.country,
                        ].filter(Boolean).join(', ') || 'No address on file'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tags management */}
                <div className="card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h4>Customer Tags</h4>
                    <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Categorization</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    {customerDetails.tags?.map((t: string) => (
                      <span
                        key={t}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          background: 'var(--bg-recessed)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 12,
                        }}
                      >
                        <Tag size={11} /> {t}
                        <button
                          style={{ marginLeft: 2, color: 'var(--fg-muted)', cursor: 'pointer' }}
                          onClick={() => handleRemoveTag(t)}
                          title="Remove tag"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                  <form onSubmit={handleAddTag} style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      className="input"
                      placeholder="Add tag (e.g. VIP, Urgent)..."
                      value={newTag}
                      onChange={e => setNewTag(e.target.value)}
                    />
                    <button type="submit" className="btn btn-secondary btn-sm">Add</button>
                  </form>
                </div>

                {/* Order History */}
                <div className="card" style={{ padding: 14 }}>
                  <h4 style={{ marginBottom: 10 }}>Linked Order History ({customerDetails.orders?.length || 0})</h4>
                  {customerDetails.orders?.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>No orders on record.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {customerDetails.orders.map((o: any) => (
                        <div
                          key={o.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 10px',
                            background: 'var(--bg-recessed)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 12,
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                              #{o.wc_order_id || o.id.slice(0, 8)}
                            </span>
                            <span style={{ marginLeft: 8, color: 'var(--fg-muted)' }}>{o.date_created?.slice(0, 10)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span className={`badge badge-status-${o.status}`}>{o.status}</span>
                            <span style={{ fontWeight: 600 }}>${parseFloat(o.total || '0').toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Internal Notes */}
                <div className="card" style={{ padding: 14 }}>
                  <h4 style={{ marginBottom: 10 }}>Internal Team Notes</h4>
                  <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    <textarea
                      className="textarea"
                      rows={2}
                      placeholder="Add private note regarding this customer..."
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-end' }}>
                      Save Note
                    </button>
                  </form>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {customerDetails.notes?.length === 0 ? (
                      <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>No team notes added yet.</div>
                    ) : (
                      customerDetails.notes.map((n: any) => (
                        <div
                          key={n.id}
                          style={{
                            padding: '8px 12px',
                            background: 'var(--bg-recessed)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 12,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--fg-muted)', fontSize: 11, marginBottom: 2 }}>
                            <span style={{ fontWeight: 500, color: 'var(--fg-secondary)' }}>{n.author}</span>
                            <span>{n.created_at?.slice(0, 16).replace('T', ' ')}</span>
                          </div>
                          <div>{n.note}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Manual Create Customer Modal */}
      {isCreatingCustomer && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 480, padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>Add New Customer</h3>
              <button className="btn-ghost" onClick={() => setIsCreatingCustomer(false)}><X size={18} /></button>
            </div>

            {createError && (
              <div style={{ padding: 10, background: 'var(--danger-bg)', color: 'var(--danger-fg)', borderRadius: 'var(--radius-sm)', fontSize: 12, marginBottom: 12 }}>
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>First Name</label>
                  <input
                    type="text"
                    className="input"
                    value={createForm.first_name}
                    onChange={e => setCreateForm({ ...createForm, first_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Last Name</label>
                  <input
                    type="text"
                    className="input"
                    value={createForm.last_name}
                    onChange={e => setCreateForm({ ...createForm, last_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Email (Normalized & Deduplicated)</label>
                <input
                  type="email"
                  className="input"
                  value={createForm.email}
                  onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Phone</label>
                  <input
                    type="text"
                    className="input"
                    value={createForm.phone}
                    onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>City</label>
                  <input
                    type="text"
                    className="input"
                    value={createForm.city}
                    onChange={e => setCreateForm({ ...createForm, city: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreatingCustomer(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
