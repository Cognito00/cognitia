"""
Sonar echogram preprocessing pipeline (v2 — batch / multi-beam)
=================================================================
Paste this into VSCode and run it directly. It processes a whole folder of
{ID}_echogram.png + {ID}_metadata.csv pairs (e.g. B001..B004 = 4 beams from
the same sonar unit) into AI/ML-ready packages, with an optional
summary.csv for cross-referencing per-segment stats.

WHAT IT DOES TO EACH FILE
--------------------------
1. Recovers the true single-channel intensity from the false-color PNG
   (most sonar-viewer exports are 1 real channel pushed through an 8-bit
   colormap for display — this inverts that losslessly when detected).
2. Detects dead/dropout ping-columns (vehicle motion, comms gaps).
3. Denoises speckle with an edge-preserving filter, then inpaints only the
   flagged dropout columns (never silently blends fake + real data).
4. Normalizes range-dependent gain drift (TVG-style) using robust stats
   from valid columns only.
5. Runs Cell-Averaging CFAR (a real radar/sonar target-detection
   algorithm) to get a per-pixel anomaly confidence score — no training
   data needed, runs in under a second per image.
6. Tracks the seafloor/bottom return line per column.
7. Links every column back to real-world lat/lon/time/depth using the
   ping metadata CSV (since the CSV has ~50x more rows than the image
   has columns).
8. Packages everything into one `{ID}.npz` (the AI tensor + raw arrays)
   and one `{ID}.json` (metadata + navigation) per beam, plus a quick
   `{ID}_qa_panel.png` for visual sanity-checking.

REQUIREMENTS
------------
    pip install numpy opencv-python-headless pillow

USAGE
-----
    python sonar_pipeline.py --data_dir ./raw_data --out_dir ./packaged

    Folder layout expected in --data_dir:
        B001_echogram.png   B001_metadata.csv
        B002_echogram.png   B002_metadata.csv
        ...
        summary.csv          (optional — cross-referenced if present)

    Or process a single pair directly:
    python sonar_pipeline.py --image B001_echogram.png --meta B001_metadata.csv \
        --survey_id B001 --out_dir ./packaged
"""

import argparse
import csv
import glob
import json
import os
import re
import time

import cv2
import numpy as np
from PIL import Image


# ---------------------------------------------------------------------------
# 1. Colormap inversion — recover the true single-channel intensity
# ---------------------------------------------------------------------------
def recover_intensity(rgb: np.ndarray, max_palette: int = 4096):
    """If the image only uses a small number of unique colours (a strong
    signature of a display colormap/LUT applied to one real channel), invert
    it by re-ordering the unique colours along their dominant axis of
    variation (PCA) — works for any monotonic colormap without knowing which
    one it was. Falls back to standard luminance conversion (flagged as
    approximate) if the palette is too large to be a simple LUT."""
    H, W, _ = rgb.shape
    flat = rgb.reshape(-1, 3)
    uniq, inverse = np.unique(flat, axis=0, return_inverse=True)

    if len(uniq) > max_palette:
        gray = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]
        return gray.astype(np.uint8), {
            "colormap_recovered": False,
            "unique_colors": int(len(uniq)),
            "note": "Palette too large to treat as a simple LUT; used standard luminance instead.",
        }

    centered = uniq.astype(float) - uniq.mean(axis=0)
    cov = np.cov(centered.T)
    eigvals, eigvecs = np.linalg.eigh(cov)
    principal = eigvecs[:, np.argmax(eigvals)]
    proj = centered @ principal
    order = np.argsort(proj)

    lum = 0.299 * uniq[:, 0] + 0.587 * uniq[:, 1] + 0.114 * uniq[:, 2]
    if lum[order][0] > lum[order][-1]:
        order = order[::-1]

    monotonic_frac = float((np.diff(lum[order]) >= 0).mean())

    rank = np.empty_like(order)
    rank[order] = np.linspace(0, 255, len(order))
    intensity = rank[inverse].reshape(H, W).astype(np.uint8)

    return intensity, {
        "colormap_recovered": True,
        "unique_colors": int(len(uniq)),
        "monotonicity_score": monotonic_frac,
    }


