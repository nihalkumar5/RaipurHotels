"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle,
    ArrowRight,
    BedDouble,
    BellRing,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Coffee,
    ConciergeBell,
    Droplets,
    MapPin,
    PhoneCall,
    LogOut,
    ShieldCheck,
    Shirt,
    Sparkles,
    UtensilsCrossed,
    Waves,
    Wifi,
    Wrench,
    type LucideIcon,
} from "lucide-react";

import { Toast } from "@/components/Toast";
import { addSupabaseRequest, useHotelBranding, useSpecialOffers, useSupabaseRequests } from "@/utils/store";
import { useGuestRoom } from "../GuestAuthWrapper";

type ServiceSelection = {
    label: string;
    internalName: string;
    icon: LucideIcon;
    accent: string;
    hasOptions?: boolean;
    selectedOption?: string | null;
    step: "type" | "quantity";
};

type ServiceTile = {
    label: string;
    description: string;
    icon: LucideIcon;
    accent: string;
    internalName?: string;
    path?: string;
    notes?: string;
    hasOptions?: boolean;
};

const heroImage =
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80";

const formatDateLabel = (value?: string) => {
    if (!value) {
        return "Open stay";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
    });
};

const formatTimeLabel = (value?: string) => value || "11:00 AM";

const getStatusCopy = (type: string, status: string) => {
    if (status === "Pending") {
        return "Received";
    }

    if (status === "In Progress") {
        if (type === "Cleaning") return "Team on the way";
        if (type === "Late Checkout") return "Under review";
        if (type.includes("Tea") || type.includes("Coffee")) return "Being prepared";
        return "In service";
    }

    return status;
};

const getRequestIcon = (type: string) => {
    const lowerType = type.toLowerCase();

    if (lowerType.includes("water")) return Droplets;
    if (lowerType.includes("tea") || lowerType.includes("coffee")) return Coffee;
    if (lowerType.includes("clean") || lowerType.includes("housekeeping")) return Sparkles;
    if (lowerType.includes("laundry")) return Shirt;
    if (lowerType.includes("late checkout")) return Clock3;
    return BellRing;
};

