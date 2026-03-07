"use client";

import React, { useState } from "react";
import { ServiceCard } from "@/components/ServiceCard";
import {
    Wifi, Utensils, Phone,
    Zap, Droplets, Wind, Sparkles, Coffee, Layout, ChefHat, Home, User, Compass, AlertCircle,
    ChevronLeft, ChevronRight, ExternalLink, Clock, MapPin, Music, Star, Shirt
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

    const { branding, loading } = useHotelBranding(hotelSlug);
    const { offers, loading: loadingOffers } = useSpecialOffers(branding?.id);
    const requests = useSupabaseRequests(branding?.id);
    const { roomNumber, checkoutDate, checkoutTime } = useGuestRoom();

    const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
    const [scrolled, setScrolled] = useState(false);
    const [showTeaOptions, setShowTeaOptions] = useState(false);

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
            setToast({ message: `${type} Request Placed Successfully`, type: "success", isVisible: true });
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

    return (
        <div className="pb-40 px-5 pt-6 min-h-screen bg-background max-w-[520px] mx-auto overflow-x-hidden">
            {/* 1. Branded Header Section (Scroll Shrinking) */}
            <motion.header
                animate={{
                    width: scrolled ? "calc(100% - 40px)" : "calc(100% - 32px)",
                    top: scrolled ? 12 : 20,
                    padding: scrolled ? "12px 24px" : "16px 20px"
                }}
                className="fixed left-1/2 -translate-x-1/2 max-w-[480px] z-50 bg-white/90 backdrop-blur-2xl rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex items-center justify-between transition-all duration-300"
            >
                <div className="flex items-center overflow-hidden">
                    <motion.div
                        animate={{ scale: scrolled ? 0.8 : 1 }}
                        className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mr-3 border border-slate-100 shrink-0 overflow-hidden"
                    >
                        {branding?.logoImage ? (
                            <img src={branding.logoImage} alt={branding.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-sm font-black text-slate-900">{branding?.name?.charAt(0)}</span>
                        )}
                    </motion.div>
                    <div className="flex flex-col">
                        <motion.h1
                            animate={{ fontSize: scrolled ? "14px" : "16px" }}
                            className="font-serif text-slate-900 leading-none tracking-tight whitespace-nowrap"
                        >
                            {branding?.name || "Premium Hotel"}
                            {scrolled && <span className="text-slate-300 mx-2 font-normal">•</span>}
                            {scrolled && <span className="text-amber-600">Room {roomNumber || "---"}</span>}
                        </motion.h1>
                        <AnimatePresence>
                            {!scrolled && (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 mt-1"
                                >
                                    Concierge Active
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <motion.div
                    animate={{ scale: scrolled ? 0.9 : 1 }}
                    className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full flex items-center shadow-sm"
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600">Secure Access</span>
                </motion.div>
            </motion.header>

            {/* Spacer for fixed header */}
            <div className="h-[90px]"></div>

            {/* 2. Hero Section (Upgraded Room Card) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="relative cursor-pointer z-10"
            >
                <div className="relative bg-white rounded-[2.5rem] p-6 pb-7 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] border border-slate-100 flex flex-col overflow-hidden">
                    {/* Top Detail Row */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400">Authenticated Room</p>
                        </div>
                        <div className="flex items-center text-slate-400">
                            <div className="flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                <span className="text-[10px] font-bold">2 Guests</span>
                            </div>
                        </div>
                    </div>

                    {/* Room Number Hero */}
                    <div className="mb-6">
                        <h2 className="text-[36px] font-serif text-slate-900 tracking-tighter leading-none">
                            Room <span className="text-amber-600 font-bold">{roomNumber || "---"}</span>
                        </h2>
                    </div>

                    {/* Check-out Details */}
                    <div className="mb-6 flex items-end justify-between text-slate-400">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Check-out</p>
                            <p className="text-xl font-serif italic text-slate-900 tracking-tight leading-none">
                                {checkoutDate ? new Date(checkoutDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : "24 Jun, 2026"}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="px-5 py-2.5 bg-amber-50 rounded-2xl border border-amber-100 shadow-sm flex flex-col items-center">
                                <p className="text-[14px] font-black text-amber-600 uppercase tracking-tighter leading-none">{checkoutTime || "11:00 AM"}</p>
                                <p className="text-[8px] font-bold text-amber-600/40 uppercase tracking-widest mt-1">Sharp</p>
                            </div>
                        </div>
                    </div>

                </div>
            </motion.div>

            {/* 5. Dynamic Special Offers Slider */}
            {(offers.length > 0 || loadingOffers) && (
                <motion.section variants={item} className="mb-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-serif text-slate-900">Exclusive Privileges</h2>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentOfferIndex((prev: number) => (prev === 0 ? offers.length - 1 : prev - 1))}
                                className="w-8 h-8 rounded-full glass flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentOfferIndex((prev: number) => (prev === offers.length - 1 ? 0 : prev + 1))}
                                className="w-8 h-8 rounded-full glass flex items-center justify-center text-foreground/40 hover:text-foreground transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="relative aspect-[16/9] rounded-[2.5rem] overflow-hidden group">
                        {loadingOffers ? (
                            <div className="w-full h-full glass animate-pulse flex items-center justify-center">
                                <div className="w-8 h-8 border-2 border-foreground/10 border-t-foreground/40 rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentOfferIndex}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="relative w-full h-full"
                                >
                                    <img
                                        src={offers[currentOfferIndex]?.image_url || "https://images.unsplash.com/photo-1544161515-4ae6ce6db87e?auto=format&fit=crop&q=80"}
                                        alt={offers[currentOfferIndex]?.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                                        <h3 className="text-2xl font-serif text-white mb-2">{offers[currentOfferIndex]?.title}</h3>
                                        <p className="text-white/60 text-sm font-medium max-w-xs">{offers[currentOfferIndex]?.description}</p>
                                        <div className="mt-6">
                                            <button className="px-6 py-2.5 bg-white rounded-full text-[10px] font-black uppercase tracking-widest text-black hover:bg-amber-500 transition-colors">
                                                Claim Privilege
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                </motion.section>
            )
            }

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-8 mt-10"
            >
                {/* 2. Quick Actions Grid (Unified Luxury Palette) */}
                <motion.section variants={item}>
                    <div className="grid grid-cols-4 gap-6">
                        {[
                            { label: "Laundry", icon: <Shirt />, bg: "bg-slate-900/5 text-slate-900", action: () => { router.push(`/${hotelSlug}/guest/services?type=laundry`) } },
                            { label: "Wi-Fi", icon: <Wifi />, bg: "bg-amber-600/10 text-amber-700", action: () => { router.push(`/${hotelSlug}/guest/wifi`) } },
                            { label: "Dining", icon: <Utensils />, bg: "bg-slate-900/5 text-slate-900", action: () => { router.push(`/${hotelSlug}/guest/restaurant`) } },
                            {
                                label: "Contact",
                                icon: <Phone />,
                                bg: "bg-amber-600/10 text-amber-700",
                                action: () => {
                                    if (branding?.receptionPhone) {
                                        window.location.href = `tel:${branding.receptionPhone}`;
                                    } else {
                                        setToast({
                                            message: "Reception phone not configured. Please visit front desk.",
                                            type: "error",
                                            isVisible: true
                                        });
                                        setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 5000);
                                    }
                                }
                            }
                        ].map((action, i) => (
                            <button
                                key={i}
                                onClick={() => action.action()}
                                className="flex flex-col items-center group"
                            >
                                <div className={`w-14 h-14 rounded-[1.25rem] ${action.bg} flex items-center justify-center mb-2 shadow-sm group-hover:shadow-md transition-all group-active:scale-95 border border-slate-100`}>
                                    {renderIcon(action.icon, "w-6 h-6")}
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </motion.section>

                {/* 3. Smart Requests (Express Items - Premium Dark Theme Restored) */}
                <motion.section variants={item}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <Zap className="w-4 h-4 text-amber-500 mr-2" />
                            <h2 className="text-xl font-serif text-slate-900">Quick Requests</h2>
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">Fast Response</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: "Mineral Water", icon: <Droplets />, notes: "1L Bottle", type: "Water", color: "from-blue-500/10" },
                            { label: "Clean Towels", icon: <Wind />, notes: "Fresh Set", type: "Towel", color: "from-slate-500/10" },
                            { label: "Room Cleaning", icon: <Sparkles />, notes: "Full Service", type: "Cleaning", color: "from-emerald-500/10" },
                            { label: "Tea/Coffee", icon: <Coffee />, notes: "Hot Beverage", type: "TeaCoffee", color: "from-amber-500/10" },
                        ].map((req, i) => (
                            <div key={i} className="relative group">
                                <AnimatePresence mode="wait">
                                    {req.type === "TeaCoffee" && showTeaOptions ? (
                                        <motion.div
                                            key="options"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-slate-900 p-4 rounded-[2.5rem] flex flex-col justify-between min-h-[125px] border border-amber-500/50 shadow-2xl relative overflow-hidden"
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest pl-2">Choose One</p>
                                                <button
                                                    onClick={() => setShowTeaOptions(false)}
                                                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-400"
                                                >
                                                    <AlertCircle className="w-4 h-4 rotate-45" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 gap-2">
                                                <button
                                                    onClick={() => {
                                                        handleQuickRequest("Tea", "Fresh tea service");
                                                        setShowTeaOptions(false);
                                                    }}
                                                    className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white text-xs font-bold transition-all flex items-center justify-center border border-white/5"
                                                >
                                                    <Coffee className="w-3 h-3 mr-2 text-amber-500" /> Tea
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        handleQuickRequest("Coffee", "Fresh coffee service");
                                                        setShowTeaOptions(false);
                                                    }}
                                                    className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white text-xs font-bold transition-all flex items-center justify-center border border-white/5"
                                                >
                                                    <Coffee className="w-3 h-3 mr-2 text-amber-500" /> Coffee
                                                </button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.button
                                            key="button"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onClick={() => {
                                                if (req.type === "TeaCoffee") {
                                                    setShowTeaOptions(true);
                                                } else {
                                                    handleQuickRequest(req.type, req.notes);
                                                }
                                            }}
                                            className={`w-full bg-slate-900 p-6 rounded-[2.5rem] flex flex-col justify-end min-h-[125px] border border-slate-800 shadow-2xl hover:shadow-amber-900/10 hover:border-amber-500/30 transition-all duration-500 active:scale-95 group relative overflow-hidden text-left`}
                                        >
                                            {/* Subtle Glow Overlay */}
                                            <div className={`absolute inset-0 bg-gradient-to-br ${req.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>

                                            {/* Premium Shine Effect */}
                                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s]"></div>

                                            {/* Background Icon (Subtle Watermark) */}
                                            <div className="absolute top-4 right-4 text-white opacity-[0.05] group-hover:opacity-[0.1] group-hover:-translate-y-1 group-hover:translate-x-1 transition-all duration-700">
                                                {renderIcon(req.icon, "w-16 h-16")}
                                            </div>

                                            {/* Gold Accent Indicator */}
                                            <div className={`absolute top-6 left-6 w-1 h-3 rounded-full transition-all duration-500 ${submittingType === req.type ? "bg-amber-500 animate-pulse opacity-100" : "bg-amber-500 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1"}`}></div>

                                            <div className="relative z-10 w-full">
                                                <div className="flex items-center justify-between w-full">
                                                    <div>
                                                        <p className="text-lg font-serif text-white leading-tight group-hover:translate-x-1 transition-transform duration-300">{req.label}</p>
                                                        <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-widest group-hover:translate-x-1 transition-transform duration-500">{req.notes}</p>
                                                    </div>
                                                    {submittingType === req.type && (
                                                        <div className="w-5 h-5 border-2 border-white/20 border-t-amber-500 rounded-full animate-spin"></div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bottom Accent Line (Branded Gold) */}
                                            <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-amber-500 to-amber-600 group-hover:w-full transition-all duration-700"></div>
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </motion.section>

                {/* 4. Main Experience Card (Order Cuisine) */}
                <motion.section variants={item}>
                    <ServiceCard
                        featured
                        title="Order Cuisine"
                        description="Luxury Dining at your door"
                        image="/images/luxury/dining.png"
                        icon={<Utensils className="w-6 h-6" />}
                        onClick={() => router.push(`/${hotelSlug}/guest/restaurant`)}
                    />
                </motion.section>

                {/* 5. Active Requests (Status Tracking) */}
                <AnimatePresence>
                    {activeRequests.length > 0 && (
                        <motion.section
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            variants={item}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center">
                                    <Clock className="w-4 h-4 text-blue-500 mr-2" />
                                    <h2 className="text-xl font-serif text-foreground">Your Requests</h2>
                                </div>
                                <button onClick={() => router.push(`/${hotelSlug}/guest/status`)} className="text-[10px] font-black text-blue-500 uppercase tracking-widest">View All</button>
                            </div>

                            <div className="space-y-4">
                                {activeRequests.slice(0, 2).map((req) => (
                                    <div key={req.id} className="glass p-5 rounded-[2rem] flex items-center justify-between border border-white/5 shadow-sm">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mr-4">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground">{req.type}</p>
                                                <p className="text-[10px] text-foreground/40 font-medium uppercase tracking-widest mt-0.5">Status: <span className="text-blue-500 font-black">{req.status}</span></p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-foreground/20" />
                                    </div>
                                ))}
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>

                {/* 6. Concierge Section (Upsell) */}
                <motion.section variants={item}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <MapPin className="w-4 h-4 text-emerald-500 mr-2" />
                            <h2 className="text-xl font-serif text-foreground">Concierge Desk</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { title: "Explore City", desc: "Nearby Attractions", icon: <Music /> },
                            { title: "Travel", desc: "Book a Taxi", icon: <MapPin /> },
                        ].map((c, i) => (
                            <button
                                key={i}
                                className="p-6 glass rounded-[2.5rem] border border-white/5 shadow-sm text-left group transition-all active:scale-95"
                            >
                                <div className="w-10 h-10 rounded-2xl bg-foreground/5 flex items-center justify-center mb-4 text-foreground/30 group-hover:text-emerald-500 transition-colors">
                                    {renderIcon(c.icon, "w-5 h-5")}
                                </div>
                                <p className="text-sm font-bold text-foreground leading-tight">{c.title}</p>
                                <p className="text-[9px] font-medium text-foreground/40 mt-1 uppercase tracking-widest">{c.desc}</p>
                            </button>
                        ))}
                    </div>
                </motion.section>

                {/* 7. Special Offers */}
                <motion.section variants={item}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <Star className="w-4 h-4 text-amber-500 mr-2" />
                            <h2 className="text-xl font-serif text-foreground">Special Offers</h2>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#4a0404] to-[#630d0d] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-[0_20px_50px_rgba(74,4,4,0.3)] border border-white/10 group">
                        {/* Luxury Decorative Elements */}
                        <div className="absolute top-0 right-0 p-10 opacity-20 group-hover:scale-110 transition-transform duration-700">
                            <Sparkles className="w-32 h-32 text-amber-400" />
                        </div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-500/10 blur-[80px] rounded-full"></div>

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <div className="flex items-center space-x-2 mb-3">
                                    <div className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded-md">
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-amber-400">Limited Privilege</span>
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-amber-500 animate-pulse"></div>
                                </div>
                                <h3 className="text-2xl font-serif text-white mb-2 leading-tight">Luxury Spa Experience</h3>
                                <p className="text-white/60 text-[11px] font-medium uppercase tracking-[0.25em] leading-relaxed">20% Off All Treatments Today</p>
                            </div>
                            <button className="bg-gradient-to-r from-amber-500 to-amber-600 text-black px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-[0_10px_20px_-5px_rgba(245,158,11,0.4)] active:scale-95 transition-all hover:translate-y-[-2px] hover:shadow-[0_15px_30px_-5px_rgba(245,158,11,0.5)]">
                                Book Now
                            </button>
                        </div>
                    </div>
                </motion.section>
            </motion.div>

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.isVisible}
                onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
            />
        </div >
    );
}
