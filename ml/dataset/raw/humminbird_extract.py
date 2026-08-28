#!/usr/bin/env python3
"""
humminbird_extract.py
----------------------
Batch-decode Humminbird (R) sonar recordings (.SON + .IDX file pairs) into:
  1. A per-ping metadata CSV (position/lat-lon, heading, speed, depth, frequency, etc.)
  2. A rendered echogram/sonar image (PNG) for each .SON file
  3. A combined summary CSV across all processed files (one row per file)

Works on Down Scan, Side Scan (port/starboard), and MEGA channels alike, and
auto-detects the ping header length, so it should handle recordings from
different Humminbird models (9xx, 11xx, HELIX, SOLIX, ONIX, MEGA, etc.)
without needing to know which model made the file.

USAGE
-----
    pip install numpy pillow matplotlib

    python3 humminbird_extract.py --input_dir /path/to/sd_card_folder --output_dir /path/to/output

    # Only metadata / geolocation, skip generating images (much faster):
    python3 humminbird_extract.py --input_dir ./sonar_logs --output_dir ./out --no-images

    # Use 4 CPU cores in parallel:
    python3 humminbird_extract.py --input_dir ./sonar_logs --output_dir ./out --workers 4

The script recursively finds every *.SON file under --input_dir (it does not
require the matching .IDX file -- it decodes the .SON file directly -- but if
an .IDX file with the same base name exists alongside it, that's fine, it's
simply not needed).

Output layout:
    output_dir/
        <name>_metadata.csv        (one row per ping: position, time, depth, etc.)
        <name>_echogram.png        (rendered waterfall image, unless --no-images)
        summary.csv                 (one row per input file: bounding box, duration, etc.)
"""

import argparse
import csv
import json
import math
import mmap
import os
import struct
import sys
import traceback
from concurrent.futures import ProcessPoolExecutor, as_completed

MAGIC = b"\xc0\xde\xab\x21"

# Earth radius constant Humminbird uses for its spherical-Mercator position encoding.
HUM_MERC_R = 6356752.3142

# Known single-byte tags -> how to decode the value that follows them.
# 'w' = width in bytes, 't' = struct type code, 'fields' = names to split value into
# (some tags pack two sub-values, e.g. quality flag + heading).
TAG_SPEC = {
    0x80: {"w": 4, "fmt": ">I", "fields": ["record_num"]},
    0x81: {"w": 4, "fmt": ">I", "fields": ["time_ms"]},
    0x82: {"w": 4, "fmt": ">i", "fields": ["utm_x"]},
    0x83: {"w": 4, "fmt": ">i", "fields": ["utm_y"]},
    0x84: {"w": 4, "fmt": ">HH", "fields": ["heading_quality", "heading_raw"]},
    0x85: {"w": 4, "fmt": ">HH", "fields": ["speed_quality", "speed_raw"]},
    0x86: {"w": 4, "fmt": ">I", "fields": ["unknown_86"]},
    0x87: {"w": 4, "fmt": ">I", "fields": ["depth_cm"]},
    0x50: {"w": 1, "fmt": ">B", "fields": ["beam_id"]},
    0x51: {"w": 1, "fmt": ">B", "fields": ["voltage_scale_raw"]},
    0x92: {"w": 4, "fmt": ">I", "fields": ["frequency_hz"]},
}

CSV_COLUMNS = [
    "record_num", "time_ms", "utm_x", "utm_y", "longitude", "latitude",
    "heading_deg", "speed_mps", "depth_m", "beam_id", "voltage_v",
    "frequency_hz", "num_samples",
]


def merc_to_lonlat(x, y):
    lon = x / HUM_MERC_R * (180.0 / math.pi)
    lat = (2 * math.atan(math.exp(y / HUM_MERC_R)) - math.pi / 2) * (180.0 / math.pi)
    return lon, lat


def find_header_end(buf, pos, n, search_min=48, search_max=200):
    """
    Locate the 'A0 <4-byte return count> 21' sequence that terminates a ping
    header, without assuming a fixed header length (handles 67 / 72 / 152+
    byte headers used by different Humminbird models).
    Returns (header_end_index_of_the_0x21_byte, return_count) or (None, None).
    """
    start = pos + search_min
    end = min(pos + search_max, n - 5)
    for i in range(start, end):
        if buf[i] == 0xA0:
            val = struct.unpack_from(">I", buf, i + 1)[0]
            if buf[i + 5] == 0x21 and 0 < val < 5_000_000:
                return i + 5, val
    return None, None


