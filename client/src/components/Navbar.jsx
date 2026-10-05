import React, { useState } from 'react';
import { Camera, Sliders, Volume2, VolumeX, Sparkles, LayoutDashboard, PlusCircle, ShieldCheck } from 'lucide-react';
import { sound } from '../utils/soundEffects';

export default function Navbar({ currentView, setView, currentCampaign, onNewCampaign }) {
  const [soundActive, setSoundActive] = useState(sound.isSoundEnabled());

  const handleToggleSound = () => {
    const next = sound.toggleSound();
    setSoundActive(next);
  };

  const handleSwitchView = (view) => {
    sound.playMechanicalClick();
    setView(view);
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 60,
      background: 'linear-gradient(180deg, #1b2032 0%, #121524 60%, #0d101c 100%)',
      borderBottom: '2px solid #080a11',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.16)',
      padding: '12px 20px'
    }}>
      <div style={{
        maxWidth: 1300,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        {/* Brand Emblem */}
        <div 
          onClick={() => handleSwitchView('attendee')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: 'pointer'
          }}
        >
          {/* Heavy Metal Camera Lens Badge */}
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #475569 0%, #1e293b 60%, #090d16 100%)',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 4px 10px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <Camera size={22} color="#f8fafc" />
            <span style={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#e11d48',
              boxShadow: '0 0 8px #e11d48'
            }} />
          </div>

          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: '1.25rem',
                letterSpacing: '0.04em',
                color: '#f8fafc',
                textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 -1px 0 rgba(255,255,255,0.2)'
              }}>
                FRAMECRAFT
              </span>
              <span className="engraved-text" style={{ fontSize: '0.65rem', background: '#0a0d16', padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.06)' }}>
                MK-IV
              </span>
            </div>
            <div className="engraved-text" style={{ fontSize: '0.65rem', color: '#64748b' }}>
              TACTILE EVENT STUDIO • OPTICAL ENGINE
            </div>
          </div>
        </div>

        {/* Tactile Hardware Rocker Switch Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#090b14',
          padding: 4,
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.1)',
          border: '1px solid rgba(0,0,0,0.9)'
        }}>
          <button
            onClick={() => handleSwitchView('attendee')}
            className={`btn-tactile ${currentView === 'attendee' ? 'active' : ''}`}
            style={{
              padding: '8px 18px',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <Sparkles size={15} />
            <span>Camera View</span>
          </button>

          <button
            onClick={() => handleSwitchView('admin')}
            className={`btn-tactile ${currentView === 'admin' ? 'active' : ''}`}
            style={{
              padding: '8px 18px',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <LayoutDashboard size={15} />
            <span>Control Console</span>
          </button>
        </div>

        {/* Right Utility Bar: Audio Haptics & Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Audio Synthesizer Toggle */}
          <button
            onClick={handleToggleSound}
            className={`btn-tactile btn-tactile-icon ${soundActive ? '' : 'active'}`}
            title={soundActive ? 'Mute Mechanical Audio' : 'Enable Mechanical Audio'}
            style={{ width: 38, height: 38 }}
          >
            {soundActive ? <Volume2 size={16} color="#34d399" /> : <VolumeX size={16} color="#94a3b8" />}
          </button>

          {/* Calibrated Hardware Status LED */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#0a0d16',
            padding: '6px 14px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.08)',
            border: '1px solid rgba(0,0,0,0.8)'
          }}>
            <span className="led-jewel led-green" />
            <span className="engraved-text" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              OPTICAL LINK
            </span>
          </div>

          {currentView === 'admin' && (
            <button
              onClick={() => {
                sound.playMechanicalClick();
                onNewCampaign();
              }}
              className="btn-tactile"
              style={{
                background: 'linear-gradient(180deg, #4338ca 0%, #312e81 60%, #1e1b4b 100%)',
                color: '#fff',
                padding: '8px 16px',
                fontSize: '0.85rem'
              }}
            >
              <PlusCircle size={16} />
              <span>Add Campaign</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
