import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sonarService } from '../lib/services/sonarService';
import { useMissionContext } from '../context/MissionContext';
import { ProcessingStage } from '../lib/types/analysis';
import { MOCK_PROCESSING_STAGES } from '../lib/mock/mockProcessingStates';
import { 
  Upload, 
  AlertCircle, 
  X, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ArrowRight, 
  RotateCcw,
  Sliders,
  Radio,
  FileCode,
  Waves,
  ShieldCheck,
  Check,
  Bell,
  FolderOpen,
  Droplets,
  Edit3
} from 'lucide-react';

export const NewAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { setActiveMission, refreshMissions } = useMissionContext();

  const [currentStep, setCurrentStep] = useState<'UPLOAD' | 'PROCESSING'>('UPLOAD');

  // Upload File State
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Mission Parameters State (Matching Reference Screenshot)
  const [locationName, setLocationName] = useState<string>('Goa Coastal Shelf Benthic Zone B2');
  const [dateTime, setDateTime] = useState<string>('30 Aug 2026, 02:50 PM');
  const [depthMeters, setDepthMeters] = useState<number>(25);
  const [waterConditions, setWaterConditions] = useState<string>('Clear weather, low current, good visibility');
  const [frequency, setFrequency] = useState<string>('800 kHz (High Precision)');
  const [notes, setNotes] = useState<string>('Clear weather, low current, good visibility.');

  // Processing Pipeline State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStages, setProcessingStages] = useState<ProcessingStage[]>(MOCK_PROCESSING_STAGES);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [processingFailed, setProcessingFailed] = useState<boolean>(false);
  const [failedStageName, setFailedStageName] = useState<string>('');
  const [simulateFailureToggle, setSimulateFailureToggle] = useState<boolean>(false);

  // Strict .SON File Extension & Size Validation
  const validateAndSetFile = (selectedFile: File) => {
    setFileError(null);
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';

    // Validate strict .SON file format
    if (ext !== 'son') {
      setFileError('Unsupported file format. Please upload a Side-Scan Sonar .SON file.');
      setFile(null);
      return;
    }

    // Validate 500 MB max size limit
    const MAX_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB
    if (selectedFile.size > MAX_SIZE_BYTES) {
      setFileError('File exceeds the maximum supported size (500 MB). Please select a smaller .SON dataset.');
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
      setFileError('Please upload a valid Side-Scan Sonar .SON file before starting analysis.');
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

    const stages: ProcessingStage[] = MOCK_PROCESSING_STAGES.map((s) => ({
      ...s,
      status: 'pending' as ProcessingStage['status'],
      progress: 0
    }));
    setProcessingStages(stages);

    const runStage = (index: number) => {
      if (index >= stages.length) {
        finishPipeline(missionId);
        return;
      }

      if (simulateFailureToggle && index === 3) {
        setProcessingFailed(true);
        setFailedStageName(stages[index].name);
        stages[index].status = 'failed';
        setProcessingStages([...stages]);
        setIsProcessing(false);
        return;
      }

      stages[index].status = 'in_progress';
      setProcessingStages([...stages]);

      setTimeout(() => {
        stages[index].status = 'completed';
        setProcessingStages([...stages]);

        const nextProgress = Math.round(((index + 1) / stages.length) * 100);
        setOverallProgress(nextProgress);

        runStage(index + 1);
      }, 500);
    };

    runStage(0);
  };

  const finishPipeline = async (missionId: string) => {
    setIsProcessing(false);
    await refreshMissions();
    navigate(`/analysis?id=${missionId}`);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6 font-sans animate-fade-up select-none">
      {/* STEP 1: UPLOAD SONAR SCAN WORKSTATION */}
      {currentStep === 'UPLOAD' && (
        <div className="space-y-6">
          {/* Header Bar matching Reference Screenshot */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
            <div>
              <h1 className="text-3xl font-serif font-bold text-white flex items-center gap-3">
                <span className="w-1.5 h-6 bg-[#38BDF8] rounded-full" />
                <span>UPLOAD SONAR SCAN</span>
              </h1>
              <p className="text-xs text-slate-400 font-sans mt-1">
                Submit your side-scan sonar .SON data file for AI analysis
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
              {/* Hidden Native File Input (.SON format only) */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".son,.SON"
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
                        Drag & Drop your sonar data here
                      </h2>
                      <p className="text-xs text-[#38BDF8] font-mono">
                        or browse files
                      </p>

                      {/* Format Callout Pills */}
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <span className="px-3 py-1 rounded-md bg-[#050E1E] border border-[#38BDF8]/40 text-[#38BDF8] font-mono text-xs font-bold shadow-cyan-sm">
                          .SON
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          (Side-Scan Sonar Data)
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
                  /* Selected .SON File State */
                  <div className="flex flex-col items-center space-y-4 font-mono z-10 text-center">
                    <div className="w-24 h-24 rounded-full bg-[#030712] border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-xl">
                      <FileCode className="w-10 h-10" />
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-emerald-400 font-bold bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40 inline-flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" />
                        <span>✓ SONAR DATA READY (.SON FORMAT)</span>
                      </span>
                      <h3 className="text-lg font-bold text-white pt-2">{file.name}</h3>
                      <p className="text-xs text-slate-400">
                        Side-Scan Sonar Data • {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); setFileError(null); }}
                      className="px-4 py-1.5 rounded-lg bg-[#050E1E] text-red-400 hover:text-white border border-red-800/60 text-xs font-mono transition-colors cursor-pointer pointer-events-auto"
                    >
                      Replace .SON File
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
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{fileError}</span>
                  </div>
                  <button onClick={() => setFileError(null)} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Right Panel: MISSION PARAMETERS */}
            <div className="lg:col-span-5 bg-[#0B132B]/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 space-y-5 font-mono text-xs flex flex-col justify-between premium-hover-card">
              <div className="space-y-4">
                {/* Panel Title */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <h3 className="text-sm font-serif font-bold text-[#38BDF8] flex items-center gap-2 tracking-wider uppercase">
                    <Sliders className="w-4 h-4 text-[#38BDF8]" />
                    <span>MISSION PARAMETERS</span>
                  </h3>
                </div>

                {/* 1. Location */}
                <div className="space-y-1.5">
                  <label className="block text-slate-400 text-[11px] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Location</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      className="w-full bg-[#030712] border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 focus:border-[#38BDF8] focus:outline-none"
                    />
                    <Radio className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                  </div>
                </div>

                {/* 2. Survey Depth */}
                <div className="space-y-1.5">
                  <label className="block text-slate-400 text-[11px] flex items-center gap-1.5">
                    <Waves className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Survey Depth (meters)</span>
                  </label>
                  <input
                    type="number"
                    value={depthMeters}
                    onChange={(e) => setDepthMeters(parseFloat(e.target.value) || 25)}
                    className="w-full bg-[#030712] border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 focus:border-[#38BDF8] focus:outline-none"
                  />
                </div>

                {/* 3. Capture Date & Time */}
                <div className="space-y-1.5">
                  <label className="block text-slate-400 text-[11px] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Capture Date & Time</span>
                  </label>
                  <input
                    type="text"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    className="w-full bg-[#030712] border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 focus:border-[#38BDF8] focus:outline-none"
                  />
                </div>

                {/* 4. Water Conditions */}
                <div className="space-y-1.5">
                  <label className="block text-slate-400 text-[11px] flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Water Conditions</span>
                  </label>
                  <select
                    value={waterConditions}
                    onChange={(e) => setWaterConditions(e.target.value)}
                    className="w-full bg-[#030712] border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 focus:border-[#38BDF8] focus:outline-none"
                  >
                    <option value="Clear weather, low current, good visibility">Clear weather, low current, good visibility</option>
                    <option value="Moderate swell, medium turbidity">Moderate swell, medium turbidity</option>
                    <option value="High thermocline, deep currents">High thermocline, deep currents</option>
                  </select>
                </div>

                {/* 5. Sonar Frequency */}
                <div className="space-y-1.5">
                  <label className="block text-slate-400 text-[11px] flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Sonar Frequency</span>
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full bg-[#030712] border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 focus:border-[#38BDF8] focus:outline-none"
                  >
                    <option value="800 kHz (High Precision)">800 kHz (High Precision)</option>
                    <option value="455 kHz (Dual Beam Standard)">455 kHz (Dual Beam Standard)</option>
                    <option value="120 kHz (Deep Sea Swath)">120 kHz (Deep Sea Swath)</option>
                  </select>
                </div>

                {/* 6. Mission Notes */}
                <div className="space-y-1.5">
                  <label className="block text-slate-400 text-[11px] flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Mission Notes (optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-[#030712] border border-slate-800 rounded-lg p-2.5 text-slate-200 font-sans text-xs focus:border-[#38BDF8] focus:outline-none"
                    placeholder="Clear weather, low current, good visibility."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM ACTION BAR */}
          <div className="bg-[#0B132B]/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs relative overflow-hidden">
            {/* Left Action: Abort Mission */}
            <button
              onClick={handleAbortMission}
              className="px-6 py-3 rounded-xl bg-[#030712] hover:bg-red-950 text-slate-300 hover:text-red-400 border border-slate-800 hover:border-red-800/80 font-bold transition-all flex items-center gap-2 cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
              <span>Abort Mission</span>
            </button>

            {/* Right Action: Begin Ocean Analysis -> */}
            <button
              disabled={!file}
              onClick={startPipeline}
              className={`px-8 py-3.5 rounded-xl font-bold transition-all flex items-center gap-3 z-10 ${
                file
                  ? 'bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#030712] shadow-cyan-glow cursor-pointer'
                  : 'bg-slate-900 border border-slate-800 text-slate-500 opacity-50 cursor-not-allowed'
              }`}
            >
              <span>Begin Ocean Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: OPERATIONAL SONAR PROCESSING PIPELINE */}
      {currentStep === 'PROCESSING' && (
        <div className="space-y-8 bg-[#0B132B]/60 backdrop-blur-md border border-slate-800/80 rounded-2xl p-8 relative overflow-hidden font-sans">
          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-serif font-bold text-white flex items-center justify-center gap-2">
              <span>Executing Sonar AI Pipeline</span>
              <span className="text-xs font-mono text-[#38BDF8] bg-[#38BDF8]/10 px-2.5 py-0.5 rounded border border-[#38BDF8]/30 font-bold">
                .SON PARSER
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
                Processing Side-Scan Sonar Ping Sweeps (.SON Format)...
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
                <h3 className="text-lg font-bold">Processing Pipeline Error on stage: {failedStageName}</h3>
              </div>

              <p className="text-slate-300 font-sans text-sm">
                Acoustic Signal Attenuation: Transducer multipath interference detected. Signal-to-noise ratio below operational threshold (dB &lt; 12.4).
              </p>

              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={() => startPipeline()}
                  className="px-6 py-2.5 rounded-lg bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#030712] font-bold transition-all shadow-cyan-glow flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retry Processing</span>
                </button>

                <button
                  onClick={() => setCurrentStep('UPLOAD')}
                  className="px-6 py-2.5 rounded-lg bg-[#030712] hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold transition-colors cursor-pointer"
                >
                  Return to Upload
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
