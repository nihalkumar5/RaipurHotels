ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS checkout_date TEXT;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS checkout_time TEXT;
