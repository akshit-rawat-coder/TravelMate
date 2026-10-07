-- Migration: Create trips table with Row Level Security (RLS)
-- Description: Foundation schema for TravelMate trips belonging to authenticated users.

-- 1. Create trips table
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    country TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    travelers INTEGER NOT NULL DEFAULT 1,
    budget NUMERIC,
    currency TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'planned',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT chk_trips_travelers CHECK (travelers >= 1),
    CONSTRAINT chk_trips_dates CHECK (start_date <= end_date),
    CONSTRAINT chk_trips_budget CHECK (budget IS NULL OR budget >= 0),
    CONSTRAINT chk_trips_status CHECK (status IN ('planned', 'active', 'completed', 'cancelled'))
);

-- 2. Performance Indexing
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- 4. Row Level Security Policies

-- Policy 1: Authenticated users can view only their own trips
DROP POLICY IF EXISTS "Users can view own trips" ON public.trips;
CREATE POLICY "Users can view own trips"
    ON public.trips
    FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id);

-- Policy 2: Authenticated users can create only their own trips
DROP POLICY IF EXISTS "Users can create own trips" ON public.trips;
CREATE POLICY "Users can create own trips"
    ON public.trips
    FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

-- Policy 3: Authenticated users can update only their own trips
DROP POLICY IF EXISTS "Users can update own trips" ON public.trips;
CREATE POLICY "Users can update own trips"
    ON public.trips
    FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- Policy 4: Authenticated users can delete only their own trips
DROP POLICY IF EXISTS "Users can delete own trips" ON public.trips;
CREATE POLICY "Users can delete own trips"
    ON public.trips
    FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = user_id);
