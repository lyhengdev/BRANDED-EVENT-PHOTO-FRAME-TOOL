import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Upload, Download, RotateCw, ZoomIn, ZoomOut, RefreshCw, 
  FlipHorizontal, Sparkles, Share2, Check, Camera, Sliders,
  Sun, Contrast, Palette, Aperture, Eye
} from 'lucide-react';
import { drawFramePreset, exportHighResolutionPhoto } from '../utils/frameRenderer';
import { sound } from '../utils/soundEffects';

export default function CanvasEditor({ campaign, campaigns = [], onSelectCampaign }) {
  const [userImage, setUserImage] = useState(null);
  const [userImageSrc, setUserImageSrc] = useState(null);
  const [frameImage, setFrameImage] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showStudioFilters, setShowStudioFilters] = useState(false);

  // Transform state for user photo inside viewfinder
  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    flipH: false,
    flipV: false
  });

  // Studio color grading adjustments
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100
  });

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const touchDistanceRef = useRef(null);
  const lastTickScaleRef = useRef(1);

  // Track visit analytics on mount
  useEffect(() => {
    if (!campaign?.id) return;
    fetch(`/api/campaigns/${campaign.id}/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'visit' })
    }).catch(() => {});
  }, [campaign?.id]);

  // Load custom frame image if uploaded
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

  // Handle Photo Upload
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sound.playMechanicalClick();

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setUserImage(img);
        setUserImageSrc(event.target.result);

        const canvasW = campaign.canvasWidth || 1080;
        const canvasH = campaign.canvasHeight || 1350;
        const imgW = img.naturalWidth || img.width;
        const imgH = img.naturalHeight || img.height;

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

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);

    // 1. Solid camera sensor dark well
    ctx.fillStyle = '#060810';
    ctx.fillRect(0, 0, width, height);

    // 2. Draw user photo with transforms and studio color grading
    if (userImage) {
      ctx.save();

      // Apply CSS filter on context
      ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;

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
    }

    // 3. Draw fixed frame layer
    if (frameImage && frameImage.complete && frameImage.naturalWidth > 0) {
      ctx.drawImage(frameImage, 0, 0, width, height);
    } else {
      drawFramePreset(ctx, width, height, campaign);
    }
  }, [campaign, userImage, transform, filters, frameImage]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Pointer & Touch Handlers
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

  // Mouse wheel zoom with dial sound
  const handleWheel = (e) => {
    if (!userImage) return;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setTransform((prev) => {
      const nextScale = Math.max(0.1, Math.min(6, prev.scale * zoomFactor));
      if (Math.abs(nextScale - lastTickScaleRef.current) > 0.1) {
        sound.playDialTick();
        lastTickScaleRef.current = nextScale;
      }
      return { ...prev, scale: nextScale };
    });
  };

  // Pinch-to-zoom for mobile
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
  const handleZoomChange = (newVal) => {
    const scale = parseFloat(newVal);
    if (Math.abs(scale - lastTickScaleRef.current) > 0.08) {
      sound.playDialTick();
      lastTickScaleRef.current = scale;
    }
    setTransform((prev) => ({ ...prev, scale }));
  };

  const handleRotate = () => {
    sound.playMechanicalClick();
    setTransform((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360
    }));
  };

  const handleFlip = () => {
    sound.playMechanicalClick();
    setTransform((prev) => ({
      ...prev,
      flipH: !prev.flipH
    }));
  };

  const handleReset = () => {
    sound.playMechanicalClick();
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
    setFilters({ brightness: 100, contrast: 100, saturation: 100 });
  };

  // Shutter Release & HD Export
  const handleShutterRelease = async () => {
    if (!userImage) {
      sound.playMechanicalClick();
      fileInputRef.current?.click();
      return;
    }

    try {
      setIsExporting(true);
      // Play authentic physical shutter release clack!
      sound.playShutterSound();

      const blob = await exportHighResolutionPhoto({
        canvasWidth: campaign.canvasWidth || 1080,
        canvasHeight: campaign.canvasHeight || 1350,
        userImage,
        imageTransform: transform,
        filterAdjustments: filters,
        campaign,
        frameImageElement: frameImage
      });

      // Save file
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

      // Shutter celebration confetti
      confetti({
        particleCount: 90,
        spread: 75,
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

  const handleShare = async () => {
    sound.playMechanicalClick();
    if (!navigator.share) {
      navigator.clipboard.writeText(window.location.href);
      alert('Event link copied! Share with friends on social media.');
      return;
    }

    try {
      await navigator.share({
        title: campaign.eventTitle || campaign.name,
        text: `Get your official branded event photo for ${campaign.name}:`,
        url: window.location.href
      });
    } catch (e) {}
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '24px 16px 80px' }}>
      {/* Campaign Quick Selector Bar */}
      {campaigns.length > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          marginBottom: 24,
          flexWrap: 'wrap'
        }}>
          <span className="engraved-text" style={{ fontSize: '0.75rem' }}>
            FRAME SLOT:
          </span>
          <div style={{
            display: 'flex',
            gap: 6,
            background: '#090b14',
            padding: 4,
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.08)'
          }}>
            {campaigns.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  sound.playMechanicalClick();
                  onSelectCampaign(c);
                }}
                className={`btn-tactile ${c.id === campaign?.id ? 'active' : ''}`}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Skeuomorphic Camera Chassis */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="camera-chassis" 
        style={{ padding: '24px 20px 28px' }}
      >
        {/* 4 Corner Mechanical Chassis Screws */}
        <div className="chassis-screw" style={{ top: 12, left: 12 }} />
        <div className="chassis-screw" style={{ top: 12, right: 12 }} />
        <div className="chassis-screw" style={{ bottom: 12, left: 12 }} />
        <div className="chassis-screw" style={{ bottom: 12, right: 12 }} />

        {/* Chassis Top Plate Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 16,
          marginBottom: 16,
          borderBottom: '1px solid rgba(0, 0, 0, 0.7)',
          boxShadow: '0 1px 0 rgba(255, 255, 255, 0.08)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="engraved-light" style={{ fontSize: '0.95rem', fontWeight: 800 }}>
                {campaign.eventTitle || campaign.name}
              </span>
              <span className="engraved-text" style={{ fontSize: '0.65rem', background: '#0a0d16', padding: '2px 6px', borderRadius: 4 }}>
                {campaign.aspectRatio || '4:5'}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 2 }}>
              {campaign.description || 'Position photo within frame • Press shutter to download'}
            </div>
          </div>

          {/* Calibrated Sensor LED */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#090b14',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(0,0,0,0.8)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8)'
          }}>
            <span className={`led-jewel ${isExporting ? 'led-amber' : userImage ? 'led-green' : 'led-blue'}`} />
            <span className="engraved-text" style={{ fontSize: '0.65rem' }}>
              {isExporting ? 'PROCESSING' : userImage ? 'HD CALIBRATED' : 'STANDBY'}
            </span>
          </div>
        </div>

        {/* Viewfinder Assembly */}
        <div className="viewfinder-recess" style={{ margin: '0 auto', maxWidth: 440 }}>
          <div 
            className="viewfinder-glass checker-bg"
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: `${campaign.canvasWidth} / ${campaign.canvasHeight}`,
              cursor: userImage ? 'grab' : 'pointer',
              touchAction: 'none'
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

            {/* Aperture Dropzone Overlay when empty */}
            {!userImage && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle, rgba(12, 16, 28, 0.85) 0%, rgba(6, 8, 16, 0.95) 100%)',
                padding: 24,
                textAlign: 'center',
                pointerEvents: 'none'
              }}>
                <div style={{
                  width: 74,
                  height: 74,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 35%, #334155 0%, #0f172a 70%, #020617 100%)',
                  border: '3px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16
                }}>
                  <Aperture size={36} color="#38bdf8" />
                </div>
                <h3 className="engraved-light" style={{ fontSize: '1.1rem', marginBottom: 6 }}>
                  INSERT PHOTO
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Tap viewfinder or choose from camera roll
                </p>
                <div style={{
                  marginTop: 14,
                  fontSize: '0.7rem',
                  color: '#94a3b8',
                  background: '#090b14',
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8)'
                }}>
                  🔒 100% In-Browser Optical Privacy
                </div>
              </div>
            )}

            {/* Viewfinder HUD Focal Markings */}
            {userImage && (
              <div style={{
                position: 'absolute',
                top: 10,
                left: 10,
                right: 10,
                display: 'flex',
                justifyContent: 'space-between',
                pointerEvents: 'none'
              }}>
                <span className="engraved-text" style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 3 }}>
                  ISO AUTO • 1080P
                </span>
                <span className="engraved-text" style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 3 }}>
                  ZOOM: {Math.round(transform.scale * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Hidden File Picker */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handlePhotoSelect}
          style={{ display: 'none' }}
        />

        {/* Hardware Control Console below Viewfinder */}
        {userImage && (
          <div style={{ marginTop: 20 }}>
            {/* Knurled Rotary Zoom Dial */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span className="engraved-text" style={{ fontSize: '0.7rem' }}>
                  FOCAL ZOOM WHEEL
                </span>
                <span className="engraved-light" style={{ fontSize: '0.75rem' }}>
                  {Math.round(transform.scale * 100)}%
                </span>
              </div>

              <div className="knurled-track">
                <div className="dial-ticks" />
                <input
                  type="range"
                  min="0.2"
                  max="4"
                  step="0.02"
                  value={transform.scale}
                  onChange={(e) => handleZoomChange(e.target.value)}
                  style={{ position: 'relative', zIndex: 2 }}
                />
              </div>
            </div>

            {/* Tactile Rocker Switch Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="btn-tactile"
                title="Replace Photo"
                style={{ fontSize: '0.75rem', padding: '8px 6px' }}
              >
                <Upload size={14} />
                <span>Change</span>
              </button>

              <button 
                onClick={handleRotate} 
                className="btn-tactile"
                title="Rotate 90 degrees"
                style={{ fontSize: '0.75rem', padding: '8px 6px' }}
              >
                <RotateCw size={14} />
                <span>Rotate</span>
              </button>

              <button 
                onClick={handleFlip} 
                className="btn-tactile"
                title="Flip Horizontal"
                style={{ fontSize: '0.75rem', padding: '8px 6px' }}
              >
                <FlipHorizontal size={14} />
                <span>Flip</span>
              </button>

              <button 
                onClick={() => {
                  sound.playMechanicalClick();
                  setShowStudioFilters(!showStudioFilters);
                }} 
                className={`btn-tactile ${showStudioFilters ? 'active' : ''}`}
                title="Studio Color Grading"
                style={{ fontSize: '0.75rem', padding: '8px 6px' }}
              >
                <Sliders size={14} />
                <span>Tune</span>
              </button>
            </div>

            {/* Studio Filter Tuning Tray */}
            <AnimatePresence>
              {showStudioFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    overflow: 'hidden',
                    background: '#090c16',
                    borderRadius: 'var(--radius-md)',
                    padding: 14,
                    boxShadow: 'var(--recessed-inner)',
                    marginBottom: 16,
                    border: '1px solid rgba(0,0,0,0.8)'
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: '#94a3b8', marginBottom: 4 }}>
                        <Sun size={12} />
                        <span>Brightness</span>
                      </div>
                      <input
                        type="range"
                        min="70"
                        max="140"
                        value={filters.brightness}
                        onChange={(e) => setFilters(p => ({ ...p, brightness: Number(e.target.value) }))}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: '#94a3b8', marginBottom: 4 }}>
                        <Contrast size={12} />
                        <span>Contrast</span>
                      </div>
                      <input
                        type="range"
                        min="70"
                        max="140"
                        value={filters.contrast}
                        onChange={(e) => setFilters(p => ({ ...p, contrast: Number(e.target.value) }))}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: '#94a3b8', marginBottom: 4 }}>
                        <Palette size={12} />
                        <span>Warmth</span>
                      </div>
                      <input
                        type="range"
                        min="60"
                        max="140"
                        value={filters.saturation}
                        onChange={(e) => setFilters(p => ({ ...p, saturation: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Master Shutter Action Assembly */}
        <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: userImage ? '1fr auto' : '1fr', gap: 12 }}>
          <motion.button
            whileTap={{ scale: 0.97, y: 3 }}
            onClick={handleShutterRelease}
            disabled={isExporting}
            className="btn-shutter"
          >
            {downloadSuccess ? (
              <Check size={22} color="#ffffff" />
            ) : !userImage ? (
              <Upload size={22} color="#ffffff" />
            ) : (
              <Camera size={22} color="#ffffff" />
            )}
            <span>
              {isExporting 
                ? 'EXPOSING HD FILM...' 
                : downloadSuccess 
                ? 'SAVED TO DEVICE!' 
                : !userImage 
                ? 'INSERT PHOTO TO BEGIN' 
                : 'RELEASE SHUTTER • DOWNLOAD HD'}
            </span>
          </motion.button>

          {userImage && (
            <button
              onClick={handleShare}
              className="btn-tactile btn-tactile-icon"
              title="Share Event Frame Link"
              style={{ width: 56, height: '100%', borderRadius: 'var(--radius-lg)' }}
            >
              <Share2 size={20} />
            </button>
          )}
        </div>

        {/* Calibration Engraving Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 18,
          fontSize: '0.68rem'
        }}>
          <span className="engraved-text">
            CALIBRATION: {campaign.canvasWidth} × {campaign.canvasHeight} PX
          </span>
          <span className="engraved-text">
            PRECISION 60FPS COMPOSITOR
          </span>
        </div>
      </motion.div>
    </div>
  );
}
