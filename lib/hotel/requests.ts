import { useEffect, useState } from "react";

import {
    DEMO_EVENTS,
    findHotelIdForDemoRequest,
    getDemoRequests,
    getDemoRooms,
    saveDemoRequests,
    saveDemoRooms,
} from "@/lib/hotel/demo-store";
import {
    generateLocalId,
    getRequestTimestampLabel,
    isDemoMode,
    isStorageOrHotelEvent,
} from "@/lib/hotel/helpers";
import type { HotelRequest, RequestStatus } from "@/lib/hotel/types";
import { supabase } from "@/lib/supabaseClient";

const filterRequests = (
    requests: HotelRequest[],
    roomNumber?: string,
    checkedInAt?: number | null,
) => {
    let nextRequests = roomNumber ? requests.filter((request) => request.room === roomNumber) : requests;

    if (checkedInAt) {
        nextRequests = nextRequests.filter((request) => request.timestamp >= checkedInAt);
    }

    return nextRequests;
};

export function useSupabaseRequests(hotelId?: string, roomNumber?: string, checkedInAt?: number | null) {
    const [requests, setRequests] = useState<HotelRequest[]>([]);

    useEffect(() => {
        let isActive = true;

        const loadRequests = async () => {
            if (!hotelId) {
                return;
            }

            if (isDemoMode()) {
                if (isActive) {
                    setRequests(filterRequests(getDemoRequests(hotelId), roomNumber, checkedInAt));
                }
                return;
            }

            let query = supabase.from("requests").select("*").eq("hotel_id", hotelId);

            if (roomNumber) {
                query = query.eq("room", roomNumber);
            }

            if (checkedInAt) {
                query = query.gte("timestamp", checkedInAt);
            }

            const { data } = await query.order("timestamp", { ascending: false });

            if (isActive) {
                setRequests((data as HotelRequest[]) ?? []);
            }
        };

        void loadRequests();

        if (!hotelId) {
            return () => {
                isActive = false;
            };
        }

        if (isDemoMode()) {
            const handleUpdate = (event: Event) => {
                if (isActive && isStorageOrHotelEvent(event, hotelId)) {
                    setRequests(filterRequests(getDemoRequests(hotelId), roomNumber, checkedInAt));
                }
            };

            window.addEventListener(DEMO_EVENTS.requests, handleUpdate);
            window.addEventListener("storage", handleUpdate);

            return () => {
                isActive = false;
                window.removeEventListener(DEMO_EVENTS.requests, handleUpdate);
                window.removeEventListener("storage", handleUpdate);
            };
        }

        const subscription = supabase
            .channel(`hotel_requests_${hotelId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "requests",
                    filter: `hotel_id=eq.${hotelId}`,
                },
                () => {
                    void loadRequests();
                },
            )
            .subscribe();

        return () => {
            isActive = false;
            supabase.removeChannel(subscription);
        };
    }, [checkedInAt, hotelId, roomNumber]);

    return requests;
}

export async function addSupabaseRequest(hotelId: string, request: Partial<HotelRequest>) {
    if (!isDemoMode() && (!hotelId || hotelId.length < 20)) {
        return { data: null, error: { message: "Invalid Hotel Configuration (Production)" } };
    }

    const newRequestData: Omit<HotelRequest, "id"> = {
        hotel_id: hotelId,
        room: request.room || "Unknown",
        type: request.type || "Request",
        notes: request.notes,
        status: request.status || "Pending",
        price: request.price || 0,
        total: request.total || 0,
        timestamp: Date.now(),
        time: getRequestTimestampLabel(),
        is_paid: request.is_paid || false,
    };

    if (isDemoMode()) {
        const demoRequest: HotelRequest = { ...newRequestData, id: generateLocalId("request") };
        saveDemoRequests(hotelId, [demoRequest, ...getDemoRequests(hotelId)]);
        return { data: demoRequest, error: null };
    }

    return supabase.from("requests").insert([newRequestData]).select().single();
}

export async function updateSupabaseRequestStatus(id: string, status: RequestStatus) {
    if (isDemoMode()) {
        const hotelId = findHotelIdForDemoRequest(id);
        if (!hotelId) {
            return { data: null, error: null };
        }

        saveDemoRequests(
            hotelId,
            getDemoRequests(hotelId).map((request) =>
                request.id === id ? { ...request, status } : request,
            ),
        );
        return { data: null, error: null };
    }

    return supabase.from("requests").update({ status }).eq("id", id);
}

export async function approveLateCheckout(
    requestId: string,
    hotelId: string,
    roomNumber: string,
    newTime = "1:00 PM",
) {
    if (isDemoMode()) {
        saveDemoRequests(
            hotelId,
            getDemoRequests(hotelId).map((request) =>
                request.id === requestId ? { ...request, status: "Completed" } : request,
            ),
        );
        saveDemoRooms(
            hotelId,
            getDemoRooms(hotelId).map((room) =>
                room.room_number === roomNumber ? { ...room, checkout_time: newTime } : room,
            ),
        );
        return { error: null };
    }

    try {
        const { error: requestError } = await supabase
            .from("requests")
            .update({ status: "Completed" })
            .eq("id", requestId);

        if (requestError) {
            throw requestError;
        }

        const { error: roomError } = await supabase
            .from("rooms")
            .update({ checkout_time: newTime })
            .eq("hotel_id", hotelId)
            .eq("room_number", roomNumber);

        if (roomError) {
            throw roomError;
        }

        return { error: null };
    } catch (error) {
        return { error };
    }
}

export const rejectSupabaseRequest = async (id: string) =>
    updateSupabaseRequestStatus(id, "Rejected");

export const settleRoomRequests = async (hotelId: string, room: string) => {
    if (isDemoMode()) {
        saveDemoRequests(
            hotelId,
            getDemoRequests(hotelId).map((request) =>
                request.room === room ? { ...request, is_paid: true } : request,
            ),
        );
        return { data: null, error: null };
    }

    return supabase
        .from("requests")
        .update({ is_paid: true })
        .eq("hotel_id", hotelId)
        .eq("room", room);
};
