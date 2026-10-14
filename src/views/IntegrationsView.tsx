import React, { useEffect, useState } from 'react';
import {
  PlugZap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  ExternalLink,
  ShieldAlert,
  Save,
  Clock,
  ArrowRight,
  Database,
} from 'lucide-react';
import { api } from '../services/api.ts';

export const IntegrationsView: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [syncResult, setSyncResult] = useState<any | null>(null);

  // Form State
  const [storeUrl, setStoreUrl] = useState('');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.getWooCommerceStatus();
      if (res.success) {
        setStatus(res.data);
        setStoreUrl(res.data.storeUrl || '');
      }
    } catch (err) {
      console.error('Failed to load integration status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setFeedback(null);
      const res = await api.saveWooCommerceSettings({
        storeUrl,
        consumerKey: consumerKey.trim() || undefined,
        consumerSecret: consumerSecret.trim() || undefined,
        webhookSecret: webhookSecret.trim() || undefined,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: 'WooCommerce credentials updated securely in encrypted storage.' });
        fetchStatus();
        setConsumerKey('');
        setConsumerSecret('');
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to update credentials' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error saving settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const res = await api.testWooCommerceConnection();
      setTestResult(res.data);
      fetchStatus();
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleRunSync = async (incremental: boolean) => {
    try {
      setSyncing(true);
      setSyncResult(null);
      const res = await api.syncWooCommerce(incremental);
      if (res.success) {
        setSyncResult(res.data);
        fetchStatus();
      } else {
        setSyncResult({ error: res.error || 'Sync failed' });
      }
    } catch (err: any) {
      setSyncResult({ error: err.message || 'Sync error' });
    } finally {
      setSyncing(false);
    }
  };

  const isConnected = status?.lastSyncStatus === 'connected' || status?.lastSyncStatus === 'success';

  return (
    <div className="animate-fade-in" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div>
        <h1>WooCommerce REST Integration</h1>
        <p style={{ color: 'var(--fg-secondary)' }}>
          Secure, server-side bidirectional synchronization via official WooCommerce REST API v3.
        </p>
      </div>

      {/* Connection Status Banner */}
      <div className="card" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: isConnected ? 'var(--success-bg)' : 'var(--warning-bg)',
            color: isConnected ? 'var(--success-fg)' : 'var(--warning-fg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <PlugZap size={20} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontSize: 16 }}>
                {isConnected ? 'Active WooCommerce Store Connection' : 'Demo Mode / Store Disconnected'}
              </h3>
              <span className={`badge ${isConnected ? 'badge-sync' : 'badge-demo'}`}>
                {isConnected ? 'ONLINE' : 'DEMO MODE'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2 }}>
              Store URL: <code className="font-mono">{status?.storeUrl || 'None configured'}</code>
              {status?.lastSyncAt && ` • Last Synced: ${status.lastSyncAt.slice(0, 16).replace('T', ' ')}`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={handleTestConnection} disabled={testing}>
            <RefreshCw size={13} className={testing ? 'animate-spin' : ''} />
            {testing ? 'Verifying...' : 'Test Handshake'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => handleRunSync(true)} disabled={syncing}>
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Synchronizing...' : 'Incremental Sync'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleRunSync(false)} disabled={syncing}>
            Full Sync
          </button>
        </div>
      </div>

      {/* Test Handshake Feedback */}
      {testResult && (
        <div style={{
          padding: 14,
          borderRadius: 'var(--radius-sm)',
          background: testResult.success ? 'var(--success-bg)' : 'var(--danger-bg)',
          color: testResult.success ? 'var(--success-fg)' : 'var(--danger-fg)',
          boxShadow: 'var(--shadow)',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Sync Execution Feedback */}
      {syncResult && (
        <div className="card" style={{ padding: 14 }}>
          {syncResult.error ? (
            <div style={{ color: 'var(--danger-fg)', fontSize: 13 }}>
              <strong>Sync Error:</strong> {syncResult.error}
            </div>
          ) : (
            <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontWeight: 600, color: 'var(--success-fg)' }}>
                ✓ Sync Batch Completed (Job ID: {syncResult.jobId?.slice(0, 8)})
              </div>
              <div style={{ color: 'var(--fg-secondary)' }}>
                Processed: {syncResult.synced?.products} products, {syncResult.synced?.customers} customers, {syncResult.synced?.orders} orders.
              </div>
              {syncResult.errors?.length > 0 && (
                <div style={{ fontSize: 11, color: 'var(--warning-fg)', marginTop: 4 }}>
                  Warnings: {syncResult.errors.join(' | ')}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Credentials Form & Webhook Info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 'var(--space-4)' }}>
        {/* Credentials Form */}
        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Lock size={16} style={{ color: 'var(--interactive)' }} />
            <h3>Store REST API Credentials</h3>
          </div>

          <p style={{ fontSize: 12, color: 'var(--fg-secondary)', marginBottom: 16 }}>
            Generated inside WordPress via <strong>WooCommerce &gt; Settings &gt; Advanced &gt; REST API</strong>. Keys are encrypted server-side and never exposed to the client.
          </p>

          {feedback && (
            <div style={{
              padding: 10,
              borderRadius: 'var(--radius-sm)',
              fontSize: 12,
              marginBottom: 14,
              background: feedback.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
              color: feedback.type === 'success' ? 'var(--success-fg)' : 'var(--danger-fg)',
            }}>
              {feedback.message}
            </div>
          )}

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>WooCommerce Store URL</label>
              <input
                type="text"
                className="input font-mono"
                placeholder="https://your-store.com or http://localhost:8080"
                value={storeUrl}
                onChange={e => setStoreUrl(e.target.value)}
                required
              />
              <span style={{ fontSize: 11, color: 'var(--fg-muted)', display: 'block', marginTop: 3 }}>
                HTTPS required for remote stores. Local HTTP allowed for localhost/127.0.0.1.
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <label style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Consumer Key (ck_...)</label>
                {status?.consumerKeyMasked && (
                  <span style={{ fontSize: 11, color: 'var(--interactive)' }}>Stored: {status.consumerKeyMasked}</span>
                )}
              </div>
              <input
                type="password"
                className="input font-mono"
                placeholder={status?.consumerKeyMasked ? 'Enter new key to update' : 'ck_xxxxxxxxxxxxxxxxxxxxxxxx'}
                value={consumerKey}
                onChange={e => setConsumerKey(e.target.value)}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <label style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Consumer Secret (cs_...)</label>
                {status?.hasConsumerSecret && (
                  <span style={{ fontSize: 11, color: 'var(--interactive)' }}>Encrypted &bull; Secret Saved</span>
                )}
              </div>
              <input
                type="password"
                className="input font-mono"
                placeholder={status?.hasConsumerSecret ? 'Enter new secret to update' : 'cs_xxxxxxxxxxxxxxxxxxxxxxxx'}
                value={consumerSecret}
                onChange={e => setConsumerSecret(e.target.value)}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <label style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Webhook Secret (Optional)</label>
                {status?.hasWebhookSecret && (
                  <span style={{ fontSize: 11, color: 'var(--interactive)' }}>HMAC Verification Configured</span>
                )}
              </div>
              <input
                type="password"
                className="input font-mono"
                placeholder="Webhook secret for HMAC-SHA256 signature verification"
                value={webhookSecret}
                onChange={e => setWebhookSecret(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }} disabled={saving}>
              <Save size={14} /> {saving ? 'Encrypting & Saving...' : 'Save Integration Credentials'}
            </button>
          </form>
        </div>

        {/* Webhooks & Networking Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Real-time Webhooks */}
          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <h3 style={{ marginBottom: 8 }}>Incoming Webhook Endpoint</h3>
            <p style={{ fontSize: 12, color: 'var(--fg-secondary)', marginBottom: 12 }}>
              Receive instantaneous events whenever an order or customer is modified in WooCommerce.
            </p>

            <div style={{ padding: 10, background: 'var(--bg-recessed)', borderRadius: 'var(--radius-sm)', fontSize: 12, marginBottom: 12 }}>
              <div style={{ color: 'var(--fg-muted)', fontSize: 11, marginBottom: 2 }}>Webhook Delivery URL:</div>
              <code className="font-mono" style={{ color: 'var(--interactive)', fontWeight: 600 }}>
                {window.location.origin}/api/woocommerce/webhook
              </code>
            </div>

            <div style={{ fontSize: 12, color: 'var(--fg-secondary)', lineHeight: 1.5 }}>
              <strong>Supported Topics:</strong>
              <ul style={{ paddingLeft: 18, marginTop: 4 }}>
                <li><code>order.created</code> & <code>order.updated</code> (Real-time order sync)</li>
                <li><code>customer.created</code> & <code>customer.updated</code> (Customer directory updates)</li>
                <li><code>product.created</code> & <code>product.updated</code> (Stock level updates)</li>
              </ul>
            </div>
          </div>

          {/* Localhost & Networking Limitation Notice (Prompt Section 8 requirement) */}
          <div className="card" style={{ padding: 'var(--space-4)', borderLeft: '3px solid var(--interactive)' }}>
            <h4 style={{ marginBottom: 6 }}>Localhost & Networking Architecture</h4>
            <p style={{ fontSize: 12, color: 'var(--fg-secondary)', lineHeight: 1.5 }}>
              If your WooCommerce WordPress site is running on a local development server (e.g. <code>crm-demo-store.local</code>, <code>localhost:8080</code>, or Docker), requests are performed direct server-to-server within your local network. Webhooks from a local store can reach this backend directly on localhost without requiring public tunneling.
            </p>
          </div>
        </div>
      </div>

      {/* Sync Jobs Audit Trail */}
      <div className="card" style={{ padding: 'var(--space-4)' }}>
        <h3 style={{ marginBottom: 10 }}>Recent Synchronization Logs</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--fg-muted)', textTransform: 'uppercase' }}>
                <th style={{ padding: '8px 10px' }}>Job ID</th>
                <th style={{ padding: '8px 10px' }}>Type</th>
                <th style={{ padding: '8px 10px' }}>Status</th>
                <th style={{ padding: '8px 10px' }}>Records Synced</th>
                <th style={{ padding: '8px 10px' }}>Started</th>
                <th style={{ padding: '8px 10px' }}>Error Details</th>
              </tr>
            </thead>
            <tbody>
              {status?.recentSyncJobs?.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '20px 0', color: 'var(--fg-muted)' }}>
                    No sync jobs recorded yet.
                  </td>
                </tr>
              ) : (
                status?.recentSyncJobs?.map((job: any) => (
                  <tr key={job.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)' }}>{job.id.slice(0, 8)}</td>
                    <td style={{ padding: '8px 10px', textTransform: 'capitalize' }}>{job.job_type.replace('_', ' ')}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span className={`badge ${job.status === 'completed' ? 'badge-sync' : 'badge-demo'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px' }}>{job.records_synced} records</td>
                    <td style={{ padding: '8px 10px', color: 'var(--fg-secondary)' }}>{job.started_at?.slice(0, 16).replace('T', ' ')}</td>
                    <td style={{ padding: '8px 10px', color: job.error_message ? 'var(--danger-fg)' : 'var(--fg-muted)' }}>
                      {job.error_message || 'None'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
