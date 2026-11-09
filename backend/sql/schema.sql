CREATE TABLE IF NOT EXISTS health_records (
  source_id uuid NOT NULL,
  device_id text NOT NULL,
  stream text NOT NULL,
  record_key text NOT NULL,
  key_json jsonb NOT NULL,
  data_json jsonb NOT NULL,
  measurement_ts bigint NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_id, device_id, stream, record_key)
);

CREATE INDEX IF NOT EXISTS health_records_stream_ts_idx
  ON health_records (stream, measurement_ts DESC);

CREATE TABLE IF NOT EXISTS push_batches (
  source_id uuid NOT NULL,
  device_id text NOT NULL,
  batch_id uuid NOT NULL,
  payload_sha256 char(64) NOT NULL,
  acknowledgement jsonb NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_id, device_id, batch_id)
);