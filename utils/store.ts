import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { RequestStatus } from '@/components/StatusBadge';

// --- Types ---
export interface HotelBranding {
    id: string;
    slug: string;
    name: string;
    logo?: string;
    logoImage?: string;
    primaryColor: string;
    accentColor: string;
    wifiName?: string;
    wifiPassword?: string;
    receptionPhone?: string;
    bgPattern?: string;
    breakfastStart?: string;
    breakfastEnd?: string;
    lunchStart?: string;
    lunchEnd?: string;
    dinnerStart?: string;
    dinnerEnd?: string;
}

export interface SpecialOffer {
    id: string;
    hotel_id: string;
    title: string;
    description: string;
    image_url: string;
    is_active: boolean;
}

export interface UserProfile {
    id: string;
    user_id: string;
    hotel_id: string;
    role: 'admin' | 'staff';
}

export interface HotelRequest {
    id: string;
    hotel_id: string;
    room: string;
    type: string;
    notes?: string;
    status: RequestStatus;
    timestamp: number;
    time: string;
    price?: number;
    total?: number;
    is_paid: boolean;
}

export interface Room {
    id: string;
    hotel_id: string;
    room_number: string;
    booking_pin: string | null;
    is_occupied: boolean;
    checkout_date?: string;
    checkout_time?: string;
    num_guests?: number;
    checked_in_at?: number | null;
    created_at?: string;
}

export interface MenuItem {
    id: string;
    hotel_id: string;
    category: string;
    title: string;
    description?: string;
    price: number;
    image_url?: string;
    is_available: boolean;
    created_at?: string;
}

// --- Utilities ---
export const isDemoMode = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Demo Mode is active only if credentials are completely missing or placeholders
    const isMissing = !url || !key;
    const isPlaceholder = url?.includes('your-project-id') || key?.includes('your-anon-key');

    return isMissing || isPlaceholder;
};

const DEMO_ROOMS_KEY = 'antigravity_demo_rooms';
const DEMO_REQUESTS_KEY = 'antigravity_demo_requests';
const DEMO_MENU_KEY = 'antigravity_demo_menu';

const getDemoRooms = (hotelId: string): Room[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(`${DEMO_ROOMS_KEY}_${hotelId}`);
    return stored ? JSON.parse(stored) : [
        { id: 'r1', hotel_id: hotelId, room_number: '101', is_occupied: true, booking_pin: '1234', created_at: new Date().toISOString() },
        { id: 'r2', hotel_id: hotelId, room_number: '102', is_occupied: false, booking_pin: null, created_at: new Date().toISOString() },
        { id: 'r3', hotel_id: hotelId, room_number: '201', is_occupied: false, booking_pin: null, created_at: new Date().toISOString() }
    ];
};

const saveDemoRooms = (hotelId: string, rooms: Room[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`${DEMO_ROOMS_KEY}_${hotelId}`, JSON.stringify(rooms));
    // Dispatch custom event for real-time update in same browser
    window.dispatchEvent(new CustomEvent('demo_rooms_updated', { detail: { hotelId } }));
};

const getDemoRequests = (hotelId: string): HotelRequest[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(`${DEMO_REQUESTS_KEY}_${hotelId}`);
    return stored ? JSON.parse(stored) : [];
};

const saveDemoRequests = (hotelId: string, requests: HotelRequest[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`${DEMO_REQUESTS_KEY}_${hotelId}`, JSON.stringify(requests));
    // Dispatch custom event for real-time update in same browser
    window.dispatchEvent(new CustomEvent('demo_requests_updated', { detail: { hotelId } }));
};

