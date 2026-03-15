ALTER TABLE public.hotels
ADD COLUMN IF NOT EXISTS concierge_whatsapp TEXT;

NOTIFY pgrst, 'reload schema';