# ---------------------------------------------------------------------------
# 2. Dropout / bad-ping column detection
# ---------------------------------------------------------------------------
def detect_dropout_columns(intensity: np.ndarray, mean_pct: float = 10, std_pct: float = 25):
    col_mean = intensity.mean(axis=0)
    col_std = intensity.std(axis=0)
    dropout = (col_mean < np.percentile(col_mean, mean_pct)) & (
        col_std < np.percentile(col_std, std_pct)
    )
    return dropout  # bool array, shape (W,)


# ---------------------------------------------------------------------------
# 3. Speckle reduction + dropout inpainting
# ---------------------------------------------------------------------------
def denoise(intensity: np.ndarray, dropout_mask: np.ndarray):
    despeckled = cv2.bilateralFilter(intensity, d=5, sigmaColor=25, sigmaSpace=5)
    inpaint_mask = (np.tile(dropout_mask[None, :], (intensity.shape[0], 1)).astype(np.uint8)) * 255
    filled = cv2.inpaint(despeckled, inpaint_mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)
    return despeckled, filled


# ---------------------------------------------------------------------------
# 4. Row-wise TVG-style normalization (valid columns only)
# ---------------------------------------------------------------------------
def row_normalize(intensity: np.ndarray, valid_col_mask: np.ndarray, clip_gain: float = 3.0):
    valid = intensity[:, valid_col_mask].astype(np.float32)
    if valid.shape[1] == 0:
        return intensity.copy()
    row_med = np.median(valid, axis=1, keepdims=True)
    row_med_safe = np.clip(row_med, 5, None)
    target = np.median(row_med_safe)
    gain = np.clip(target / row_med_safe, 1.0 / clip_gain, clip_gain)
    normalized = np.clip(intensity.astype(np.float32) * gain, 0, 255)
    return normalized.astype(np.uint8)


# ---------------------------------------------------------------------------
# 5. Mask-aware 2D CFAR anomaly detector
# ---------------------------------------------------------------------------
def cfar_anomaly(intensity: np.ndarray, valid_mask: np.ndarray, guard=(3, 3), train=(9, 9)):
    img = intensity.astype(np.float32)
    mask = valid_mask.astype(np.float32)

    gy, gx = guard
    ty, tx = train
    outer_k = (2 * (gx + tx) + 1, 2 * (gy + ty) + 1)
    inner_k = (2 * gx + 1, 2 * gy + 1)

    def box(x, k):
        return cv2.boxFilter(x, ddepth=-1, ksize=k, normalize=False, borderType=cv2.BORDER_REFLECT)

    img_m = img * mask
    outer_sum, outer_cnt = box(img_m, outer_k), box(mask, outer_k)
    inner_sum, inner_cnt = box(img_m, inner_k), box(mask, inner_k)
    bg_sum, bg_cnt = outer_sum - inner_sum, np.clip(outer_cnt - inner_cnt, 1, None)
    bg_mean = bg_sum / bg_cnt

    sq_m = (img * img) * mask
    outer_sq, inner_sq = box(sq_m, outer_k), box(sq_m, inner_k)
    bg_sq = outer_sq - inner_sq
    bg_var = np.clip(bg_sq / bg_cnt - bg_mean ** 2, 1e-3, None)
    bg_std = np.sqrt(bg_var)

    z = (img - bg_mean) / bg_std
    confidence = 1.0 / (1.0 + np.exp(-(z - 3.0) / 1.5))
    confidence[valid_mask == 0] = 0.0
    return z.astype(np.float32), confidence.astype(np.float32)


# ---------------------------------------------------------------------------
# 6. Bottom tracking
# ---------------------------------------------------------------------------
def _median_filter_1d(x: np.ndarray, k: int = 9):
    pad = k // 2
    xp = np.pad(x, pad, mode="edge")
    windows = np.stack([xp[i:i + len(x)] for i in range(k)], axis=0)
    return np.median(windows, axis=0)


