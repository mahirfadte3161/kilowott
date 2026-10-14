import React from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tags,
  ShieldCheck,
  Boxes,
  RefreshCw,
  FileSpreadsheet,
  Settings,
} from 'lucide-react';

export type NavItem =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'attributes'
  | 'quality'
  | 'inventory'
  | 'sync'
  | 'import-export'
  | 'settings';

interface SidebarProps {
  currentView: NavItem;
  setCurrentView: (view: NavItem) => void;
  collapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  collapsed,
}) => {
  const items: { id: NavItem; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
    { id: 'products', label: 'Product Catalog', icon: <Package size={17} /> },
    { id: 'categories', label: 'Categories', icon: <FolderTree size={17} /> },
    { id: 'attributes', label: 'Attributes & Tags', icon: <Tags size={17} /> },
    { id: 'quality', label: 'Data Quality', icon: <ShieldCheck size={17} /> },
    { id: 'inventory', label: 'Inventory Health', icon: <Boxes size={17} /> },
    { id: 'sync', label: 'Synchronization', icon: <RefreshCw size={17} /> },
    { id: 'import-export', label: 'Import / Export', icon: <FileSpreadsheet size={17} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={17} /> },
  ];

  return (
    <aside style={{
      width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
      height: 'calc(100vh - var(--header-height))',
      position: 'sticky',
      top: 'var(--header-height)',
      borderRight: '1px solid var(--border-color)',
      background: 'var(--bg-surface)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 'var(--space-3) var(--space-2)',
      transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 40,
      flexShrink: 0,
      boxShadow: 'var(--shadow)',
    }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {items.map(item => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--interactive)' : 'var(--fg-secondary)',
                background: isActive ? 'var(--bg-recessed)' : 'transparent',
                boxShadow: isActive ? 'var(--shadow)' : 'none',
                width: '100%',
                justifyContent: collapsed ? 'center' : 'flex-start',
                textAlign: 'left',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title={collapsed ? item.label : undefined}
            >
              <span style={{ color: isActive ? 'var(--interactive)' : 'var(--fg-muted)', display: 'flex', alignItems: 'center' }}>
                {item.icon}
              </span>
              {!collapsed && (
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer info in sidebar */}
      {!collapsed && (
        <div style={{
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-recessed)',
          fontSize: 11,
          color: 'var(--fg-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <div style={{ fontWeight: 600, color: 'var(--fg-primary)' }}>Kilowatt PIM</div>
          <div>Product Information Management</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success-fg)', display: 'inline-block' }} />
            <span style={{ color: 'var(--success-fg)', fontWeight: 500 }}>WooCommerce REST v3</span>
          </div>
        </div>
      )}
    </aside>
  );
};
