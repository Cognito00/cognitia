import type {
  Analysis,
  Detection,
  RiskLevel,
  SurveyMetadata,
  FactorRating,
} from "../types/analysis";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://cognitia-backend.onrender.com";

interface BackendDetection {
  id?: string;
  detection_id?: string;
  image_id?: string;

  class_id?: number;
  class_name?: string;

  model_confidence?: number;
  confidence?: number;

  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;

  bbox?: {
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
  };

  filter_status?: string;
  filter_reason?: string;

  latitude?: number | null;
  longitude?: number | null;

  depth_m?: number | null;
  depth_meters?: number | null;

  model_version?: string;
}

interface BackendImage {
  id?: string;
  image_id?: string;

  filename?: string;
  original_filename?: string;

  image_width?: number;
  image_height?: number;

  width?: number;
  height?: number;

  model_version?: string;

  created_at?: string;
  uploaded_at?: string;

  status?: string;

  metadata?: Record<string, unknown>;
}

interface BackendImageResults {
  image?: BackendImage;
  detections?: BackendDetection[];
}

interface BackendUploadResponse {
  message?: string;
  image_id?: string;
  filename?: string;

  processed_png_path?: string;
  metadata_json_path?: string;
  npz_path?: string;

  detections_found?: number;
  detections?: BackendDetection[];
  saved_detections?: BackendDetection[];
}

interface BackendDetectionsResponse {
  message?: string;
  data?: BackendDetection[];
}

interface DashboardStats {
  totalAnalyses: number;
  totalDetections: number;
  avgConfidence: number;
  areaSurveyedKm2: number;
}

function getConfidence(detection: BackendDetection): number {
  const value =
    detection.model_confidence ?? detection.confidence ?? 0;

  return Math.max(0, Math.min(100, value * 100));
}

function getRating(confidence: number): RiskLevel {
  if (confidence >= 70) return "HIGH";
  if (confidence >= 40) return "MEDIUM";
  return "LOW";
}

function getRiskLevel(confidence: number): RiskLevel {
  if (confidence >= 70) return "HIGH";
  if (confidence >= 40) return "MEDIUM";
  return "LOW";
}

function getClassName(className?: string, classId?: number): string {
  if (className) {
    if (className === "Shipwreck") {
      return "Shipwreck / Container";
    }

    if (className === "Other-Man-Made-Debris") {
      return "Marine Debris";
    }

    if (className === "Ghost-Fishing-Gear") {
      return "Ghost Fishing Net";
    }

    return className;
  }

  switch (classId) {
    case 0:
      return "Shipwreck / Container";
    case 1:
      return "Marine Debris";
    case 2:
      return "Ghost Fishing Net";
    default:
      return "Acoustic Anomaly";
  }
}

function getBBox(detection: BackendDetection) {
  const bbox = detection.bbox;

  return {
    x1: bbox?.x1 ?? detection.x1 ?? 0,
    y1: bbox?.y1 ?? detection.y1 ?? 0,
    x2: bbox?.x2 ?? detection.x2 ?? 0,
    y2: bbox?.y2 ?? detection.y2 ?? 0,
  };
}

function createFactors(confidence: number) {
  const rating = getRating(confidence);

  return {
    shadowConsistency: {
      rating,
      score: confidence,
      detail: "Based on model confidence",
    },

    shapeConsistency: {
      rating,
      score: confidence,
      detail: "Based on model confidence",
    },

    textureSimilarity: {
      rating,
      score: confidence,
      detail: "Based on model confidence",
    },

    seabedContext: {
      rating,
      score: confidence,
      detail: "Based on model confidence",
    },

    overallProbability: Math.max(
      0,
      Math.min(100, 100 - confidence)
    ),
  };
}
function mapDetection(
  detection: BackendDetection,
  index: number,
  imageWidth = 640,
  imageHeight = 640
): Detection {
  const confidence = getConfidence(detection);
  const bbox = getBBox(detection);

  const width = Math.max(0, bbox.x2 - bbox.x1);
  const height = Math.max(0, bbox.y2 - bbox.y1);

  const latitude = detection.latitude ?? 15.2939;
  const longitude = detection.longitude ?? 74.124;

  const depth =
    detection.depth_meters ??
    detection.depth_m ??
    0;

  const detectionId =
    detection.id ??
    detection.detection_id ??
    `detection-${index + 1}`;

  return {
    id: detectionId,
    scanId: detection.image_id ?? "",
    classification: getClassName(
      detection.class_name,
      detection.class_id
    ) as Detection["classification"],

    confidence,

    debrisProbability: confidence,

    falsePositiveProbability: Math.max(
      0,
      Math.min(100, 100 - confidence)
    ),

    riskLevel: getRiskLevel(confidence),

    bbox: {
      x: imageWidth
        ? (bbox.x1 / imageWidth) * 100
        : 0,

      y: imageHeight
        ? (bbox.y1 / imageHeight) * 100
        : 0,

      width: imageWidth
        ? (width / imageWidth) * 100
        : 0,

      height: imageHeight
        ? (height / imageHeight) * 100
        : 0,
    },

    estimatedSizeMeters: {
      length: width,
      width: height,
    },

    depthMeters: depth,

    location: {
      lat: latitude,
      lng: longitude,
    },

    falsePositiveFactors: createFactors(confidence),

    notes:
      detection.filter_reason ??
      "Detection generated by Cognitia ML model.",
  };
}

