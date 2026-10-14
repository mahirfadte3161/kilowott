import React, { useEffect, useState } from 'react';
import {
  Activity,
  Mail,
  Clock,
  CheckCircle2,
  Plus,
  RefreshCw,
  X,
  User,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api.ts';

export const ActivityView: React.FC = () => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);

  // Add Task Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [taskSubject, setTaskSubject] = useState('');
  const [taskMessage, setTaskMessage] = useState('');

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await api.getActivities();
      if (res.success) setActivities(res.data.activities);
    } catch (err) {
      console.error('Failed to load activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersList = async () => {
    try {
      const res = await api.getCustomers({ limit: 100 });
      if (res.success) setCustomers(res.data.customers);
    } catch (err) {
      console.error('Failed to load customers for task selection:', err);
    }
  };

  useEffect(() => {
    fetchActivities();
    fetchCustomersList();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !taskSubject.trim()) return;

    try {
      const res = await api.createFollowUpTask(selectedCustomerId, taskSubject, taskMessage);
      if (res.success) {
        setIsModalOpen(false);
        setTaskSubject('');
        setTaskMessage('');
        fetchActivities();
      }
    } catch (err) {
      console.error('Failed to create follow-up task:', err);
    }
  };

  const toggleTaskStatus = async (activity: any) => {
    const nextStatus = activity.status === 'delivered' ? 'pending' : 'delivered';
    try {
      const res = await api.updateActivityStatus(activity.id, nextStatus);
      if (res.success) {
        setActivities(prev => prev.map(a => (a.id === activity.id ? res.data : a)));
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Activity & Workflows</h1>
          <p style={{ color: 'var(--fg-secondary)' }}>
            Chronological audit feed of customer interactions, campaign dispatches, and follow-up tasks.
          </p>
        </div>

        <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
          <Plus size={13} /> Add Follow-up Task
        </button>
      </div>

      {/* Activity Timeline Feed */}
      <div className="card" style={{ padding: 'var(--space-4)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--fg-muted)' }}>
            <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto', color: 'var(--interactive)' }} />
            Loading activity stream...
          </div>
        ) : activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--fg-muted)' }}>
            No customer communications or tasks logged yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activities.map(act => {
              const isTask = act.type === 'reminder' || act.type === 'task';
              const isResolved = act.status === 'delivered';

              return (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 14,
                    padding: '12px 14px',
                    background: 'var(--bg-recessed)',
                    borderRadius: 'var(--radius-sm)',
                    opacity: isResolved ? 0.75 : 1,
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 'var(--radius-sm)',
                      background: isTask ? 'var(--warning-bg)' : 'var(--info-bg)',
                      color: isTask ? 'var(--warning-fg)' : 'var(--info-fg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {isTask ? <Clock size={16} /> : <Mail size={16} />}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{act.subject}</span>
                        <span style={{
                          fontSize: 10,
                          padding: '1px 5px',
                          borderRadius: 4,
                          background: 'var(--bg-surface)',
                          color: 'var(--fg-muted)',
                          textTransform: 'uppercase',
                        }}>
                          {act.type}
                        </span>
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2 }}>
                        {act.message}
                      </div>

                      <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--fg-muted)', marginTop: 6 }}>
                        <span>Customer: <strong style={{ color: 'var(--fg-secondary)' }}>{act.customer_name}</strong></span>
                        <span>&bull;</span>
                        <span>{act.timestamp?.slice(0, 16).replace('T', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  {isTask && (
                    <button
                      className={`btn btn-sm ${isResolved ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => toggleTaskStatus(act)}
                    >
                      <CheckCircle2 size={13} /> {isResolved ? 'Resolved' : 'Mark Done'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Follow-Up Task Modal */}
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
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 460, padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3>Schedule Follow-up Task</h3>
              <button className="btn-ghost" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Select Customer</label>
                <select
                  className="select"
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  required
                >
                  <option value="">Choose a customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Task Action / Subject</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Follow up on inactive order inquiry"
                  value={taskSubject}
                  onChange={e => setTaskSubject(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>Internal Details / Notes</label>
                <textarea
                  className="textarea"
                  rows={3}
                  placeholder="Details for the support or account manager..."
                  value={taskMessage}
                  onChange={e => setTaskMessage(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
