import json

with open("sample_detections.json", "r") as f:
    detections = json.load(f)

stats = {}

for detection in detections:
    waste_type = detection["class"]

    if waste_type not in stats:
        stats[waste_type] = 0

    stats[waste_type] += 1

print("\nWaste Statistics\n")

total = 0

for waste_type, count in stats.items():
    print(f"{waste_type}: {count}")
    total += count

print(f"\nTotal Detections: {total}")