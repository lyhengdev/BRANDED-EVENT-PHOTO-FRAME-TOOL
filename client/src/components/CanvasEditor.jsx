import React, { useState, useRef, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Upload, Download, RotateCw, ZoomIn, ZoomOut, RefreshCw, 
  FlipHorizontal, Sparkles, Share2, Check, Smartphone, Camera,
  Sliders, Maximize2
} from 'lucide-react';
import { drawFramePreset, exportHighResolutionPhoto } from '../utils/frameRenderer';

export default function CanvasEditor({ campaign, campaigns = [], onSelectCampaign }) {
  const [userImage, setUserImage] = useState(null);
  const [userImageSrc, setUserImageSrc] = useState(null);
  const [frameImage, setFrameImage] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Transform state for user photo
  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    flipH: false,
    flipV: false
  });

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  // Dragging / Touch state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const touchDistanceRef = useRef(null);

  // Track visit analytics on mount
  useEffect(() => {
    if (!campaign?.id) return;
    fetch(`/api/campaigns/${campaign.id}/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'visit' })
    }).catch(() => {});
  }, [campaign?.id]);

  // Load custom frame image if frameType is uploaded
  useEffect(() => {
    if (campaign?.frameUrl && campaign?.frameType === 'uploaded') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = campaign.frameUrl;
      img.onload = () => setFrameImage(img);
      img.onerror = () => setFrameImage(null);
    } else {
      setFrameImage(null);
    }
  }, [campaign]);

  // Handle User Photo Upload
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setUserImage(img);
        setUserImageSrc(event.target.result);

        // Reset transform to nicely center and fit photo
        const canvasW = campaign.canvasWidth || 1080;
        const canvasH = campaign.canvasHeight || 1350;
        const imgW = img.naturalWidth || img.width;
        const imgH = img.naturalHeight || img.height;

        // Cover / fit ratio
        const scaleX = canvasW / imgW;
        const scaleY = canvasH / imgH;
        const initialScale = Math.max(scaleX, scaleY) * 1.02;

        setTransform({
          x: 0,
          y: 0,
          scale: initialScale,
          rotation: 0,
          flipH: false,
          flipV: false
        });

        // Record upload analytics
        if (campaign?.id) {
          fetch(`/api/campaigns/${campaign.id}/analytics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventType: 'upload' })
          }).catch(() => {});
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Render composite frame and user photo onto screen canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !campaign) return;

    const ctx = canvas.getContext('2d');
    const width = campaign.canvasWidth || 1080;
    const height = campaign.canvasHeight || 1350;

    // Set internal resolution
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // 1. Draw solid background
    ctx.fillStyle = '#090b14';
    ctx.fillRect(0, 0, width, height);

    // 2. Draw user photo
    if (userImage) {
      ctx.save();
      const centerX = width / 2 + transform.x;
      const centerY = height / 2 + transform.y;
      ctx.translate(centerX, centerY);
      ctx.rotate((transform.rotation * Math.PI) / 180);
      ctx.scale(
        transform.scale * (transform.flipH ? -1 : 1),
        transform.scale * (transform.flipV ? -1 : 1)
      );

      const imgW = userImage.naturalWidth || userImage.width;
      const imgH = userImage.naturalHeight || userImage.height;
      ctx.drawImage(userImage, -imgW / 2, -imgH / 2, imgW, imgH);
      ctx.restore();
    } else {
      // Placeholder illustration when empty
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.fillRect(40, 40, width - 80, height - 80);
    }

    // 3. Draw frame layer on top
    if (frameImage && frameImage.complete && frameImage.naturalWidth > 0) {
      ctx.drawImage(frameImage, 0, 0, width, height);
    } else {
      drawFramePreset(ctx, width, height, campaign);
    }
  }, [campaign, userImage, transform, frameImage]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Pointer & Touch Handlers for panning and zooming
  const handlePointerDown = (e) => {
    if (!userImage) return;
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX - transform.x,
      y: e.clientY - transform.y
    };
    e.target.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current || !userImage) return;
    setTransform((prev) => ({
      ...prev,
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    }));
  };

  const handlePointerUp = (e) => {
    isDraggingRef.current = false;
    e.target.releasePointerCapture?.(e.pointerId);
  };

  // Mouse wheel zoom
  const handleWheel = (e) => {
    if (!userImage) return;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(0.1, Math.min(6, prev.scale * zoomFactor))
    }));
  };

  // Touch gesture pinch-to-zoom
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchDistanceRef.current && userImage) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchDistanceRef.current;
      touchDistanceRef.current = dist;
      setTransform((prev) => ({
        ...prev,
        scale: Math.max(0.1, Math.min(6, prev.scale * factor))
      }));
    }
  };

  const handleTouchEnd = () => {
    touchDistanceRef.current = null;
  };

  // Controls actions
  const handleZoom = (direction) => {
    const factor = direction === 'in' ? 1.15 : 0.85;
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(0.1, Math.min(6, prev.scale * factor))
    }));
  };

  const handleRotate = () => {
    setTransform((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360
    }));
  };

  const handleFlip = () => {
    setTransform((prev) => ({
      ...prev,
      flipH: !prev.flipH
    }));
  };

  const handleReset = () => {
    if (!userImage) return;
    const canvasW = campaign.canvasWidth || 1080;
    const canvasH = campaign.canvasHeight || 1350;
    const imgW = userImage.naturalWidth || userImage.width;
    const imgH = userImage.naturalHeight || userImage.height;
    const scale = Math.max(canvasW / imgW, canvasH / imgH) * 1.02;

    setTransform({
      x: 0,
      y: 0,
      scale,
      rotation: 0,
      flipH: false,
      flipV: false
    });
  };

  // High-Res Export & Download
  const handleDownload = async () => {
    if (!userImage) {
      fileInputRef.current?.click();
      return;
    }

    try {
      setIsExporting(true);

      const blob = await exportHighResolutionPhoto({
        canvasWidth: campaign.canvasWidth || 1080,
        canvasHeight: campaign.canvasHeight || 1350,
        userImage,
        imageTransform: transform,
        campaign,
        frameImageElement: frameImage
      });

      // Trigger download
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${campaign.slug || 'branded'}-photo-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      // Track analytics
      if (campaign?.id) {
        fetch(`/api/campaigns/${campaign.id}/analytics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventType: 'download' })
        }).catch(() => {});
      }

      // Celebrate
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 }
      });

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Export error:', err);
      alert('Error exporting image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Social Share using Web Share API
  const handleShare = async () => {
    if (!navigator.share) {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard! Share it with friends.');
      return;
    }

    try {
      await navigator.share({
        title: campaign.eventTitle || campaign.name,
        text: `Check out my official branded photo for ${campaign.name}! Get yours here:`,
        url: window.location.href
      });
    } catch (e) {
      // User cancelled share
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 80px' }}>
      {/* Campaign Selector Pill (Quick switcher for demos/testing) */}
      {campaigns.length > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          marginBottom: 24,
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Event Frame:
          </span>
          <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.04)', padding: 4, borderRadius: 'var(--radius-full)' }}>
            {campaigns.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectCampaign(c)}
                className={`btn btn-sm ${c.id === campaign?.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ borderRadius: 'var(--radius-full)', padding: '6px 14px' }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Event Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: 28 }} className="animate-fade-in">
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(99, 102, 241, 0.12)',
          color: '#818cf8',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          padding: '4px 14px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.8rem',
          fontWeight: 700,
          marginBottom: 10
        }}>
          <Sparkles size={14} />
          <span>{campaign?.eventTitle || 'OFFICIAL EVENT CAMPAIGN'}</span>
        </div>
        <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', color: '#ffffff', marginBottom: 8 }}>
          {campaign?.name || 'Branded Photo Frame'}
        </h1>
        <p style={{ maxWidth: 540, margin: '0 auto', fontSize: '0.95rem' }}>
          {campaign?.description || 'Upload your photo, adjust to fit the official frame, and download your high-res badge!'}
        </p>
      </div>

      {/* Editor Main Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(300px, 480px)',
        justifyContent: 'center',
        gap: 24,
        margin: '0 auto'
      }}>
        {/* Canvas Display Viewport */}
        <div 
          ref={containerRef}
          className="glass-panel"
          style={{
            position: 'relative',
            padding: 12,
            background: 'rgba(15, 18, 32, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          {/* Canvas Wrapper with Target Aspect Ratio */}
          <div 
            className="checker-bg"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 440,
              aspectRatio: `${campaign.canvasWidth} / ${campaign.canvasHeight}`,
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              cursor: userImage ? 'grab' : 'pointer',
              touchAction: 'none',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.6)'
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => !userImage && fileInputRef.current?.click()}
          >
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                objectFit: 'contain'
              }}
            />

            {/* Empty Upload Prompt Overlay */}
            {!userImage && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(9, 12, 22, 0.7)',
                backdropFilter: 'blur(4px)',
                padding: 24,
                textAlign: 'center',
                pointerEvents: 'none'
              }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--gradient-brand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-glow)',
                  marginBottom: 16
                }}>
                  <Camera size={30} color="#fff" />
                </div>
                <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: 6 }}>
                  Tap to Add Your Photo
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Take a selfie or select an image from your gallery
                </p>
                <div style={{
                  marginTop: 16,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  background: 'rgba(255, 255, 255, 0.08)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)'
                }}>
                  <span>🔒 Processed 100% locally in your browser</span>
                </div>
              </div>
            )}

            {/* Gesture Helper Badge */}
            {userImage && (
              <div style={{
                position: 'absolute',
                top: 12,
                left: 12,
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(6px)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.7rem',
                color: '#e2e8f0',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span>👆 Drag to position • Pinch to zoom</span>
              </div>
            )}
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            onChange={handlePhotoSelect}
            style={{ display: 'none' }}
          />

          {/* Canvas Adjustments Controls */}
          {userImage && (
            <div style={{ width: '100%', marginTop: 16 }}>
              {/* Zoom Slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <button 
                  onClick={() => handleZoom('out')} 
                  className="btn btn-ghost btn-sm"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>

                <input
                  type="range"
                  min="0.2"
                  max="4"
                  step="0.05"
                  value={transform.scale}
                  onChange={(e) => setTransform(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                />

                <button 
                  onClick={() => handleZoom('in')} 
                  className="btn btn-ghost btn-sm"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>

                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', minWidth: 42, textAlign: 'right' }}>
                  {Math.round(transform.scale * 100)}%
                </span>
              </div>

              {/* Action Buttons Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                >
                  <Upload size={14} />
                  <span>Change Photo</span>
                </button>

                <button 
                  onClick={handleRotate} 
                  className="btn btn-secondary btn-sm"
                  title="Rotate 90 degrees"
                >
                  <RotateCw size={14} />
                </button>

                <button 
                  onClick={handleFlip} 
                  className="btn btn-secondary btn-sm"
                  title="Flip Horizontal"
                >
                  <FlipHorizontal size={14} />
                </button>

                <button 
                  onClick={handleReset} 
                  className="btn btn-secondary btn-sm"
                  title="Reset alignment"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Primary Call to Action Button */}
          <div style={{ width: '100%', marginTop: 20 }}>
            {!userImage ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
              >
                <Upload size={20} />
                <span>Upload Your Photo</span>
              </button>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                <button
                  onClick={handleDownload}
                  disabled={isExporting}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%' }}
                >
                  {downloadSuccess ? <Check size={20} /> : <Download size={20} />}
                  <span>{isExporting ? 'Generating HD...' : downloadSuccess ? 'Saved to Device!' : 'Download HD Photo'}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="btn btn-secondary btn-lg"
                  title="Share event link"
                >
                  <Share2 size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Resolution Badge & Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            marginTop: 16,
            fontSize: '0.75rem',
            color: 'var(--text-dim)'
          }}>
            <span>Resolution: {campaign.canvasWidth} × {campaign.canvasHeight} px</span>
            <span>•</span>
            <span>Aspect Ratio: {campaign.aspectRatio || 'Custom'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
