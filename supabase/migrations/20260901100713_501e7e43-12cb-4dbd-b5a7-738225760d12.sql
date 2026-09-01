ALTER TABLE public.school_registration_requests
  ADD COLUMN IF NOT EXISTS preferred_demo_date date,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS request_source text NOT NULL DEFAULT 'registration';

ALTER TABLE public.school_registration_requests
  ALTER COLUMN state_region DROP NOT NULL,
  ALTER COLUMN district DROP NOT NULL,
  ALTER COLUMN street_address DROP NOT NULL,
  ALTER COLUMN school_phone DROP NOT NULL,
  ALTER COLUMN admin_position DROP NOT NULL;