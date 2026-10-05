import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check, QrCode as QrIcon, Share2 } from 'lucide-react';

export default function QRCodeModal({ campaign, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const canvasRef = useRef(null);

  const publicUrl = `${window.location.origin}/?f=${campaign?.slug}`;

  useEffect(() => {
    if (!isOpen || !campaign) return;

    QRCode.toDataURL(publicUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [isOpen, campaign, publicUrl]);

  if (!isOpen || !campaign) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR-${campaign.slug}.png`;
    a.click();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }}>
      <div 
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: 480,
          background: '#12162a',
          padding: 28,
          borderRadius: 'var(--radius-xl)',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="btn btn-ghost btn-icon"
          style={{ position: 'absolute', top: 16, right: 16 }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(99, 102, 241, 0.2)',
            color: '#6366f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <QrIcon size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem' }}>Campaign QR Code</h3>
            <p style={{ fontSize: '0.85rem' }}>Scan to immediately open the attendee camera frame</p>
          </div>
        </div>

        {/* Printable Card Area */}
        <div style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          marginBottom: 20
        }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#4f46e5',
            marginBottom: 4
          }}>
            SCAN • UPLOAD • SHARE
          </div>
          <div style={{
            fontSize: '1.15rem',
            fontWeight: 800,
            color: '#0f172a',
            fontFamily: 'var(--font-display)',
            marginBottom: 16
          }}>
            {campaign.eventTitle || campaign.name}
          </div>

          {qrDataUrl ? (
            <img 
              src={qrDataUrl} 
              alt="Campaign QR Code"
              style={{
                width: 220,
                height: 220,
                display: 'block',
                margin: '0 auto',
                borderRadius: 8
              }} 
            />
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Generating QR Code...
            </div>
          )}

          <div style={{
            marginTop: 12,
            fontSize: '0.8rem',
            color: '#64748b',
            wordBreak: 'break-all',
            fontFamily: 'var(--font-mono)'
          }}>
            {publicUrl}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button onClick={handleDownloadQR} className="btn btn-secondary">
            <Download size={16} />
            <span>Download PNG</span>
          </button>

          <button onClick={handleCopyLink} className="btn btn-primary">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Copied!' : 'Copy Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
