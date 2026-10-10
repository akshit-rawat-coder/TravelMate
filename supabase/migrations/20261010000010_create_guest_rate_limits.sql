-- Migration: 20261010000010_create_guest_rate_limits.sql
-- Description: Create shared rate-limiting table and atomic token bucket function for guest requests
-- Security: Restricted strictly to service_role with safe search_path and no public exposure

CREATE TABLE IF NOT EXISTS public.guest_rate_limits (
  ip_hash TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for window expiration and cleanup queries
CREATE INDEX IF NOT EXISTS idx_guest_rate_limits_window_start
  ON public.guest_rate_limits (window_start);

-- Enable Row Level Security (no public policies granted)
ALTER TABLE public.guest_rate_limits ENABLE ROW LEVEL SECURITY;

-- Revoke all table permissions from public, anon, and authenticated
REVOKE ALL ON TABLE public.guest_rate_limits FROM PUBLIC, anon, authenticated;

-- Grant table access exclusively to service_role
GRANT ALL ON TABLE public.guest_rate_limits TO service_role;

-- Atomic rate check and increment function
-- Hardened with SECURITY DEFINER and fixed safe search_path = public, pg_temp
CREATE OR REPLACE FUNCTION public.check_guest_rate_limit(
  p_ip_hash TEXT,
  p_max_requests INTEGER DEFAULT 15,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Strict input validation on hash
  IF p_ip_hash IS NULL OR length(trim(p_ip_hash)) = 0 OR length(p_ip_hash) > 128 THEN
    p_ip_hash := 'unresolved';
  END IF;

  -- Opportunistic cleanup of expired rows (> 1 day old) with 2% probability to keep table compact
  IF random() < 0.02 THEN
    DELETE FROM public.guest_rate_limits
    WHERE window_start < v_now - INTERVAL '1 day';
  END IF;

  SELECT request_count, window_start INTO v_count, v_window_start
  FROM public.guest_rate_limits
  WHERE ip_hash = p_ip_hash
  FOR UPDATE;

  -- Concurrency-safe first-request insert handling simultaneous incoming calls
  IF NOT FOUND THEN
    INSERT INTO public.guest_rate_limits (ip_hash, request_count, window_start, updated_at)
    VALUES (p_ip_hash, 1, v_now, v_now)
    ON CONFLICT (ip_hash) DO UPDATE
    SET request_count = public.guest_rate_limits.request_count + 1,
        updated_at = v_now;
    RETURN jsonb_build_object('allowed', true, 'remaining', p_max_requests - 1, 'retry_after', 0);
  END IF;

  -- Window expired: reset counter
  IF v_now > v_window_start + (p_window_seconds || ' seconds')::INTERVAL THEN
    UPDATE public.guest_rate_limits
    SET request_count = 1, window_start = v_now, updated_at = v_now
    WHERE ip_hash = p_ip_hash;
    RETURN jsonb_build_object('allowed', true, 'remaining', p_max_requests - 1, 'retry_after', 0);
  END IF;

  -- Window still active: increment if under threshold
  IF v_count < p_max_requests THEN
    UPDATE public.guest_rate_limits
    SET request_count = request_count + 1, updated_at = v_now
    WHERE ip_hash = p_ip_hash;
    RETURN jsonb_build_object('allowed', true, 'remaining', p_max_requests - v_count - 1, 'retry_after', 0);
  ELSE
    -- Threshold reached: reject with calculated retry_after in seconds
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'retry_after', GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_window_start + (p_window_seconds || ' seconds')::INTERVAL - v_now))))::INTEGER
    );
  END IF;
END;
$$;

-- Revoke execution rights from public, anon, and authenticated to prevent unauthorized manipulation
REVOKE ALL ON FUNCTION public.check_guest_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;

-- Grant execution exclusively to service_role (invoked only from server-side Edge Functions)
GRANT EXECUTE ON FUNCTION public.check_guest_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;

-- Administrative cleanup function for periodic maintenance
CREATE OR REPLACE FUNCTION public.cleanup_expired_guest_rate_limits(
  p_retention_interval INTERVAL DEFAULT INTERVAL '1 day'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.guest_rate_limits
  WHERE window_start < (NOW() - p_retention_interval);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_guest_rate_limits(INTERVAL) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_guest_rate_limits(INTERVAL) TO service_role;
