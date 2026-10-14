import React, { useEffect, useState } from 'react';
import {
  PieChart,
  Users,
  Sparkles,
  ArrowRight,
  Plus,
  RefreshCw,
  X,
  Send,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Clock,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { NavItem } from '../components/Sidebar.tsx';

interface SegmentsViewProps {
  onNavigate: (view: NavItem) => void;
  onLaunchCampaignForSegment: (segmentId: string, segmentName: string) => void;
}

export const SegmentsView: React.FC<SegmentsViewProps> = ({
  onNavigate,
  onLaunchCampaignForSegment,
}) => {
  const [segments, setSegments] = useState<any[]>([]);
  const [insightsData, setInsightsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Segment Members Drawer
  const [selectedSegment, setSelectedSegment] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Create Segment Modal
  const [isCreatingSegment, setIsCreatingSegment] = useState(false);
  const [newSegmentName, setNewSegmentName] = useState('');
  const [newSegmentDesc, setNewSegmentDesc] = useState('');
  const [newMinSpend, setNewMinSpend] = useState('300');
  const [newMinOrders, setNewMinOrders] = useState('2');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [segRes, insRes] = await Promise.all([
        api.getSegments(),
        api.getInsights(),
      ]);

      if (segRes.success) setSegments(segRes.data);
      if (insRes.success) setInsightsData(insRes.data);
    } catch (err) {
      console.error('Failed to load segments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openSegmentMembers = async (seg: any) => {
    setSelectedSegment(seg);
    try {
      setMembersLoading(true);
      const res = await api.getSegmentCustomers(seg.id);
      if (res.success) {
        setMembers(res.data.customers);
      }
    } catch (err) {
      console.error('Failed to load segment members:', err);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleCreateSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSegmentName.trim()) return;

    try {
      const res = await api.createSegment({
        name: newSegmentName.trim(),
        description: newSegmentDesc.trim(),
        rule_type: 'custom',
        rule_config: {
          min_spend: parseFloat(newMinSpend || '0'),
          min_orders: parseInt(newMinOrders || '0'),
        },
      });

      if (res.success) {
        setIsCreatingSegment(false);
        setNewSegmentName('');
        setNewSegmentDesc('');
        fetchData();
      }
    } catch (err) {
      console.error('Failed to create segment:', err);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Segments & Insights</h1>
          <p style={{ color: 'var(--fg-secondary)' }}>
            Dynamic, rule-based audience segmentation evaluated in real time from database records.
          </p>
        </div>

        <button className="btn btn-primary btn-sm" onClick={() => setIsCreatingSegment(true)}>
          <Plus size={13} /> Create Segment Rule
        </button>
      </div>

      {/* Customer Insights Cards (Calculated from database records) */}
      {insightsData && insightsData.hasData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} style={{ color: 'var(--interactive)' }} />
            <h3 style={{ fontSize: 16 }}>Behavioral Intelligence</h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-4)',
          }}>
            {insightsData.insights.map((ins: any) => (
              <div key={ins.id} className="card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--interactive)', textTransform: 'uppercase' }}>
                      {ins.type}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, background: 'var(--bg-recessed)', padding: '2px 6px', borderRadius: 4 }}>
                      {ins.metric}
                    </span>
                  </div>
                  <h4 style={{ marginBottom: 4 }}>{ins.title}</h4>
                  <p style={{ fontSize: 12, color: 'var(--fg-secondary)', lineHeight: 1.4 }}>{ins.description}</p>
                </div>

                <div style={{
                  padding: 8,
                  background: 'var(--bg-recessed)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 11,
                  color: 'var(--fg-secondary)',
                }}>
                  <strong style={{ color: 'var(--fg-primary)' }}>Action:</strong> {ins.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Segments Grid */}
      <div>
        <h3 style={{ marginBottom: 'var(--space-3)' }}>Configured Audience Segments</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--fg-muted)' }}>
            <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto', color: 'var(--interactive)' }} />
            Calculating segment memberships...
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-4)',
          }}>
            {segments.map(seg => (
              <div
                key={seg.id}
                className="card"
                style={{
                  padding: 'var(--space-4)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 14,
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: 'var(--bg-recessed)', color: 'var(--fg-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {seg.rule_type}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--interactive)' }}>
                      {seg.member_count} {seg.member_count === 1 ? 'Customer' : 'Customers'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 16, marginBottom: 4 }}>{seg.name}</h3>
                  <p style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>{seg.description || 'Configured dynamic rule criteria.'}</p>
                </div>

                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => openSegmentMembers(seg)}
                  >
                    <Users size={13} /> View Members
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onLaunchCampaignForSegment(seg.id, seg.name)}
                  >
                    <Send size={13} /> Target
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Segment Members Drawer */}
      {selectedSegment && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'flex-end',
        }} onClick={() => setSelectedSegment(null)}>
          <div
            className="drawer-content animate-fade-in"
            style={{
              width: '100%',
              maxWidth: 600,
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
                <span className="badge badge-sync" style={{ marginBottom: 6 }}>DYNAMIC RULE</span>
                <h2>{selectedSegment.name}</h2>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
                  {members.length} active matching customers
                </div>
              </div>
              <button className="btn-ghost" onClick={() => setSelectedSegment(null)}><X size={18} /></button>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 12,
              background: 'var(--bg-recessed)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <span style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Ready to reach this audience?</span>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onLaunchCampaignForSegment(selectedSegment.id, selectedSegment.name);
                  setSelectedSegment(null);
                }}
              >
                <Send size={13} /> Draft Campaign &rarr;
              </button>
            </div>

            {membersLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-muted)' }}>
                <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto', color: 'var(--interactive)' }} />
                Evaluating segment query...
              </div>
            ) : members.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--fg-muted)' }}>
                No customers currently match this segment rule.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {members.map(m => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: 'var(--bg-recessed)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 13,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {m.first_name} {m.last_name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.email}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600 }}>${parseFloat(m.lifetime_spend || '0').toFixed(2)}</div>
                      <div style={{ fontSize: 11, color: 'var(--fg-secondary)' }}>{m.total_orders} orders</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Custom Segment Modal */}
      {isCreatingSegment && (
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
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 440, padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>Create Custom Segment</h3>
              <button className="btn-ghost" onClick={() => setIsCreatingSegment(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateSegment} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Segment Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. VIP Enterprise Patrons"
                  value={newSegmentName}
                  onChange={e => setNewSegmentName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Description</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Customers with high lifetime spend"
                  value={newSegmentDesc}
                  onChange={e => setNewSegmentDesc(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Min Spend ($)</label>
                  <input
                    type="number"
                    className="input"
                    value={newMinSpend}
                    onChange={e => setNewMinSpend(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Min Orders</label>
                  <input
                    type="number"
                    className="input"
                    value={newMinOrders}
                    onChange={e => setNewMinOrders(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreatingSegment(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Segment Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
