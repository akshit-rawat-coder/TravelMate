-- Migration: Create trip_flight_cache table with Row Level Security (RLS)
-- Description: Database-backed cache for flight search data to minimize external API calls and support refresh-on-demand.

-- 1. Create trip_flight_cache table
CREATE TABLE IF NOT EXISTS public.trip_flight_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE,
    travelers INTEGER NOT NULL DEFAULT 1,
    cabin_class TEXT,
    currency TEXT NOT NULL,
    flight_data JSONB NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Unique constraint preventing duplicate flight cache rows for the same search criteria
    CONSTRAINT uq_trip_flight_cache UNIQUE NULLS NOT DISTINCT (
        trip_id,
        origin,
        destination,
        departure_date,
        return_date,
        travelers,
        cabin_class,
        currency
    ),
    CONSTRAINT chk_flight_cache_travelers CHECK (travelers >= 1),
    CONSTRAINT chk_flight_cache_dates CHECK (return_date IS NULL OR departure_date <= return_date)
);

-- 2. Performance Indexing
CREATE INDEX IF NOT EXISTS idx_trip_flight_cache_trip_id ON public.trip_flight_cache(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_flight_cache_lookup ON public.trip_flight_cache(
    trip_id,
    origin,
    destination,
    departure_date,
    currency
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.trip_flight_cache ENABLE ROW LEVEL SECURITY;

-- 4. Row Level Security Policies (tied to ownership of referenced trip)

-- Policy 1: Authenticated users can view flight cache only for their own trips
DROP POLICY IF EXISTS "Users can view flight cache for own trips" ON public.trip_flight_cache;
CREATE POLICY "Users can view flight cache for own trips"
    ON public.trip_flight_cache
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_flight_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    );

-- Policy 2: Authenticated users can insert flight cache only for their own trips
DROP POLICY IF EXISTS "Users can insert flight cache for own trips" ON public.trip_flight_cache;
CREATE POLICY "Users can insert flight cache for own trips"
    ON public.trip_flight_cache
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_flight_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    );

-- Policy 3: Authenticated users can update flight cache only for their own trips
DROP POLICY IF EXISTS "Users can update flight cache for own trips" ON public.trip_flight_cache;
CREATE POLICY "Users can update flight cache for own trips"
    ON public.trip_flight_cache
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_flight_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_flight_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    );

-- Policy 4: Authenticated users can delete flight cache only for their own trips
DROP POLICY IF EXISTS "Users can delete flight cache for own trips" ON public.trip_flight_cache;
CREATE POLICY "Users can delete flight cache for own trips"
    ON public.trip_flight_cache
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_flight_cache.trip_id
              AND trips.user_id = (SELECT auth.uid())
        )
    );
