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
    useRooms,
    updateSupabaseRequestStatus, 
    HotelRequest, 
    signOut,
    approveLateCheckout,
    rejectSupabaseRequest
} from "@/utils/store";
import { startAdminAlert, stopAdminAlert, startWaterAlert, stopWaterAlert, initAudioContext } from "@/utils/audio";
import { RequestDetailModal } from "@/components/RequestDetailModal";
import { Toast } from "@/components/Toast";
import { getDepartmentLabel, getRoomSignalSummary, groupRoomsByFloor, normalizeRoomLabel } from "@/lib/hotel/operations";

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
    const { rooms } = useRooms(branding?.id);

    const [audioEnabled, setAudioEnabled] = useState(true);
    const [audioInitialized, setAudioInitialized] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<HotelRequest | null>(null);
    const [activeTab, setActiveTab] = useState<"queue" | "active" | "history">("queue");
    const [searchQuery, setSearchQuery] = useState("");
    const [showMap, setShowMap] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
    const [selectedMapRoom, setSelectedMapRoom] = useState<string | null>(null);
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
    const filteredRequests = requests
        .filter((request) => {
            const normalizedQuery = searchQuery.trim().toLowerCase();

            if (!normalizedQuery) {
                return true;
            }

            return (
                normalizeRoomLabel(request.room).includes(normalizedQuery.replace(/\s+/g, "")) ||
                request.type.toLowerCase().includes(normalizedQuery) ||
                (request.notes || "").toLowerCase().includes(normalizedQuery)
            );
        })
        .sort((a, b) => b.timestamp - a.timestamp);

    const queueSignals = filteredRequests.filter(r => r.status === "Pending");
    const activeSignals = filteredRequests.filter(r => r.status === "Assigned" || r.status === "In Progress");
    const historySignals = filteredRequests.filter(r => r.status === "Completed" || r.status === "Rejected");
    const floorMap = groupRoomsByFloor(rooms, requests);

    useEffect(() => {
        if (!floorMap.length) {
            setSelectedFloor(null);
            setSelectedMapRoom(null);
            return;
        }

        if (!selectedFloor || !floorMap.some((floorGroup) => floorGroup.floor === selectedFloor)) {
            setSelectedFloor(floorMap[0].floor);
        }
    }, [floorMap, selectedFloor]);

    const activeFloorGroup = floorMap.find((floorGroup) => floorGroup.floor === selectedFloor) ?? floorMap[0] ?? null;

    useEffect(() => {
        if (!activeFloorGroup?.rooms.length) {
            setSelectedMapRoom(null);
            return;
        }

        const roomStillVisible = activeFloorGroup.rooms.some(
            (room) => normalizeRoomLabel(room.room_number) === selectedMapRoom,
        );

        if (!selectedMapRoom || !roomStillVisible) {
            setSelectedMapRoom(normalizeRoomLabel(activeFloorGroup.rooms[0].room_number));
        }
    }, [activeFloorGroup, selectedMapRoom]);

    const selectedRoom = activeFloorGroup?.rooms.find(
        (room) => normalizeRoomLabel(room.room_number) === selectedMapRoom,
    ) ?? null;
    const selectedRoomSignals = selectedRoom ? getRoomSignalSummary(requests, selectedRoom.room_number) : null;

    const currentSignals = activeTab === "queue" ? queueSignals : (activeTab === "active" ? activeSignals : historySignals);

    const totalRevenue = requests.filter(r => (r.price || 0) > 0).reduce((sum, r) => sum + (r.total || 0), 0);
    const pendingCheckouts = requests.filter(r => r.type === "Checkout Requested" && r.status !== "Completed").length;

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
            <RefreshCw className="w-12 h-12 text-[#C6A25A] animate-spin" />
        </div>
    );

    return (
        <div className="flex min-h-screen bg-[#FDFBF9] font-sans selection:bg-[#CFA46A]/20">
            {/* 1️⃣ SIDEBAR (The Command Center) */}
            <aside className="w-72 bg-[#1F1F1F] text-white flex flex-col sticky top-0 h-screen z-50 border-r border-white/5 noise">
                <div className="p-8">
                    <div className="flex items-center space-x-3 mb-12">
                        <div className="w-10 h-10 bg-[#CFA46A] rounded-xl flex items-center justify-center shadow-lg shadow-[#CFA46A]/20">
                            <Sparkles className="w-6 h-6 text-[#1F1F1F]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-serif font-black tracking-tight leading-none group-hover:text-[#CFA46A] transition-colors">{branding?.name?.split(' ')[0] || "MANGO"}</h2>
                            <p className="text-[10px] font-black text-[#CFA46A] uppercase tracking-[0.3em] mt-1">Control</p>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        {[
                            { icon: LayoutDashboard, label: "Overview", active: true },
                            { icon: MessageSquare, label: "Signals", count: queueSignals.length },
                            { icon: Users, label: "Guests" },
                            { icon: ClipboardList, label: "History" },
                            { icon: Settings, label: "System" },
                        ].map((item, idx) => (
                            <button 
                                key={idx}
                                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group ${item.active ? 'bg-[#CFA46A] text-[#1F1F1F]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <item.icon className={`w-5 h-5 ${item.active ? 'text-[#1F1F1F]' : 'text-slate-500 group-hover:text-[#CFA46A]'}`} />
                                    <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                                </div>
                                {item.count !== undefined && item.count > 0 && (
                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${item.active ? 'bg-[#1F1F1F] text-white' : 'bg-[#CFA46A] text-[#1F1F1F]'}`}>
                                        {item.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-8 border-t border-white/5 bg-black/20">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-[#CFA46A]/30 flex items-center justify-center font-black text-[#CFA46A]">A</div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-[#CFA46A]">Mission Control</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Ops</p>
                        </div>
                    </div>
                    
                    <button 
                         onClick={toggleAudio}
                         className={`w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-2xl border transition-all ${audioEnabled ? 'border-red-500/50 bg-red-500/10 text-red-500' : 'border-slate-800 text-slate-500'}`}
                    >
                        <div className={`w-2 h-2 rounded-full ${audioEnabled ? 'bg-red-500 animate-pulse shadow-[0_0_8px_#EF4444]' : 'bg-slate-700'}`} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{audioEnabled ? "Alerts Live" : "Alerts Muted"}</span>
                    </button>
                </div>
            </aside>

            {/* 2️⃣ MAIN CONTENT AREA */}
            <main className="flex-1 min-h-screen overflow-x-hidden">
                {/* Content Header */}
                <header className="h-24 px-12 flex items-center justify-between border-b border-black/[0.03] sticky top-0 bg-[#FDFBF9]/80 backdrop-blur-3xl z-40">
                    <div>
                        <h1 className="text-2xl font-serif font-black text-[#1F1F1F] tracking-tight text-shadow-glow">Mission Control</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">{branding?.name || "Grand Royale Operations"}</p>
                    </div>

                    <div className="flex items-center space-x-8">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search signals..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-black/5 border-transparent rounded-[20px] py-3 pl-12 pr-6 text-xs font-bold focus:ring-2 focus:ring-[#CFA46A]/20 focus:bg-white focus:border-[#CFA46A]/30 outline-none transition-all w-64"
                            />
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex flex-col text-right">
                                <span className="text-[10px] font-black text-[#CFA46A] uppercase tracking-widest">Live Orbit</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short' })}</span>
                            </div>
                            <button onClick={() => signOut()} className="w-12 h-12 rounded-2xl bg-white border border-black/5 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all shadow-sm">
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </header>

                <div className="px-12 py-8 space-y-12">
                    {/* 3️⃣ Stats Cards (Luxury Operational Metrics) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: Home, label: "Live Arrivals", value: queueSignals.length, color: "bg-[#CFA46A]/5 text-[#CFA46A]" },
                            { icon: AlertCircle, label: "Active Missions", value: activeSignals.length, color: "bg-[#3F7C6D]/5 text-[#3F7C6D]" },
                            { icon: CreditCard, label: "Revenue Today", value: `₹${totalRevenue.toFixed(0)}`, color: "bg-amber-50 text-amber-600" },
                            { icon: MapIcon, label: "Checkout Queue", value: pendingCheckouts, color: "bg-slate-50 text-slate-500", action: () => router.push(`/${hotelSlug}/admin/checkout`) }
                        ].map((stat, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={stat.action}
                                className={`bg-white p-8 rounded-[32px] premium-shadow border border-black/[0.03] flex items-center space-x-6 group ${stat.action ? 'cursor-pointer hover:border-[#CFA46A]/30 transition-all' : ''}`}
                            >
                                <div className={`w-14 h-14 ${stat.color} rounded-[20px] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                                    <stat.icon className="w-7 h-7" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                                    <p className="text-3xl font-serif font-black text-[#1F1F1F] tracking-tight">{stat.value}</p>
                                </div>
                                {stat.action && <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#CFA46A] transition-colors" />}
                            </motion.div>
                        ))}
                    </div>

                    {/* Operational Feed Controls */}
                    <div className="flex items-center justify-between border-b border-black/[0.03] pb-6">
                        <div className="flex space-x-12">
                            {[
                                { id: "queue", label: "Open Signals", count: queueSignals.length },
                                { id: "active", label: "Active Missions", count: activeSignals.length },
                                { id: "history", label: "Signal Archive", count: historySignals.length }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`relative pb-6 text-[10px] font-black uppercase tracking-[0.25em] transition-all ${activeTab === tab.id ? 'text-[#1F1F1F]' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {tab.label} <span className="ml-2 opacity-50">[{tab.count}]</span>
                                    {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#CFA46A]" />}
                                </button>
                            ))}
                        </div>
                        <button 
                            onClick={() => setShowMap(!showMap)}
                            className={`flex items-center space-x-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-sm ${showMap ? 'bg-[#1F1F1F] text-white' : 'bg-white border border-black/5 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <MapIcon className="w-4 h-4 text-[#CFA46A]" />
                            <span>{showMap ? "Close Blueprint" : "Architectural View"}</span>
                        </button>
                    </div>

                    {/* 🔟 Architectural Floor Map Feature */}
                    <AnimatePresence>
                        {showMap && (
                            <motion.div
                                initial={{ height: 0, opacity: 0, y: -20 }}
                                animate={{ height: 'auto', opacity: 1, y: 0 }}
                                exit={{ height: 0, opacity: 0, y: -20 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-[#1F1F1F] rounded-[40px] p-10 border border-white/5 shadow-3xl relative noise overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                        <MapIcon className="w-32 h-32 text-white" />
                                    </div>

                                    <div className="flex items-center justify-between mb-10 relative z-10">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-2.5 h-2.5 bg-[#CFA46A] rounded-full animate-pulse shadow-[0_0_15px_#CFA46A]" />
                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">
                                                {activeFloorGroup ? `Level ${String(activeFloorGroup.floor).padStart(2, "0")} Operations` : "Foundation Blueprint"}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-6">
                                            {[
                                                { label: "Standard", color: "bg-slate-700" },
                                                { label: "Occupied", color: "bg-[#3F7C6D]" },
                                                { label: "Active Signal", color: "bg-red-500 animate-pulse" }
                                            ].map((legend, i) => (
                                                <div key={i} className="flex items-center space-x-2">
                                                    <div className={`w-2 h-2 rounded-full ${legend.color}`} />
                                                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest">{legend.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-10 relative z-10">
                                        {floorMap.map((floorGroup) => {
                                            const floorPending = floorGroup.rooms.reduce(
                                                (total, room) => total + getRoomSignalSummary(requests, room.room_number).pendingCount,
                                                0,
                                            );

                                            return (
                                                <button
                                                    key={floorGroup.floor}
                                                    onClick={() => setSelectedFloor(floorGroup.floor)}
                                                    className={`px-6 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                                                        selectedFloor === floorGroup.floor
                                                            ? "bg-[#CFA46A] text-[#1F1F1F] border-[#CFA46A] shadow-lg shadow-[#CFA46A]/20"
                                                            : "bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:border-white/20"
                                                    }`}
                                                >
                                                    Level {String(floorGroup.floor).padStart(2, "0")} {floorPending > 0 ? `• ${floorPending}` : ""}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {activeFloorGroup ? (
                                        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-10 relative z-10">
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {activeFloorGroup.rooms.map((room) => {
                                                    const roomSignals = getRoomSignalSummary(requests, room.room_number);
                                                    const isSelected = normalizeRoomLabel(room.room_number) === selectedMapRoom;

                                                    return (
                                                        <button
                                                            key={room.id}
                                                            onClick={() => setSelectedMapRoom(normalizeRoomLabel(room.room_number))}
                                                            className={`min-h-[160px] rounded-[32px] border p-6 text-left transition-all ${
                                                                isSelected
                                                                    ? "bg-white/10 border-[#CFA46A] shadow-[0_0_30px_rgba(207,164,106,0.15)]"
                                                                    : "bg-white/[0.02] border-white/5 hover:border-white/20"
                                                            }`}
                                                        >
                                                            <div className="flex items-start justify-between mb-6">
                                                                <div>
                                                                    <p className={`text-2xl font-serif font-black ${isSelected ? "text-white" : "text-slate-200"}`}>
                                                                        {room.room_number}
                                                                    </p>
                                                                    <div className="mt-2 flex items-center space-x-2">
                                                                        <div className={`w-1.5 h-1.5 rounded-full ${room.is_occupied ? 'bg-[#3F7C6D]' : 'bg-slate-700'}`} />
                                                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                                                                            {room.is_occupied ? "Occupied" : "Standby"}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-end space-y-1">
                                                                    {roomSignals.pendingCount > 0 && (
                                                                        <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-lg shadow-red-500/30 line-height-0 pt-0.5">
                                                                            {roomSignals.pendingCount}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2">
                                                                {roomSignals.requests.slice(0, 1).map((request) => (
                                                                    <div key={request.id} className="rounded-xl bg-white/5 px-3 py-2 border border-white/5">
                                                                        <p className="text-[8px] font-black uppercase tracking-widest text-[#CFA46A]">
                                                                            {getDepartmentLabel(request)}
                                                                        </p>
                                                                        <p className="mt-1 text-[11px] font-bold text-white/90 line-clamp-1 italic">"{request.type}"</p>
                                                                    </div>
                                                                ))}
                                                                {roomSignals.requests.length === 0 && (
                                                                    <p className="text-[10px] font-medium text-slate-600 uppercase tracking-widest">No signals</p>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <div className="rounded-[40px] border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl">
                                                {selectedRoom && selectedRoomSignals ? (
                                                    <div className="h-full flex flex-col">
                                                        <div className="flex items-start justify-between gap-4 mb-8">
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#CFA46A]">Unit Inspection</p>
                                                                <h3 className="mt-2 text-4xl font-serif font-black text-white">Room {selectedRoom.room_number}</h3>
                                                            </div>
                                                            <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                                                                selectedRoom.is_occupied
                                                                    ? "bg-[#3F7C6D]/20 text-[#3F7C6D] border border-[#3F7C6D]/30"
                                                                    : "bg-white/10 text-slate-400"
                                                            }`}>
                                                                {selectedRoom.is_occupied ? "In Use" : "Vacant"}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                                            <div className="rounded-2xl bg-white/5 p-5 border border-white/5">
                                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Live Load</p>
                                                                <p className="mt-2 text-3xl font-serif font-black text-white">
                                                                    {selectedRoomSignals.pendingCount + selectedRoomSignals.activeCount}
                                                                </p>
                                                            </div>
                                                            <div className="rounded-2xl bg-white/5 p-5 border border-white/5">
                                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Checkout</p>
                                                                <p className="mt-2 text-[11px] font-black text-white/90">
                                                                    {selectedRoom.checkout_time || selectedRoom.checkout_date || "—"}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#CFA46A] mb-4">Signal Details</p>
                                                            {selectedRoomSignals.requests.length > 0 ? (
                                                                selectedRoomSignals.requests.map((request) => (
                                                                    <button
                                                                        key={request.id}
                                                                        onClick={() => setSelectedRequest(request)}
                                                                        className="w-full rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-left hover:bg-white/5 hover:border-[#CFA46A]/40 transition-all group"
                                                                    >
                                                                        <div className="flex items-center justify-between mb-2">
                                                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-[#CFA46A]">{getDepartmentLabel(request)}</span>
                                                                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                                                                request.status === "Pending"
                                                                                    ? "bg-red-500/20 text-red-500"
                                                                                    : "bg-[#3F7C6D]/20 text-[#3F7C6D]"
                                                                            }`}>
                                                                                {request.status}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-sm font-black text-white/90 mb-1">{request.type}</p>
                                                                        <p className="text-[10px] text-slate-500 font-medium">{request.time} • Registered</p>
                                                                    </button>
                                                                ))
                                                            ) : (
                                                                <div className="h-40 rounded-[32px] border border-dashed border-white/10 flex items-center justify-center text-center p-8">
                                                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest leading-loose">No active signals<br/>for this unit</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <button 
                                                            onClick={() => setSearchQuery(normalizeRoomLabel(selectedRoom.room_number))}
                                                            className="mt-6 w-full py-4 rounded-2xl bg-[#CFA46A] text-[#1F1F1F] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white transition-all shadow-xl shadow-[#CFA46A]/10"
                                                        >
                                                            Locate in Signal Feed
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center text-center p-10">
                                                        <Sparkles className="w-12 h-12 text-white/5 mb-6" />
                                                        <p className="text-xs font-bold text-slate-600 uppercase tracking-[0.3em] leading-loose">Select unit from grid<br/>for localized mission tracking</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-[40px] border border-dashed border-white/10 p-20 text-center">
                                            <p className="text-sm font-bold text-slate-600 uppercase tracking-[0.3em]">Operational units not detected</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 4️⃣ Queue Section - High Fidelity Operational Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence mode="popLayout">
                            {currentSignals.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="col-span-full py-32 bg-white rounded-[40px] border border-dashed border-black/5 flex flex-col items-center justify-center text-center p-12"
                                >
                                    <Sparkles className="w-16 h-16 text-slate-100 mb-8" />
                                    <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs leading-loose">The horizon is clear.<br/>All protocols satisfied.</p>
                                </motion.div>
                            ) : (
                                currentSignals.map((signal) => {
                                    const priority = getPriority(signal.type);
                                    return (
                                        <motion.div
                                            key={signal.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="bg-white rounded-[40px] p-10 premium-shadow border border-black/[0.03] transition-all group relative overflow-hidden"
                                        >
                                            {/* Signal Folio Accent */}
                                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                                <div className="text-8xl font-serif font-black">{signal.room}</div>
                                            </div>

                                            <div className="flex justify-between items-start mb-10 relative z-10">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-16 h-16 bg-[#1F1F1F] text-[#CFA46A] rounded-2xl flex items-center justify-center font-serif font-black text-2xl shadow-xl shadow-black/20">
                                                        {signal.room}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-serif font-black text-[#1F1F1F]">Guest Folio</h3>
                                                        <div className="flex items-center space-x-2 mt-1">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${priority === 'High' ? 'bg-red-500' : (priority === 'Medium' ? 'bg-amber-500' : 'bg-[#3F7C6D]')}`} />
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{priority} Mission</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => setSelectedRequest(signal)}
                                                    className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 hover:bg-[#1F1F1F] hover:text-[#CFA46A] transition-all"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <div className="space-y-6 mb-10 relative z-10">
                                                <div className="p-6 rounded-[24px] bg-slate-50 border border-black/[0.02]">
                                                    <p className="text-[9px] font-black text-[#CFA46A] uppercase tracking-[0.3em] mb-3">Operational Signal</p>
                                                    <div className="flex items-center text-lg font-serif font-black text-[#1F1F1F]">
                                                        {signal.type}
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                                                        {getDepartmentLabel(signal)}
                                                    </p>
                                                    {signal.notes && (
                                                        <div className="mt-4 pt-4 border-t border-black/5">
                                                            <p className="text-xs text-slate-500 font-medium italic leading-relaxed">"{signal.notes}"</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex justify-between items-center px-4">
                                                    <div className="text-left">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Time Registered</p>
                                                        <p className="text-xs font-black text-[#1F1F1F] mt-0.5">{signal.time}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Orbit Status</p>
                                                        <span className="text-[10px] font-black text-[#CFA46A] uppercase tracking-widest mt-0.5">{signal.status}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Folio */}
                                            <div className="flex flex-col space-y-3 relative z-10">
                                                {signal.status === "Pending" && (
                                                    <div className="flex space-x-3">
                                                        {signal.type === "Late Checkout" ? (
                                                            <button 
                                                                onClick={() => handleApproveLateCheckout(signal.id, signal.room)}
                                                                className="flex-1 bg-[#3F7C6D] text-white h-12 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-[#3F7C6D]/20 hover:scale-[1.02] active:scale-95 transition-all"
                                                            >
                                                                Approve Ext.
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                onClick={() => updateStatus(signal.id, "Assigned")}
                                                                className="flex-1 bg-[#1F1F1F] text-[#CFA46A] h-12 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all border border-white/5"
                                                            >
                                                                Accept Mission
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleRejectRequest(signal.id)}
                                                            className="px-6 bg-red-50 text-red-600 h-12 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-100 transition-all border border-red-100/50"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}

                                                {signal.status === "Assigned" && (
                                                    <button 
                                                        onClick={() => updateStatus(signal.id, "In Progress")}
                                                        className="w-full bg-[#1F1F1F] text-[#CFA46A] h-14 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-black transition-all"
                                                    >
                                                        Initialise Folio
                                                    </button>
                                                )}

                                                {signal.status === "In Progress" && (
                                                    <button 
                                                        onClick={() => updateStatus(signal.id, "Completed")}
                                                        className="w-full bg-[#3F7C6D] text-white h-14 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-[#3F7C6D]/20 hover:scale-[1.02] transition-all flex items-center justify-center space-x-3"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                        <span>Finalise Mission</span>
                                                    </button>
                                                )}
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
            </main>
        </div>
    );
}
