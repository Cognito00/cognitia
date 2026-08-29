# AI/ML — Sonar Object Detection

## Overview

The AI/ML module detects and classifies objects in side-scan sonar imagery using YOLO.

## Detection Classes

| Class ID | Class |
|---|---|
| 0 | Shipwreck |
| 1 | Other-Man-Made-Debris |
| 2 | Ghost-Fishing-Gear |

## Current Model

- Architecture: YOLO11n
- Version: YOLO11n_improved_v1
- Image size: 640 x 640
- Training epochs: 50
- Confidence threshold: 0.25

The current model is a working model and is not yet the final production model.

## Repository Structure

```text
ml/
+-- dataset/
+-- evaluation/
+-- inference/
+-- models_weights/
+-- notebooks/
+-- preprocessing/
+-- training/
+-- config.yaml
+-- requirements.txt
