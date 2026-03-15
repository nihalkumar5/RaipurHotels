"use client";

import React, { useState } from "react";
import { ServiceCard } from "@/components/ServiceCard";
import {
    Wifi, Utensils, Phone, Layers,
    Zap, Droplets, Wind, Sparkles, Coffee, Layout, ChefHat, Home, User, Users, Sun, Compass, AlertCircle, Check, Wine, Library,
    ChevronLeft, ChevronRight, ArrowRight, ExternalLink, Clock, MapPin, Music, Star, Shirt, WashingMachine,
    Wrench, Search, Bed, Bath, AirVent, Tv, MoreHorizontal, Waves, Car, Bell, Lamp, Sofa, Briefcase
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useHotelBranding, useSupabaseRequests, addSupabaseRequest, useSpecialOffers } from "@/utils/store";
import { useGuestRoom } from "../GuestAuthWrapper";
import { Toast } from "@/components/Toast";

// Helper to safely render icons with className
const renderIcon = (icon: React.ReactNode, className: string) => {
    return React.isValidElement(icon)
        ? React.cloneElement(icon as React.ReactElement<any>, { className })
        : icon;
};

const formatCheckoutDate = (value?: string) => {
    if (!value) return "Checkout TBD";

    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
        const [, year, month, day] = isoMatch;
        const parsed = new Date(Number(year), Number(month) - 1, Number(day));
        return parsed.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
        });
    }

    const slashMatch = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (slashMatch) {
        const [, first, second, third] = slashMatch;
        const year = third.length === 2 ? `20${third}` : third;
        const parsed = new Date(Number(year), Number(second) - 1, Number(first));

        if (!Number.isNaN(parsed.getTime())) {
            return parsed.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
            });
        }
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
        });
    }

    return value;
};

const formatCheckoutTime = (value?: string) => {
    if (!value) return "TBD";

    if (/[ap]m/i.test(value)) {
        return value.toUpperCase();
    }

    const timeMatch = value.match(/^(\d{1,2}):(\d{2})$/);
    if (!timeMatch) return value;

    const [, hourText, minute] = timeMatch;
    const hours = Number(hourText);

    if (Number.isNaN(hours) || hours > 23) {
        return value;
    }

    const period = hours >= 12 ? "PM" : "AM";
    const normalizedHour = hours % 12 || 12;
    return `${normalizedHour}:${minute} ${period}`;
};

