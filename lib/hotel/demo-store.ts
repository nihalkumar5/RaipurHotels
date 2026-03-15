import type { Guest, HotelRequest, MenuItem, Room, SpecialOffer } from "@/lib/hotel/types";

const DEMO_KEYS = {
    rooms: "antigravity_demo_rooms",
    requests: "antigravity_demo_requests",
    menu: "antigravity_demo_menu",
    offers: "antigravity_demo_special_offers",
    guests: "antigravity_demo_guests",
} as const;

export const DEMO_EVENTS = {
    rooms: "demo_rooms_updated",
    requests: "demo_requests_updated",
    menu: "demo_menu_updated",
    offers: "demo_offers_updated",
    guests: "demo_guests_updated",
} as const;

const hasWindow = () => typeof window !== "undefined";

const readDemoCollection = <T,>(storageKey: string, fallback: T): T => {
    if (!hasWindow()) {
        return fallback;
    }

    const rawValue = localStorage.getItem(storageKey);
    if (!rawValue) {
        return fallback;
    }

    try {
        return JSON.parse(rawValue) as T;
    } catch {
        return fallback;
    }
};

const persistDemoCollection = <T,>(storageKey: string, eventName: string, hotelId: string, value: T) => {
    if (!hasWindow()) {
        return;
    }

    localStorage.setItem(storageKey, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(eventName, { detail: { hotelId } }));
};

const storageKey = (prefix: string, hotelId: string) => `${prefix}_${hotelId}`;

const nowIso = () => new Date().toISOString();

const buildDefaultRooms = (hotelId: string): Room[] => [
    { id: "r1", hotel_id: hotelId, room_number: "101", is_occupied: true, booking_pin: "1234", created_at: nowIso() },
    { id: "r2", hotel_id: hotelId, room_number: "102", is_occupied: true, booking_pin: "5678", created_at: nowIso() },
    { id: "r3", hotel_id: hotelId, room_number: "103", is_occupied: false, booking_pin: null, created_at: nowIso() },
    { id: "r4", hotel_id: hotelId, room_number: "201", is_occupied: true, booking_pin: "1122", created_at: nowIso() },
    { id: "r5", hotel_id: hotelId, room_number: "202", is_occupied: false, booking_pin: null, created_at: nowIso() },
    { id: "r6", hotel_id: hotelId, room_number: "301", is_occupied: false, booking_pin: null, created_at: nowIso() },
];

const buildDefaultRequests = (hotelId: string): HotelRequest[] => {
    const now = Date.now();
    const hour = 60 * 60 * 1000;

    return [
        { id: "dr1", hotel_id: hotelId, room: "101", type: "Dining Order", notes: "2x Continental Breakfast, 1x Coffee", status: "Completed", timestamp: now - hour * 5, time: "09:30", total: 48, is_paid: true },
        { id: "dr2", hotel_id: hotelId, room: "102", type: "Dining Order", notes: "1x Continental Breakfast, 2x Fresh Juice", status: "Completed", timestamp: now - hour * 5.5, time: "09:00", total: 32, is_paid: true },
        { id: "dr3", hotel_id: hotelId, room: "201", type: "Housekeeping", notes: "Fresh towels and extra pillows", status: "Completed", timestamp: now - hour * 4, time: "10:30", is_paid: true },
        { id: "dr4", hotel_id: hotelId, room: "101", type: "Dining Order", notes: "1x Caesar Salad, 1x Margherita Pizza", status: "Completed", timestamp: now - hour * 2, time: "12:45", total: 36.5, is_paid: true },
        { id: "dr5", hotel_id: hotelId, room: "305", type: "Dining Order", notes: "3x Margherita Pizza, 2x Truffle Fries", status: "Completed", timestamp: now - hour * 1.5, time: "13:15", total: 90, is_paid: true },
        { id: "dr6", hotel_id: hotelId, room: "103", type: "Laundry", notes: "Express service for 2 shirts", status: "In Progress", timestamp: now - hour * 0.5, time: "14:15", total: 15, is_paid: false },
        { id: "dr7", hotel_id: hotelId, room: "202", type: "Reception", notes: "Late checkout request (4 PM)", status: "Pending", timestamp: now - 15 * 60 * 1000, time: "14:30", is_paid: false },
        { id: "dr8", hotel_id: hotelId, room: "105", type: "Dining Order", notes: "1x Margherita Pizza", status: "Completed", timestamp: now - hour * 18, time: "20:45", total: 22, is_paid: true },
        { id: "dr9", hotel_id: hotelId, room: "204", type: "Dining Order", notes: "2x Truffle Fries", status: "Completed", timestamp: now - hour * 19, time: "19:30", total: 24, is_paid: true },
        { id: "dr10", hotel_id: hotelId, room: "101", type: "Dining Order", notes: "1x Caesar Salad", status: "Completed", timestamp: now - hour * 20, time: "18:30", total: 14.5, is_paid: true },
        { id: "dr11", hotel_id: hotelId, room: "Room 501", type: "Dining Order", notes: "4x Margherita Pizza", status: "Completed", timestamp: now - hour * 12, time: "02:45", total: 88, is_paid: true },
        { id: "dr12", hotel_id: hotelId, room: "Room 501", type: "Dining Order", notes: "1x Truffle Fries", status: "Completed", timestamp: now - hour * 13, time: "01:45", total: 12, is_paid: true },
    ];
};

