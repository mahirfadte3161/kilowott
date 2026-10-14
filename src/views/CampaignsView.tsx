import React, { useEffect, useState } from 'react';
import {
  Send,
  Plus,
  RefreshCw,
  X,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Users,
} from 'lucide-react';
import { api } from '../services/api.ts';

interface CampaignsViewProps {
  initialSegmentId?: string | null;
  initialSegmentName?: string | null;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({
  initialSegmentId,
  initialSegmentName,
}) => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [segments, setSegments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Campaign Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    subject: '',
    channel: 'email',
    target_segment_id: '',
    template_body: `Hello {{first_name}},\n\nThank you for being a valued customer.\n\nBest regards,\nThe Kilowatt Team`,
  });

  // Preview Drawer
  const [previewCampaign, setPreviewCampaign] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cmpRes, segRes] = await Promise.all([
        api.getCampaigns(),
        api.getSegments(),
      ]);

      if (cmpRes.success) setCampaigns(cmpRes.data);
      if (segRes.success) setSegments(segRes.data);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Pre-fill target segment if navigated from Segments page
  useEffect(() => {
    if (initialSegmentId) {
      setForm(prev => ({
        ...prev,
        target_segment_id: initialSegmentId,
        name: `Campaign for ${initialSegmentName || 'Segment'}`,
      }));
      setIsModalOpen(true);
    }
  }, [initialSegmentId, initialSegmentName]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createCampaign(form);
      if (res.success) {
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to create campaign:', err);
    }
  };

  const openPreview = async (campaign: any) => {
    try {
      setPreviewLoading(true);
      setDispatchStatus(null);
      const res = await api.getCampaign(campaign.id);
      if (res.success) {
        setPreviewCampaign(res.data);
      }
    } catch (err) {
      console.error('Failed to load campaign preview:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDispatch = async (campaignId: string) => {
    if (!confirm('Are you sure you want to dispatch this campaign to the targeted segment audience?')) return;

    try {
      setDispatchStatus('Dispatching messages...');
      const res = await api.sendCampaign(campaignId);
      if (res.success) {
        setDispatchStatus(`Successfully dispatched to ${res.data.sentCount} recipients and logged into Activity stream.`);
        fetchData();
      }
    } catch (err: any) {
      setDispatchStatus(`Dispatch failed: ${err.message}`);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Campaigns & Workflows</h1>
          <p style={{ color: 'var(--fg-secondary)' }}>
            Targeted customer communications, personalized template rendering, and delivery logs.
          </p>
        </div>

        <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
          <Plus size={13} /> Create Campaign Draft
        </button>
      </div>

      {/* Campaigns List */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-recessed)', color: 'var(--fg-muted)', fontSize: 11, textTransform: 'uppercase' }}>
              <th style={{ padding: '10px 14px' }}>Campaign</th>
              <th style={{ padding: '10px 14px' }}>Audience Segment</th>
              <th style={{ padding: '10px 14px' }}>Channel</th>
              <th style={{ padding: '10px 14px' }}>Status</th>
              <th style={{ padding: '10px 14px' }}>Sent Count</th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px 0', color: 'var(--fg-muted)' }}>
                  <RefreshCw size={18} className="animate-spin" style={{ margin: '0 auto 8px auto', color: 'var(--interactive)' }} />
                  Loading campaigns...
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--fg-muted)' }}>
                  No campaigns created yet. Click "Create Campaign Draft" above to begin.
                </td>
              </tr>
            ) : (
              campaigns.map(cmp => (
                <tr key={cmp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 500 }}>{cmp.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Subject: {cmp.subject}</div>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--fg-secondary)' }}>
                    {cmp.target_segment_name || 'All Customers'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: 'var(--bg-recessed)', textTransform: 'uppercase' }}>
                      {cmp.channel}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span className={`badge ${cmp.status === 'sent' ? 'badge-sync' : 'badge-demo'}`}>
                      {cmp.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 500 }}>
                    {cmp.sent_count} recipients
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openPreview(cmp)}>
                      <Eye size={13} /> Preview & Dispatch
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Campaign Modal */}
      {isModalOpen && (
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
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 540, padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>Create Campaign Draft</h3>
              <button className="btn-ghost" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Campaign Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. VIP Fall Audio Promotion"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Target Audience Segment</label>
                <select
                  className="select"
                  value={form.target_segment_id}
                  onChange={e => setForm({ ...form, target_segment_id: e.target.value })}
                >
                  <option value="">Select Target Audience...</option>
                  {segments.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.member_count} members)</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Subject Line</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. An exclusive offer just for you"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  required
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Email Template Body</label>
                  <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>Variables: &#123;&#123;first_name&#125;&#125;, &#123;&#123;email&#125;&#125;</span>
                </div>
                <textarea
                  className="textarea font-mono"
                  rows={6}
                  value={form.template_body}
                  onChange={e => setForm({ ...form, template_body: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save as Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview & Dispatch Drawer */}
      {previewCampaign && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'flex-end',
        }} onClick={() => setPreviewCampaign(null)}>
          <div
            className="drawer-content animate-fade-in"
            style={{
              width: '100%',
              maxWidth: 580,
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className={`badge ${previewCampaign.campaign.status === 'sent' ? 'badge-sync' : 'badge-demo'}`} style={{ marginBottom: 6 }}>
                  {previewCampaign.campaign.status.toUpperCase()}
                </span>
                <h2>{previewCampaign.campaign.name}</h2>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                  Targeting: {previewCampaign.campaign.target_segment_name || 'All'} ({previewCampaign.audienceCount} recipients)
                </div>
              </div>
              <button className="btn-ghost" onClick={() => setPreviewCampaign(null)}><X size={18} /></button>
            </div>

            {/* Email Preview Card */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
                Simulated Email Preview
              </div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--border-color)' }}>
                {previewCampaign.campaign.subject}
              </div>
              <div style={{
                whiteSpace: 'pre-line',
                fontSize: 13,
                color: 'var(--fg-secondary)',
                lineHeight: 1.6,
                padding: '12px',
                background: 'var(--bg-recessed)',
                borderRadius: 'var(--radius-sm)',
              }}>
                {previewCampaign.campaign.template_body
                  .replace(/{{first_name}}/g, previewCampaign.audienceSample?.[0]?.name || 'Elena')
                  .replace(/{{email}}/g, previewCampaign.audienceSample?.[0]?.email || 'elena.rostova@techcorp.io')}
              </div>
            </div>

            {/* Recipient Audience Sample */}
            <div className="card" style={{ padding: 14 }}>
              <h4 style={{ marginBottom: 8 }}>Audience Sample ({previewCampaign.audienceCount} Total Matching)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {previewCampaign.audienceSample?.map((sample: any) => (
                  <div key={sample.id} style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--bg-recessed)', borderRadius: 4 }}>
                    <span style={{ fontWeight: 500 }}>{sample.name}</span>
                    <span style={{ color: 'var(--fg-muted)' }}>{sample.email}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dispatch Action */}
            <div style={{
              padding: 16,
              background: 'var(--bg-recessed)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              <div style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>
                Dispatching will personalize this template for all <strong>{previewCampaign.audienceCount}</strong> recipients and register individual delivery records in the customer timelines and activity log.
              </div>

              {dispatchStatus && (
                <div style={{ fontSize: 12, padding: 8, borderRadius: 4, background: 'var(--interactive)', color: '#FFF' }}>
                  {dispatchStatus}
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={() => handleDispatch(previewCampaign.campaign.id)}
                disabled={previewCampaign.audienceCount === 0}
              >
                <Send size={14} /> Send Campaign to {previewCampaign.audienceCount} Recipients
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
