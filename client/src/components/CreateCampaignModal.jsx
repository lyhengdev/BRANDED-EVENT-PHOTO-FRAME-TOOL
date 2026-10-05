import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Sparkles, Check, Image as ImageIcon, Camera } from 'lucide-react';
import { sound } from '../utils/soundEffects';

const RESOLUTION_PRESETS = [
  { id: 'portrait', name: 'Portrait (4:5)', width: 1080, height: 1350, ratio: '4:5', desc: 'Instagram Feed & LinkedIn' },
  { id: 'square', name: 'Square (1:1)', width: 1080, height: 1080, ratio: '1:1', desc: 'Standard Feed & Avatars' },
  { id: 'story', name: 'Story (9:16)', width: 1080, height: 1920, ratio: '9:16', desc: 'TikTok, Reels, Full Screen' }
];

export default function CreateCampaignModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    eventTitle: '',
    description: '',
    tagline: '',
    aspectPreset: 'portrait',
    canvasWidth: 1080,
    canvasHeight: 1350,
    aspectRatio: '4:5',
    themeColor: '#6366f1',
    accentColor: '#06b6d4',
    frameType: 'preset',
    framePreset: 'tech-summit',
    frameUrl: ''
  });

  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleNameChange = (e) => {
    const name = e.target.value;
    const autoSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setFormData((prev) => ({
      ...prev,
      name,
      slug: autoSlug,
      eventTitle: prev.eventTitle || name
    }));
  };

  const handlePresetSelect = (preset) => {
    sound.playMechanicalClick();
    setFormData((prev) => ({
      ...prev,
      aspectPreset: preset.id,
      canvasWidth: preset.width,
      canvasHeight: preset.height,
      aspectRatio: preset.ratio
    }));
  };

  const handleFileUpload = async (e) => {
    sound.playMechanicalClick();
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setUploadPreview(URL.createObjectURL(file));

    const data = new FormData();
    data.append('frameImage', file);

    try {
      setIsUploading(true);
      setError('');
      const res = await fetch('/api/upload/frame', {
        method: 'POST',
        body: data
      });
      const result = await res.json();
      if (res.ok && result.fileUrl) {
        setFormData((prev) => ({
          ...prev,
          frameType: 'uploaded',
          frameUrl: result.fileUrl
        }));
      } else {
        setError(result.error || 'Failed to upload frame');
      }
    } catch (err) {
      setError('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    sound.playShutterSound();

    if (!formData.name.trim()) {
      setError('Please provide a campaign name');
      return;
    }

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create campaign');
      }

      const created = await res.json();
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err.message);
    }
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
            maxWidth: 680,
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: 30,
            position: 'relative'
          }}
        >
          {/* Corner Screws */}
          <div className="chassis-screw" style={{ top: 12, left: 12 }} />
          <div className="chassis-screw" style={{ top: 12, right: 12 }} />
          <div className="chassis-screw" style={{ bottom: 12, left: 12 }} />
          <div className="chassis-screw" style={{ bottom: 12, right: 12 }} />

          <button
            onClick={handleClose}
            className="btn-tactile btn-tactile-icon"
            style={{ position: 'absolute', top: 16, right: 16, width: 34, height: 34 }}
          >
            <X size={16} />
          </button>

          <div style={{ marginBottom: 20 }}>
            <h2 className="engraved-light" style={{ fontSize: '1.4rem', marginBottom: 4 }}>
              CALIBRATE NEW CAMPAIGN SLOT
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
              Setup target frame aspect ratio, transparent PNG overlay, and public attendee URL
            </p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              marginBottom: 18,
              fontSize: '0.85rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Campaign Name & Slug */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="engraved-text" style={{ display: 'block', fontSize: '0.7rem', marginBottom: 6 }}>
                  CAMPAIGN TITLE *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Developer Summit 2026"
                  value={formData.name}
                  onChange={handleNameChange}
                  required
                />
              </div>

              <div>
                <label className="engraved-text" style={{ display: 'block', fontSize: '0.7rem', marginBottom: 6 }}>
                  URL SLUG
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="summit-2026"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Event Headline & Subline */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label className="engraved-text" style={{ display: 'block', fontSize: '0.7rem', marginBottom: 6 }}>
                  EVENT HEADLINE
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Developer Summit"
                  value={formData.eventTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, eventTitle: e.target.value }))}
                />
              </div>

              <div>
                <label className="engraved-text" style={{ display: 'block', fontSize: '0.7rem', marginBottom: 6 }}>
                  BADGE TAGLINE
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Official Attendee Badge"
                  value={formData.tagline}
                  onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                />
              </div>
            </div>

            {/* Aspect Ratio Presets */}
            <div>
              <label className="engraved-text" style={{ display: 'block', fontSize: '0.7rem', marginBottom: 8 }}>
                ASPECT RATIO & CALIBRATION
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
                {RESOLUTION_PRESETS.map((preset) => {
                  const isSelected = formData.aspectPreset === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset)}
                      className="btn-tactile"
                      style={{
                        padding: '12px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        textAlign: 'left',
                        background: isSelected 
                          ? 'linear-gradient(180deg, #1e2238 0%, #151829 100%)' 
                          : undefined,
                        borderColor: isSelected ? 'var(--led-blue-glow)' : undefined
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: isSelected ? '#38bdf8' : '#f8fafc' }}>
                          {preset.name}
                        </span>
                        <span className={`led-jewel ${isSelected ? 'led-blue' : ''}`} style={{ width: 8, height: 8 }} />
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 4 }}>
                        {preset.width} × {preset.height} px
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Frame Overlay Type Selection */}
            <div>
              <label className="engraved-text" style={{ display: 'block', fontSize: '0.7rem', marginBottom: 8 }}>
                FRAME OVERLAY SOURCE
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {/* Dynamic Vector Preset */}
                <div
                  onClick={() => {
                    sound.playMechanicalClick();
                    setFormData(p => ({ ...p, frameType: 'preset' }));
                  }}
                  className={`btn-tactile ${formData.frameType === 'preset' ? 'active' : ''}`}
                  style={{ padding: 14, flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Sparkles size={16} color="#818cf8" />
                    <span style={{ fontSize: '0.85rem' }}>Dynamic Studio Vector</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    Vector badge frame auto-rendered with event headline & colors.
                  </div>
                </div>

                {/* Upload Custom PNG */}
                <div
                  onClick={() => {
                    sound.playMechanicalClick();
                    setFormData(p => ({ ...p, frameType: 'uploaded' }));
                  }}
                  className={`btn-tactile ${formData.frameType === 'uploaded' ? 'active' : ''}`}
                  style={{ padding: 14, flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Upload size={16} color="#06b6d4" />
                    <span style={{ fontSize: '0.85rem' }}>Upload PNG Frame</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    Upload your transparent PNG design (from Figma / Photoshop).
                  </div>
                </div>
              </div>

              {formData.frameType === 'uploaded' && (
                <div style={{ marginTop: 12 }}>
                  <label className="btn-tactile" style={{ width: '100%', cursor: 'pointer', padding: 12 }}>
                    <ImageIcon size={16} />
                    <span style={{ fontSize: '0.85rem' }}>
                      {isUploading ? 'Encoding...' : uploadedFile ? `Selected: ${uploadedFile.name}` : 'Choose Transparent PNG (with photo window)'}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/webp"
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Submit Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
              <button type="button" onClick={handleClose} className="btn-tactile">
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-tactile"
                disabled={isUploading}
                style={{
                  background: 'linear-gradient(180deg, #4338ca 0%, #312e81 60%, #1e1b4b 100%)',
                  color: '#fff',
                  padding: '12px 24px'
                }}
              >
                Deploy Campaign
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
