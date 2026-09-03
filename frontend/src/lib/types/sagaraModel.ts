import { RiskLevel, DetectionClassification, ProcessingStageId, BoundingBox, FalsePositiveFactors } from './analysis';

export type MissionStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type ReviewStatus = 'unreviewed' | 'confirmed' | 'rejected';

export interface MissionDetection {
  detectionId: string;
  missionId: string;
  objectType: string;
  classification: DetectionClassification;
  confidence: number; // percentage 0 - 100
  falsePositiveProbability: number; // percentage 0 - 100
  riskLevel: RiskLevel;
  latitude: number;
  longitude: number;
  depth: number; // meters
  estimatedLength: number; // meters
  estimatedWidth: number; // meters
  estimatedHeight?: number; // meters
  boundingBox: BoundingBox;
  falsePositiveFactors?: FalsePositiveFactors;
  timestamp: string;
  notes: string;
  reviewStatus: ReviewStatus;
}

export interface Mission {
  missionId: string;
  fileName: string;
  fileSize: string;
  status: MissionStatus;
  surveyDate: string;
  location: string;
  depth: number;
  swathWidth: number;
  sonarFrequency: string;
  vessel: string;
  notes: string;
  processingProgress: number; // 0 - 100
  imageUrl?: string;
  thumbnailUrl?: string;
  detections: MissionDetection[];
  failureReason?: string;
}

export interface ProcessingState {
  missionId: string;
  currentStage: ProcessingStageId;
  stageProgress: number; // 0 - 100
  stageStatus: 'pending' | 'in_progress' | 'completed' | 'failed';
  message: string;
  startedAt: string;
  completedAt?: string;
}

export interface MissionReport {
  reportId: string;
  missionId: string;
  generatedAt: string;
  detections: MissionDetection[];
  summary: string;
  exportFormats: string[]; // e.g. ['PDF', 'CSV', 'GeoJSON']
}

export interface MissionStats {
  totalMissions: number;
  totalDebrisDetected: number;
  avgConfidence: number;
  areaSurveyedKm2: number;
}
