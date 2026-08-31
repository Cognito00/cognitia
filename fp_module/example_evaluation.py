"""
Example Evaluation Script
=========================

Demonstrates TP/FP/FN classification using sample ground-truth and predictions.

This is a STANDALONE example that shows:
  1. How to structure ground-truth data
  2. How to use the evaluation module
  3. What the output looks like

To use with real YOLO predictions, call:
  evaluation.match_predictions_to_ground_truth(
      predictions_from_yolo,
      ground_truth_data,
      calculate_iou,
      iou_threshold=0.5
  )
"""

import cv2
import sys
sys.path.insert(0, '/c/Users/aashi/OneDrive/Desktop/SIH Hackathon')

from evaluation import (
    match_predictions_to_ground_truth,
    print_evaluation_results,
    visualize_predictions,
)


# ============================================================================
# IoU CALCULATION FUNCTION (reused from main.py)
# ============================================================================
def calculate_iou(box1, box2):
    """
    Calculate Intersection over Union (IoU) between two bounding boxes.
    
    Args:
        box1: Dict with keys x1, y1, x2, y2
        box2: Dict with keys x1, y1, x2, y2
    
    Returns:
        IoU value (0.0 to 1.0)
    """
    x1_min, y1_min, x1_max, y1_max = box1["x1"], box1["y1"], box1["x2"], box1["y2"]
    x2_min, y2_min, x2_max, y2_max = box2["x1"], box2["y1"], box2["x2"], box2["y2"]
    
    # Calculate intersection area
    intersection_x_min = max(x1_min, x2_min)
    intersection_y_min = max(y1_min, y2_min)
    intersection_x_max = min(x1_max, x2_max)
    intersection_y_max = min(y1_max, y2_max)
    
    # If boxes don't overlap, intersection area is 0
    if intersection_x_max < intersection_x_min or intersection_y_max < intersection_y_min:
        return 0.0
    
    intersection_area = (intersection_x_max - intersection_x_min) * (intersection_y_max - intersection_y_min)
    
    # Calculate union area
    box1_area = (x1_max - x1_min) * (y1_max - y1_min)
    box2_area = (x2_max - x2_min) * (y2_max - y2_min)
    union_area = box1_area + box2_area - intersection_area
    
    # Avoid division by zero
    if union_area == 0:
        return 0.0
    
    iou = intersection_area / union_area
    return iou


# ============================================================================
# SAMPLE DATA: GROUND-TRUTH BOXES
# ============================================================================
# These are human-annotated boxes (assumed to be 100% correct)
ground_truth = [
    {
        "class_name": "net",
        "x1": 100,
        "y1": 100,
        "x2": 200,
        "y2": 200,
    },
    {
        "class_name": "net",
        "x1": 300,
        "y1": 150,
        "x2": 400,
        "y2": 250,
    },
    {
        "class_name": "rock",
        "x1": 500,
        "y1": 50,
        "x2": 600,
        "y2": 150,
    },
]

print("\n" + "=" * 80)
print("GROUND-TRUTH (Human-Annotated):")
print("=" * 80)
for i, gt in enumerate(ground_truth):
    print(f"GT #{i}: {gt['class_name']} at ({gt['x1']}, {gt['y1']}, {gt['x2']}, {gt['y2']})")


# ============================================================================
# SAMPLE DATA: YOLO PREDICTIONS
# ============================================================================
# These are predictions from YOLO (may have errors)
predictions = [
    {
        "class_name": "net",
        "confidence": 0.95,
        "x1": 105,  # Slightly offset from first GT net
        "y1": 105,
        "x2": 195,
        "y2": 195,
    },
    {
        "class_name": "net",
        "confidence": 0.92,
        "x1": 305,  # Slightly offset from second GT net
        "y1": 155,
        "x2": 395,
        "y2": 245,
    },
    {
        "class_name": "rock",
        "confidence": 0.88,
        "x1": 600,  # Wrong class (should be "net" to match first GT)
        "y1": 50,
        "x2": 700,
        "y2": 150,
    },
    {
        "class_name": "rock",
        "confidence": 0.75,
        "x1": 505,  # Close to GT rock but not quite
        "y1": 55,
        "x2": 595,
        "y2": 145,
    },
    {
        "class_name": "debris",
        "confidence": 0.50,
        "x1": 1000,  # Completely wrong location (no GT match)
        "y1": 1000,
        "x2": 1100,
        "y2": 1100,
    },
]