export default function GuestDashboard() {
    const router = useRouter();
    const params = useParams();
    const hotelSlug = params?.hotel_slug as string;

    const { roomNumber, checkoutDate, checkoutTime, numGuests, checkedInAt } = useGuestRoom();
    const { branding, loading } = useHotelBranding(hotelSlug);
    const { offers, loading: loadingOffers } = useSpecialOffers(branding?.id);
    const requests = useSupabaseRequests(branding?.id, roomNumber, checkedInAt);

    // State for Quick Services friction (Quantity Selector)
    const [activeServiceForQty, setActiveServiceForQty] = useState<{
        label: string;
        icon: React.ReactNode;
        internalName: string;
        hasOptions?: boolean;
        selectedOption?: string | null;
        step?: 'type' | 'quantity';
    } | null>(null);

    const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
    const [scrolled, setScrolled] = useState(false);
    const [showTeaOptions, setShowTeaOptions] = useState(false);
    const [showWaterOptions, setShowWaterOptions] = useState(false);
    const [showCleaningOptions, setShowCleaningOptions] = useState(false);
    const [showCleaningTimePicker, setShowCleaningTimePicker] = useState(false);

    const [submittingType, setSubmittingType] = React.useState<string | null>(null);
    const [showMoreServices, setShowMoreServices] = useState(false);
    const [toast, setToast] = React.useState<{ message: string; type: "success" | "error"; isVisible: boolean }>({
        message: "",
        type: "success",
        isVisible: false
    });

    React.useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const activeRequests = requests.filter(r => r.status === "Pending" || r.status === "In Progress");
    const displayCheckoutDate = formatCheckoutDate(checkoutDate);
    const displayCheckoutTime = formatCheckoutTime(checkoutTime);
    const guestCountLabel = `${numGuests || 1} ${(numGuests || 1) === 1 ? "Guest" : "Guests"}`;
    const serviceIconColor = branding?.serviceIconColor || "#2f2f2f";
    const receptionPhone = branding?.receptionPhone?.trim();
    const heroImage =
        branding?.heroImage ||
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80";
    const activeOffers = offers.filter((offer) => offer.is_active);

    React.useEffect(() => {
        if (!activeOffers.length) {
            setCurrentOfferIndex(0);
            return;
        }

        setCurrentOfferIndex((previous) => (previous >= activeOffers.length ? 0 : previous));
    }, [activeOffers.length]);

    const handleQuickRequest = async (type: string, notes: string) => {
        if (!branding?.id || submittingType) return;

        setSubmittingType(type);
        const { error } = await addSupabaseRequest(branding.id, {
            room: roomNumber,
            type: type,
            notes: notes,
            status: "Pending",
            price: 0,
            total: 0
        });

        setSubmittingType(null);

        if (error) {
            setToast({ message: `Error: ${error.message}`, type: "error", isVisible: true });
        } else {
            const successWording = type === 'Towel' ? 'Fresh towels are on the way 🧺' : 
                                  type === 'Water' ? 'Mineral water is on its way 💧' :
                                  type === 'Cleaning' ? 'Housekeeping has been notified 🧹' :
                                  type === 'Late Checkout' ? 'Late checkout request received ⏳' :
                                  `${type} request placed successfully`;
            setToast({ message: successWording, type: "success", isVisible: true });
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const handleTileClick = (service: any) => {
        if (service.internalName === "Reception") {
            if (receptionPhone) {
                window.location.href = `tel:${receptionPhone}`;
            } else {
                setToast({
                    message: "Reception number is not configured yet",
                    type: "error",
                    isVisible: true
                });
            }
            return;
        }

        setActiveServiceForQty({
            label: service.label,
            icon: service.icon,
            internalName: service.internalName,
            hasOptions: service.hasOptions,
            selectedOption: null,
            step: service.hasOptions ? 'type' : 'quantity'
        });
    };

    const confirmQuantity = (qty: number) => {
        if (!activeServiceForQty) return;
        
        const finalLabel = activeServiceForQty.selectedOption || activeServiceForQty.label;
        
        handleQuickRequest(
            activeServiceForQty.internalName, 
            `${finalLabel} (Qty: ${qty}) requested`
        );
        setActiveServiceForQty(null);
    };

    return (
        <div className="min-h-screen overflow-x-hidden bg-[#FDFBF9] pb-20 font-sans text-[#1F1F1F] md:mx-auto md:max-w-[520px]">
            {/* 1. Hero Hotel Card - "Halo Effect" */}
            <motion.section 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative h-[260px] w-full overflow-hidden sm:h-[320px]"
            >
                {/* Full-bleed Hotel Image Background */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src={heroImage}
                        className="w-full h-full object-cover" 
                        alt="Hotel Exterior" 
                    />
                    <div
                        className="absolute inset-0"
                        style={{
                            background: "linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.45))",
                        }}
                    />
                </div>

                {/* Glass Header */}
                <div className="absolute inset-x-4 top-6 z-20 sm:inset-x-6">
                    <div className="flex items-center justify-center rounded-[18px] border border-white/35 bg-white/35 px-5 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.08)] backdrop-blur-[18px]">
                        <span className="text-[11px] font-black uppercase tracking-[0.28em] text-[#111111]">
                            Guest Portal
                        </span>
                    </div>
                </div>
            </motion.section>

            {/* 1.5 Floating Hotel Info Card */}
            <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="-mt-12 mb-6 px-4"
            >
                <div className="rounded-[24px] border border-white/30 bg-white/75 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.15)] backdrop-blur-[18px]">
                    <div className="mb-5">
                        <h1 className="mb-2 text-[28px] font-serif font-bold uppercase leading-[0.95] tracking-[0.01em] text-[#111111]">
                            {branding?.name || "Mountain Lodge"}
                        </h1>
                        <div className="mb-3 text-[15px] tracking-[0.22em] text-[#C6A25A]">★★★★★</div>
                        <div className="flex items-center text-slate-700/75">
                            <MapPin className="mr-2 h-3.5 w-3.5" />
                            <p className="text-[14px] font-semibold tracking-[0.08em]">
                                {branding?.city || "Raipur, India"}
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-black/5 pt-5">
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-800/40">Checkout</p>
                                <p className="text-[16px] font-black tracking-[0.04em] text-[#C6A25A]">
                                    {displayCheckoutDate} <span className="px-2 text-[#B9A388]">·</span> {displayCheckoutTime}
                                </p>
                            </div>
                            <div className="ml-auto flex items-center gap-1 rounded-[9px] bg-[#111111] px-2 py-1 text-white shadow-[0_0_10px_rgba(0,0,0,0.2)]">
                                <Check className="h-2.5 w-2.5 text-[#CFA46A]" />
                                <span className="text-[8px] font-black uppercase tracking-[0.14em]">Verified Guest</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* 2. Compact Info Tile (Info Strip) */}
            <motion.section 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="relative z-10 mb-6 px-4"
            >
                <div className="flex h-[72px] items-center justify-between rounded-[16px] border border-white/20 bg-[#F3EAE1]/96 px-4 py-3 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
                    {/* Room Section */}
                    <div className="flex-1 flex flex-col items-center">
                        <span className="mb-1 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 opacity-70">Room</span>
                        <div className="flex items-center gap-1.5">
                            <Bed className="w-3.5 h-3.5 text-[#CFA46A] stroke-[2.5]" />
                            <span className="text-[14px] font-black text-[#1F1F1F] leading-none tracking-tight">{roomNumber || "101"}</span>
                        </div>
                    </div>

                    <div className="mx-4 h-8 w-px self-center bg-black/5"></div>

                    {/* Guests Section */}
                    <div className="flex-1 flex flex-col items-center">
                        <span className="mb-1 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 opacity-70">Staying</span>
                        <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#CFA46A] stroke-[2.5]" />
                            <span className="text-[14px] font-black text-[#1F1F1F] leading-none tracking-tight">{guestCountLabel}</span>
                        </div>
                    </div>

                    <div className="mx-4 h-8 w-px self-center bg-black/5"></div>

                    {/* Late Checkout Section (Premium 3D Red Button - Simplified) */}
                    <div className="flex-1 flex flex-col items-center">
                        <motion.button 
                            whileTap={{ scale: 0.96 }}
                            whileHover={{ scale: 1.03 }}
                            onClick={() => router.push(`/${hotelSlug}/guest/services/late-checkout`)}
                            className="flex min-h-[48px] w-full items-center justify-center rounded-[16px] border border-[#C53030]/30 bg-[#C62828] px-[18px] py-3 shadow-[0_4px_0_0_#751B1B] transition-all hover:shadow-[0_6px_0_0_#751B1B] active:translate-y-[4px] active:shadow-none"
                        >
                            <span className="text-[10px] font-black text-white uppercase tracking-wider leading-none text-center">
                                Late Checkout
                            </span>
                        </motion.button>
                    </div>
                </div>
            </motion.section>

            {/* 2.5. Luxury Priority Services Section (Wi-Fi, Dining, etc.) */}
            <motion.section 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="mb-8 px-4"
            >
                <div className="grid grid-cols-4 gap-x-3 gap-y-4">
                    {[
                        { label: "Wi-Fi Info", icon: <Wifi strokeWidth={1.7} />, path: "wifi" },
                        { label: "Room Service", icon: <Utensils strokeWidth={1.7} />, path: "restaurant" },
                        { label: "Taxi", icon: <Car strokeWidth={1.7} />, path: "services/taxi" },
                        { label: "Maintenance", icon: <Wrench strokeWidth={1.7} />, path: "services/maintenance" },
                        { label: "Laundry", icon: <WashingMachine strokeWidth={1.7} />, path: "services/laundry" },
                        { label: "Luggage", icon: <Briefcase strokeWidth={1.7} />, path: "services/luggage" },
                        { label: "Cleaning", icon: <Bath strokeWidth={1.7} />, path: "services/cleaning" },
                        { label: showMoreServices ? "Less" : "More", icon: <MoreHorizontal strokeWidth={1.7} />, action: () => setShowMoreServices((prev) => !prev) }
                    ].map((s, i) => (
                        <div key={i} className="px-1 text-center">
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                whileHover={{ y: -2 }}
                                onClick={() => s.path ? router.push(`/${hotelSlug}/guest/${s.path}`) : s.action?.()}
                                className="flex w-full flex-col items-center justify-center px-1 py-1 transition-all duration-200"
                            >
                                <div className="flex items-center justify-center" style={{ color: serviceIconColor }}>
                                    {renderIcon(s.icon, "h-9 w-9")}
                                </div>
                            </motion.button>
                            <h3 className="mt-1.5 text-[10px] font-medium leading-tight text-[#2b2b2b] font-serif">{s.label}</h3>
                        </div>
                    ))}
                </div>
                {showMoreServices && (
                    <div className="mt-4 grid grid-cols-4 gap-x-3 gap-y-4">
                        {[
                            { label: "Wake Call", icon: <Clock strokeWidth={1.7} />, path: "services/wake-call" },
                            { label: "Mini Bar", icon: <Wine strokeWidth={1.7} />, path: "services/mini-bar" },
                            { label: "Airport", icon: <Compass strokeWidth={1.7} />, path: "services/airport-transfer" },
                            { label: "Spa", icon: <Waves strokeWidth={1.7} />, path: "services/spa" }
                        ].map((s, i) => (
                            <div key={i} className="px-1 text-center">
                                <motion.button
                                    whileTap={{ scale: 0.96 }}
                                    whileHover={{ y: -2 }}
                                    onClick={() => router.push(`/${hotelSlug}/guest/${s.path}`)}
                                    className="flex w-full flex-col items-center justify-center px-1 py-1 transition-all duration-200"
                                >
                                    <div className="flex items-center justify-center" style={{ color: serviceIconColor }}>
                                        {renderIcon(s.icon, "h-9 w-9")}
                                    </div>
                                </motion.button>
                                <h3 className="mt-1.5 text-[10px] font-medium leading-tight text-[#2b2b2b] font-serif">{s.label}</h3>
                            </div>
                        ))}
                    </div>
                )}
            </motion.section>

            {/* 3. Special Offers */}
            <motion.section
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.58 }}
                className="mb-8 px-4"
            >
                <div className="rounded-[24px] border border-[#EADBC7] bg-[#FBF6EF] p-4 shadow-[0_16px_34px_rgba(0,0,0,0.06)]">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#C6A25A]">
                                Special Offers
                            </p>
                            <h3 className="text-[20px] font-serif font-bold text-[#1F1F1F]">
                                Curated for your stay
                            </h3>
                        </div>

                        {activeOffers.length > 1 && (
                            <div className="flex items-center gap-2">
                                <motion.button
                                    whileTap={{ scale: 0.94 }}
                                    onClick={() =>
                                        setCurrentOfferIndex((previous) =>
                                            previous === 0 ? activeOffers.length - 1 : previous - 1,
                                        )
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E8DCCB] bg-white text-[#1F1F1F] shadow-sm"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.94 }}
                                    onClick={() =>
                                        setCurrentOfferIndex((previous) =>
                                            previous === activeOffers.length - 1 ? 0 : previous + 1,
                                        )
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E8DCCB] bg-white text-[#1F1F1F] shadow-sm"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </motion.button>
                            </div>
                        )}
                    </div>

                    {loadingOffers ? (
                        <div className="flex h-[210px] items-center justify-center rounded-[20px] border border-dashed border-[#E8DCCB] bg-white/60 text-[#8D7B68]">
                            <div className="flex items-center gap-3 text-sm font-semibold">
                                <div className="h-5 w-5 rounded-full border-2 border-[#CFA46A] border-t-transparent animate-spin" />
                                Loading offers...
                            </div>
                        </div>
                    ) : activeOffers.length ? (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeOffers[currentOfferIndex]?.id}
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden rounded-[22px] border border-white/70 bg-white shadow-[0_12px_28px_rgba(0,0,0,0.08)]"
                            >
                                <div className="relative h-[190px] w-full overflow-hidden">
                                    {activeOffers[currentOfferIndex]?.image_url ? (
                                        <img
                                            src={activeOffers[currentOfferIndex].image_url}
                                            alt={activeOffers[currentOfferIndex].title}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#E8D9C3] to-[#D8B78A]">
                                            <Star className="h-10 w-10 text-white/80" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#1F1F1F]/80 via-[#1F1F1F]/20 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                                        <p className="mb-2 text-[9px] font-black uppercase tracking-[0.24em] text-white/70">
                                            Exclusive
                                        </p>
                                        <h4 className="text-[24px] font-serif font-bold leading-tight">
                                            {activeOffers[currentOfferIndex]?.title}
                                        </h4>
                                    </div>
                                </div>

                                <div className="flex items-end justify-between gap-4 p-5">
                                    <div>
                                        <p className="text-[13px] font-medium leading-6 text-[#5F5A54]">
                                            {activeOffers[currentOfferIndex]?.description || "Ask our team for details on this experience."}
                                        </p>
                                        {activeOffers.length > 1 && (
                                            <div className="mt-3 flex items-center gap-1.5">
                                                {activeOffers.map((offer, index) => (
                                                    <button
                                                        key={offer.id}
                                                        onClick={() => setCurrentOfferIndex(index)}
                                                        className={`h-1.5 rounded-full transition-all ${
                                                            index === currentOfferIndex
                                                                ? "w-6 bg-[#CFA46A]"
                                                                : "w-1.5 bg-[#D9CFC3]"
                                                        }`}
                                                        aria-label={`View offer ${index + 1}`}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <motion.button
                                        whileTap={{ scale: 0.96 }}
                                        onClick={() => router.push(`/${hotelSlug}/guest/services`)}
                                        className="flex h-11 items-center gap-2 rounded-full bg-[#CFA46A] px-4 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-[0_10px_20px_rgba(207,164,106,0.25)]"
                                    >
                                        Explore
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </motion.button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    ) : (
                        <div className="rounded-[20px] border border-dashed border-[#E8DCCB] bg-white/60 px-5 py-8 text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#C6A25A] mb-2">
                                Offers coming soon
                            </p>
                            <p className="text-sm font-medium text-[#6C6358]">
                                The hotel has not published any active promotions yet.
                            </p>
                        </div>
                    )}
                </div>
            </motion.section>

            {/* 3. Refined Quick Services Section v3 (Exact Blueprint) */}
            <motion.section 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-8 mt-8 px-5"
            >
                <div className="relative overflow-hidden rounded-[24px] border border-white/10 p-6 shadow-[0_30px_60px_rgba(0,0,0,0.35)]">
                    <div
                        className="absolute inset-0"
                        style={{
                            background: "radial-gradient(circle at top, #0f172a, #020617)",
                        }}
                    />

                    {/* 2. Foreground Layer (Header & Tiles) */}
                    <div className="relative z-10">
                        <div className="mb-[18px]">
                            <h2 className="mb-1.5 font-serif text-[24px] font-semibold leading-tight text-[#F8FAFC]">Quick Services</h2>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#CBD5E1]/85">Personalized for your stay</p>
                        </div>
                        
                        <div className="mt-[18px] grid grid-cols-2 gap-4">
                            {[
                                { 
                                    label: "Reception", 
                                    internalName: "Reception",
                                    icon: <Phone className="h-5 w-5" />, 
                                    color: "#FFB86B",
                                },
                                { 
                                    label: "Tea/Coffee", 
                                    internalName: "Tea / Coffee",
                                    icon: <Coffee className="h-5 w-5" />, 
                                    color: "#E8A86D",
                                    hasOptions: true
                                },
                                { 
                                    label: "Mineral Water", 
                                    internalName: "Mineral Water",
                                    icon: <Droplets className="h-5 w-5" />, 
                                    color: "#6FD3FF"
                                },
                                { 
                                    label: "Fresh Towels", 
                                    internalName: "Towels",
                                    icon: <Layers className="h-5 w-5" />, 
                                    color: "#8AD4C1"
                                }
                            ].map((service, i) => (
                                <motion.button
                                    key={i}
                                    whileHover={{ y: -4, boxShadow: "0 18px 40px rgba(0,0,0,0.15)" }}
                                    whileTap={{ scale: 0.96 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    onClick={() => handleTileClick(service)}
                                    className="group/tile relative flex h-24 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-[20px] border border-white/8 bg-white/5 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[18px] transition-all duration-200"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover/tile:opacity-100" />
                                    <div
                                        style={{ color: service.color }}
                                        className="relative z-10 flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/8 transition-transform duration-300 group-hover/tile:scale-110"
                                    >
                                        {service.icon}
                                    </div>
                                    <span className="relative z-10 text-center font-sans text-[13px] font-medium leading-tight tracking-[0.2px] text-[#EAEAEA]">
                                        {service.label}
                                    </span>
                                </motion.button>
                            ))}
                        </div>

                        {/* Unified Selection Overlay (Compact & Consistent) */}
                        <AnimatePresence>
                            {activeServiceForQty && (
                                <motion.div 
                                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                                    animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                                    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                                    className="absolute inset-0 z-50 bg-[#E8DCCB]/60 flex items-center justify-center p-6"
                                >
                                    <motion.div 
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.9, opacity: 0 }}
                                        className="bg-[#F6F3EE] rounded-[32px] p-6 pb-8 w-full max-w-[290px] min-h-fit shadow-[0_30px_60px_rgba(0,0,0,0.18)] border border-white flex flex-col items-center"
                                    >
                                        <div className="flex flex-col items-center w-full">
                                            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm text-[#B88952] mb-5">
                                                {activeServiceForQty.step === 'type' ? (
                                                    <div className="flex gap-1.5">
                                                        <Coffee className="w-5 h-5" />
                                                        <div className="w-[1px] h-5 bg-[#B88952]/20 mx-0.5" />
                                                        <Wind className="w-5 h-5 scale-x-[-1]" />
                                                    </div>
                                                ) : activeServiceForQty.icon}
                                            </div>
                                            
                                            <h3 className="text-[20px] font-serif font-black text-[#1F1F1F] mb-1.5 text-center leading-tight">
                                                {activeServiceForQty.selectedOption || activeServiceForQty.label}
                                            </h3>
                                            <p className="text-[10px] font-black text-[#1F1F1F]/40 uppercase tracking-[0.2em] mb-8">
                                                {activeServiceForQty.step === 'type' ? "Selection Required" : "Select Quantity"}
                                            </p>
                                            
                                            {activeServiceForQty.step === 'type' ? (
                                                <div className="flex flex-col gap-3 w-full">
                                                    {["Hot Tea", "Coffee"].map((option) => (
                                                        <motion.button
                                                            key={option}
                                                            whileTap={{ scale: 0.98 }}
                                                            onClick={() => setActiveServiceForQty({
                                                                ...activeServiceForQty,
                                                                selectedOption: option,
                                                                step: 'quantity'
                                                            })}
                                                            className="flex items-center gap-4 bg-white border border-[#E8DCCB]/30 h-14 px-5 rounded-xl shadow-sm hover:border-[#B88952]/70 transition-colors group"
                                                        >
                                                            <div className="text-[#B88952]/60 group-hover:text-[#B88952]">
                                                                {option === "Coffee" ? <Coffee className="w-4 h-4" /> : <Wind className="w-4 h-4" />}
                                                            </div>
                                                            <span className="text-[15px] font-bold text-[#1F1F1F]">{option}</span>
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex gap-3 w-full">
                                                    {[1, 2].map((num) => (
                                                        <motion.button
                                                            key={num}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => confirmQuantity(num)}
                                                            className="flex-1 bg-white border border-[#E8DCCB]/30 h-16 rounded-xl flex items-center justify-center text-[22px] font-serif font-black text-[#1F1F1F] shadow-sm hover:border-[#B88952]/70 transition-colors"
                                                        >
                                                            {num}
                                                        </motion.button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <button 
                                            onClick={() => setActiveServiceForQty(null)}
                                            className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#1F1F1F]/40 hover:text-[#1F1F1F] transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.section>
  

            {/* 4. Active Requests Section */}
            <motion.section 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-10 px-0 sm:px-6"
            >
                <div className="bg-white/50 backdrop-blur-md rounded-[26px] p-6 border border-white shadow-[0_12px_35px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[15px] font-serif font-bold text-[#1F1F1F]">Active Requests</h3>
                        {activeRequests.length > 0 && (
                            <div className="bg-[#CFA46A]/20 px-3 py-1 rounded-full">
                                <span className="text-[9px] font-black uppercase text-[#CFA46A] tracking-widest">{activeRequests.length} Running</span>
                            </div>
                        )}
                    </div>
                    
                    {activeRequests.length > 0 ? (
                        <div className="space-y-4">
                            {activeRequests.map((req, i) => {
                                const getStatusLabel = (type: string, status: string) => {
                                    if (status === "Pending") return "Received";
                                    if (status === "In Progress") {
                                        if (type === 'Cleaning') return "On the way";
                                        if (type === 'Dining') return "Preparing";
                                        if (type === 'Laundry') return "Picked up";
                                        if (type === 'Late Checkout') return "Reviewing";
                                        return "Processing";
                                    }
                                    return status;
                                };

                                return (
                                    <div key={i} className="flex items-center justify-between bg-white/70 rounded-[20px] p-4 border border-white/60 shadow-sm">
                                        <div className="flex items-center space-x-4">
                                            <div className="bg-[#CFA46A]/10 text-[#CFA46A] p-2.5 rounded-xl">
                                                {req.type === 'Cleaning' ? <img src="/icons/cleaning-svgrepo-com.svg" alt="Cleaning" className="w-5 h-5 object-contain" /> : 
                                                 req.type === 'Dining' ? <img src="/icons/dinner-svgrepo-com.svg" alt="Dining" className="w-5 h-5 object-contain" /> : 
                                                 req.type === 'Laundry' ? <img src="/icons/laundry-machine-svgrepo-com.svg" alt="Laundry" className="w-5 h-5 object-contain" /> :
                                                 req.type === 'Maintenance' ? <img src="/icons/maintenance-svgrepo-com.svg" alt="Maintenance" className="w-5 h-5 object-contain" /> :
                                                 <Clock className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-bold text-[#1F1F1F]">{req.type}</p>
                                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{req.status}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-[#CFA46A] rounded-full animate-pulse shadow-[0_0_8px_rgba(207,164,106,0.6)]"></div>
                                            <span className="text-[10px] font-black uppercase text-[#CFA46A] tracking-[0.1em]">
                                                {getStatusLabel(req.type, req.status)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-8 text-center bg-white/30 rounded-[20px] border border-dashed border-[#CFA46A]/30">
                            <p className="text-[11px] font-bold text-[#1F1F1F]/40 uppercase tracking-[0.2em]">Our team is standing by</p>
                        </div>
                    )}
                </div>
            </motion.section>

            {/* 5. Concierge CTA */}
            <motion.section 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mb-20 px-4 sm:px-6"
            >
                <motion.div 
                    whileTap={{ scale: 0.98 }}
                    className="mx-auto max-w-[430px] bg-[#1F1F1F] rounded-[22px] p-5 flex items-center justify-between shadow-2xl relative overflow-hidden"
                >
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Need Anything?</p>
                        <h3 className="text-xl font-serif text-white font-medium mb-1 tracking-tight">Talk to Concierge</h3>
                        <p className="text-[10px] text-white/60 font-medium">Available 24/7 for you</p>
                    </div>
                    <motion.button 
                        whileTap={{ scale: 0.94 }}
                        className="relative z-10 h-11 px-6 bg-[#CFA46A] text-white text-[10px] font-black uppercase tracking-[0.18em] rounded-full shadow-xl shadow-[#CFA46A]/20"
                    >
                        Start Chat
                    </motion.button>
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
                </motion.div>
            </motion.section>

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </div>
    );
}