const buildDefaultMenu = (hotelId: string): MenuItem[] => [
    { id: "m1", hotel_id: hotelId, category: "Breakfast", title: "Continental Breakfast", description: "Fresh pastries, fruits, and juice.", price: 16, is_available: true },
    { id: "m2", hotel_id: hotelId, category: "Lunch", title: "Caesar Salad", description: "Crisp romaine with parmesan.", price: 14.5, is_available: true },
    { id: "m3", hotel_id: hotelId, category: "Dinner", title: "Margherita Pizza", description: "Fresh mozzarella and basil.", price: 22, is_available: true },
    { id: "m4", hotel_id: hotelId, category: "All Day Snacks", title: "Truffle Fries", description: "Golden fries with truffle oil.", price: 12, is_available: true },
];

const buildDefaultOffers = (hotelId: string): SpecialOffer[] => [
    { id: "1", hotel_id: hotelId, title: "20% Off Spa", description: "Enjoy our premium spa services at a discount.", image_url: "https://images.unsplash.com/photo-1544161515-4ae6ce6db87e?auto=format&fit=crop&q=80", is_active: true },
    { id: "2", hotel_id: hotelId, title: "Dinner Buffet", description: "Complementary dinner buffet for all diamond members.", image_url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80", is_active: true },
    { id: "3", hotel_id: hotelId, title: "Airport Shuttle", description: "Book your luxury shuttle transfer to the airport.", image_url: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80", is_active: true },
];

export const getDemoRooms = (hotelId: string) =>
    readDemoCollection(storageKey(DEMO_KEYS.rooms, hotelId), buildDefaultRooms(hotelId));

export const saveDemoRooms = (hotelId: string, rooms: Room[]) =>
    persistDemoCollection(storageKey(DEMO_KEYS.rooms, hotelId), DEMO_EVENTS.rooms, hotelId, rooms);

export const getDemoRequests = (hotelId: string) =>
    readDemoCollection(storageKey(DEMO_KEYS.requests, hotelId), buildDefaultRequests(hotelId));

export const saveDemoRequests = (hotelId: string, requests: HotelRequest[]) =>
    persistDemoCollection(storageKey(DEMO_KEYS.requests, hotelId), DEMO_EVENTS.requests, hotelId, requests);

export const getDemoGuests = (hotelId: string) =>
    readDemoCollection<Guest[]>(storageKey(DEMO_KEYS.guests, hotelId), []);

export const saveDemoGuests = (hotelId: string, guests: Guest[]) =>
    persistDemoCollection(storageKey(DEMO_KEYS.guests, hotelId), DEMO_EVENTS.guests, hotelId, guests);

export const getDemoMenu = (hotelId: string) =>
    readDemoCollection(storageKey(DEMO_KEYS.menu, hotelId), buildDefaultMenu(hotelId));

export const saveDemoMenu = (hotelId: string, items: MenuItem[]) =>
    persistDemoCollection(storageKey(DEMO_KEYS.menu, hotelId), DEMO_EVENTS.menu, hotelId, items);

export const getDemoOffers = (hotelId: string) =>
    readDemoCollection(storageKey(DEMO_KEYS.offers, hotelId), buildDefaultOffers(hotelId));

export const saveDemoOffers = (hotelId: string, offers: SpecialOffer[]) =>
    persistDemoCollection(storageKey(DEMO_KEYS.offers, hotelId), DEMO_EVENTS.offers, hotelId, offers);

export const findHotelIdForDemoRequest = (requestId: string) => {
    if (!hasWindow()) {
        return null;
    }

    return Object.keys(localStorage).find((key) => {
        if (!key.startsWith(DEMO_KEYS.requests)) {
            return false;
        }

        const requests = readDemoCollection<HotelRequest[]>(key, []);
        return requests.some((request) => request.id === requestId);
    })?.replace(`${DEMO_KEYS.requests}_`, "") ?? null;
};

export const removeDemoOfferById = (offerId: string) => {
    if (!hasWindow()) {
        return false;
    }

    const offerStoreKey = Object.keys(localStorage).find((key) => {
        if (!key.startsWith(DEMO_KEYS.offers)) {
            return false;
        }

        const offers = readDemoCollection<SpecialOffer[]>(key, []);
        return offers.some((offer) => offer.id === offerId);
    });

    if (!offerStoreKey) {
        return false;
    }

    const hotelId = offerStoreKey.replace(`${DEMO_KEYS.offers}_`, "");
    const offers = readDemoCollection<SpecialOffer[]>(offerStoreKey, []);
    saveDemoOffers(hotelId, offers.filter((offer) => offer.id !== offerId));
    return true;
};
