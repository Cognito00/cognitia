def map_detection_to_location(metadata):
    """
    Convert sonar metadata into GPS coordinates.
    """

    latitude = metadata.get("latitude")
    longitude = metadata.get("longitude")

    return {
        "latitude": latitude,
        "longitude": longitude,
        "gps_confidence": 0.95
    }
