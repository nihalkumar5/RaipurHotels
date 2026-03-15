import { useEffect, useState } from "react";

import { convertGDriveLink, isDemoMode } from "@/lib/hotel/helpers";
import type { HotelBranding } from "@/lib/hotel/types";
import { supabase } from "@/lib/supabaseClient";

type HotelRow = {
    id: string;
    slug: string;
    name: string;
    city?: string | null;
    logo?: string | null;
    logo_image?: string | null;
    hero_image?: string | null;
    primary_color?: string | null;
    accent_color?: string | null;
    service_icon_color?: string | null;
    wifi_name?: string | null;
    wifi_password?: string | null;
    reception_phone?: string | null;
    concierge_whatsapp?: string | null;
    breakfast_start?: string | null;
    breakfast_end?: string | null;
    lunch_start?: string | null;
    lunch_end?: string | null;
    dinner_start?: string | null;
    dinner_end?: string | null;
    late_checkout_phone?: string | null;
    late_checkout_charge_1?: string | null;
    late_checkout_charge_2?: string | null;
    late_checkout_charge_3?: string | null;
    airport_transfer_charge_1?: string | null;
    airport_transfer_charge_2?: string | null;
    airport_transfer_charge_3?: string | null;
    checkout_message?: string | null;
    google_review_link?: string | null;
    welcome_message?: string | null;
};

const DEMO_BRANDING: Record<string, Partial<HotelBranding>> = {
    "grand-royale": { id: "00000000-0000-0000-0000-000000000001", name: "The Grand Royale", primaryColor: "#1e293b", accentColor: "#2563eb" },
    "azure-bay": { id: "00000000-0000-0000-0000-000000000002", name: "Azure Bay Resort", primaryColor: "#0891b2", accentColor: "#0ea5e9" },
    "mountain-lodge": { id: "00000000-0000-0000-0000-000000000003", name: "Mountain Lodge", primaryColor: "#166534", accentColor: "#22c55e" },
    babylon: { id: "00000000-0000-0000-0000-000000000004", name: "Babylon Raipur", primaryColor: "#1e3a8a", accentColor: "#3b82f6" },
};

const mapHotelRowToBranding = (row: HotelRow): HotelBranding => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    city: row.city ?? undefined,
    logo: row.logo ?? undefined,
    logoImage: row.logo_image ?? undefined,
    heroImage: row.hero_image ?? undefined,
    primaryColor: row.primary_color ?? "#2563eb",
    accentColor: row.accent_color ?? "#3b82f6",
    serviceIconColor: row.service_icon_color ?? undefined,
    wifiName: row.wifi_name ?? undefined,
    wifiPassword: row.wifi_password ?? undefined,
    receptionPhone: row.reception_phone ?? undefined,
    conciergeWhatsapp: row.concierge_whatsapp ?? undefined,
    breakfastStart: row.breakfast_start ?? undefined,
    breakfastEnd: row.breakfast_end ?? undefined,
    lunchStart: row.lunch_start ?? undefined,
    lunchEnd: row.lunch_end ?? undefined,
    dinnerStart: row.dinner_start ?? undefined,
    dinnerEnd: row.dinner_end ?? undefined,
    lateCheckoutPhone: row.late_checkout_phone ?? undefined,
    lateCheckoutCharge1: row.late_checkout_charge_1 ?? undefined,
    lateCheckoutCharge2: row.late_checkout_charge_2 ?? undefined,
    lateCheckoutCharge3: row.late_checkout_charge_3 ?? undefined,
    airportTransferCharge1: row.airport_transfer_charge_1 ?? undefined,
    airportTransferCharge2: row.airport_transfer_charge_2 ?? undefined,
    airportTransferCharge3: row.airport_transfer_charge_3 ?? undefined,
    checkoutMessage: row.checkout_message ?? undefined,
    googleReviewLink: row.google_review_link ?? undefined,
    welcomeMessage: row.welcome_message ?? undefined,
});

const normalizeOptionalText = (value?: string | null) => {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
};

const buildDemoBranding = (slug: string): HotelBranding => {
    const preset = DEMO_BRANDING[slug];

    if (preset) {
        return {
            slug,
            primaryColor: "#2563eb",
            accentColor: "#3b82f6",
            ...preset,
        } as HotelBranding;
    }

    return {
        id: `demo-${slug}`,
        slug,
        name: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "),
        primaryColor: "#2563eb",
        accentColor: "#3b82f6",
        receptionPhone: "+91 99999 99999",
    };
};

