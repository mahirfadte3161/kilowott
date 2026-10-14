import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { Sidebar, NavItem } from './components/Sidebar.tsx';
import { DashboardView } from './views/DashboardView.tsx';
import { ProductsView } from './views/ProductsView.tsx';
import { CategoriesView } from './views/CategoriesView.tsx';
import { AttributesView } from './views/AttributesView.tsx';
import { QualityView } from './views/QualityView.tsx';
import { InventoryView } from './views/InventoryView.tsx';
import { SyncView } from './views/SyncView.tsx';
import { ImportExportView } from './views/ImportExportView.tsx';
import { SettingsView } from './views/SettingsView.tsx';
import { api } from './services/api.ts';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<NavItem>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);

  // Cross-view state for catalog filtering
  const [catalogCategory, setCatalogCategory] = useState<string>('all');
  const [inventoryFilter, setInventoryFilter] = useState<string>('');

  const fetchSyncStatus = async () => {
    try {
      const res = await api.getWooCommerceStatus();
      if (res.success) {
        setSyncStatus(res.data);
      }
    } catch (err) {
      console.error('Failed to get status:', err);
    }
  };

  useEffect(() => {
    fetchSyncStatus();
  }, []);

  const handleTriggerSync = async () => {
    try {
      setSyncing(true);
      await api.syncWooCommerce(true);
      await fetchSyncStatus();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleNavigateWithCategory = (categoryName: string) => {
    setCatalogCategory(categoryName);
    setInventoryFilter('');
    setCurrentView('products');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-background)' }}>
      {/* 54px Fixed Header */}
      <Header
        currentView={currentView}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        syncStatus={syncStatus}
        onTriggerSync={handleTriggerSync}
        syncing={syncing}
      />

      {/* Main Layout Area */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          setCurrentView={(view) => {
            if (view !== 'products') {
              setCatalogCategory('all');
              setInventoryFilter('');
            }
            setCurrentView(view);
          }}
          collapsed={!sidebarOpen}
        />

        {/* View Canvas */}
        <main style={{ flex: 1, minWidth: 0, paddingBottom: 60, overflowY: 'auto' }}>
          {currentView === 'dashboard' && (
            <DashboardView onNavigate={setCurrentView} />
          )}

          {currentView === 'products' && (
            <ProductsView
              initialCategory={catalogCategory}
              initialFilter={inventoryFilter}
            />
          )}

          {currentView === 'categories' && (
            <CategoriesView
              onNavigate={setCurrentView}
              onFilterByCategory={handleNavigateWithCategory}
            />
          )}

          {currentView === 'attributes' && (
            <AttributesView />
          )}

          {currentView === 'quality' && (
            <QualityView />
          )}

          {currentView === 'inventory' && (
            <InventoryView />
          )}

          {currentView === 'sync' && (
            <SyncView />
          )}

          {currentView === 'import-export' && (
            <ImportExportView />
          )}

          {currentView === 'settings' && (
            <SettingsView
              onRefreshAll={fetchSyncStatus}
            />
          )}
        </main>
      </div>
    </div>
  );
};
