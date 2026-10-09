-- Migration: Validate trip dates
-- Description: Ensures trips cannot be created with past start dates or end dates before start dates.

-- 1. Create or replace validation trigger function
CREATE OR REPLACE FUNCTION public.validate_trip_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent past start dates for new trips or when start date is modified
    IF (TG_OP = 'INSERT' OR NEW.start_date <> OLD.start_date) AND NEW.start_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'Trip start date must be today or in the future.';
    END IF;

    -- Ensure end date is on or after start date
    IF NEW.end_date < NEW.start_date THEN
        RAISE EXCEPTION 'Trip end date must be on or after the start date.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach trigger to public.trips
DROP TRIGGER IF EXISTS trg_validate_trip_dates ON public.trips;
CREATE TRIGGER trg_validate_trip_dates
    BEFORE INSERT OR UPDATE OF start_date, end_date ON public.trips
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_trip_dates();

-- 3. Enhance RLS policy for insert with date validity check
DROP POLICY IF EXISTS "Users can create own trips" ON public.trips;
CREATE POLICY "Users can create own trips"
    ON public.trips
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (select auth.uid()) = user_id
        AND start_date >= CURRENT_DATE
        AND end_date >= start_date
    );
