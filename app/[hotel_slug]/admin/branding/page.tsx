"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useHotelBranding, saveHotelBranding, HotelBranding, useSpecialOffers, saveSpecialOffer, deleteSpecialOffer, SpecialOffer } from "@/utils/store";
import { Palette, Layout, Type, Save, Check, RefreshCw, Phone, Plus, Trash2, Image as ImageIcon, Tag, Utensils, Clock, MessageSquare, Sparkles, Car } from "lucide-react";
import { motion } from "framer-motion";

export default function BrandingPage() {
    const params = useParams();
    const hotelSlug = params?.hotel_slug as string;
    const { branding, loading } = useHotelBranding(hotelSlug);

    const [config, setConfig] = useState<Partial<HotelBranding>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Special Offers State
    const { offers, loading: loadingOffers } = useSpecialOffers(branding?.id);
    const [newOffer, setNewOffer] = useState<Partial<SpecialOffer>>({ title: "", description: "", image_url: "", is_active: true });
    const [isAddingOffer, setIsAddingOffer] = useState(false);
    const [deletingOfferId, setDeletingOfferId] = useState<string | null>(null);

    useEffect(() => {
        if (branding) {
            setConfig(branding);
        }
    }, [branding]);

    const handleSave = async () => {
        if (!branding?.id) return;

        setIsSaving(true);
        const { data, error } = await saveHotelBranding(branding.id, config);
        setIsSaving(false);

        if (error) {
            console.error("Save Error:", error);
            alert(`Failed to save changes: ${error.message || "Unknown error"}. 
            
            Tip: If this is a 'column not found' error, please run the SQL force-fix provided in the chat.`);
            return;
        }

        if (data) {
            setConfig(data);
        }

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const handleDeleteOffer = async (offerId: string) => {
        if (!branding?.id || deletingOfferId) {
            return;
        }

        setDeletingOfferId(offerId);
        const { error } = await deleteSpecialOffer(offerId, branding.id);
        setDeletingOfferId(null);

        if (error) {
            alert(`Failed to delete offer: ${error.message || "Unknown error"}`);
        }
    };

    const colors = [
        { name: "Ocean Blue", primary: "#2563eb", accent: "#3b82f6" },
        { name: "Royal Purple", primary: "#7c3aed", accent: "#8b5cf6" },
        { name: "Emerald Forest", primary: "#059669", accent: "#10b981" },
        { name: "Sunset Orange", primary: "#ea580c", accent: "#f97316" },
        { name: "Midnight Black", primary: "#0f172a", accent: "#334155" },
        { name: "Rose Pink", primary: "#db2777", accent: "#ec4899" },
    ];

    if (loading) return <div className="p-20 text-center text-gray-400">Loading identity...</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight" style={{ color: config.primaryColor }}>Brand Identity</h1>
                    <p className="text-slate-500 font-medium">Configure your hotel's SaaS presence & visual DNA</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center disabled:opacity-50 active:scale-95"
                    style={{ backgroundColor: config.primaryColor }}
                >
                    {isSaving ? (
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    ) : showSuccess ? (
                        <Check className="w-5 h-5 mr-2" />
                    ) : (
                        <Save className="w-5 h-5 mr-2" />
                    )}
                    {showSuccess ? "Identity Saved" : "Save Changes"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Configuration Panel */}
                <div className="space-y-8">
                    <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center mb-6">
                            <Type className="w-5 h-5 text-blue-600 mr-3" style={{ color: config.primaryColor }} />
                            <h2 className="text-xl font-black text-slate-900">General Identity</h2>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hotel Name</label>
                                <input
                                    type="text"
                                    value={config.name || ""}
                                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 font-bold text-slate-900 focus:ring-2 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">City</label>
                                <input
                                    type="text"
                                    value={config.city || ""}
                                    onChange={(e) => setConfig({ ...config, city: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 font-bold text-slate-900 focus:ring-2 transition-all outline-none"
                                    placeholder="e.g. Raipur, India"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Logo Initial</label>
                                    <input
                                        type="text"
                                        maxLength={1}
                                        value={config.logo || ""}
                                        onChange={(e) => setConfig({ ...config, logo: e.target.value.toUpperCase() })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 font-black text-2xl text-center text-slate-900 focus:ring-2 transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Upload Custom Logo</label>
                                    <div className="relative w-full h-[56px] bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden hover:bg-slate-100 transition-colors cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setConfig({ ...config, logoImage: reader.result as string });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                        <span className="text-xs font-bold text-slate-500">{config.logoImage ? "Change Image" : "Upload File"}</span>
                                    </div>
                                    {config.logoImage && (
                                        <button onClick={() => setConfig({ ...config, logoImage: undefined })} className="text-[10px] text-red-500 font-bold mt-2 uppercase">Remove Logo Image</button>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Guest Hero Image URL</label>
                                <input
                                    type="text"
                                    value={config.heroImage || ""}
                                    onChange={(e) => setConfig({ ...config, heroImage: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 font-bold text-slate-900 focus:ring-2 transition-all outline-none"
                                    placeholder="https://... (hotel exterior image)"
                                />
                                <div className="relative mt-3 w-full h-[56px] bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden hover:bg-slate-100 transition-colors cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setConfig({ ...config, heroImage: reader.result as string });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    <span className="text-xs font-bold text-slate-500">{config.heroImage ? "Change Hero Image" : "Upload Hero Image"}</span>
                                </div>
                                {config.heroImage && (
                                    <button onClick={() => setConfig({ ...config, heroImage: undefined })} className="text-[10px] text-red-500 font-bold mt-2 uppercase">Remove Hero Image</button>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center mb-6">
                            <Phone className="w-5 h-5 text-blue-600 mr-3" style={{ color: config.primaryColor }} />
                            <h2 className="text-xl font-black text-slate-900">Communication & Connectivity</h2>
                        </div>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reception Contact Number</label>
                                <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 focus-within:ring-2 transition-all">
                                    <Phone className="w-4 h-4 text-slate-400 mr-3" />
                                    <input
                                        type="text"
                                        placeholder="e.g. +91 98765 43210"
                                        value={config.receptionPhone || ""}
                                        onChange={(e) => setConfig({ ...config, receptionPhone: e.target.value })}
                                        className="bg-transparent w-full font-bold text-slate-900 outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Concierge WhatsApp Number</label>
                                <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 focus-within:ring-2 transition-all">
                                    <Phone className="w-4 h-4 text-slate-400 mr-3" />
                                    <input
                                        type="text"
                                        placeholder="e.g. +91 98765 43210"
                                        value={config.conciergeWhatsapp || ""}
                                        onChange={(e) => setConfig({ ...config, conciergeWhatsapp: e.target.value })}
                                        className="bg-transparent w-full font-bold text-slate-900 outline-none"
                                    />
                                </div>
                                <p className="mt-2 text-[10px] text-slate-400 font-medium">Used by guest dashboard `Talk to Concierge` chat button.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">WiFi Network Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Guest_WiFi"
                                        value={config.wifiName || ""}
                                        onChange={(e) => setConfig({ ...config, wifiName: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 font-bold text-slate-900 focus:ring-2 transition-all outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">WiFi Password</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. welcome123"
                                        value={config.wifiPassword || ""}
                                        onChange={(e) => setConfig({ ...config, wifiPassword: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 font-bold text-slate-900 focus:ring-2 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center mb-6">
                            <Palette className="w-5 h-5 text-blue-600 mr-3" style={{ color: config.primaryColor }} />
                            <h2 className="text-xl font-black text-slate-900">Color Palette</h2>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {colors.map((color) => (
                                <button
                                    key={color.name}
                                    onClick={() => setConfig({ ...config, primaryColor: color.primary, accentColor: color.accent })}
                                    className={`p-4 rounded-3xl border-2 transition-all group ${config.primaryColor === color.primary ? 'border-slate-900 bg-slate-50' : 'border-transparent hover:bg-slate-50'}`}
                                >
                                    <div
                                        className="w-full aspect-square rounded-2xl shadow-lg transition-transform group-hover:scale-110"
                                        style={{ backgroundColor: color.primary }}
                                    ></div>
                                    <p className="text-[9px] font-black text-slate-400 mt-3 uppercase tracking-tighter text-center">{color.name}</p>
                                </button>
                            ))}
                        </div>
                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Primary HEX</label>
                                <input
                                    type="color"
                                    value={config.primaryColor || "#3b82f6"}
                                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                                    className="w-full h-12 rounded-xl cursor-pointer"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Accent HEX</label>
                                <input
                                    type="color"
                                    value={config.accentColor || "#60a5fa"}
                                    onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                                    className="w-full h-12 rounded-xl cursor-pointer"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Service Icon Color</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={config.serviceIconColor || "#2f2f2f"}
                                        onChange={(e) => setConfig({ ...config, serviceIconColor: e.target.value })}
                                        className="h-12 w-16 rounded-xl cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={config.serviceIconColor || "#2f2f2f"}
                                        onChange={(e) => setConfig({ ...config, serviceIconColor: e.target.value })}
                                        className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 font-bold text-slate-900 outline-none focus:ring-2 transition-all"
                                        placeholder="#2f2f2f"
                                    />
                                </div>
                                <p className="mt-2 text-[10px] text-slate-400 font-medium">Applied on guest dashboard service icons.</p>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center mb-6">
                            <Clock className="w-5 h-5 text-blue-600 mr-3" style={{ color: config.primaryColor }} />
                            <h2 className="text-xl font-black text-slate-900">Late Checkout Settings</h2>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mb-6">Manage Late Checkout pricing and contact details for guests.</p>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Late Checkout Contact (WhatsApp/Call)</label>
                                <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 focus-within:ring-2 transition-all">
                                    <Phone className="w-4 h-4 text-slate-400 mr-3" />
                                    <input
                                        type="text"
                                        placeholder="e.g. +91 98765 43210"
                                        value={config.lateCheckoutPhone || ""}
                                        onChange={(e) => setConfig({ ...config, lateCheckoutPhone: e.target.value })}
                                        className="bg-transparent w-full font-bold text-slate-900 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Slot 1 (Till 2 PM)</label>
                                    <input
                                        type="text"
                                        value={config.lateCheckoutCharge1 || ""}
                                        onChange={(e) => setConfig({ ...config, lateCheckoutCharge1: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 font-bold text-slate-900 outline-none focus:ring-2 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Slot 2 (2 PM - 6 PM)</label>
                                    <input
                                        type="text"
                                        value={config.lateCheckoutCharge2 || ""}
                                        onChange={(e) => setConfig({ ...config, lateCheckoutCharge2: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 font-bold text-slate-900 outline-none focus:ring-2 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Slot 3 (After 6 PM)</label>
                                    <input
                                        type="text"
                                        value={config.lateCheckoutCharge3 || ""}
                                        onChange={(e) => setConfig({ ...config, lateCheckoutCharge3: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 font-bold text-slate-900 outline-none focus:ring-2 transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center mb-6">
                            <Car className="w-5 h-5 text-blue-600 mr-3" style={{ color: config.primaryColor }} />
                            <h2 className="text-xl font-black text-slate-900">Airport Transfer Pricing</h2>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mb-6">These prices appear on the guest Airport Transfer page. Leave all empty to show "Coming Soon".</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sedan (One Way)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. ₹1,200"
                                    value={config.airportTransferCharge1 || ""}
                                    onChange={(e) => setConfig({ ...config, airportTransferCharge1: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 font-bold text-slate-900 outline-none focus:ring-2 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">SUV (One Way)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. ₹2,000"
                                    value={config.airportTransferCharge2 || ""}
                                    onChange={(e) => setConfig({ ...config, airportTransferCharge2: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 font-bold text-slate-900 outline-none focus:ring-2 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Luxury (One Way)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. ₹3,500"
                                    value={config.airportTransferCharge3 || ""}
                                    onChange={(e) => setConfig({ ...config, airportTransferCharge3: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 font-bold text-slate-900 outline-none focus:ring-2 transition-all"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center mb-6">
                            <Utensils className="w-5 h-5 text-blue-600 mr-3" style={{ color: config.primaryColor }} />
                            <h2 className="text-xl font-black text-slate-900">Dining Service Hours</h2>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mb-6">Set the operating hours for your restaurant services. Outside these hours, items will be greyed out for guests.</p>

                        <div className="space-y-6">
                            {/* Breakfast */}
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
                                    Breakfast Service
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Start Time</p>
                                        <input
                                            type="time"
                                            value={config.breakfastStart || "07:00"}
                                            onChange={(e) => setConfig({ ...config, breakfastStart: e.target.value })}
                                            className="w-full bg-white border border-slate-100 rounded-xl py-2 px-3 text-xs font-bold"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">End Time</p>
                                        <input
                                            type="time"
                                            value={config.breakfastEnd || "10:30"}
                                            onChange={(e) => setConfig({ ...config, breakfastEnd: e.target.value })}
                                            className="w-full bg-white border border-slate-100 rounded-xl py-2 px-3 text-xs font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Lunch */}
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
                                    Lunch Service
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Start Time</p>
                                        <input
                                            type="time"
                                            value={config.lunchStart || "12:30"}
                                            onChange={(e) => setConfig({ ...config, lunchStart: e.target.value })}
                                            className="w-full bg-white border border-slate-100 rounded-xl py-2 px-3 text-xs font-bold"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">End Time</p>
                                        <input
                                            type="time"
                                            value={config.lunchEnd || "15:30"}
                                            onChange={(e) => setConfig({ ...config, lunchEnd: e.target.value })}
                                            className="w-full bg-white border border-slate-100 rounded-xl py-2 px-3 text-xs font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Dinner */}
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></div>
                                    Dinner Service
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Start Time</p>
                                        <input
                                            type="time"
                                            value={config.dinnerStart || "19:00"}
                                            onChange={(e) => setConfig({ ...config, dinnerStart: e.target.value })}
                                            className="w-full bg-white border border-slate-100 rounded-xl py-2 px-3 text-xs font-bold"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">End Time</p>
                                        <input
                                            type="time"
                                            value={config.dinnerEnd || "22:30"}
                                            onChange={(e) => setConfig({ ...config, dinnerEnd: e.target.value })}
                                            className="w-full bg-white border border-slate-100 rounded-xl py-2 px-3 text-xs font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center mb-6">
                            <Sparkles className="w-5 h-5 text-blue-600 mr-3" style={{ color: config.primaryColor }} />
                            <h2 className="text-xl font-black text-slate-900">Welcome Message</h2>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mb-6">This message will be sent to guests via WhatsApp immediately after they are assigned a room.</p>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Custom Welcome Line</label>
                                <textarea
                                    placeholder="e.g. Breakfast is served from 7 AM to 10:30 AM."
                                    value={config.welcomeMessage || ""}
                                    onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 font-bold text-slate-900 outline-none focus:ring-2 transition-all min-h-[100px] resize-none text-sm"
                                />
                                <p className="text-[10px] text-[#2563eb] mt-2 font-black italic">We automatically send a short welcome with guest name, hotel name, and room number. Keep this line short and emoji-free for the cleanest WhatsApp message.</p>


                            </div>
                        </div>
                    </section>

                    <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center mb-6">
                            <MessageSquare className="w-5 h-5 text-blue-600 mr-3" style={{ color: config.primaryColor }} />
                            <h2 className="text-xl font-black text-slate-900">Checkout Feedback</h2>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mb-6">Automate review requests. This message with your Google link will open on WhatsApp when a guest is checked out.</p>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">WhatsApp Feedback Message</label>
                                <textarea
                                    placeholder="e.g. Thank you for staying with us! We hope you had a great time. We'd love to hear your feedback."
                                    value={config.checkoutMessage || ""}
                                    onChange={(e) => setConfig({ ...config, checkoutMessage: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 font-bold text-slate-900 outline-none focus:ring-2 transition-all min-h-[100px] resize-none text-sm"
                                />
                                <p className="text-[10px] text-slate-400 mt-2 font-medium italic">Note: The Google Review Link will be appended to the end of this message automatically.</p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Google Review / Profile Link</label>
                                <input
                                    type="text"
                                    placeholder="https://g.page/r/your-profile-id/review"
                                    value={config.googleReviewLink || ""}
                                    onChange={(e) => setConfig({ ...config, googleReviewLink: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 font-bold text-slate-900 outline-none focus:ring-2 transition-all text-sm"
                                />
                            </div>
                        </div>
                    </section>

                    <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center mb-6">
                            <Tag className="w-5 h-5 text-blue-600 mr-3" style={{ color: config.primaryColor }} />
                            <h2 className="text-xl font-black text-slate-900">Special Offers Slider</h2>
                        </div>

                        {/* Current Offers List */}
                        <div className="space-y-4 mb-8">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Offers ({offers.length})</label>
                            {offers.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No offers active. Add one below.</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {offers.map((offer) => (
                                        <div key={offer.id} className="flex items-center bg-slate-50 p-3 rounded-2xl border border-slate-100 group">
                                            <div className="w-12 h-12 bg-slate-200 rounded-xl overflow-hidden mr-3">
                                                {offer.image_url && <img src={offer.image_url} className="w-full h-full object-cover" />}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-xs font-black text-slate-900">{offer.title}</h4>
                                                <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{offer.description}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteOffer(offer.id)}
                                                disabled={deletingOfferId === offer.id}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Add New Offer Form */}
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                            <h3 className="text-xs font-black text-slate-900 mb-4 flex items-center">
                                <Plus className="w-3 h-3 mr-2" /> Add Promotional Offer
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Offer Title (e.g. 20% Off Spa)"
                                        value={newOffer.title}
                                        onChange={(e) => setNewOffer({ ...newOffer, title: e.target.value })}
                                        className="w-full bg-white border border-slate-100 rounded-xl py-2 px-3 text-xs font-bold outline-none focus:ring-1"
                                    />
                                </div>
                                <div>
                                    <textarea
                                        placeholder="Description"
                                        value={newOffer.description}
                                        onChange={(e) => setNewOffer({ ...newOffer, description: e.target.value })}
                                        className="w-full bg-white border border-slate-100 rounded-xl py-2 px-3 text-xs font-medium outline-none focus:ring-1 h-20 resize-none"
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            placeholder="Image URL"
                                            value={newOffer.image_url}
                                            onChange={(e) => setNewOffer({ ...newOffer, image_url: e.target.value })}
                                            className="w-full bg-white border border-slate-100 rounded-xl py-2 pl-8 pr-3 text-[10px] font-bold outline-none focus:ring-1"
                                        />
                                        <ImageIcon className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (!branding?.id || !newOffer.title) return;
                                            setIsAddingOffer(true);
                                            await saveSpecialOffer(branding.id, newOffer);
                                            setNewOffer({ title: "", description: "", image_url: "", is_active: true });
                                            setIsAddingOffer(false);
                                        }}
                                        disabled={isAddingOffer || !newOffer.title}
                                        className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-slate-800 disabled:opacity-50 transition-all"
                                    >
                                        {isAddingOffer ? "ADDING..." : "ADD OFFER"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Preview Panel */}
                <div className="space-y-8">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Live Canvas Preview</h3>
                    <div className="bg-slate-100 rounded-[3rem] p-10 flex flex-col items-center justify-center min-h-[500px] border border-slate-200 border-dashed relative overflow-hidden">
                        {/* Mock Mobile View */}
                        <motion.div
                            layout
                            className="w-[280px] bg-white rounded-[3rem] shadow-2xl overflow-hidden border-8 border-slate-900"
                        >
                            <div className="p-6">
                                <div className="flex flex-col items-center py-8">
                                    <div
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-500 shadow-xl"
                                        style={{ backgroundColor: config.primaryColor }}
                                    >
                                        {config.logoImage ? (
                                            <img src={config.logoImage} className="w-full h-full object-cover rounded-2xl" alt="Logo" />
                                        ) : (
                                            <span className="text-3xl font-serif text-white">{config.logo || config.name?.charAt(0)}</span>
                                        )}
                                    </div>
                                    <h2 className="text-xl font-black text-center text-slate-900">{config.name}</h2>
                                </div>
                                <div className="space-y-3 mt-4">
                                    <div className="w-full h-10 bg-slate-50 rounded-xl"></div>
                                    <div className="w-full h-10 bg-slate-50 rounded-xl"></div>
                                    <button
                                        className="w-full py-4 rounded-2xl text-white font-black text-xs transition-colors duration-500"
                                        style={{ backgroundColor: config.primaryColor }}
                                    >
                                        PRIMARY BUTTON
                                    </button>
                                </div>
                            </div>
                            <div className="h-16 border-t border-slate-50 flex items-center justify-center space-x-6">
                                <div className="w-6 h-6 rounded-full opacity-20" style={{ backgroundColor: config.primaryColor }}></div>
                                <div className="w-6 h-6 rounded-full opacity-20" style={{ backgroundColor: config.primaryColor }}></div>
                                <div className="w-6 h-6 rounded-full opacity-20" style={{ backgroundColor: config.primaryColor }}></div>
                            </div>
                        </motion.div>
                        <p className="mt-8 text-slate-400 text-xs font-bold italic">Changes sync instantly across all guest devices</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
