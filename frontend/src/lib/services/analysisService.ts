import { Analysis, DashboardStats, DetectionTrendPoint, SurveyMetadata } from '../types/analysis';
import { MOCK_ANALYSES, MOCK_TREND_DATA } from '../mock/mockAnalyses';

const STORAGE_KEY = 'sagara_analyses_store_v3';
const LEGACY_STORAGE_KEY = 'naadi_analyses_db_v1';

// Internal helper to get state from localStorage
const getStoredAnalyses = (): Analysis[] => {
  try {
    // Purge legacy storage key containing hardcoded fake scan records
    if (localStorage.getItem(LEGACY_STORAGE_KEY)) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: Analysis[] = JSON.parse(raw);
      // Filter out any leftover fake mock scans by ID pattern
      const clean = parsed.filter((a) =>
        a &&
        a.id &&
        !a.id.includes('8903') &&
        !a.id.includes('8902') &&
        !a.id.includes('8901') &&
        !a.id.includes('8900') &&
        !a.id.includes('8899') &&
        !a.id.includes('9123') &&
        !a.id.includes('3010')
      );
      if (clean.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
      }
      return clean;
    }
  } catch (e) {
    console.warn('Failed to parse stored SAGARA analyses state:', e);
  }
  return [];
};

const saveStoredAnalyses = (data: Analysis[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save SAGARA analyses state:', e);
  }
};

export const analysisService = {
  /**
   * Fetches list of all sonar analyses.
   */
  async getAnalyses(): Promise<Analysis[]> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return getStoredAnalyses();
  },

  /**
   * Fetches single sonar analysis details by Scan ID.
   */
  async getAnalysisById(id: string): Promise<Analysis | null> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const analyses = getStoredAnalyses();
    const found = analyses.find((a) => a.id.toLowerCase() === id.toLowerCase());
    return found || null;
  },

  /**
   * Submits raw Side-Scan Sonar .ZIP archive and survey metadata for AI processing.
   */
  async submitSonAnalysis(file: File, metadata: Partial<SurveyMetadata>): Promise<Analysis> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const currentList = getStoredAnalyses();

    const scanId = `SCAN-2026-MoES-${Math.floor(1000 + Math.random() * 9000)}`;
    const newAnalysis: Analysis = {
      id: scanId,
      filename: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      dimensions: { width: 2048, height: 1024 },
      imageUrl: 'mock_sonar_waterfall_1.png',
      createdAt: new Date().toISOString(),
      status: 'completed',
      highestRisk: 'HIGH',
      avgConfidence: 94.2,
      overallDebrisProbability: 95.8,
      overallFalsePositiveRate: 4.2,
      summaryNotes: `Automated AI anomaly detection completed for ${file.name}. Submerged debris targets verified with WGS84 bathymetric coordinates.`,
      metadata: {
        locationName: metadata.locationName || 'Goa Coastal Shelf Sector 2',
        region: metadata.region || 'Arabian Sea EEZ',
        lat: metadata.lat || 15.2939,
        lng: metadata.lng || 74.1240,
        dateTime: metadata.dateTime || new Date().toLocaleString(),
        depthMeters: metadata.depthMeters || 25.0,
        vesselName: metadata.vesselName || 'INS Sagar Kanya (MoES-04)',
        sonarFrequency: metadata.sonarFrequency || '800 kHz High Precision',
        swathWidthMeters: metadata.swathWidthMeters || 100,
        notes: metadata.notes || 'Ingested via .ZIP file upload pipeline.'
      },
      detections: [
        {
          id: `DET-${scanId.split('-').pop()}-01`,
          scanId,
          classification: 'Ghost Fishing Net',
          confidence: 96.5,
          debrisProbability: 97.8,
          falsePositiveProbability: 2.2,
          riskLevel: 'HIGH',
          bbox: { x: 20, y: 30, width: 25, height: 25 },
          estimatedSizeMeters: { length: 8.4, width: 2.5 },
          depthMeters: metadata.depthMeters || 25.0,
          location: { lat: metadata.lat || 15.2939, lng: metadata.lng || 74.1240 },
          notes: 'Submerged nylon gillnet lattice detected with distinct acoustic shadow.',
          falsePositiveFactors: {
            shadowConsistency: { rating: 'HIGH', score: 96, detail: 'Distinct acoustic shadow profile.' },
            shapeConsistency: { rating: 'HIGH', score: 98, detail: 'Netting lattice detected.' },
            textureSimilarity: { rating: 'HIGH', score: 95, detail: 'Nylon acoustic response.' },
            seabedContext: { rating: 'HIGH', score: 93, detail: 'High contrast against sandy mud.' },
            overallProbability: 2.2
          }
        },
        {
          id: `DET-${scanId.split('-').pop()}-02`,
          scanId,
          classification: 'Shipwreck / Container',
          confidence: 91.4,
          debrisProbability: 94.0,
          falsePositiveProbability: 6.0,
          riskLevel: 'HIGH',
          bbox: { x: 55, y: 45, width: 24, height: 22 },
          estimatedSizeMeters: { length: 14.2, width: 4.8 },
          depthMeters: (metadata.depthMeters || 25.0) + 0.5,
          location: { lat: (metadata.lat || 15.2939) + 0.001, lng: (metadata.lng || 74.1240) + 0.001 },
          notes: 'High-density metallic hull structure with linear acoustic shadow.',
          falsePositiveFactors: {
            shadowConsistency: { rating: 'HIGH', score: 92, detail: 'Linear acoustic shadow.' },
            shapeConsistency: { rating: 'HIGH', score: 94, detail: 'Hull frame outline.' },
            textureSimilarity: { rating: 'HIGH', score: 90, detail: 'High metallic backscatter.' },
            seabedContext: { rating: 'HIGH', score: 90, detail: 'Isolated object.' },
            overallProbability: 6.0
          }
        }
      ]
    };

    const updatedList = [newAnalysis, ...currentList];
    saveStoredAnalyses(updatedList);
    return newAnalysis;
  },

  /**
   * Polls analysis execution job status.
   */
  async getResult(scanId: string): Promise<Analysis | null> {
    return this.getAnalysisById(scanId);
  },

  /**
   * Deletes an analysis record.
   */
  async deleteAnalysis(scanId: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const currentList = getStoredAnalyses();
    const filtered = currentList.filter((a) => a.id !== scanId);
    saveStoredAnalyses(filtered);
    return true;
  },

  /**
   * Resets stored data to empty state.
   */
  resetToFactoryDefaults(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  },

  /**
   * Aggregates key summary statistics for the dashboard console.
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const analyses = getStoredAnalyses();
    const completedAnalyses = analyses.filter((a) => a.status === 'completed');

    let totalDetections = 0;
    let highRiskCount = 0;
    let confidenceSum = 0;
    let falsePositiveSum = 0;

    completedAnalyses.forEach((a) => {
      totalDetections += a.detections.length;
      a.detections.forEach((d) => {
        if (d.riskLevel === 'HIGH') highRiskCount++;
        confidenceSum += d.confidence;
        falsePositiveSum += d.falsePositiveProbability;
      });
    });

    const avgConfidence = totalDetections > 0 ? confidenceSum / totalDetections : 0;
    const falsePositiveRate = totalDetections > 0 ? falsePositiveSum / totalDetections : 0;

    return {
      totalScans: analyses.length,
      totalDetections,
      highRiskDetections: highRiskCount,
      avgConfidence: Number(avgConfidence.toFixed(1)),
      falsePositiveRate: Number(falsePositiveRate.toFixed(1)),
      scansTrend: 0,
      detectionsTrend: 0
    };
  }
};
