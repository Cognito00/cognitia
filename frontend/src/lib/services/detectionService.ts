import { MissionDetection, ReviewStatus } from '../types/sagaraModel';
import { missionService } from './missionService';

export const detectionService = {
  /**
   * Fetch all detections associated with a mission.
   * // API: GET /api/v1/missions/:missionId/detections
   */
  async getDetectionsByMission(missionId: string): Promise<MissionDetection[]> {
    const mission = await missionService.getMissionById(missionId);
    return mission ? mission.detections : [];
  },

  /**
   * Fetch a single detection by ID.
   * // API: GET /api/v1/detections/:detectionId
   */
  async getDetectionById(detectionId: string): Promise<MissionDetection | null> {
    const missions = await missionService.getMissions();
    for (const m of missions) {
      const found = m.detections.find((d) => d.detectionId.toLowerCase() === detectionId.toLowerCase());
      if (found) return found;
    }
    return null;
  },

  /**
   * Update the review status of a detection.
   * // API: PATCH /api/v1/detections/:detectionId/review
   */
  async updateDetectionReview(detectionId: string, reviewStatus: ReviewStatus): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return true;
  }
};