def _read_field(buf, pos, tag_idx, fmt, expect_tag):
    """Read one tag+value field at an absolute offset, verifying the tag byte
    matches what's expected (guards against mis-detected header lengths)."""
    if buf[pos + tag_idx] != expect_tag:
        return None
    return struct.unpack_from(fmt, buf, pos + tag_idx + 1)


def parse_ping_header(buf, pos, header_end):
    """
    Decode the known ping-header fields using fixed relative offsets.

    The first six fields (record #, elapsed time, UTM X/Y, heading, speed)
    sit at the SAME relative offset in every known Humminbird model. Only
    the fields from 'depth' onward shift position depending on the model,
    so those are read from one of three offset templates chosen by the
    overall header length (safer than scanning byte-by-byte through
    "unknown" regions, which can misfire if unrelated data happens to
    match a known tag byte).
    """
    fields = {}
    header_len = header_end - pos + 1

    # --- fields common to every known model ---
    common = [
        ("record_num", 4, ">I", 0x80),
        ("time_ms", 9, ">I", 0x81),
        ("utm_x", 14, ">i", 0x82),
        ("utm_y", 19, ">i", 0x83),
    ]
    for name, tag_idx, fmt, tag in common:
        if pos + tag_idx + 1 + struct.calcsize(fmt) <= header_end:
            val = _read_field(buf, pos, tag_idx, fmt, tag)
            if val is not None:
                fields[name] = val[0]

    if pos + 24 + 5 <= header_end and buf[pos + 24] == 0x84:
        hq, hd = struct.unpack_from(">HH", buf, pos + 25)
        fields["heading_quality"], fields["heading_raw"] = hq, hd
    if pos + 29 + 5 <= header_end and buf[pos + 29] == 0x85:
        sq, sp = struct.unpack_from(">HH", buf, pos + 30)
        fields["speed_quality"], fields["speed_raw"] = sq, sp

    # --- fields that shift position depending on the model ---
    def try_layout(depth_tag_idx, has_86, beam_idx, volt_idx, freq_idx):
        if has_86 and pos + depth_tag_idx - 5 >= 0 and pos + depth_tag_idx - 5 < header_end:
            if buf[pos + depth_tag_idx - 5] == 0x86:
                fields["unknown_86"] = struct.unpack_from(">I", buf, pos + depth_tag_idx - 4)[0]
        if pos + depth_tag_idx + 5 <= header_end and buf[pos + depth_tag_idx] == 0x87:
            fields["depth_cm"] = struct.unpack_from(">I", buf, pos + depth_tag_idx + 1)[0]
        if pos + beam_idx + 2 <= header_end and buf[pos + beam_idx] == 0x50:
            fields["beam_id"] = buf[pos + beam_idx + 1]
        if pos + volt_idx + 2 <= header_end and buf[pos + volt_idx] == 0x51:
            fields["voltage_scale_raw"] = buf[pos + volt_idx + 1]
        if pos + freq_idx + 5 <= header_end and buf[pos + freq_idx] == 0x92:
            fields["frequency_hz"] = struct.unpack_from(">I", buf, pos + freq_idx + 1)[0]

    if header_len <= 68:
        # 9xx family: no tag 0x86, depth directly after speed
        try_layout(depth_tag_idx=34, has_86=False, beam_idx=39, volt_idx=41, freq_idx=43)
    elif header_len <= 100:
        # 11xx / HELIX / ONIX family (verified against real sample data)
        try_layout(depth_tag_idx=39, has_86=True, beam_idx=44, volt_idx=46, freq_idx=48)
    else:
        # SOLIX family (larger header, per documented offsets; best-effort)
        try_layout(depth_tag_idx=39, has_86=True, beam_idx=84, volt_idx=86, freq_idx=88)

    return fields