const getDemoMenu = (hotelId: string): MenuItem[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(`${DEMO_MENU_KEY}_${hotelId}`);
    return stored ? JSON.parse(stored) : [
        { id: 'm1', hotel_id: hotelId, category: 'Breakfast', title: 'Continental Breakfast', description: 'Fresh pastries, fruits, and juice.', price: 16.0, is_available: true },
        { id: 'm2', hotel_id: hotelId, category: 'Lunch', title: 'Caesar Salad', description: 'Crisp romaine with parmesan.', price: 14.5, is_available: true },
        { id: 'm3', hotel_id: hotelId, category: 'Dinner', title: 'Margherita Pizza', description: 'Fresh mozzarella and basil.', price: 22.0, is_available: true },
        { id: 'm4', hotel_id: hotelId, category: 'All Day Snacks', title: 'Truffle Fries', description: 'Golden fries with truffle oil.', price: 12.0, is_available: true }
    ];
};

const saveDemoMenu = (hotelId: string, items: MenuItem[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`${DEMO_MENU_KEY}_${hotelId}`, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('demo_menu_updated', { detail: { hotelId } }));
};

// --- Supabase Hooks & Functions ---

/**
 * Hook to manage Supabase Auth state
 */
export function useAuth() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    return { user, loading };
}

/**
 * Hook to fetch user profile and associated hotel
 */
export function useProfile(userId?: string) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        async function fetchProfile() {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (!error) {
                setProfile(data);
            }
            setLoading(false);
        }

        fetchProfile();
    }, [userId]);

    return { profile, loading };
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
}

/**
 * Sign out
 */
export async function signOut() {
    return await supabase.auth.signOut();
}

/**
 * Hook to fetch and subscribe to hotel branding in real-time
 */
