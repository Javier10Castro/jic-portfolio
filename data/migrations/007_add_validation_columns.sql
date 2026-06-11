ALTER TABLE request_logs
ADD COLUMN IF NOT EXISTS validation_stage TEXT;

ALTER TABLE request_logs
ADD COLUMN IF NOT EXISTS validation_field TEXT;

ALTER TABLE request_logs
ADD COLUMN IF NOT EXISTS validation_reason TEXT;
