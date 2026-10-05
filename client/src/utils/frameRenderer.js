/**
 * High-definition Canvas Rendering and Compositing Engine
 * Supports custom uploaded PNG overlays as well as high-res procedural event frames.
 */

export function drawFramePreset(ctx, width, height, campaign) {
  const { name, eventTitle, tagline, frameMeta = {}, themeColor = '#6366f1', accentColor = '#06b6d4' } = campaign;
  const headline = frameMeta.headline || eventTitle || name || 'EVENT 2026';
  const subline = frameMeta.subline || tagline || 'OFFICIAL ATTENDEE';
  const badge = frameMeta.badgeText || 'VERIFIED';
  const style = frameMeta.borderStyle || 'cyber-glow';

  ctx.save();

  if (style === 'cyber-glow' || campaign.slug?.includes('mtf')) {
    // Tech Summit Cyber Aesthetic
    // Outer border with subtle neon glow
    const borderWidth = Math.round(width * 0.035);
    ctx.lineWidth = borderWidth;
    const borderGrad = ctx.createLinearGradient(0, 0, width, height);
    borderGrad.addColorStop(0, themeColor);
    borderGrad.addColorStop(0.5, '#3b82f6');
    borderGrad.addColorStop(1, accentColor);
    ctx.strokeStyle = borderGrad;
    ctx.strokeRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);

    // Decorative corner brackets
    const bracketSize = Math.round(width * 0.08);
    const bracketThickness = Math.round(width * 0.012);
    ctx.fillStyle = '#ffffff';
    // Top-left
    ctx.fillRect(0, 0, bracketSize, bracketThickness);
    ctx.fillRect(0, 0, bracketThickness, bracketSize);
    // Top-right
    ctx.fillRect(width - bracketSize, 0, bracketSize, bracketThickness);
    ctx.fillRect(width - bracketThickness, 0, bracketThickness, bracketSize);
    // Bottom-left
    ctx.fillRect(0, height - bracketThickness, bracketSize, bracketThickness);
    ctx.fillRect(0, height - bracketSize, bracketThickness, bracketSize);
    // Bottom-right
    ctx.fillRect(width - bracketSize, height - bracketThickness, bracketSize, bracketThickness);
    ctx.fillRect(width - bracketThickness, height - bracketSize, bracketThickness, bracketSize);

    // Top Header Badge
    const headerHeight = Math.round(height * 0.09);
    const topBarGrad = ctx.createLinearGradient(0, 0, width, 0);
    topBarGrad.addColorStop(0, 'rgba(10, 12, 20, 0.95)');
    topBarGrad.addColorStop(0.5, 'rgba(23, 28, 50, 0.92)');
    topBarGrad.addColorStop(1, 'rgba(10, 12, 20, 0.95)');
    ctx.fillStyle = topBarGrad;
    ctx.fillRect(borderWidth, borderWidth, width - borderWidth * 2, headerHeight);

    // Top badge tag
    ctx.font = `bold ${Math.round(width * 0.024)}px "Space Grotesk", sans-serif`;
    ctx.fillStyle = accentColor;
    ctx.letterSpacing = '2px';
    ctx.fillText('⚡ OFFICIAL PARTICIPANT', borderWidth + 24, borderWidth + headerHeight * 0.6);

    ctx.font = `900 ${Math.round(width * 0.022)}px "Outfit", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText('2026 EDITION', width - borderWidth - 24, borderWidth + headerHeight * 0.6);
    ctx.textAlign = 'left';

    // Bottom Branded Banner Bar
    const bannerHeight = Math.round(height * 0.17);
    const bannerY = height - borderWidth - bannerHeight;
    const bannerGrad = ctx.createLinearGradient(0, bannerY, 0, height);
    bannerGrad.addColorStop(0, 'rgba(9, 11, 20, 0.7)');
    bannerGrad.addColorStop(0.3, 'rgba(10, 12, 24, 0.96)');
    bannerGrad.addColorStop(1, '#070913');
    ctx.fillStyle = bannerGrad;
    ctx.fillRect(borderWidth, bannerY, width - borderWidth * 2, bannerHeight);

    // Glowing divider line above banner
    ctx.beginPath();
    ctx.moveTo(borderWidth, bannerY);
    ctx.lineTo(width - borderWidth, bannerY);
    ctx.lineWidth = 3;
    ctx.strokeStyle = borderGrad;
    ctx.stroke();

    // Event title & Subtitle
    ctx.font = `900 ${Math.round(width * 0.052)}px "Outfit", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(headline.toUpperCase(), borderWidth + 32, bannerY + bannerHeight * 0.44);

    ctx.font = `600 ${Math.round(width * 0.026)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText(subline, borderWidth + 32, bannerY + bannerHeight * 0.72);

    // Right Badge Pill
    const pillWidth = Math.round(width * 0.22);
    const pillHeight = Math.round(height * 0.046);
    const pillX = width - borderWidth - pillWidth - 32;
    const pillY = bannerY + (bannerHeight - pillHeight) / 2;

    ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillWidth, pillHeight, pillHeight / 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = `bold ${Math.round(width * 0.025)}px "Space Grotesk", sans-serif`;
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText(badge, pillX + pillWidth / 2, pillY + pillHeight * 0.68);
    ctx.textAlign = 'left';

  } else if (style === 'neon-gradient' || campaign.slug?.includes('summer')) {
    // Neon Music Festival Frame
    const border = Math.round(width * 0.04);
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#ec4899');
    grad.addColorStop(0.5, '#f59e0b');
    grad.addColorStop(1, '#8b5cf6');
    ctx.strokeStyle = grad;
    ctx.lineWidth = border;
    ctx.strokeRect(border / 2, border / 2, width - border, height - border);

    // Top festival banner
    const topH = Math.round(height * 0.12);
    ctx.fillStyle = 'rgba(15, 10, 30, 0.9)';
    ctx.fillRect(border, border, width - border * 2, topH);

    ctx.font = `900 ${Math.round(width * 0.055)}px "Outfit", sans-serif`;
    ctx.fillStyle = '#fdf2f8';
    ctx.textAlign = 'center';
    ctx.fillText('✨ ' + headline.toUpperCase() + ' ✨', width / 2, border + topH * 0.65);

    // Bottom festival footer
    const botH = Math.round(height * 0.16);
    const botY = height - border - botH;
    ctx.fillStyle = 'rgba(15, 10, 30, 0.92)';
    ctx.fillRect(border, botY, width - border * 2, botH);

    ctx.beginPath();
    ctx.moveTo(border, botY);
    ctx.lineTo(width - border, botY);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ec4899';
    ctx.stroke();

    ctx.font = `700 ${Math.round(width * 0.038)}px "Space Grotesk", sans-serif`;
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('• VIP FESTIVAL PASS •', width / 2, botY + botH * 0.42);

    ctx.font = `500 ${Math.round(width * 0.026)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(subline, width / 2, botY + botH * 0.74);
    ctx.textAlign = 'left';

  } else {
    // Clean Elegant Holographic / Corporate Frame
    const border = Math.round(width * 0.032);
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = border;
    ctx.strokeRect(border / 2, border / 2, width - border, height - border);

    // Bottom bar
    const botH = Math.round(height * 0.15);
    const botY = height - border - botH;
    ctx.fillStyle = 'rgba(10, 15, 30, 0.94)';
    ctx.fillRect(border, botY, width - border * 2, botH);

    ctx.font = `800 ${Math.round(width * 0.05)}px "Outfit", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(headline, border + 36, botY + botH * 0.45);

    ctx.font = `500 ${Math.round(width * 0.026)}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = accentColor;
    ctx.fillText(subline, border + 36, botY + botH * 0.75);
  }

  ctx.restore();
}

