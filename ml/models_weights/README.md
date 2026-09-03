\# Model Weights



This directory contains trained YOLO model weights used for inference.



\## Current MVP Model



\- Architecture: YOLO11n

\- Model version: `sonar-yolo11n-mvp-01`

\- Weight file: `best.pt`

\- Training dataset: `FINAL\_YOLO\_DATASET\_CLEAN\_OMMD\_V2`

\- Image size: 768 × 768

\- Confidence threshold: 0.25



\## Detection Classes



| Class ID | Class |

|---|---|

| 0 | Shipwreck |

| 1 | Other-Man-Made-Debris |

| 2 | Ghost-Fishing-Gear |



\## Model Selection



`sonar-yolo11n-mvp-01` is the current MVP model.



Further experiments may be performed to improve detection performance before the final production model is selected.



\## Updating the Model



When a new model is selected, replace:



`best.pt`



and update the model version in:



`ml/config.yaml`



The inference output format should remain unchanged.

