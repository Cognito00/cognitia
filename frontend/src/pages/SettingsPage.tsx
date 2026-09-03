import React, { useState } from 'react';
import { analysisService } from '../lib/services/analysisService';
import { Shield, Cpu, RefreshCw, CheckCircle2, Sliders } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [unitSystem, setUnitSystem] = useState<'METRIC' | 'IMPERIAL'>('METRIC');
  const [highRiskAlerts, setHighRiskAlerts] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleResetData = () => {
    analysisService.resetToFactoryDefaults();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 font-sans animate-fade-up">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <h1 className="text-3xl font-serif font-bold text-white">System Settings</h1>
        <p className="text-xs text-slate-400 font-sans mt-1">
          Configure SAGARA surveillance telemetry parameters & environment settings
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-800 rounded-lg font-mono text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>System configuration and telemetry datasets reset to factory defaults.</span>
        </div>
      )}

      {/* Organization Profile Display */}
      <div className="bg-[#0B132B]/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-6 space-y-4 premium-hover-card">
        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3">
          <Shield className="w-5 h-5 text-[#38BDF8]" />
          <div>
            <h2 className="text-base font-serif font-bold text-white">Organization Profile</h2>
            <p className="text-[11px] text-slate-400 font-sans">Authorized government deployment instance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
          <div className="p-3.5 bg-[#030712] border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-500 block">ORGANIZATION</span>
            <span className="text-slate-200 font-bold">Ministry of Earth Sciences (MoES)</span>
          </div>
          <div className="p-3.5 bg-[#030712] border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-500 block">INSTITUTE</span>
            <span className="text-slate-200 font-bold">National Centre for Coastal Research (NCCR)</span>
          </div>
          <div className="p-3.5 bg-[#030712] border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-500 block">ANALYST CREDENTIALS</span>
            <span className="text-[#38BDF8] font-bold">MoES-ANALYS-4892 (Capt. R. Sharma)</span>
          </div>
          <div className="p-3.5 bg-[#030712] border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-500 block">SYSTEM IDENTIFIER</span>
            <span className="text-emerald-400 font-bold">SAGARA Platform v2.4-PROD</span>
          </div>
        </div>
      </div>

      {/* Preferences & Telemetry Settings */}
      <div className="bg-[#0B132B]/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-6 space-y-6 premium-hover-card">
        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-3">
          <Sliders className="w-5 h-5 text-[#38BDF8]" />
          <div>
            <h2 className="text-base font-serif font-bold text-white">System Preferences</h2>
            <p className="text-[11px] text-slate-400 font-sans">Measurement units, alert thresholds, and state restoration</p>
          </div>
        </div>

        <div className="space-y-4 font-mono text-xs">
          {/* Unit System */}
          <div className="flex items-center justify-between p-3.5 bg-[#030712] border border-slate-800 rounded-lg">
            <div>
              <span className="text-slate-200 font-bold block">MEASUREMENT UNITS</span>
              <span className="text-[11px] text-slate-400 font-sans">Select metric meters or imperial feet</span>
            </div>
            <div className="flex items-center bg-[#0B132B] p-0.5 border border-slate-800 rounded-lg">
              <button
                onClick={() => setUnitSystem('METRIC')}
                className={`px-3 py-1 rounded text-[11px] ${
                  unitSystem === 'METRIC' ? 'bg-[#0EA5E9]/20 text-[#38BDF8] font-bold border border-[#38BDF8]/40' : 'text-slate-400'
                }`}
              >
                METRIC (m)
              </button>
              <button
                onClick={() => setUnitSystem('IMPERIAL')}
                className={`px-3 py-1 rounded text-[11px] ${
                  unitSystem === 'IMPERIAL' ? 'bg-[#0EA5E9]/20 text-[#38BDF8] font-bold border border-[#38BDF8]/40' : 'text-slate-400'
                }`}
              >
                IMPERIAL (ft)
              </button>
            </div>
          </div>

          {/* Reset State */}
          <div className="flex items-center justify-between p-3.5 bg-[#030712] border border-slate-800 rounded-lg">
            <div>
              <span className="text-slate-200 font-bold block">RESTORE FACTORY DATASET</span>
              <span className="text-[11px] text-slate-400 font-sans">Reset local memory to baseline Indian EEZ sonar telemetry</span>
            </div>
            <button
              onClick={handleResetData}
              className="px-4 py-2 bg-[#0B132B] hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Restore Baseline Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
