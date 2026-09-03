import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useMissionContext } from '../context/MissionContext';
import { reportService, SAGARAStructuredJSONReport } from '../lib/services/reportService';
import { 
  Download, 
  FileText, 
  Check, 
  ArrowLeft, 
  Loader2, 
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  Code2,
  X,
  Upload,
  ChevronRight,
  Database
} from 'lucide-react';

export const ReportPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeMission, missions } = useMissionContext();

  const scanId = searchParams.get('id') || activeMission?.missionId || '';
  const currentMission = missions.find((m) => m.missionId.toLowerCase() === scanId.toLowerCase()) || activeMission;

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGeneratingJson, setIsGeneratingJson] = useState<boolean>(false);
  const [isGeneratingCsv, setIsGeneratingCsv] = useState<boolean>(false);
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);

  if (!currentMission) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto font-sans animate-fade-up select-none">
        <div className="bg-[#0B132B]/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-16 text-center space-y-4 font-mono text-xs premium-hover-card">
          <div className="w-16 h-16 rounded-2xl bg-[#030712] border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] mx-auto shadow-cyan-glow">
            <FileCode className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-serif font-bold text-white tracking-wide">NO REPORT DATA AVAILABLE</h2>
            <p className="text-xs text-slate-400 font-sans max-w-md mx-auto">
              Upload and process a sonar scan to generate a structured anomaly report.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate('/upload')}
              className="px-6 py-3 rounded-xl bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#030712] font-bold transition-all shadow-cyan-glow inline-flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Sonar Scan</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const detections = currentMission.detections || [];
  const jsonReport: SAGARAStructuredJSONReport = reportService.generateJSONReport(currentMission, detections);

  const highConfidenceCount = jsonReport.summary.high_confidence;
  const needsReviewCount = jsonReport.summary.needs_review;
  const lowConfidenceCount = jsonReport.summary.low_confidence;

  // JSON Download Handler
  const handleDownloadJson = () => {
    if (isGeneratingJson || isGeneratingCsv) return;
    setIsGeneratingJson(true);
    showToast('Generating structured JSON report payload...');

    setTimeout(() => {
      const filename = `SAGARA_${currentMission.missionId}_report.json`;
      reportService.downloadJSONReport(jsonReport, filename);
      setIsGeneratingJson(false);
      showToast(`JSON Report downloaded: ${filename}`);
    }, 1200);
  };

  // CSV Download Handler
  const handleDownloadCsv = () => {
    if (isGeneratingJson || isGeneratingCsv) return;
    setIsGeneratingCsv(true);
    showToast('Generating CSV telemetry spreadsheet...');

    setTimeout(() => {
      const csvData = reportService.generateCSVReport(currentMission, detections);
      const filename = `SAGARA_${currentMission.missionId}_detections.csv`;
      reportService.downloadCSVReport(csvData, filename);
      setIsGeneratingCsv(false);
      showToast(`CSV Telemetry downloaded: ${filename}`);
    }, 1200);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-6 font-sans animate-fade-up select-none">
      {toastMessage && (
        <div className="p-3.5 bg-[#0EA5E9]/10 border border-[#38BDF8]/40 rounded-lg font-mono text-xs text-[#38BDF8] flex items-center justify-between shadow-cyan-sm">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. REPORTS PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white flex items-center gap-3">
            <span className="w-1.5 h-6 bg-[#38BDF8] rounded-full" />
            <span>Mission Intelligence & Field Reports</span>
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Export verified acoustic detections, spatial coordinates, classification results, and mission metadata.
          </p>
        </div>

        {/* Action Export Quick Buttons */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <button
            onClick={handleDownloadJson}
            disabled={isGeneratingJson || isGeneratingCsv}
            className="px-4 py-2 bg-[#050E1E] hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-[#38BDF8]" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            disabled={isGeneratingJson || isGeneratingCsv}
            className="px-4 py-2 bg-[#050E1E] hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. EXPORT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Structured JSON Mission Report */}
        <div className="bg-[#0B132B]/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-4 font-mono text-xs flex flex-col justify-between premium-hover-card">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#030712] border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8]">
                <FileCode className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-cyan-950/80 border border-[#38BDF8]/50 text-[#38BDF8]">
                JSON REPORT
              </span>
            </div>

            <div className="space-y-1 font-sans">
              <h3 className="text-lg font-bold text-white">Structured JSON Mission Report</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Machine-readable report containing mission metadata, detected anomalies, confidence scores, dimensions, and geospatial coordinates.
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadJson}
            disabled={isGeneratingJson || isGeneratingCsv}
            className={`w-full py-3 rounded-xl font-bold transition-all shadow-cyan-glow flex items-center justify-center gap-2 cursor-pointer ${
              isGeneratingJson
                ? 'bg-[#38BDF8]/60 text-[#030712] cursor-not-allowed pointer-events-none'
                : 'bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#030712]'
            }`}
          >
            {isGeneratingJson ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#030712]" />
                <span>Compiling JSON Data...</span>
              </>
            ) : (
              <>
                <FileCode className="w-4 h-4" />
                <span>Download JSON Report</span>
              </>
            )}
          </button>
        </div>

        {/* Card 2: CSV Telemetry Spreadsheet */}
        <div className="bg-[#0B132B]/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-4 font-mono text-xs flex flex-col justify-between premium-hover-card">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-[#030712] border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-400">
                CSV TELEMETRY
              </span>
            </div>

            <div className="space-y-1 font-sans">
              <h3 className="text-lg font-bold text-white">CSV Telemetry Spreadsheet</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tabular anomaly export including Detection ID, Coordinates, Depth, Dimensions, and Review Status for spreadsheet analysis.
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadCsv}
            disabled={isGeneratingJson || isGeneratingCsv}
            className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isGeneratingCsv
                ? 'bg-emerald-500/60 text-[#030712] cursor-not-allowed pointer-events-none'
                : 'bg-[#050E1E] hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-emerald-500/50'
            }`}
          >
            {isGeneratingCsv ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#030712]" />
                <span>Exporting CSV...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Export CSV Detections</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 8. JSON REPORT PREVIEW CANVAS */}
      <div className="bg-[#0B132B]/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-8 space-y-8 font-sans shadow-2xl">
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#38BDF8] tracking-widest uppercase block">
              JSON REPORT PREVIEW
            </span>
            <h2 className="text-2xl font-serif font-bold text-white">
              SAGARA STRUCTURED ANOMALY REPORT
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Generated: {new Date().toLocaleString()} • File: <span className="text-[#38BDF8]">SAGARA_{currentMission.missionId}_report.json</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 rounded-full font-mono text-xs font-bold">
              READY TO EXPORT
            </span>

            <button
              onClick={() => setShowJsonModal(!showJsonModal)}
              className="px-4 py-1.5 rounded-lg bg-[#050E1E] hover:bg-[#38BDF8] text-[#38BDF8] hover:text-[#030712] border border-[#38BDF8]/40 font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>{showJsonModal ? 'Hide Raw JSON' : 'View JSON'}</span>
            </button>
          </div>
        </div>

        {/* Modal / Expandable Raw JSON Viewer */}
        {showJsonModal && (
          <div className="p-4 bg-[#030712] rounded-xl border border-slate-800 font-mono text-xs text-slate-300 max-h-96 overflow-y-auto space-y-2 animate-fade-up">
            <div className="flex justify-between items-center text-slate-400 text-[10px] pb-2 border-b border-slate-800">
              <span>RAW JSON DATA OBJECT PAYLOAD</span>
              <button onClick={() => setShowJsonModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre className="text-[11px] leading-relaxed text-[#38BDF8] overflow-x-auto whitespace-pre">
              {JSON.stringify(jsonReport, null, 2)}
            </pre>
          </div>
        )}

        {/* 1. REPORT METADATA */}
        <div className="space-y-3">
          <h3 className="text-sm font-serif font-bold text-[#38BDF8] uppercase tracking-wider">
            REPORT SPECIFICATION
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs bg-[#030712] p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px]">REPORT ID</span>
              <strong className="text-white text-xs">{jsonReport.report.report_id}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">SYSTEM</span>
              <strong className="text-slate-200 text-xs">{jsonReport.report.system} (v{jsonReport.report.version})</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">GENERATED AT</span>
              <strong className="text-[#38BDF8] text-xs">{new Date(jsonReport.report.generated_at).toLocaleTimeString()}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">EXPORT FORMAT</span>
              <strong className="text-emerald-400 text-xs">JSON (ISO-8601)</strong>
            </div>
          </div>
        </div>

        {/* 2. MISSION PARAMETERS */}
        <div className="space-y-3">
          <h3 className="text-sm font-serif font-bold text-[#38BDF8] uppercase tracking-wider">
            MISSION PARAMETERS
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs bg-[#030712] p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px]">MISSION ID</span>
              <strong className="text-white text-xs">{jsonReport.mission.mission_id}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">DATASET FILE</span>
              <strong className="text-slate-200 text-xs">{jsonReport.mission.dataset_file}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">LOCATION</span>
              <strong className="text-[#38BDF8] text-xs">{jsonReport.mission.location}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">SURVEY DATE</span>
              <strong className="text-slate-200 text-xs">{jsonReport.mission.survey_date}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">DEPTH</span>
              <strong className="text-slate-200 text-xs">{jsonReport.mission.depth} m</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">FREQUENCY</span>
              <strong className="text-slate-200 text-xs">{jsonReport.mission.frequency}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">SWATH WIDTH</span>
              <strong className="text-slate-200 text-xs">{jsonReport.mission.swath_width} m</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">VESSEL PLATFORM</span>
              <strong className="text-slate-200 text-xs">{jsonReport.mission.vessel}</strong>
            </div>
          </div>
        </div>

        {/* 3. SUMMARY METRICS */}
        <div className="space-y-3">
          <h3 className="text-sm font-serif font-bold text-[#38BDF8] uppercase tracking-wider">
            ANOMALY SUMMARY METRICS
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-4 bg-[#030712] border border-slate-800 rounded-xl space-y-1">
              <span className="text-slate-500 text-[10px]">TOTAL ANOMALIES</span>
              <div className="text-2xl font-serif font-bold text-white">{jsonReport.summary.total_detections}</div>
            </div>
            <div className="p-4 bg-[#030712] border border-slate-800 rounded-xl space-y-1">
              <span className="text-slate-500 text-[10px]">HIGH CONFIDENCE</span>
              <div className="text-2xl font-serif font-bold text-emerald-400">{highConfidenceCount}</div>
            </div>
            <div className="p-4 bg-[#030712] border border-slate-800 rounded-xl space-y-1">
              <span className="text-slate-500 text-[10px]">NEEDS REVIEW</span>
              <div className="text-2xl font-serif font-bold text-amber-400">{needsReviewCount}</div>
            </div>
            <div className="p-4 bg-[#030712] border border-slate-800 rounded-xl space-y-1">
              <span className="text-slate-500 text-[10px]">LOW CONFIDENCE</span>
              <div className="text-2xl font-serif font-bold text-cyan-400">{lowConfidenceCount}</div>
            </div>
          </div>
        </div>

        {/* 4. DETECTIONS TABLE */}
        <div className="space-y-3">
          <h3 className="text-sm font-serif font-bold text-[#38BDF8] uppercase tracking-wider">
            DETECTION PAYLOAD MATRIX
          </h3>
          <div className="bg-[#030712] rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-[#050E1E] text-slate-400 text-[11px]">
                  <th className="py-3 px-4">Detection ID</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">False Pos Prob</th>
                  <th className="py-3 px-4">WGS84 Coordinates</th>
                  <th className="py-3 px-4">Depth</th>
                  <th className="py-3 px-4">Dimensions</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {jsonReport.detections.map((det) => (
                  <tr key={det.detection_id} className="hover:bg-[#0B132B]/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#38BDF8]">{det.detection_id}</td>
                    <td className="py-3.5 px-4 text-white font-sans font-semibold">{det.classification}</td>
                    <td className="py-3.5 px-4 text-emerald-400 font-bold">{det.confidence}%</td>
                    <td className="py-3.5 px-4 text-slate-400">{det.false_positive_probability}%</td>
                    <td className="py-3.5 px-4 text-slate-300">{det.location.latitude.toFixed(4)}° N, {det.location.longitude.toFixed(4)}° E</td>
                    <td className="py-3.5 px-4 text-slate-300">{det.location.depth} m</td>
                    <td className="py-3.5 px-4 text-slate-300">{det.dimensions.length}m × {det.dimensions.width}m</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        det.confidence >= 90
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                          : 'bg-amber-950 text-amber-400 border border-amber-700'
                      }`}>
                        {det.review_status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
