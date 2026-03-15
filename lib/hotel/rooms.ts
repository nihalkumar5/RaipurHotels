import { useEffect, useState } from "react";

import {
    DEMO_EVENTS,
    getDemoRooms,
    saveDemoRooms,
} from "@/lib/hotel/demo-store";
import {
    generateBookingPin,
    generateLocalId,
    isDemoMode,
    isMissingTableError,
    isStorageOrHotelEvent,
} from "@/lib/hotel/helpers";
import type { Room } from "@/lib/hotel/types";
import { supabase } from "@/lib/supabaseClient";

export const getHotelRooms = async (hotelId: string) => {
    if (isDemoMode()) {
        return { data: getDemoRooms(hotelId), error: null };
    }

    try {
        const { data, error } = await supabase
            .from("rooms")
            .select("*")
            .eq("hotel_id", hotelId)
            .order("room_number", { ascending: true });

        if (error) {
            if (isMissingTableError(error)) {
                return { data: getDemoRooms(hotelId), error: null };
            }

            throw error;
        }

        return { data: (data as Room[]) ?? [], error: null };
    } catch {
        return { data: getDemoRooms(hotelId), error: null };
    }
};

export const updateRoomStatus = async (hotelId: string, roomNumber: string, isOccupied: boolean) => {
    try {
        const { data, error } = await supabase
            .from("rooms")
            .select("id, booking_pin")
            .eq("hotel_id", hotelId)
            .eq("room_number", roomNumber);

        if (error) {
            throw error;
        }

        const room = Array.isArray(data) ? data[0] : null;
        if (!room) {
            return { error: "Room not found", pin: null };
        }

        const pin = isOccupied ? room.booking_pin ?? generateBookingPin() : null;
        const { error: updateError } = await supabase
            .from("rooms")
            .update({
                is_occupied: isOccupied,
                booking_pin: pin,
                checked_in_at: isOccupied ? Date.now() : null,
            })
            .eq("id", room.id);

        return { error: updateError, pin };
    } catch (error) {
        return { error, pin: null };
    }
};

