-- Migration: Add cabin_class column to trips table
-- Description: Adds cabin_class with check constraint and default 'economy' for flight search compatibility.

ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS cabin_class TEXT NOT NULL DEFAULT 'economy';

-- Add check constraint for valid cabin classes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_trips_cabin_class'
    ) THEN
        ALTER TABLE public.trips
        ADD CONSTRAINT chk_trips_cabin_class
        CHECK (cabin_class IN ('economy', 'premium_economy', 'business', 'first'));
    END IF;
END $$;

-- Comment for schema documentation
COMMENT ON COLUMN public.trips.cabin_class IS 'Preferred flight cabin class: economy, premium_economy, business, or first';
