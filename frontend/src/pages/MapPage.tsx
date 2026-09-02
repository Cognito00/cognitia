import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MarineMap } from '../components/map/MarineMap';
import { useMissionContext } from '../context/MissionContext';
import { Search, Compass, MapPin, Layers, Radio, Anchor, Eye, ArrowRight, ExternalLink } from 'lucide-react';

export const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeMission, missions, selectMissionById } = useMissionContext();

  const scanId = searchParams.get('id') || activeMission?.missionId || '';
  const currentMission = missions.find((m) => m.missionId.toLowerCase() === scanId.toLowerCase()) || activeMission;

  const [searchQuery, setSearchQuery] = useState<string>('');

  const detections = currentMission?.detections || [];
  const filteredDetections = detections.filter((det) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      det.detectionId.toLowerCase().includes(q) ||
      det.classification.toLowerCase().includes(q) ||
      det.notes.toLowerCase().includes(q)
    );
  });

  const highConfidenceCount = detections.filter((d) => d.confidence >= 90).length;
  const reviewRequiredCount = detections.filter((d) => d.confidence < 90).length;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6 font-sans animate-fade-up select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white flex items-center gap-3">
            <span className="w-1.5 h-6 bg-[#38BDF8] rounded-full" />
            <span>Debris Map Tracker</span>
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Benthic Sonar Survey Map • Mission ID: <span className="font-mono text-[#38BDF8] font-bold">{currentMission?.missionId || scanId}</span>
          </p>
        </div>

        {/* Target & Sector Search */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Detection ID or Object..."
              className="w-full bg-[#030712] border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:border-[#38BDF8] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Bathymetric Survey Map Console + Right Target Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Main Bathymetric Survey Console */}
        <div className="lg:col-span-8 bg-[#0B132B]/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 premium-hover-card relative overflow-hidden">
          <MarineMap
            height="620px"
            showFilters={true}
            selectedScanId={scanId}
          />
        </div>

        {/* Right Sidebar: Mission & Detections Telemetry Summary Panel */}
        <div className="lg:col-span-4 bg-[#0B132B]/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-5 font-mono text-xs flex flex-col justify-between premium-hover-card">
          <div className="space-y-4">
            {/* Mission Summary Card */}
            <div className="p-4 bg-[#030712] rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-slate-300 font-bold border-b border-slate-800/80 pb-2">
                <span>SURVEY SUMMARY</span>
                <span className="text-[#38BDF8]">{currentMission?.location || 'Goa EEZ Sector B2'}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-slate-500 block">DEPTH</span>
                  <span className="text-white font-bold">{currentMission?.depth || 25} m</span>
                </div>
                <div>
                  <span className="text-slate-500 block">FREQUENCY</span>
                  <span className="text-white font-bold">{currentMission?.sonarFrequency || '800 kHz'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">HIGH CONFIDENCE</span>
                  <span className="text-emerald-400 font-bold">{highConfidenceCount} Objects</span>
                </div>
                <div>
                  <span className="text-slate-500 block">NEEDS REVIEW</span>
                  <span className="text-amber-400 font-bold">{reviewRequiredCount} Objects</span>
                </div>
              </div>
            </div>

            {/* Detections Telemetry List */}
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
              <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider">
                TARGET DETECTIONS ({filteredDetections.length})
              </h3>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {filteredDetections.map((det) => (
                <div
                  key={det.detectionId}
                  className="p-3.5 rounded-xl bg-[#030712] border border-slate-800 hover:border-[#38BDF8]/60 cursor-pointer transition-all space-y-2 group"
                  onClick={() => navigate(`/detection/${det.detectionId}?id=${currentMission?.missionId}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] group-hover:animate-ping" />
                      <span className="font-bold text-white font-sans text-xs">{det.classification}</span>
                    </div>
                    <span className="font-bold text-[#38BDF8] text-xs">{det.confidence}%</span>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                    <span>{det.detectionId} • Depth: {det.depth}m</span>
                    <span>{det.estimatedLength}m size</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/detection/${det.detectionId}?id=${currentMission?.missionId}`);
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-[#050E1E] hover:bg-[#38BDF8] text-slate-300 hover:text-[#030712] border border-slate-800 text-[10px] font-bold transition-all text-center"
                    >
                      Inspect Detection
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/analysis?id=${currentMission?.missionId}`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#050E1E] hover:bg-slate-800 text-[#38BDF8] border border-[#38BDF8]/40 text-[10px] font-bold transition-all flex items-center gap-1"
                    >
                      <span>Analysis</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate(`/analysis?id=${currentMission?.missionId}`)}
            className="w-full py-3.5 rounded-xl bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#030712] font-mono text-xs font-bold transition-all shadow-cyan-glow flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <span>View Full Analysis Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
