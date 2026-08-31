"""
YOLO Inference - Beginner Guide
================================

This script runs YOLO object detection on a single image and displays the results.

What happens:
1. Load a pre-trained YOLO model (neural network trained on millions of images)
2. Read an image file
3. Run YOLO inference (predict what objects are in the image)
4. Print each detected object's information (class, confidence, bounding box)
5. Display the image with boxes drawn around detected objects
"""

import cv2  # OpenCV library for image handling
from ultralytics import YOLO  # YOLO model from Ultralytics


# ============================================================================
# STAGE 4: CONFIGURATION - NMS (NON-MAXIMUM SUPPRESSION)
# ============================================================================
# NMS removes duplicate/overlapping detections of the same object
# How it works:
#   1. Keep the detection with highest confidence
#   2. Remove all detections that overlap too much with it (using IoU)
#   3. Repeat with the next highest confidence
# 
# IoU Threshold (iou_threshold):
#   - 0.3 = Aggressive (removes more overlapping boxes)
#   - 0.5 = Balanced (default, standard practice)
#   - 0.7 = Conservative (keeps more overlapping boxes)
#
# TRY DIFFERENT VALUES: 0.3, 0.5, 0.7 to see how it affects output
enable_nms = True          # Set to False to disable NMS and see duplicates
iou_threshold = 0.5        # Threshold for considering boxes as overlapping
# ============================================================================


# ============================================================================
# HELPER FUNCTIONS FOR NMS
# ============================================================================

