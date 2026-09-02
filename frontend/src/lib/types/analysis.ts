export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type DetectionClassification = 
  | 'Ghost Fishing Net' 
  | 'Marine Debris' 
  | 'Submerged Metal Object' 
  | 'Acoustic Anomaly' 
  | 'Shipwreck / Container';

export type ProcessingStageId = 
  | 'upload' 
  | 'preprocessing' 
  | 'ai_analysis' 
  | 'classification' 
  | 'false_positive' 
  | 'completed';

export interface FactorRating {
  rating: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number; // 0 - 100
  detail: string;
}

export interface FalsePositiveFactors {
  shadowConsistency: FactorRating;
  shapeConsistency: FactorRating;
  textureSimilarity: FactorRating;
  seabedContext: FactorRating;
  overallProbability: number; // percentage 0 - 100
}

export interface BoundingBox {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
}

export interface Detection {
  id: string;
  scanId: string;
  classification: DetectionClassification;
  confidence: number; // 0 - 100
  debrisProbability: number; // 0 - 100
  falsePositiveProbability: number; // 0 - 100
  riskLevel: RiskLevel;
  bbox: BoundingBox;
  estimatedSizeMeters: {
    length: number;
    width: number;
  };
  depthMeters: number;
  location: {
    lat: number;
    lng: number;
  };
  falsePositiveFactors: FalsePositiveFactors;
  notes: string;
}

export interface SurveyLocation {
  name: string;
  region: string;
  lat: number;
  lng: number;
  depthMeters: number;
}

export interface SurveyMetadata {
  locationName: string;
  region: string;
  lat: number;
  lng: number;
  dateTime: string;
  depthMeters?: number;
  notes?: string;
  vesselName?: string;
  sonarFrequency?: string;
  swathWidthMeters?: number;
}

export interface ProcessingStage {
  id: ProcessingStageId;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number; // 0-100
}

export interface Analysis {
  id: string;
  filename: string;
  fileSize: string;
  dimensions: {
    width: number;
    height: number;
  };
  imageUrl: string;
  thumbnailUrl?: string;
  createdAt: string;
  metadata: SurveyMetadata;
  status: 'processing' | 'completed' | 'failed';
  failureReason?: string;
  currentStage?: ProcessingStageId;
  detections: Detection[];
  highestRisk: RiskLevel;
  avgConfidence: number;
  overallDebrisProbability: number;
  overallFalsePositiveRate: number;
  summaryNotes: string;
}

export interface DashboardStats {
  totalScans: number;
  totalDetections: number;
  highRiskDetections: number;
  avgConfidence: number;
  falsePositiveRate: number;
  scansTrend: number;
  detectionsTrend: number;
}

export interface DetectionTrendPoint {
  date: string;
  ghostNets: number;
  marineDebris: number;
  metalObjects: number;
  total: number;
}