function mapAnalysis(
  image: BackendImage,
  detections: BackendDetection[]
): Analysis {
  const imageId =
    image.id ??
    image.image_id ??
    "unknown";

  const imageWidth =
    image.image_width ??
    image.width ??
    640;

  const imageHeight =
    image.image_height ??
    image.height ??
    640;

  const mappedDetections = detections.map(
    (detection, index) =>
      mapDetection(
        {
          ...detection,
          image_id: detection.image_id ?? imageId,
        },
        index,
        imageWidth,
        imageHeight
      )
  );

  const confidences = mappedDetections.map(
    (detection) => detection.confidence
  );

  const avgConfidence =
    confidences.length > 0
      ? confidences.reduce(
          (sum, value) => sum + value,
          0
        ) / confidences.length
      : 0;

  const highestRisk: RiskLevel =
    mappedDetections.some(
      (detection) => detection.riskLevel === "HIGH"
    )
      ? "HIGH"
      : mappedDetections.some(
          (detection) => detection.riskLevel === "MEDIUM"
        )
      ? "MEDIUM"
      : "LOW";

  const firstDetection = mappedDetections[0];

  const latitude =
    firstDetection?.location.lat ?? 15.2939;

  const longitude =
    firstDetection?.location.lng ?? 74.124;

  const sonarFrequency =
    typeof image.metadata?.sonarFrequency === "string"
      ? image.metadata.sonarFrequency
      : "Unknown";

  const region =
    typeof image.metadata?.region === "string"
      ? image.metadata.region
      : "Arabian Sea";

  const surveyDate =
    typeof image.metadata?.surveyDate === "string"
      ? image.metadata.surveyDate
      : new Date().toISOString();

  const depth =
    typeof image.metadata?.depth === "number"
      ? image.metadata.depth
      : firstDetection?.depthMeters ?? 0;

  const metadata: SurveyMetadata = {
    location: {
      lat: latitude,
      lng: longitude,
    },

    locationName: region,

    region,

    lat: latitude,

    lng: longitude,

    dateTime: surveyDate,

    depthMeters: depth,

    sonarFrequency,

    swathWidthMeters: undefined,

    notes: undefined,

    vesselName: undefined,
  };

  return {
    id: imageId,

    filename:
      image.original_filename ??
      image.filename ??
      "sonar.SON",

    fileSize: "Unknown",

    dimensions: {
      width: imageWidth,
      height: imageHeight,
    },

    imageUrl: "",

    createdAt:
      image.created_at ??
      image.uploaded_at ??
      new Date().toISOString(),

    metadata,

    status: "completed",

    detections: mappedDetections,

    highestRisk,

    avgConfidence,

    overallDebrisProbability:
      mappedDetections.length > 0
        ? mappedDetections.reduce(
            (sum, detection) =>
              sum + detection.debrisProbability,
            0
          ) / mappedDetections.length
        : 0,

    overallFalsePositiveRate:
      mappedDetections.length > 0
        ? mappedDetections.reduce(
            (sum, detection) =>
              sum +
              detection.falsePositiveProbability,
            0
          ) / mappedDetections.length
        : 0,

    summaryNotes:
      mappedDetections.length > 0
        ? `${mappedDetections.length} sonar detection(s) identified by the Cognitia ML pipeline.`
        : "No detections were identified in this sonar scan.",
  };
}

