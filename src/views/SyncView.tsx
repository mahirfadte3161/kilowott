import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Layers,
  Package,
  Activity,
  ExternalLink,
  Server,
  Zap,
} from 'lucide-react';
import { api } from '../services/api.ts';

interface SyncStatus {
  storeUrl: string;
  hasCredentials: boolean;
  consumerKeyMasked: string;
  hasSecret: boolean;
  totalProducts: number;
  totalCategories: number;
  lastSyncAt: string | null;
  recentSyncJobs: Array<{
    id: string;
    job_type: string;
    status: string;
    records_synced: number;
    error_message: string | null;
    started_at: string;
    completed_at: string | null;
  }>;
}

export const SyncView: React.FC = () => {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latency?: number } | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.getWooCommerceStatus();
      if (res.success && res.data) {
        setStatus(res.data);
      }
    } catch (err) {
      console.error('Failed to get sync status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const startTime = performance.now();
      const res = await api.testWooCommerceConnection();
      const latency = Math.round(performance.now() - startTime);

      if (res.success) {
        setTestResult({
          success: true,
          message: `Connection successful! WooCommerce REST API responded in ${latency}ms.`,
          latency,
        });
      } else {
        setTestResult({
          success: false,
          message: res.error || 'Connection failed. Verify server network accessibility.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error while testing connection',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleTriggerSync = async (incremental = false) => {
    try {
      setSyncing(true);
      setSyncFeedback(null);
      const res = await api.syncWooCommerce(incremental);
      if (res.success) {
        const pCount = res.data?.products?.synced ?? res.data?.productsSynced ?? 0;
        const cCount = res.data?.categories?.synced ?? 0;
        setSyncFeedback({
          success: true,
          message: `Synchronization completed successfully! Synced ${pCount} products and ${cCount} categories.`,
        });
        await fetchStatus();
      } else {
        setSyncFeedback({
          success: false,
          message: res.error || 'Synchronization failed. Check error logs.',
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        success: false,
        message: err.message || 'Error executing WooCommerce synchronization',
      });
    } finally {
      setSyncing(false);
    }
  };

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
                background: 'rgba(59, 130, 246, 0.1)',
                color: 'var(--accent-blue)',
              }}
            >
              <RefreshCw size={18} />
            </span>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              WooCommerce Data Synchronization
            </h1>
          </div>
          <p style={{ margin: 'var(--space-1) 0 0 0', color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
            Direct REST API pipeline syncing product catalog, inventory levels, attributes, and category taxonomies.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            onClick={() => handleTriggerSync(true)}
            disabled={syncing || loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-sm)',
              fontWeight: 500,
              cursor: syncing ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            Incremental Sync
          </button>

          <button
            onClick={() => handleTriggerSync(false)}
            disabled={syncing || loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--accent-blue)',
              color: '#ffffff',
              fontSize: 'var(--font-sm)',
              fontWeight: 600,
              cursor: syncing ? 'not-allowed' : 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Zap size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing Catalog...' : 'Run Full Sync'}
          </button>
        </div>
      </div>

      {/* Sync Feedback Message Banner */}
      {syncFeedback && (
        <div
          style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            background: syncFeedback.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${syncFeedback.success ? 'var(--accent-green)' : 'var(--accent-red)'}`,
            color: syncFeedback.success ? 'var(--accent-green)' : 'var(--accent-red)',
            marginBottom: 'var(--space-5)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: 'var(--font-sm)',
          }}
        >
          {syncFeedback.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{syncFeedback.message}</span>
        </div>
      )}

      {/* Connection & Telemetry Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        {/* Connection Diagnostics Card */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Server size={16} style={{ color: 'var(--accent-blue)' }} />
              <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>
                Store Connection Endpoint
              </span>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 'var(--font-xs)',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: status?.hasCredentials ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: status?.hasCredentials ? 'var(--accent-green)' : 'var(--accent-red)',
              }}
            >
              <Activity size={12} />
              {status?.hasCredentials ? 'Configured & Active' : 'Disconnected'}
            </span>
          </div>

          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-tertiary)', width: 90 }}>Target URL:</span>
              <a
                href={status?.storeUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)' }}
              >
                {status?.storeUrl || 'Not set'} <ExternalLink size={11} />
              </a>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-tertiary)', width: 90 }}>API Key:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {status?.consumerKeyMasked || '••••••••'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--text-tertiary)', width: 90 }}>Credentials:</span>
              <span style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Shield size={12} /> Stored securely in backend environment
              </span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-3)' }}>
            <button
              onClick={handleTestConnection}
              disabled={testing}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-canvas)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-xs)',
                fontWeight: 600,
                cursor: testing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Activity size={13} className={testing ? 'animate-spin' : ''} />
              {testing ? 'Testing API Ping...' : 'Test Connection Latency'}
            </button>

            {testResult && (
              <div
                style={{
                  marginTop: 'var(--space-2)',
                  fontSize: 11,
                  color: testResult.success ? 'var(--accent-green)' : 'var(--accent-red)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {testResult.success ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Sync Telemetry Metrics */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <Package size={16} style={{ color: 'var(--accent-green)' }} />
              <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>
                Catalog Telemetry & Deduplication
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <div style={{ background: 'var(--bg-canvas)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Synced Products</div>
                <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>
                  {status?.totalProducts ?? 0}
                </div>
              </div>
              <div style={{ background: 'var(--bg-canvas)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Taxonomy Categories</div>
                <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--accent-blue)', marginTop: 2 }}>
                  {status?.totalCategories ?? 0}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <CheckCircle2 size={12} style={{ color: 'var(--accent-green)' }} />
                <span>Idempotent duplicate prevention enabled by WooCommerce ID and unique SKU</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={12} style={{ color: 'var(--text-tertiary)' }} />
                <span>
                  Last Sync:{' '}
                  {status?.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString() : 'Never synced'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Jobs Audit History */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>
            Recent Synchronization Jobs
          </div>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
            Last {status?.recentSyncJobs?.length || 0} executions
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--font-xs)' }}>
            <thead>
              <tr style={{ background: 'var(--bg-canvas)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Job ID</th>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Sync Target</th>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Records Synced</th>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Started</th>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>Completed</th>
              </tr>
            </thead>
            <tbody>
              {loading && (!status?.recentSyncJobs || status.recentSyncJobs.length === 0) ? (
                <tr>
                  <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    Loading job history...
                  </td>
                </tr>
              ) : !status?.recentSyncJobs || status.recentSyncJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                    No sync jobs recorded yet. Click "Run Full Sync" above to fetch catalog from WooCommerce.
                  </td>
                </tr>
              ) : (
                status.recentSyncJobs.map((job) => {
                  const isSuccess = job.status === 'completed';
                  return (
                    <tr key={job.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                        {job.id.slice(0, 8)}
                      </td>
                      <td style={{ padding: '10px 16px', fontWeight: 500, color: 'var(--text-primary)' }}>
                        Products & Categories
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: 10,
                            fontWeight: 600,
                            background: isSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: isSuccess ? 'var(--accent-green)' : 'var(--accent-red)',
                          }}
                        >
                          {isSuccess ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                          {job.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {job.records_synced}
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>
                        {new Date(job.started_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>
                        {job.completed_at ? new Date(job.completed_at).toLocaleString() : 'In Progress'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
