export const isDemoMode = () => {
    if (process.env.NEXT_PUBLIC_FORCE_DEMO === "true") {
        return true;
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const isMissing = !url || !key;
    const isPlaceholder = url?.includes("your-project-id") || key?.includes("your-anon-key");

    return isMissing || isPlaceholder;
};

export const sanitizePhoneForWA = (phone: string) => {
    const numeric = phone.replace(/[^0-9]/g, "");

    if (numeric.length === 10) {
        return `91${numeric}`;
    }

    if (numeric.length === 12 && numeric.startsWith("91")) {
        return numeric;
    }

    return numeric;
};

export const convertGDriveLink = (url: string) => {
    if (!url) {
        return url;
    }

    const fileIdMatch = url.match(/\/file\/d\/([^/]+)/);
    if (fileIdMatch?.[1]) {
        return `https://lh3.googleusercontent.com/u/0/d/${fileIdMatch[1]}`;
    }

    const idMatch = url.match(/[?&]id=([^&]+)/);
    if (url.includes("drive.google.com") && idMatch?.[1]) {
        return `https://lh3.googleusercontent.com/u/0/d/${idMatch[1]}`;
    }

    return url;
};

export const generateLocalId = (prefix = "local") =>
    `${prefix}-${Math.random().toString(36).slice(2, 11)}`;

export const generateBookingPin = () =>
    Math.floor(1000 + Math.random() * 9000).toString();

export const getRequestTimestampLabel = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const isStorageOrHotelEvent = (event: Event, hotelId: string) => {
    if (event.type === "storage") {
        return true;
    }

    const customEvent = event as CustomEvent<{ hotelId?: string }>;
    return customEvent.detail?.hotelId === hotelId;
};

export const isMissingTableError = (error: unknown) => {
    if (!error || typeof error !== "object") {
        return false;
    }

    const candidate = error as { code?: string; message?: string };
    return candidate.code === "PGRST204" || candidate.message?.includes("not found") === true;
};
