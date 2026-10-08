-- Migration: Create attractions_cache table with Row Level Security (RLS)
-- Description: Database-backed cache for OpenRouteService Points of Interest (POIs) / attractions data to minimize external API calls and support on-demand refresh.

-- 1. Create attractions_cache table
CREATE TABLE IF NOT EXISTS public.attractions_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    destination_city TEXT NOT NULL,
    destination_country TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    radius_meters INTEGER NOT NULL DEFAULT 2000,
    attractions_data JSONB NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Unique constraint preventing duplicate cache records for the same trip and search radius
    CONSTRAINT uq_attractions_cache_trip_radius UNIQUE (trip_id, radius_meters)
);

-- 2. Performance Indexing
CREATE INDEX IF NOT EXISTS idx_attractions_cache_trip_id ON public.attractions_cache(trip_id);
CREATE INDEX IF NOT EXISTS idx_attractions_cache_lookup ON public.attractions_cache(trip_id, radius_meters);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.attractions_cache ENABLE ROW LEVEL SECURITY;

-- 4. Row Level Security Policies (tied to ownership of the referenced trip)

-- Policy 1: Authenticated users can view attractions cache only for their own trips
DROP POLICY IF EXISTS "Users can view attractions cache for own trips" ON public.attractions_cache;
CREATE POLICY "Users can view attractions cache for own trips"
    ON public.attractions_cache
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = attractions_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    );

-- Policy 2: Authenticated users can insert attractions cache only for their own trips
DROP POLICY IF EXISTS "Users can insert attractions cache for own trips" ON public.attractions_cache;
CREATE POLICY "Users can insert attractions cache for own trips"
    ON public.attractions_cache
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = attractions_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    );

-- Policy 3: Authenticated users can update attractions cache only for their own trips
DROP POLICY IF EXISTS "Users can update attractions cache for own trips" ON public.attractions_cache;
CREATE POLICY "Users can update attractions cache for own trips"
    ON public.attractions_cache
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = attractions_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = attractions_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    );

-- Policy 4: Authenticated users can delete attractions cache only for their own trips
DROP POLICY IF EXISTS "Users can delete attractions cache for own trips" ON public.attractions_cache;
CREATE POLICY "Users can delete attractions cache for own trips"
    ON public.attractions_cache
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = attractions_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    );
