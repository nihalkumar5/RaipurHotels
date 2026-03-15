import { useEffect, useState } from "react";

import {
    DEMO_EVENTS,
    getDemoMenu,
    saveDemoMenu,
} from "@/lib/hotel/demo-store";
import { convertGDriveLink, generateLocalId, isDemoMode, isStorageOrHotelEvent } from "@/lib/hotel/helpers";
import type { MenuItem } from "@/lib/hotel/types";
import { supabase } from "@/lib/supabaseClient";

export function useSupabaseMenuItems(hotelId?: string) {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isActive = true;

        const loadMenuItems = async () => {
            if (!hotelId) {
                if (isActive) {
                    setLoading(false);
                }
                return;
            }

            if (isDemoMode()) {
                if (isActive) {
                    setMenuItems(getDemoMenu(hotelId));
                    setLoading(false);
                }
                return;
            }

            const { data } = await supabase
                .from("menu_items")
                .select("*")
                .eq("hotel_id", hotelId)
                .order("category", { ascending: true });

            if (isActive) {
                setMenuItems((data as MenuItem[]) ?? []);
                setLoading(false);
            }
        };

        void loadMenuItems();

        if (!hotelId) {
            return () => {
                isActive = false;
            };
        }

        if (isDemoMode()) {
            const handleUpdate = (event: Event) => {
                if (isActive && isStorageOrHotelEvent(event, hotelId)) {
                    setMenuItems(getDemoMenu(hotelId));
                }
            };

            window.addEventListener(DEMO_EVENTS.menu, handleUpdate);
            window.addEventListener("storage", handleUpdate);

            return () => {
                isActive = false;
                window.removeEventListener(DEMO_EVENTS.menu, handleUpdate);
                window.removeEventListener("storage", handleUpdate);
            };
        }

        const subscription = supabase
            .channel(`menu_items_${hotelId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "menu_items",
                    filter: `hotel_id=eq.${hotelId}`,
                },
                () => {
                    void loadMenuItems();
                },
            )
            .subscribe();

        return () => {
            isActive = false;
            supabase.removeChannel(subscription);
        };
    }, [hotelId]);

    return { menuItems, loading };
}

export async function saveSupabaseMenuItem(hotelId: string, item: Partial<MenuItem>) {
    const imageUrl = convertGDriveLink(item.image_url ?? "");

    if (isDemoMode()) {
        const items = getDemoMenu(hotelId);

        if (item.id) {
            saveDemoMenu(
                hotelId,
                items.map((entry) =>
                    entry.id === item.id
                        ? ({ ...entry, ...item, image_url: imageUrl } as MenuItem)
                        : entry,
                ),
            );
            return { data: null, error: null };
        }

        const newItem: MenuItem = {
            id: generateLocalId("menu"),
            hotel_id: hotelId,
            category: item.category ?? "",
            title: item.title ?? "",
            description: item.description,
            price: item.price ?? 0,
            image_url: imageUrl,
            is_available: item.is_available ?? true,
        };

        saveDemoMenu(hotelId, [...items, newItem]);
        return { data: newItem, error: null };
    }

    if (item.id) {
        return supabase
            .from("menu_items")
            .update({
                category: item.category,
                title: item.title,
                description: item.description,
                price: item.price,
                image_url: imageUrl,
                is_available: item.is_available,
            })
            .eq("id", item.id);
    }

    return supabase
        .from("menu_items")
        .insert([{ ...item, image_url: imageUrl, hotel_id: hotelId }]);
}

export async function deleteSupabaseMenuItem(id: string, hotelId: string) {
    if (isDemoMode()) {
        saveDemoMenu(
            hotelId,
            getDemoMenu(hotelId).filter((item) => item.id !== id),
        );
        return { error: null };
    }

    return supabase.from("menu_items").delete().eq("id", id);
}
