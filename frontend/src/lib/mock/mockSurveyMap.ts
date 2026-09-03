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

export const MOCK_SURVEY_DETECTIONS: SurveyDetection[] = [
  {
    id: 'DET-001',
    scanId: 'SURVEY-GOA-2026-B2',
    objectType: 'Marine Debris',
    confidence: 94,
    xPercent: 25,
    yPercent: 30,
    depthMeters: 22,
    estimatedSize: { length: 2.4, width: 1.2 },
    riskLevel: 'HIGH',
    location: { lat: 15.2945, lng: 74.1235 },
    notes: 'High-confidence marine debris detection'
  },
  {
    id: 'DET-002',
    scanId: 'SURVEY-GOA-2026-B2',
    objectType: 'Ghost Fishing Net',
    confidence: 91,
    xPercent: 27,
    yPercent: 32,
    depthMeters: 23,
    estimatedSize: { length: 4.1, width: 2.0 },
    riskLevel: 'HIGH',
    location: { lat: 15.2947, lng: 74.1237 },
    notes: 'Possible ghost fishing net'
  },
  {
    id: 'DET-003',
    scanId: 'SURVEY-GOA-2026-B2',
    objectType: 'Marine Debris',
    confidence: 88,
    xPercent: 29,
    yPercent: 34,
    depthMeters: 24,
    estimatedSize: { length: 1.8, width: 1.0 },
    riskLevel: 'MEDIUM',
    location: { lat: 15.2949, lng: 74.1239 },
    notes: 'Marine debris cluster'
  },
  {
    id: 'DET-004',
    scanId: 'SURVEY-GOA-2026-B2',
    objectType: 'Submerged Metal Pipe',
    confidence: 86,
    xPercent: 55,
    yPercent: 50,
    depthMeters: 27,
    estimatedSize: { length: 5.2, width: 0.8 },
    riskLevel: 'MEDIUM',
    location: { lat: 15.2955, lng: 74.1245 },
    notes: 'Submerged metallic object'
  },
  {
    id: 'DET-005',
    scanId: 'SURVEY-GOA-2026-B2',
    objectType: 'Shipwreck / Container',
    confidence: 97,
    xPercent: 70,
    yPercent: 65,
    depthMeters: 31,
    estimatedSize: { length: 8.5, width: 3.2 },
    riskLevel: 'HIGH',
    location: { lat: 15.2960, lng: 74.1250 },
    notes: 'Large man-made underwater object'
  },
  {
    id: 'DET-006',
    scanId: 'SURVEY-GOA-2026-B2',
    objectType: 'Marine Debris',
    confidence: 82,
    xPercent: 72,
    yPercent: 67,
    depthMeters: 30,
    estimatedSize: { length: 2.1, width: 1.4 },
    riskLevel: 'MEDIUM',
    location: { lat: 15.2962, lng: 74.1252 },
    notes: 'Debris near large object'
  }
];
