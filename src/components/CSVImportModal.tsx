import React, { useState } from 'react';
import {
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api.ts';

interface CSVImportModalProps {
  type: 'customers' | 'products' | 'orders';
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  type,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [csvText, setCsvText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2: Parsed data & mapping
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [onDuplicate, setOnDuplicate] = useState<'update' | 'skip'>('update');

  // Step 3: Result summary
  const [result, setResult] = useState<any | null>(null);

  if (!isOpen) return null;

  // Expected standard fields
  const requiredFields = type === 'customers'
    ? [
        { key: 'email', label: 'Email (Required for deduplication)', required: true },
        { key: 'first_name', label: 'First Name', required: false },
        { key: 'last_name', label: 'Last Name', required: false },
        { key: 'phone', label: 'Phone', required: false },
        { key: 'city', label: 'City', required: false },
        { key: 'state', label: 'State', required: false },
        { key: 'country', label: 'Country', required: false },
      ]
    : type === 'products'
    ? [
        { key: 'name', label: 'Product Name (Required)', required: true },
        { key: 'sku', label: 'SKU', required: false },
        { key: 'price', label: 'Price', required: true },
      ]
    : [
        { key: 'customer_email', label: 'Customer Email (Required)', required: true },
        { key: 'customer_name', label: 'Customer Name', required: false },
        { key: 'total', label: 'Order Total ($)', required: true },
        { key: 'order_number', label: 'Order # / ID', required: false },
        { key: 'status', label: 'Status', required: false },
        { key: 'date_created', label: 'Order Date', required: false },
      ];

  const handleParse = async () => {
    try {
      setParsing(true);
      setError(null);
      const res = await api.previewCSV(file || undefined, csvText || undefined);

      if (res.success && res.data.headers.length > 0) {
        setHeaders(res.data.headers);
        setPreviewRows(res.data.previewRows);
        setRawRows(res.data.rawRows);

        // Auto-match headers by normalized lower-casing
        const autoMap: Record<string, string> = {};
        for (const req of requiredFields) {
          const matched = res.data.headers.find(
            (h: string) => h.toLowerCase().replace(/[^a-z]/g, '') === req.key.toLowerCase().replace(/[^a-z]/g, '')
          );
          if (matched) {
            autoMap[req.key] = matched;
          }
        }
        setColumnMapping(autoMap);
        setStep(2);
      } else {
        setError(res.error || 'Failed to parse CSV. Please ensure valid header row and records.');
      }
    } catch (err: any) {
      setError(err.message || 'Error parsing CSV');
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    try {
      setImporting(true);
      setError(null);

      let res;
      if (type === 'customers') {
        res = await api.importCustomersCSV(rawRows, columnMapping, onDuplicate);
      } else if (type === 'products') {
        res = await api.importProductsCSV(rawRows, columnMapping);
      } else {
        res = await api.importOrdersCSV(rawRows, columnMapping);
      }

      if (res.success) {
        setResult(res.data);
        setStep(3);
        onSuccess();
      } else {
        setError(res.error || 'Import failed');
      }
    } catch (err: any) {
      setError(err.message || 'Import error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      zIndex: 120,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', padding: 'var(--space-6)' }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3>Import {type === 'customers' ? 'Customers' : type === 'products' ? 'Products' : 'Orders'} from CSV</h3>
            <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
              Step {step} of 3: {step === 1 ? 'Upload File' : step === 2 ? 'Column Mapping' : 'Summary'}
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        {error && (
          <div style={{
            padding: 10,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--danger-bg)',
            color: 'var(--danger-fg)',
            fontSize: 12,
            marginBottom: 14,
          }}>
            {error}
          </div>
        )}

        {/* STEP 1: Upload or Paste */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              border: '2px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: 24,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              background: 'var(--bg-recessed)',
            }}>
              <Upload size={24} style={{ color: 'var(--interactive)' }} />
              <div style={{ fontWeight: 500, fontSize: 13 }}>Choose CSV File</div>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                  }
                }}
              />
              {file && (
                <div style={{ fontSize: 12, color: 'var(--interactive)', fontWeight: 500 }}>
                  Selected: {file.name} ({Math.round(file.size / 1024)} KB)
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--fg-muted)' }}>or paste raw CSV text</div>

            <textarea
              className="textarea font-mono"
              rows={5}
              placeholder="first_name,last_name,email,phone,city&#10;John,Doe,john@example.com,+1234567,New York"
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleParse}
                disabled={(!file && !csvText.trim()) || parsing}
              >
                {parsing ? <RefreshCw size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                Proceed to Mapping
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Column Mapping & Preview */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>
              Map the columns from your CSV to standard CRM fields. <strong>{rawRows.length}</strong> rows detected.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {requiredFields.map(field => (
                <div key={field.key} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: 10 }}>
                  <label style={{ fontSize: 12, fontWeight: field.required ? 600 : 400 }}>
                    {field.label}
                  </label>
                  <select
                    className="select"
                    value={columnMapping[field.key] || ''}
                    onChange={e => setColumnMapping({ ...columnMapping, [field.key]: e.target.value })}
                  >
                    <option value="">— Select CSV Column —</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}

              {type === 'customers' && (
                <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: 10, marginTop: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 500 }}>Duplicate Handling</label>
                  <select
                    className="select"
                    value={onDuplicate}
                    onChange={e => setOnDuplicate(e.target.value as any)}
                  >
                    <option value="update">Update existing customer records</option>
                    <option value="skip">Skip duplicates</option>
                  </select>
                </div>
              )}
            </div>

            {/* Preview Sample Rows */}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 4, textTransform: 'uppercase' }}>
                Preview of First {previewRows.length} Rows
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 150, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-recessed)' }}>
                      {headers.map(h => (
                        <th key={h} style={{ padding: '4px 8px', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((r, idx) => (
                      <tr key={idx}>
                        {headers.map(h => (
                          <td key={h} style={{ padding: '4px 8px', borderBottom: '1px solid var(--border-color)' }}>{r[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button
                className="btn btn-primary"
                onClick={handleImport}
                disabled={
                  importing ||
                  (type === 'customers' && !columnMapping.email) ||
                  (type === 'products' && !columnMapping.name) ||
                  (type === 'orders' && !columnMapping.customer_email)
                }
              >
                {importing ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
                Execute Import
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Summary & Row Errors */}
        {step === 3 && result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--success-fg)' }}>
              <CheckCircle2 size={24} />
              <h4>Import Completed</h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <div style={{ padding: 12, background: 'var(--bg-recessed)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Newly Imported</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{result.imported}</div>
              </div>
              <div style={{ padding: 12, background: 'var(--bg-recessed)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Updated / Skipped</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>
                  {result.duplicatesUpdated || 0} updated &bull; {result.duplicatesSkipped || 0} skipped
                </div>
              </div>
              <div style={{ padding: 12, background: 'var(--bg-recessed)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Failed Rows</div>
                <div style={{ fontSize: 18, fontWeight: 600, color: result.failed > 0 ? 'var(--danger-fg)' : 'inherit' }}>
                  {result.failed}
                </div>
              </div>
            </div>

            {/* Row Errors */}
            {result.errors?.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--danger-fg)', marginBottom: 6 }}>
                  Row Validation Errors ({result.errors.length})
                </div>
                <div style={{ maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {result.errors.map((err: any, idx: number) => (
                    <div key={idx} style={{ fontSize: 11, padding: '4px 8px', background: 'var(--danger-bg)', color: 'var(--danger-fg)', borderRadius: 4 }}>
                      Row {err.row}: {err.message} {err.identifier && `(${err.identifier})`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn btn-primary" onClick={onClose}>
                Done & View Records
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
