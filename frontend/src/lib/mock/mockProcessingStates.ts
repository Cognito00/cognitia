import { ProcessingStage } from '../types/analysis';

export const MOCK_PROCESSING_STAGES: ProcessingStage[] = [
  {
    id: 'upload',
    name: 'File Validation',
    description: '.SON header structure & binary checksum verification...',
    status: 'pending',
    progress: 0
  },
  {
    id: 'preprocessing',
    name: 'Metadata Extraction',
    description: 'Extracting transducer ping rate, GPS trackline & swath width...',
    status: 'pending',
    progress: 0
  },
  {
    id: 'preprocessing',
    name: 'Sonar Preprocessing',
    description: 'Applying TVG gain calibration, slant-range & speckle noise filter...',
    status: 'pending',
    progress: 0
  },
  {
    id: 'ai_analysis',
    name: 'AI Detection',
    description: 'Running multi-scale CNN acoustic backscatter feature extraction...',
    status: 'pending',
    progress: 0
  },
  {
    id: 'classification',
    name: 'Classification',
    description: 'Categorizing targets into Ghost Net, Marine Debris & Metal Gear...',
    status: 'pending',
    progress: 0
  },
  {
    id: 'false_positive',
    name: 'False Positive Filtering',
    description: 'Cross-verifying acoustic shadow height & seabed texture consistency...',
    status: 'pending',
    progress: 0
  },
  {
    id: 'completed',
    name: 'Georeferencing',
    description: 'Geolocating bounding boxes to WGS84 benthic coordinates...',
    status: 'pending',
    progress: 0
  },
  {
    id: 'completed',
    name: 'Report Preparation',
    description: 'Compiling field report payload & initializing Analysis Workspace...',
    status: 'pending',
    progress: 0
  }
];
