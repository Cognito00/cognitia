import React, { useState, useRef } from 'react';
import { Detection } from '../../lib/types/analysis';
import { SonarCanvas } from './SonarCanvas';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Layers, 
  Tag, 
  Maximize2, 
  Minimize2, 
  Move
} from 'lucide-react';

interface SonarImageViewerProps {
  detections: Detection[];
  selectedDetection: Detection | null;
  onSelectDetection: (detection: Detection | null) => void;
  seed?: string;
  customImageSrc?: string;
}

export const SonarImageViewer: React.FC<SonarImageViewerProps> = ({
  detections,
  selectedDetection,
  onSelectDetection,
  seed = 'sonar_default',
  customImageSrc
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [showMasks, setShowMasks] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 4));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.75));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking on container or canvas
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Click canvas detection box calculation
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || detections.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate click coordinates in percentage of image
    const clickX = ((e.clientX - rect.left - pan.x) / (rect.width * zoom)) * 100;
    const clickY = ((e.clientY - rect.top - pan.y) / (rect.height * zoom)) * 100;

    // Find if click falls inside any detection bounding box
    const clickedDet = detections.find((det) => {
      const { x, y, width, height } = det.bbox;
      return clickX >= x && clickX <= x + width && clickY >= y && clickY <= y + height;
    });

    if (clickedDet) {
      onSelectDetection(clickedDet);
    } else {
      onSelectDetection(null);
    }
  };

  return (
    <div 
      className={`relative bg-[#06090E] border border-slate-800 rounded-lg overflow-hidden flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[580px]'
      }`}
    >
      {/* Top Toolbar */}
      <div className="h-10 bg-[#0D1420] border-b border-slate-800 px-3 flex items-center justify-between z-20 text-xs font-mono select-none">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="text-cyan-400 font-semibold">SONAR VIEWER</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">SIDE SCAN WATERFALL [455 kHz]</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Zoom controls */}
          <div className="flex items-center bg-[#06090E] border border-slate-800 rounded px-1">
            <button 
              onClick={handleZoomOut}
              className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] text-slate-300 font-mono w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button 
              onClick={handleZoomIn}
              className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleReset}
              className="p-1 text-slate-400 hover:text-slate-200 border-l border-slate-800 transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          <span className="text-slate-700">|</span>

          {/* Toggle Overlays */}
          <button
            onClick={() => setShowOverlay(!showOverlay)}
            className={`flex items-center gap-1 px-2 py-1 rounded border text-[11px] transition-colors ${
              showOverlay 
                ? 'bg-cyan-950/80 text-cyan-400 border-cyan-800' 
                : 'bg-[#06090E] text-slate-500 border-slate-800'
            }`}
            title="Toggle Bounding Box Overlay"
          >
            {showOverlay ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">BOXES</span>
          </button>

          <button
            onClick={() => setShowMasks(!showMasks)}
            className={`flex items-center gap-1 px-2 py-1 rounded border text-[11px] transition-colors ${
              showMasks 
                ? 'bg-cyan-950/80 text-cyan-400 border-cyan-800' 
                : 'bg-[#06090E] text-slate-500 border-slate-800'
            }`}
            title="Toggle Segmentation Mask Overlay"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">MASKS</span>
          </button>

          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`flex items-center gap-1 px-2 py-1 rounded border text-[11px] transition-colors ${
              showLabels 
                ? 'bg-cyan-950/80 text-cyan-400 border-cyan-800' 
                : 'bg-[#06090E] text-slate-500 border-slate-800'
            }`}
            title="Toggle Class Labels"
          >
            <Tag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">LABELS</span>
          </button>

          <span className="text-slate-700">|</span>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-[#06090E] text-slate-400 hover:text-slate-200 border border-slate-800 rounded transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center p-2 select-none"
      >
        <div 
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
          }}
          className="w-full h-full flex items-center justify-center"
        >
          <SonarCanvas
            detections={detections}
            selectedDetectionId={selectedDetection?.id || null}
            showOverlay={showOverlay}
            showMasks={showMasks}
            showLabels={showLabels}
            onSelectDetection={onSelectDetection}
            seed={seed}
            customImageSrc={customImageSrc}
          />
        </div>

        {/* Bottom Telemetry Overlay */}
        <div className="absolute bottom-3 left-3 bg-[#0D1420]/90 border border-slate-800 rounded px-2.5 py-1 flex items-center gap-3 text-[11px] font-mono text-slate-400 backdrop-blur-sm pointer-events-none z-10">
          <div className="flex items-center gap-1 text-cyan-400">
            <Move className="w-3 h-3" />
            <span>PAN & ZOOM ACTIVE</span>
          </div>
          <span>|</span>
          <span>DETECTIONS: <strong className="text-white">{detections.length}</strong></span>
          <span>|</span>
          <span>SELECTED: <strong className="text-cyan-400">{selectedDetection ? selectedDetection.id : 'NONE'}</strong></span>
        </div>
      </div>
    </div>
  );
};
