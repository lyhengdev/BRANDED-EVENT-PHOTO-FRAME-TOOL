import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CanvasEditor from './components/CanvasEditor';
import AdminDashboard from './components/AdminDashboard';
import CreateCampaignModal from './components/CreateCampaignModal';
import QRCodeModal from './components/QRCodeModal';
import ConsoleAuthModal from './components/ConsoleAuthModal';
import { Sparkles, PlusCircle, Aperture } from 'lucide-react';
import { sound } from './utils/soundEffects';

// Stale-While-Revalidate: Instant synchronous cache retrieval from localStorage
function getCachedCampaigns() {
  try {
    const raw = localStorage.getItem('framecraft_cached_campaigns');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

export default function App() {
  const cachedList = getCachedCampaigns();
  const [campaigns, setCampaigns] = useState(cachedList);

  // Synchronously compute initial campaign for 0ms instantaneous display
  const getInitialCampaign = () => {
    if (cachedList.length === 0) return null;
    const params = new URLSearchParams(window.location.search);
    const slugParam = params.get('f');
    if (slugParam) {
      const match = cachedList.find(c => c.slug === slugParam);
      if (match) return match;
    }
    return cachedList[0];
  };

  const [currentCampaign, setCurrentCampaign] = useState(getInitialCampaign);
  // If we already have a cached campaign, don't show the initial loader
  const [loading, setLoading] = useState(cachedList.length === 0);
  const [currentView, setCurrentView] = useState('attendee'); // 'attendee' | 'admin'
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedQRCampaign, setSelectedQRCampaign] = useState(null);

  // Check existing session token on startup
  useEffect(() => {
    const savedToken = localStorage.getItem('framecraft_admin_token');
    if (savedToken) {
      fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('framecraft_admin_token');
            setIsAuthenticated(false);
          }
        })
        .catch(() => {
          setIsAuthenticated(false);
        });
    }
  }, []);

  // Fetch campaigns from backend (Vercel Edge cached + background revalidation)
  const fetchCampaigns = async () => {
    try {
      if (!currentCampaign) {
        setLoading(true);
      }

      const params = new URLSearchParams(window.location.search);
      const slugParam = params.get('f');

      // Fetch campaign list (and targeted slug if present) in parallel
      const [listRes, singleRes] = await Promise.all([
        fetch('/api/campaigns'),
        slugParam ? fetch(`/api/campaigns/${slugParam}`).catch(() => null) : Promise.resolve(null)
      ]);

      if (listRes.ok) {
        const data = await listRes.json();
        if (Array.isArray(data)) {
          setCampaigns(data);
          try {
            localStorage.setItem('framecraft_cached_campaigns', JSON.stringify(data));
          } catch {}

          if (slugParam) {
            const found = data.find(c => c.slug === slugParam);
            if (found) {
              setCurrentCampaign(found);
              setCurrentView('attendee');
              return;
            }
          }
          if (data.length > 0 && !currentCampaign) {
            setCurrentCampaign(data[0]);
          }
        }
      } else if (singleRes && singleRes.ok) {
        const singleData = await singleRes.json();
        if (singleData && singleData.id) {
          setCurrentCampaign(singleData);
          setCampaigns([singleData]);
        }
      }
    } catch (e) {
      console.error('Failed to load campaigns:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSelectCampaign = (camp) => {
    setCurrentCampaign(camp);
    setCurrentView('attendee');
    const url = new URL(window.location);
    url.searchParams.set('f', camp.slug);
    window.history.pushState({}, '', url);
  };

  const handleOpenQR = (camp) => {
    setSelectedQRCampaign(camp);
    setIsQRModalOpen(true);
  };

  const handleDeleteCampaign = async (target) => {
    const idOrSlug = target?.id || target?._id || target?.slug || target;
    if (!idOrSlug) return;

    if (!window.confirm('Confirm decommissioning of this event campaign channel?')) return;

    sound.playMechanicalClick();
    try {
      const res = await fetch(`/api/campaigns/${encodeURIComponent(idOrSlug)}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${res.status})`);
      }

      // Filter out deleted item by any matching identifier
      const nextList = campaigns.filter(c => 
        c.id !== idOrSlug && 
        c._id !== idOrSlug && 
        c.slug !== idOrSlug &&
        (target?.slug ? c.slug !== target.slug : true)
      );

      setCampaigns(nextList);
      try {
        localStorage.setItem('framecraft_cached_campaigns', JSON.stringify(nextList));
      } catch {}

      if (
        currentCampaign?.id === idOrSlug ||
        currentCampaign?._id === idOrSlug ||
        currentCampaign?.slug === idOrSlug ||
        (target?.slug && currentCampaign?.slug === target.slug)
      ) {
        setCurrentCampaign(nextList[0] || null);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Decommission failed: ' + err.message);
    }
  };

  const handleRequestAdmin = () => {
    if (isAuthenticated) {
      setCurrentView('admin');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    setCurrentView('admin');
  };

  const handleLogout = () => {
    sound.playMechanicalClick();
    localStorage.removeItem('framecraft_admin_token');
    setIsAuthenticated(false);
    setIsAuthModalOpen(false);
    setCurrentView('attendee');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentView={currentView}
        setView={setCurrentView}
        currentCampaign={currentCampaign}
        onNewCampaign={() => setIsCreateModalOpen(true)}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        onRequestAdmin={handleRequestAdmin}
      />

      <main style={{ flex: 1 }}>
        {currentView === 'attendee' && currentCampaign ? (
          <CanvasEditor
            campaign={currentCampaign}
            campaigns={campaigns}
            onSelectCampaign={handleSelectCampaign}
          />
        ) : currentView === 'attendee' && loading ? (
          /* High-End Camera Sensor Calibration Initializer */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '65vh',
            padding: 24,
            textAlign: 'center'
          }}>
            <div className="camera-chassis" style={{ maxWidth: 420, padding: '36px 20px', position: 'relative' }}>
              <div className="chassis-screw" style={{ top: 10, left: 10 }} />
              <div className="chassis-screw" style={{ top: 10, right: 10 }} />
              <div className="chassis-screw" style={{ bottom: 10, left: 10 }} />
              <div className="chassis-screw" style={{ bottom: 10, right: 10 }} />

              <div style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #0284c7 0%, #0369a1 60%, #082f49 100%)',
                border: '2px solid rgba(56, 189, 248, 0.4)',
                boxShadow: '0 0 25px rgba(56, 189, 248, 0.5), inset 0 2px 4px rgba(255,255,255,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Aperture size={32} color="#ffffff" className="spin-slow" />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
                <span className="led-jewel led-amber" />
                <h2 className="engraved-light" style={{ fontSize: '1.15rem' }}>
                  INITIALIZING OPTICAL SENSOR
                </h2>
              </div>
              <p className="engraved-text" style={{ fontSize: '0.65rem', color: '#64748b' }}>
                CALIBRATING EVENT FRAME CHANNEL...
              </p>
            </div>
          </div>
        ) : currentView === 'attendee' && !currentCampaign && !loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '65vh',
            padding: 24,
            textAlign: 'center'
          }}>
            <div className="camera-chassis" style={{ maxWidth: 460, padding: '40px 28px', position: 'relative' }}>
              <div className="chassis-screw" style={{ top: 12, left: 12 }} />
              <div className="chassis-screw" style={{ top: 12, right: 12 }} />
              <div className="chassis-screw" style={{ bottom: 12, left: 12 }} />
              <div className="chassis-screw" style={{ bottom: 12, right: 12 }} />

              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #3b4261 0%, #151828 100%)',
                border: '2px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Sparkles size={28} color="#818cf8" />
              </div>
              <h2 className="engraved-light" style={{ fontSize: '1.25rem', marginBottom: 8 }}>
                NO ACTIVE EVENT FRAME
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: 22, lineHeight: 1.5 }}>
                Database is clean and ready. Authorize in the Control Console to deploy your first branded frame channel.
              </p>
              <button
                onClick={handleRequestAdmin}
                className="btn-tactile"
                style={{
                  background: 'linear-gradient(180deg, #4338ca 0%, #312e81 60%, #1e1b4b 100%)',
                  color: '#fff',
                  padding: '12px 24px',
                  fontSize: '0.9rem'
                }}
              >
                <span>Authorize & Deploy Frame</span>
              </button>
            </div>
          </div>
        ) : (
          <AdminDashboard
            campaigns={campaigns}
            onSelectCampaign={handleSelectCampaign}
            onOpenCreate={() => setIsCreateModalOpen(true)}
            onOpenQR={handleOpenQR}
            onDeleteCampaign={handleDeleteCampaign}
          />
        )}
      </main>

      {/* Operator Security Clearance Modal */}
      <ConsoleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Create New Campaign Channel Modal */}
      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(newCamp) => {
          const updated = [newCamp, ...campaigns];
          setCampaigns(updated);
          try {
            localStorage.setItem('framecraft_cached_campaigns', JSON.stringify(updated));
          } catch {}
          setCurrentCampaign(newCamp);
          setCurrentView('attendee');
        }}
      />

      {/* Event QR Code Deployment Modal */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        campaign={selectedQRCampaign}
      />
    </div>
  );
}
