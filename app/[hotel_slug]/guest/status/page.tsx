"use client";

import React, { useEffect, useRef } from "react";
import { ArrowLeft, Clock, CheckCircle2, Loader2, Sparkles, RefreshCcw } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { StatusBadge, RequestStatus } from "@/components/StatusBadge";
import { useSupabaseRequests, useHotelBranding } from "@/utils/store";
import { useGuestRoom } from "../GuestAuthWrapper";
import { playGuestNotification, playSuccessNotification, initAudioContext } from "@/utils/audio";
import { motion, AnimatePresence } from "framer-motion";

export default function StatusPage() {
    const router = useRouter();
    const params = useParams();
    const hotelSlug = params?.hotel_slug as string;
    const { roomNumber, checkedInAt } = useGuestRoom();
    const { branding } = useHotelBranding(hotelSlug);
    const requests = useSupabaseRequests(branding?.id, roomNumber, checkedInAt);
    const prevRequestsRef = useRef(requests);

    useEffect(() => {
        if (!prevRequestsRef.current || prevRequestsRef.current.length === 0) {
            prevRequestsRef.current = requests;
            return;
        }

        const prev = prevRequestsRef.current;
        let shouldPlayRoutine = false;
        let shouldPlaySuccess = false;

        requests.forEach(currentReq => {
            const prevReq = prev.find(r => r.id === currentReq.id);
            if (prevReq && prevReq.status !== currentReq.status) {
                console.log(`Status change detected for ${currentReq.id}: ${prevReq.status} -> ${currentReq.status}`);
                if (currentReq.status === "Completed") {
                    shouldPlaySuccess = true;
                } else {
                    shouldPlayRoutine = true;
                }
            }
        });

        if (shouldPlaySuccess) {
            console.log("Triggering success notification sound");
            playSuccessNotification();
        } else if (shouldPlayRoutine) {
            console.log("Triggering routine notification sound");
            playGuestNotification();
        }

        prevRequestsRef.current = requests;
    }, [requests]);

    const getRequestTheme = (type: string) => {
        const t = type.toLowerCase();
        if (t.includes("water")) return {
            bg: "bg-blue-50/80",
            border: "border-blue-100",
            text: "text-blue-900",
            accent: "bg-blue-500",
            light: "bg-blue-500/10",
            muted: "text-blue-400"
        };
        if (t.includes("dining") || t.includes("food") || t.includes("order")) return {
            bg: "bg-red-50/80",
            border: "border-red-100",
            text: "text-red-900",
            accent: "bg-[#E31837]",
            light: "bg-red-500/10",
            muted: "text-red-400"
        };
        if (t.includes("laundry") || t.includes("valet")) return {
            bg: "bg-indigo-50/80",
            border: "border-indigo-100",
            text: "text-indigo-900",
            accent: "bg-indigo-600",
            light: "bg-indigo-500/10",
            muted: "text-indigo-400"
        };
        if (t.includes("cleaning") || t.includes("housekeeping")) return {
            bg: "bg-emerald-50/80",
            border: "border-emerald-100",
            text: "text-emerald-900",
            accent: "bg-emerald-600",
            light: "bg-emerald-500/10",
            muted: "text-emerald-400"
        };
        // Default theme
        return {
            bg: "bg-slate-50/80",
            border: "border-slate-100",
            text: "text-slate-900",
            accent: "bg-slate-900",
            light: "bg-slate-500/10",
            muted: "text-slate-400"
        };
    };

    const activeRequests = requests.filter((r) => r.status !== "Completed");
    const pastRequests = requests.filter((r) => r.status === "Completed");

    return (
        <div className="pb-40 section-padding pt-10 min-h-screen bg-[#FDFDFD] text-slate-900">
            <div className="flex items-center justify-between mb-10">
                <button onClick={() => router.back()} className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg border border-slate-100 active:scale-90 transition-transform">
                    <ArrowLeft className="w-6 h-6 text-slate-900" />
                </button>
                <h1 className="text-2xl font-serif text-slate-900">Order Status</h1>
                <div className="w-12"></div>
            </div>

            <div className="mb-14">
                <div className="flex items-center justify-between mb-8 px-1">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Live Pulse</h2>
                    {activeRequests.length > 0 && (
                        <span className="flex items-center text-[9px] font-black text-[#E31837] bg-red-50 px-3 py-1.5 rounded-xl uppercase tracking-wider border border-red-100 shadow-sm animate-pulse">
                            <RefreshCcw className="w-3 h-3 mr-1.5 animate-spin-slow" /> Tracking Live
                        </span>
                    )}
                </div>

                {activeRequests.length > 0 ? (
                    <div className="space-y-6">
                        {activeRequests.map((req) => {
                            const theme = getRequestTheme(req.type);
                            return (
                                <motion.div
                                    key={req.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`${theme.bg} ${theme.border} border-2 p-8 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden group backdrop-blur-md`}
                                >
                                    {/* Progress Strip */}
                                    <div className="absolute top-0 left-0 w-full h-1.5 bg-white/50 overflow-hidden">
                                        <motion.div
                                            animate={{ x: ['-100%', '100%'] }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: req.status === "Pending" ? 3 : 2,
                                                ease: "linear"
                                            }}
                                            className={`w-1/2 h-full ${theme.accent}`}
                                        />
                                    </div>

                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 pr-6">
                                            <div className="flex items-center mb-1">
                                                <div className={`w-2 h-2 rounded-full ${theme.accent} mr-2`} />
                                                <h3 className={`font-serif text-2xl ${theme.text}`}>{req.type}</h3>
                                            </div>
                                            <div className="flex items-center text-[11px] text-slate-400 font-bold uppercase tracking-tight">
                                                <Clock className="w-3.5 h-3.5 mr-1.5 opacity-50" />
                                                Received {req.time} <span className="mx-2 opacity-20">•</span> Room {req.room}
                                            </div>
                                        </div>
                                        <StatusBadge status={req.status as any} />
                                    </div>

                                    {req.notes && (
                                        <p className={`text-[13px] ${theme.text} font-medium opacity-60 leading-relaxed italic`}>
                                            &ldquo;{req.notes}&rdquo;
                                        </p>
                                    )}

                                    {/* Abstract Decorative Element */}
                                    <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${theme.accent} opacity-5 blur-3xl rounded-full`} />
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white border-2 border-dashed border-slate-100 rounded-[3.5rem] py-32 text-center shadow-inner"
                    >
                        <Sparkles className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                        <p className="text-slate-900 font-serif text-xl">Everything Is Perfect</p>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">No active requests found</p>
                    </motion.div>
                )}
            </div>

            <div>
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-8 px-1">Completed Journeys</h2>
                <div className="space-y-4">
                    {pastRequests.map((req) => (
                        <div key={req.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center justify-between opacity-60 hover:opacity-100 transition-all duration-500 shadow-sm group">
                            <div className="flex items-center">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center mr-5 shadow-sm border border-emerald-100 transition-transform group-hover:scale-110">
                                    <CheckCircle2 className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="font-serif text-lg text-slate-900">{req.type}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">{req.time}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-tighter italic border border-emerald-100">Delivered</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
