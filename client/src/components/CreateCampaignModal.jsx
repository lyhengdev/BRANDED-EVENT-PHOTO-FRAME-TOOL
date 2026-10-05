import React, { useState } from 'react';
import { X, Upload, Sparkles, Check, Image as ImageIcon } from 'lucide-react';

const RESOLUTION_PRESETS = [
  { id: 'portrait', name: 'Portrait (4:5)', width: 1080, height: 1350, ratio: '4:5', desc: 'Instagram Post, LinkedIn, Facebook' },
  { id: 'square', name: 'Square (1:1)', width: 1080, height: 1080, ratio: '1:1', desc: 'Feed Posts, Profile Avatars' },
  { id: 'story', name: 'Story (9:16)', width: 1080, height: 1920, ratio: '9:16', desc: 'TikTok, Instagram & FB Stories, Reels' }
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
    frameType: 'preset', // 'preset' or 'uploaded'
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
    setFormData((prev) => ({
      ...prev,
      aspectPreset: preset.id,
      canvasWidth: preset.width,
      canvasHeight: preset.height,
      aspectRatio: preset.ratio
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setUploadPreview(URL.createObjectURL(file));

    // Upload to server
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

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(0, 0, 0, 0.8)',
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
          maxWidth: 680,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#111528',
          padding: 32,
          borderRadius: 'var(--radius-xl)',
          position: 'relative'
        }}
      >
        <button
          onClick={onClose}
          className="btn btn-ghost btn-icon"
          style={{ position: 'absolute', top: 20, right: 20 }}
        >
          <X size={20} />
        </button>

        <h2 style={{ fontSize: '1.5rem', marginBottom: 6 }}>Create New Event Campaign</h2>
        <p style={{ fontSize: '0.9rem', marginBottom: 24 }}>
          Setup your event branding, frame resolution, and audience sharing link.
        </p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: 20,
            fontSize: '0.85rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Campaign Name & Slug */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                Campaign Name *
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Design Con 2026"
                value={formData.name}
                onChange={handleNameChange}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                Public URL Slug
              </label>
              <input
                type="text"
                className="input"
                placeholder="designcon-2026"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Event Title & Tagline */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                Event Headline
              </label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Design Con Annual Summit"
                value={formData.eventTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, eventTitle: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                Subline / Tagline
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

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
              Description & Instructions for Users
            </label>
            <textarea
              className="textarea"
              rows={2}
              placeholder="Upload your best photo and share with #DesignCon2026"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {/* Resolution Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>
              Canvas Dimensions & Aspect Ratio
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {RESOLUTION_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: formData.aspectPreset === preset.id ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: formData.aspectPreset === preset.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <strong style={{ fontSize: '0.9rem' }}>{preset.name}</strong>
                    {formData.aspectPreset === preset.id && <Check size={16} color="var(--accent-primary)" />}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{preset.width} × {preset.height} px</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: 4 }}>{preset.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Frame Graphic Choice */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>
              Branded Frame Overlay
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* Preset Frame */}
              <div
                onClick={() => setFormData(p => ({ ...p, frameType: 'preset' }))}
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius-md)',
                  background: formData.frameType === 'preset' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: formData.frameType === 'preset' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Sparkles size={18} color="var(--accent-primary)" />
                  <strong style={{ fontSize: '0.95rem' }}>Dynamic Pro Preset</strong>
                </div>
                <p style={{ fontSize: '0.8rem' }}>
                  Auto-generated vector badge frame with dynamic event typography and gradient styling.
                </p>
              </div>

              {/* Upload Custom PNG */}
              <div
                onClick={() => setFormData(p => ({ ...p, frameType: 'uploaded' }))}
                style={{
                  padding: 16,
                  borderRadius: 'var(--radius-md)',
                  background: formData.frameType === 'uploaded' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: formData.frameType === 'uploaded' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Upload size={18} color="#06b6d4" />
                  <strong style={{ fontSize: '0.95rem' }}>Upload PNG Frame</strong>
                </div>
                <p style={{ fontSize: '0.8rem' }}>
                  Upload your designer's transparent PNG overlay (e.g. exported from Figma or Photoshop).
                </p>
              </div>
            </div>

            {/* Custom PNG File Picker if uploaded type is selected */}
            {formData.frameType === 'uploaded' && (
              <div style={{ marginTop: 14 }}>
                <label className="btn btn-secondary" style={{ width: '100%', cursor: 'pointer' }}>
                  <ImageIcon size={16} />
                  <span>{isUploading ? 'Uploading Frame...' : uploadedFile ? `Selected: ${uploadedFile.name}` : 'Choose Transparent PNG File'}</span>
                  <input
                    type="file"
                    accept="image/png,image/webp"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
                {uploadPreview && (
                  <div style={{ marginTop: 10, textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#34d399' }}>✓ Frame uploaded successfully</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theme Colors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                Primary Brand Color
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="color"
                  value={formData.themeColor}
                  onChange={(e) => setFormData(p => ({ ...p, themeColor: e.target.value }))}
                  style={{ width: 44, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  type="text"
                  className="input"
                  value={formData.themeColor}
                  onChange={(e) => setFormData(p => ({ ...p, themeColor: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                Accent Color
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) => setFormData(p => ({ ...p, accentColor: e.target.value }))}
                  style={{ width: 44, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }}
                />
                <input
                  type="text"
                  className="input"
                  value={formData.accentColor}
                  onChange={(e) => setFormData(p => ({ ...p, accentColor: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={isUploading}>
              Create & Publish Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
