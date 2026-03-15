"use client";

import React, { useState } from "react";
import { ServiceCard } from "@/components/ServiceCard";
import {
    Wifi, Utensils, Phone, Layers,
    Zap, Droplets, Wind, Sparkles, Coffee, Layout, ChefHat, Home, User, Users, Sun, Compass, AlertCircle, Check, Wine, Library,
    ChevronLeft, ChevronRight, ArrowRight, ExternalLink, Clock, MapPin, Music, Star, Shirt,
    Wrench, Search, Bed, Bath, AirVent, Tv, MoreHorizontal, Waves, Car, Bell, Lamp, Sofa
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

    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

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
        <div className="min-h-screen overflow-x-hidden bg-[#FDFBF9] pb-24 font-sans text-[#1F1F1F] md:mx-auto md:max-w-[520px]">
            {/* 1. Hero Hotel Card - "Halo Effect" */}
            <motion.section 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative h-[560px] w-full overflow-hidden sm:h-[520px]"
            >
                {/* Full-bleed Hotel Image Background */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80" 
                        className="w-full h-full object-cover" 
                        alt="Hotel Exterior" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent transparent 40% to-[#EFE7DD] opacity-90" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(239,231,221,0.9) 80%)' }} />
                </div>

                {/* Glass Guest Portal Overlay */}
                <div className="absolute inset-x-4 top-[112px] z-10 sm:inset-x-6 sm:top-[96px]">
                    <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="relative rounded-[30px] border border-white/40 bg-white/60 p-7 shadow-[0_20px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl sm:rounded-[26px] sm:p-8"
                    >
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#CFA46A] mb-1.5">{getTimeGreeting()}</p>
                                <h1 className="text-[22px] font-serif font-bold text-[#1F1F1F] tracking-tight mb-1">
                                    {branding?.name || "Mountain Lodge"}
                                </h1>
                                <div className="text-[#CFA46A] text-xs mb-2">★★★★★</div>
                                <div className="flex items-center text-slate-800/60">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    <p className="text-[11px] font-bold uppercase tracking-[0.1em]">
                                        {(branding as any)?.address || "Kiev, Ukraine"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-black/85 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-lg">
                                <Check className="w-3 h-3 text-[#CFA46A]" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-black/5 flex items-center justify-between">
                            <div className="flex flex-col">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-800/40 mb-1">Checkout</p>
                                <p className="text-[16px] font-black text-[#1F1F1F]">16 Feb</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <div className="bg-[#CFA46A] px-4 py-2 rounded-xl shadow-[0_4px_12px_rgba(207,164,106,0.3)]">
                                    <p className="text-[12px] font-black text-white uppercase tracking-wider">11:00 AM</p>
                                </div>
                                <span className="text-[8px] font-black text-[#CFA46A] uppercase tracking-widest animate-pulse">Request Extension</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Glass Guest Portal Label Component */}
                <div className="absolute left-1/2 top-5 z-20 -translate-x-1/2 sm:top-12">
                    <div className="rounded-full border border-white/40 bg-white/40 px-6 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1F1F1F] shadow-sm backdrop-blur-md">
                        Glass Guest Portal
                    </div>
                </div>
            </motion.section>

            {/* 2. Compact Info Tile (Info Strip) */}
            <motion.section 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="relative z-10 mb-10 mt-4 px-4 sm:mt-0 sm:px-6"
            >
                <div className="flex h-[85px] items-center justify-between rounded-[24px] border border-white/20 bg-[#F3EAE1]/95 px-6 py-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)] sm:rounded-[18px]">
                    {/* Room Section */}
                    <div className="flex-1 flex flex-col items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2 opacity-70">Room</span>
                        <div className="flex items-center gap-1.5">
                            <Bed className="w-3.5 h-3.5 text-[#CFA46A] stroke-[2.5]" />
                            <span className="text-[15px] font-black text-[#1F1F1F] leading-none tracking-tight">{roomNumber || "101"}</span>
                        </div>
                    </div>

                    <div className="w-px h-8 bg-black/5 self-center mx-2"></div>

                    {/* Guests Section */}
                    <div className="flex-1 flex flex-col items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2 opacity-70">Staying</span>
                        <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#CFA46A] stroke-[2.5]" />
                            <span className="text-[15px] font-black text-[#1F1F1F] leading-none tracking-tight">{numGuests || 1} Guest</span>
                        </div>
                    </div>

                    <div className="w-px h-8 bg-black/5 self-center mx-2"></div>

                    {/* Late Checkout Section (Premium 3D Red Button - Simplified) */}
                    <div className="flex-1 flex flex-col items-center">
                        <motion.button 
                            whileTap={{ scale: 0.96 }}
                            whileHover={{ y: -2 }}
                            onClick={() => handleQuickRequest("Late Checkout", "Guest requested late checkout extension")}
                            className="bg-[#A62626] rounded-[16px] px-2 py-4 flex items-center justify-center shadow-[0_4px_0_0_#751B1B] hover:shadow-[0_6px_0_0_#751B1B] active:shadow-none active:translate-y-[4px] transition-all cursor-pointer border border-[#C53030]/30 w-full min-h-[58px]"
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
                className="mb-8 px-4 sm:px-6"
            >
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Wi-Fi", desc: "Connect", icon: <Wifi className="h-[18px] w-[18px]" />, path: "wifi" },
                        { label: "Dining", desc: "Orders", icon: <Utensils className="h-[18px] w-[18px]" />, path: "restaurant" },
                        { label: "Taxi", desc: "Book", icon: <Car className="h-[18px] w-[18px]" />, path: "services" }
                    ].map((s, i) => (
                        <motion.button
                            key={i}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push(`/${hotelSlug}/guest/${s.path}`)}
                            className="flex min-h-[94px] flex-col items-center justify-start rounded-[20px] border border-white/70 bg-white/84 px-3 py-3.5 text-center shadow-[0_10px_22px_rgba(0,0,0,0.045)] backdrop-blur-xl"
                        >
                            <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-[16px] bg-[#F3EAE1] text-[#1F1F1F] shadow-inner">
                                {s.icon}
                            </div>
                            <h3 className="mb-1 text-[9px] font-black leading-tight tracking-tight text-[#1F1F1F]">{s.label}</h3>
                            <p className="text-[6px] font-bold uppercase tracking-[0.22em] text-slate-400 opacity-75">{s.desc}</p>
                        </motion.button>
                    ))}
                    {[
                        { label: "Cleaning", desc: "Now", icon: <Sparkles className="h-[18px] w-[18px]" />, action: () => handleQuickRequest("Cleaning", "Housekeeping requested") },
                        { label: "Laundry", desc: "Press", icon: <Shirt className="h-[18px] w-[18px]" />, path: "services" },
                        { label: "Support", desc: "Issue", icon: <Wrench className="h-[18px] w-[18px]" />, action: () => handleQuickRequest("Maintenance", "Maintenance requested") }
                    ].map((s, i) => (
                        <motion.button
                            key={i}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => s.path ? router.push(`/${hotelSlug}/guest/${s.path}`) : s.action?.()}
                            className="flex min-h-[94px] flex-col items-center justify-start rounded-[20px] border border-white/70 bg-white/84 px-3 py-3.5 text-center shadow-[0_10px_22px_rgba(0,0,0,0.045)] backdrop-blur-xl"
                        >
                            <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-[16px] bg-[#F3EAE1] text-[#1F1F1F] shadow-inner">
                                {s.icon}
                            </div>
                            <h3 className="mb-1 text-[9px] font-black leading-tight tracking-tight text-[#1F1F1F]">{s.label}</h3>
                            <p className="text-[6px] font-bold uppercase tracking-[0.22em] text-slate-400 opacity-75">{s.desc}</p>
                        </motion.button>
                    ))}
                </div>
            </motion.section>

            {/* 3. Refined Quick Services Section v3 (Exact Blueprint) */}
            <motion.section 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mb-12 px-0 sm:px-6"
            >
                <div className="bg-[#E8DCCB] rounded-[40px] p-10 relative overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.12)] border border-white/40 noise group/container">
                    {/* 1. Subtle Textured/Illustrated Background Layer - Split View (Right Side Only) */}
                    <div className="absolute inset-y-0 right-0 w-[55%] z-0 opacity-[0.6] pointer-events-none transition-transform duration-1000 group-hover/container:scale-105 origin-right">
                        <img 
                            src="/images/luxury_hotel_ultra_premium_bg.png" 
                            alt="Background Illustration"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#E8DCCB] via-[#E8DCCB]/20 to-transparent" />
                    </div>

                    {/* 2. Foreground Layer (Header & Tiles) */}
                    <div className="relative z-10">
                        <div className="mb-8">
                            <h2 className="text-[24px] font-serif font-bold text-[#1F1F1F] leading-tight mb-1 tracking-tight">Quick Services</h2>
                            <p className="text-[10px] font-black text-[#1F1F1F]/40 uppercase tracking-[0.25em]">Personalized for your stay</p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                            {[
                                { 
                                    label: "Reception", 
                                    internalName: "Reception",
                                    icon: <Phone className="w-[22px] h-[22px]" />, 
                                    color: "#B45309",
                                },
                                { 
                                    label: "Tea/Coffee", 
                                    internalName: "Tea / Coffee",
                                    icon: <Coffee className="w-[22px] h-[22px]" />, 
                                    color: "#8B5E3C",
                                    hasOptions: true
                                },
                                { 
                                    label: "Water", 
                                    internalName: "Mineral Water",
                                    icon: <Droplets className="w-[22px] h-[22px]" />, 
                                    color: "#5DA7B1"
                                },
                                { 
                                    label: "Towels", 
                                    internalName: "Towels",
                                    icon: <Layers className="w-[22px] h-[22px]" />, 
                                    color: "#7A8D84"
                                }
                            ].map((service, i) => (
                                <motion.button
                                    key={i}
                                    whileHover={{ y: -5, scale: 1.02 }}
                                    whileTap={{ scale: 0.96 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                    onClick={() => handleTileClick(service)}
                                    className="flex flex-col items-center justify-center gap-2 w-[132px] h-[94px] rounded-[26px] bg-white/65 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.08)] border border-white relative overflow-hidden group/tile"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover/tile:opacity-100 transition-opacity duration-500" />
                                    <div style={{ color: service.color }} className="relative z-10 mb-1 transition-transform duration-300 group-hover/tile:scale-110">
                                        {service.icon}
                                    </div>
                                    <span className="text-[13px] font-black text-[#1F1F1F] leading-tight tracking-tight text-center font-sans relative z-10">
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
                                                            className="flex items-center gap-4 bg-white border border-[#E8DCCB]/50 h-14 px-5 rounded-xl shadow-sm hover:border-[#B88952] transition-colors group"
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
                                                            className="flex-1 bg-white border border-[#E8DCCB]/50 h-16 rounded-xl flex items-center justify-center text-[22px] font-serif font-black text-[#1F1F1F] shadow-sm hover:border-[#B88952] transition-colors"
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
                                                {req.type === 'Cleaning' ? <Sparkles className="w-5 h-5" /> : 
                                                 req.type === 'Dining' ? <Utensils className="w-5 h-5" /> : 
                                                 req.type === 'Laundry' ? <Shirt className="w-5 h-5" /> :
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
                className="mb-20 px-0 sm:px-6"
            >
                <motion.div 
                    whileTap={{ scale: 0.98 }}
                    className="bg-[#1F1F1F] rounded-[26px] p-8 flex items-center justify-between shadow-2xl relative overflow-hidden"
                >
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Need Anything?</p>
                        <h3 className="text-2xl font-serif text-white font-medium mb-1 tracking-tight">Talk to Concierge</h3>
                        <p className="text-[11px] text-white/60 font-medium">Available 24/7 for you</p>
                    </div>
                    <motion.button 
                        whileTap={{ scale: 0.94 }}
                        className="relative z-10 h-14 px-8 bg-[#CFA46A] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-xl shadow-[#CFA46A]/20"
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
