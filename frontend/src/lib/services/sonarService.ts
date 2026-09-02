import { Mission } from '../types/sagaraModel';
import { missionService } from './missionService';

export const sonarService = {
  /**
   * Uploads and validates a Side-Scan Sonar .SON file.
   * // API: POST /api/v1/sonar/upload (multipart/form-data)
   */
  async uploadSonFile(file: File): Promise<{ fileName: string; fileSize: string; valid: boolean; error?: string }> {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (ext !== 'son') {
      return {
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        valid: false,
        error: 'Unsupported file format. Please upload a Side-Scan Sonar .SON file.'
      };
    }

    return {
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      valid: true
    };
  },

  /**
   * Triggers background parsing & AI feature extraction on a .SON survey mission.
   * // API: POST /api/v1/sonar/process
   */
  async processSonData(file: File, metadata: Partial<Mission>): Promise<Mission> {
    return missionService.createMission(file, metadata);
  }
};
