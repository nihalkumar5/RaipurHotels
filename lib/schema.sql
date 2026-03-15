-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core tables for Hotel Platform SaaS

-- 1. Hotels (Branding & Configuration)
CREATE TABLE IF NOT EXISTS hotels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    city TEXT,
    logo TEXT, -- Small character or short name for logo fallback
    logo_image TEXT, -- URL to actual logo image
    hero_image TEXT, -- URL for guest dashboard hero image
    primary_color TEXT DEFAULT '#2563eb',
    accent_color TEXT DEFAULT '#4f46e5',
    service_icon_color TEXT DEFAULT '#2f2f2f',
    wifi_name TEXT,
    wifi_password TEXT,
    reception_phone TEXT,
    concierge_whatsapp TEXT,
    breakfast_start TEXT DEFAULT '07:00',
    breakfast_end TEXT DEFAULT '10:30',
    lunch_start TEXT DEFAULT '12:30',
    lunch_end TEXT DEFAULT '15:30',
    dinner_start TEXT DEFAULT '19:00',
    dinner_end TEXT DEFAULT '22:30',
    late_checkout_phone TEXT,
    late_checkout_charge_1 TEXT DEFAULT 'Complimentary',
    late_checkout_charge_2 TEXT DEFAULT '₹1,500',
    late_checkout_charge_3 TEXT DEFAULT 'Full Day Rate',
    airport_transfer_charge_1 TEXT,
    airport_transfer_charge_2 TEXT,
    airport_transfer_charge_3 TEXT,
    checkout_message TEXT,
    google_review_link TEXT,
    welcome_message TEXT,
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
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT DEFAULT 'admin', -- 'admin' | 'staff'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, hotel_id)
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
    num_guests INTEGER,
    checked_in_at BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(hotel_id, room_number)
);

-- 3b. Guests (Current Occupants)
CREATE TABLE IF NOT EXISTS guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    room_number TEXT NOT NULL,
    check_in_date TEXT NOT NULL,
    check_out_date TEXT,
    status TEXT DEFAULT 'active', -- 'active' | 'checked_out' | 'deleted'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
CREATE INDEX IF NOT EXISTS idx_guests_hotel_id ON guests(hotel_id);

-- Enable Row Level Security (RLS)
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- 1. Hotels Policies
DROP POLICY IF EXISTS "Public hotels are viewable by everyone" ON hotels;
CREATE POLICY "Public hotels are viewable by everyone" ON hotels
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anyone to register a hotel" ON hotels;
CREATE POLICY "Allow anyone to register a hotel" ON hotels 
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can update their hotel branding" ON hotels;
CREATE POLICY "Staff can update their hotel branding" ON hotels
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.hotel_id = hotels.id
        )
    );

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

-- 5. Guests Policies
DROP POLICY IF EXISTS "Staff can manage guests" ON guests;
CREATE POLICY "Staff can manage guests" ON guests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.hotel_id = guests.hotel_id
        )
    );

DROP POLICY IF EXISTS "Guests are viewable by everyone" ON guests;
CREATE POLICY "Guests are viewable by everyone" ON guests
    FOR SELECT USING (true);

-- 6. Special Offers Policies
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

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'guests'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE guests;
    END IF;
END $$;

-- 7. WhatsApp Automation & Late Checkout (Migration)
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS welcome_message TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS hero_image TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS checkout_date TEXT;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS checkout_time TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS checkout_message TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS google_review_link TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS late_checkout_phone TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS late_checkout_charge_1 TEXT DEFAULT 'Complimentary';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS late_checkout_charge_2 TEXT DEFAULT '₹1,500';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS late_checkout_charge_3 TEXT DEFAULT 'Full Day Rate';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS service_icon_color TEXT DEFAULT '#2f2f2f';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS airport_transfer_charge_1 TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS airport_transfer_charge_2 TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS airport_transfer_charge_3 TEXT;

-- 8. Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Staff Attendance Table
CREATE TABLE IF NOT EXISTS staff_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(staff_id, date)
);

-- 10. Security Hardening (RLS)
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;

-- Menu Items Policies
DROP POLICY IF EXISTS "Menu items are viewable by everyone" ON menu_items;
CREATE POLICY "Menu items are viewable by everyone" ON menu_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can manage menu items" ON menu_items;
CREATE POLICY "Staff can manage menu items" ON menu_items FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.hotel_id = menu_items.hotel_id)
);

-- Staff Attendance Policies
DROP POLICY IF EXISTS "Staff can manage attendance" ON staff_attendance;
CREATE POLICY "Staff can manage attendance" ON staff_attendance FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.hotel_id = staff_attendance.hotel_id)
);

-- 11. Enable Real-time for new tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'menu_items') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'staff_attendance') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE staff_attendance;
    END IF;
END $$;
