/**
 * Optimizes high-resolution transparent PNG frames to fit within Vercel's
 * 4.5MB serverless payload limit while maintaining crystal-clear alpha transparency.
 */
export async function optimizeTransparentFrame(file, maxWidth = 1440, maxHeight = 1800) {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Scale down proportionally if larger than maximum bounds
      const scale = Math.min(1, maxWidth / width, maxHeight / height);
      const targetWidth = Math.round(width * scale);
      const targetHeight = Math.round(height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Convert to transparent PNG blob
      canvas.toBlob((blob) => {
        const dataUrl = canvas.toDataURL('image/png');
        if (blob) {
          const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".png", {
            type: 'image/png',
            lastModified: Date.now()
          });
          resolve({
            file: optimizedFile,
            blob,
            dataUrl,
            width: targetWidth,
            height: targetHeight,
            originalSize: file.size,
            optimizedSize: blob.size
          });
        } else {
          resolve({
            file,
            blob: file,
            dataUrl,
            width,
            height,
            originalSize: file.size,
            optimizedSize: file.size
          });
        }
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          file,
          blob: file,
          dataUrl: e.target.result,
          width: maxWidth,
          height: maxHeight,
          originalSize: file.size,
          optimizedSize: file.size
        });
      };
      reader.onerror = () => {
        resolve({
          file,
          blob: file,
          dataUrl: '',
          width: maxWidth,
          height: maxHeight,
          originalSize: file.size,
          optimizedSize: file.size
        });
      };
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
}
