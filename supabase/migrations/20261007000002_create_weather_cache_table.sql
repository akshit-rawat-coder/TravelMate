-- Migration: Create trip_weather_cache table with Row Level Security (RLS)
-- Description: Database-backed cache for weather intelligence data to minimize external API calls.

-- 1. Create trip_weather_cache table
CREATE TABLE IF NOT EXISTS public.trip_weather_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    location TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    weather_mode TEXT NOT NULL,
    weather_data JSONB NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Unique constraint preventing duplicate cache records for the same trip, location and dates
    CONSTRAINT uq_trip_weather_cache UNIQUE (trip_id, location, start_date, end_date),
    CONSTRAINT chk_weather_cache_dates CHECK (start_date <= end_date)
);

-- 2. Performance Indexing
CREATE INDEX IF NOT EXISTS idx_trip_weather_cache_trip_id ON public.trip_weather_cache(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_weather_cache_lookup ON public.trip_weather_cache(trip_id, location, start_date, end_date);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.trip_weather_cache ENABLE ROW LEVEL SECURITY;

-- 4. Row Level Security Policies (tied to ownership of the referenced trip)

-- Policy 1: Authenticated users can view weather cache only for their own trips
DROP POLICY IF EXISTS "Users can view weather cache for own trips" ON public.trip_weather_cache;
CREATE POLICY "Users can view weather cache for own trips"
    ON public.trip_weather_cache
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_weather_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    );

-- Policy 2: Authenticated users can insert weather cache only for their own trips
DROP POLICY IF EXISTS "Users can insert weather cache for own trips" ON public.trip_weather_cache;
CREATE POLICY "Users can insert weather cache for own trips"
    ON public.trip_weather_cache
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_weather_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    );

-- Policy 3: Authenticated users can update weather cache only for their own trips
DROP POLICY IF EXISTS "Users can update weather cache for own trips" ON public.trip_weather_cache;
CREATE POLICY "Users can update weather cache for own trips"
    ON public.trip_weather_cache
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_weather_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_weather_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    );

-- Policy 4: Authenticated users can delete weather cache only for their own trips
DROP POLICY IF EXISTS "Users can delete weather cache for own trips" ON public.trip_weather_cache;
CREATE POLICY "Users can delete weather cache for own trips"
    ON public.trip_weather_cache
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_weather_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    );
