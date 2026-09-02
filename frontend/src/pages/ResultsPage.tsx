import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams, useLocation } from 'react-router-dom';
import { analysisService } from '../lib/services/analysisService';
import { Analysis, Detection } from '../lib/types/analysis';
import { SonarImageViewer } from '../components/sonar/SonarImageViewer';
import { SonarCanvas } from '../components/sonar/SonarCanvas';
import { useMissionContext } from '../context/MissionContext';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  CheckCircle2,
  Bell,
  Waves,
  Box,
  Share2,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  ShieldAlert,
  ChevronRight,
  Filter,
  CheckSquare
} from 'lucide-react';

export const ResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { id: routeDetectionId } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { activeMission, selectMissionById } = useMissionContext();

  const isDetectionDetailRoute = location.pathname.startsWith('/detection');
  const scanId = searchParams.get('id') || activeMission?.missionId || '';

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter State for Analysis Workspace List
  const [filterConfidence, setFilterConfidence] = useState<'ALL' | 'HIGH' | 'REVIEW'>('ALL');

  // Operational Action States
  const [isDownloadingCrop, setIsDownloadingCrop] = useState<boolean>(false);
  const [isAddedToReport, setIsAddedToReport] = useState<boolean>(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

  useEffect(() => {
    analysisService.getAnalysisById(scanId).then((res) => {
      if (res) {
        setAnalysis(res);
        if (routeDetectionId) {
          const found = res.detections.find(d => d.id.toLowerCase() === routeDetectionId.toLowerCase());
          if (found) setSelectedDetection(found);
          else if (res.detections.length > 0) setSelectedDetection(res.detections[0]);
        } else if (res.detections.length > 0 && !selectedDetection) {
          setSelectedDetection(res.detections[0]);
        }
      } else if (activeMission) {
        selectMissionById(activeMission.missionId);
      }
      setLoading(false);
    });
  }, [scanId, routeDetectionId, activeMission]);

  if (loading || !analysis) {
    return (
      <div className="p-12 text-center font-mono text-xs text-slate-400">
        RETRIEVING SAGARA TELEMETRY MATRIX [{scanId}]...
      </div>
    );
  }

  const activeDetection = selectedDetection || (analysis.detections.length > 0 ? analysis.detections[0] : null);

  // Download Crop Handler
  const handleDownloadCrop = () => {
    setIsDownloadingCrop(true);
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `SAGARA_Target_Crop_${activeDetection?.id || 'target'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
    setTimeout(() => {
      setIsDownloadingCrop(false);
      triggerToast('Target crop image downloaded successfully!');
    }, 800);
  };

  // Add to Report Toggle Handler
  const handleAddToReport = () => {
    setIsAddedToReport(!isAddedToReport);
    triggerToast(isAddedToReport ? 'Target removed from field report.' : 'Target added to field report compile list!');
  };

  // Share Result Handler
  const handleShareResult = () => {
    const url = window.location.origin + `/detection/${activeDetection?.id || 'DET-01'}?id=${analysis.id}`;
    navigator.clipboard.writeText(url);
    triggerToast('Target telemetry link copied to clipboard!');
  };

  const triggerToast = (msg: string) => {
    setShareToast(msg);
    setTimeout(() => setShareToast(null), 3000);
  };

  // Helper for Review Status Badge & Styling
  const getReviewBadge = (confidence: number) => {
    if (confidence >= 90) {
      return {
        label: 'HIGH CONFIDENCE',
        badgeStyle: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400',
        textStyle: 'text-emerald-400',
        subtext: 'Automatically accepted'
      };
    } else if (confidence >= 75) {
      return {
        label: 'NEEDS REVIEW',
        badgeStyle: 'bg-amber-950/80 border-amber-500/50 text-amber-400',
        textStyle: 'text-amber-400',
        subtext: 'Requires operator verification'
      };
    } else {
      return {
        label: 'LOW CONFIDENCE',
        badgeStyle: 'bg-cyan-950/80 border-cyan-500/50 text-cyan-400',
        textStyle: 'text-cyan-400',
        subtext: 'Potential false positive'
      };
    }
  };

  const filteredDetections = analysis.detections.filter((d) => {
    if (filterConfidence === 'HIGH') return d.confidence >= 90;
    if (filterConfidence === 'REVIEW') return d.confidence < 90;
    return true;
  });

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6 font-sans animate-fade-up select-none">
      {shareToast && (
        <div className="p-3.5 bg-[#0EA5E9]/10 border border-[#38BDF8]/40 rounded-lg font-mono text-xs text-[#38BDF8] flex items-center justify-between shadow-cyan-sm">
          <span>{shareToast}</span>
        </div>
      )}

      {/* ROUTE 1: 05 DETECTION DETAIL PAGE (/detection/:id) */}
      {isDetectionDetailRoute && activeDetection ? (
        <div className="space-y-6">
          {/* Top Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-[#38BDF8] font-mono text-base font-bold">05</span>
                <h1 className="text-2xl font-serif font-bold text-white tracking-wide">DETECTION DETAIL</h1>
              </div>
              <div>
                <button
                  onClick={() => navigate(`/analysis?id=${analysis.id}`)}
                  className="text-xs font-sans text-slate-400 hover:text-[#38BDF8] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Analysis</span>
                </button>
              </div>
            </div>

            {/* Right Bell Badge & User Header */}
            <div className="flex items-center gap-4">
              <div className="relative p-2 bg-[#050E1E] border border-slate-800 rounded-xl text-slate-300">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#38BDF8] rounded-full" />
              </div>

              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#0B132B]/80 border border-slate-800 rounded-xl font-mono text-xs">
                <div className="w-7 h-7 rounded-full bg-[#030712] border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] font-bold text-xs">
                  RS
                </div>
                <div className="text-slate-200 font-bold">Capt. R. Sharma</div>
              </div>
            </div>
          </div>

          {/* 2-Column Main Detection Detail Grid matching Image 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column: High-Contrast Gold Acoustic Sonar View */}
            <div className="lg:col-span-6 bg-[#0B132B]/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 h-[540px] flex flex-col justify-between relative overflow-hidden premium-hover-card">
              <div className="w-full h-full rounded-xl bg-[#02060E] border border-slate-800/80 relative overflow-hidden flex items-center justify-center">
                <SonarCanvas
                  detections={analysis.detections}
                  selectedDetectionId={activeDetection.id}
                  showOverlay={true}
                  showMasks={true}
                  showLabels={true}
                  seed={analysis.id}
                  customImageSrc={analysis.imageUrl}
                />

                {/* Floating Top-Left Controls */}
                <div className="absolute top-6 left-6 flex flex-col items-center bg-[#050E1E]/90 border border-slate-800 rounded-xl p-1 backdrop-blur-md z-20 font-mono text-xs shadow-lg">
                  <button className="p-2.5 text-slate-300 hover:text-[#38BDF8] transition-colors cursor-pointer" title="Zoom In">
                    <ZoomIn className="w-4.5 h-4.5" />
                  </button>
                  <div className="w-4 h-px bg-slate-800" />
                  <button className="p-2.5 text-slate-300 hover:text-[#38BDF8] transition-colors cursor-pointer" title="Zoom Out">
                    <ZoomOut className="w-4 h-4.5" />
                  </button>
                  <div className="w-4 h-px bg-slate-800" />
                  <button className="p-2.5 text-slate-300 hover:text-white transition-colors cursor-pointer" title="Maximize">
                    <Maximize2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Telemetry Parameters Matrix Panel */}
            <div className="lg:col-span-6 bg-[#0B132B]/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-5 font-sans text-xs flex flex-col justify-between premium-hover-card">
              <div className="space-y-4">
                {/* Object Type & Classification */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800/80">
                  <div className="space-y-1.5">
                    <span className="text-slate-400 text-xs block">Object Type</span>
                    <div className="flex items-center gap-2 text-white font-serif text-lg font-bold">
                      <div className="w-7 h-7 rounded-lg bg-[#030712] border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8]">
                        <Waves className="w-4 h-4 text-[#38BDF8]" />
                      </div>
                      <span>{activeDetection.classification}</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-slate-400 text-xs block">Classification</span>
                    <strong className="text-white text-base font-sans font-semibold block">{activeDetection.classification}</strong>
                  </div>
                </div>

                {/* Confidence & Review Status */}
                <div className="space-y-2 pb-4 border-b border-slate-800/80">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Confidence Score</span>
                    <span className="text-white font-mono font-bold text-sm">{activeDetection.confidence}%</span>
                  </div>

                  {(() => {
                    const badge = getReviewBadge(activeDetection.confidence);
                    return (
                      <div className="flex justify-between items-center text-xs pb-1">
                        <span className={`font-bold ${badge.textStyle}`}>{badge.label} ({activeDetection.confidence}%)</span>
                        <span className="text-[10px] text-slate-500 font-mono">{badge.subtext}</span>
                      </div>
                    );
                  })()}

                  <div className="w-full bg-[#030712] h-2 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-[#38BDF8] h-full transition-all duration-500 rounded-full" style={{ width: `${activeDetection.confidence}%` }} />
                  </div>
                </div>

                {/* Telemetry Matrix Key-Value Grid */}
                <div className="space-y-3 pb-4 border-b border-slate-800/80">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400 text-xs block">Estimated Size</span>
                      <strong className="text-white text-sm font-semibold">{activeDetection.estimatedSizeMeters.length} m</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs block">Estimated Length</span>
                      <strong className="text-white text-sm font-semibold">{activeDetection.estimatedSizeMeters.length * 1.1} m</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <span className="text-slate-400 text-xs block">Location</span>
                      <strong className="text-slate-200 text-xs font-mono">{activeDetection.location.lat.toFixed(4)}° N, {activeDetection.location.lng.toFixed(4)}° E</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs block">Timestamp</span>
                      <strong className="text-slate-200 text-xs">30 Aug 2026, 02:50 PM</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <span className="text-slate-400 text-xs block">Depth</span>
                      <strong className="text-slate-200 text-xs">{activeDetection.depthMeters} m</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs block">False Positive Probability</span>
                      <strong className="text-emerald-400 text-xs font-mono">{activeDetection.falsePositiveProbability || 2.7}%</strong>
                      <div className="w-full bg-[#030712] h-1.5 rounded-full overflow-hidden border border-slate-800 mt-1">
                        <div className="bg-emerald-400 h-full" style={{ width: `${activeDetection.falsePositiveProbability || 2.7}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div>
                  <span className="text-slate-400 text-xs block mb-1">Notes</span>
                  <p className="text-slate-300 font-sans text-xs leading-relaxed">
                    {activeDetection.notes || 'Likely abandoned fishing equipment entangled with benthic structure.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM ACTION BUTTONS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <button
              onClick={handleDownloadCrop}
              disabled={isDownloadingCrop}
              className={`py-3 px-6 rounded-xl border font-sans text-xs font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                isDownloadingCrop
                  ? 'bg-[#0EA5E9]/20 border-[#38BDF8]/40 text-[#38BDF8] opacity-75'
                  : 'bg-[#0B132B]/80 hover:bg-[#050E1E] text-slate-200 border-slate-800 hover:border-[#38BDF8]/40'
              }`}
            >
              {isDownloadingCrop ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#38BDF8]" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-[#38BDF8]" />
                  <span>Download Crop</span>
                </>
              )}
            </button>

            <button
              onClick={handleAddToReport}
              className={`py-3 px-6 rounded-xl font-sans text-xs font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                isAddedToReport
                  ? 'bg-emerald-950 border border-emerald-700 text-emerald-400'
                  : 'bg-[#0B132B]/80 hover:bg-[#050E1E] text-slate-200 border border-slate-800 hover:border-[#38BDF8]/40'
              }`}
            >
              {isAddedToReport ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Report</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-[#38BDF8]" />
                  <span>Add to Report</span>
                </>
              )}
            </button>

            <button
              onClick={handleShareResult}
              className="py-3 px-6 rounded-xl bg-[#0B132B]/80 hover:bg-[#050E1E] text-slate-200 border border-slate-800 hover:border-[#38BDF8]/40 font-sans text-xs font-bold transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#38BDF8]" />
              <span>Share Result</span>
            </button>
          </div>
        </div>
      ) : (
        /* ROUTE 2: 04 ANALYSIS WORKSPACE OVERVIEW PAGE (/analysis) */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div>
              <h1 className="text-3xl font-serif font-bold text-white flex items-center gap-3">
                <span className="text-[#38BDF8] font-mono text-xl font-bold">04</span>
                <span>ANALYSIS WORKSPACE</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono mt-1">
                SAGARA Mission ID: {analysis.id} • {analysis.metadata.locationName}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/reports?id=${analysis.id}`)}
                className="px-5 py-2.5 bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#030712] font-mono text-xs font-bold transition-all shadow-cyan-glow cursor-pointer rounded-xl flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>Generate Field Report</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Center-Left Sonar Viewer (Visual Hero) */}
            <div className="lg:col-span-8 bg-[#0B132B]/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 space-y-4 premium-hover-card flex flex-col justify-between">
              <div className="flex items-center justify-between font-mono text-xs border-b border-slate-800/80 pb-3">
                <span className="text-slate-300 font-bold flex items-center gap-2">
                  <Waves className="w-4 h-4 text-[#38BDF8]" />
                  <span>ACOUSTIC TARGET MATRIX</span>
                </span>
                <span className="text-[11px] text-[#38BDF8]">
                  {analysis.detections.length} Target Detections Active
                </span>
              </div>

              <div className="flex-1 min-h-[460px]">
                <SonarImageViewer
                  detections={analysis.detections}
                  selectedDetection={activeDetection}
                  onSelectDetection={(det) => {
                    if (det) {
                      setSelectedDetection(det);
                      navigate(`/detection/${det.id}?id=${analysis.id}`);
                    }
                  }}
                  seed={analysis.id}
                  customImageSrc={analysis.imageUrl}
                />
              </div>
            </div>

            {/* Right Panel: Detection List */}
            <div className="lg:col-span-4 bg-[#0B132B]/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-4 font-mono text-xs flex flex-col justify-between premium-hover-card">
              <div className="space-y-4">
                {/* Panel Header */}
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider">DETECTIONS</h3>
                    <span className="text-[10px] text-slate-400">{analysis.detections.length} OBJECTS IDENTIFIED</span>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setFilterConfidence('ALL')}
                      className={`px-2 py-1 rounded text-[10px] font-bold ${filterConfidence === 'ALL' ? 'bg-[#38BDF8] text-[#030712]' : 'bg-[#030712] text-slate-400'}`}
                    >
                      ALL
                    </button>
                    <button
                      onClick={() => setFilterConfidence('HIGH')}
                      className={`px-2 py-1 rounded text-[10px] font-bold ${filterConfidence === 'HIGH' ? 'bg-[#38BDF8] text-[#030712]' : 'bg-[#030712] text-slate-400'}`}
                    >
                      HIGH
                    </button>
                  </div>
                </div>

                {/* Detection List Cards */}
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {filteredDetections.map((det) => {
                    const badge = getReviewBadge(det.confidence);
                    const isSelected = activeDetection?.id === det.id;

                    return (
                      <div
                        key={det.id}
                        onClick={() => {
                          setSelectedDetection(det);
                          navigate(`/detection/${det.id}?id=${analysis.id}`);
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2 ${
                          isSelected
                            ? 'bg-[#38BDF8]/15 border-[#38BDF8] shadow-cyan-sm'
                            : 'bg-[#030712]/90 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.badgeStyle}`}>
                            [{badge.label}]
                          </span>
                          <span className="text-[#38BDF8] font-bold text-sm">{det.confidence}%</span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div>
                            <div className="font-bold text-sm text-white font-sans">{det.classification}</div>
                            <div className="text-[10px] text-slate-400">{det.estimatedSizeMeters.length}m est. size • Depth {det.depthMeters}m</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => {
                  if (activeDetection) {
                    navigate(`/detection/${activeDetection.id}?id=${analysis.id}`);
                  }
                }}
                className="w-full py-3 rounded-xl bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#030712] font-bold text-xs transition-all shadow-cyan-glow cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Inspect Target Specs</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
