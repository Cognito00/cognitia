export type SurveyObjectType = 
  | 'Ghost Fishing Net' 
  | 'Shipwreck / Container' 
  | 'Submerged Metal Pipe' 
  | 'Marine Debris' 
  | 'Acoustic Anomaly';

export interface SurveyDetection {
  id: string;
  scanId: string;
  objectType: SurveyObjectType;
  confidence: number;
  xPercent: number;
  yPercent: number;
  depthMeters: number;
  estimatedSize: {
    length: number;
    width: number;
  };
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  location: {
    lat: number;
    lng: number;
  };
  notes: string;
}

export interface SurveyAreaInfo {
  id: string;
  name: string;
  sector: string;
  vesselName: string;
  sonarFrequency: string;
  swathWidthMeters: number;
  minDepthMeters: number;
  maxDepthMeters: number;
  areaKm2: number;
  centerCoordinates: {
    lat: number;
    lng: number;
  };
}

export const MOCK_SURVEY_AREA: SurveyAreaInfo = {
  id: 'SURVEY-GOA-2026-B2',
  name: 'Goa Coastal Shelf Benthic Zone B2',
  sector: 'Arabian Sea Indian EEZ Sector 4',
  vesselName: 'INS Sagar Kanya (MoES-04)',
  sonarFrequency: '800 kHz High Precision Side-Scan',
  swathWidthMeters: 100,
  minDepthMeters: 18.0,
  maxDepthMeters: 32.5,
  areaKm2: 14.8,
  centerCoordinates: {
    lat: 15.2939,
    lng: 74.1240
  }
};

export const MOCK_SURVEY_DETECTIONS: SurveyDetection[] = [];
