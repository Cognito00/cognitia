"""
Ground-Truth Evaluation Module
===============================

Compares YOLO predictions against human-annotated ground-truth boxes.

Classifies predictions as:
  - TRUE POSITIVE (TP):  Matches GT with same class and IoU >= 0.5
  - FALSE POSITIVE (FP): No matching GT, or class mismatch
  - FALSE NEGATIVE (FN): GT box not matched by any prediction

Reuses IoU calculation from main.py
"""

import cv2
import numpy as np


def match_predictions_to_ground_truth(predictions, ground_truth, iou_fn, iou_threshold=0.5):
    """
    Match predictions to ground-truth boxes and classify as TP/FP/FN.
    
    Args:
        predictions: List of dicts with keys: class_name, confidence, x1, y1, x2, y2
        ground_truth: List of dicts with keys: class_name, x1, y1, x2, y2
        iou_fn: Function to calculate IoU between two boxes
        iou_threshold: Minimum IoU to consider a match (default 0.5)
    
    Returns:
        Dictionary with:
          - results: List of classification results for each prediction
          - tp_count: Number of true positives
          - fp_count: Number of false positives
          - fn_count: Number of false negatives
          - unmatched_gts: List of GT indices that were not matched
    """
    
    results = []  # Results for each prediction
    matched_gt_indices = set()  # Track which GTs have been matched
    
    # ========================================================================
    # STEP 1: Classify each prediction
    # ========================================================================
    for pred_idx, prediction in enumerate(predictions):
        pred_class = prediction["class_name"]
        pred_confidence = prediction["confidence"]
        pred_box = {
            "x1": prediction["x1"],
            "y1": prediction["y1"],
            "x2": prediction["x2"],
            "y2": prediction["y2"],
        }
        
        # Find best matching GT (same class, highest IoU)
        best_iou = -1
        best_gt_idx = -1
        best_gt = None
        
        for gt_idx, gt in enumerate(ground_truth):
            # Skip if GT already matched to another prediction
            if gt_idx in matched_gt_indices:
                continue
            
            # Only match if class is the same
            if gt["class_name"] != pred_class:
                continue
            
            # Calculate IoU
            gt_box = {
                "x1": gt["x1"],
                "y1": gt["y1"],
                "x2": gt["x2"],
                "y2": gt["y2"],
            }
            iou = iou_fn(pred_box, gt_box)
            
            # Track best match
            if iou > best_iou:
                best_iou = iou
                best_gt_idx = gt_idx
                best_gt = gt
        
        # ====================================================================
        # STEP 2: Classify prediction as TP or FP
        # ====================================================================
        if best_iou >= iou_threshold:
            # TRUE POSITIVE: Matched to GT with same class and IoU >= threshold
            classification = "TP"
            matched_gt_indices.add(best_gt_idx)  # Mark GT as matched
        else:
            # FALSE POSITIVE: No good match found
            classification = "FP"
            best_iou = None  # Don't report IoU for FP
        
        # Store result for this prediction
        result = {
            "prediction_idx": pred_idx,
            "class": pred_class,
            "confidence": pred_confidence,
            "iou": best_iou,
            "matched_gt": best_gt,
            "classification": classification,
        }
        results.append(result)
    
    # ========================================================================
    # STEP 3: Find False Negatives (unmatched ground-truth boxes)
    # ========================================================================
    unmatched_gt_indices = []
    for gt_idx in range(len(ground_truth)):
        if gt_idx not in matched_gt_indices:
            unmatched_gt_indices.append(gt_idx)
    
    # ========================================================================
    # STEP 4: Count TP, FP, FN
    # ========================================================================
    tp_count = sum(1 for r in results if r["classification"] == "TP")
    fp_count = sum(1 for r in results if r["classification"] == "FP")
    fn_count = len(unmatched_gt_indices)
    
    return {
        "results": results,
        "tp_count": tp_count,
        "fp_count": fp_count,
        "fn_count": fn_count,
        "unmatched_gts": unmatched_gt_indices,
        "ground_truth": ground_truth,
    }


