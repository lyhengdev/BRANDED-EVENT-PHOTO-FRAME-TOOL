import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CanvasEditor from './components/CanvasEditor';
import AdminDashboard from './components/AdminDashboard';
import CreateCampaignModal from './components/CreateCampaignModal';
import QRCodeModal from './components/QRCodeModal';

// Fallback seed campaigns in case API server is starting up
const DEFAULT_CAMPAIGNS = [
  {
    id: 'camp_mtf2026',
    slug: 'mtf2026',
    name: 'Modern Tech Frontier 2026',
    eventTitle: 'MTF 2026 Developer Summit',
    description: 'Create your official attendee badge & photo frame. Share with #MTF2026!',
    tagline: 'Connecting Builders of the Next Era',
    status: 'published',
    canvasWidth: 1080,
    canvasHeight: 1350,
    aspectRatio: '4:5',
    themeColor: '#6366f1',
    accentColor: '#06b6d4',
    frameType: 'preset',
    framePreset: 'tech-summit',
    frameMeta: {
      headline: 'MODERN TECH FRONTIER 2026',
      subline: 'OFFICIAL ATTENDEE • SAN FRANCISCO, CA',
      badgeText: 'DELEGATE',
      borderStyle: 'cyber-glow'
    }
  },
  {
    id: 'camp_summerbeats',
    slug: 'summerbeats2026',
    name: 'Summer Beats Music Fest',
    eventTitle: 'Summer Beats Fest 2026',
    description: 'Get your festival vibe on! Frame your party moment and share.',
    tagline: 'Feel the Sound • Live the Moment',
    status: 'published',
    canvasWidth: 1080,
    canvasHeight: 1080,
    aspectRatio: '1:1',
    themeColor: '#ec4899',
    accentColor: '#f59e0b',
    frameType: 'preset',
    framePreset: 'neon-fest',
    frameMeta: {
      headline: 'SUMMER BEATS 2026',
      subline: 'LIVE AT GOLDEN GATE PARK',
      badgeText: 'VIP ACCESS',
      borderStyle: 'neon-gradient'
    }
  },
  {
    id: 'camp_aisummit',
    slug: 'aisummit2026',
    name: 'Global AI Summit 2026',
    eventTitle: 'Global AI Summit • Story Edition',
    description: 'Vertical story frame for Instagram & TikTok. Share your conference highlights!',
    tagline: 'Intelligence Unleashed',
    status: 'published',
    canvasWidth: 1080,
    canvasHeight: 1920,
    aspectRatio: '9:16',
    themeColor: '#8b5cf6',
    accentColor: '#10b981',
    frameType: 'preset',
    framePreset: 'ai-story',
    frameMeta: {
      headline: 'GLOBAL AI SUMMIT',
      subline: 'OCTOBER 2026 • KEYNOTE ATTENDEE',
      badgeText: 'AI INNOVATOR',
      borderStyle: 'holographic'
    }
  }
];

export default function App() {
  const [campaigns, setCampaigns] = useState(DEFAULT_CAMPAIGNS);
  const [currentCampaign, setCurrentCampaign] = useState(DEFAULT_CAMPAIGNS[0]);
  const [currentView, setCurrentView] = useState('attendee'); // 'attendee' | 'admin'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [selectedQRCampaign, setSelectedQRCampaign] = useState(null);

  // Fetch campaigns from backend
  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCampaigns(data);
          // Check URL query param ?f=slug
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
      console.warn('API server connection: using local fallback campaigns.');
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSelectCampaign = (camp) => {
    setCurrentCampaign(camp);
    setCurrentView('attendee');
    // Update URL parameter without reload
    const url = new URL(window.location);
    url.searchParams.set('f', camp.slug);
    window.history.pushState({}, '', url);
  };

  const handleOpenQR = (camp) => {
    setSelectedQRCampaign(camp);
    setIsQRModalOpen(true);
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentView={currentView}
        setView={setCurrentView}
        currentCampaign={currentCampaign}
        onNewCampaign={() => setIsCreateModalOpen(true)}
      />

      <main style={{ flex: 1 }}>
        {currentView === 'attendee' && currentCampaign ? (
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
