def calculate_iou(box1, box2):
    x1 = max(box1["bbox"]["x1"], box2["bbox"]["x1"])
    y1 = max(box1["bbox"]["y1"], box2["bbox"]["y1"])
    x2 = min(box1["bbox"]["x2"], box2["bbox"]["x2"])
    y2 = min(box1["bbox"]["y2"], box2["bbox"]["y2"])

    if x2 <= x1 or y2 <= y1:
        return 0.0

    intersection = (x2 - x1) * (y2 - y1)

    area1 = (
        (box1["bbox"]["x2"] - box1["bbox"]["x1"])
        * (box1["bbox"]["y2"] - box1["bbox"]["y1"])
    )

    area2 = (
        (box2["bbox"]["x2"] - box2["bbox"]["x1"])
        * (box2["bbox"]["y2"] - box2["bbox"]["y1"])
    )

    union = area1 + area2 - intersection

    if union <= 0:
        return 0.0

    return intersection / union


def filter_detections(
    detections,
    confidence_threshold=0.20,
    iou_threshold=0.50
):
    # Stage 1: confidence filtering
    confidence_filtered = [
        detection
        for detection in detections
        if detection["confidence"] >= confidence_threshold
    ]

    # Highest-confidence detections first
    confidence_filtered.sort(
        key=lambda x: x["confidence"],
        reverse=True
    )

    # Stage 2: Non-Maximum Suppression
    final_detections = []

    for current in confidence_filtered:
        keep = True

        for accepted in final_detections:
            # Only suppress overlapping boxes of the same class
            if current["class_id"] != accepted["class_id"]:
                continue

            if calculate_iou(current, accepted) >= iou_threshold:
                keep = False
                break

        if keep:
            final_detections.append(current)

    return final_detections