/**
 * Composite user photo and frame overlay into an offscreen canvas at target resolution,
 * then returns a high-res Blob or DataURL.
 */
export async function exportHighResolutionPhoto({
  canvasWidth,
  canvasHeight,
  userImage,
  imageTransform,
  campaign,
  frameImageElement
}) {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvasWidth;
  exportCanvas.height = canvasHeight;
  const ctx = exportCanvas.getContext('2d', { alpha: false });

  // 1. Draw solid background
  ctx.fillStyle = '#05070e';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 2. Draw user photo with transforms
  if (userImage) {
    ctx.save();
    // Center of canvas
    const centerX = canvasWidth / 2 + imageTransform.x;
    const centerY = canvasHeight / 2 + imageTransform.y;
    ctx.translate(centerX, centerY);
    ctx.rotate((imageTransform.rotation * Math.PI) / 180);
    ctx.scale(imageTransform.scale * (imageTransform.flipH ? -1 : 1), imageTransform.scale * (imageTransform.flipV ? -1 : 1));

    // Draw centered
    const imgW = userImage.naturalWidth || userImage.width;
    const imgH = userImage.naturalHeight || userImage.height;
    ctx.drawImage(userImage, -imgW / 2, -imgH / 2, imgW, imgH);
    ctx.restore();
  }

  // 3. Draw frame overlay
  if (frameImageElement && frameImageElement.complete && frameImageElement.naturalWidth > 0) {
    // Custom uploaded frame PNG
    ctx.drawImage(frameImageElement, 0, 0, canvasWidth, canvasHeight);
  } else {
    // Built-in high quality procedural frame
    drawFramePreset(ctx, canvasWidth, canvasHeight, campaign);
  }

  return new Promise((resolve) => {
    exportCanvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/png', 0.95);
  });
}