export function useHotelBranding(slug: string | undefined) {
    const [branding, setBranding] = useState<HotelBranding | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) {
            setLoading(false);
            return;
        }

        const fetchBranding = async () => {
            const { data, error } = await supabase
                .from('hotels')
                .select('*')
                .eq('slug', slug)
                .single();

            if (data) {
                setBranding({
                    id: data.id,
                    slug: data.slug,
                    name: data.name,
                    logo: data.logo,
                    logoImage: data.logo_image,
                    primaryColor: data.primary_color,
                    accentColor: data.accent_color,
                    wifiName: data.wifi_name,
                    wifiPassword: data.wifi_password,
                    receptionPhone: data.reception_phone,
                    breakfastStart: data.breakfast_start,
                    breakfastEnd: data.breakfast_end,
                    lunchStart: data.lunch_start,
                    lunchEnd: data.lunch_end,
                    dinnerStart: data.dinner_start,
                    dinnerEnd: data.dinner_end,
                });
            } else {
                // Mock branding fallback
                const demoHotels: Record<string, any> = {
                    'grand-royale': { id: '1', name: 'The Grand Royale', primaryColor: '#1e293b', accentColor: '#2563eb' },
                    'azure-bay': { id: '2', name: 'Azure Bay Resort', primaryColor: '#0891b2', accentColor: '#0ea5e9' },
                    'mountain-lodge': { id: '3', name: 'Mountain Lodge', primaryColor: '#166534', accentColor: '#22c55e' },
                    'babylon': { id: '4', name: 'Babylon Raipur', primaryColor: '#1e3a8a', accentColor: '#3b82f6' }
                };

                if (demoHotels[slug]) {
                    setBranding({
                        ...demoHotels[slug],
                        slug: slug
                    });
                } else {
                    // CATCH-ALL: Allow any slug to work in demo mode
                    console.log(`Demo Mode: Creating dynamic branding for slug "${slug}"`);
                    setBranding({
                        id: `demo-${slug}`,
                        slug: slug,
                        name: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
                        primaryColor: '#2563eb',
                        accentColor: '#3b82f6',
                        logoImage: '/images/luxury/logo.png',
                        receptionPhone: '+91 99999 99999'
                    });
                }
            }
            setLoading(false);
        };

        fetchBranding();

        // Subscribe to changes
        const subscription = supabase
            .channel(`hotel_branding_${slug}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'hotels',
                filter: `slug=eq.${slug}`
            }, (payload) => {
                const data = payload.new as any;
                setBranding({
                    id: data.id,
                    slug: data.slug,
                    name: data.name,
                    logo: data.logo,
                    logoImage: data.logo_image,
                    primaryColor: data.primary_color,
                    accentColor: data.accent_color,
                    wifiName: data.wifi_name,
                    wifiPassword: data.wifi_password,
                    receptionPhone: data.reception_phone,
                    breakfastStart: data.breakfast_start,
                    breakfastEnd: data.breakfast_end,
                    lunchStart: data.lunch_start,
                    lunchEnd: data.lunch_end,
                    dinnerStart: data.dinner_start,
                    dinnerEnd: data.dinner_end,
                });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [slug]);

    return { branding, loading };
}

/**
 * Hook to fetch and subscribe to requests for a specific hotel in real-time
 */
export function useSupabaseRequests(hotelId?: string, roomNumber?: string, checkedInAt?: number | null) {
    const [requests, setRequests] = useState<HotelRequest[]>([]);

    useEffect(() => {
        if (!hotelId) return;

        const fetchRequests = async () => {
            if (isDemoMode()) {
                const allRequests = getDemoRequests(hotelId);
                let filtered = roomNumber ? allRequests.filter(r => r.room === roomNumber) : allRequests;
                if (checkedInAt) {
                    filtered = filtered.filter(r => r.timestamp >= checkedInAt);
                }
                setRequests(filtered);
                return;
            }

            let query = supabase
                .from('requests')
                .select('*')
                .eq('hotel_id', hotelId);

            if (roomNumber) {
                query = query.eq('room', roomNumber);
            }

            if (checkedInAt) {
                query = query.gte('timestamp', checkedInAt);
            }

            const { data, error } = await query.order('timestamp', { ascending: false });

            if (data) setRequests(data);
        };

        fetchRequests();

        if (isDemoMode()) {
            const handleUpdate = (e: any) => {
                if (e.detail?.hotelId === hotelId || e.type === 'storage') {
                    const allReqs = getDemoRequests(hotelId);
                    let filtered = roomNumber ? allReqs.filter(r => r.room === roomNumber) : allReqs;
                    if (checkedInAt) {
                        filtered = filtered.filter(r => r.timestamp >= checkedInAt);
                    }
                    setRequests(filtered);
                }
            };
            window.addEventListener('demo_requests_updated', handleUpdate);
            window.addEventListener('storage', handleUpdate);
            return () => {
                window.removeEventListener('demo_requests_updated', handleUpdate);
                window.removeEventListener('storage', handleUpdate);
            };
        }

        // Subscribe to changes
        const subscription = supabase
            .channel(`hotel_requests_${hotelId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'requests',
                filter: `hotel_id=eq.${hotelId}`
            }, () => {
                fetchRequests(); // Refresh on any change
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [hotelId, roomNumber, checkedInAt]);

    return requests;
}

/**
 * Add a new request to Supabase
 */
export async function addSupabaseRequest(hotelId: string, request: Partial<HotelRequest>) {
    // Basic validation: UUIDs in Supabase are long. Demo IDs can be short (e.g. "demo-desai").
    if (!isDemoMode() && (!hotelId || hotelId.length < 20)) {
        console.error("Critical: Invalid Hotel ID provided for production request submission:", hotelId);
        return { data: null, error: { message: "Invalid Hotel Configuration (Production)" } };
    }

    const newRequestData: any = {
        hotel_id: hotelId,
        room: request.room || 'Unknown',
        type: request.type || 'Request',
        notes: request.notes,
        status: request.status || 'Pending',
        price: request.price || 0,
        total: request.total || 0,
        timestamp: Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        is_paid: request.is_paid || false
    };

    if (isDemoMode()) {
        const demoRequest = {
            ...newRequestData,
            id: Math.random().toString(36).substr(2, 9)
        };
        const requests = getDemoRequests(hotelId);
        saveDemoRequests(hotelId, [demoRequest, ...requests]);
        return { data: demoRequest, error: null };
    }

    // In production, we omit the 'id' and let Supabase generate a proper UUID
    const { data, error } = await supabase
        .from('requests')
        .insert([newRequestData])
        .select()
        .single();

    if (error) {
        console.error("Supabase Error Adding Request:");
        console.error("Message:", error.message);
        console.error("Details:", error.details);
        console.error("Hint:", error.hint);
    }

    return { data, error };
}

