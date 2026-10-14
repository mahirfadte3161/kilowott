import React from 'react';
import { Menu, Zap, RefreshCw, CheckCircle2, AlertCircle, Database } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle.tsx';

interface HeaderProps {
  currentView: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  syncStatus?: {
    isConfigured: boolean;
    lastSyncStatus: string;
    lastSyncAt: string | null;
  };
  onTriggerSync?: () => void;
  syncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  sidebarOpen,
  setSidebarOpen,
  syncStatus,
  onTriggerSync,
  syncing,
}) => {
  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'PIM Executive Dashboard';
      case 'products': return 'Product Catalog Management';
      case 'categories': return 'Categories & Taxonomies';
      case 'attributes': return 'Product Attributes & Tags';
      case 'quality': return 'Product Data Quality & Completeness';
      case 'inventory': return 'Inventory & Stock Monitoring';
      case 'sync': return 'WooCommerce Synchronization';
      case 'import-export': return 'Product Import & Export';
      case 'settings': return 'PIM Settings & Diagnostics';
      default: return 'Product Information Management';
    }
  };

  const isConnected = syncStatus?.lastSyncStatus === 'connected' || syncStatus?.lastSyncStatus === 'success';

  return (
    <header style={{
      height: 'var(--header-height)',
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--bg-surface)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--space-4)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: 'var(--shadow)',
    }}>
      {/* Left: Brand & View Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <button
          className="btn-ghost"
          style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--interactive)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
          }}>
            <Zap size={16} fill="currentColor" />
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.5px' }}>Kilowatt PIM</span>
          <span style={{
            fontSize: 11,
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-recessed)',
            color: 'var(--fg-secondary)',
            fontFamily: 'var(--font-mono)',
          }}>Product Information</span>
        </div>

        <div style={{ height: 16, width: 1, background: 'var(--border-color)', margin: '0 var(--space-2)' }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg-secondary)' }}>{getViewTitle()}</span>
      </div>

      {/* Right: Sync Status & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {/* Connection status badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-recessed)',
          fontSize: 12,
        }}>
          {isConnected ? (
            <>
              <CheckCircle2 size={13} style={{ color: 'var(--success-fg)' }} />
              <span style={{ color: 'var(--fg-secondary)' }}>Store Connected</span>
            </>
          ) : (
            <>
              <Database size={13} style={{ color: 'var(--warning-fg)' }} />
              <span style={{ color: 'var(--fg-secondary)' }}>Demo Mode Active</span>
            </>
          )}
        </div>

        {onTriggerSync && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={onTriggerSync}
            disabled={syncing}
            title="Trigger incremental WooCommerce sync"
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Syncing...' : 'Sync'}</span>
          </button>
        )}

        <ThemeToggle />
      </div>
    </header>
  );
};
