import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Upload, Download, RotateCw, ZoomIn, ZoomOut, RefreshCw, 
  FlipHorizontal, Sparkles, Share2, Check, Camera, Sliders,
  Sun, Contrast, Palette, Aperture, Image as ImageIcon, Smile
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
  const [showGestureHint, setShowGestureHint] = useState(false);

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
  const cameraInputRef = useRef(null);
  const selfieInputRef = useRef(null);
  const libraryInputRef = useRef(null);
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

  // Handle Photo Selection (Camera or Library)
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

        // Show gesture guidance on mobile for 3 seconds
        setShowGestureHint(true);
        setTimeout(() => setShowGestureHint(false), 3200);

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

    // Reset input value so same photo can be re-selected if desired
    e.target.value = '';
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

  // Pointer & Touch Handlers (Multi-touch pinch-to-zoom & single-finger pan)
  const handlePointerDown = (e) => {
    if (!userImage) return;
    setShowGestureHint(false);
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
      if (Math.abs(nextScale - lastTickScaleRef.current) > 0.08) {
        sound.playDialTick();
        lastTickScaleRef.current = nextScale;
      }
      return { ...prev, scale: nextScale };
    });
  };

  // Pinch-to-zoom for mobile phones
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      setShowGestureHint(false);
      isDraggingRef.current = false;
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

      setTransform((prev) => {
        const nextScale = Math.max(0.1, Math.min(6, prev.scale * factor));
        if (Math.abs(nextScale - lastTickScaleRef.current) > 0.1) {
          sound.playDialTick();
          lastTickScaleRef.current = nextScale;
        }
        return { ...prev, scale: nextScale };
      });
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

  // Helper to generate composite high-res photo blob
  const generateExportBlob = async () => {
    return await exportHighResolutionPhoto({
      canvasWidth: campaign.canvasWidth || 1080,
      canvasHeight: campaign.canvasHeight || 1350,
      userImage,
      imageTransform: transform,
      filterAdjustments: filters,
      campaign,
      frameImageElement: frameImage
    });
  };

  // Shutter Release & HD Export
  const handleShutterRelease = async () => {
    if (!userImage) {
      sound.playMechanicalClick();
      libraryInputRef.current?.click();
      return;
    }

    try {
      setIsExporting(true);
      // Play authentic physical shutter sound and trigger haptic recoil vibration
      sound.playShutterSound();

      const blob = await generateExportBlob();

      // Trigger automatic save to device
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${campaign.slug || 'branded'}-photo-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      // Record download analytics
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

  // Native Mobile Share (Instagram Stories, WhatsApp, AirDrop, Camera Roll)
  const handleShare = async () => {
    sound.playMechanicalClick();

    if (!userImage) {
      libraryInputRef.current?.click();
      return;
    }

    try {
      setIsExporting(true);
      const blob = await generateExportBlob();
      const filename = `${campaign.slug || 'event'}-frame.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      // Check if browser supports native file sharing (iOS Safari, Android Chrome)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: campaign.eventTitle || campaign.name,
          text: `Check out my official event photo for ${campaign.name}!`
        });
      } else if (navigator.share) {
        await navigator.share({
          title: campaign.eventTitle || campaign.name,
          text: `Create your branded event photo frame:`,
          url: window.location.href
        });
      } else {
        // Fallback: copy event link to clipboard
        navigator.clipboard.writeText(window.location.href);
        alert('Event link copied to clipboard!');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Share note:', err.message);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '12px 10px 100px' }}>
      {/* Campaign Quick Selector Bar */}
      {campaigns.length > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 16,
          flexWrap: 'wrap'
        }}>
          <span className="engraved-text" style={{ fontSize: '0.7rem' }}>
            FRAME:
          </span>
          <div style={{
            display: 'flex',
            gap: 6,
            background: '#090b14',
            padding: 3,
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
                  padding: '5px 12px',
                  fontSize: '0.75rem',
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
        style={{ padding: '20px 16px 24px' }}
      >
        {/* 4 Corner Mechanical Chassis Screws */}
        <div className="chassis-screw" style={{ top: 10, left: 10 }} />
        <div className="chassis-screw" style={{ top: 10, right: 10 }} />
        <div className="chassis-screw" style={{ bottom: 10, left: 10 }} />
        <div className="chassis-screw" style={{ bottom: 10, right: 10 }} />

        {/* Chassis Top Plate Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 12,
          marginBottom: 12,
          borderBottom: '1px solid rgba(0, 0, 0, 0.7)',
          boxShadow: '0 1px 0 rgba(255, 255, 255, 0.08)',
          gap: 8
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="engraved-light" style={{ fontSize: '0.9rem', fontWeight: 800 }}>
                {campaign.eventTitle || campaign.name}
              </span>
              <span className="engraved-text" style={{ fontSize: '0.6rem', background: '#0a0d16', padding: '1px 5px', borderRadius: 3 }}>
                {campaign.aspectRatio || '4:5'}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>
              {campaign.tagline || 'Position photo within frame • Tap shutter to save'}
            </div>
          </div>

          {/* Calibrated Sensor LED */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#090b14',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(0,0,0,0.8)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8)',
            flexShrink: 0
          }}>
            <span className={`led-jewel ${isExporting ? 'led-amber' : userImage ? 'led-green' : 'led-blue'}`} />
            <span className="engraved-text" style={{ fontSize: '0.6rem' }}>
              {isExporting ? 'EXPOSING' : userImage ? 'READY' : 'STANDBY'}
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

            {/* Gesture Hint Toast on Mobile */}
            <AnimatePresence>
              {showGestureHint && userImage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    position: 'absolute',
                    bottom: 16,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(5, 8, 16, 0.88)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#f8fafc',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.8)',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    zIndex: 20
                  }}
                >
                  👆 Drag photo • 🤏 Pinch to zoom
                </motion.div>
              )}
            </AnimatePresence>

            {/* Aperture Dropzone Overlay when empty */}
            {!userImage && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle, rgba(12, 16, 28, 0.88) 0%, rgba(6, 8, 16, 0.96) 100%)',
                padding: '20px 16px',
                textAlign: 'center'
              }}>
                <div style={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 35%, #334155 0%, #0f172a 70%, #020617 100%)',
                  border: '2px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12
                }}>
                  <Aperture size={32} color="#38bdf8" />
                </div>

                <h3 className="engraved-light" style={{ fontSize: '1.05rem', marginBottom: 4 }}>
                  INSERT YOUR PHOTO
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                  Take a live photo or select from your camera roll
                </p>

                {/* Mobile Dual Action Buttons: Live Camera vs Library */}
                <div style={{
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  width: '100%',
                  maxWidth: 320
                }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playMechanicalClick();
                      cameraInputRef.current?.click();
                    }}
                    className="btn-tactile"
                    style={{
                      background: 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 60%, #1e3a8a 100%)',
                      color: '#ffffff',
                      flex: 1,
                      padding: '10px 12px',
                      fontSize: '0.82rem',
                      minWidth: 130
                    }}
                  >
                    <Camera size={16} />
                    <span>Take Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playMechanicalClick();
                      libraryInputRef.current?.click();
                    }}
                    className="btn-tactile"
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      fontSize: '0.82rem',
                      minWidth: 130
                    }}
                  >
                    <ImageIcon size={16} />
                    <span>Choose Photo</span>
                  </button>
                </div>

                <div style={{
                  marginTop: 14,
                  fontSize: '0.65rem',
                  color: '#94a3b8',
                  background: '#090b14',
                  padding: '3px 10px',
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
                top: 8,
                left: 8,
                right: 8,
                display: 'flex',
                justifyContent: 'space-between',
                pointerEvents: 'none'
              }}>
                <span className="engraved-text" style={{ fontSize: '0.6rem', background: 'rgba(0,0,0,0.6)', padding: '2px 5px', borderRadius: 3 }}>
                  HD 1080P
                </span>
                <span className="engraved-text" style={{ fontSize: '0.6rem', background: 'rgba(0,0,0,0.6)', padding: '2px 5px', borderRadius: 3 }}>
                  ZOOM: {Math.round(transform.scale * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Hidden File Pickers (Back Camera, Front Selfie, Photo Library) */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoSelect}
          style={{ display: 'none' }}
        />
        <input
          ref={selfieInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handlePhotoSelect}
          style={{ display: 'none' }}
        />
        <input
          ref={libraryInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoSelect}
          style={{ display: 'none' }}
        />

        {/* Hardware Control Console below Viewfinder */}
        {userImage && (
          <div style={{ marginTop: 16 }}>
            {/* Knurled Rotary Zoom Dial */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span className="engraved-text" style={{ fontSize: '0.68rem' }}>
                  FOCAL ZOOM WHEEL
                </span>
                <span className="engraved-light" style={{ fontSize: '0.72rem' }}>
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

            {/* Tactile Hardware Action Bar (Optimized for Mobile Thumb Taps) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 6,
              marginBottom: 14
            }}>
              <button 
                onClick={() => cameraInputRef.current?.click()} 
                className="btn-tactile"
                title="Take New Photo with Camera"
                style={{ fontSize: '0.72rem', padding: '8px 4px', flexDirection: 'column', gap: 3 }}
              >
                <Camera size={14} />
                <span>Camera</span>
              </button>

              <button 
                onClick={() => libraryInputRef.current?.click()} 
                className="btn-tactile"
                title="Choose from Photo Library"
                style={{ fontSize: '0.72rem', padding: '8px 4px', flexDirection: 'column', gap: 3 }}
              >
                <ImageIcon size={14} />
                <span>Library</span>
              </button>

              <button 
                onClick={handleRotate} 
                className="btn-tactile"
                title="Rotate 90 degrees"
                style={{ fontSize: '0.72rem', padding: '8px 4px', flexDirection: 'column', gap: 3 }}
              >
                <RotateCw size={14} />
                <span>Rotate</span>
              </button>

              <button 
                onClick={handleFlip} 
                className="btn-tactile"
                title="Flip Horizontal"
                style={{ fontSize: '0.72rem', padding: '8px 4px', flexDirection: 'column', gap: 3 }}
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
                style={{ fontSize: '0.72rem', padding: '8px 4px', flexDirection: 'column', gap: 3 }}
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
                    padding: '12px 10px',
                    boxShadow: 'var(--recessed-inner)',
                    marginBottom: 14,
                    border: '1px solid rgba(0,0,0,0.8)'
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', color: '#94a3b8', marginBottom: 2 }}>
                        <Sun size={11} />
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', color: '#94a3b8', marginBottom: 2 }}>
                        <Contrast size={11} />
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.65rem', color: '#94a3b8', marginBottom: 2 }}>
                        <Palette size={11} />
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

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="btn-tactile"
                      style={{ fontSize: '0.68rem', padding: '4px 10px' }}
                    >
                      <RefreshCw size={11} />
                      <span>Reset View & Tone</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Master Shutter Action Assembly (Mobile-Friendly Ergonomics) */}
        <div style={{
          marginTop: 18,
          display: 'grid',
          gridTemplateColumns: userImage ? '1fr auto' : '1fr',
          gap: 10
        }}>
          <motion.button
            whileTap={{ scale: 0.97, y: 3 }}
            onClick={handleShutterRelease}
            disabled={isExporting}
            className="btn-shutter"
          >
            {downloadSuccess ? (
              <Check size={20} color="#ffffff" />
            ) : !userImage ? (
              <Camera size={20} color="#ffffff" />
            ) : (
              <Camera size={20} color="#ffffff" />
            )}
            <span>
              {isExporting 
                ? 'EXPOSING HD FILM...' 
                : downloadSuccess 
                ? 'SAVED TO DEVICE!' 
                : !userImage 
                ? 'ADD PHOTO TO BEGIN' 
                : 'RELEASE SHUTTER • SAVE HD'}
            </span>
          </motion.button>

          {userImage && (
            <button
              onClick={handleShare}
              disabled={isExporting}
              className="btn-tactile btn-tactile-icon"
              title="Share Event Photo (Instagram / WhatsApp / AirDrop)"
              style={{ width: 50, height: '100%', borderRadius: 'var(--radius-lg)' }}
            >
              <Share2 size={19} color="#38bdf8" />
            </button>
          )}
        </div>

        {/* Calibration Engraving Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 16,
          fontSize: '0.65rem'
        }}>
          <span className="engraved-text">
            CALIBRATION: {campaign.canvasWidth} × {campaign.canvasHeight} PX
          </span>
          <span className="engraved-text">
            60FPS COMPOSITOR
          </span>
        </div>
      </motion.div>
    </div>
  );
}
