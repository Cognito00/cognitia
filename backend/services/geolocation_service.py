import json


def get_detection_location(metadata_file_path, x1, x2):

    with open(metadata_file_path, "r") as file:
        metadata = json.load(file)

    center_x = int((x1 + x2) / 2)

    nav_data = metadata["nav_per_column"]

    if center_x < 0 or center_x >= len(nav_data):
        raise ValueError("Detection bounding box is outside image width")

    location = nav_data[center_x]

    return {
        "latitude": location["lat"],
        "longitude": location["lon"],
        "depth_m": location["depth_m"],
        "time_ms": location["time_ms"]
    }