export default function GuestDashboard() {
    const router = useRouter();
    const params = useParams();
    const hotelSlug = params?.hotel_slug as string;

    const { roomNumber, checkoutDate, checkoutTime, numGuests, checkedInAt, logout } = useGuestRoom();
    const { branding, loading } = useHotelBranding(hotelSlug);
    const { offers } = useSpecialOffers(branding?.id);
    const requests = useSupabaseRequests(branding?.id, roomNumber, checkedInAt);

    const [activeService, setActiveService] = useState<ServiceSelection | null>(null);
    const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
    const [submittingType, setSubmittingType] = useState<string | null>(null);
    const [scrolled, setScrolled] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error"; isVisible: boolean }>({
        message: "",
        type: "success",
        isVisible: false,
    });

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 28);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const activeRequests = requests.filter(
        (request) => request.status === "Pending" || request.status === "In Progress",
    );

    const handleQuickRequest = async (type: string, notes: string) => {
        if (!branding?.id || submittingType) return;

        setSubmittingType(type);

        const { error } = await addSupabaseRequest(branding.id, {
            room: roomNumber,
            type,
            notes,
            status: "Pending",
            price: 0,
            total: 0,
        });

        setSubmittingType(null);

        if (error) {
            const message =
                typeof error === "object" && error && "message" in error
                    ? String(error.message)
                    : "Request failed. Please try again.";

            setToast({ message, type: "error", isVisible: true });
            return;
        }

        const successMessages: Record<string, string> = {
            Cleaning: "Housekeeping has been notified.",
            "Late Checkout": "Late checkout request sent to reception.",
            Maintenance: "Maintenance request has been logged.",
            Reception: "Reception has been notified.",
            Towels: "Fresh towels are on the way.",
            "Tea / Coffee": "Your beverage request is being prepared.",
            "Mineral Water": "Water request received.",
        };

        setToast({
            message: successMessages[type] ?? `${type} request placed successfully.`,
            type: "success",
            isVisible: true,
        });
    };

    const openServiceSelection = (service: ServiceTile) => {
        if (service.path) {
            router.push(`/${hotelSlug}/guest/${service.path}`);
            return;
        }

        if (!service.internalName) {
            return;
        }

        setActiveService({
            label: service.label,
            internalName: service.internalName,
            icon: service.icon,
            accent: service.accent,
            hasOptions: service.hasOptions,
            selectedOption: null,
            step: service.hasOptions ? "type" : "quantity",
        });
    };

    const confirmQuantity = (quantity: number) => {
        if (!activeService) return;

        const finalLabel = activeService.selectedOption || activeService.label;
        handleQuickRequest(
            activeService.internalName,
            `${finalLabel} (Qty: ${quantity}) requested`,
        );
        setActiveService(null);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f7efe6]">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2E241C] border-t-transparent" />
            </div>
        );
    }

    const primaryActions: ServiceTile[] = [
        {
            label: "Wi-Fi Access",
            description: "Connect instantly",
            icon: Wifi,
            accent: "#B88952",
            path: "wifi",
        },
        {
            label: "In-Room Dining",
            description: "Menus and orders",
            icon: UtensilsCrossed,
            accent: "#7A4732",
            path: "restaurant",
        },
        {
            label: "Front Desk",
            description: branding?.receptionPhone ? "Call reception" : "Quick help",
            icon: ConciergeBell,
            accent: "#395F73",
            internalName: "Reception",
            notes: "Guest requested reception assistance",
        },
        {
            label: "Hotel Services",
            description: "Explore everything",
            icon: Waves,
            accent: "#1E3A46",
            path: "services",
        },
    ];

    const serviceTiles: ServiceTile[] = [
        {
            label: "Tea / Coffee",
            description: "Freshly prepared",
            icon: Coffee,
            accent: "#8B5E3C",
            internalName: "Tea / Coffee",
            hasOptions: true,
        },
        {
            label: "Mineral Water",
            description: "Chilled or regular",
            icon: Droplets,
            accent: "#4E8EA7",
            internalName: "Mineral Water",
        },
        {
            label: "Fresh Towels",
            description: "Delivered to room",
            icon: Shirt,
            accent: "#667B75",
            internalName: "Towels",
        },
        {
            label: "Housekeeping",
            description: "Refresh the room",
            icon: Sparkles,
            accent: "#AA7B41",
            internalName: "Cleaning",
        },
        {
            label: "Maintenance",
            description: "Fix an issue",
            icon: Wrench,
            accent: "#8C3B3B",
            internalName: "Maintenance",
        },
        {
            label: "Late Checkout",
            description: "Request extension",
            icon: Clock3,
            accent: "#A62626",
            internalName: "Late Checkout",
        },
    ];

    const currentOffer = offers[currentOfferIndex];

    return (
        <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_#fff9f1_0%,_#f7efe6_48%,_#f3eadf_100%)] text-[#18120D]">
            <AnimatePresence>
                {scrolled && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 rounded-full border border-white/50 bg-[rgba(24,18,13,0.82)] px-4 py-3 text-white shadow-2xl backdrop-blur-xl"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[#D9B47D]/70">
                                    Glass Guest Portal
                                </p>
                                <p className="text-sm font-black tracking-tight">
                                    {branding?.name || "Hotel"} · Room {roomNumber || "--"}
                                </p>
                            </div>
                            <button
                                onClick={logout}
                                className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/80"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                Logout
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mx-auto max-w-[520px] pb-28">
                <section className="relative px-4 pt-4">
                    <div className="relative h-[300px] overflow-hidden rounded-[2rem] shadow-[0_28px_80px_rgba(42,27,12,0.18)]">
                        <img src={heroImage} alt={branding?.name || "Hotel exterior"} className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,10,6,0.18)_0%,rgba(15,10,6,0.45)_55%,rgba(15,10,6,0.82)_100%)]" />

                        <div className="absolute inset-x-4 top-4 z-20 rounded-full border border-white/25 bg-white/14 px-4 py-3 backdrop-blur-xl shadow-[0_12px_24px_rgba(0,0,0,0.18)]">
                            <div className="flex items-center justify-between gap-3 text-white">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/65">
                                        Premium Mobile View
                                    </p>
                                    <p className="mt-1 text-sm font-black tracking-[0.18em]">
                                        Glass Guest Portal
                                    </p>
                                </div>
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-2 rounded-full bg-black/20 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-lg"
                                >
                                    <LogOut className="h-3.5 w-3.5 text-[#F6D8AB]" />
                                    Logout
                                </button>
                            </div>
                        </div>

                        <div className="absolute inset-x-4 bottom-4 rounded-[1.7rem] border border-white/20 bg-white/16 p-5 text-white shadow-2xl backdrop-blur-xl">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.32em] text-[#F6D8AB]">
                                        {new Date().getHours() < 12
                                            ? "Good Morning"
                                            : new Date().getHours() < 17
                                              ? "Good Afternoon"
                                              : "Good Evening"}
                                    </p>
                                    <h1 className="mt-2 text-[28px] font-black tracking-tight">
                                        {branding?.name || "Hotel"}
                                    </h1>
                                    <div className="mt-3 flex items-center gap-2 text-white/75">
                                        <MapPin className="h-4 w-4 text-[#F6D8AB]" />
                                        <p className="text-[11px] font-bold uppercase tracking-[0.18em]">
                                            Premium Guest Experience
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-full bg-black/35 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg">
                                    <div className="flex items-center gap-1.5">
                                        <ShieldCheck className="h-3.5 w-3.5 text-[#F6D8AB]" />
                                        Verified
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 grid grid-cols-3 gap-3">
                                <div className="rounded-2xl bg-black/20 px-3 py-3">
                                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/55">
                                        Room
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <BedDouble className="h-4 w-4 text-[#F6D8AB]" />
                                        <span className="text-sm font-black">{roomNumber || "101"}</span>
                                    </div>
                                </div>
                                <div className="rounded-2xl bg-black/20 px-3 py-3">
                                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/55">
                                        Guests
                                    </p>
                                    <p className="mt-2 text-sm font-black">{numGuests || 1} Staying</p>
                                </div>
                                <div className="rounded-2xl bg-[#D9B47D] px-3 py-3 text-[#24170B] shadow-[0_8px_24px_rgba(217,180,125,0.35)]">
                                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#5D4320]">
                                        Checkout
                                    </p>
                                    <p className="mt-2 text-sm font-black">
                                        {formatDateLabel(checkoutDate)}
                                    </p>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5D4320]">
                                        {formatTimeLabel(checkoutTime)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <main className="space-y-5 px-4 pb-6 pt-5">
                    <section className="rounded-[1.8rem] border border-white/70 bg-white/70 p-4 shadow-[0_12px_45px_rgba(62,39,16,0.08)] backdrop-blur-xl">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#B88952]">
                                    Stay Brief
                                </p>
                                <h2 className="mt-1 text-xl font-black tracking-tight">
                                    Everything you need, one tap away
                                </h2>
                            </div>
                            <button
                                onClick={() =>
                                    branding?.receptionPhone
                                        ? window.open(`tel:${branding.receptionPhone}`, "_self")
                                        : handleQuickRequest("Reception", "Guest requested reception assistance")
                                }
                                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#201814] text-white shadow-lg"
                            >
                                <PhoneCall className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                            {primaryActions.map((action) => {
                                const Icon = action.icon;
                                return (
                                    <motion.button
                                        key={action.label}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => openServiceSelection(action)}
                                        className="rounded-[1.5rem] border border-white/80 bg-[#FCF8F3] p-4 text-left shadow-[0_10px_30px_rgba(62,39,16,0.06)]"
                                    >
                                        <div
                                            className="flex h-11 w-11 items-center justify-center rounded-2xl shadow-inner"
                                            style={{ backgroundColor: `${action.accent}18`, color: action.accent }}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <p className="mt-4 text-sm font-black tracking-tight">{action.label}</p>
                                        <p className="mt-1 text-[11px] font-bold text-[#7D6B58]">
                                            {action.description}
                                        </p>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </section>

                    <section className="relative overflow-hidden rounded-[2rem] bg-[#1D1713] p-5 text-white shadow-[0_24px_70px_rgba(28,18,10,0.24)]">
                        <div className="absolute -right-10 top-0 h-36 w-36 rounded-full bg-[#D9B47D]/18 blur-3xl" />
                        <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-[#476271]/18 blur-3xl" />

                        <div className="relative z-10 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D9B47D]">
                                    Quick Services
                                </p>
                                <h2 className="mt-2 text-2xl font-black tracking-tight">
                                    Premium room requests
                                </h2>
                            </div>
                            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/65">
                                Fast lane
                            </div>
                        </div>

                        <div className="relative z-10 mt-5 grid grid-cols-2 gap-3">
                            {serviceTiles.map((service) => {
                                const Icon = service.icon;
                                const isSubmitting = submittingType === service.internalName;

                                return (
                                    <motion.button
                                        key={service.label}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => openServiceSelection(service)}
                                        disabled={Boolean(submittingType)}
                                        className="rounded-[1.5rem] border border-white/10 bg-white/6 p-4 text-left backdrop-blur-md transition-all hover:border-white/20 disabled:opacity-60"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div
                                                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                                                style={{ backgroundColor: `${service.accent}22`, color: service.accent }}
                                            >
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            {isSubmitting ? (
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                                            ) : null}
                                        </div>
                                        <p className="mt-4 text-sm font-black tracking-tight">{service.label}</p>
                                        <p className="mt-1 text-[11px] font-bold text-white/55">
                                            {service.description}
                                        </p>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </section>

                    {currentOffer ? (
                        <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 shadow-[0_16px_55px_rgba(62,39,16,0.08)] backdrop-blur-xl">
                            <div className="relative h-[210px]">
                                <img src={currentOffer.image_url} alt={currentOffer.title} className="h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.12)_0%,rgba(10,10,10,0.65)_100%)]" />
                                <div className="absolute left-4 top-4 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-md">
                                    Signature Offer
                                </div>
                                <div className="absolute inset-x-4 bottom-4">
                                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#F6D8AB]">
                                        Curated for your stay
                                    </p>
                                    <h3 className="mt-2 text-[26px] font-black tracking-tight text-white">
                                        {currentOffer.title}
                                    </h3>
                                    <p className="mt-2 max-w-[90%] text-sm font-medium leading-relaxed text-white/75">
                                        {currentOffer.description}
                                    </p>
                                </div>
                            </div>
                            {offers.length > 1 ? (
                                <div className="flex items-center justify-between px-4 py-4">
                                    <button
                                        onClick={() =>
                                            setCurrentOfferIndex((current) =>
                                                current === 0 ? offers.length - 1 : current - 1,
                                            )
                                        }
                                        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Prev
                                    </button>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                        {currentOfferIndex + 1} / {offers.length}
                                    </p>
                                    <button
                                        onClick={() =>
                                            setCurrentOfferIndex((current) =>
                                                current === offers.length - 1 ? 0 : current + 1,
                                            )
                                        }
                                        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600"
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : null}
                        </section>
                    ) : null}

                    <section className="rounded-[1.8rem] border border-white/70 bg-white/75 p-4 shadow-[0_12px_45px_rgba(62,39,16,0.08)] backdrop-blur-xl">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#B88952]">
                                    Live Requests
                                </p>
                                <h2 className="mt-1 text-xl font-black tracking-tight">
                                    Your room queue
                                </h2>
                            </div>
                            <div className="rounded-full bg-[#F3E5D0] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#9E6C32]">
                                {activeRequests.length} Active
                            </div>
                        </div>

                        {activeRequests.length > 0 ? (
                            <div className="mt-4 space-y-3">
                                {activeRequests.map((request) => {
                                    const RequestIcon = getRequestIcon(request.type);
                                    return (
                                        <div
                                            key={request.id}
                                            className="rounded-[1.5rem] border border-[#EFE4D8] bg-[#FFFCF8] p-4 shadow-[0_8px_24px_rgba(62,39,16,0.05)]"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F8EBD9] text-[#B88952]">
                                                        <RequestIcon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black tracking-tight">{request.type}</p>
                                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8A7563]">
                                                            {request.time}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="rounded-full bg-[#F3E5D0] px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#9E6C32]">
                                                    {getStatusCopy(request.type, request.status)}
                                                </div>
                                            </div>
                                            {request.notes ? (
                                                <p className="mt-3 text-sm font-medium leading-relaxed text-[#6E5C4D]">
                                                    {request.notes}
                                                </p>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="mt-4 rounded-[1.5rem] border border-dashed border-[#D7C4B2] bg-[#FFFCF8] px-4 py-8 text-center">
                                <AlertCircle className="mx-auto h-6 w-6 text-[#B88952]" />
                                <p className="mt-3 text-[11px] font-black uppercase tracking-[0.22em] text-[#9A7D5B]">
                                    No active requests right now
                                </p>
                                <p className="mt-2 text-sm font-medium text-[#8A7563]">
                                    Your concierge lane is clear. Use the service cards above whenever you need something.
                                </p>
                            </div>
                        )}
                    </section>

                    <section className="overflow-hidden rounded-[2rem] bg-[#181311] p-5 text-white shadow-[0_24px_70px_rgba(28,18,10,0.24)]">
                        <div className="absolute" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D9B47D]">
                            Concierge
                        </p>
                        <h2 className="mt-2 text-2xl font-black tracking-tight">
                            Prefer a human touch?
                        </h2>
                        <p className="mt-2 max-w-[80%] text-sm font-medium leading-relaxed text-white/65">
                            Reach reception directly for bespoke help, reservations, or something special for your stay.
                        </p>

                        <div className="mt-5 flex items-center gap-3">
                            <button
                                onClick={() =>
                                    branding?.receptionPhone
                                        ? window.open(`tel:${branding.receptionPhone}`, "_self")
                                        : handleQuickRequest("Reception", "Guest requested direct concierge assistance")
                                }
                                className="flex items-center gap-2 rounded-full bg-[#D9B47D] px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#24170B] shadow-[0_12px_24px_rgba(217,180,125,0.28)]"
                            >
                                Talk Now
                                <ArrowRight className="h-4 w-4" />
                            </button>
                            <div className="rounded-full border border-white/15 bg-white/5 px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/55">
                                24/7 Desk
                            </div>
                        </div>
                    </section>
                </main>
            </div>

            <AnimatePresence>
                {activeService && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end bg-[#120D09]/65 p-3 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 30 }}
                            className="w-full rounded-[2rem] bg-[#FFF9F2] p-5 shadow-2xl"
                        >
                            <div className="mx-auto h-1.5 w-14 rounded-full bg-[#E7D7C4]" />

                            <div className="mt-5 flex items-start gap-4">
                                <div
                                    className="flex h-14 w-14 items-center justify-center rounded-[1.3rem]"
                                    style={{ backgroundColor: `${activeService.accent}18`, color: activeService.accent }}
                                >
                                    <activeService.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.26em] text-[#B88952]">
                                        Room Service
                                    </p>
                                    <h3 className="mt-1 text-2xl font-black tracking-tight text-[#1A140F]">
                                        {activeService.selectedOption || activeService.label}
                                    </h3>
                                    <p className="mt-1 text-sm font-medium text-[#7A695A]">
                                        {activeService.step === "type"
                                            ? "Choose your preference first."
                                            : "Select the quantity to send to your room."}
                                    </p>
                                </div>
                            </div>

                            {activeService.step === "type" ? (
                                <div className="mt-6 grid gap-3">
                                    {[
                                        { label: "Hot Tea", icon: Waves },
                                        { label: "Coffee", icon: Coffee },
                                    ].map((option) => {
                                        const OptionIcon = option.icon;
                                        return (
                                            <button
                                                key={option.label}
                                                onClick={() =>
                                                    setActiveService({
                                                        ...activeService,
                                                        selectedOption: option.label,
                                                        step: "quantity",
                                                    })
                                                }
                                                className="flex items-center gap-4 rounded-[1.3rem] border border-[#E8D8C6] bg-white px-4 py-4 text-left shadow-sm"
                                            >
                                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F7ECDD] text-[#A37546]">
                                                    <OptionIcon className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-[#1A140F]">{option.label}</p>
                                                    <p className="text-[11px] font-medium text-[#7A695A]">
                                                        Freshly prepared and delivered
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="mt-6 grid grid-cols-4 gap-3">
                                    {[1, 2, 3, 4].map((quantity) => (
                                        <button
                                            key={quantity}
                                            onClick={() => confirmQuantity(quantity)}
                                            className="rounded-[1.2rem] border border-[#E8D8C6] bg-white py-5 text-xl font-black text-[#1A140F] shadow-sm"
                                        >
                                            {quantity}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={() => setActiveService(null)}
                                className="mt-6 w-full rounded-[1.2rem] border border-[#E8D8C6] px-4 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#7A695A]"
                            >
                                Cancel
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast((current) => ({ ...current, isVisible: false }))}
            />
        </div>
    );
}
