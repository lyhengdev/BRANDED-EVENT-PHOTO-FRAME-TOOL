import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CanvasEditor from './components/CanvasEditor';
import AdminDashboard from './components/AdminDashboard';
import CreateCampaignModal from './components/CreateCampaignModal';
import QRCodeModal from './components/QRCodeModal';
import ConsoleAuthModal from './components/ConsoleAuthModal';
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
          }
        })
        .catch(() => {
          setIsAuthenticated(true);
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
        if (Array.isArray(data) && data.length > 0) {
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
          setCurrentCampaign(prev => data.find(c => c.id === prev?.id) || data[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load campaigns from MongoDB:', e);
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
        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 16
          }}>
            <div className="camera-chassis" style={{ padding: '24px 32px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
                <span className="led-jewel led-amber" />
                <span className="engraved-light" style={{ fontSize: '1rem' }}>
                  CONNECTING TO OPTICAL CLOUD...
                </span>
              </div>
              <p className="engraved-text" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                INITIALIZING MONGODB ATLAS TELEMETRY
              </p>
            </div>
          </div>
        ) : currentView === 'attendee' && currentCampaign ? (
          <CanvasEditor
            campaign={currentCampaign}
            campaigns={campaigns}
            onSelectCampaign={handleSelectCampaign}
          />
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