export function useRooms(hotelId?: string) {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isActive = true;

        const loadRooms = async () => {
            if (!hotelId) {
                if (isActive) {
                    setLoading(false);
                }
                return;
            }

            if (isDemoMode()) {
                if (isActive) {
                    setRooms(getDemoRooms(hotelId));
                    setLoading(false);
                }
                return;
            }

            const { data } = await supabase
                .from("rooms")
                .select("*")
                .eq("hotel_id", hotelId)
                .order("room_number", { ascending: true });

            if (isActive) {
                setRooms((data as Room[]) ?? []);
                setLoading(false);
            }
        };

        void loadRooms();

        if (!hotelId) {
            return () => {
                isActive = false;
            };
        }

        if (isDemoMode()) {
            const handleUpdate = (event: Event) => {
                if (isActive && isStorageOrHotelEvent(event, hotelId)) {
                    setRooms(getDemoRooms(hotelId));
                }
            };

            window.addEventListener(DEMO_EVENTS.rooms, handleUpdate);
            window.addEventListener("storage", handleUpdate);

            return () => {
                isActive = false;
                window.removeEventListener(DEMO_EVENTS.rooms, handleUpdate);
                window.removeEventListener("storage", handleUpdate);
            };
        }

        const subscription = supabase
            .channel(`hotel_rooms_${hotelId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "rooms",
                    filter: `hotel_id=eq.${hotelId}`,
                },
                () => {
                    void loadRooms();
                },
            )
            .subscribe();

        return () => {
            isActive = false;
            supabase.removeChannel(subscription);
        };
    }, [hotelId]);

    return { rooms, loading };
}

export const addRoom = async (hotelId: string, roomNumber: string) => {
    if (isDemoMode()) {
        const rooms = getDemoRooms(hotelId);
        if (rooms.some((room) => room.room_number === roomNumber)) {
            return { data: null, error: { message: "Room already exists" } };
        }

        const newRoom: Room = {
            id: `r-${generateLocalId("room")}`,
            hotel_id: hotelId,
            room_number: roomNumber,
            is_occupied: false,
            booking_pin: null,
            created_at: new Date().toISOString(),
        };

        saveDemoRooms(hotelId, [...rooms, newRoom]);
        return { data: newRoom, error: null };
    }

    return supabase
        .from("rooms")
        .insert([{ hotel_id: hotelId, room_number: roomNumber }])
        .select()
        .single();
};

export const deleteRoom = async (roomId: string, hotelId: string) => {
    if (isDemoMode()) {
        saveDemoRooms(
            hotelId,
            getDemoRooms(hotelId).filter((room) => room.id !== roomId),
        );
        return { error: null };
    }

    return supabase.from("rooms").delete().eq("id", roomId).eq("hotel_id", hotelId);
};

export const checkInRoom = async (
    roomId: string,
    hotelId: string,
    checkoutDate?: string,
    checkoutTime?: string,
    numGuests = 1,
) => {
    const pin = generateBookingPin();

    if (isDemoMode()) {
        saveDemoRooms(
            hotelId,
            getDemoRooms(hotelId).map((room) =>
                room.id === roomId
                    ? {
                          ...room,
                          is_occupied: true,
                          booking_pin: pin,
                          checkout_date: checkoutDate,
                          checkout_time: checkoutTime,
                          num_guests: numGuests,
                          checked_in_at: Date.now(),
                      }
                    : room,
            ),
        );
        return { data: null, error: null, pin };
    }

    const { data, error } = await supabase
        .from("rooms")
        .update({
            is_occupied: true,
            booking_pin: pin,
            checkout_date: checkoutDate,
            checkout_time: checkoutTime,
            num_guests: numGuests,
            checked_in_at: Date.now(),
        })
        .eq("id", roomId)
        .eq("hotel_id", hotelId);

    return { data, error, pin };
};

const createClearedRoom = (room: Room) => ({
    ...room,
    is_occupied: false,
    booking_pin: null,
    checkout_date: undefined,
    checkout_time: undefined,
    num_guests: undefined,
    checked_in_at: null,
});

export const checkOutRoom = async (roomId: string, hotelId: string) => {
    if (isDemoMode()) {
        saveDemoRooms(
            hotelId,
            getDemoRooms(hotelId).map((room) => (room.id === roomId ? createClearedRoom(room) : room)),
        );
        return { data: null, error: null };
    }

    return supabase
        .from("rooms")
        .update({
            is_occupied: false,
            booking_pin: null,
            checkout_date: null,
            checkout_time: null,
            num_guests: null,
            checked_in_at: null,
        })
        .eq("id", roomId)
        .eq("hotel_id", hotelId);
};

export const checkOutRoomByNumber = async (hotelId: string, roomNumber: string) => {
    if (isDemoMode()) {
        saveDemoRooms(
            hotelId,
            getDemoRooms(hotelId).map((room) =>
                room.room_number === roomNumber ? createClearedRoom(room) : room,
            ),
        );
        return { data: null, error: null };
    }

    return supabase
        .from("rooms")
        .update({
            is_occupied: false,
            booking_pin: null,
            checkout_date: null,
            checkout_time: null,
            num_guests: null,
            checked_in_at: null,
        })
        .eq("hotel_id", hotelId)
        .eq("room_number", roomNumber);
};

export const verifyBookingPin = async (
    hotelId: string,
    roomNumber: string,
    pin: string,
): Promise<{ success: true; data: Room } | { success: false; data: null }> => {
    if (isDemoMode()) {
        const room = getDemoRooms(hotelId).find(
            (item) =>
                item.room_number === roomNumber &&
                item.booking_pin === pin &&
                item.is_occupied,
        );

        return room ? { success: true, data: room } : { success: false, data: null };
    }

    const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("hotel_id", hotelId)
        .eq("room_number", roomNumber)
        .eq("booking_pin", pin)
        .eq("is_occupied", true)
        .limit(1);

    if (error) {
        return { success: false, data: null };
    }

    const room = Array.isArray(data) ? (data[0] as Room | undefined) : undefined;
    return room ? { success: true, data: room } : { success: false, data: null };
};
