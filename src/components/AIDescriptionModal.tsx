import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Copy,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronDown,
  Briefcase,
  Megaphone,
  Search,
  MessageCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api.ts';

interface AIDescriptionModalProps {
  productId: string;
  productName: string;
  onClose: () => void;
}

type Tone = 'professional' | 'marketing' | 'seo' | 'casual';

interface GeneratedContent {
  shortDescription: string;
  longDescription: string;
  seoTitle: string;
  seoKeywords: string[];
  tone: Tone;
}

const TONE_CONFIG: Record<Tone, { label: string; icon: React.ReactNode; description: string; color: string }> = {
  professional: {
    label: 'Professional',
    icon: <Briefcase size={14} />,
    description: 'Formal, authoritative, builds trust',
    color: 'var(--accent-blue)',
  },
  marketing: {
    label: 'Marketing',
    icon: <Megaphone size={14} />,
    description: 'Energetic, persuasive, conversion-focused',
    color: 'var(--accent-amber)',
  },
  seo: {
    label: 'SEO Optimized',
    icon: <Search size={14} />,
    description: 'Keyword-rich, structured for search engines',
    color: 'var(--accent-green)',
  },
  casual: {
    label: 'Casual & Friendly',
    icon: <MessageCircle size={14} />,
    description: 'Conversational, approachable, relatable',
    color: 'var(--accent-purple)',
  },
};

