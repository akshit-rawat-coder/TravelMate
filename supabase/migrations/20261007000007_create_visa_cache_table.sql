-- Migration: Create trip_visa_cache table with Row Level Security (RLS)
-- Description: Database-backed cache for visa entry requirement data from Orizn to minimize API calls and support on-demand refresh.

-- 1. Create trip_visa_cache table
CREATE TABLE IF NOT EXISTS public.trip_visa_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    passport_country TEXT NOT NULL,
    destination_country TEXT NOT NULL,
    visa_data JSONB NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Unique constraint preventing duplicate visa cache rows for the same trip, passport and destination
    CONSTRAINT uq_trip_visa_cache UNIQUE (
        trip_id,
        passport_country,
        destination_country
    )
);

-- 2. Performance Indexing
CREATE INDEX IF NOT EXISTS idx_trip_visa_cache_trip_id ON public.trip_visa_cache(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_visa_cache_lookup ON public.trip_visa_cache(
    trip_id,
    passport_country,
    destination_country
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.trip_visa_cache ENABLE ROW LEVEL SECURITY;

-- 4. Row Level Security Policies (tied to ownership of referenced trip)

-- Policy 1: Authenticated users can view visa cache only for their own trips
DROP POLICY IF EXISTS "Users can view visa cache for own trips" ON public.trip_visa_cache;
CREATE POLICY "Users can view visa cache for own trips"
    ON public.trip_visa_cache
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_visa_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    );

-- Policy 2: Authenticated users can insert visa cache only for their own trips
DROP POLICY IF EXISTS "Users can insert visa cache for own trips" ON public.trip_visa_cache;
CREATE POLICY "Users can insert visa cache for own trips"
    ON public.trip_visa_cache
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_visa_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    );

-- Policy 3: Authenticated users can update visa cache only for their own trips
DROP POLICY IF EXISTS "Users can update visa cache for own trips" ON public.trip_visa_cache;
CREATE POLICY "Users can update visa cache for own trips"
    ON public.trip_visa_cache
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_visa_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_visa_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    );

-- Policy 4: Authenticated users can delete visa cache only for their own trips
DROP POLICY IF EXISTS "Users can delete visa cache for own trips" ON public.trip_visa_cache;
CREATE POLICY "Users can delete visa cache for own trips"
    ON public.trip_visa_cache
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_visa_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    );
