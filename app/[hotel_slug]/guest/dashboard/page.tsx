"use client";

import { ServiceCard } from "@/components/ServiceCard";
import { HotelLogo } from "@/components/HotelLogo";
import { RoomHeader } from "@/components/RoomHeader";
import { Wifi, Utensils, Shirt, Sparkles, Phone, Info, Droplets, CheckCircle, Clock } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useHotelBranding, useSupabaseRequests, addSupabaseRequest } from "@/utils/store";
import { useGuestRoom } from "../GuestAuthWrapper";

export default function GuestDashboard() {
    const router = useRouter();
    const params = useParams();
    const hotelSlug = params?.hotel_slug as string;

    const { branding, loading } = useHotelBranding(hotelSlug);
    const requests = useSupabaseRequests(branding?.id);

    // Check for active water request
    const pendingWater = requests.find(r => r.type === "Water" && (r.status === "Pending" || r.status === "In Progress"));
    const activeRequests = requests.filter(r => r.status === "Pending" || r.status === "In Progress");

    const { roomNumber } = useGuestRoom();

    const services = [
        { id: "wifi", title: "Wi-Fi", icon: <Wifi />, path: `/${hotelSlug}/guest/wifi`, category: "Connect" },
        { id: "room-service", title: "Dining", icon: <Utensils />, path: `/${hotelSlug}/guest/restaurant`, category: "Food" },
        { id: "laundry", title: "Laundry", icon: <Shirt />, path: `/${hotelSlug}/guest/services?type=laundry`, category: "Care" },
        { id: "housekeeping", title: "Clean", icon: <Sparkles />, path: `/${hotelSlug}/guest/services?type=housekeeping`, category: "Service" },
        { id: "reception", title: "Concierge", icon: <Phone />, path: `/${hotelSlug}/guest/services?type=reception`, category: "Contact" },
        { id: "hotel-info", title: "Details", icon: <Info />, path: `/${hotelSlug}/guest/info`, category: "Hotel" },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const handleQuickWater = async () => {
        if (!branding?.id) return;
        const { error } = await addSupabaseRequest(branding.id, {
            room: roomNumber,
            type: "Water",
            notes: "Immediate Necessity - 500ml",
            status: "Pending",
            price: 0,
            total: 0
        });

        if (error) {
            alert(`Could not send request: ${error.message || 'Unknown error'}. Please try again or call reception.`);
        } else {
            alert("Water request sent! Our staff is on the way.");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="pb-8 overflow-hidden">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <HotelLogo name={branding?.name} />
                <RoomHeader roomNumber={roomNumber} />
            </motion.div>

            {/* Express Water / Status Button */}
            <motion.button
                onClick={pendingWater ? () => router.push(`/${hotelSlug}/guest/status`) : handleQuickWater}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, type: "spring" }}
                className={`w-full mb-8 rounded-[2rem] p-6 text-white flex items-center justify-between relative overflow-hidden group shadow-xl transition-colors duration-500 ${pendingWater ? 'bg-green-600 shadow-green-100' : 'bg-blue-600 shadow-blue-100'}`}
                style={{ backgroundColor: !pendingWater ? branding?.primaryColor : undefined }}
            >
                <div className={`absolute inset-0 opacity-20 animate-pulse ${pendingWater ? 'bg-white' : 'bg-blue-400'}`}></div>
                <div className="relative z-10 flex items-center">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mr-4 group-hover:rotate-12 transition-transform">
                        {pendingWater ? <Clock className="w-6 h-6 text-white" /> : <Droplets className="w-6 h-6 text-white" />}
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-black leading-tight">
                            {pendingWater ? "Water on the way" : "Express Water"}
                        </h3>
                        <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest opacity-80">
                            {pendingWater ? "Arriving in approx 2-4 mins" : "One-tap critical service"}
                        </p>
                    </div>
                </div>
                <div className="relative z-10 flex items-center bg-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    {pendingWater ? "VIEW STATUS" : "ORDER NOW"}
                </div>
            </motion.button>

            {/* Active Request Tracker Banner */}
            {activeRequests.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mb-8 overflow-hidden"
                >
                    <div
                        onClick={() => router.push(`/${hotelSlug}/guest/status`)}
                        className="bg-slate-900 rounded-3xl p-5 text-white flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all"
                    >
                        <div className="flex items-center">
                            <div className="flex -space-x-2 mr-4">
                                {activeRequests.slice(0, 3).map((r, i) => (
                                    <div key={r.id} className="w-8 h-8 rounded-full bg-blue-600 border-2 border-slate-900 flex items-center justify-center">
                                        <Sparkles className="w-3.5 h-3.5" />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-blue-400">Live Mission</p>
                                <p className="text-sm font-bold">{activeRequests.length} active signal{activeRequests.length > 1 ? 's' : ''} in progress</p>
                            </div>
                        </div>
                        <CheckCircle className="w-5 h-5 text-green-500 animate-pulse" />
                    </div>
                </motion.div>
            )}

            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-between mb-6"
            >
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Discover</h2>
                <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" style={{ backgroundColor: branding?.primaryColor }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-200"></div>
                </div>
            </motion.div>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 gap-5"
            >
                {services.map((service, index) => (
                    <ServiceCard
                        key={service.id}
                        title={service.title}
                        description={service.category}
                        icon={service.icon}
                        delay={0.1 + index * 0.05}
                        onClick={() => router.push(service.path)}
                    />
                ))}
            </motion.div>

            {/* Premium Promo Card */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="mt-8 relative rounded-[2.5rem] overflow-hidden group shadow-2xl"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 opacity-90" style={{ backgroundImage: `linear-gradient(to right, ${branding?.primaryColor}, ${branding?.accentColor})` }}></div>
                <div className="relative p-8 text-white">
                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Premium Offer</span>
                    <h3 className="text-2xl font-black mt-3 leading-tight">Relax at our<br />Infinity Spa</h3>
                    <p className="text-white/70 text-sm mt-2 font-medium">Book now for 20% off all treatments.</p>
                    <button className="mt-6 bg-white text-blue-600 px-6 py-2.5 rounded-2xl font-bold text-sm shadow-xl shadow-black/10 active:scale-95 transition-transform" style={{ color: branding?.primaryColor }}>
                        Explore Spa
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