/**
 * Update request status in Supabase
 */
export async function updateSupabaseRequestStatus(id: string, status: RequestStatus) {
    if (isDemoMode()) {
        if (typeof window === 'undefined') return { data: null, error: null };

        // Find the hotelId by searching through all demo request keys in localStorage
        const keys = Object.keys(localStorage);
        for (const key of keys) {
            if (key.startsWith(DEMO_REQUESTS_KEY)) {
                const requests: HotelRequest[] = JSON.parse(localStorage.getItem(key) || '[]');
                const requestIndex = requests.findIndex(r => r.id === id);

                if (requestIndex !== -1) {
                    const foundHotelId = key.replace(`${DEMO_REQUESTS_KEY}_`, '');
                    requests[requestIndex].status = status;
                    saveDemoRequests(foundHotelId, requests);
                    console.log(`Demo Mode: Updated status of request ${id} to ${status} for hotel ${foundHotelId}`);
                    return { data: null, error: null };
                }
            }
        }

        console.warn(`Demo Mode: Could not find request with ID ${id} in any hotel store.`);
        return { data: null, error: null };
    }

    const { data, error } = await supabase
        .from('requests')
        .update({ status })
        .eq('id', id);

    if (error) console.error("Error updating status:", error);
    return { data, error };
}

/**
 * Update hotel branding in Supabase
 */
export async function saveHotelBranding(id: string, updates: Partial<HotelBranding>) {
    if (isDemoMode()) {
        console.log("Demo Mode: saveHotelBranding called (not persisted yet)", updates);
        return { data: null, error: null };
    }

    const { data, error } = await supabase
        .from('hotels')
        .update({
            name: updates.name,
            logo: updates.logo,
            logo_image: updates.logoImage,
            primary_color: updates.primaryColor,
            accent_color: updates.accentColor,
            wifi_name: updates.wifiName,
            wifi_password: updates.wifiPassword,
            reception_phone: updates.receptionPhone,
            breakfast_start: updates.breakfastStart,
            breakfast_end: updates.breakfastEnd,
            lunch_start: updates.lunchStart,
            lunch_end: updates.lunchEnd,
            dinner_start: updates.dinnerStart,
            dinner_end: updates.dinnerEnd,
        })
        .eq('id', id);

    if (error) console.error("Error saving hotel branding:", error);
    return { data, error };
}

/**
 * Mark all requests for a specific room and hotel as paid
 */
export async function settleRoomRequests(hotelId: string, room: string) {
    if (isDemoMode()) {
        const requests = getDemoRequests(hotelId);
        const updatedRequests = requests.map(r =>
            r.room === room ? { ...r, is_paid: true } : r
        );
        saveDemoRequests(hotelId, updatedRequests);
        return { data: null, error: null };
    }

    const { data, error } = await supabase
        .from('requests')
        .update({ is_paid: true })
        .eq('hotel_id', hotelId)
        .eq('room', room);

    if (error) console.error("Error settling room requests:", error);
    return { data, error };
}

/**
 * Add a new room to the hotel
 */
export async function addRoom(hotelId: string, roomNumber: string) {
    if (isDemoMode()) {
        const rooms = getDemoRooms(hotelId);
        const newRoom: Room = {
            id: Math.random().toString(36).substr(2, 9),
            hotel_id: hotelId,
            room_number: roomNumber,
            is_occupied: false,
            booking_pin: null,
            created_at: new Date().toISOString()
        };
        saveDemoRooms(hotelId, [...rooms, newRoom]);
        return { data: newRoom, error: null };
    }

    const { data, error } = await supabase
        .from('rooms')
        .insert([{
            hotel_id: hotelId,
            room_number: roomNumber
        }])
        .select()
        .single();

    if (error) console.error("Error adding room:", error);
    return { data, error };
}