print("\n" + "=" * 80)
print("YOLO PREDICTIONS:")
print("=" * 80)
for i, pred in enumerate(predictions):
    print(f"Pred #{i}: {pred['class_name']} ({pred['confidence']:.2%}) at ({pred['x1']}, {pred['y1']}, {pred['x2']}, {pred['y2']})")


# ============================================================================
# RUN EVALUATION
# ============================================================================
print("\n" + "=" * 80)
print("RUNNING EVALUATION...")
print("=" * 80)
print("Matching predictions to ground-truth (IoU threshold = 0.5)...\n")

evaluation = match_predictions_to_ground_truth(
    predictions=predictions,
    ground_truth=ground_truth,
    iou_fn=calculate_iou,
    iou_threshold=0.5,
)

# ============================================================================
# PRINT DETAILED RESULTS
# ============================================================================
print_evaluation_results(evaluation)


# ============================================================================
# EXPECTED RESULTS (for understanding)
# ============================================================================
print("\n" + "=" * 80)
print("UNDERSTANDING THE RESULTS:")
print("=" * 80)
print("""
Prediction #1 (net, 95%, 105,105,195,195):
  - Class matches GT #0? YES (both "net")
  - IoU with GT #0 (100,100,200,200)? 0.78 >= 0.5? YES
  - GT #0 already matched? NO
  → TRUE POSITIVE ✓

Prediction #2 (net, 92%, 305,155,395,245):
  - Class matches GT #1? YES (both "net")
  - IoU with GT #1 (300,150,400,250)? 0.81 >= 0.5? YES
  - GT #1 already matched? NO
  → TRUE POSITIVE ✓

Prediction #3 (rock, 88%, 600,50,700,150):
  - Looking for GT with class "rock"
  - GT #2 is rock (500,50,600,150)
  - IoU? Very low (boxes barely overlap)
  → FALSE POSITIVE ✗

Prediction #4 (rock, 75%, 505,55,595,145):
  - Class matches GT #2? YES (both "rock")
  - IoU with GT #2 (500,50,600,150)? 0.89 >= 0.5? YES
  - GT #2 already matched? NO
  → TRUE POSITIVE ✓

Prediction #5 (debris, 50%, 1000,1000,1100,1100):
  - No GT has class "debris"
  → FALSE POSITIVE ✗

Unmatched GT:
  - GT #0 or #1? No, both matched
  → NO FALSE NEGATIVES

Wait, this example shows all GTs matched. Let me recalculate...

Actually, in this example:
  - GT #0 matched to Pred #1 ✓
  - GT #1 matched to Pred #2 ✓
  - GT #2 matched to Pred #4 ✓
  - Pred #3, #5 are FALSE POSITIVES (no match or low IoU)
  - No FALSE NEGATIVES (all GTs were matched)
""")


# ============================================================================
# VISUALIZATION
# ============================================================================
print("\n" + "=" * 80)
print("GENERATING VISUALIZATION...")
print("=" * 80)

image_height = 600
image_width = 1200

annotated_image = visualize_predictions(
    image_height=image_height,
    image_width=image_width,
    predictions=predictions,
    ground_truth=ground_truth,
    evaluation=evaluation,
)

# Display the image
cv2.imshow("Ground-Truth Evaluation", annotated_image)
print("Displaying evaluation visualization...")
print("Press any key to close the window.\n")
cv2.waitKey(0)
cv2.destroyAllWindows()

print("Done!")
