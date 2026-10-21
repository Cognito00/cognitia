# SAGARA — AI-Powered Underwater Marine Debris Detection

**SIH Problem Statement:** SIH26057  
**Domain:** Artificial Intelligence and Machine Learning  
**Focus:** Side-Scan Sonar (SSS) imagery analysis

## Overview

SAGARA is an AI-powered system designed to detect and help locate underwater marine debris and anomalies using Side-Scan Sonar imagery.

Manual inspection of sonar recordings can be time-consuming, and man-made objects may resemble natural seabed features. SAGARA combines sonar data extraction, preprocessing, AI-based object detection, false-positive filtering, geospatial association, and visualization into a modular workflow.

## Problem Statement

Marine debris, including ghost fishing gear and other man-made objects, can be difficult to identify in large volumes of sonar data. Noise, data gaps, varying image quality, acoustic shadows, and natural seabed structures can make manual analysis challenging.

SAGARA aims to assist sonar analysts and marine researchers by organizing this process into a more efficient and traceable workflow.

## Key Features

- **Sonar Data Extraction:** Convert supported raw sonar recordings into viewable echograms and navigation metadata.
- **Sonar Preprocessing:** Reduce noise, handle data gaps, normalize image intensity, and prepare data for analysis.
- **AI-Based Detection:** Use a YOLO-based object detection model to identify candidate targets.
- **False-Positive Filtering:** Evaluate detections using sonar-specific image and object characteristics.
- **Geospatial Association:** Associate detections with available navigation metadata and structure the results for geographic visualization.
- **Interactive Visualization:** Present detections, confidence scores, locations, and heatmap-based views through a dashboard.
- **Data Management and Reports:** Use a FastAPI backend and Supabase services to manage structured detection data and files, with JSON/CSV reporting.

## Detection Categories

The project focuses on three categories:

1. Shipwreck
2. Other Man-Made Debris
3. Ghost-Fishing Gear

Detection results are candidate findings that may require human verification. Model confidence does not guarantee that an object has been correctly identified.

## System Workflow

```text
Raw Sonar Recording
        |
        v
Sonar Data Extraction
        |
        v
Preprocessing and Quality Checks
        |
        v
YOLO-Based Object Detection
        |
        v
False-Positive Filtering
        |
        v
Geospatial Association
        |
        v
FastAPI Backend
        |
        v
Supabase Database and Storage
        |
        v
Frontend Dashboard and Reports
```

## Technology Stack

| Component | Technology |
|---|---|
| AI and Object Detection | YOLO, Python |
| Sonar Processing | Python, NumPy, Pillow |
| Backend API | FastAPI, Uvicorn |
| Database | Supabase PostgreSQL |
| File Storage | Supabase Storage |
| Geospatial Data | Latitude/longitude metadata, GeoJSON |
| Frontend | React / Next.js |
| Version Control | Git and GitHub |
| Backend Deployment | Render |

*The stack and integrations may evolve during development.*

## Backend

The backend provides APIs that connect the project modules, validate requests, manage detection records, and return results to the frontend.

Supabase PostgreSQL stores structured records, while Supabase Storage can be used for supported project files. The API also supports retrieving detection results and generating structured reports as the relevant features are integrated.

## Geospatial Processing

The geospatial component associates candidate detections with navigation information extracted from the sonar recording. The resulting location data can be structured as GeoJSON for mapping and analysis.

Location precision depends on the available navigation metadata and the accuracy of the association between a detection and its position in the sonar data.

## Project Status

SAGARA is being developed as a prototype. Individual components are being integrated and tested. Detection performance, false-positive reduction, geospatial accuracy, and end-to-end behavior require evaluation on suitable sonar datasets.

## Potential Applications

- Marine research and underwater surveys
- Sonar image analysis
- Identification of potential ghost fishing gear
- Marine debris investigation
- Geographic visualization of candidate underwater targets

## Future Scope

- Improve detection performance using more representative labelled sonar datasets.
- Evaluate preprocessing and false-positive filtering against ground-truth annotations.
- Improve geospatial association and localization validation.
- Complete frontend-to-backend integration and end-to-end testing.
- Explore offline processing and later synchronization for environments with limited connectivity.

## Team

**Team Cognitia**  
Smart India Hackathon — Problem Statement SIH26057

## Disclaimer

SAGARA is intended to assist sonar analysis, not replace expert review. Detected objects and associated locations should be verified before being used for operational or environmental decisions.