/**
 * Delete a room from the hotel
 */
export async function deleteRoom(roomId: string, hotelId: string) {
    if (isDemoMode()) {
        const rooms = getDemoRooms(hotelId);
        const updatedRooms = rooms.filter(r => r.id !== roomId);
        saveDemoRooms(hotelId, updatedRooms);
        return { error: null };
    }

    const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId)
        .eq('hotel_id', hotelId);

    if (error) console.error("Error deleting room:", error);
    return { error };
}

/**
 * Hook to fetch and subscribe to rooms for a specific hotel in real-time
 */
export function useRooms(hotelId?: string) {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!hotelId) {
            setLoading(false);
            return;
        }

        const fetchRooms = async () => {
            if (isDemoMode()) {
                setRooms(getDemoRooms(hotelId));
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('rooms')
                .select('*')
                .eq('hotel_id', hotelId)
                .order('room_number', { ascending: true });

            if (data && data.length > 0) {
                setRooms(data);
            }
            setLoading(false);
        };

        fetchRooms();

        if (isDemoMode()) {
            const handleUpdate = (e: any) => {
                if (e.detail?.hotelId === hotelId || e.type === 'storage') {
                    setRooms(getDemoRooms(hotelId));
                }
            };
            window.addEventListener('demo_rooms_updated', handleUpdate);
            window.addEventListener('storage', handleUpdate);
            return () => {
                window.removeEventListener('demo_rooms_updated', handleUpdate);
                window.removeEventListener('storage', handleUpdate);
            };
        }

        const subscription = supabase
            .channel(`hotel_rooms_${hotelId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'rooms',
                filter: `hotel_id=eq.${hotelId}`
            }, () => {
                fetchRooms();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [hotelId]);

    return { rooms, loading };
}

/**
 * Check-in a room logic: generates a 4-digit PIN
 */
export async function checkInRoom(roomId: string, hotelId: string, checkoutDate?: string, checkoutTime?: string, numGuests: number = 1) {
    const pin = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit PIN

    if (isDemoMode()) {
        const rooms = getDemoRooms(hotelId);
        const updatedRooms = rooms.map(r =>
            r.id === roomId ? {
                ...r,
                is_occupied: true,
                booking_pin: pin,
                checkout_date: checkoutDate,
                checkout_time: checkoutTime,
                num_guests: numGuests,
                checked_in_at: Date.now()
            } : r
        );
        saveDemoRooms(hotelId, updatedRooms);
        return { data: null, error: null, pin };
    }

    const { data, error } = await supabase
        .from('rooms')
        .update({
            is_occupied: true,
            booking_pin: pin,
            checkout_date: checkoutDate,
            checkout_time: checkoutTime,
            num_guests: numGuests,
            checked_in_at: Date.now()
        })
        .eq('id', roomId)
        .eq('hotel_id', hotelId);

    if (error) console.error("Error checking in room:", error);
    return { data, error, pin };
}

/**
 * Check-out a room: clear the PIN
 */
export async function checkOutRoom(roomId: string, hotelId: string) {
    if (isDemoMode()) {
        const rooms = getDemoRooms(hotelId);
        const updatedRooms = rooms.map(r =>
            r.id === roomId ? {
                ...r,
                is_occupied: false,
                booking_pin: null,
                checkout_date: undefined,
                checkout_time: undefined
            } : r
        );
        saveDemoRooms(hotelId, updatedRooms);
        return { data: null, error: null };
    }

    const { data, error } = await supabase
        .from('rooms')
        .update({
            is_occupied: false,
            booking_pin: null,
            checkout_date: null,
            checkout_time: null,
            num_guests: null,
            checked_in_at: null
        })
        .eq('id', roomId)
        .eq('hotel_id', hotelId);

    if (error) console.error("Error checking out room:", error);
    return { data, error };
}

/**
 * Check-out a room by its room number: clear the PIN
 */
export async function checkOutRoomByNumber(hotelId: string, roomNumber: string) {
    if (isDemoMode()) {
        const rooms = getDemoRooms(hotelId);
        const updatedRooms = rooms.map(r =>
            r.room_number === roomNumber ? {
                ...r,
                is_occupied: false,
                booking_pin: null,
                checkout_date: undefined,
                checkout_time: undefined
            } : r
        );
        saveDemoRooms(hotelId, updatedRooms);
        return { data: null, error: null };
    }

    const { data, error } = await supabase
        .from('rooms')
        .update({
            is_occupied: false,
            booking_pin: null,
            checkout_date: null,
            checkout_time: null,
            num_guests: null,
            checked_in_at: null
        })
        .eq('hotel_id', hotelId)
        .eq('room_number', roomNumber);

    if (error) console.error("Error checking out room by number:", error);
    return { data, error };
}

/**
 * Verify a room's booking PIN. Useful for the guest UI.
 */
export async function verifyBookingPin(hotelId: string, roomNumber: string, pin: string) {
    if (isDemoMode()) {
        const rooms = getDemoRooms(hotelId);
        console.log(`Demo Mode: Verifying PIN for Room ${roomNumber}. Expected PIN found in storage:`,
            rooms.find(r => r.room_number === roomNumber)?.booking_pin || "NOT FOUND");

        const match = rooms.find(r => r.room_number === roomNumber && r.booking_pin === pin && r.is_occupied);

        if (match) {
            console.log("Demo Mode: PIN Verified Successfully!");
            return { success: true, data: match };
        }
        console.warn("Demo Mode: Invalid PIN or Room Not Occupied.");
        return { success: false, data: null };
    }


    console.log(`AuthStore: Querying Supabase for Room ${roomNumber} in Hotel ${hotelId}`);
    const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('hotel_id', hotelId)
        .eq('room_number', roomNumber)
        .eq('booking_pin', pin)
        .eq('is_occupied', true)
        .limit(1);

    if (error) {
        console.error("AuthStore: Supabase PIN verification error:", error.message);
        return { success: false, data: null };
    }

    const roomData = data && data.length > 0 ? data[0] : null;

    if (!roomData) {
        console.warn("AuthStore: No matching occupied room found with this PIN.");
        return { success: false, data: null };
    }

    console.log("AuthStore: Supabase PIN verification successful");
    return { success: true, data: roomData };
}

/**
 * Hook to fetch and subscribe to special offers for a specific hotel
 */
export function useSpecialOffers(hotelId?: string) {
    const [offers, setOffers] = useState<SpecialOffer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!hotelId) {
            setLoading(false);
            return;
        }

        const fetchOffers = async () => {
            if (isDemoMode()) {
                setOffers([
                    { id: '1', hotel_id: hotelId, title: '20% Off Spa', description: 'Enjoy our premium spa services at a discount.', image_url: 'https://images.unsplash.com/photo-1544161515-4ae6ce6db87e?auto=format&fit=crop&q=80', is_active: true },
                    { id: '2', hotel_id: hotelId, title: 'Dinner Buffet', description: 'Complementary dinner buffet for all diamond members.', image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80', is_active: true }
                ]);
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('special_offers')
                .select('*')
                .eq('hotel_id', hotelId)
                .order('created_at', { ascending: false });

            if (data) setOffers(data);
            setLoading(false);
        };

        fetchOffers();

        // Subscribe to changes
        const subscription = supabase
            .channel(`special_offers_${hotelId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'special_offers',
                filter: `hotel_id=eq.${hotelId}`
            }, () => {
                fetchOffers();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [hotelId]);

    return { offers, loading };
}

/**
 * Save or add a special offer
 */
export async function saveSpecialOffer(hotelId: string, offer: Partial<SpecialOffer>) {
    if (isDemoMode()) return { data: null, error: null };

    if (offer.id) {
        return await supabase
            .from('special_offers')
            .update({
                title: offer.title,
                description: offer.description,
                image_url: offer.image_url,
                is_active: offer.is_active
            })
            .eq('id', offer.id);
    } else {
        return await supabase
            .from('special_offers')
            .insert([{ ...offer, hotel_id: hotelId }]);
    }
}

/**
 * Delete a special offer
 */
export async function deleteSpecialOffer(id: string) {
    if (isDemoMode()) return { data: null, error: null };
    return await supabase.from('special_offers').delete().eq('id', id);
}

/**
 * Hook to fetch and subscribe to menu items for a specific hotel
 */
export function useSupabaseMenuItems(hotelId?: string) {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!hotelId) {
            setLoading(false);
            return;
        }

        const fetchMenuItems = async () => {
            if (isDemoMode()) {
                setMenuItems(getDemoMenu(hotelId));
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('menu_items')
                .select('*')
                .eq('hotel_id', hotelId)
                .order('category', { ascending: true });

            if (data) setMenuItems(data);
            setLoading(false);
        };

        fetchMenuItems();

        if (isDemoMode()) {
            const handleUpdate = (e: any) => {
                if (e.detail?.hotelId === hotelId || e.type === 'storage') {
                    setMenuItems(getDemoMenu(hotelId));
                }
            };
            window.addEventListener('demo_menu_updated', handleUpdate);
            window.addEventListener('storage', handleUpdate);
            return () => {
                window.removeEventListener('demo_menu_updated', handleUpdate);
                window.removeEventListener('storage', handleUpdate);
            };
        }

        const subscription = supabase
            .channel(`menu_items_${hotelId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'menu_items',
                filter: `hotel_id=eq.${hotelId}`
            }, () => {
                fetchMenuItems();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [hotelId]);

    return { menuItems, loading };
}

/**
 * Save or add a menu item
 */
export async function saveSupabaseMenuItem(hotelId: string, item: Partial<MenuItem>) {
    if (isDemoMode()) {
        const items = getDemoMenu(hotelId);
        if (item.id) {
            const updatedItems = items.map(i => i.id === item.id ? { ...i, ...item } as MenuItem : i);
            saveDemoMenu(hotelId, updatedItems);
            return { data: null, error: null };
        } else {
            const newItem = { ...item, id: Math.random().toString(36).substr(2, 9), hotel_id: hotelId } as MenuItem;
            saveDemoMenu(hotelId, [...items, newItem]);
            return { data: newItem, error: null };
        }
    }

    if (item.id) {
        const { data, error } = await supabase
            .from('menu_items')
            .update({
                category: item.category,
                title: item.title,
                description: item.description,
                price: item.price,
                image_url: item.image_url,
                is_available: item.is_available
            })
            .eq('id', item.id);
        if (error) console.error("Error updating menu item:", error.message, error);
        return { data, error };
    } else {
        const { data, error } = await supabase
            .from('menu_items')
            .insert([{ ...item, hotel_id: hotelId }]);
        if (error) {
            console.error("Error inserting menu item:", error.message, error);
            if (error.message.includes('Could not find the table')) {
                alert("Database Table Missing: Please run the Restoration SQL from the Implementation Plan in Supabase.");
            }
        }
        return { data, error };
    }
}

/**
 * Delete a menu item
 */
export async function deleteSupabaseMenuItem(id: string, hotelId: string) {
    if (isDemoMode()) {
        const items = getDemoMenu(hotelId);
        const updatedItems = items.filter(i => i.id !== id);
        saveDemoMenu(hotelId, updatedItems);
        return { error: null };
    }
    return await supabase.from('menu_items').delete().eq('id', id);
}

