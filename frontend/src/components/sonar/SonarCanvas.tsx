import React, { useEffect, useRef } from 'react';
import { Detection } from '../../lib/types/analysis';

interface SonarCanvasProps {
  width?: number;
  height?: number;
  detections?: Detection[];
  selectedDetectionId?: string | null;
  showOverlay?: boolean;
  showMasks?: boolean;
  showLabels?: boolean;
  onSelectDetection?: (detection: Detection) => void;
  seed?: string;
  customImageSrc?: string;
}

export const SonarCanvas: React.FC<SonarCanvasProps> = ({
  width = 1600,
  height = 900,
  detections = [],
  selectedDetectionId = null,
  showOverlay = true,
  showMasks = true,
  showLabels = true,
  onSelectDetection,
  seed = 'sonar_default',
  customImageSrc
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    if (customImageSrc && !customImageSrc.startsWith('mock_sonar')) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.fillStyle = '#020813';
        ctx.fillRect(0, 0, width, height);

        const hRatio = width / img.width;
        const vRatio = height / img.height;
        const ratio = Math.min(hRatio, vRatio);
        const centerShiftX = (width - img.width * ratio) / 2;
        const centerShiftY = (height - img.height * ratio) / 2;

        ctx.drawImage(
          img,
          0, 0, img.width, img.height,
          centerShiftX, centerShiftY, img.width * ratio, img.height * ratio
        );

        drawScanlinesAndNadir(ctx, width, height);
        drawDetectionOverlays(ctx, width, height, detections, selectedDetectionId, showOverlay, showMasks, showLabels);
      };
      img.onerror = () => {
        generateGoldSonar(ctx, width, height, seed);
        drawDetectionOverlays(ctx, width, height, detections, selectedDetectionId, showOverlay, showMasks, showLabels);
      };
      img.src = customImageSrc;
      return;
    }

    // Render authentic dark gold/amber side-scan sonar image matching DEEPSCAN reference images
    generateGoldSonar(ctx, width, height, seed);
    drawDetectionOverlays(ctx, width, height, detections, selectedDetectionId, showOverlay, showMasks, showLabels);

  }, [width, height, detections, selectedDetectionId, showOverlay, showMasks, showLabels, seed, customImageSrc]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full object-contain bg-[#020813] rounded-lg cursor-crosshair border border-[#13294B]"
    />
  );
};

// Generates gold/amber acoustic backscatter side-scan sonar image (matching reference screens 04 & 05)
function generateGoldSonar(ctx: CanvasRenderingContext2D, width: number, height: number, seedStr: string) {
  ctx.fillStyle = '#02060E';
  ctx.fillRect(0, 0, width, height);

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const random = () => {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };

  const nadirWidth = width * 0.07;
  const centerX = width / 2;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width * 4;
    const pingNoise = (random() - 0.5) * 15;

    for (let x = 0; x < width; x++) {
      const distFromCenter = Math.abs(x - centerX);
      let intensity = 0;

      if (distFromCenter < nadirWidth / 2) {
        intensity = Math.max(4, Math.floor(10 + random() * 12));
      } else {
        const swathDist = (distFromCenter - nadirWidth / 2) / (width / 2);
        const tvg = Math.max(0.15, 1.0 - swathDist * 0.5);
        const ripple = Math.sin((x * 0.04) + (y * 0.06)) * 18;
        const speckle = (random() - 0.5) * 40;
        
        const baseIntensity = 75 + ripple + speckle + pingNoise;
        intensity = Math.min(235, Math.max(15, Math.floor(baseIntensity * tvg)));
      }

      const idx = rowOffset + x * 4;
      
      // Authentic Gold / Amber Palette (DEEPSCAN aesthetic)
      data[idx] = Math.floor(intensity * 1.0);      // R: High Gold
      data[idx + 1] = Math.floor(intensity * 0.72); // G: Warm Amber
      data[idx + 2] = Math.floor(intensity * 0.20); // B: Low Blue
      data[idx + 3] = 255;                          // Alpha
    }
  }

  ctx.putImageData(imgData, 0, 0);
  drawScanlinesAndNadir(ctx, width, height);
}

function drawScanlinesAndNadir(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const centerX = width / 2;
  const nadirWidth = width * 0.07;

  // Nadir Track Line
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  ctx.beginPath();
  ctx.moveTo(centerX - nadirWidth / 2, 0);
  ctx.lineTo(centerX - nadirWidth / 2, height);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX + nadirWidth / 2, 0);
  ctx.lineTo(centerX + nadirWidth / 2, height);
  ctx.stroke();

  ctx.setLineDash([]);

  // Labels
  ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('NADIR GAP (TRANSDUCT TRACK)', centerX, 18);
}

function drawDetectionOverlays(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  detections: Detection[],
  selectedId: string | null,
  showOverlay: boolean,
  showMasks: boolean,
  showLabels: boolean
) {
  if (!showOverlay && !showMasks && !showLabels) return;

  detections.forEach((det) => {
    const isSelected = det.id === selectedId;
    const boxX = (det.bbox.x / 100) * width;
    const boxY = (det.bbox.y / 100) * height;
    const boxW = (det.bbox.width / 100) * width;
    const boxH = (det.bbox.height / 100) * height;

    const strokeColor = isSelected ? '#00F0FF' : det.riskLevel === 'HIGH' ? '#EF4444' : '#F59E0B';

    // 1. Mask
    if (showMasks) {
      ctx.fillStyle = isSelected ? 'rgba(0, 240, 255, 0.25)' : 'rgba(245, 158, 11, 0.2)';
      ctx.beginPath();
      ctx.ellipse(boxX + boxW / 2, boxY + boxH / 2, boxW / 2, boxH / 2, 0, 0, 2 * Math.PI);
      ctx.fill();
    }

    // 2. Bounding Box
    if (showOverlay) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeRect(boxX, boxY, boxW, boxH);

      // Corner Crosshairs
      const cLen = Math.min(boxW, boxH) * 0.25;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(boxX, boxY + cLen);
      ctx.lineTo(boxX, boxY);
      ctx.lineTo(boxX + cLen, boxY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(boxX + boxW - cLen, boxY);
      ctx.lineTo(boxX + boxW, boxY);
      ctx.lineTo(boxX + boxW, boxY + cLen);
      ctx.stroke();
    }

    // 3. Labels
    if (showLabels) {
      const labelText = `${det.classification.toUpperCase()} ${det.confidence.toFixed(0)}%`;
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      
      const textMetrics = ctx.measureText(labelText);
      const bgW = textMetrics.width + 12;
      const bgH = 18;

      ctx.fillStyle = '#050E1E';
      ctx.fillRect(boxX, boxY - bgH - 2, bgW, bgH);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX, boxY - bgH - 2, bgW, bgH);

      ctx.fillStyle = strokeColor;
      ctx.textAlign = 'left';
      ctx.fillText(labelText, boxX + 6, boxY - 6);
    }
  });
}
