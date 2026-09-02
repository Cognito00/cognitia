import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMissionContext } from '../context/MissionContext';
import { ProcessingStage } from '../lib/types/analysis';
import { MOCK_PROCESSING_STAGES } from '../lib/mock/mockProcessingStates';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RotateCcw, 
  AlertCircle, 
  ArrowLeft,
  FileCode,
  Sliders,
  Bell
} from 'lucide-react';

export const ProcessingPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeMission, refreshMissions } = useMissionContext();

  const [processingStages, setProcessingStages] = useState<ProcessingStage[]>(MOCK_PROCESSING_STAGES);
  const [overallProgress, setOverallProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(true);
  const [processingFailed, setProcessingFailed] = useState<boolean>(false);
  const [failedStageName, setFailedStageName] = useState<string>('');
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);

  useEffect(() => {
    if (!activeMission) {
      navigate('/upload');
      return;
    }
    startSimulation();
  }, [activeMission]);

  const startSimulation = () => {
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
        finishProcessing();
        return;
      }

      if (simulateFailure && index === 3) {
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
      }, 550);
    };

    runStage(0);
  };

  const finishProcessing = async () => {
    setIsProcessing(false);
    await refreshMissions();
    if (activeMission) {
      navigate(`/analysis?id=${activeMission.missionId}`);
    } else {
      navigate('/analysis');
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 font-sans animate-fade-up select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white flex items-center gap-3">
            <span className="w-1.5 h-6 bg-[#38BDF8] rounded-full" />
            <span>EXECUTING SONAR AI PIPELINE</span>
          </h1>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Analyzing Side-Scan Sonar dataset: <span className="font-mono text-[#38BDF8] font-bold">{activeMission?.fileName || 'SONAR_DATA.SON'}</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#050E1E] border border-slate-800 px-3.5 py-1.5 rounded-lg text-xs font-mono text-slate-400">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Error:</span>
            <input
              type="checkbox"
              checked={simulateFailure}
              onChange={(e) => setSimulateFailure(e.target.checked)}
              className="rounded bg-[#030712] border-slate-700 text-[#38BDF8] focus:ring-0 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-3 bg-[#0B132B]/60 px-3 py-1.5 rounded-xl border border-slate-800/80">
            <Bell className="w-4 h-4 text-slate-400" />
            <div className="w-7 h-7 rounded-full bg-[#030712] border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] font-bold text-xs">
              RS
            </div>
          </div>
        </div>
      </div>

      {/* Main Processing Stage Grid & Details */}
      <div className="space-y-8 bg-[#0B132B]/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-8 relative overflow-hidden font-sans premium-hover-card">
        {/* 8-Stage Node Progress Track */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 max-w-6xl mx-auto font-mono text-xs">
          {processingStages.map((stg, idx) => (
            <div key={idx} className="flex flex-col items-center space-y-2 text-center p-3 rounded-xl bg-[#030712]/80 border border-slate-800">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                stg.status === 'completed'
                  ? 'bg-[#38BDF8]/20 border-[#38BDF8] text-[#38BDF8]'
                  : stg.status === 'in_progress'
                  ? 'bg-[#38BDF8] text-[#030712] border-[#38BDF8] animate-pulse ring-4 ring-[#38BDF8]/30'
                  : stg.status === 'failed'
                  ? 'bg-red-950 border-red-500 text-red-400'
                  : 'bg-[#030712] border-slate-800 text-slate-600'
              }`}>
                {stg.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : stg.status === 'in_progress' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : stg.status === 'failed' ? (
                  <XCircle className="w-5 h-5 text-red-400" />
                ) : (
                  <span className="font-bold text-xs">{idx + 1}</span>
                )}
              </div>
              <div className="space-y-0.5 w-full">
                <div className={`text-[11px] font-bold truncate ${
                  stg.status === 'completed' || stg.status === 'in_progress' ? 'text-white' : stg.status === 'failed' ? 'text-red-400' : 'text-slate-500'
                }`}>
                  {stg.name}
                </div>
                <div className="text-[9px] text-slate-500 capitalize">
                  {stg.status === 'completed' ? '✓ Validated' : stg.status === 'in_progress' ? '● Processing' : stg.status === 'failed' ? '✕ Failed' : '○ Waiting'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Center Live Progress Meter */}
        {!processingFailed ? (
          <div className="h-60 rounded-2xl bg-[#030712] border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden space-y-4">
            <div className="text-6xl font-mono font-extrabold text-[#38BDF8] animate-pulse z-10">
              {overallProgress}%
            </div>

            <p className="text-base font-serif text-slate-200 z-10 font-bold">
              Processing Side-Scan Sonar Acoustic Swaths (.SON Format)...
            </p>

            <div className="text-xs font-mono text-slate-400 z-10 flex items-center gap-2 bg-[#050E1E] px-4 py-1.5 rounded-full border border-slate-800">
              <Loader2 className="w-4 h-4 text-[#38BDF8] animate-spin" />
              <span>Extracting benthic backscatter & acoustic shadow geometry...</span>
            </div>
          </div>
        ) : (
          /* Error State Panel */
          <div className="p-8 bg-red-950/40 border border-red-800/80 rounded-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-7 h-7" />
              <div>
                <h3 className="text-lg font-bold">Processing Pipeline Error: {failedStageName}</h3>
                <p className="text-xs text-red-300/80 font-sans">Acoustic transducer multipath noise detected</p>
              </div>
            </div>

            <p className="text-slate-300 font-sans text-sm bg-[#030712] p-4 rounded-xl border border-red-900/60 leading-relaxed">
              Signal Attenuation Error: Signal-to-noise ratio fell below operational threshold (dB &lt; 12.4).
              Check transducer cable connection or increase ping gain before retrying.
            </p>

            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={() => startSimulation()}
                className="px-6 py-3 rounded-xl bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#030712] font-bold transition-all shadow-cyan-glow flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Processing</span>
              </button>

              <button
                onClick={() => navigate('/upload')}
                className="px-6 py-3 rounded-xl bg-[#030712] hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold transition-colors cursor-pointer flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Upload</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
