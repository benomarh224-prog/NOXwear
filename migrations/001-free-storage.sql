-- Dedicated NOXwear database; never replace or truncate an existing catalogue.
CREATE TABLE IF NOT EXISTS nox_objects (
  path text PRIMARY KEY,
  body bytea NOT NULL CHECK (octet_length(body) <= 52428800),
  content_type text NOT NULL,
  revision text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS nox_video_uploads (
  filename text PRIMARY KEY,
  size integer NOT NULL CHECK (size > 0 AND size <= 52428800),
  content_type text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour')
);
CREATE TABLE IF NOT EXISTS nox_video_chunks (
  filename text NOT NULL REFERENCES nox_video_uploads(filename) ON DELETE CASCADE,
  part integer NOT NULL CHECK (part BETWEEN 0 AND 24),
  body bytea NOT NULL CHECK (octet_length(body) BETWEEN 1 AND 2097152),
  PRIMARY KEY (filename, part)
);
