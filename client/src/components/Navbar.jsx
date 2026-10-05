import React, { useState } from 'react';
import { Camera, Volume2, VolumeX, Sparkles, PlusCircle, Lock, Unlock } from 'lucide-react';
import { sound } from '../utils/soundEffects';

export default function Navbar({ 
  currentView, 
  setView, 
  currentCampaign, 
  onNewCampaign,
  isAuthenticated,
  onLogout,
  onRequestAdmin 
}) {
  const [soundActive, setSoundActive] = useState(sound.isSoundEnabled());

  const handleToggleSound = () => {
    const next = sound.toggleSound();
    setSoundActive(next);
  };

  const handleSwitchToAttendee = () => {
    sound.playMechanicalClick();
    setView('attendee');
  };

  const handleSwitchToAdmin = () => {
    sound.playMechanicalClick();
    if (isAuthenticated) {
      setView('admin');
    } else {
      onRequestAdmin();
    }
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 60,
      background: 'linear-gradient(180deg, #1b2032 0%, #121524 60%, #0d101c 100%)',
      borderBottom: '2px solid #080a11',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.16)',
      padding: '8px 12px'
    }}>
      <div style={{
        maxWidth: 1300,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8
      }}>
        {/* Brand Emblem */}
        <div 
          onClick={handleSwitchToAttendee}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          {/* Heavy Metal Camera Lens Badge */}
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #475569 0%, #1e293b 60%, #090d16 100%)',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 3px 8px rgba(0,0,0,0.8), inset 0 2px 3px rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <Camera size={19} color="#f8fafc" />
            <span style={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#e11d48',
              boxShadow: '0 0 6px #e11d48'
            }} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: '1.1rem',
                letterSpacing: '0.04em',
                color: '#f8fafc',
                textShadow: '0 1px 2px rgba(0,0,0,0.9)'
              }}>
                FRAMECRAFT
              </span>
              <span className="engraved-text" style={{ fontSize: '0.6rem', background: '#0a0d16', padding: '1px 5px', borderRadius: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
                MK-IV
              </span>
            </div>
            <div className="hidden-mobile engraved-text" style={{ fontSize: '0.6rem', color: '#64748b' }}>
              TACTILE EVENT STUDIO
            </div>
          </div>
        </div>

        {/* Tactile Hardware Rocker Switch Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#090b14',
          padding: 3,
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.1)',
          border: '1px solid rgba(0,0,0,0.9)'
        }}>
          <button
            onClick={handleSwitchToAttendee}
            className={`btn-tactile ${currentView === 'attendee' ? 'active' : ''}`}
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              borderRadius: 'var(--radius-md)',
              gap: 6
            }}
          >
            <Sparkles size={14} />
            <span>Studio</span>
          </button>

          <button
            onClick={handleSwitchToAdmin}
            className={`btn-tactile ${currentView === 'admin' ? 'active' : ''}`}
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              borderRadius: 'var(--radius-md)',
              gap: 6
            }}
          >
            {isAuthenticated ? <Unlock size={14} color="#34d399" /> : <Lock size={14} color="#fbbf24" />}
            <span>Console</span>
          </button>
        </div>

        {/* Right Utility Bar: Audio Haptics, Security Status & Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Audio Synthesizer & Haptics Toggle */}
          <button
            onClick={handleToggleSound}
            className={`btn-tactile btn-tactile-icon ${soundActive ? '' : 'active'}`}
            title={soundActive ? 'Audio & Haptics Enabled' : 'Muted'}
            style={{ width: 34, height: 34 }}
          >
            {soundActive ? <Volume2 size={15} color="#34d399" /> : <VolumeX size={15} color="#94a3b8" />}
          </button>

          {/* Calibrated Hardware Status LED (hidden on narrow screens to prevent wrap) */}
          <div className="hidden-mobile" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#0a0d16',
            padding: '5px 10px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.08)',
            border: '1px solid rgba(0,0,0,0.8)'
          }}>
            <span className={`led-jewel ${isAuthenticated ? 'led-green' : 'led-blue'}`} />
            <span className="engraved-text" style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
              {isAuthenticated ? 'OPERATOR' : 'READY'}
            </span>
          </div>

          {currentView === 'admin' && isAuthenticated && (
            <>
              <button
                onClick={() => {
                  sound.playMechanicalClick();
                  onNewCampaign();
                }}
                className="btn-tactile"
                style={{
                  background: 'linear-gradient(180deg, #4338ca 0%, #312e81 60%, #1e1b4b 100%)',
                  color: '#fff',
                  padding: '6px 10px',
                  fontSize: '0.78rem'
                }}
              >
                <PlusCircle size={14} />
                <span className="hidden-mobile">New</span>
              </button>

              <button
                onClick={onLogout}
                className="btn-tactile"
                title="Lock Operator Console"
                style={{
                  padding: '6px 8px',
                  fontSize: '0.75rem',
                  color: '#f87171',
                  borderColor: 'rgba(239, 68, 68, 0.4)'
                }}
              >
                <Lock size={13} />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