export function useHotelBranding(slug: string | undefined) {
    const [branding, setBranding] = useState<HotelBranding | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isActive = true;

        const loadBranding = async () => {
            if (!slug) {
                if (isActive) {
                    setLoading(false);
                }
                return;
            }

            try {
                const { data } = await supabase.from("hotels").select("*").eq("slug", slug).single();

                if (!isActive) {
                    return;
                }

                if (data) {
                    setBranding(mapHotelRowToBranding(data as HotelRow));
                } else if (isDemoMode()) {
                    setBranding(buildDemoBranding(slug));
                } else {
                    setBranding(null);
                }
            } catch {
                if (isActive) {
                    setBranding(isDemoMode() ? buildDemoBranding(slug) : null);
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        void loadBranding();

        if (!slug) {
            return () => {
                isActive = false;
            };
        }

        const subscription = supabase
            .channel(`hotel_branding_${slug}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "hotels",
                    filter: `slug=eq.${slug}`,
                },
                (payload: { new: HotelRow }) => {
                    const updatedRow = payload.new as HotelRow | undefined;
                    if (updatedRow && isActive) {
                        setBranding(mapHotelRowToBranding(updatedRow));
                    }
                },
            )
            .subscribe();

        return () => {
            isActive = false;
            supabase.removeChannel(subscription);
        };
    }, [slug]);

    return { branding, loading };
}

export async function saveHotelBranding(id: string, updates: Partial<HotelBranding>) {
    if (isDemoMode()) {
        return {
            data: null,
            error: {
                message: "Application is in Demo Mode. To save branding changes, set Supabase credentials in .env.local.",
                code: "DEMO_MODE",
            },
        };
    }

    const payload = {
        name: normalizeOptionalText(updates.name),
        city: normalizeOptionalText(updates.city),
        logo: updates.logo === undefined ? undefined : convertGDriveLink(updates.logo ?? ""),
        logo_image: updates.logoImage === undefined ? undefined : convertGDriveLink(updates.logoImage ?? ""),
        hero_image: updates.heroImage === undefined ? undefined : convertGDriveLink(updates.heroImage ?? ""),
        primary_color: updates.primaryColor,
        accent_color: updates.accentColor,
        service_icon_color: normalizeOptionalText(updates.serviceIconColor),
        wifi_name: normalizeOptionalText(updates.wifiName),
        wifi_password: normalizeOptionalText(updates.wifiPassword),
        reception_phone: normalizeOptionalText(updates.receptionPhone),
        concierge_whatsapp: normalizeOptionalText(updates.conciergeWhatsapp),
        breakfast_start: normalizeOptionalText(updates.breakfastStart),
        breakfast_end: normalizeOptionalText(updates.breakfastEnd),
        lunch_start: normalizeOptionalText(updates.lunchStart),
        lunch_end: normalizeOptionalText(updates.lunchEnd),
        dinner_start: normalizeOptionalText(updates.dinnerStart),
        dinner_end: normalizeOptionalText(updates.dinnerEnd),
        late_checkout_phone: normalizeOptionalText(updates.lateCheckoutPhone),
        late_checkout_charge_1: normalizeOptionalText(updates.lateCheckoutCharge1),
        late_checkout_charge_2: normalizeOptionalText(updates.lateCheckoutCharge2),
        late_checkout_charge_3: normalizeOptionalText(updates.lateCheckoutCharge3),
        airport_transfer_charge_1: normalizeOptionalText(updates.airportTransferCharge1),
        airport_transfer_charge_2: normalizeOptionalText(updates.airportTransferCharge2),
        airport_transfer_charge_3: normalizeOptionalText(updates.airportTransferCharge3),
        checkout_message: normalizeOptionalText(updates.checkoutMessage),
        google_review_link: normalizeOptionalText(updates.googleReviewLink),
        welcome_message: normalizeOptionalText(updates.welcomeMessage),
    };

    return supabase
        .from("hotels")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single()
        .then((result: { data: HotelRow | null; error: { message?: string } | null }) => ({
            data: result.data ? mapHotelRowToBranding(result.data) : null,
            error: result.error,
        }));
}
