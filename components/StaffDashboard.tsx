"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge, RequestStatus } from "@/components/StatusBadge";
import { CheckCircle, Volume2, VolumeX, Eye, Utensils, Bell, Search, LogOut, RefreshCw, Clock, Shirt, Brush, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useHotelBranding, useSupabaseRequests, updateSupabaseRequestStatus, HotelRequest, signOut } from "@/utils/store";
import { startAdminAlert, stopAdminAlert, startWaterAlert, stopWaterAlert, initAudioContext } from "@/utils/audio";
import { RequestDetailModal } from "@/components/RequestDetailModal";
import { filterRequestsForDepartment } from "@/lib/hotel/operations";

interface StaffDashboardProps {
    hotelSlug: string;
    department: 'reception' | 'kitchen' | 'housekeeping';
    title: string;
    icon: React.ReactNode;
}

export function StaffDashboard({ hotelSlug, department, title, icon }: StaffDashboardProps) {
    const router = useRouter();
    const { branding, loading: brandingLoading } = useHotelBranding(hotelSlug);
    const requests = useSupabaseRequests(branding?.id);

    const [audioEnabled, setAudioEnabled] = useState(true);
    const [audioInitialized, setAudioInitialized] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<HotelRequest | null>(null);
    const [activeTab, setActiveTab] = useState<"queue" | "active" | "history">("queue");
    const [searchQuery, setSearchQuery] = useState("");

    // Load initial preference
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(`staff_audio_enabled_${department}`);
            if (saved !== null) {
                setAudioEnabled(saved === 'true');
            }

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
    }, [audioInitialized, department]);

    // Role-based filtering of requests
    const deptRequests = filterRequestsForDepartment(requests, department);

    useEffect(() => {
        if (!audioEnabled) {
            stopAdminAlert();
            stopWaterAlert();
            return;
        }

        // Only alert for NEW pending requests for THIS department
        const departmentPending = deptRequests.filter(r => r.status === "Pending");
        const hasWater = departmentPending.some(r => r.type === "Water");
        const hasPending = departmentPending.length > 0;

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
    }, [deptRequests, audioEnabled]);

    const updateStatus = async (id: string, newStatus: RequestStatus) => {
        await updateSupabaseRequestStatus(id, newStatus);
    };

    const toggleAudio = () => {
        if (!audioEnabled) {
            initAudioContext();
            setAudioEnabled(true);
            setAudioInitialized(true);
            localStorage.setItem(`staff_audio_enabled_${department}`, 'true');
        } else {
            const confirmed = window.confirm("Mute signals? New requests might be missed.");
            if (confirmed) {
                setAudioEnabled(false);
                localStorage.setItem(`staff_audio_enabled_${department}`, 'false');
            }
        }
    };

    const getRowStyle = (type: string) => {
        const lowerType = type.toLowerCase();
        if (lowerType === "water") return "bg-blue-50/50 hover:bg-blue-100/50 border-l-8 border-l-blue-600 animate-pulse";
        if (lowerType.includes("restaurant") || lowerType.includes("room service")) return "bg-amber-50/20 hover:bg-amber-50 border-l-4 border-l-amber-400";
        if (lowerType.includes("housekeeping") || lowerType.includes("cleaning") || lowerType.includes("laundry")) return "bg-purple-50/20 hover:bg-purple-50 border-l-4 border-l-purple-400";
        return "hover:bg-gray-50/50 border-l-4 border-l-transparent";
    };

    const sortedRequests = [...deptRequests].sort((a, b) => b.timestamp - a.timestamp);
    const filteredBySearch = sortedRequests.filter(r =>
        r.room.includes(searchQuery) ||
        r.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const queueRequests = filteredBySearch.filter(r => r.status === "Pending");
    const activeRequests = filteredBySearch.filter(r => r.status === "Assigned" || r.status === "In Progress");
    const historyRequests = filteredBySearch.filter(r => r.status === "Completed");

    const currentDisplayRequests = activeTab === "queue" ? queueRequests : (activeTab === "active" ? activeRequests : historyRequests);

    if (brandingLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            {/* Audio Signal Awareness Banner */}
            <AnimatePresence>
                {!audioEnabled && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
                    >
                        <button
                            onClick={toggleAudio}
                            className="w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between group"
                        >
                            <div className="flex items-center">
                                <VolumeX className="w-5 h-5 text-red-400 mr-4" />
                                <div className="text-left text-xs">
                                    <p className="font-black uppercase tracking-wider">Signals Muted</p>
                                    <p className="text-slate-400">Click to activate alert sounds.</p>
                                </div>
                            </div>
                            <div className="bg-white text-slate-900 px-4 py-2 rounded-xl font-black text-[10px] uppercase">Turn On</div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div className="flex items-center">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mr-5">
                        {icon}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
                        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">{branding?.name} • Departmental Board</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            placeholder="Find room..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>

                    <button
                        onClick={async () => {
                            await signOut();
                            window.location.href = `/${hotelSlug}/admin/login`;
                        }}
                        className="flex items-center px-5 py-2.5 rounded-2xl font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all"
                    >
                        <LogOut className="w-5 h-5 mr-2" />
                        Exit
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <button onClick={() => setActiveTab("queue")} className={`p-6 rounded-[2rem] border transition-all text-left ${activeTab === 'queue' ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-500/10' : 'bg-white border-slate-100'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'queue' ? 'text-amber-600' : 'text-slate-400'}`}>Queue</p>
                    <p className="text-3xl font-black text-slate-900 mt-1">{queueRequests.length}</p>
                </button>
                <button onClick={() => setActiveTab("active")} className={`p-6 rounded-[2rem] border transition-all text-left ${activeTab === 'active' ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/10' : 'bg-white border-slate-100'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'active' ? 'text-blue-600' : 'text-slate-400'}`}>Active</p>
                    <p className="text-3xl font-black text-slate-900 mt-1">{activeRequests.length}</p>
                </button>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
                    <p className="text-3xl font-black text-slate-900 mt-1">100%</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Finished</p>
                    <p className="text-3xl font-black text-emerald-600 mt-1">{historyRequests.length}</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                        {["queue", "active", "history"].map(t => (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t as any)}
                                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-slate-900 text-white' : 'text-slate-400'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <RefreshCw className={`w-4 h-4 text-slate-300 ${brandingLoading ? 'animate-spin' : ''}`} />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Room</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Task</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Time</th>
                                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {currentDisplayRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-20 text-center text-slate-300 font-bold italic">No {activeTab} signals...</td>
                                </tr>
                            ) : (
                                currentDisplayRequests.map((req) => (
                                    <tr key={req.id} className={`transition-all group ${getRowStyle(req.type)}`}>
                                        <td className="p-6">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black shadow-lg">
                                                {req.room}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center font-black text-slate-900 mb-1">
                                                {req.type.toLowerCase().includes('dining') ? <Utensils className="w-4 h-4 mr-2 text-amber-500" /> : <Bell className="w-4 h-4 mr-2 text-blue-500" />}
                                                {req.type}
                                            </div>
                                            <p className="text-xs text-slate-400 font-medium line-clamp-1">{req.notes || "No special instructions"}</p>
                                        </td>
                                        <td className="p-6 text-center">
                                            <span className="text-xs font-black text-slate-900">{req.time}</span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button onClick={() => setSelectedRequest(req)} className="p-3 bg-slate-50 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all">
                                                    <Eye className="w-4 h-4 text-slate-400" />
                                                </button>
                                                {req.status === "Pending" && (
                                                    <button onClick={() => updateStatus(req.id, "Assigned")} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-slate-200">Accept</button>
                                                )}
                                                {req.status === "Assigned" && (
                                                    <button onClick={() => updateStatus(req.id, "In Progress")} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-100">Start</button>
                                                )}
                                                {req.status === "In Progress" && (
                                                    <button onClick={() => updateStatus(req.id, "Completed")} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-emerald-100">Finish</button>
                                                )}
                                                {req.status === "Completed" && (
                                                    <CheckCircle className="w-5 h-5 text-emerald-500 mr-2" />
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <RequestDetailModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />
        </div>
    );
}
