import { useEffect, useState } from "react";

import type { LandingHotel } from "@/lib/hotel/types";
import { supabase } from "@/lib/supabaseClient";

type LandingHotelRow = {
    id: string;
    name: string;
    slug: string;
    logo_image: string | null;
};

export const LANDING_NAV_LINKS = [
    { href: "#properties", label: "Properties" },
    { href: "#features", label: "Experience" },
    { href: "#pricing", label: "Pricing" },
] as const;

export const LANDING_TRUST_BRANDS = ["HILTON", "MARRIOTT", "HYATT", "AMAN", "ACCOR", "RITZ-CARLTON"] as const;

export const LANDING_PROPERTY_AVATAR_IDS = [21, 22, 23, 24, 25] as const;

export const LANDING_FEATURES = [
    {
        icon: "Zap",
        title: "Instant Feedback",
        description: "Guest requests reach your team in under 200ms. No waiting, no friction.",
    },
    {
        icon: "Smile",
        title: "Cognitive Fluency",
        description: "An interface designed for zero effort. If it is easy to use, it gets used more.",
    },
    {
        icon: "Users",
        title: "Staff Habit Loop",
        description: "Reward mechanisms that encourage staff to resolve requests faster.",
    },
] as const;

type LandingPricingPlan = {
    name: string;
    price: string;
    description: string;
    features: string[];
    accent: boolean;
    popular?: boolean;
};

export const LANDING_PRICING_PLANS: LandingPricingPlan[] = [
    {
        name: "Starter",
        price: "3,999",
        description: "For boutique hospitality",
        features: ["Up to 50 rooms", "Base Guest Experience", "Email Concierge", "Analytics Lite"],
        accent: false,
    },
    {
        name: "Professional",
        price: "8,999",
        description: "The Gold Standard",
        features: ["Unlimited rooms", "Full AI Automation", "Custom Branding", "Priority Support", "Staff Habit Engine"],
        accent: true,
        popular: true,
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "Global Hotel Chains",
        features: ["Multi-property Sync", "White-label Option", "Direct Integration", "Dedicated Account Mgr", "SOC2 Compliance"],
        accent: false,
    },
] as const;

export const LANDING_STAGGER_VARIANTS = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

export const LANDING_ITEM_VARIANT = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

const FALLBACK_HOTELS: LandingHotel[] = [
    { id: "1", name: "The Grand Royale", slug: "grand-royale", logoImage: null },
    { id: "2", name: "Azure Bay Resort", slug: "azure-bay", logoImage: null },
    { id: "3", name: "Mountain Lodge", slug: "mountain-lodge", logoImage: null },
];

const mapLandingHotel = (hotel: LandingHotelRow): LandingHotel => ({
    id: hotel.id,
    name: hotel.name,
    slug: hotel.slug,
    logoImage: hotel.logo_image,
});

export function useLandingHotels() {
    const [hotels, setHotels] = useState<LandingHotel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isActive = true;

        const loadHotels = async () => {
            try {
                const { data } = await supabase.from("hotels").select("id, name, slug, logo_image");
                const nextHotels =
                    Array.isArray(data) && data.length > 0
                        ? (data as LandingHotelRow[]).map(mapLandingHotel)
                        : FALLBACK_HOTELS;

                if (isActive) {
                    setHotels(nextHotels);
                }
            } catch {
                if (isActive) {
                    setHotels(FALLBACK_HOTELS);
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        void loadHotels();

        return () => {
            isActive = false;
        };
    }, []);

    return { hotels, loading };
}
