import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMissionContext } from '../context/MissionContext';
import { sonarService } from '../lib/services/sonarService';
import { ProcessingStage } from '../lib/types/analysis';
import { MOCK_PROCESSING_STAGES } from '../lib/mock/mockProcessingStates';
import { 
  Upload, 
  FileCode, 
  Check, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight, 
  FolderOpen,
  Loader2,
  Sliders,
  Bell,
  CheckCircle2,
  XCircle,
  RotateCcw,
  X
} from 'lucide-react';

export const NewAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveMission } = useMissionContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Parameters
  const [locationName, setLocationName] = useState<string>('Goa Coastal Shelf Sector 2');
  const [depthMeters, setDepthMeters] = useState<number>(25);
  const [frequency, setFrequency] = useState<string>('800 kHz High Precision');
  const [swathWidth, setSwathWidth] = useState<number>(100);
  const [dateTime, setDateTime] = useState<string>(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState<string>('Priority marine anomaly survey run.');

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Processing Pipeline State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStages, setProcessingStages] = useState<ProcessingStage[]>(MOCK_PROCESSING_STAGES);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [processingFailed, setProcessingFailed] = useState<boolean>(false);
  const [failedStageName, setFailedStageName] = useState<string>('');
  const [simulateFailureToggle, setSimulateFailureToggle] = useState<boolean>(false);

  // Strict .ZIP File Extension & Size Validation
  const validateAndSetFile = (selectedFile: File) => {
    setFileError(null);
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';

    // Validate strict .ZIP file format
    if (ext !== 'zip') {
      setFileError('Invalid file format. Please upload a .zip file.');
      setFile(null);
      return;
    }

    // Validate 500 MB max size limit
    const MAX_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB
    if (selectedFile.size > MAX_SIZE_BYTES) {
      setFileError('File exceeds the maximum supported size (500 MB). Please select a smaller .zip archive.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleAbortMission = () => {
    setFile(null);
    setFileError(null);
    navigate('/dashboard');
  };

  const startPipeline = async () => {
    if (!file) {
      setFileError('Please upload a valid .zip file before starting analysis.');
      return;
    }

    // Create / initialize mission object
    const createdMission = await sonarService.processSonData(file, {
      location: locationName,
      surveyDate: dateTime,
      depth: depthMeters,
      sonarFrequency: frequency,
      notes: notes,
      vessel: 'INS Sagar Kanya (MoES-04)'
    });

    setActiveMission(createdMission);
    navigate('/processing');
  };

  const runPipelineSimulation = async (missionId: string) => {
    setIsProcessing(true);
    setProcessingFailed(false);
    setOverallProgress(0);

    const stages: ProcessingStage[] = MOCK_PROCESSING_STAGES.map((s) => ({ ...s, status: 'pending' }));
    setProcessingStages(stages);

    for (let i = 0; i < stages.length; i++) {
      // Simulate signal failure toggle on stage 3 (AI Feature Extraction)
      if (simulateFailureToggle && i === 3) {
        stages[i].status = 'failed';
        setProcessingStages([...stages]);
        setProcessingFailed(true);
        setFailedStageName(stages[i].name);
        return;
      }

      stages[i].status = 'in_progress';
      setProcessingStages([...stages]);
      setOverallProgress(Math.round(((i + 0.5) / stages.length) * 100));

      await new Promise((resolve) => setTimeout(resolve, 800));

      stages[i].status = 'completed';
      setProcessingStages([...stages]);
      setOverallProgress(Math.round(((i + 1) / stages.length) * 100));
    }

    // Simulation Complete -> Navigate to Map
    setTimeout(() => {
      navigate('/map');
    }, 600);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6 font-sans animate-fade-up select-none">
      {!isProcessing ? (
        /* MAIN UPLOAD VIEW */
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div>
              <h1 className="text-3xl font-serif font-bold text-white flex items-center gap-3">
                <span className="w-1.5 h-6 bg-[#38BDF8] rounded-full" />
                <span>Upload Sonar Scan</span>
              </h1>
              <p className="text-xs text-slate-400 font-sans mt-1">
                Submit your sonar data .zip archive for AI analysis
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Simulate Signal Error Toggle */}
              <div className="flex items-center gap-2 bg-[#050E1E] border border-slate-800 px-3.5 py-1.5 rounded-lg text-xs font-mono text-slate-400">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulate Error:</span>
                <input
                  type="checkbox"
                  checked={simulateFailureToggle}
                  onChange={(e) => setSimulateFailureToggle(e.target.checked)}
                  className="rounded bg-[#030712] border-slate-700 text-[#38BDF8] focus:ring-0 cursor-pointer"
                />
              </div>

              {/* User Profile Header Badge */}
              <div className="flex items-center gap-3 bg-[#0B132B]/60 px-3 py-1.5 rounded-xl border border-slate-800/80">
                <div className="relative">
                  <Bell className="w-4 h-4 text-slate-400" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#38BDF8]" />
                </div>
                <div className="w-7 h-7 rounded-full bg-[#030712] border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] font-bold text-xs">
                  RS
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid: Upload Center + Right Mission Parameters Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Center Main Sonar Upload Workstation Panel (Left 7 Cols) */}
            <div className="lg:col-span-7 bg-[#0B132B]/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden min-h-[520px] premium-hover-card">
              {/* Hidden Native File Input (.ZIP format only) */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,.ZIP,application/zip,application/x-zip-compressed"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])}
              />

              {/* Interactive Dropzone Box */}
              <div
                onClick={triggerFilePicker}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`w-full flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-all cursor-pointer relative overflow-hidden ${
                  isDragging
                    ? 'border-[#38BDF8] bg-[#38BDF8]/10'
                    : file
                    ? 'border-emerald-500/80 bg-emerald-950/20'
                    : 'border-[#38BDF8]/30 hover:border-[#38BDF8]/60 bg-[#030712]/90'
                }`}
              >
                {/* Background Underwater Submersible Glow */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.08)_0%,transparent_70%)] pointer-events-none" />

                {!file ? (
                  <div className="space-y-6 text-center z-10 pointer-events-none">
                    {/* Glowing Circular Sonar Reticle Upload Icon */}
                    <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border border-[#38BDF8]/30 animate-spin" style={{ animationDuration: '16s' }} />
                      <div className="absolute inset-2 rounded-full border border-dashed border-[#38BDF8]/40" />
                      <div className="w-20 h-20 rounded-full bg-[#030712] border-2 border-[#38BDF8] flex items-center justify-center text-[#38BDF8] shadow-cyan-glow">
                        <Upload className="w-9 h-9" />
                      </div>
                    </div>

                    {/* Main Upload Instructions */}
                    <div className="space-y-2">
                      <h2 className="text-xl font-serif font-bold text-white tracking-wide">
                        Drag & Drop your sonar data archive here
                      </h2>
                      <p className="text-xs text-[#38BDF8] font-mono">
                        or browse files
                      </p>

                      {/* Format Callout Pills */}
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <span className="px-3 py-1 rounded-md bg-[#050E1E] border border-[#38BDF8]/40 text-[#38BDF8] font-mono text-xs font-bold shadow-cyan-sm">
                          .ZIP
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          (Sonar Data Archive)
                        </span>
                      </div>
                    </div>

                    {/* Browse Files Button */}
                    <div className="pt-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); triggerFilePicker(); }}
                        className="px-6 py-2.5 rounded-lg bg-[#030712] hover:bg-[#38BDF8] text-[#38BDF8] hover:text-[#030712] border border-[#38BDF8]/60 font-mono text-xs font-bold transition-all shadow-cyan-glow inline-flex items-center gap-2 cursor-pointer pointer-events-auto"
                      >
                        <FolderOpen className="w-4 h-4" />
                        <span>Browse Files</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Selected .ZIP File State */
                  <div className="flex flex-col items-center space-y-4 font-mono z-10 text-center">
                    <div className="w-24 h-24 rounded-full bg-[#030712] border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-xl">
                      <FileCode className="w-10 h-10" />
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-emerald-400 font-bold bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40 inline-flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>✓ SONAR DATA READY (.ZIP ARCHIVE)</span>
                      </span>
                      <h3 className="text-lg font-bold text-white pt-2">{file.name}</h3>
                      <p className="text-xs text-slate-400">
                        Sonar Data Archive • {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); setFileError(null); }}
                      className="px-4 py-1.5 rounded-lg bg-[#050E1E] text-red-400 hover:text-white border border-red-800/60 text-xs font-mono transition-colors cursor-pointer pointer-events-auto"
                    >
                      Replace .ZIP File
                    </button>
                  </div>
                )}

                {/* Bottom Security Tag */}
                <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Your data is secure and encrypted</span>
                </div>
              </div>

              {/* Error Message Alert */}
              {fileError && (
                <div className="mt-4 p-3 bg-red-950/80 border border-red-800/80 rounded-lg text-xs text-red-300 font-mono w-full flex items-center justify-between gap-2 shadow-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>{fileError}</span>
                  </div>
                  <button onClick={() => setFileError(null)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Primary Action Button */}
              <div className="mt-6 flex items-center gap-4">
                <button
                  onClick={startPipeline}
                  disabled={!file}
                  className={`flex-1 py-3.5 rounded-xl font-mono text-xs font-bold transition-all shadow-cyan-glow flex items-center justify-center gap-2 cursor-pointer ${
                    file
                      ? 'bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#030712]'
                      : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                  }`}
                >
                  <span>Begin Ocean Analysis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Survey Metadata & Mission Parameters Configuration Panel (Right 5 Cols) */}
            <div className="lg:col-span-5 bg-[#0B132B]/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-5 font-mono text-xs flex flex-col justify-between premium-hover-card">
              <div className="space-y-4">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <h3 className="text-sm font-serif font-bold text-white tracking-wide">
                    SURVEY METADATA PARAMETERS
                  </h3>
                  <span className="text-[10px] text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-0.5 rounded border border-[#38BDF8]/30 font-bold">
                    CONFIG
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Location Field */}
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px] font-semibold block">SURVEY LOCATION / SECTOR</label>
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      className="w-full bg-[#030712] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-[#38BDF8] focus:outline-none"
                    />
                  </div>

                  {/* Depth & Frequency Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-slate-400 text-[11px] font-semibold block">DEPTH (METERS)</label>
                      <input
                        type="number"
                        value={depthMeters}
                        onChange={(e) => setDepthMeters(Number(e.target.value))}
                        className="w-full bg-[#030712] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-[#38BDF8] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400 text-[11px] font-semibold block">SWATH WIDTH (M)</label>
                      <input
                        type="number"
                        value={swathWidth}
                        onChange={(e) => setSwathWidth(Number(e.target.value))}
                        className="w-full bg-[#030712] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-[#38BDF8] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Sonar Frequency */}
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px] font-semibold block">SONAR FREQUENCY</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full bg-[#030712] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-[#38BDF8] focus:outline-none"
                    >
                      <option value="800 kHz High Precision">800 kHz High Precision</option>
                      <option value="455 kHz Dual Frequency">455 kHz Dual Frequency</option>
                      <option value="900 kHz Deep Swath">900 kHz Deep Swath</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1">
                    <label className="text-slate-400 text-[11px] font-semibold block">MISSION NOTES</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full bg-[#030712] border border-slate-800 rounded-lg p-3 text-slate-200 focus:border-[#38BDF8] focus:outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Status Info Box */}
              <div className="p-4 bg-[#030712] border border-slate-800 rounded-xl space-y-1">
                <span className="text-slate-500 text-[10px] block">VESSEL PLATFORM</span>
                <strong className="text-slate-200 text-xs">INS Sagar Kanya (MoES-04)</strong>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* PROCESSING PIPELINE EXECUTION VIEW */
        <div className="space-y-8 bg-[#0B132B]/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-8 relative overflow-hidden font-sans">
          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-serif font-bold text-white flex items-center justify-center gap-2">
              <span>Executing Sonar AI Pipeline</span>
              <span className="text-xs font-mono text-[#38BDF8] bg-[#38BDF8]/10 px-2.5 py-0.5 rounded border border-[#38BDF8]/30 font-bold">
                .ZIP PARSER
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-sans">
              Extracting acoustic ping sweeps, TVG gain calibration & CNN feature classification
            </p>
          </div>

          {/* Stepped Node Pipeline Progress Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 max-w-5xl mx-auto px-2 relative z-10 font-mono text-xs">
            {processingStages.map((stg, idx) => (
              <div key={idx} className="flex flex-col items-center space-y-2 text-center p-2 rounded-lg bg-[#030712]/60 border border-slate-800">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                  stg.status === 'completed'
                    ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-[#38BDF8]'
                    : stg.status === 'in_progress'
                    ? 'bg-[#38BDF8] text-[#030712] border-[#38BDF8] animate-pulse ring-4 ring-[#38BDF8]/30'
                    : stg.status === 'failed'
                    ? 'bg-red-950 border-red-500 text-red-400'
                    : 'bg-[#030712] border-slate-800 text-slate-600'
                }`}>
                  {stg.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : stg.status === 'in_progress' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : stg.status === 'failed' ? (
                    <XCircle className="w-4 h-4 text-red-400" />
                  ) : (
                    <span className="font-bold text-xs">{idx + 1}</span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold truncate w-full ${
                  stg.status === 'completed' || stg.status === 'in_progress' ? 'text-white' : stg.status === 'failed' ? 'text-red-400' : 'text-slate-500'
                }`}>
                  {stg.name}
                </span>
              </div>
            ))}
          </div>

          {/* Center Operational Progress Feedback */}
          {!processingFailed ? (
            <div className="h-56 rounded-2xl bg-[#030712] border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden space-y-3">
              <div className="text-5xl font-mono font-extrabold text-[#38BDF8] animate-pulse z-10">
                {overallProgress}%
              </div>

              <p className="text-sm font-serif text-slate-200 z-10 font-bold">
                Processing Sonar Data Archive (.ZIP Format)...
              </p>
              <p className="text-xs font-mono text-slate-400 z-10 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 text-[#38BDF8] animate-spin" />
                <span>Extracting acoustic shadow geometry & bathymetric swaths...</span>
              </p>
            </div>
          ) : (
            /* ERROR STATE */
            <div className="p-6 bg-red-950/40 border border-red-800/80 rounded-2xl space-y-4 font-mono text-xs">
              <div className="flex items-center gap-3 text-red-400">
                <AlertCircle className="w-6 h-6" />
                <div>
                  <h3 className="text-sm font-bold">Pipeline Signal Interrupted</h3>
                  <p className="text-xs text-slate-300">
                    Failed stage: <strong className="text-red-300">{failedStageName}</strong>. acoustic telemetry frame checksum error.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setIsProcessing(false)}
                  className="px-4 py-2 bg-[#030712] hover:bg-slate-800 text-white rounded-lg border border-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retry Pipeline</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