def parse_son_file(son_path):
    """Yields (metadata_dict, sonar_return_bytes) for every ping in the file."""
    with open(son_path, "rb") as f:
        mm = mmap.mmap(f.fileno(), 0, access=mmap.ACCESS_READ)
        n = len(mm)
        pos = 0
        resync_events = 0
        while pos + 8 <= n:
            if mm[pos:pos + 4] != MAGIC:
                nxt = mm.find(MAGIC, pos + 1, pos + 5000)
                if nxt == -1:
                    break
                pos = nxt
                resync_events += 1
                continue

            header_end, ret_count = find_header_end(mm, pos, n)
            if header_end is None:
                nxt = mm.find(MAGIC, pos + 1, pos + 5000)
                if nxt == -1:
                    break
                pos = nxt
                resync_events += 1
                continue

            fields = parse_ping_header(mm, pos, header_end)
            data_start = header_end + 1
            data_end = data_start + ret_count
            if data_end > n:
                break

            fields["num_samples"] = ret_count
            sonar_bytes = bytes(mm[data_start:data_end])
            yield fields, sonar_bytes

            pos = data_end
        mm.close()
    if resync_events:
        print(f"  [note] {os.path.basename(son_path)}: {resync_events} resync event(s) "
              f"(minor gaps/corruption, safely skipped)", file=sys.stderr)


