export type RequestStatus =
    | "Pending"
    | "Assigned"
    | "In Progress"
    | "Completed"
    | "Rejected";

export interface HotelBranding {
    id: string;
    slug: string;
    name: string;
    city?: string;
    logo?: string;
    logoImage?: string;
    heroImage?: string;
    primaryColor: string;
    accentColor: string;
    serviceIconColor?: string;
    wifiName?: string;
    wifiPassword?: string;
    receptionPhone?: string;
    conciergeWhatsapp?: string;
    bgPattern?: string;
    breakfastStart?: string;
    breakfastEnd?: string;
    lunchStart?: string;
    lunchEnd?: string;
    dinnerStart?: string;
    dinnerEnd?: string;
    lateCheckoutPhone?: string;
    lateCheckoutCharge1?: string;
    lateCheckoutCharge2?: string;
    lateCheckoutCharge3?: string;
    airportTransferCharge1?: string;
    airportTransferCharge2?: string;
    airportTransferCharge3?: string;
    checkoutMessage?: string;
    googleReviewLink?: string;
    welcomeMessage?: string;
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
    full_name?: string;
    email?: string;
    role: "admin" | "reception" | "kitchen" | "housekeeping" | "staff";
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

export interface Guest {
    id: string;
    hotel_id: string;
    name: string;
    phone: string;
    room_number: string;
    check_in_date: string;
    check_out_date?: string;
    status: "active" | "checked_out" | "deleted";
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

export interface LandingHotel {
    id: string;
    name: string;
    slug: string;
    logoImage: string | null;
}
