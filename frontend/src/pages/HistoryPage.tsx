import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMissionContext } from '../context/MissionContext';
import { Search, History as HistoryIcon, PlusCircle, Upload } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { missions, setActiveMission } = useMissionContext();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('All Classes');

  const filteredMissions = missions.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      m.missionId.toLowerCase().includes(q) ||
      m.fileName.toLowerCase().includes(q) ||
      m.location.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (classFilter !== 'All Classes') {
      const hasClass = m.detections.some((d) =>
        d.classification.toLowerCase().includes(classFilter.toLowerCase())
      );
      if (!hasClass) return false;
    }

    return true;
  });

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6 font-sans animate-fade-up select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <span className="w-1.5 h-6 bg-[#38BDF8] rounded-full" />
            <span>Scan History Archive</span>
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Searchable telemetry log of all SAGARA side-scan acoustic survey runs
          </p>
        </div>
      </div>

      {/* Toolbar Search & Filters */}
      <div className="bg-[#0B132B]/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs premium-hover-card">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Scan ID or Location..."
            className="w-full bg-[#030712] border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:border-[#38BDF8] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="bg-[#030712] border border-slate-800 rounded-lg px-3.5 py-2 text-slate-200 focus:border-[#38BDF8] focus:outline-none"
          >
            <option value="All Classes">All Object Classes</option>
            <option value="Ghost Net">Ghost Nets</option>
            <option value="Marine Debris">Marine Debris</option>
            <option value="Metal">Metal Gear</option>
          </select>
        </div>
      </div>

      {/* Table Container or Empty State View */}
      {filteredMissions.length === 0 ? (
        /* Empty State Display matching exact specifications */
        <div className="bg-[#0B132B]/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-16 text-center space-y-4 font-sans premium-hover-card">
          <div className="w-16 h-16 rounded-2xl bg-[#030712] border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] mx-auto shadow-cyan-glow">
            <HistoryIcon className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-display font-bold text-white tracking-wide">NO SCAN HISTORY</h2>
            <p className="text-xs text-slate-400 font-sans max-w-sm mx-auto">
              No sonar missions have been processed yet. Upload a .zip file to initialize your first survey mission.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate('/upload')}
              className="px-6 py-3 rounded-xl bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#030712] font-mono text-xs font-bold transition-all shadow-cyan-glow inline-flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Sonar Scan</span>
            </button>
          </div>
        </div>
      ) : (
        /* History Records Table */
        <div className="bg-[#0B132B]/60 backdrop-blur-md border border-slate-800/80 rounded-2xl overflow-hidden premium-hover-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-slate-800/80 bg-[#030712] text-slate-400 font-mono text-[11px]">
                  <th className="py-4 px-4">Scan ID</th>
                  <th className="py-4 px-4">Location</th>
                  <th className="py-4 px-4">Date & Time</th>
                  <th className="py-4 px-4">Depth</th>
                  <th className="py-4 px-4">Top Class</th>
                  <th className="py-4 px-4">Confidence</th>
                  <th className="py-4 px-4">Objects</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredMissions.map((item) => {
                  const topClass = item.detections.length > 0 ? item.detections[0].classification : 'Clean';
                  const avgConfidence = item.detections.length > 0
                    ? (item.detections.reduce((sum, d) => sum + d.confidence, 0) / item.detections.length).toFixed(1)
                    : 'N/A';

                  return (
                    <tr key={item.missionId} className="hover:bg-[#0B132B]/60 transition-colors">
                      <td className="py-4 px-4 font-bold text-[#38BDF8]">{item.missionId}</td>
                      <td className="py-4 px-4 font-sans text-slate-200">{item.location}</td>
                      <td className="py-4 px-4 text-slate-400">{item.surveyDate}</td>
                      <td className="py-4 px-4 text-slate-300">{item.depth}m</td>
                      <td className="py-4 px-4">
                        <span className="px-3 py-1 rounded-full bg-[#030712] text-slate-200 border border-slate-800 font-sans text-[11px]">
                          {topClass}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[#38BDF8] font-bold">
                        {avgConfidence !== 'N/A' ? `${avgConfidence}%` : 'N/A'}
                      </td>
                      <td className="py-4 px-4 text-slate-300 font-bold">{item.detections.length}</td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/50 text-emerald-400">
                          COMPLETED
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setActiveMission(item);
                              navigate(`/analysis?id=${item.missionId}`);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#050E1E] hover:bg-[#38BDF8] text-slate-200 hover:text-[#030712] border border-slate-800 text-[10px] font-bold transition-all"
                          >
                            View Analysis
                          </button>
                          <button
                            onClick={() => {
                              setActiveMission(item);
                              navigate(`/map?id=${item.missionId}`);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#050E1E] hover:bg-[#38BDF8] text-slate-200 hover:text-[#030712] border border-slate-800 text-[10px] font-bold transition-all"
                          >
                            Map
                          </button>
                          <button
                            onClick={() => {
                              setActiveMission(item);
                              navigate(`/reports?id=${item.missionId}`);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#050E1E] hover:bg-[#38BDF8] text-slate-200 hover:text-[#030712] border border-slate-800 text-[10px] font-bold transition-all"
                          >
                            Report
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
