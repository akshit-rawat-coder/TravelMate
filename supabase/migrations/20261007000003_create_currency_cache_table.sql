-- Migration: Create trip_currency_cache table with Row Level Security (RLS)
-- Description: Database-backed cache for Fixer currency conversion rates to minimize external API calls.

-- 1. Create trip_currency_cache table
CREATE TABLE IF NOT EXISTS public.trip_currency_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    source_currency TEXT NOT NULL,
    destination_currency TEXT NOT NULL,
    rate NUMERIC NOT NULL,
    trip_budget NUMERIC,
    converted_budget NUMERIC,
    example_amount NUMERIC,
    converted_amount NUMERIC,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Unique constraint preventing duplicate cache records for the same trip and currency pair
    CONSTRAINT uq_trip_currency_cache UNIQUE (trip_id, source_currency, destination_currency),
    CONSTRAINT chk_currency_rate_positive CHECK (rate > 0)
);

-- 2. Performance Indexing
CREATE INDEX IF NOT EXISTS idx_trip_currency_cache_trip_id ON public.trip_currency_cache(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_currency_cache_lookup ON public.trip_currency_cache(trip_id, source_currency, destination_currency);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.trip_currency_cache ENABLE ROW LEVEL SECURITY;

-- 4. Row Level Security Policies (tied to ownership of referenced trip)

-- Policy 1: Authenticated users can view currency cache only for their own trips
DROP POLICY IF EXISTS "Users can view currency cache for own trips" ON public.trip_currency_cache;
CREATE POLICY "Users can view currency cache for own trips"
    ON public.trip_currency_cache
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_currency_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    );

-- Policy 2: Authenticated users can insert currency cache only for their own trips
DROP POLICY IF EXISTS "Users can insert currency cache for own trips" ON public.trip_currency_cache;
CREATE POLICY "Users can insert currency cache for own trips"
    ON public.trip_currency_cache
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_currency_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    );

-- Policy 3: Authenticated users can update currency cache only for their own trips
DROP POLICY IF EXISTS "Users can update currency cache for own trips" ON public.trip_currency_cache;
CREATE POLICY "Users can update currency cache for own trips"
    ON public.trip_currency_cache
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_currency_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_currency_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    );

-- Policy 4: Authenticated users can delete currency cache only for their own trips
DROP POLICY IF EXISTS "Users can delete currency cache for own trips" ON public.trip_currency_cache;
CREATE POLICY "Users can delete currency cache for own trips"
    ON public.trip_currency_cache
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_currency_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    );
