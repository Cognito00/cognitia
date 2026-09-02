import React from 'react';
import { DetectionClassification, ProcessingStageId, RiskLevel } from '../../lib/types/analysis';
import { AlertTriangle, CheckCircle2, ShieldAlert, XCircle, Anchor, Waves, Box, HelpCircle } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  switch (level) {
    case 'HIGH':
      return (
        <span className={`inline-flex items-center font-mono font-semibold rounded bg-red-950/60 text-red-400 border border-red-800/60 ${sizeClasses[size]}`}>
          <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
          HIGH RISK
        </span>
      );
    case 'MEDIUM':
      return (
        <span className={`inline-flex items-center font-mono font-semibold rounded bg-amber-950/60 text-amber-400 border border-amber-800/60 ${sizeClasses[size]}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          MED RISK
        </span>
      );
    case 'LOW':
      return (
        <span className={`inline-flex items-center font-mono font-semibold rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 ${sizeClasses[size]}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          LOW RISK
        </span>
      );
  }
};

interface StatusBadgeProps {
  status: 'completed' | 'processing' | 'failed';
  stage?: ProcessingStageId;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded bg-slate-800 text-cyan-400 border border-cyan-900/50">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          COMPLETED
        </span>
      );
    case 'processing':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded bg-amber-950/40 text-amber-300 border border-amber-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
          PROCESSING
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded bg-red-950/40 text-red-300 border border-red-800/40">
          <XCircle className="w-3.5 h-3.5 text-red-400" />
          FAILED
        </span>
      );
  }
};

export const ClassificationBadge: React.FC<{ classification: DetectionClassification }> = ({ classification }) => {
  const getIcon = () => {
    switch (classification) {
      case 'Ghost Fishing Net':
        return <Waves className="w-3.5 h-3.5 text-red-400" />;
      case 'Marine Debris':
        return <Box className="w-3.5 h-3.5 text-amber-400" />;
      case 'Submerged Metal Object':
        return <Anchor className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Shipwreck / Container':
        return <Anchor className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-sans font-medium rounded bg-[#131C2E] text-slate-200 border border-slate-700/60">
      {getIcon()}
      {classification}
    </span>
  );
};
