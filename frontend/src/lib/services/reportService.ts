import { Mission, MissionDetection, MissionReport } from '../types/sagaraModel';
import { missionService } from './missionService';

export interface SAGARAStructuredJSONReport {
  report: {
    report_id: string;
    generated_at: string;
    system: string;
    version: string;
  };
  mission: {
    mission_id: string;
    dataset_file: string;
    location: string;
    survey_date: string;
    depth: number;
    frequency: string;
    swath_width: number;
    vessel: string;
    water_conditions?: string;
    mission_notes?: string;
  };
  summary: {
    total_detections: number;
    high_confidence: number;
    needs_review: number;
    low_confidence: number;
  };
  detections: Array<{
    detection_id: string;
    classification: string;
    confidence: number;
    false_positive_probability: number;
    review_status: string;
    location: {
      latitude: number;
      longitude: number;
      depth: number;
    };
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    timestamp: string;
    notes: string;
  }>;
}

export const reportService = {
  /**
   * Generates a structured JSON report payload for a mission and its detections.
   */
  generateJSONReport(mission: Mission, detections: MissionDetection[]): SAGARAStructuredJSONReport {
    const highConfidence = detections.filter((d) => d.confidence >= 90).length;
    const needsReview = detections.filter((d) => d.confidence >= 75 && d.confidence < 90).length;
    const lowConfidence = detections.filter((d) => d.confidence < 75).length;

    return {
      report: {
        report_id: `REP-${mission.missionId.split('-').pop() || '2026'}`,
        generated_at: new Date().toISOString(),
        system: "SAGARA",
        version: "1.0"
      },
      mission: {
        mission_id: mission.missionId,
        dataset_file: mission.fileName,
        location: mission.location,
        survey_date: mission.surveyDate,
        depth: mission.depth,
        frequency: mission.sonarFrequency,
        swath_width: mission.swathWidth,
        vessel: mission.vessel,
        mission_notes: mission.notes || "Operational side-scan acoustic survey dataset."
      },
      summary: {
        total_detections: detections.length,
        high_confidence: highConfidence,
        needs_review: needsReview,
        low_confidence: lowConfidence
      },
      detections: detections.map((d) => ({
        detection_id: d.detectionId,
        classification: d.classification,
        confidence: d.confidence,
        false_positive_probability: d.falsePositiveProbability,
        review_status: d.reviewStatus,
        location: {
          latitude: d.latitude,
          longitude: d.longitude,
          depth: d.depth
        },
        dimensions: {
          length: d.estimatedLength,
          width: d.estimatedWidth,
          height: d.estimatedHeight || 1.2
        },
        timestamp: d.timestamp || mission.surveyDate,
        notes: d.notes || "Acoustic anomaly identified during swath scan."
      }))
    };
  },

  /**
   * Generates a CSV string for a mission's detections.
   */
  generateCSVReport(mission: Mission, detections: MissionDetection[]): string {
    const headers = [
      'Detection ID',
      'Mission ID',
      'Classification',
      'Confidence (%)',
      'False Positive Prob (%)',
      'Review Status',
      'Latitude',
      'Longitude',
      'Depth (m)',
      'Length (m)',
      'Width (m)',
      'Height (m)',
      'Timestamp'
    ];

    const rows = detections.map((d) => [
      d.detectionId,
      mission.missionId,
      `"${d.classification}"`,
      d.confidence,
      d.falsePositiveProbability,
      d.reviewStatus,
      d.latitude,
      d.longitude,
      d.depth,
      d.estimatedLength,
      d.estimatedWidth,
      d.estimatedHeight || 1.2,
      `"${d.timestamp || mission.surveyDate}"`
    ]);

    return [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  },

  /**
   * Triggers client-side browser download for JSON report payload.
   */
  downloadJSONReport(jsonObj: SAGARAStructuredJSONReport, filename: string) {
    const jsonString = JSON.stringify(jsonObj, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Triggers client-side browser download for CSV telemetry report.
   */
  downloadCSVReport(csvString: string, filename: string) {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Legacy interface bridge for report retrieval
   */
  async getReportByMission(missionId: string): Promise<MissionReport | null> {
    const mission = await missionService.getMissionById(missionId);
    if (!mission) return null;
    return {
      reportId: `REP-${missionId.split('-').pop() || '2026'}`,
      missionId,
      generatedAt: new Date().toLocaleString(),
      detections: mission.detections,
      summary: `SAGARA acoustic survey report for ${mission.location}.`,
      exportFormats: ['JSON', 'CSV']
    };
  }
};
