import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  ShieldCheck,
  Package,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { api } from '../services/api.ts';

export const ImportExportView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');

  // Import State
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<{
    headers: string[];
    previewRows: any[];
    totalRows: number;
    rawRows: any[];
  } | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [parsing, setParsing] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const standardFields = [
    { key: 'name', label: 'Product Name', required: true },
    { key: 'sku', label: 'SKU Identifier', required: false },
    { key: 'price', label: 'Price (Current)', required: true },
    { key: 'regular_price', label: 'Regular Price', required: false },
    { key: 'sale_price', label: 'Sale Price', required: false },
    { key: 'stock_quantity', label: 'Stock Quantity', required: false },
    { key: 'stock_status', label: 'Stock Status (instock / outofstock)', required: false },
    { key: 'categories', label: 'Categories (comma-separated)', required: false },
    { key: 'description', label: 'Product Description', required: false },
    { key: 'product_type', label: 'Product Type (simple / variable)', required: false },
    { key: 'image_url', label: 'Primary Image URL', required: false },
  ];

  const handleFileUpload = async (uploadedFile: File) => {
    try {
      setFile(uploadedFile);
      setParsing(true);
      setImportError(null);
      setPreviewData(null);
      setImportResult(null);

      const res = await api.previewCSV(uploadedFile);
      if (res.success && res.data) {
        setPreviewData(res.data);

        // Auto-match headers by lower-case match
        const autoMap: Record<string, string> = {};
        const csvHeaders = res.data.headers || [];

        standardFields.forEach((field) => {
          const directMatch = csvHeaders.find(
            (h: string) => h.toLowerCase().trim() === field.key.toLowerCase().trim() ||
                           h.toLowerCase().trim() === field.label.toLowerCase().trim()
          );
          if (directMatch) {
            autoMap[field.key] = directMatch;
          } else if (field.key === 'name') {
            const nameMatch = csvHeaders.find((h: string) => h.toLowerCase().includes('name') || h.toLowerCase().includes('title'));
            if (nameMatch) autoMap[field.key] = nameMatch;
          } else if (field.key === 'price') {
            const priceMatch = csvHeaders.find((h: string) => h.toLowerCase().includes('price'));
            if (priceMatch) autoMap[field.key] = priceMatch;
          }
        });

        setColumnMapping(autoMap);
      } else {
        setImportError(res.error || 'Failed to parse CSV file');
      }
    } catch (err: any) {
      setImportError(err.message || 'Error processing CSV file');
    } finally {
      setParsing(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!previewData?.rawRows || previewData.rawRows.length === 0) return;
    if (!columnMapping['name']) {
      setImportError('Mapping for "Product Name" is required before import.');
      return;
    }

    try {
      setImporting(true);
      setImportError(null);
      const res = await api.importProductsCSV(previewData.rawRows, columnMapping);
      if (res.success) {
        setImportResult(res.data);
      } else {
        setImportError(res.error || 'Import operation failed');
      }
    } catch (err: any) {
      setImportError(err.message || 'Error executing product import');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadCSV = () => {
    window.location.href = '/api/csv/export/products';
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
              <FileSpreadsheet size={18} />
            </span>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
              Product Import & Export
            </h1>
          </div>
          <p style={{ margin: 'var(--space-1) 0 0 0', color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
            Standardized CSV data exchange with column mapping, preview verification, and duplicate SKU detection.
          </p>
        </div>

        {/* Tab Toggle */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: 3,
          }}
        >
          <button
            onClick={() => setActiveTab('export')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'export' ? 'var(--accent-blue)' : 'transparent',
              color: activeTab === 'export' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: 'var(--font-xs)',
              cursor: 'pointer',
            }}
          >
            <Download size={13} /> Export Catalog
          </button>
          <button
            onClick={() => setActiveTab('import')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'import' ? 'var(--accent-blue)' : 'transparent',
              color: activeTab === 'import' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: 'var(--font-xs)',
              cursor: 'pointer',
            }}
          >
            <Upload size={13} /> Import CSV
          </button>
        </div>
      </div>

      {/* EXPORT TAB */}
      {activeTab === 'export' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-6)' }}>
          {/* Export Action Card */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: 'var(--accent-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Download size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Download Complete Product Catalog
                </h3>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                  RFC 4180 compliant CSV export file
                </span>
              </div>
            </div>

            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-5)' }}>
              Export all catalog products with their WooCommerce IDs, SKUs, pricing structure (current, regular, sale), inventory counts, category taxonomies, permalinks, and publication statuses.
            </p>

            <button
              onClick={handleDownloadCSV}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'var(--accent-blue)',
                color: '#ffffff',
                fontSize: 'var(--font-sm)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Download size={16} /> Download woocommerce-prm-products.csv
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 'var(--space-4)',
                fontSize: 11,
                color: 'var(--accent-green)',
              }}
            >
              <ShieldCheck size={14} />
              <span>Zero sensitive credentials or store secrets included in exported data.</span>
            </div>
          </div>

          {/* Included Fields Specification */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-6)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <h3 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Included Data Columns
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
              {[
                'PRM Product ID',
                'WooCommerce ID',
                'Product Name',
                'SKU Identifier',
                'Product Type',
                'Current Price',
                'Regular Price',
                'Sale Price',
                'Stock Quantity',
                'Stock Status',
                'Manage Stock (1/0)',
                'Publish Status',
                'Featured (1/0)',
                'Categories List',
                'Store Permalink URL',
                'Record Origin',
                'Timestamps',
              ].map((col, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    padding: '4px 6px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-canvas)',
                  }}
                >
                  <CheckCircle2 size={12} style={{ color: 'var(--accent-green)' }} />
                  <span>{col}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* IMPORT TAB */}
      {activeTab === 'import' && (
        <div>
          {/* Step 1: Upload Box */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '2px dashed var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-8)',
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: 'var(--space-6)',
              transition: 'border-color 0.15s ease',
            }}
            onClick={() => document.getElementById('csv-file-input')?.click()}
          >
            <input
              id="csv-file-input"
              type="file"
              accept=".csv,text/csv"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 'var(--radius-full)',
                background: 'rgba(59, 130, 246, 0.1)',
                color: 'var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-3)',
              }}
            >
              <Upload size={22} />
            </div>
            <div style={{ fontWeight: 600, fontSize: 'var(--font-base)', color: 'var(--text-primary)' }}>
              {file ? file.name : 'Select or drop product CSV file to validate'}
            </div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 4 }}>
              Supports CSV with product names, SKUs, prices, categories, and inventory counts.
            </div>
          </div>

          {importError && (
            <div
              style={{
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--accent-red)',
                color: 'var(--accent-red)',
                marginBottom: 'var(--space-5)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                fontSize: 'var(--font-sm)',
              }}
            >
              <AlertCircle size={16} />
              <span>{importError}</span>
            </div>
          )}

          {/* Import Result Banner */}
          {importResult && (
            <div
              style={{
                padding: 'var(--space-5)',
                borderRadius: 'var(--radius-lg)',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid var(--accent-green)',
                color: 'var(--accent-green)',
                marginBottom: 'var(--space-6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 'var(--font-base)' }}>
                <CheckCircle2 size={18} />
                <span>Import Completed Successfully</span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-3)', fontSize: 'var(--font-sm)' }}>
                <div><strong>{importResult.imported}</strong> new products added</div>
                <div><strong>{importResult.duplicatesUpdated}</strong> existing products updated by SKU</div>
                {importResult.failed > 0 && (
                  <div style={{ color: 'var(--accent-red)' }}><strong>{importResult.failed}</strong> failed validation</div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Mapping & Preview if file loaded */}
          {previewData && (
            <div>
              {/* Column Mapping Card */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-5)',
                  marginBottom: 'var(--space-6)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Map CSV Columns to Product Fields
                    </h3>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                      Identified {previewData.totalRows} rows in file. Verify mapping before import.
                    </span>
                  </div>

                  <button
                    onClick={handleExecuteImport}
                    disabled={importing}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 18px',
                      borderRadius: 'var(--radius-md)',
                      border: 'none',
                      background: 'var(--accent-blue)',
                      color: '#ffffff',
                      fontSize: 'var(--font-sm)',
                      fontWeight: 600,
                      cursor: importing ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <CheckCircle2 size={14} />
                    {importing ? 'Importing Products...' : `Confirm & Import ${previewData.totalRows} Products`}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-3)' }}>
                  {standardFields.map((field) => (
                    <div key={field.key} style={{ background: 'var(--bg-canvas)', padding: '10px 12px', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {field.label}
                        </span>
                        {field.required && (
                          <span style={{ fontSize: 10, color: 'var(--accent-red)', fontWeight: 700 }}>Required</span>
                        )}
                      </div>
                      <select
                        value={columnMapping[field.key] || ''}
                        onChange={(e) => setColumnMapping({ ...columnMapping, [field.key]: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          fontSize: 'var(--font-xs)',
                          outline: 'none',
                        }}
                      >
                        <option value="">-- Ignore this field --</option>
                        {previewData.headers.map((h: string) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 3: Raw Preview Table */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--border-color)', fontWeight: 600, fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                  Previewing First 5 Rows
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-canvas)', borderBottom: '1px solid var(--border-color)' }}>
                        {previewData.headers.map((h: string, idx: number) => (
                          <th key={idx} style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.previewRows.map((row: any, rIdx: number) => (
                        <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          {previewData.headers.map((h: string, cIdx: number) => (
                            <td key={cIdx} style={{ padding: '8px 12px', color: 'var(--text-primary)' }}>
                              {row[h] || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