def print_evaluation_results(evaluation):
    """Print detailed evaluation results for each prediction and summary stats."""
    
    results = evaluation["results"]
    tp_count = evaluation["tp_count"]
    fp_count = evaluation["fp_count"]
    fn_count = evaluation["fn_count"]
    
    print("\n" + "=" * 80)
    print("GROUND-TRUTH EVALUATION RESULTS")
    print("=" * 80)
    
    # ========================================================================
    # Print results for each prediction
    # ========================================================================
    if len(results) == 0:
        print("No predictions to evaluate.\n")
    else:
        print("\nPER-PREDICTION RESULTS:")
        print("-" * 80)
        
        for i, result in enumerate(results, 1):
            pred_class = result["class"]
            confidence = result["confidence"]
            classification = result["classification"]
            iou = result["iou"]
            
            print(f"Prediction #{i}:")
            print(f"  Class: {pred_class}")
            print(f"  Confidence: {confidence:.2%}")
            
            if classification == "TP":
                print(f"  IoU with matched ground-truth: {iou:.4f}")
                matched_gt = result["matched_gt"]
                print(f"  Matched GT: {matched_gt['class_name']} at ({matched_gt['x1']:.0f}, {matched_gt['y1']:.0f}, {matched_gt['x2']:.0f}, {matched_gt['y2']:.0f})")
                print(f"  ✓ Result: TRUE POSITIVE (TP)")
            else:  # FP
                print(f"  ✗ Result: FALSE POSITIVE (FP)")
            
            print()
    
    # ========================================================================
    # Print False Negatives
    # ========================================================================
    if evaluation["unmatched_gts"]:
        print("UNMATCHED GROUND-TRUTH BOXES (FALSE NEGATIVES):")
        print("-" * 80)
        
        for gt_idx in evaluation["unmatched_gts"]:
            gt = evaluation["ground_truth"][gt_idx]
            print(f"False Negative #{gt_idx}:")
            print(f"  Class: {gt['class_name']}")
            print(f"  Box: ({gt['x1']:.0f}, {gt['y1']:.0f}, {gt['x2']:.0f}, {gt['y2']:.0f})")
            print(f"  ✗ YOLO did not detect this object")
            print()
    
    # ========================================================================
    # Print summary statistics
    # ========================================================================
    print("=" * 80)
    print("SUMMARY STATISTICS:")
    print("=" * 80)
    print(f"True Positives (TP):   {tp_count}")
    print(f"False Positives (FP):  {fp_count}")
    print(f"False Negatives (FN):  {fn_count}")
    print(f"Total Predictions:     {len(results)}")
    print(f"Total Ground Truths:   {len(evaluation['ground_truth'])}")
    print("=" * 80)


def visualize_predictions(image_height, image_width, predictions, ground_truth, evaluation):
    """
    Visualize predictions and ground-truth on an image.
    
    Colors:
      - Green box with solid line: TRUE POSITIVE
      - Red box with solid line: FALSE POSITIVE
      - Yellow box with dashed line: FALSE NEGATIVE (ground-truth)
    
    Args:
        image_height: Height of image canvas
        image_width: Width of image canvas
        predictions: List of prediction dicts
        ground_truth: List of ground-truth dicts
        evaluation: Results from match_predictions_to_ground_truth()
    
    Returns:
        Annotated image (numpy array)
    """
    
    # Create blank image (white background)
    image = np.ones((image_height, image_width, 3), dtype=np.uint8) * 255
    
    # ========================================================================
    # Draw PREDICTIONS
    # ========================================================================
    for result in evaluation["results"]:
        pred_idx = result["prediction_idx"]
        prediction = predictions[pred_idx]
        classification = result["classification"]
        
        x1 = int(prediction["x1"])
        y1 = int(prediction["y1"])
        x2 = int(prediction["x2"])
        y2 = int(prediction["y2"])
        
        if classification == "TP":
            # Green for True Positive
            color = (0, 255, 0)  # BGR: Green
            line_style = "solid"
            status = "TP"
        else:  # FP
            # Red for False Positive
            color = (0, 0, 255)  # BGR: Red
            line_style = "solid"
            status = "FP"
        
        # Draw box
        cv2.rectangle(image, (x1, y1), (x2, y2), color, 2)
        
        # Draw label
        confidence = prediction["confidence"]
        label = f"Pred: {prediction['class_name']} {confidence:.2%} [{status}]"
        cv2.putText(
            image,
            label,
            (x1, max(20, y1 - 10)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            color,
            2,
        )
    
    # ========================================================================
    # Draw FALSE NEGATIVES (unmatched ground-truth)
    # ========================================================================
    for gt_idx in evaluation["unmatched_gts"]:
        gt = evaluation["ground_truth"][gt_idx]
        
        x1 = int(gt["x1"])
        y1 = int(gt["y1"])
        x2 = int(gt["x2"])
        y2 = int(gt["y2"])
        
        # Yellow dashed line for False Negative
        color = (0, 255, 255)  # BGR: Yellow
        
        # Draw dashed box (approximate with multiple short lines)
        step = 10
        for i in range(x1, x2, step * 2):
            cv2.line(image, (i, y1), (min(i + step, x2), y1), color, 2)
            cv2.line(image, (i, y2), (min(i + step, x2), y2), color, 2)
        
        for i in range(y1, y2, step * 2):
            cv2.line(image, (x1, i), (x1, min(i + step, y2)), color, 2)
            cv2.line(image, (x2, i), (x2, min(i + step, y2)), color, 2)
        
        # Draw label for FN
        label = f"GT: {gt['class_name']} [FN-MISSED]"
        cv2.putText(
            image,
            label,
            (x1, max(20, y1 - 30)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            color,
            2,
        )
    
    # ========================================================================
    # Add legend
    # ========================================================================
    legend_y = 30
    legend_x = 10
    
    cv2.putText(image, "Legend:", (legend_x, legend_y), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 2)
    
    cv2.rectangle(image, (legend_x, legend_y + 10), (legend_x + 20, legend_y + 30), (0, 255, 0), 2)
    cv2.putText(image, "= TP (Correct)", (legend_x + 30, legend_y + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
    
    cv2.rectangle(image, (legend_x, legend_y + 40), (legend_x + 20, legend_y + 60), (0, 0, 255), 2)
    cv2.putText(image, "= FP (Wrong/Extra)", (legend_x + 30, legend_y + 55), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
    
    # Dashed line for FN (simplified)
    cv2.line(image, (legend_x, legend_y + 80), (legend_x + 20, legend_y + 80), (0, 255, 255), 2)
    cv2.putText(image, "= FN (Missed)", (legend_x + 30, legend_y + 85), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
    
    return image
