import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CanvasEditor from './components/CanvasEditor';
import AdminDashboard from './components/AdminDashboard';
import CreateCampaignModal from './components/CreateCampaignModal';
import QRCodeModal from './components/QRCodeModal';
import ConsoleAuthModal from './components/ConsoleAuthModal';
import { Sparkles, PlusCircle } from 'lucide-react';
import { sound } from './utils/soundEffects';

export default function App() {
  const [campaigns, setCampaigns] = useState([]);
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
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

  // Fetch campaigns from MongoDB backend
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/campaigns');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCampaigns(data);
          const params = new URLSearchParams(window.location.search);
          const slugParam = params.get('f');
          if (slugParam) {
            const found = data.find(c => c.slug === slugParam);
            if (found) {
              setCurrentCampaign(found);
              setCurrentView('attendee');
              return;
            }
          }
          setCurrentCampaign(data[0] || null);
        }
      }
    } catch (e) {
      console.error('Failed to load campaigns from MongoDB Atlas:', e);
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

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Confirm decommissioning of this event campaign channel?')) return;
    try {
      await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      const nextList = campaigns.filter(c => c.id !== id);
      setCampaigns(nextList);
      if (currentCampaign?.id === id) {
        setCurrentCampaign(nextList[0] || null);
      }
    } catch (err) {
      console.error('Delete error:', err);
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
        ) : currentView === 'attendee' && !currentCampaign ? (
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

      {/* Create Campaign Modal */}
      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(newCamp) => {
          setCampaigns(prev => [newCamp, ...prev]);
          setCurrentCampaign(newCamp);
          setCurrentView('attendee');
        }}
      />

      {/* QR Code Generator Modal */}
      <QRCodeModal
        campaign={selectedQRCampaign}
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />
    </div>
  );
}
