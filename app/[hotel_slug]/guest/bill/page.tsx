"use client";

import React, { useState } from "react";
import { ArrowLeft, Receipt, CreditCard, CheckCircle, ChevronRight, Download } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useSupabaseRequests, addSupabaseRequest, useHotelBranding } from "@/utils/store";
import { useGuestRoom } from "../GuestAuthWrapper";
import { motion, AnimatePresence } from "framer-motion";

export default function BillPage() {
    const router = useRouter();
    const params = useParams();
    const hotelSlug = params?.hotel_slug as string;
    const { roomNumber, checkedInAt } = useGuestRoom();
    const { branding } = useHotelBranding(hotelSlug);
    const requests = useSupabaseRequests(branding?.id, roomNumber, checkedInAt);

    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [checkoutComplete, setCheckoutComplete] = useState(false);

    // Filter requests for the current room and session
    const roomRequests = requests.filter(r =>
        r.room === roomNumber &&
        (r.price || 0) > 0 &&
        (!checkedInAt || r.timestamp >= checkedInAt)
    );
    const totalAmount = roomRequests.reduce((sum, r) => sum + (r.total || 0), 0);
    const taxAmount = totalAmount * 0.12; // 12% mock tax
    const grandTotal = totalAmount + taxAmount;

    const handleCheckout = async () => {
        if (!branding?.id) return;
        setIsCheckingOut(true);
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Add a "Checkout Requested" signal to admin
        await addSupabaseRequest(branding.id, {
            room: roomNumber,
            type: "Checkout Requested",
            notes: `Guest finalized bill: $${grandTotal.toFixed(2)}`,
            status: "Pending",
            price: grandTotal,
            total: grandTotal
        });

        setIsCheckingOut(false);
        setCheckoutComplete(true);
    };

    if (checkoutComplete) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
            >
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-100/50">
                    <CheckCircle className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">Process Started</h2>
                <p className="text-slate-500 font-medium mb-8">Your checkout request has been sent to the front desk. You can proceed to the lobby.</p>
                <button
                    onClick={() => router.push(`/${hotelSlug}/guest/dashboard`)}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold active:scale-95 transition-transform"
                    style={{ backgroundColor: branding?.primaryColor }}
                >
                    Back to Home
                </button>
            </motion.div>
        );
    }

    return (
        <div className="pb-32">
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm active:scale-90 transition-transform">
                    <ArrowLeft className="w-5 h-5 text-slate-800" />
                </button>
                <h1 className="text-xl font-black text-slate-900">Room Invoice</h1>
                <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                    <Download className="w-5 h-5" />
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 rounded-[2.5rem] p-8 text-white mb-10 relative overflow-hidden"
                style={{ backgroundColor: branding?.primaryColor || "#0f172a" }}
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Total Outstanding</p>
                    <h2 className="text-5xl font-black tracking-tighter mb-6">${grandTotal.toFixed(2)}</h2>
                    <div className="flex items-center justify-between pt-6 border-t border-white/10">
                        <div className="flex items-center">
                            <Receipt className="w-4 h-4 mr-2 text-blue-400" />
                            <span className="text-sm font-bold text-slate-300">Room {roomNumber}</span>
                        </div>
                        <span className="text-[10px] font-black bg-blue-600 px-3 py-1 rounded-full" style={{ backgroundColor: branding?.accentColor }}>ACTIVE</span>
                    </div>
                </div>
            </motion.div>

            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 px-2">Order History</h3>

            <div className="space-y-4 mb-10">
                {roomRequests.length > 0 ? (
                    roomRequests.map((req, index) => (
                        <motion.div
                            key={req.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white p-5 rounded-3xl border border-slate-50 flex items-center justify-between group"
                        >
                            <div className="flex items-center">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mr-4 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    <Receipt className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">{req.type}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{req.time}</p>
                                </div>
                            </div>
                            <span className="font-black text-slate-900">${(req.total || 0).toFixed(2)}</span>
                        </motion.div>
                    ))
                ) : (
                    <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                        <p className="text-slate-400 font-bold italic">No billable services yet.</p>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-[2rem] p-6 border border-slate-50 space-y-3 mb-10">
                <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-slate-900">${totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-400">Taxes (12%)</span>
                    <span className="text-slate-900">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                    <span className="text-lg font-black text-slate-900">Grand Total</span>
                    <span className="text-2xl font-black text-blue-600" style={{ color: branding?.primaryColor }}>${grandTotal.toFixed(2)}</span>
                </div>
            </div>

            <button
                onClick={handleCheckout}
                disabled={isCheckingOut || grandTotal === 0}
                className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:active:scale-100"
                style={{ backgroundColor: branding?.primaryColor }}
            >
                {isCheckingOut ? (
                    <span className="flex items-center">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="mr-3"><CheckCircle className="w-5 h-5" /></motion.div>
                        Processing...
                    </span>
                ) : (
                    <span className="flex items-center">
                        <CreditCard className="w-5 h-5 mr-3" /> Request Checkout
                    </span>
                )}
            </button>
        </div>
    );
}