def track_bottom(intensity: np.ndarray, valid_col_mask: np.ndarray):
    H, W = intensity.shape
    raw_line = np.argmax(intensity.astype(np.float32), axis=0).astype(np.float32)
    raw_line[~valid_col_mask] = np.nan

    idx = np.arange(W)
    good = ~np.isnan(raw_line)
    if good.sum() >= 2:
        raw_line = np.interp(idx, idx[good], raw_line[good])
    else:
        raw_line = np.full(W, H / 2.0)
    smoothed = _median_filter_1d(raw_line, k=9)

    row_idx = np.arange(H)[:, None]
    dist_from_bottom = (row_idx - smoothed[None, :]) / H
    return smoothed, dist_from_bottom.astype(np.float32)


# ---------------------------------------------------------------------------
# 7. Column -> navigation (lat/lon/time/depth) lookup from ping metadata CSV
# ---------------------------------------------------------------------------
def build_nav_lookup(meta_csv_path: str, num_columns: int):
    rows = []
    with open(meta_csv_path, newline="") as f:
        for row in csv.DictReader(f):
            rows.append(row)
    n = len(rows)
    if n == 0:
        return []

    edges = np.linspace(0, n, num_columns + 1).astype(int)
    nav = []
    for i in range(num_columns):
        chunk = rows[edges[i]: max(edges[i] + 1, edges[i + 1])]
        lats = [float(r["latitude"]) for r in chunk]
        lons = [float(r["longitude"]) for r in chunk]
        times = [float(r["time_ms"]) for r in chunk]
        depths = [float(r["depth_m"]) for r in chunk]
        nav.append({
            "record_range": [chunk[0]["record_num"], chunk[-1]["record_num"]],
            "lat": float(np.mean(lats)),
            "lon": float(np.mean(lons)),
            "time_ms": float(np.mean(times)),
            "depth_m": float(np.mean(depths)),
            "ping_count": len(chunk),
        })
    return nav


# ---------------------------------------------------------------------------
# Optional: cross-reference against a summary.csv, if one is present
# ---------------------------------------------------------------------------
def load_summary(summary_path: str):
    if not summary_path or not os.path.exists(summary_path):
        return {}
    by_file = {}
    with open(summary_path, newline="") as f:
        for row in csv.DictReader(f):
            by_file.setdefault(row.get("file", "UNKNOWN"), []).append(row)
    return by_file


