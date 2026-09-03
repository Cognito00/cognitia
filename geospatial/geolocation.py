def map_detection_to_location(detection, metadata_row):
    return {
        "class": detection["class"],
        "confidence": detection["confidence"],
        "latitude": metadata_row["latitude"],
        "longitude": metadata_row["longitude"],
        "depth_m": metadata_row["depth_m"]
    }
