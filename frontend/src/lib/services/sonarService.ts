import { Mission } from '../types/sagaraModel';
import { missionService } from './missionService';

export const sonarService = {
  /**
   * Uploads and validates a sonar data .zip archive.
   * // API: POST /api/v1/sonar/upload (multipart/form-data)
   */
  async uploadZipFile(file: File): Promise<{ fileName: string; fileSize: string; valid: boolean; error?: string }> {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (ext !== 'zip') {
      return {
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        valid: false,
        error: 'Invalid file format. Please upload a .zip file.'
      };
    }

    return {
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      valid: true
    };
  },

  /**
   * Triggers background parsing & AI feature extraction on a .zip survey mission.
   * // API: POST /api/v1/sonar/process
   */
  async processSonData(file: File, metadata: Partial<Mission>): Promise<Mission> {
    return missionService.createMission(file, metadata);
  }
};
