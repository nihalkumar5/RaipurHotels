-- Core tables for Hotel Platform SaaS

-- 1. Hotels (Branding & Configuration)
CREATE TABLE IF NOT EXISTS hotels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    logo TEXT, -- Small character or short name for logo fallback
    logo_image TEXT, -- URL to actual logo image
    primary_color TEXT DEFAULT '#2563eb',
    accent_color TEXT DEFAULT '#4f46e5',
    wifi_name TEXT,
    wifi_password TEXT,
    reception_phone TEXT,
    breakfast_start TEXT DEFAULT '07:00',
    breakfast_end TEXT DEFAULT '10:30',
    lunch_start TEXT DEFAULT '12:30',
    lunch_end TEXT DEFAULT '15:30',
    dinner_start TEXT DEFAULT '19:00',
    dinner_end TEXT DEFAULT '22:30',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1b. Special Offers (Promotional Content)
CREATE TABLE IF NOT EXISTS special_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Staff Profiles (Authentication Link)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT DEFAULT 'admin', -- 'admin' | 'staff'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Rooms (Check-in and Access Control)
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    booking_pin TEXT, -- 4 to 6 digit code generated on check-in
    is_occupied BOOLEAN DEFAULT FALSE,
    checkout_date TEXT,
    checkout_time TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(hotel_id, room_number)
);

-- 4. Requests (Guest Services & Orders)
CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    room TEXT NOT NULL,
    type TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'Pending', -- 'Pending' | 'In Progress' | 'Completed' | 'Cancelled'
    price DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) DEFAULT 0,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    timestamp BIGINT NOT NULL,
    time TEXT
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_requests_hotel_id ON requests(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotels_slug ON hotels(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- 1. Hotels Policies
DROP POLICY IF EXISTS "Public hotels are viewable by everyone" ON hotels;
CREATE POLICY "Public hotels are viewable by everyone" ON hotels
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anyone to register a hotel" ON hotels;
CREATE POLICY "Allow anyone to register a hotel" ON hotels 
    FOR INSERT WITH CHECK (true);

-- 2. Profiles Policies
DROP POLICY IF EXISTS "Profiles are viewable by owners" ON profiles;
CREATE POLICY "Profiles are viewable by owners" ON profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;
CREATE POLICY "Allow profile creation during signup" ON profiles 
    FOR INSERT WITH CHECK (true);

-- 3. Rooms Policies
DROP POLICY IF EXISTS "Staff can manage rooms" ON rooms;
CREATE POLICY "Staff can manage rooms" ON rooms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.hotel_id = rooms.hotel_id
        )
    );

DROP POLICY IF EXISTS "Rooms are viewable by everyone" ON rooms;
CREATE POLICY "Rooms are viewable by everyone" ON rooms
    FOR SELECT USING (true);

-- 4. Requests Policies
DROP POLICY IF EXISTS "Guests can manage their requests" ON requests;
CREATE POLICY "Guests can manage their requests" ON requests
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Staff can manage requests" ON requests;
CREATE POLICY "Staff can manage requests" ON requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.hotel_id = requests.hotel_id
        )
    );

-- 5. Special Offers Policies
ALTER TABLE special_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Special offers are viewable by everyone" ON special_offers;
CREATE POLICY "Special offers are viewable by everyone" ON special_offers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can manage special offers" ON special_offers;
CREATE POLICY "Staff can manage special offers" ON special_offers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.hotel_id = special_offers.hotel_id
        )
    );

-- Enable Real-time safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'requests'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE requests;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'hotels'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE hotels;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'rooms'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'special_offers'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE special_offers;
    END IF;
END $$;
