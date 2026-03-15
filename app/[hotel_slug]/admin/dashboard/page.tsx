"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { StatusBadge, RequestStatus } from "@/components/StatusBadge";
import { 
    CheckCircle, Volume2, VolumeX, Eye, Utensils, Bell, Search, 
    LogOut, RefreshCw, XCircle, LayoutDashboard, UtensilsCrossed, 
    Home, MessageSquare, ClipboardList, CreditCard, Users, 
    BarChart3, Settings, ShieldAlert, Clock, Map as MapIcon, 
    AlertCircle, Sparkles, ChevronRight, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    useHotelBranding, 
    useSupabaseRequests, 
    updateSupabaseRequestStatus, 
    HotelRequest, 
    signOut,
    approveLateCheckout,
    rejectSupabaseRequest
} from "@/utils/store";
import { startAdminAlert, stopAdminAlert, startWaterAlert, stopWaterAlert, initAudioContext } from "@/utils/audio";
import { RequestDetailModal } from "@/components/RequestDetailModal";
import { Toast } from "@/components/Toast";

type LateCheckoutDraft = {
    requestId: string;
    room: string;
    time: string;
};

export default function AdminDashboard() {
    const router = useRouter();
    const params = useParams();
    const hotelSlug = params?.hotel_slug as string;

    const { branding, loading } = useHotelBranding(hotelSlug);
    const requests = useSupabaseRequests(branding?.id);

    const [audioEnabled, setAudioEnabled] = useState(true);
    const [audioInitialized, setAudioInitialized] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<HotelRequest | null>(null);
    const [activeTab, setActiveTab] = useState<"queue" | "active" | "history">("queue");
    const [searchQuery, setSearchQuery] = useState("");
    const [showMap, setShowMap] = useState(false);
    const [lateCheckoutDraft, setLateCheckoutDraft] = useState<LateCheckoutDraft | null>(null);
    const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
    const [submittingAction, setSubmittingAction] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error"; isVisible: boolean }>({
        message: "",
        type: "success",
        isVisible: false,
    });

    const formatCheckoutTime = (time: string) => {
        const [hourText, minuteText] = time.split(":");
        const hour = Number(hourText);
        const minute = Number(minuteText);

        if (Number.isNaN(hour) || Number.isNaN(minute)) {
            return time;
        }

        const suffix = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minute.toString().padStart(2, "0")} ${suffix}`;
    };

    const showActionToast = (message: string, type: "success" | "error") => {
        setToast({ message, type, isVisible: true });
    };

    const handleApproveLateCheckout = (requestId: string, room: string) => {
        setLateCheckoutDraft({
            requestId,
            room,
            time: "13:00",
        });
    };

    const submitLateCheckoutApproval = async () => {
        if (!branding?.id || !lateCheckoutDraft) return;

        setSubmittingAction(true);
        const formattedTime = formatCheckoutTime(lateCheckoutDraft.time);
        const { error } = await approveLateCheckout(
            lateCheckoutDraft.requestId,
            branding.id,
            lateCheckoutDraft.room,
            formattedTime,
        );

        setSubmittingAction(false);

        if (error) {
            showActionToast("Late checkout approval failed. Please try again.", "error");
            return;
        }

        setLateCheckoutDraft(null);
        setSelectedRequest(null);
        showActionToast(`Late checkout approved for Room ${lateCheckoutDraft.room}.`, "success");
    };

    const handleRejectRequest = (id: string) => {
        setRejectingRequestId(id);
    };

    const confirmRejectRequest = async () => {
        if (!rejectingRequestId) return;

        setSubmittingAction(true);
        const { error } = await rejectSupabaseRequest(rejectingRequestId);
        setSubmittingAction(false);

        if (error) {
            showActionToast("Request could not be rejected. Please try again.", "error");
            return;
        }

        setRejectingRequestId(null);
        setSelectedRequest(null);
        showActionToast("Request rejected.", "success");
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('admin_audio_enabled');
            if (saved !== null) setAudioEnabled(saved === 'true');

            const handleGlobalClick = () => {
                if (!audioInitialized) {
                    initAudioContext();
                    setAudioInitialized(true);
                }
            };
            window.addEventListener('mousedown', handleGlobalClick);
            window.addEventListener('touchstart', handleGlobalClick);
            return () => {
                window.removeEventListener('mousedown', handleGlobalClick);
                window.removeEventListener('touchstart', handleGlobalClick);
            }
        }
    }, [audioInitialized]);

    useEffect(() => {
        if (!audioEnabled) {
            stopAdminAlert();
            stopWaterAlert();
            return;
        }
        const hasWater = requests.some(r => r.type === "Water" && r.status === "Pending");
        const hasPending = requests.some(r => r.status === "Pending");

        if (hasWater) {
            stopAdminAlert();
            startWaterAlert();
        } else if (hasPending) {
            stopWaterAlert();
            startAdminAlert();
        } else {
            stopAdminAlert();
            stopWaterAlert();
        }
    }, [requests, audioEnabled]);

    const updateStatus = async (id: string, newStatus: RequestStatus) => {
        const { error } = await updateSupabaseRequestStatus(id, newStatus);

        if (error) {
            showActionToast("Action failed. Please check your permissions and try again.", "error");
            return;
        }

        if (newStatus === "Assigned") {
            showActionToast("Request accepted and moved to dispatch.", "success");
        }
    };

    const toggleAudio = () => {
        if (!audioEnabled) {
            initAudioContext();
            setAudioEnabled(true);
            setAudioInitialized(true);
            localStorage.setItem('admin_audio_enabled', 'true');
        } else {
            if (window.confirm("WARNING: Muting alarms may lead to missed guest requests. Silence signals?")) {
                setAudioEnabled(false);
                localStorage.setItem('admin_audio_enabled', 'false');
            }
        }
    };

    const getPriority = (type: string) => {
        const lower = type.toLowerCase();
        if (lower.includes("checkout") || lower.includes("water") || lower.includes("reception")) return "High";
        if (lower.includes("towel") || lower.includes("cleaning")) return "Medium";
        return "Normal";
    };

    const getPriorityColor = (priority: string) => {
        if (priority === "High") return "text-red-500 bg-red-50";
        if (priority === "Medium") return "text-amber-500 bg-amber-50";
        return "text-green-500 bg-green-50";
    };

    // Filter signals
    const filteredRequests = requests.filter(r => {
        const type = r.type.toLowerCase();
        const isReception = !["water", "dining", "restaurant", "room service", "food"].some(t => type.includes(t));
        return isReception && (
            r.room.includes(searchQuery) ||
            r.type.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }).sort((a, b) => b.timestamp - a.timestamp);

    const queueSignals = filteredRequests.filter(r => r.status === "Pending");
    const activeSignals = filteredRequests.filter(r => r.status === "Assigned" || r.status === "In Progress");
    const historySignals = filteredRequests.filter(r => r.status === "Completed" || r.status === "Rejected");

    const currentSignals = activeTab === "queue" ? queueSignals : (activeTab === "active" ? activeSignals : historySignals);

    const totalRevenue = requests.filter(r => (r.price || 0) > 0).reduce((sum, r) => sum + (r.total || 0), 0);
    const pendingCheckouts = requests.filter(r => r.type === "Checkout Requested" && r.status !== "Completed").length;

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
            <RefreshCw className="w-12 h-12 text-[#C6A25A] animate-spin" />
        </div>
    );

    return (
        <div className="flex flex-col min-h-screen">
            {/* 2️⃣ Header Upgrade (Command Center Style) */}
            <header className="h-20 bg-[#0B0F19] flex items-center justify-between px-8 text-white sticky top-0 z-40 shadow-2xl">
                <div className="flex flex-col">
                    <h1 className="text-xl font-black tracking-tight flex items-center">
                        Traffic Control <span className="ml-3 text-[10px] bg-red-600 px-2 py-0.5 rounded-full animate-pulse-gold font-bold uppercase tracking-widest text-white">Live</span>
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{branding?.name || "Grand Royale Operations"}</p>
                </div>

                <div className="flex items-center space-x-6">
                    {/* 6️⃣ Live Alarm Button Indicator */}
                    <button 
                        onClick={toggleAudio}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-full border transition-all ${audioEnabled ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-slate-700 text-slate-500'}`}
                    >
                        <div className={`w-2 h-2 rounded-full ${audioEnabled ? 'bg-red-500 animate-alert shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-slate-600'}`} />
                        <span className="text-xs font-black uppercase tracking-widest">
                            {audioEnabled ? `${queueSignals.length} Live Alerts` : "Signals Muted"}
                        </span>
                    </button>

                    <div className="h-8 w-px bg-slate-800" />

                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text" 
                            placeholder="Filter signals..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#C6A25A]/20 focus:border-[#C6A25A] outline-none transition-all w-48 focus:w-64"
                        />
                    </div>

                    <Bell className="w-5 h-5 text-slate-400 hover:text-white transition-colors cursor-pointer" />
                    
                    <div className="flex items-center space-x-3 bg-slate-900 py-1.5 pl-1.5 pr-4 rounded-full border border-slate-800">
                        <div className="w-7 h-7 bg-[#C6A25A] rounded-full flex items-center justify-center font-black text-[#0F172A] text-xs">A</div>
                        <span className="text-xs font-bold text-slate-300">Admin</span>
                    </div>
                </div>
            </header>

            <div className="p-8 space-y-8 flex-1">
                {/* 3️⃣ Stats Cards (Live Operational Cards) */}
                <div className="grid grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-[18px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center space-x-4">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <Home className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arrivals Today</p>
                            <p className="text-2xl font-black text-slate-900">{queueSignals.length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[18px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Signals</p>
                            <p className="text-2xl font-black text-slate-900">{activeSignals.length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[18px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue Today</p>
                            <p className="text-2xl font-black text-green-600">₹{totalRevenue.toFixed(0)}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[18px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center space-x-4 hover:border-[#C6A25A] cursor-pointer transition-all group" onClick={() => router.push(`/${hotelSlug}/admin/checkout`)}>
                        <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-[#C6A25A]/10 group-hover:text-[#C6A25A]">
                            <MapIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-[#C6A25A]">Pending Checkout</p>
                            <p className="text-2xl font-black text-slate-900">{pendingCheckouts} Rooms</p>
                        </div>
                    </div>
                </div>

                {/* Operational Feed Controls */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <div className="flex space-x-8">
                        {[
                            { id: "queue", label: "Open Signals", count: queueSignals.length },
                            { id: "active", label: "Active Dispatch", count: activeSignals.length },
                            { id: "history", label: "Archive", count: historySignals.length }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`relative pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'text-[#0F172A]' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {tab.label} ({tab.count})
                                {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#C6A25A] rounded-full" />}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={() => setShowMap(!showMap)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${showMap ? 'bg-[#0F172A] text-white' : 'bg-white border text-slate-600'}`}
                    >
                        <MapIcon className="w-4 h-4" />
                        <span>{showMap ? "Hide Floor Map" : "Live Hotel Map"}</span>
                    </button>
                </div>

                {/* 🔟 Live Hotel Map Feature */}
                <AnimatePresence>
                    {showMap && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-[#0F172A] rounded-3xl p-8 border border-slate-800 shadow-2xl relative">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-3 h-3 bg-[#C6A25A] rounded-full animate-pulse shadow-[0_0_10px_#C6A25A]" />
                                        <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Floor 01 Operations</span>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-slate-700 rounded-full" /><span className="text-[10px] text-slate-400 uppercase font-bold">Standard</span></div>
                                        <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-green-500 rounded-full" /><span className="text-[10px] text-slate-400 uppercase font-bold">Occupied</span></div>
                                        <div className="flex items-center space-x-2"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /><span className="text-[10px] text-slate-400 uppercase font-bold">Signal</span></div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-6 gap-4">
                                    {Array.from({ length: 12 }).map((_, i) => {
                                        const roomNum = (101 + i).toString();
                                        const hasSignal = requests.some(r => r.room === roomNum && r.status === "Pending");
                                        return (
                                            <div 
                                                key={i} 
                                                className={`h-24 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${hasSignal ? 'bg-red-500/10 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'bg-slate-900 border-slate-800'}`}
                                            >
                                                <span className={`text-lg font-black ${hasSignal ? 'text-white' : 'text-slate-500'}`}>{roomNum}</span>
                                                {hasSignal && <Bell className="w-4 h-4 text-red-500 mt-2 animate-bounce" />}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent pointer-events-none opacity-40" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 4️⃣ Queue Section - Operational Feed Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {currentSignals.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center"
                            >
                                <Sparkles className="w-12 h-12 text-slate-200 mb-4" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">All Signals Resolved</p>
                            </motion.div>
                        ) : (
                            currentSignals.map((signal) => {
                                const priority = getPriority(signal.type);
                                return (
                                    <motion.div
                                        key={signal.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        transition={{ duration: 0.3 }}
                                        className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:border-[#C6A25A]/30 transition-all group relative overflow-hidden"
                                    >
                                        {/* Priority Indicator Line */}
                                        <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${priority === 'High' ? 'bg-red-500' : (priority === 'Medium' ? 'bg-amber-500' : 'bg-green-500')}`} />
                                        
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-12 h-12 bg-[#0F172A] text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">
                                                    {signal.room}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-slate-900 group-hover:text-[#C6A25A] transition-colors">Room {signal.room}</h3>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full inline-block mt-1">Premium Guest</span>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${getPriorityColor(priority)}`}>
                                                {priority} Priority
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-8">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Request Signal</p>
                                                <div className="flex items-center text-slate-900 font-black">
                                                    <Bell className="w-4 h-4 mr-2 text-[#C6A25A]" />
                                                    {signal.type}
                                                </div>
                                                {signal.notes && <p className="text-xs text-slate-500 font-medium mt-2 italic line-clamp-2">"{signal.notes}"</p>}
                                            </div>

                                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                                                <div>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Time Registered</p>
                                                    <p className="text-xs font-black text-slate-900">{signal.time}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                                                    <span className="text-[10px] font-black text-slate-900 uppercase">{signal.status}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 9️⃣ Micro Interaction Action Buttons */}
                                        <div className="flex items-center space-x-2">
                                            {signal.status === "Pending" && (
                                                <>
                                                    {signal.type === "Late Checkout" ? (
                                                        <button 
                                                            onClick={() => handleApproveLateCheckout(signal.id, signal.room)}
                                                            className="flex-1 bg-green-600 text-white h-11 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg active:scale-95"
                                                        >
                                                            Approve Ext.
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => updateStatus(signal.id, "Assigned")}
                                                            className="flex-1 bg-[#0F172A] text-white h-11 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-2"
                                                        >
                                                            <span>Accept Signal</span>
                                                            <ChevronRight className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handleRejectRequest(signal.id)}
                                                        className="px-4 bg-red-50 text-red-600 h-11 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}

                                            {signal.status === "Assigned" && (
                                                <button 
                                                    onClick={() => updateStatus(signal.id, "In Progress")}
                                                    className="flex-1 bg-blue-600 text-white h-11 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
                                                >
                                                    Start Mission
                                                </button>
                                            )}

                                            {signal.status === "In Progress" && (
                                                <button 
                                                    onClick={() => updateStatus(signal.id, "Completed")}
                                                    className="flex-1 bg-green-600 text-white h-11 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg flex items-center justify-center space-x-2"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    <span>Resolve Signal</span>
                                                </button>
                                            )}

                                            <button 
                                                onClick={() => setSelectedRequest(signal)}
                                                className="w-11 h-11 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-[#0F172A] hover:text-white transition-all border border-slate-100"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <RequestDetailModal
                request={selectedRequest}
                onClose={() => setSelectedRequest(null)}
                onApprove={handleApproveLateCheckout}
                onReject={handleRejectRequest}
            />

            <AnimatePresence>
                {lateCheckoutDraft && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end justify-center bg-[#020617]/60 p-4 backdrop-blur-sm md:items-center"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 32, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.98 }}
                            className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl"
                        >
                            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#C6A25A]">
                                Late Checkout
                            </p>
                            <h3 className="text-2xl font-black text-slate-900">
                                Approve Room {lateCheckoutDraft.room}
                            </h3>
                            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                                Choose the new checkout time. The room status and request queue will update together.
                            </p>

                            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                                    New Checkout Time
                                </label>
                                <input
                                    type="time"
                                    value={lateCheckoutDraft.time}
                                    onChange={(event) =>
                                        setLateCheckoutDraft({
                                            ...lateCheckoutDraft,
                                            time: event.target.value,
                                        })
                                    }
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg font-black text-slate-900 outline-none transition-all focus:border-[#C6A25A]"
                                />
                                <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                                    Guest will see: {formatCheckoutTime(lateCheckoutDraft.time)}
                                </p>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setLateCheckoutDraft(null)}
                                    className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-500 transition-all hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={submitLateCheckoutApproval}
                                    disabled={submittingAction}
                                    className="flex flex-1 items-center justify-center rounded-2xl bg-green-600 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {submittingAction ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        "Approve"
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {rejectingRequestId && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end justify-center bg-[#020617]/60 p-4 backdrop-blur-sm md:items-center"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 32, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.98 }}
                            className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-6 shadow-2xl"
                        >
                            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-red-500">
                                Confirm Action
                            </p>
                            <h3 className="text-2xl font-black text-slate-900">
                                Reject This Request?
                            </h3>
                            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
                                The guest will see this request as rejected immediately. You can still review it later in the archive.
                            </p>

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRejectingRequestId(null)}
                                    className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-500 transition-all hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmRejectRequest}
                                    disabled={submittingAction}
                                    className="flex flex-1 items-center justify-center rounded-2xl bg-red-600 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {submittingAction ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        "Reject"
                                    )}
                                </button>
                            </div>
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
