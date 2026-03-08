"use client";

import { useState } from "react";
import {
    Clock,
    ArrowLeft,
    MessageCircle,
    Phone,
    Info,
    CheckCircle2,
    Calendar
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useHotelBranding } from "@/utils/store";
import { useGuestRoom } from "../GuestAuthWrapper";

export default function LateCheckoutPage() {
    const router = useRouter();
    const params = useParams();
    const hotelSlug = params?.hotel_slug as string;
    const { branding } = useHotelBranding(hotelSlug);
    const { roomNumber } = useGuestRoom();

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    const charges = [
        {
            time: "Until 2:00 PM",
            price: branding?.lateCheckoutCharge1 || "Complimentary",
            note: "Subject to availability"
        },
        {
            time: "2:00 PM - 6:00 PM",
            price: branding?.lateCheckoutCharge2 || "₹1,500",
            note: "Flat rate extension"
        },
        {
            time: "After 6:00 PM",
            price: branding?.lateCheckoutCharge3 || "Full Day Rate",
            note: "Additional night charge"
        },
    ];

    const handleWhatsApp = () => {
        const phone = branding?.lateCheckoutPhone || branding?.receptionPhone || "+919999999999";
        const messageText = `Hi ${branding?.name || 'Reception'}, I am in Room ${roomNumber || '[Room]'} and I would like to request a Late Checkout. Please let me know the availability.`;
        const message = encodeURIComponent(messageText);
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
    };

    const handleCall = () => {
        const phone = branding?.lateCheckoutPhone || branding?.receptionPhone;
        if (phone) {
            const sanitizedPhone = phone.replace(/[^0-9+]/g, '');
            window.location.href = `tel:${sanitizedPhone}`;
        }
    };

    return (
        <div className="min-h-screen bg-[#fafaf9] pb-24 font-sans text-slate-900">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-lg font-serif font-medium">Late Checkout</h1>
                <div className="w-10" /> {/* Spacer */}
            </header>

            <motion.main
                variants={container}
                initial="hidden"
                animate="show"
                className="px-6 pt-8 max-w-lg mx-auto"
            >
                {/* Hero Section */}
                <motion.div variants={item} className="mb-10 text-center">
                    <div className="w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm shadow-purple-100">
                        <Clock className="w-10 h-10 text-purple-600" />
                    </div>
                    <h2 className="text-3xl font-serif mb-4">Extend Your Stay</h2>
                    <p className="text-slate-500 leading-relaxed">
                        Enjoy the luxury of our amenities for a few more hours. We offer flexible checkout options to fit your travel schedule.
                    </p>
                </motion.div>

                {/* Charges Card */}
                <motion.div variants={item} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Info className="w-5 h-5 text-purple-500" />
                        <h3 className="font-serif text-xl">Pricing & Policy</h3>
                    </div>

                    <div className="space-y-6">
                        {charges.map((charge, idx) => (
                            <div key={idx} className="flex items-start justify-between group">
                                <div>
                                    <p className="font-semibold text-slate-800">{charge.time}</p>
                                    <p className="text-sm text-slate-400">{charge.note}</p>
                                </div>
                                <div className="text-right text-purple-600 font-bold">
                                    {charge.price}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center gap-3 text-sm text-slate-400 italic">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>All requests are processed manually by our guest relations team.</span>
                    </div>
                </motion.div>

                {/* Contact Options */}
                <motion.div variants={item} className="space-y-4">
                    <button
                        onClick={handleWhatsApp}
                        className="w-full bg-[#25D366] hover:bg-[#20bd5c] text-white rounded-2xl py-5 px-6 flex items-center justify-center gap-3 font-bold transition-all active:scale-[0.98] shadow-lg shadow-emerald-100"
                    >
                        <MessageCircle className="w-6 h-6" />
                        Chat on WhatsApp
                    </button>

                    <button
                        onClick={handleCall}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-5 px-6 flex items-center justify-center gap-3 font-bold transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
                    >
                        <Phone className="w-6 h-6" />
                        Call Reception
                    </button>

                    <p className="text-center text-xs text-slate-400 mt-6 px-4">
                        Standard checkout time is 11:00 AM. Late checkout is strictly subject to room availability for the next guest.
                    </p>
                </motion.div>
            </motion.main>
        </div>
    );
}