def process_file(son_path, output_dir, make_image=True, img_width=600, img_height=2000):
    import numpy as np  # imported here so --workers subprocesses each import independently

    base = os.path.splitext(os.path.basename(son_path))[0]
    csv_path = os.path.join(output_dir, f"{base}_metadata.csv")

    rows = []
    returns = [] if make_image else None

    for fields, sonar_bytes in parse_son_file(son_path):
        utm_x = fields.get("utm_x", 0)
        utm_y = fields.get("utm_y", 0)
        lon, lat = merc_to_lonlat(utm_x, utm_y)
        heading = fields.get("heading_raw", 0) / 10.0
        speed = fields.get("speed_raw", 0) / 100.0
        depth = fields.get("depth_cm", 0) / 100.0
        volt = fields.get("voltage_scale_raw", 0) / 10.0

        rows.append([
            fields.get("record_num", ""), fields.get("time_ms", ""),
            utm_x, utm_y, lon, lat, heading, speed, depth,
            fields.get("beam_id", ""), volt, fields.get("frequency_hz", ""),
            fields.get("num_samples", 0),
        ])
        if make_image:
            returns.append(sonar_bytes)

    if not rows:
        return {"file": base, "status": "no pings found / could not parse"}

    with open(csv_path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(CSV_COLUMNS)
        w.writerows(rows)

    # ---- summary stats ----
    import numpy as np
    arr = np.array(rows, dtype=object)
    time_ms = np.array([r[1] for r in rows], dtype=float)
    lon_arr = np.array([r[4] for r in rows], dtype=float)
    lat_arr = np.array([r[5] for r in rows], dtype=float)
    depth_arr = np.array([r[8] for r in rows], dtype=float)
    freq_arr = np.array([r[11] for r in rows if r[11] != ""], dtype=float)

    duration_s = (time_ms[-1] - time_ms[0]) / 1000.0 if len(time_ms) > 1 else 0.0
    dominant_freq = int(np.median(freq_arr)) if len(freq_arr) else None

    channel_map = {
        200000: "Down Scan High (200kHz)",
        83000: "Down Scan Low (83kHz)",
        50000: "Down Scan Low (50kHz)",
        455000: "Side/Down Scan (455kHz)",
        800000: "Side Scan (800kHz)",
        1200000: "Side/MEGA Scan (1.2MHz)",
    }
    channel_guess = channel_map.get(dominant_freq, f"{dominant_freq} Hz" if dominant_freq else "unknown")

    summary = {
        "file": base,
        "num_pings": len(rows),
        "duration_min": round(duration_s / 60.0, 2),
        "lat_min": round(float(lat_arr.min()), 6),
        "lat_max": round(float(lat_arr.max()), 6),
        "lon_min": round(float(lon_arr.min()), 6),
        "lon_max": round(float(lon_arr.max()), 6),
        "depth_min_m": round(float(depth_arr.min()), 2),
        "depth_max_m": round(float(depth_arr.max()), 2),
        "dominant_frequency_hz": dominant_freq,
        "likely_channel": channel_guess,
        "status": "ok",
    }

    if make_image and returns:
        try:
            from PIL import Image
            import matplotlib
            import matplotlib.cm as cm

            n_pings = len(returns)
            mat = np.zeros((n_pings, img_width), dtype=np.uint8)
            xp_t = np.linspace(0, 1, img_width)
            for i, b in enumerate(returns):
                a = np.frombuffer(b, dtype=np.uint8)
                if len(a) == 0:
                    continue
                xp = np.linspace(0, 1, len(a))
                mat[i] = np.interp(xp_t, xp, a).astype(np.uint8)

            if n_pings > img_height:
                factor = int(np.ceil(n_pings / img_height))
                pad = (-n_pings) % factor
                if pad:
                    mat = np.vstack([mat, np.zeros((pad, img_width), dtype=np.uint8)])
                mat = mat.reshape(-1, factor, img_width).mean(axis=1).astype(np.uint8)

            land = np.flipud(mat.T)  # time left->right, range top(near)->bottom(far)
            norm = land.astype(np.float32) / 255.0
            try:
                cmap = matplotlib.colormaps["bone"]
            except AttributeError:
                cmap = cm.get_cmap("bone")
            colored = (cmap(norm)[:, :, :3] * 255).astype(np.uint8)
            img_path = os.path.join(output_dir, f"{base}_echogram.png")
            Image.fromarray(colored).save(img_path)
            summary["echogram"] = os.path.basename(img_path)
        except Exception as e:
            summary["image_error"] = str(e)

    return summary


def main():
    ap = argparse.ArgumentParser(description="Batch-decode Humminbird SON/IDX sonar files.")
    ap.add_argument("--input_dir", required=True, help="Folder to search recursively for .SON files")
    ap.add_argument("--output_dir", required=True, help="Folder to write CSVs/images into")
    ap.add_argument("--no-images", action="store_true", help="Skip generating echogram PNGs (faster)")
    ap.add_argument("--width", type=int, default=600, help="Echogram image width in pixels (range axis)")
    ap.add_argument("--height", type=int, default=2000, help="Echogram image max height in pixels (time axis)")
    ap.add_argument("--workers", type=int, default=1, help="Number of files to process in parallel")
    args = ap.parse_args()

    os.makedirs(args.output_dir, exist_ok=True)

    son_files = []
    for root, _, files in os.walk(args.input_dir):
        for fn in files:
            if fn.lower().endswith(".son"):
                son_files.append(os.path.join(root, fn))
    son_files.sort()

    if not son_files:
        print(f"No .SON files found under {args.input_dir}")
        sys.exit(1)

    print(f"Found {len(son_files)} .SON file(s). Processing...")

    make_image = not args.no_images
    summaries = []

    if args.workers > 1:
        with ProcessPoolExecutor(max_workers=args.workers) as ex:
            futures = {
                ex.submit(process_file, sp, args.output_dir, make_image, args.width, args.height): sp
                for sp in son_files
            }
            for fut in as_completed(futures):
                sp = futures[fut]
                try:
                    result = fut.result()
                    print(f"  done: {os.path.basename(sp)} -> {result.get('status')}")
                    summaries.append(result)
                except Exception:
                    print(f"  FAILED: {sp}\n{traceback.format_exc()}")
                    summaries.append({"file": os.path.basename(sp), "status": "error"})
    else:
        for sp in son_files:
            try:
                result = process_file(sp, args.output_dir, make_image, args.width, args.height)
                print(f"  done: {os.path.basename(sp)} -> {result.get('status')}")
                summaries.append(result)
            except Exception:
                print(f"  FAILED: {sp}\n{traceback.format_exc()}")
                summaries.append({"file": os.path.basename(sp), "status": "error"})

    # Write combined summary.csv
    summary_path = os.path.join(args.output_dir, "summary.csv")
    all_keys = []
    for s in summaries:
        for k in s.keys():
            if k not in all_keys:
                all_keys.append(k)
    with open(summary_path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=all_keys)
        w.writeheader()
        w.writerows(summaries)

    print(f"\nDone. Wrote per-file CSVs/images and {summary_path}")


if __name__ == "__main__":
    main()
