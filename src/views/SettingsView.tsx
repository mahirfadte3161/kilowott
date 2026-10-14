import React, { useEffect, useState } from 'react';
import {
  Settings,
  Database,
  RefreshCw,
  Download,
  Server,
  Layers,
  Sliders,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { api } from '../services/api.ts';

interface SettingsViewProps {
  onRefreshAll?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onRefreshAll,
}) => {
  const [health, setHealth] = useState<any>(null);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const fetchSettingsAndHealth = async () => {
    try {
      const [hRes, sRes] = await Promise.all([
        api.getHealth(),
        api.getPrmSettings(),
      ]);
      setHealth(hRes);
      if (sRes.success && sRes.data?.low_stock_threshold) {
        setLowStockThreshold(parseInt(sRes.data.low_stock_threshold, 10));
      }
    } catch (err) {
      console.error('Failed to get settings/health:', err);
    }
  };

  useEffect(() => {
    fetchSettingsAndHealth();
  }, []);

  const handleSaveThreshold = async () => {
    try {
      setSavingSettings(true);
      setSaveSuccess(false);
      const res = await api.updatePrmSettings({ lowStockThreshold });
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        if (onRefreshAll) onRefreshAll();
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
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
            <Settings size={18} />
          </span>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            PIM System Settings & Configuration
          </h1>
        </div>
        <p style={{ margin: 'var(--space-1) 0 0 0', color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
          Inventory audit thresholds, SQLite database engine telemetry, and server health.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)' }}>
        {/* Inventory Configuration */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <Sliders size={16} style={{ color: 'var(--accent-blue)' }} />
            <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Inventory Health Rules
            </h3>
          </div>

          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 'var(--space-4)' }}>
            Configure low-stock alert thresholds. Products with managed stock at or below this level will be flagged as "Low Stock" across the PIM catalog.
          </p>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={{ display: 'block', fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Low Stock Warning Threshold (units)
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                type="number"
                min="1"
                max="1000"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Math.max(1, parseInt(e.target.value, 10) || 1))}
                style={{
                  width: 120,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-canvas)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 600,
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSaveThreshold}
                disabled={savingSettings}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'var(--accent-blue)',
                  color: '#ffffff',
                  fontSize: 'var(--font-xs)',
                  fontWeight: 600,
                  cursor: savingSettings ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {savingSettings ? 'Saving...' : 'Update Threshold'}
              </button>
            </div>
            {saveSuccess && (
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={12} />
                <span>Threshold updated and applied across inventory monitoring.</span>
              </div>
            )}
          </div>
        </div>

        {/* Server & DB Diagnostics */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <Server size={16} style={{ color: 'var(--accent-green)' }} />
            <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
              System Health & Runtime
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 'var(--font-xs)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Backend Server</span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>● {health?.status || 'Online'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Database Engine</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>SQLite (node:sqlite WAL Mode)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Process Uptime</span>
              <span style={{ color: 'var(--text-primary)' }}>{health?.uptime ? `${Math.round(health.uptime)} seconds` : 'Active'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Stack Environment</span>
              <span style={{ color: 'var(--text-primary)' }}>Node.js &bull; Express 5 &bull; Vite 6 &bull; React 18</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Catalog Export Card */}
      <div
        style={{
          marginTop: 'var(--space-6)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-5)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Package size={16} style={{ color: 'var(--accent-blue)' }} />
            <span>Product Catalog Quick Export</span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
            Directly export all synchronized WooCommerce product specifications, SKUs, and stock quantities to CSV.
          </p>
        </div>

        <button
          onClick={() => window.open('/api/csv/export/products', '_blank')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-canvas)',
            color: 'var(--text-primary)',
            fontSize: 'var(--font-xs)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Download size={13} /> Export Products CSV
        </button>
      </div>
    </div>
  );
};
