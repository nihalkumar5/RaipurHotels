"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { StaffDashboard } from "@/components/StaffDashboard";
import { ConciergeBell, Users, LayoutGrid, List, Plus, MapPin, User, Phone, CheckCircle2, History, MessageCircle, Utensils, CreditCard, LogOut, Loader2, ArrowRight, Hotel } from "lucide-react";
import { useHotelBranding, getHotelGuests, getHotelRooms, deleteGuest, Guest, Room, supabase } from "@/utils/store";
import { motion, AnimatePresence } from "framer-motion";
import GuestEntryForm from "@/components/GuestEntryForm";
import { buildGuestWelcomeMessage, buildWhatsAppUrl, formatWhatsAppPhone } from "@/lib/hotel/whatsapp";

export default function ReceptionPage() {
    const params = useParams();
    const hotelSlug = params?.hotel_slug as string;
    const { branding } = useHotelBranding(hotelSlug);

    const [view, setView] = useState<'requests' | 'rooms'>('requests');
    const [isGuestFormOpen, setIsGuestFormOpen] = useState(false);
    const [guests, setGuests] = useState<Guest[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoomNum, setSelectedRoomNum] = useState<string | null>(null);

    const loadData = async () => {
        if (!branding?.id) return;
        setLoading(true);

        try {
            // Load Guests
            const { data: guestData, error: gError } = await getHotelGuests(branding.id);
            if (guestData) setGuests(guestData);

            // Load Rooms
            const { data: roomData } = await getHotelRooms(branding.id);
            if (roomData) setRooms(roomData);
        } catch (err) {
            console.error("Load Data Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (branding?.id) {
            loadData();
        }
    }, [branding?.id]);

    const handleCheckout = async (guest: Guest) => {
        if (!branding?.id) return;
        if (confirm(`Are you sure you want to checkout Room ${guest.room_number}?`)) {
            // Trigger WhatsApp Feedback message BEFORE deletion (soft delete/status update in store)
            if (guest.phone && (branding.checkoutMessage || branding.googleReviewLink)) {
                let message = branding.checkoutMessage || "Thank you for staying with us! Hope you had a comfortable stay at {hotel_name}. Please share your feedback: ";

                // Replace placeholders
                message = message
                    .replace(/{name}/g, guest.name)
                    .replace(/{hotel_name}/g, branding.name)
                    .replace(/{room}/g, guest.room_number);

                if (branding.googleReviewLink) {
                    message += `\n\nReview us on Google: ${branding.googleReviewLink}`;
                }

                const encodedMessage = encodeURIComponent(message);
                const finalPhone = formatWhatsAppPhone(guest.phone);

                const whatsappUrl = `https://wa.me/${finalPhone}?text=${encodedMessage}`;
                window.open(whatsappUrl, '_blank');
            }

            const { error } = await deleteGuest(guest.id, branding.id, guest.room_number);
            if (!error) loadData();
        }
    };

    const sendQuickWA = (guest: Guest, type: 'menu' | 'checkout' | 'welcome') => {
        let msg = "";
        const dashboardUrl = `${window.location.origin}/${hotelSlug}/guest/dashboard`;
        const numericPhone = guest.phone.replace(/[^0-9]/g, '');
        const finalPhone = (numericPhone.length === 10) ? `91${numericPhone}` : numericPhone;

        if (type === 'menu') {
            msg = `Hello ${guest.name} 👋\n\nHope you're having a great stay. Here is our digital menu and service list: ${dashboardUrl}`;
        } else if (type === 'checkout') {
            msg = `Hello ${guest.name} 👋\n\nJust a reminder for your checkout today. Hope you had a comfortable stay at ${branding?.name}!`;
        } else {
            msg = buildGuestWelcomeMessage({
                guestName: guest.name,
                hotelName: branding?.name || "Your Hotel",
                roomNumber: guest.room_number,
                welcomeMessage: branding?.welcomeMessage,
            });
        }


        const url = buildWhatsAppUrl(finalPhone, msg);
        if (url) {
            window.open(url, "_blank");
        }
    };

    if (view === 'requests') {
        return (
            <div className="relative min-h-screen">
                <StaffDashboard
                    hotelSlug={hotelSlug}
                    department="reception"
                    title="Reception Desk"
                    icon={<ConciergeBell className="w-8 h-8" />}
                />

                {/* View Switcher Floating Button */}
                <button
                    onClick={() => setView('rooms')}
                    className="fixed bottom-8 right-8 bg-slate-900 text-white px-8 py-6 rounded-[2rem] shadow-2xl flex items-center gap-4 font-black transition-all hover:scale-105 active:scale-95 z-50 group border border-slate-700 hover:bg-slate-800"
                >
                    <LayoutGrid className="w-6 h-6" />
                    <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">Room Management</span>
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                        <div className="w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-100">
                            <Hotel className="w-8 h-8 text-blue-600" />
                        </div>
                        Room Board
                    </h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 ml-1">Live Occupancy & Guest Automation</p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setView('requests')}
                        className="px-6 py-4 bg-white border border-slate-200 rounded-2xl font-black text-sm text-slate-600 shadow-sm flex items-center gap-3 transition-all hover:bg-slate-50"
                    >
                        <ConciergeBell className="w-5 h-5" />
                        Requests View
                    </button>
                    <button
                        onClick={() => {
                            setSelectedRoomNum("");
                            setIsGuestFormOpen(true);
                        }}
                        style={{ backgroundColor: branding?.primaryColor || "#3b82f6" }}
                        className="px-8 py-4 text-white rounded-2xl font-black text-sm shadow-xl flex items-center gap-3 transition-all hover:brightness-110 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Guest
                    </button>
                </div>
            </div>

            {/* Room Filters & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                {[
                    { label: 'All Rooms', count: rooms.length, icon: <Hotel className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600' },
                    { label: 'Occupied', count: rooms.filter(r => guests.some(g => g.room_number === r.room_number)).length, icon: <Users className="w-6 h-6" />, color: 'bg-red-50 text-red-600' },
                    { label: 'Available', count: rooms.filter(r => !guests.some(g => g.room_number === r.room_number)).length, icon: <CheckCircle2 className="w-6 h-6" />, color: 'bg-emerald-50 text-emerald-600' },
                    { label: 'In Progress', count: guests.length, icon: <MessageCircle className="w-6 h-6" />, color: 'bg-amber-50 text-amber-600' }
                ].map((stat, i) => (
                    <div key={stat.label} className={`bg-white p-6 rounded-[2.5rem] border transition-all ${i === 0 ? 'border-blue-100 shadow-xl shadow-blue-50/50' : 'border-slate-100 shadow-sm'}`}>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                        <div className="flex items-end justify-between">
                            <h2 className="text-3xl font-black text-slate-900">{stat.count}</h2>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color}`}>
                                {stat.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Rooms Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                <AnimatePresence mode="popLayout">
                    {rooms.map((room) => {
                        const guest = guests.find(g => g.room_number === room.room_number);
                        return (
                            <motion.div
                                key={room.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`relative group rounded-[3rem] p-8 border-2 transition-all ${guest ? 'bg-white border-red-50 shadow-2xl shadow-red-50/40' : 'bg-white border-slate-50 hover:border-emerald-100 shadow-sm'
                                    }`}
                            >
                                <div className="flex flex-col h-full min-h-[160px]">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Room</span>
                                            <h3 className="text-3xl font-black text-slate-900 leading-none">{room.room_number}</h3>
                                        </div>
                                        <div className={`w-4 h-4 rounded-full ${guest ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]'} animate-pulse`} />
                                    </div>

                                    {guest ? (
                                        <div className="flex-1 flex flex-col justify-between space-y-4">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Guest Occupying</p>
                                                <p className="text-sm font-black text-slate-900 truncate">{guest.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                                                    <Phone className="w-3 h-3" /> {guest.phone}
                                                </p>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => sendQuickWA(guest, 'menu')}
                                                    className="flex-1 h-12 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all flex items-center justify-center active:scale-95"
                                                    title="Send Digital Menu"
                                                >
                                                    <Utensils className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleCheckout(guest)}
                                                    className="flex-1 h-12 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all flex items-center justify-center active:scale-95"
                                                    title="Checkout Guest"
                                                >
                                                    <LogOut className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col justify-end">
                                            <div className="flex items-center gap-2 mb-6">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Available</span>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedRoomNum(room.room_number);
                                                    setIsGuestFormOpen(true);
                                                }}
                                                className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-dashed border-slate-200"
                                            >
                                                Assign Guest
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {branding && (
                <GuestEntryForm
                    isOpen={isGuestFormOpen}
                    onClose={() => setIsGuestFormOpen(false)}
                    branding={branding}
                    onSuccess={loadData}
                    initialRoomNumber={selectedRoomNum || ""}
                />
            )}
        </div>
    );
}
