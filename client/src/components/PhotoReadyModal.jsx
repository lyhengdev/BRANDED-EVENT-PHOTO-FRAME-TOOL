import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, Check, X, Sparkles, Heart, Smartphone } from 'lucide-react';
import { sound } from '../utils/soundEffects';

export default function PhotoReadyModal({ 
  isOpen, 
  onClose, 
  photoUrl, 
  photoBlob, 
  campaign 
}) {
  if (!isOpen || !photoUrl) return null;

  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const handleNativeSaveOrShare = async () => {
    sound.playMechanicalClick();
    if (!photoBlob) return;

    try {
      const filename = `${campaign?.slug || 'branded'}-photo-${Date.now()}.png`;
      const file = new File([photoBlob], filename, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: campaign?.eventTitle || campaign?.name || 'My Event Photo',
          text: `Check out my official event photo for ${campaign?.name || 'this event'}!`
        });
      } else if (navigator.share) {
        await navigator.share({
          title: campaign?.eventTitle || campaign?.name,
          text: 'Get your branded event frame photo:',
          url: window.location.href
        });
      } else {
        handleFileDownload();
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Share note:', err.message);
      }
    }
  };

  const handleFileDownload = () => {
    sound.playMechanicalClick();
    const a = document.createElement('a');
    a.href = photoUrl;
    a.download = `${campaign?.slug || 'branded'}-photo-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'rgba(4, 6, 12, 0.92)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 12px',
        overflowY: 'auto'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="camera-chassis"
          style={{
            width: '100%',
            maxWidth: 440,
            padding: '24px 18px',
            position: 'relative',
            maxHeight: '94vh',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Chassis Screws */}
          <div className="chassis-screw" style={{ top: 10, left: 10 }} />
          <div className="chassis-screw" style={{ top: 10, right: 10 }} />
          <div className="chassis-screw" style={{ bottom: 10, left: 10 }} />
          <div className="chassis-screw" style={{ bottom: 10, right: 10 }} />

          {/* Close Button */}
          <button
            type="button"
            onClick={() => {
              sound.playMechanicalClick();
              onClose();
            }}
            className="btn-tactile btn-tactile-icon"
            style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32 }}
          >
            <X size={15} />
          </button>

          {/* Top Status Header */}
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 2 }}>
              <span className="led-jewel led-green" />
              <h2 className="engraved-light" style={{ fontSize: '1.05rem', fontWeight: 800 }}>
                PHOTO DEVELOPED
              </h2>
            </div>
            <p className="engraved-text" style={{ fontSize: '0.62rem', color: '#64748b' }}>
              HIGH-FIDELITY OPTICAL COMPOSITE
            </p>
          </div>

          {/* Rendered Photo Film Print View */}
          <div style={{
            background: '#070912',
            padding: 8,
            borderRadius: 'var(--radius-md)',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.9), 0 4px 16px rgba(0,0,0,0.6)',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: 14,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden'
          }}>
            <img 
              src={photoUrl} 
              alt="Official Framed Photo" 
              style={{
                width: '100%',
                maxHeight: '44vh',
                objectFit: 'contain',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.8)'
              }}
            />
          </div>

          {/* Mobile Camera Roll Direct Guidance */}
          <div style={{
            background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 12px',
            marginBottom: 14,
            fontSize: '0.72rem',
            lineHeight: 1.45,
            color: '#cbd5e1',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#38bdf8', fontWeight: 700, marginBottom: 4 }}>
              <Smartphone size={14} />
              <span>HOW TO SAVE TO YOUR PHOTO ALBUM</span>
            </div>
            {isMobile ? (
              <span>
                Tap <strong>"Save to Photos / Share"</strong> below and choose <strong>"Save Image"</strong>, or <strong>tap & hold the photo above</strong> to save directly to your Camera Roll!
              </span>
            ) : (
              <span>
                Click <strong>"Save to Device"</strong> below to download the high-resolution photo file.
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Native Share / Save Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleNativeSaveOrShare}
              className="btn-shutter"
              style={{
                background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 60%, #1e3a8a 100%)',
                borderColor: '#3b82f6',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.5), inset 0 2px 3px rgba(255,255,255,0.4)',
                padding: '12px 20px',
                fontSize: '0.92rem'
              }}
            >
              <Share2 size={18} />
              <span>SAVE TO PHOTOS / SHARE</span>
            </motion.button>

            {/* Secondary Direct File Download */}
            <button
              onClick={handleFileDownload}
              className="btn-tactile"
              style={{ padding: '10px', fontSize: '0.82rem' }}
            >
              <Download size={15} />
              <span>Download File (.PNG)</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
