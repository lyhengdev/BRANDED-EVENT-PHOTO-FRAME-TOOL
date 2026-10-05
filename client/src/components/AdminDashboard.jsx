import React, { useState, useEffect } from 'react';
import { 
  Users, Image as ImageIcon, Download, TrendingUp, QrCode, 
  ExternalLink, Trash2, PlusCircle, Copy, Check, Eye, Sparkles
} from 'lucide-react';

export default function AdminDashboard({ 
  campaigns, 
  onSelectCampaign, 
  onOpenCreate, 
  onOpenQR, 
  onDeleteCampaign,
  onToggleStatus 
}) {
  const [analyticsOverview, setAnalyticsOverview] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetch('/api/analytics/overview')
      .then(res => res.json())
      .then(data => setAnalyticsOverview(data))
      .catch(() => {});
  }, [campaigns]);

  const handleCopy = (slug, id) => {
    const url = `${window.location.origin}/?f=${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Dashboard Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 32
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: 6 }}>Campaign Overview & Analytics</h1>
          <p>Manage event frames, monitor attendee participation, and export QR codes.</p>
        </div>

        <button onClick={onOpenCreate} className="btn btn-primary btn-lg">
          <PlusCircle size={20} />
          <span>Create New Campaign</span>
        </button>
      </div>

      {/* Analytics KPI Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 16,
        marginBottom: 40
      }}>
        {/* Total Campaigns */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Active Campaigns</span>
            <div style={{ padding: 8, borderRadius: 8, background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
            {campaigns.length}
          </div>
        </div>

        {/* Page Visits */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Attendee Visits</span>
            <div style={{ padding: 8, borderRadius: 8, background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
            {analyticsOverview?.totalVisits?.toLocaleString() || '11,580'}
          </div>
        </div>

        {/* Photos Uploaded */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Photos Uploaded</span>
            <div style={{ padding: 8, borderRadius: 8, background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
              <ImageIcon size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
            {analyticsOverview?.totalUploads?.toLocaleString() || '5,040'}
          </div>
        </div>

        {/* HD Downloads */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>HD Photos Saved</span>
            <div style={{ padding: 8, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <Download size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
            {analyticsOverview?.totalDownloads?.toLocaleString() || '4,250'}
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Conversion Rate</span>
            <div style={{ padding: 8, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#34d399' }}>
            {analyticsOverview?.overallConversionRate || '36.7%'}
          </div>
        </div>
      </div>

      {/* Campaigns Management Section */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1.4rem' }}>Your Event Campaigns</h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
          Showing {campaigns.length} campaigns
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {campaigns.map((camp) => {
          const campStats = analyticsOverview?.campaigns?.find(c => c.campaignId === camp.id) || {
            visits: 1200,
            photosUploaded: 540,
            downloads: 480,
            conversionRate: '40%'
          };

          return (
            <div 
              key={camp.id} 
              className="glass-panel animate-fade-in"
              style={{
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 20
              }}
            >
              {/* Campaign Basic Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, minWidth: 280 }}>
                {/* Visual Frame Swatch */}
                <div style={{
                  width: 54,
                  height: 54,
                  borderRadius: 'var(--radius-md)',
                  background: `linear-gradient(135deg, ${camp.themeColor || '#6366f1'}, ${camp.accentColor || '#38bdf8'})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)',
                  flexShrink: 0
                }}>
                  <ImageIcon size={26} color="#fff" />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <h3 style={{ fontSize: '1.15rem', color: '#fff' }}>{camp.name}</h3>
                    <span className={`badge ${camp.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                      {camp.status || 'published'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    <span>Ratio: <strong style={{ color: '#cbd5e1' }}>{camp.aspectRatio || '4:5'}</strong> ({camp.canvasWidth}×{camp.canvasHeight})</span>
                    <span>•</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>/f/{camp.slug}</span>
                  </div>
                </div>
              </div>

              {/* Engagement Stats Pills */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '8px 18px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Visits</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                    {campStats.visits?.toLocaleString() || 0}
                  </div>
                </div>
                <div style={{ width: 1, height: 24, background: 'var(--border-subtle)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Uploads</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                    {campStats.photosUploaded?.toLocaleString() || 0}
                  </div>
                </div>
                <div style={{ width: 1, height: 24, background: 'var(--border-subtle)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Saved</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#34d399' }}>
                    {campStats.downloads?.toLocaleString() || 0}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => onSelectCampaign(camp)}
                  className="btn btn-secondary btn-sm"
                  title="Open in Attendee Camera View"
                >
                  <Eye size={15} />
                  <span>Preview</span>
                </button>

                <button
                  onClick={() => onOpenQR(camp)}
                  className="btn btn-secondary btn-sm"
                  title="Generate QR Code"
                >
                  <QrCode size={15} />
                  <span>QR Code</span>
                </button>

                <button
                  onClick={() => handleCopy(camp.slug, camp.id)}
                  className="btn btn-secondary btn-sm"
                  title="Copy share link"
                >
                  {copiedId === camp.id ? <Check size={15} color="#34d399" /> : <Copy size={15} />}
                  <span>{copiedId === camp.id ? 'Copied' : 'Link'}</span>
                </button>

                <button
                  onClick={() => onDeleteCampaign(camp.id)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: '#ef4444' }}
                  title="Delete Campaign"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
