"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Phone, Home, Calendar, Send, Loader2, CheckCircle2, MessageSquare } from "lucide-react";
import { addGuest, HotelBranding } from "@/utils/store";

interface GuestEntryFormProps {
    isOpen: boolean;
    onClose: () => void;
    branding: HotelBranding;
    onSuccess?: () => void;
    initialRoomNumber?: string;
}

export default function GuestEntryForm({ isOpen, onClose, branding, onSuccess, initialRoomNumber }: GuestEntryFormProps) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        room_number: initialRoomNumber || "",
        check_in_date: new Date().toISOString().split('T')[0]
    });

    React.useEffect(() => {
        if (isOpen && initialRoomNumber) {
            setFormData(prev => ({ ...prev, room_number: initialRoomNumber }));
        }
    }, [isOpen, initialRoomNumber]);

    const generateWhatsAppUrl = (name: string, phone: string, room: string, pin?: string) => {
        const dashboardUrl = `${window.location.origin}/${branding.slug}/guest/dashboard${pin ? `?room=${room}&pin=${pin}` : ''}`;
        const defaultMsg = `Hello ${name} 👋\n\nWelcome to ${branding.name}.\n\nYour Room Number: ${room}\n\nYou can order food or request services here:\n${dashboardUrl}\n\nHave a great stay!`;

        let message = branding.welcomeMessage || defaultMsg;

        // Personalize if placeholder exists or just append if it's custom
        if (branding.welcomeMessage) {
            message = message
                .replace(/{name}/g, name)
                .replace(/{room}/g, room)
                .replace(/{link}/g, dashboardUrl);

            // If the user didn't use placeholders, append the essential info for better DX
            if (!branding.welcomeMessage.includes('{room}') && !branding.welcomeMessage.includes(room)) {
                message += `\n\nRoom: ${room}\nServices: ${dashboardUrl}`;
            }
        }

        const encoded = encodeURIComponent(message);
        const numericPhone = phone.replace(/[^0-9]/g, '');
        const finalPhone = (numericPhone.length === 10) ? `91${numericPhone}` : numericPhone;

        return `https://wa.me/${finalPhone}?text=${encoded}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error, pin } = await addGuest({
                hotel_id: branding.id,
                name: formData.name,
                phone: formData.phone,
                room_number: formData.room_number,
                check_in_date: formData.check_in_date
            });

            if (error) throw error;

            setSuccess(true);

            // Trigger WhatsApp
            const waUrl = generateWhatsAppUrl(formData.name, formData.phone, formData.room_number, pin);
            window.open(waUrl, "_blank");

            setTimeout(() => {
                setSuccess(false);
                setFormData({
                    name: "",
                    phone: "",
                    room_number: "",
                    check_in_date: new Date().toISOString().split('T')[0]
                });
                onSuccess?.();
                onClose();
            }, 2000);

        } catch (err) {
            console.error("Error adding guest:", err);
            alert("Failed to save guest details. Please check database permissions.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
                    >
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Add New Guest</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Assign room & trigger welcome message</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                                <X className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-8">
                            {success ? (
                                <div className="py-10 text-center">
                                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <h4 className="text-2xl font-black text-slate-900 mb-2">Guest Registered!</h4>
                                    <p className="text-slate-500 font-medium">WhatsApp message triggered. Room status updated.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guest Name</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                <input
                                                    type="text"
                                                    placeholder="Rahul Sharma"
                                                    required
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                <input
                                                    type="tel"
                                                    placeholder="9876543210"
                                                    required
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                                    value={formData.phone}
                                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Room Number</label>
                                            <div className="relative">
                                                <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                <input
                                                    type="text"
                                                    placeholder="203"
                                                    required
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                                    value={formData.room_number}
                                                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Check-in Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                                <input
                                                    type="date"
                                                    required
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                                                    value={formData.check_in_date}
                                                    onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        style={{ backgroundColor: branding.primaryColor }}
                                        className="w-full py-5 rounded-[1.5rem] text-white font-black text-sm flex items-center justify-center shadow-xl shadow-blue-100 transition-all active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                            <>
                                                <MessageSquare className="w-5 h-5 mr-3" />
                                                Save & Send Welcome Message
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
