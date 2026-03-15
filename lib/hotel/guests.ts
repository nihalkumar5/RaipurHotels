import { useEffect, useState } from "react";

import {
    DEMO_EVENTS,
    getDemoGuests,
    getDemoRooms,
    saveDemoGuests,
    saveDemoRooms,
} from "@/lib/hotel/demo-store";
import {
    generateLocalId,
    isDemoMode,
    isMissingTableError,
    isStorageOrHotelEvent,
} from "@/lib/hotel/helpers";
import type { Guest } from "@/lib/hotel/types";
import { updateRoomStatus } from "@/lib/hotel/rooms";
import { supabase } from "@/lib/supabaseClient";

export const addGuest = async (guestData: Omit<Guest, "id" | "status">) => {
    if (isDemoMode()) {
        const guests = getDemoGuests(guestData.hotel_id);
        const newGuest: Guest = {
            ...guestData,
            id: generateLocalId(),
            status: "active",
        };

        saveDemoGuests(
            guestData.hotel_id,
            [...guests.filter((guest) => guest.room_number !== guestData.room_number), newGuest],
        );

        saveDemoRooms(
            guestData.hotel_id,
            getDemoRooms(guestData.hotel_id).map((room) =>
                room.room_number === guestData.room_number ? { ...room, is_occupied: true } : room,
            ),
        );

        return { data: newGuest, error: null, pin: null };
    }

    try {
        const { data, error } = await supabase
            .from("guests")
            .insert([{ ...guestData, status: "active" }])
            .select()
            .single();

        if (error) {
            if (isMissingTableError(error)) {
                const guests = getDemoGuests(guestData.hotel_id);
                const newGuest: Guest = { ...guestData, id: generateLocalId(), status: "active" };
                saveDemoGuests(guestData.hotel_id, [...guests, newGuest]);
                return { data: newGuest, error: null, pin: null };
            }

            throw error;
        }

        const roomUpdate = await updateRoomStatus(guestData.hotel_id, guestData.room_number, true);
        return { data: data as Guest, error: null, pin: roomUpdate.pin ?? null };
    } catch (error) {
        return { data: null, error, pin: null };
    }
};

export const getHotelGuests = async (hotelId: string) => {
    if (isDemoMode()) {
        return { data: getDemoGuests(hotelId), error: null };
    }

    try {
        const { data, error } = await supabase
            .from("guests")
            .select("*")
            .eq("hotel_id", hotelId)
            .eq("status", "active");

        if (error) {
            if (isMissingTableError(error)) {
                return { data: getDemoGuests(hotelId), error: null };
            }

            throw error;
        }

        return { data: (data as Guest[]) ?? [], error: null };
    } catch {
        return { data: getDemoGuests(hotelId), error: null };
    }
};

export function useActiveGuests(hotelId?: string) {
    const [guests, setGuests] = useState<Guest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isActive = true;

        const loadGuests = async () => {
            if (!hotelId) {
                if (isActive) {
                    setLoading(false);
                }
                return;
            }

            if (isDemoMode()) {
                if (isActive) {
                    setGuests(getDemoGuests(hotelId).filter((guest) => guest.status === "active"));
                    setLoading(false);
                }
                return;
            }

            try {
                const { data, error } = await supabase
                    .from("guests")
                    .select("*")
                    .eq("hotel_id", hotelId)
                    .eq("status", "active")
                    .order("created_at", { ascending: false });

                if (!isActive) {
                    return;
                }

                if (error) {
                    if (isMissingTableError(error)) {
                        setGuests(getDemoGuests(hotelId).filter((guest) => guest.status === "active"));
                    } else {
                        setGuests([]);
                    }
                } else {
                    setGuests((data as Guest[]) ?? []);
                }
            } catch {
                if (isActive) {
                    setGuests(getDemoGuests(hotelId).filter((guest) => guest.status === "active"));
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        void loadGuests();

        if (!hotelId) {
            return () => {
                isActive = false;
            };
        }

        if (isDemoMode()) {
            const handleUpdate = (event: Event) => {
                if (isActive && isStorageOrHotelEvent(event, hotelId)) {
                    setGuests(getDemoGuests(hotelId).filter((guest) => guest.status === "active"));
                }
            };

            window.addEventListener(DEMO_EVENTS.guests, handleUpdate);
            window.addEventListener("storage", handleUpdate);

            return () => {
                isActive = false;
                window.removeEventListener(DEMO_EVENTS.guests, handleUpdate);
                window.removeEventListener("storage", handleUpdate);
            };
        }

        const subscription = supabase
            .channel(`hotel_guests_${hotelId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "guests",
                    filter: `hotel_id=eq.${hotelId}`,
                },
                () => {
                    void loadGuests();
                },
            )
            .subscribe();

        return () => {
            isActive = false;
            supabase.removeChannel(subscription);
        };
    }, [hotelId]);

    return { guests, loading };
}

export const deleteGuest = async (guestId: string, hotelId: string, roomNumber: string) => {
    if (isDemoMode() || guestId.startsWith("local-")) {
        saveDemoGuests(
            hotelId,
            getDemoGuests(hotelId).filter((guest) => guest.id !== guestId),
        );
        saveDemoRooms(
            hotelId,
            getDemoRooms(hotelId).map((room) =>
                room.room_number === roomNumber ? { ...room, is_occupied: false } : room,
            ),
        );
        return { error: null };
    }

    try {
        const { error } = await supabase
            .from("guests")
            .update({ status: "checked_out", check_out_date: new Date().toISOString() })
            .eq("id", guestId);

        if (error) {
            if (isMissingTableError(error)) {
                saveDemoGuests(
                    hotelId,
                    getDemoGuests(hotelId).filter((guest) => guest.id !== guestId),
                );
                saveDemoRooms(
                    hotelId,
                    getDemoRooms(hotelId).map((room) =>
                        room.room_number === roomNumber ? { ...room, is_occupied: false } : room,
                    ),
                );
                return { error: null };
            }

            throw error;
        }

        await updateRoomStatus(hotelId, roomNumber, false);
        return { error: null };
    } catch (error) {
        return { error };
    }
};

export const getActiveGuestByRoom = async (hotelId: string, roomNumber: string) => {
    if (isDemoMode()) {
        const guest = getDemoGuests(hotelId).find(
            (item) => item.room_number === roomNumber && item.status === "active",
        );
        return { data: guest ?? null, error: null };
    }

    const { data, error } = await supabase
        .from("guests")
        .select("*")
        .eq("hotel_id", hotelId)
        .eq("room_number", roomNumber)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    return { data: (data as Guest | null) ?? null, error };
};
