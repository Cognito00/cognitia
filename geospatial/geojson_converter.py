import json

# Read detections
with open("sample_detections.json", "r") as f:
    detections = json.load(f)

features = []

for detection in detections:
    feature = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [
                detection["longitude"],
                detection["latitude"]
            ]
        },
        "properties": {
            "class": detection["class"],
            "confidence": detection["confidence"]
        }
    }

    features.append(feature)

geojson = {
    "type": "FeatureCollection",
    "features": features
}

with open("detections.geojson", "w") as f:
    json.dump(geojson, f, indent=2)

print("GeoJSON file created successfully!")
