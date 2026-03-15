import type { HotelRequest, RequestStatus, Room, UserProfile } from "@/lib/hotel/types";

export type DepartmentRole = "admin" | "reception" | "kitchen" | "housekeeping" | "staff";

const KITCHEN_KEYWORDS = [
    "water",
    "dining",
    "restaurant",
    "room service",
    "food",
    "tea",
    "coffee",
    "breakfast",
    "lunch",
    "dinner",
    "mini bar",
    "minibar",
];

const HOUSEKEEPING_KEYWORDS = [
    "housekeeping",
    "laundry",
    "cleaning",
    "towel",
    "towels",
    "pillow",
    "pillows",
    "linen",
    "bedsheet",
    "bed sheet",
];

export const normalizeRoomLabel = (roomLabel?: string | null) => {
    if (!roomLabel) {
        return "";
    }

    const digits = roomLabel.match(/\d+/g)?.join("") ?? "";
    return digits || roomLabel.trim().toUpperCase();
};

export const getFloorFromRoomLabel = (roomLabel?: string | null) => {
    const normalized = normalizeRoomLabel(roomLabel);

    if (!normalized || !/^\d+$/.test(normalized)) {
        return null;
    }

    if (normalized.length <= 2) {
        return Number(normalized.charAt(0)) || 1;
    }

    return Number(normalized.slice(0, -2)) || 1;
};

export const getRequestDepartment = (type: string): Exclude<DepartmentRole, "admin" | "staff"> => {
    const loweredType = type.toLowerCase();

    if (KITCHEN_KEYWORDS.some((keyword) => loweredType.includes(keyword))) {
        return "kitchen";
    }

    if (HOUSEKEEPING_KEYWORDS.some((keyword) => loweredType.includes(keyword))) {
        return "housekeeping";
    }

    return "reception";
};

export const filterRequestsForDepartment = (
    requests: HotelRequest[],
    department: DepartmentRole,
) => {
    if (department === "admin") {
        return requests;
    }

    if (department === "staff") {
        return [];
    }

    return requests.filter((request) => getRequestDepartment(request.type) === department);
};

export const getDepartmentLabel = (request: HotelRequest) => {
    const department = getRequestDepartment(request.type);

    if (department === "kitchen") {
        return "Kitchen";
    }

    if (department === "housekeeping") {
        return "Housekeeping";
    }

    return "Reception";
};

export const getRoleHomeRoute = (hotelSlug: string, role?: DepartmentRole) => {
    switch (role) {
        case "admin":
            return `/${hotelSlug}/admin/dashboard`;
        case "kitchen":
            return `/${hotelSlug}/admin/kitchen`;
        case "housekeeping":
            return `/${hotelSlug}/admin/housekeeping`;
        case "reception":
            return `/${hotelSlug}/admin/reception`;
        default:
            return `/${hotelSlug}/admin/login`;
    }
};

export const groupRoomsByFloor = (rooms: Room[], requests: HotelRequest[]) => {
    const roomMap = new Map<string, Room>();

    rooms.forEach((room) => {
        roomMap.set(normalizeRoomLabel(room.room_number), room);
    });

    requests.forEach((request) => {
        const normalizedRoom = normalizeRoomLabel(request.room);

        if (!normalizedRoom || roomMap.has(normalizedRoom)) {
            return;
        }

        roomMap.set(normalizedRoom, {
            id: `virtual-${normalizedRoom}`,
            hotel_id: request.hotel_id,
            room_number: normalizedRoom,
            booking_pin: null,
            is_occupied: false,
        });
    });

    const floors = new Map<number, Room[]>();

    Array.from(roomMap.values())
        .sort((first, second) =>
            normalizeRoomLabel(first.room_number).localeCompare(normalizeRoomLabel(second.room_number), undefined, {
                numeric: true,
                sensitivity: "base",
            }),
        )
        .forEach((room) => {
            const floor = getFloorFromRoomLabel(room.room_number) ?? 1;
            const currentRooms = floors.get(floor) ?? [];
            currentRooms.push(room);
            floors.set(floor, currentRooms);
        });

    return Array.from(floors.entries())
        .sort((first, second) => first[0] - second[0])
        .map(([floor, floorRooms]) => ({
            floor,
            rooms: floorRooms,
        }));
};

export const getRoomSignalSummary = (requests: HotelRequest[], roomNumber: string) => {
    const normalizedRoom = normalizeRoomLabel(roomNumber);
    const roomRequests = requests.filter(
        (request) =>
            normalizeRoomLabel(request.room) === normalizedRoom &&
            request.status !== "Completed" &&
            request.status !== "Rejected",
    );

    return {
        pendingCount: roomRequests.filter((request) => request.status === "Pending").length,
        activeCount: roomRequests.filter(
            (request) => request.status === "Assigned" || request.status === "In Progress",
        ).length,
        requests: roomRequests.sort((first, second) => second.timestamp - first.timestamp),
    };
};

export const canManageStatus = (role: DepartmentRole, request: HotelRequest, nextStatus: RequestStatus) => {
    if (role === "admin") {
        return true;
    }

    if (role === "staff") {
        return false;
    }

    const requestDepartment = getRequestDepartment(request.type);

    if (requestDepartment !== role) {
        return false;
    }

    return ["Assigned", "In Progress", "Completed", "Rejected"].includes(nextStatus);
};

export const getRoleFromProfile = (profile: UserProfile | null, isDemo: boolean): DepartmentRole => {
    if (profile?.role) {
        return profile.role;
    }

    return isDemo ? "admin" : "staff";
};
