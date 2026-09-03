CREATE TABLE sonar_images (
    id TEXT PRIMARY KEY,
    original_filename TEXT,
    processed_png_path TEXT,
    metadata_json_path TEXT,
    npz_path TEXT,
    image_width INTEGER,
    image_height INTEGER,
    status TEXT DEFAULT 'uploaded',
    created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE detections (
    id BIGSERIAL PRIMARY KEY,

    image_id TEXT NOT NULL
        REFERENCES sonar_images(id)
        ON DELETE CASCADE,

    model_version TEXT,

    class_id INTEGER,
    class_name TEXT NOT NULL,

    model_confidence DOUBLE PRECISION,

    x1 INTEGER,
    y1 INTEGER,
    x2 INTEGER,
    y2 INTEGER,

    filter_status TEXT,
    rejection_reason TEXT,

    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE reports (
    id BIGSERIAL PRIMARY KEY,

    image_id TEXT NOT NULL
        REFERENCES sonar_images(id)
        ON DELETE CASCADE,

    report_path TEXT,
    report_format TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);