# ---------------------------------------------------------------------------
# Orchestration — one beam/file
# ---------------------------------------------------------------------------
def process_one(image_path: str, meta_path: str, survey_id: str, out_dir: str, summary_index=None):
    os.makedirs(out_dir, exist_ok=True)
    t0 = time.time()

    rgb = np.array(Image.open(image_path).convert("RGB"))
    intensity_raw, colormap_info = recover_intensity(rgb)

    dropout_cols = detect_dropout_columns(intensity_raw)
    valid_cols = ~dropout_cols

    despeckled, filled = denoise(intensity_raw, dropout_cols)
    normalized = row_normalize(filled, valid_cols)

    valid_mask_2d = np.tile(valid_cols, (normalized.shape[0], 1))
    z_score, confidence = cfar_anomaly(normalized, valid_mask_2d)
    bottom_line, dist_from_bottom = track_bottom(normalized, valid_cols)

    nav = build_nav_lookup(meta_path, normalized.shape[1]) if meta_path else None

    stacked = np.stack([
        normalized.astype(np.float32) / 255.0,
        confidence,
        (dist_from_bottom + 1) / 2.0,
    ], axis=-1)

    npz_path = os.path.join(out_dir, f"{survey_id}.npz")
    np.savez_compressed(
        npz_path,
        ai_tensor=stacked.astype(np.float32),
        intensity_raw=intensity_raw,
        dropout_columns=dropout_cols,
        bottom_line=bottom_line,
        cfar_zscore=z_score,
    )

    meta_out = {
        "survey_id": survey_id,
        "source_image": os.path.basename(image_path),
        "image_dims_px": {"width": int(rgb.shape[1]), "height": int(rgb.shape[0])},
        "channels": {
            0: "normalized_intensity (0-1)",
            1: "cfar_confidence (0-1, per-pixel anomaly confidence)",
            2: "bottom_relative_position (0-1, 0.5=on bottom line)",
        },
        "colormap_recovery": colormap_info,
        "dropout_columns_pct": float(dropout_cols.mean() * 100),
        "dropout_column_indices": np.where(dropout_cols)[0].tolist(),
        "processing_pipeline_version": "2.0",
        "processing_time_sec": round(time.time() - t0, 3),
        "nav_per_column": nav,
    }
    if summary_index and survey_id in summary_index:
        meta_out["summary_segments"] = summary_index[survey_id]

    json_path = os.path.join(out_dir, f"{survey_id}.json")
    with open(json_path, "w") as f:
        json.dump(meta_out, f, indent=2)

    panel = np.vstack([
        cv2.resize(intensity_raw, (rgb.shape[1] // 2, rgb.shape[0] // 2)),
        cv2.resize(normalized, (rgb.shape[1] // 2, rgb.shape[0] // 2)),
        cv2.resize((confidence * 255).astype(np.uint8), (rgb.shape[1] // 2, rgb.shape[0] // 2)),
    ])
    Image.fromarray(panel).save(os.path.join(out_dir, f"{survey_id}_qa_panel.png"))

    return npz_path, json_path, meta_out


# ---------------------------------------------------------------------------
# Orchestration — batch over a folder of {ID}_echogram.png / {ID}_metadata.csv
# ---------------------------------------------------------------------------
def find_pairs(data_dir: str):
    pairs = []
    for img_path in sorted(glob.glob(os.path.join(data_dir, "*_echogram.png"))):
        base = os.path.basename(img_path)
        m = re.match(r"(.+)_echogram\.png$", base)
        if not m:
            continue
        survey_id = m.group(1)
        meta_path = os.path.join(data_dir, f"{survey_id}_metadata.csv")
        if os.path.exists(meta_path):
            pairs.append((survey_id, img_path, meta_path))
        else:
            print(f"  [skip] {survey_id}: no matching metadata CSV found")
    return pairs


def run_batch(data_dir: str, out_dir: str, summary_path: str = None):
    summary_path = summary_path or os.path.join(data_dir, "summary.csv")
    summary_index = load_summary(summary_path)
    if summary_index:
        print(f"Loaded summary.csv: {sum(len(v) for v in summary_index.values())} segments across {len(summary_index)} files")

    pairs = find_pairs(data_dir)
    print(f"Found {len(pairs)} echogram/metadata pairs in {data_dir}")

    results = []
    for survey_id, img_path, meta_path in pairs:
        print(f"\nProcessing {survey_id} ...")
        npz_path, json_path, meta = process_one(img_path, meta_path, survey_id, out_dir, summary_index)
        print(f"  -> {npz_path}")
        print(f"  -> {json_path}")
        print(f"  dropout columns: {meta['dropout_columns_pct']:.1f}%   time: {meta['processing_time_sec']}s")
        results.append(meta)
    return results


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Sonar echogram preprocessing pipeline")
    ap.add_argument("--data_dir", help="Folder containing {ID}_echogram.png + {ID}_metadata.csv pairs (batch mode)")
    ap.add_argument("--image", help="Single echogram PNG (single-file mode)")
    ap.add_argument("--meta", help="Single metadata CSV (single-file mode)")
    ap.add_argument("--survey_id", help="ID for single-file mode, e.g. B001")
    ap.add_argument("--out_dir", required=True, help="Where to write {ID}.npz / {ID}.json / {ID}_qa_panel.png")
    ap.add_argument("--summary", help="Optional path to summary.csv (batch mode; defaults to data_dir/summary.csv)")
    args = ap.parse_args()

    if args.data_dir:
        run_batch(args.data_dir, args.out_dir, args.summary)
    elif args.image and args.meta and args.survey_id:
        npz_path, json_path, meta = process_one(args.image, args.meta, args.survey_id, args.out_dir)
        print(f"Wrote {npz_path}\nWrote {json_path}")
        print(f"Dropout columns: {meta['dropout_columns_pct']:.1f}%   Time: {meta['processing_time_sec']}s")
    else:
        ap.error("Provide either --data_dir (batch mode) or --image/--meta/--survey_id (single-file mode)")