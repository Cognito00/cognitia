import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMissionContext } from '../context/MissionContext';
import { MOCK_PROCESSING_STAGES } from '../lib/mock/mockProcessingStates';
import { 
  PlusCircle, 
  Upload, 
  Search, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  XCircle, 
  ChevronRight, 
  FileCode, 
  Waves, 
  AlertCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeMission } = useMissionContext();

  const detections = activeMission?.detections || [];
  const highConfidenceCount = detections.filter((d) => d.confidence >= 90).length;
  const needsReviewCount = detections.filter((d) => d.confidence >= 70 && d.confidence < 90).length;
  const lowConfidenceCount = detections.filter((d) => d.confidence < 70).length;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 font-sans animate-fade-up select-none">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-white flex items-center gap-3">
            <span className="w-1.5 h-6 bg-[#38BDF8] rounded-full" />
            <span>MISSION OVERVIEW</span>
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Monitor the active sonar survey, detection results, and analysis status.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <button
            onClick={() => navigate('/upload')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#030712] font-bold rounded-xl transition-all shadow-cyan-glow cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Upload .ZIP</span>
          </button>
        </div>
      </div>

      {/* 2. ACTIVE MISSION PANEL or NO ACTIVE MISSION STATE */}
      {!activeMission ? (
        /* NO ACTIVE MISSION STATE */
        <div className="bg-[#0B132B]/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-10 text-center space-y-4 font-mono text-xs premium-hover-card">
          <div className="w-16 h-16 rounded-2xl bg-[#030712] border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] mx-auto shadow-cyan-glow">
            <Upload className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-serif font-bold text-white tracking-wide">NO ACTIVE MISSION</h2>
            <p className="text-xs text-slate-400 font-sans max-w-md mx-auto">
              Upload a sonar data .zip file to begin a SAGARA analysis mission.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => navigate('/upload')}
              className="px-6 py-3 rounded-xl bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#030712] font-bold transition-all shadow-cyan-glow inline-flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload .ZIP</span>
            </button>
          </div>
        </div>
      ) : (
        /* ACTIVE MISSION PANEL */
        <div className="space-y-6">
          <div className="bg-[#0B132B]/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-6 font-mono text-xs premium-hover-card">
            {/* Header & Status Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#030712] border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8]">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">ACTIVE MISSION:</span>
                    <strong className="text-white text-base font-bold">{activeMission.missionId}</strong>
                  </div>
                  <div className="text-[11px] text-[#38BDF8]">{activeMission.fileName} ({(Number(activeMission.fileSize || 48000000) / (1024 * 1024)).toFixed(2)} MB)</div>
                </div>
              </div>

              {/* Mission Status Badge */}
              <div>
                <span className={`px-3 py-1 rounded-full border text-xs font-bold inline-flex items-center gap-1.5 ${
                  activeMission.status === 'completed'
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
                    : activeMission.status === 'processing'
                    ? 'bg-cyan-950/80 border-[#38BDF8]/50 text-[#38BDF8] animate-pulse'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                  <span>● {activeMission.status.toUpperCase()}</span>
                </span>
              </div>
            </div>

            {/* Mission Telemetry Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#030712] p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px]">SURVEY LOCATION</span>
                <strong className="text-white text-xs">{activeMission.location}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">SURVEY DEPTH</span>
                <strong className="text-[#38BDF8] text-xs">{activeMission.depth} m</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">SONAR FREQUENCY</span>
                <strong className="text-slate-200 text-xs">{activeMission.sonarFrequency}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">VESSEL PLATFORM</span>
                <strong className="text-slate-200 text-xs">{activeMission.vessel}</strong>
              </div>
            </div>

            {/* Mission Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => navigate(`/analysis?id=${activeMission.missionId}`)}
                className="px-5 py-2.5 rounded-xl bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#030712] font-bold transition-all shadow-cyan-glow flex items-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Open Analysis</span>
              </button>

              <button
                onClick={() => navigate(`/map?id=${activeMission.missionId}`)}
                className="px-5 py-2.5 rounded-xl bg-[#050E1E] hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-[#38BDF8]" />
                <span>View Map</span>
              </button>

              <button
                onClick={() => navigate(`/reports?id=${activeMission.missionId}`)}
                className="px-5 py-2.5 rounded-xl bg-[#050E1E] hover:bg-slate-800 text-slate-200 border border-slate-800 font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Generate Report</span>
              </button>
            </div>
          </div>

          {/* 4. DETECTION SUMMARY STATS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-4 bg-[#0B132B]/40 backdrop-blur-md border border-slate-800/80 rounded-xl space-y-1 premium-hover-card">
              <span className="text-slate-400 text-[10px] uppercase">TOTAL DETECTIONS</span>
              <div className="text-3xl font-serif font-bold text-white">{detections.length}</div>
            </div>
            <div className="p-4 bg-[#0B132B]/40 backdrop-blur-md border border-slate-800/80 rounded-xl space-y-1 premium-hover-card">
              <span className="text-slate-400 text-[10px] uppercase">HIGH CONFIDENCE</span>
              <div className="text-3xl font-serif font-bold text-emerald-400">{highConfidenceCount}</div>
            </div>
            <div className="p-4 bg-[#0B132B]/40 backdrop-blur-md border border-slate-800/80 rounded-xl space-y-1 premium-hover-card">
              <span className="text-slate-400 text-[10px] uppercase">NEEDS REVIEW</span>
              <div className="text-3xl font-serif font-bold text-amber-400">{needsReviewCount}</div>
            </div>
            <div className="p-4 bg-[#0B132B]/40 backdrop-blur-md border border-slate-800/80 rounded-xl space-y-1 premium-hover-card">
              <span className="text-slate-400 text-[10px] uppercase">LOW CONFIDENCE</span>
              <div className="text-3xl font-serif font-bold text-cyan-400">{lowConfidenceCount}</div>
            </div>
          </div>

          {/* 5. PROCESSING PIPELINE STATUS & 6. RECENT DETECTIONS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch font-sans text-xs">
            {/* Left: Processing Pipeline Status (5 Cols) */}
            <div className="lg:col-span-5 bg-[#0B132B]/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-4 font-mono premium-hover-card">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider">
                  PROCESSING PIPELINE STATUS
                </h3>
                <span className="text-[10px] text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-0.5 rounded border border-[#38BDF8]/30">
                  8 STAGES
                </span>
              </div>

              <div className="space-y-2.5 pt-1">
                {MOCK_PROCESSING_STAGES.map((stg, idx) => {
                  const isCompleted = activeMission.status === 'completed';
                  return (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-[#030712]/80 border border-slate-800 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isCompleted
                            ? 'bg-emerald-950 border border-emerald-500 text-emerald-400'
                            : 'bg-slate-900 border border-slate-700 text-slate-500'
                        }`}>
                          {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                        </span>
                        <span className="text-slate-200 font-semibold text-xs font-sans">{stg.name}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold">
                        {isCompleted ? '✓ Completed' : '○ Pending'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Recent Detections List (7 Cols) */}
            <div className="lg:col-span-7 bg-[#0B132B]/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-4 font-mono premium-hover-card flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                  <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider">
                    RECENT TARGET DETECTIONS ({detections.length})
                  </h3>
                </div>

                <div className="space-y-3 max-h-[440px] overflow-y-auto pr-1">
                  {detections.map((det) => (
                    <div
                      key={det.detectionId}
                      onClick={() => navigate(`/detection/${det.detectionId}?id=${activeMission.missionId}`)}
                      className="p-3.5 bg-[#030712]/90 border border-slate-800 hover:border-[#38BDF8]/60 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] group-hover:animate-ping" />
                        <div>
                          <div className="font-bold text-white font-sans text-xs">{det.classification}</div>
                          <div className="text-[10px] text-slate-400">{det.detectionId} • Depth: {det.depth}m</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-emerald-400 font-bold text-xs">{det.confidence}%</span>
                          <div className="text-[9px] text-slate-500 uppercase">{det.reviewStatus}</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/detection/${det.detectionId}?id=${activeMission.missionId}`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#050E1E] hover:bg-[#38BDF8] text-slate-200 hover:text-[#030712] border border-slate-800 text-[10px] font-bold transition-all flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