export const analysisService = {
  async getAnalyses(): Promise<Analysis[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/detections`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch detections: ${response.status}`
        );
      }

      const result =
        (await response.json()) as BackendDetectionsResponse;

      const detections = result.data ?? [];

      const grouped = new Map<
        string,
        BackendDetection[]
      >();

      for (const detection of detections) {
        const imageId =
          detection.image_id ?? "unknown";

        if (!grouped.has(imageId)) {
          grouped.set(imageId, []);
        }

        grouped.get(imageId)!.push(detection);
      }

      const analyses: Analysis[] = [];

      for (const [imageId, imageDetections] of grouped) {
        try {
          const resultResponse = await fetch(
            `${API_BASE_URL}/images/${imageId}/results`
          );

          if (!resultResponse.ok) {
            continue;
          }

          const resultData =
            (await resultResponse.json()) as BackendImageResults;

          if (resultData.image) {
            analyses.push(
              mapAnalysis(
                resultData.image,
                resultData.detections ??
                  imageDetections
              )
            );
          }
        } catch {
          // Skip an individual image if it cannot be loaded.
        }
      }

      return analyses;
    } catch (error) {
      console.error(
        "Failed to load analyses:",
        error
      );

      return [];
    }
  },

  async getAnalysisById(
    id: string
  ): Promise<Analysis | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/images/${id}/results`
      );

      if (!response.ok) {
        return null;
      }

      const result =
        (await response.json()) as BackendImageResults;

      if (!result.image) {
        return null;
      }

      return mapAnalysis(
        result.image,
        result.detections ?? []
      );
    } catch (error) {
      console.error(
        "Failed to load analysis:",
        error
      );

      return null;
    }
  },

  async submitSonAnalysis(
    file: File,
    metadata?: Record<string, unknown>
  ): Promise<Analysis> {
    const extension =
      file.name.split(".").pop()?.toLowerCase();

    if (extension !== "zip") {
      throw new Error(
        "Please upload a .ZIP sonar survey file."
      );
    }

    const formData = new FormData();

    formData.append("file", file);

    if (metadata) {
      formData.append(
        "metadata",
        JSON.stringify(metadata)
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const message = await response.text();

      throw new Error(
        `Upload failed: ${response.status} ${message}`
      );
    }

    const uploadResult =
      (await response.json()) as BackendUploadResponse;

    const imageId = uploadResult.image_id;

    if (!imageId) {
      throw new Error(
        "Backend did not return an image_id."
      );
    }

    const detections =
      uploadResult.saved_detections ??
      uploadResult.detections ??
      [];

    const existingResult =
      await this.getAnalysisById(imageId);

    if (existingResult) {
      return {
        ...existingResult,

        fileSize: `${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)} MB`,

        filename: file.name,
      };
    }

    const fallbackImage: BackendImage = {
      id: imageId,
      image_id: imageId,
      filename:
        uploadResult.filename ?? file.name,
      original_filename:
        uploadResult.filename ?? file.name,
      image_width: 640,
      image_height: 640,
      model_version: "MVP-04-V5-Rec14",
      created_at:
        new Date().toISOString(),
      metadata,
    };

    const analysis = mapAnalysis(
      fallbackImage,
      detections
    );

    return {
      ...analysis,
      filename: file.name,
      fileSize: `${(
        file.size /
        (1024 * 1024)
      ).toFixed(2)} MB`,
    };
  },

  async getResult(
    scanId: string
  ): Promise<Analysis | null> {
    return this.getAnalysisById(scanId);
  },

  async deleteAnalysis(
    _id: string
  ): Promise<boolean> {
    console.warn(
      "Delete endpoint is not implemented in the backend."
    );

    return false;
  },

  async resetToFactory(): Promise<boolean> {
    return true;
  },

  async resetToFactoryDefaults(): Promise<boolean> {
    return this.resetToFactory();
  },

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/detections`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch dashboard statistics."
        );
      }

      const result =
        (await response.json()) as BackendDetectionsResponse;

      const detections = result.data ?? [];

      const uniqueImages = new Set(
        detections
          .map(
            (detection) => detection.image_id
          )
          .filter(Boolean)
      );

      const confidenceValues =
        detections.map((detection) =>
          getConfidence(detection)
        );

      const avgConfidence =
        confidenceValues.length > 0
          ? confidenceValues.reduce(
              (sum, value) => sum + value,
              0
            ) / confidenceValues.length
          : 0;

      return {
        totalAnalyses: uniqueImages.size,

        totalDetections:
          detections.length,

        avgConfidence,

        areaSurveyedKm2: 14.8,
      };
    } catch (error) {
      console.error(
        "Failed to load dashboard stats:",
        error
      );

      return {
        totalAnalyses: 0,
        totalDetections: 0,
        avgConfidence: 0,
        areaSurveyedKm2: 0,
      };
    }
  },
};