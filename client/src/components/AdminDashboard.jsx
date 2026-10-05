import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Image as ImageIcon, Download, TrendingUp, QrCode, 
  Trash2, PlusCircle, Copy, Check, Eye, Sparkles, Activity,
  Sliders, Radio
} from 'lucide-react';
import { sound } from '../utils/soundEffects';

export default function AdminDashboard({ 
  campaigns, 
  onSelectCampaign, 
  onOpenCreate, 
  onOpenQR, 
  onDeleteCampaign 
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
    sound.playMechanicalClick();
    const url = `${window.location.origin}/?f=${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePreview = (camp) => {
    sound.playMechanicalClick();
    onSelectCampaign(camp);
  };

  const handleQR = (camp) => {
    sound.playMechanicalClick();
    onOpenQR(camp);
  };

  const handleDelete = (id) => {
    sound.playMechanicalClick();
    onDeleteCampaign(id);
  };

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 20px 80px' }}>
      {/* Console Top Header Plate */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 28
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="engraved-light" style={{ fontSize: '1.8rem', letterSpacing: '-0.01em' }}>
              OPERATOR CONTROL CONSOLE
            </h1>
            <span className="led-jewel led-green" title="Telemetry Live" />
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: 4 }}>
            Real-time event telemetry, branded frame distribution, and high-res QR encoding
          </p>
        </div>

        <button 
          onClick={() => {
            sound.playMechanicalClick();
            onOpenCreate();
          }} 
          className="btn-tactile"
          style={{
            background: 'linear-gradient(180deg, #4338ca 0%, #312e81 60%, #1e1b4b 100%)',
            color: '#fff',
            padding: '12px 22px',
            fontSize: '0.95rem'
          }}
        >
          <PlusCircle size={18} />
          <span>Deploy New Campaign</span>
        </button>
      </div>

      {/* Analog / Digital Telemetry Meter Rack */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 16,
        marginBottom: 36
      }}>
        {/* Total Campaigns Gauge */}
        <div className="analog-gauge">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="engraved-text" style={{ fontSize: '0.7rem' }}>ACTIVE CAMPAIGNS</span>
            <Radio size={14} color="#818cf8" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>
            {campaigns.length.toString().padStart(2, '0')}
          </div>
          <div style={{ height: 4, background: '#171c2e', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #6366f1, #38bdf8)' }} />
          </div>
        </div>

        {/* Total Visits Gauge */}
        <div className="analog-gauge">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="engraved-text" style={{ fontSize: '0.7rem' }}>ATTENDEE VISITS</span>
            <Users size={14} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
            {analyticsOverview?.totalVisits?.toLocaleString() || '0'}
          </div>
          <div style={{ height: 4, background: '#171c2e', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
            <div style={{ width: analyticsOverview?.totalVisits ? '85%' : '0%', height: '100%', background: '#06b6d4' }} />
          </div>
        </div>

        {/* Photos Uploaded Gauge */}
        <div className="analog-gauge">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="engraved-text" style={{ fontSize: '0.7rem' }}>PHOTOS UPLOADED</span>
            <ImageIcon size={14} color="#ec4899" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#f472b6' }}>
            {analyticsOverview?.totalUploads?.toLocaleString() || '0'}
          </div>
          <div style={{ height: 4, background: '#171c2e', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
            <div style={{ width: analyticsOverview?.totalUploads ? '65%' : '0%', height: '100%', background: '#ec4899' }} />
          </div>
        </div>

        {/* HD Downloads Saved Gauge */}
        <div className="analog-gauge">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="engraved-text" style={{ fontSize: '0.7rem' }}>HD PHOTOS SAVED</span>
            <Download size={14} color="#10b981" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
            {analyticsOverview?.totalDownloads?.toLocaleString() || '0'}
          </div>
          <div style={{ height: 4, background: '#171c2e', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
            <div style={{ width: analyticsOverview?.totalDownloads ? '55%' : '0%', height: '100%', background: '#10b981' }} />
          </div>
        </div>

        {/* Conversion Efficiency */}
        <div className="analog-gauge">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span className="engraved-text" style={{ fontSize: '0.7rem' }}>CONVERSION EFFICIENCY</span>
            <TrendingUp size={14} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#fbbf24' }}>
            {analyticsOverview?.overallConversionRate || '0.0%'}
          </div>
          <div style={{ height: 4, background: '#171c2e', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
            <div style={{ width: analyticsOverview?.totalDownloads ? '37%' : '0%', height: '100%', background: '#f59e0b' }} />
          </div>
        </div>
      </div>

      {/* Campaigns Channel Rack */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="engraved-text" style={{ fontSize: '0.8rem' }}>
            FRAME CHANNELS [{campaigns.length}]
          </span>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="camera-chassis" style={{ padding: '40px 24px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
          <div style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #334155 0%, #0f172a 100%)',
            border: '2px solid rgba(255,255,255,0.15)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Sparkles size={26} color="#818cf8" />
          </div>
          <h3 className="engraved-light" style={{ fontSize: '1.25rem', marginBottom: 6 }}>
            NO EVENT CHANNELS DEPLOYED
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', maxWidth: 460, margin: '0 auto 22px' }}>
            The database is currently clean and fresh. Deploy your first branded frame channel to generate shareable links and high-res QR badges.
          </p>
          <button
            onClick={() => {
              sound.playMechanicalClick();
              onOpenCreate();
            }}
            className="btn-tactile"
            style={{
              background: 'linear-gradient(180deg, #4338ca 0%, #312e81 60%, #1e1b4b 100%)',
              color: '#fff',
              padding: '12px 24px',
              fontSize: '0.9rem'
            }}
          >
            <PlusCircle size={18} />
            <span>Deploy First Campaign</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {campaigns.map((camp, idx) => {
            const campStats = analyticsOverview?.campaigns?.find(c => c.campaignId === camp.id) || {
              visits: 0,
              photosUploaded: 0,
              downloads: 0
            };

            return (
            <motion.div 
              key={camp.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="camera-chassis"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
                borderRadius: 'var(--radius-lg)'
              }}
            >
              {/* Channel Meta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 260 }}>
                {/* Physical Frame Badge Dial */}
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 35%, ${camp.themeColor || '#6366f1'} 0%, #090c16 85%)`,
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <ImageIcon size={22} color="#fff" />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h3 className="engraved-light" style={{ fontSize: '1.1rem' }}>{camp.name}</h3>
                    <span className="led-jewel led-green" title="Published" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    <span>Ratio: <strong style={{ color: '#94a3b8' }}>{camp.aspectRatio || '4:5'}</strong></span>
                    <span>•</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>/?f={camp.slug}</span>
                  </div>
                </div>
              </div>

              {/* Hardware Telemetry Meter Pod */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                background: '#090c16',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--recessed-inner)',
                border: '1px solid rgba(0,0,0,0.9)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="engraved-text" style={{ fontSize: '0.6rem' }}>VISITS</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>
                    {campStats.visits?.toLocaleString() || 0}
                  </div>
                </div>
                <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div className="engraved-text" style={{ fontSize: '0.6rem' }}>EXPOSED</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                    {campStats.photosUploaded?.toLocaleString() || 0}
                  </div>
                </div>
                <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ textAlign: 'center' }}>
                  <div className="engraved-text" style={{ fontSize: '0.6rem' }}>SAVED</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
                    {campStats.downloads?.toLocaleString() || 0}
                  </div>
                </div>
              </div>

              {/* Physical Rocker Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => handlePreview(camp)}
                  className="btn-tactile"
                  style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                >
                  <Eye size={14} />
                  <span>Viewfinder</span>
                </button>

                <button
                  onClick={() => handleQR(camp)}
                  className="btn-tactile"
                  style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                >
                  <QrCode size={14} />
                  <span>QR Print</span>
                </button>

                <button
                  onClick={() => handleCopy(camp.slug, camp.id)}
                  className="btn-tactile"
                  style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                >
                  {copiedId === camp.id ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                  <span>{copiedId === camp.id ? 'Copied' : 'Link'}</span>
                </button>

                <button
                  onClick={() => handleDelete(camp.id)}
                  className="btn-tactile"
                  style={{ padding: '8px 10px', color: '#ef4444' }}
                  title="Decommission Campaign"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
      )}
    </div>
  );
}
