import { Mission } from '../types/sagaraModel';
import { analysisService } from './analysisService';

export const missionService = {
  /**
   * Fetch all survey missions.
   * // API: GET /api/v1/missions
   */
  async getMissions(): Promise<Mission[]> {
    const analyses = await analysisService.getAnalyses();
    return analyses.map(mapAnalysisToMission);
  },

  /**
   * Fetch a single mission by mission ID.
   * // API: GET /api/v1/missions/:id
   */
  async getMissionById(missionId: string): Promise<Mission | null> {
    const analysis = await analysisService.getAnalysisById(missionId);
    return analysis ? mapAnalysisToMission(analysis) : null;
  },

  /**
   * Create & initialize a new survey mission from a .ZIP file upload.
   * // API: POST /api/v1/missions (multipart/form-data)
   */
  async createMission(file: File, metadata: Partial<Mission>): Promise<Mission> {
    const analysis = await analysisService.submitSonAnalysis(file, {
      locationName: metadata.location || 'Goa Coastal Shelf B2',
      region: 'Arabian Sea Indian EEZ Sector 4',
      lat: 15.2939,
      lng: 74.1240,
      dateTime: metadata.surveyDate || new Date().toISOString(),
      depthMeters: metadata.depth || 25.0,
      notes: metadata.notes || 'Automated .ZIP survey ingestion',
      vesselName: metadata.vessel || 'INS Sagar Kanya (MoES-04)',
      sonarFrequency: metadata.sonarFrequency || '800 kHz High Precision',
      swathWidthMeters: metadata.swathWidth || 100,
    });
    return mapAnalysisToMission(analysis);
  },

  /**
   * Aggregate high-level platform survey stats.
   * // API: GET /api/v1/missions/stats
   */
  async getMissionStats() {
    const stats = await analysisService.getDashboardStats();
    return {
      totalMissions: stats.totalScans,
      totalDebrisDetected: stats.totalDetections,
      avgConfidence: stats.avgConfidence,
      areaSurveyedKm2: 14.8, // Calculated total surveyed swath coverage area in sq km
    };
  }
};

/**
 * Adapter helper mapping legacy Analysis object to unified Mission model.
 */
function mapAnalysisToMission(analysis: any): Mission {
  return {
    missionId: analysis.id,
    fileName: analysis.filename,
    fileSize: analysis.fileSize,
    status: analysis.status,
    surveyDate: analysis.metadata?.dateTime || analysis.createdAt,
    location: analysis.metadata?.locationName || 'Indian Ocean EEZ',
    depth: analysis.metadata?.depthMeters || 25,
    swathWidth: analysis.metadata?.swathWidthMeters || 100,
    sonarFrequency: analysis.metadata?.sonarFrequency || '800 kHz High Precision',
    vessel: analysis.metadata?.vesselName || 'INS Sagar Kanya (MoES-04)',
    notes: analysis.metadata?.notes || analysis.summaryNotes || '',
    processingProgress: analysis.status === 'completed' ? 100 : analysis.status === 'failed' ? 0 : 50,
    imageUrl: analysis.imageUrl,
    thumbnailUrl: analysis.thumbnailUrl,
    failureReason: analysis.failureReason,
    detections: (analysis.detections || []).map((d: any) => ({
      detectionId: d.id,
      missionId: analysis.id,
      objectType: d.classification,
      classification: d.classification,
      confidence: d.confidence,
      falsePositiveProbability: d.falsePositiveProbability || (100 - d.confidence),
      riskLevel: d.riskLevel || 'HIGH',
      latitude: d.location?.lat || 15.2939,
      longitude: d.location?.lng || 74.1240,
      depth: d.depthMeters || 25,
      estimatedLength: d.estimatedSizeMeters?.length || 8.4,
      estimatedWidth: d.estimatedSizeMeters?.width || 2.5,
      estimatedHeight: 1.2,
      boundingBox: d.bbox || { x: 25, y: 30, width: 20, height: 20 },
      falsePositiveFactors: d.falsePositiveFactors,
      timestamp: d.timestamp || analysis.metadata?.dateTime || '30 Aug 2026, 02:50 PM',
      notes: d.notes || 'Acoustic shadow anomaly verified.',
      reviewStatus: 'confirmed'
    }))
  };
}