def calculate_iou(box1, box2):
    """
    Calculate Intersection over Union (IoU) between two bounding boxes.
    
    IoU = (Intersection Area) / (Union Area)
    
    Explanation:
    - Intersection: How much the boxes overlap
    - Union: Total area covered by both boxes
    - IoU close to 1.0: Boxes are nearly identical
    - IoU close to 0.0: Boxes don't overlap
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


def apply_nms(detections, iou_threshold):
    """
    Apply Non-Maximum Suppression (NMS) to remove overlapping detections.
    
    Algorithm:
    1. Sort detections by confidence (highest first)
    2. For each detection (starting with highest confidence):
       - Keep it
       - Remove all other detections that overlap with it (IoU >= threshold)
    3. Return the remaining detections
    """
    if len(detections) == 0:
        return []
    
    # Step 1: Sort by confidence (highest first)
    sorted_detections = sorted(detections, key=lambda x: x["confidence"], reverse=True)
    
    # Step 2: Apply NMS
    nms_detections = []
    
    for current in sorted_detections:
        # Check if this detection overlaps too much with any already-kept detection
        keep_this = True
        
        for kept in nms_detections:
            iou = calculate_iou(current, kept)
            
            # If IoU is too high, this is a duplicate/overlapping detection
            if iou >= iou_threshold:
                keep_this = False
                break
        
        # If it doesn't overlap too much, keep it
        if keep_this:
            nms_detections.append(current)
    
    return nms_detections


# ============================================================================
# STAGE 2: CONFIGURATION - CONFIDENCE THRESHOLD
# ============================================================================
# Set the minimum confidence level for detections to be considered valid
# Detections with confidence < this threshold will be IGNORED
# Range: 0.0 to 1.0
#   0.0 = Accept all detections (including very uncertain ones)
#   0.3 = Filter out low confidence detections
#   0.5 = Only keep medium-high confidence detections
#   0.9 = Only keep very confident detections
# TRY DIFFERENT VALUES: 0.3, 0.5, 0.7, 0.9 to see how it affects output
confidence_threshold = 0.2
# ============================================================================


# ============================================================================
# STEP 1: LOAD THE YOLO MODEL
# ============================================================================
print("Loading YOLO model...")
model = YOLO("yolov8n.pt")  # Load nano model (yolov8n.pt)
# The 'n' means 'nano' - it's small and fast for learning
# First time: takes ~5 seconds, downloads model (~6MB)
# Later times: loads from cache instantly
print("✓ Model loaded!\n")


# ============================================================================
# STEP 2: LOAD THE IMAGE
# ============================================================================
# Replace "sample_image.jpg" with your actual image path
image_path = "sample_image.jpg"

image = cv2.imread(image_path)  # Read image from disk into memory

# Check if image was loaded successfully
if image is None:
    print(f"ERROR: Could not find image at '{image_path}'")
    print("Make sure your image file exists in the same folder as main.py")
    exit()

print(f"✓ Image loaded from: {image_path}")
print(f"  Image size: {image.shape[1]}x{image.shape[0]} pixels\n")


# ============================================================================
# STEP 3: RUN YOLO INFERENCE (THE MAGIC HAPPENS HERE!)
# ============================================================================
print("Running YOLO inference...")
results = model(image, verbose=False)  # Run detection
# This is where the neural network analyzes the image
# and finds all objects in it
result = results[0]  # Get the result for this one image
print("✓ Inference complete!\n")


# ============================================================================
# STEP 4: FILTER DETECTIONS BY CONFIDENCE THRESHOLD
# ============================================================================
# This is where confidence filtering happens!
# We collect all detections, then only keep ones that pass the threshold

all_detections = []  # Store ALL detections (including low confidence)
filtered_detections = []  # Store only detections >= confidence_threshold

# First pass: Extract ALL detections from YOLO results
for box in result.boxes:
    xyxy = box.xyxy[0].cpu().numpy()
    x1, y1, x2, y2 = xyxy
    confidence = float(box.conf[0].cpu().numpy())
    class_id = int(box.cls[0].cpu().numpy())
    class_name = result.names[class_id]
    
    # Store in all_detections list
    detection = {
        "x1": x1,
        "y1": y1,
        "x2": x2,
        "y2": y2,
        "confidence": confidence,
        "class_id": class_id,
        "class_name": class_name,
    }
    all_detections.append(detection)
    
    # Second filter: Only add to filtered_detections if confidence >= threshold
    # ⭐ THIS IS THE FILTERING LOGIC ⭐
    if confidence >= confidence_threshold:
        filtered_detections.append(detection)

# Summary statistics
print("=" * 80)
print("CONFIDENCE FILTERING RESULTS:")
print("=" * 80)
print(f"Confidence Threshold: {confidence_threshold:.0%}")
print(f"Total detections found by YOLO: {len(all_detections)}")
print(f"Detections after filtering: {len(filtered_detections)}")
print(f"Filtered out (confidence too low): {len(all_detections) - len(filtered_detections)}\n")


# ============================================================================
# STEP 5: APPLY NMS (NON-MAXIMUM SUPPRESSION) - STAGE 4
# ============================================================================
# NMS removes duplicate/overlapping detections of the same object
# ⭐ THIS IS WHERE NMS HAPPENS ⭐

before_nms_count = len(filtered_detections)  # Count before NMS

if enable_nms and len(filtered_detections) > 0:
    nms_detections = apply_nms(filtered_detections, iou_threshold)
else:
    nms_detections = filtered_detections  # Don't apply NMS if disabled

after_nms_count = len(nms_detections)
nms_removed = before_nms_count - after_nms_count

print("=" * 80)
print("NMS (NON-MAXIMUM SUPPRESSION) RESULTS:")
print("=" * 80)
print(f"NMS Enabled: {enable_nms}")
print(f"IoU Threshold: {iou_threshold}")
print(f"Confidence Threshold: {confidence_threshold:.0%}")
print(f"Detections before NMS: {before_nms_count}")
print(f"Detections after NMS: {after_nms_count}")
print(f"Removed (overlapping): {nms_removed}\n")


# ============================================================================
# STEP 6: PRINT FINAL DETECTIONS (AFTER NMS)
# ============================================================================

print("FINAL DETECTIONS (After Confidence Filter + NMS):")
print("=" * 80)

if len(nms_detections) == 0:
    print("No detections passed the filters.\n")
else:
    for i, detection in enumerate(nms_detections, 1):
        x1, y1, x2, y2 = detection["x1"], detection["y1"], detection["x2"], detection["y2"]
        confidence = detection["confidence"]
        class_name = detection["class_name"]
        
        # Print this detection
        print(f"Detection #{i}:")
        print(f"  Class: {class_name}")
        print(f"  Confidence: {confidence:.2%}")  # Convert to percentage
        print(f"  Bounding Box: ({x1:.0f}, {y1:.0f}) to ({x2:.0f}, {y2:.0f})")
        print(f"  → This means the object is at coordinates x:{x1:.0f}-{x2:.0f}, y:{y1:.0f}-{y2:.0f}\n")

print("=" * 80)


# ============================================================================
# STEP 7: DRAW BOXES ON THE IMAGE (ONLY FOR NMS-FILTERED DETECTIONS)
# ============================================================================
# ============================================================================
# STEP 7: DRAW BOXES ON THE IMAGE (ONLY FOR NMS-FILTERED DETECTIONS)
# ============================================================================
annotated_image = image.copy()  # Make a copy so we don't modify original

# ⭐ Draw boxes ONLY for NMS-filtered detections
for detection in nms_detections:
    x1, y1, x2, y2 = int(detection["x1"]), int(detection["y1"]), int(detection["x2"]), int(detection["y2"])
    confidence = detection["confidence"]
    class_name = detection["class_name"]
    
    # Draw the rectangle (green box)
    cv2.rectangle(annotated_image, (x1, y1), (x2, y2), (0, 255, 0), 2)
    
    # Draw the label with class name and confidence
    label = f"{class_name} {confidence:.2%}"
    cv2.putText(
        annotated_image,
        label,
        (x1, max(20, y1 - 10)),  # Position above the box
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,  # Font size
        (0, 255, 0),  # Green color
        2,  # Thickness
    )

# Display the image with boxes
print("Displaying image with bounding boxes...")
print("Press any key in the image window to close it.\n")
cv2.imshow("YOLO Detection Results", annotated_image)
cv2.waitKey(0)  # Wait for key press
cv2.destroyAllWindows()  # Close the window

print("Done!")
