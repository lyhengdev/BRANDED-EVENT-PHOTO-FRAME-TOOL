import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';
import { X, Download, Copy, Check, QrCode as QrIcon } from 'lucide-react';
import { sound } from '../utils/soundEffects';

export default function QRCodeModal({ campaign, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const publicUrl = `${window.location.origin}/?f=${campaign?.slug}`;

  useEffect(() => {
    if (!isOpen || !campaign) return;

    QRCode.toDataURL(publicUrl, {
      width: 440,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [isOpen, campaign, publicUrl]);

  if (!isOpen || !campaign) return null;

  const handleCopyLink = () => {
    sound.playMechanicalClick();
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    sound.playShutterSound();
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR-${campaign.slug}.png`;
    a.click();
  };

  const handleClose = () => {
    sound.playMechanicalClick();
    onClose();
  };

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(5, 7, 14, 0.85)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
      }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="camera-chassis"
          style={{
            width: '100%',
            maxWidth: 480,
            padding: 28,
            position: 'relative'
          }}
        >
          {/* Corner Screws */}
          <div className="chassis-screw" style={{ top: 12, left: 12 }} />
          <div className="chassis-screw" style={{ top: 12, right: 12 }} />
          <div className="chassis-screw" style={{ bottom: 12, left: 12 }} />
          <div className="chassis-screw" style={{ bottom: 12, right: 12 }} />

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="btn-tactile btn-tactile-icon"
            style={{ position: 'absolute', top: 14, right: 14, width: 34, height: 34 }}
          >
            <X size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #6366f1 0%, #1e1b4b 100%)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <QrIcon size={20} color="#fff" />
            </div>
            <div>
              <h3 className="engraved-light" style={{ fontSize: '1.2rem' }}>Event QR Signage</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>High-res optical matrix for print badges & screens</p>
            </div>
          </div>

          {/* Physical Glossy Photo Card */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
            borderRadius: 'var(--radius-md)',
            padding: 24,
            textAlign: 'center',
            boxShadow: '0 12px 30px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(0,0,0,0.1)',
            marginBottom: 20,
            position: 'relative'
          }}>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#4338ca',
              marginBottom: 4
            }}>
              SCAN • POSITION • DOWNLOAD
            </div>
            <div style={{
              fontSize: '1.2rem',
              fontWeight: 900,
              color: '#090d16',
              fontFamily: 'var(--font-display)',
              marginBottom: 14
            }}>
              {campaign.eventTitle || campaign.name}
            </div>

            {qrDataUrl ? (
              <img 
                src={qrDataUrl} 
                alt="Event QR Code"
                style={{
                  width: 210,
                  height: 210,
                  display: 'block',
                  margin: '0 auto',
                  borderRadius: 6,
                  border: '1px solid rgba(0,0,0,0.06)'
                }} 
              />
            ) : (
              <div style={{ height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                Encoding optical matrix...
              </div>
            )}

            <div style={{
              marginTop: 12,
              fontSize: '0.75rem',
              color: '#475569',
              wordBreak: 'break-all',
              fontFamily: 'var(--font-mono)'
            }}>
              {publicUrl}
            </div>
          </div>

          {/* Tactile Hardware Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button onClick={handleDownloadQR} className="btn-tactile">
              <Download size={16} />
              <span>Download PNG</span>
            </button>

            <button 
              onClick={handleCopyLink} 
              className="btn-tactile"
              style={{
                background: 'linear-gradient(180deg, #4338ca 0%, #312e81 60%, #1e1b4b 100%)',
                color: '#fff'
              }}
            >
              {copied ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
