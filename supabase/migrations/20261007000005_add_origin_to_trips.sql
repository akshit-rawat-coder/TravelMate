-- Migration: Add origin column to trips table for departure location / flight search
-- Description: Adds optional origin text column to public.trips. Existing trips remain valid with origin = NULL.

ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS origin TEXT;

-- Comment for schema documentation
COMMENT ON COLUMN public.trips.origin IS 'Departure or origin city/location for flight planning';