export const AIDescriptionModal: React.FC<AIDescriptionModalProps> = ({
  productId,
  productName,
  onClose,
}) => {
  const [tone, setTone] = useState<Tone>('marketing');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'short' | 'long' | 'seo'>('long');

  const generate = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.generateDescription(productId, tone);
      if (res.success && res.data) {
        setResult(res.data);
        setActiveTab('long');
      } else {
        setError(res.error || 'AI generation failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const toneColor = TONE_CONFIG[tone].color;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1001,
          width: 'min(720px, 95vw)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 'var(--space-5)',
            borderBottom: '1px solid var(--border-color)',
            background: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(59,130,246,0.06) 100%)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 16px rgba(168,85,247,0.4)',
                  }}
                >
                  <Sparkles size={16} style={{ color: '#ffffff' }} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    AI Description Generator
                  </h2>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                    Powered by Google Gemini 2.0 Flash
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: 4, fontStyle: 'italic' }}>
                Generating for: <strong style={{ color: 'var(--text-primary)' }}>{productName}</strong>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-canvas)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tone Selector */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--border-color)',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Select Writing Tone
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {(Object.entries(TONE_CONFIG) as [Tone, typeof TONE_CONFIG[Tone]][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setTone(key)}
                style={{
                  padding: '10px 8px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${tone === key ? cfg.color : 'var(--border-color)'}`,
                  background: tone === key ? `${cfg.color}12` : 'var(--bg-canvas)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: tone === key ? cfg.color : 'var(--text-secondary)', marginBottom: 4 }}>
                  {cfg.icon}
                  <span style={{ fontWeight: 700, fontSize: 'var(--font-xs)' }}>{cfg.label}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', lineHeight: 1.3 }}>
                  {cfg.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-5)' }}>
          {/* Error State */}
          {error && (
            <div
              style={{
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid var(--accent-red)',
                color: 'var(--accent-red)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                marginBottom: 'var(--space-4)',
                fontSize: 'var(--font-sm)',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Empty State — No result yet */}
          {!result && !loading && !error && (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--space-10) var(--space-6)',
                color: 'var(--text-tertiary)',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(59,130,246,0.15))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                }}
              >
                <Sparkles size={28} style={{ color: 'var(--accent-purple)' }} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-base)', color: 'var(--text-primary)', marginBottom: 6 }}>
                Ready to generate AI-powered copy
              </div>
              <div style={{ fontSize: 'var(--font-sm)', maxWidth: 360, margin: '0 auto' }}>
                Select your preferred writing tone above, then click Generate. Gemini 2.0 Flash will analyze your product data and craft a complete description.
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--space-10)',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(59,130,246,0.1))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              >
                <Loader2 size={28} style={{ color: 'var(--accent-purple)', animation: 'spin 1s linear infinite' }} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-base)', color: 'var(--text-primary)', marginBottom: 6 }}>
                Gemini is crafting your description...
              </div>
              <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-tertiary)' }}>
                Analyzing product attributes, category, and pricing context
              </div>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div>
              {/* Tab Navigation */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-3)' }}>
                {[
                  { key: 'long', label: 'Full Description' },
                  { key: 'short', label: 'Short Summary' },
                  { key: 'seo', label: 'SEO Assets' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    style={{
                      padding: '5px 14px',
                      borderRadius: 'var(--radius-full)',
                      border: 'none',
                      background: activeTab === tab.key ? toneColor : 'transparent',
                      color: activeTab === tab.key ? '#ffffff' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: 'var(--font-xs)',
                      cursor: 'pointer',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Full Description */}
              {activeTab === 'long' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Full Product Description
                    </span>
                    <button
                      onClick={() => handleCopy(result.longDescription, 'long')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-canvas)',
                        color: copiedField === 'long' ? 'var(--accent-green)' : 'var(--text-secondary)',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {copiedField === 'long' ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                      {copiedField === 'long' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div
                    style={{
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-canvas)',
                      border: '1px solid var(--border-color)',
                      fontSize: 'var(--font-sm)',
                      color: 'var(--text-primary)',
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {result.longDescription}
                  </div>
                </div>
              )}

              {/* Short Description */}
              {activeTab === 'short' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Short Summary / Excerpt
                    </span>
                    <button
                      onClick={() => handleCopy(result.shortDescription, 'short')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-canvas)',
                        color: copiedField === 'short' ? 'var(--accent-green)' : 'var(--text-secondary)',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {copiedField === 'short' ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                      {copiedField === 'short' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div
                    style={{
                      padding: 'var(--space-4)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-canvas)',
                      border: '1px solid var(--border-color)',
                      fontSize: 'var(--font-sm)',
                      color: 'var(--text-primary)',
                      lineHeight: 1.7,
                    }}
                  >
                    {result.shortDescription}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
                    {result.shortDescription.length} / 150 characters — ideal for WooCommerce excerpt field
                  </div>
                </div>
              )}

              {/* SEO Assets */}
              {activeTab === 'seo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        SEO Page Title
                      </span>
                      <button
                        onClick={() => handleCopy(result.seoTitle, 'title')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                          borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                          background: 'var(--bg-canvas)',
                          color: copiedField === 'title' ? 'var(--accent-green)' : 'var(--text-secondary)',
                          fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        {copiedField === 'title' ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                        {copiedField === 'title' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div
                      style={{
                        padding: 'var(--space-3) var(--space-4)',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-canvas)',
                        border: '1px solid var(--border-color)',
                        fontSize: 'var(--font-sm)',
                        color: 'var(--accent-blue)',
                        fontWeight: 600,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {result.seoTitle}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                      {result.seoTitle.length} / 60 characters — {result.seoTitle.length <= 60 ? '✓ Within limit' : '⚠ Slightly over limit'}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Target Keywords
                      </span>
                      <button
                        onClick={() => handleCopy(result.seoKeywords.join(', '), 'keywords')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                          borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                          background: 'var(--bg-canvas)',
                          color: copiedField === 'keywords' ? 'var(--accent-green)' : 'var(--text-secondary)',
                          fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        {copiedField === 'keywords' ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                        {copiedField === 'keywords' ? 'Copied!' : 'Copy All'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {result.seoKeywords.map((kw, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '5px 12px',
                            borderRadius: 'var(--radius-full)',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid var(--accent-green)',
                            color: 'var(--accent-green)',
                            fontSize: 'var(--font-xs)',
                            fontWeight: 500,
                          }}
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tone badge */}
              <div
                style={{
                  marginTop: 'var(--space-4)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  background: `${toneColor}12`,
                  border: `1px solid ${toneColor}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  color: toneColor,
                  fontWeight: 600,
                }}
              >
                {TONE_CONFIG[result.tone as Tone]?.icon}
                Generated in {TONE_CONFIG[result.tone as Tone]?.label} tone
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            background: 'var(--bg-canvas)',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Sparkles size={11} style={{ color: 'var(--accent-purple)' }} />
            Google Gemini 2.0 Flash · Server-side inference
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {result && (
              <button
                onClick={generate}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--font-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={13} />
                Regenerate
              </button>
            )}

            <button
              onClick={generate}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 20px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: loading ? 'var(--border-color)' : 'linear-gradient(135deg, #a855f7, #3b82f6)',
                color: '#ffffff',
                fontSize: 'var(--font-sm)',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(168,85,247,0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              {loading ? (
                <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating...</>
              ) : (
                <><Sparkles size={14} /> {result ? 'Regenerate' : 'Generate Description'}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
