"use client";

import React, { useEffect, useRef, useState } from "react";
import {
    ArrowLeft,
    CheckCircle2,
    ChevronRight,
    Phone,
    Sparkle,
} from "lucide-react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
    useHotelBranding,
    useSupabaseRequests,
} from "@/utils/store";
import { useGuestRoom } from "../GuestAuthWrapper";
import { playGuestNotification, playSuccessNotification } from "@/utils/audio";
import type { HotelRequest, RequestStatus } from "@/lib/hotel/types";

type TimelineStep = {
    key: string;
    label: string;
    active: boolean;
};

type StaffFallback = {
    team: string;
    role: string;
    eta: string;
};

const LIVE_STATUSES: RequestStatus[] = ["Pending", "Assigned", "In Progress"];

const getStaffFallback = (type: string): StaffFallback => {
    const normalized = type.toLowerCase();

    if (normalized.includes("reception") || normalized.includes("support")) {
        return {
            team: "Front Desk Team",
            role: "Front Desk Manager",
            eta: "2 min",
        };
    }

    if (normalized.includes("clean")) {
        return {
            team: "Housekeeping Team",
            role: "Floor Attendant",
            eta: "5 min",
        };
    }

    if (normalized.includes("laundry")) {
        return {
            team: "Laundry Desk",
            role: "Laundry Associate",
            eta: "8 min",
        };
    }

    if (normalized.includes("dining") || normalized.includes("room service")) {
        return {
            team: "Kitchen Team",
            role: "Room Service Captain",
            eta: "12 min",
        };
    }

    return {
        team: "Hotel Staff",
        role: "Service Associate",
        eta: "5 min",
    };
};

const getTimelineSteps = (status: RequestStatus): TimelineStep[] => {
    const statusRank = {
        Pending: 1,
        Assigned: 2,
        "In Progress": 3,
        Completed: 4,
        Rejected: 0,
    } satisfies Record<RequestStatus, number>;

    if (status === "Rejected") {
        return [
            { key: "received", label: "Request Received", active: true },
            { key: "assigned", label: "Staff Assigned", active: false },
            { key: "cancelled", label: "Request Cancelled", active: true },
            { key: "completed", label: "Completed", active: false },
        ];
    }

    return [
        { key: "received", label: "Request Received", active: statusRank[status] >= 1 },
        { key: "assigned", label: "Staff Assigned", active: statusRank[status] >= 2 },
        { key: "ontheway", label: "Staff On The Way", active: statusRank[status] >= 3 },
        { key: "completed", label: "Delivered", active: statusRank[status] >= 4 },
    ];
};

const getTrackerProgress = (status: RequestStatus) => {
    switch (status) {
        case "Pending":
            return "18%";
        case "Assigned":
            return "42%";
        case "In Progress":
            return "72%";
        case "Completed":
            return "100%";
        default:
            return "18%";
    }
};

const getStatusTone = (status: RequestStatus) => {
    switch (status) {
        case "Pending":
            return "bg-[#F7F1E5] text-[#B98945]";
        case "Assigned":
            return "bg-[#EEF4FF] text-[#5676B8]";
        case "In Progress":
            return "bg-[#FDECEC] text-[#E5484D]";
        case "Completed":
            return "bg-[#ECF9F1] text-[#1C8B57]";
        case "Rejected":
            return "bg-[#F7F1F1] text-[#A04444]";
    }
};

const getCompletionMessage = (hotelName?: string) => {
    const name = hotelName?.trim() || "your hotel";
    const normalized = name.toLowerCase();

    if (normalized.includes("resort") || normalized.includes("bay") || normalized.includes("sand")) {
        return {
            heading: "All Set",
            body: "Your room requests have been completed.",
            closing: "Relax and enjoy your stay at",
            hotel: name,
        };
    }

    if (normalized.includes("mountain") || normalized.includes("lodge")) {
        return {
            heading: "All Set",
            body: "Your room requests have been completed.",
            closing: "Enjoy the serenity of",
            hotel: name,
        };
    }

    return {
        heading: "All Set",
        body: "Your room requests have been completed.",
        closing: "Enjoy your stay at",
        hotel: name,
    };
};

export default function StatusPage() {
    const router = useRouter();
    const params = useParams();
    const hotelSlug = params?.hotel_slug as string;
    const { roomNumber, checkedInAt } = useGuestRoom();
    const { branding } = useHotelBranding(hotelSlug);
    const requests = useSupabaseRequests(branding?.id, roomNumber, checkedInAt);
    const prevRequestsRef = useRef(requests);
    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

    useEffect(() => {
        if (!prevRequestsRef.current || prevRequestsRef.current.length === 0) {
            prevRequestsRef.current = requests;
            return;
        }

        const prev = prevRequestsRef.current;
        let shouldPlayRoutine = false;
        let shouldPlaySuccess = false;

        requests.forEach((currentReq) => {
            const prevReq = prev.find((request) => request.id === currentReq.id);
            if (prevReq && prevReq.status !== currentReq.status) {
                if (currentReq.status === "Completed") {
                    shouldPlaySuccess = true;
                } else {
                    shouldPlayRoutine = true;
                }
            }
        });

        if (shouldPlaySuccess) {
            playSuccessNotification();
        } else if (shouldPlayRoutine) {
            playGuestNotification();
        }

        prevRequestsRef.current = requests;
    }, [requests]);

    const sortedActiveRequests = requests
        .filter((request) => LIVE_STATUSES.includes(request.status))
        .sort((left, right) => right.timestamp - left.timestamp);

    const completedRequests = requests
        .filter((request) => request.status === "Completed")
        .sort((left, right) => right.timestamp - left.timestamp);

    const latestActiveRequest = sortedActiveRequests[0] ?? null;

    useEffect(() => {
        if (!latestActiveRequest) {
            setSelectedRequestId(null);
            return;
        }

        if (!selectedRequestId || !sortedActiveRequests.some((request) => request.id === selectedRequestId)) {
            setSelectedRequestId(latestActiveRequest.id);
        }
    }, [latestActiveRequest, selectedRequestId, sortedActiveRequests]);

    const primaryRequest =
        sortedActiveRequests.find((request) => request.id === selectedRequestId) ??
        latestActiveRequest;

    const secondaryRequests = sortedActiveRequests.filter((request) => request.id !== primaryRequest?.id);
    const supportPhone = branding?.receptionPhone?.trim();
    const completionMessage = getCompletionMessage(branding?.name);

    const renderTimeline = (request: HotelRequest) => {
        const steps = getTimelineSteps(request.status);
        return (
            <div className="space-y-5">
                {steps.map((step, index) => {
                    const isLast = index === steps.length - 1;
                    return (
                        <div key={step.key} className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                                <div
                                    className={`h-3.5 w-3.5 rounded-full border-2 ${
                                        step.active
                                            ? "border-[#db8d3f] bg-[#db8d3f]"
                                            : "border-[#DBD4CA] bg-white/75"
                                    }`}
                                />
                                {!isLast && (
                                    <div
                                        className={`mt-1 h-9 w-px ${
                                            step.active && steps[index + 1]?.active
                                                ? "bg-[#db8d3f]"
                                                : "bg-[#E9E3DA]"
                                        }`}
                                    />
                                )}
                            </div>
                            <div>
                                <p className="text-[13px] font-semibold text-[#1F1F1F]">{step.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderTrackingHero = (request: HotelRequest) => {
        const staff = getStaffFallback(request.type);
        const isLive = LIVE_STATUSES.includes(request.status);
        const trackerProgress = getTrackerProgress(request.status);

        return (
            <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-[22px] border border-[#ffc896]/45 bg-[linear-gradient(145deg,rgba(255,199,143,0.35),rgba(255,156,71,0.2))] p-6 shadow-[0_16px_32px_rgba(70,59,49,0.2)] backdrop-blur-[18px]"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#CFA46A]">
                            Live Service Tracking
                        </p>
                        <h2 className="mt-2 font-serif text-[28px] font-semibold leading-none text-[#1F1F1F]">
                            {request.type}
                        </h2>
                        <p className="mt-4 text-[15px] font-semibold text-[#1F1F1F]">{request.status}</p>
                    </div>
                    {isLive && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FDECEC] px-3 py-1.5 text-[12px] font-black uppercase tracking-[0.12em] text-[#E5484D]">
                            <span className="h-2 w-2 rounded-full bg-[#E5484D] animate-[pulse_2s_infinite]" />
                            Live
                        </span>
                    )}
                </div>

                <div className="mt-6 flex gap-10 rounded-[14px] border border-white/35 bg-white/35 p-4 backdrop-blur-[8px]">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Requested</p>
                        <p className="mt-1 text-[16px] font-semibold text-[#1F1F1F]">{request.time}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Room</p>
                        <p className="mt-1 text-[16px] font-semibold text-[#1F1F1F]">{request.room}</p>
                    </div>
                </div>

                {request.notes && (
                    <div className="mt-5 rounded-[16px] border border-white/40 bg-white/40 p-4 backdrop-blur-[8px]">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Request Note</p>
                        <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{request.notes}</p>
                    </div>
                )}

                <div className="mt-6 rounded-[18px] border border-white/40 bg-white/35 p-4 backdrop-blur-[10px]">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Staff Coming To Your Room</p>
                            <p className="mt-1 text-[15px] font-semibold text-[#1F1F1F]">{staff.team}</p>
                            <p className="mt-1 text-[12px] text-slate-500">{staff.role}</p>
                        </div>
                        <span className="rounded-full border border-[#ffcf9f]/70 bg-[linear-gradient(145deg,rgba(255,200,145,0.55),rgba(255,158,86,0.45))] px-3 py-1.5 text-[12px] font-semibold text-[#8f4e12]">
                            Arriving in {staff.eta}
                        </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <span>Staff</span>
                        <span>Your Room</span>
                    </div>
                    <div className="relative mt-2 h-8">
                        <div className="absolute left-6 right-6 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-[#E9E3DA]" />
                        <div className="absolute left-6 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#CFA46A]" />
                        <div className="absolute right-6 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#E9E3DA]" />
                        <motion.div
                            animate={{ left: trackerProgress, scale: [1, 1.1, 1] }}
                            transition={{ left: { duration: 0.6, ease: "easeOut" }, scale: { duration: 2, repeat: Infinity } }}
                            className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-[#CFA46A] shadow-[0_0_0_6px_rgba(207,164,106,0.14)]"
                        />
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 text-[18px]">👨‍💼</div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[18px]">🏨</div>
                    </div>
                </div>

                <div className="mt-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Service Timeline</p>
                    <div className="mt-4">{renderTimeline(request)}</div>
                </div>

                <div className="mt-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Need Help?</p>
                    <div className="mt-3">
                        {supportPhone ? (
                            <a
                                href={`tel:${supportPhone}`}
                                className="flex items-center justify-center gap-2 rounded-[16px] border border-[#ffc896]/60 bg-white/45 px-4 py-3 text-[12px] font-semibold text-[#2f2218] backdrop-blur-[10px]"
                            >
                                <Phone className="h-4 w-4" />
                                Call Reception
                            </a>
                        ) : (
                            <button
                                type="button"
                                disabled
                                className="flex items-center justify-center gap-2 rounded-[16px] border border-[#ffd8b7]/70 bg-white/25 px-4 py-3 text-[12px] font-semibold text-slate-500 backdrop-blur-[8px]"
                            >
                                <Phone className="h-4 w-4" />
                                Call Reception
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#d6d7db_0%,_#b9bcc3_55%,_#aeb1b8_100%)] px-5 pb-40 pt-8 text-slate-900">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(165deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.06)_40%,rgba(255,145,58,0.09)_100%)]" />
            <div className="relative">
            <div className="mb-8 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#ffc896]/55 bg-white/45 shadow-[0_10px_20px_rgba(97,77,58,0.2)] backdrop-blur-[10px] transition-transform active:scale-95"
                    >
                        <ArrowLeft className="h-5 w-5 text-[#1F1F1F]" />
                    </button>
                    <div>
                        <h1 className="font-serif text-[24px] font-semibold text-[#1F1F1F]">
                            {primaryRequest ? "Live Request" : "Requests"}
                        </h1>
                    </div>
                </div>
                {primaryRequest && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#ffc896]/70 bg-[linear-gradient(145deg,rgba(255,194,138,0.45),rgba(255,149,62,0.35))] px-3 py-1.5 text-[12px] font-black uppercase tracking-[0.12em] text-[#8f4e12] backdrop-blur-[10px]">
                        <span className="h-2 w-2 rounded-full bg-[#d57c22] animate-[pulse_2s_infinite]" />
                        Live
                    </span>
                )}
            </div>

            {primaryRequest ? (
                <div className="space-y-5">
                    {renderTrackingHero(primaryRequest)}

                    {secondaryRequests.length > 0 && (
                        <div>
                            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                Other Active Requests
                            </p>
                            <div className="space-y-3">
                                {secondaryRequests.map((request) => (
                                    <button
                                        key={request.id}
                                        onClick={() => setSelectedRequestId(request.id)}
                                        className="flex w-full items-center justify-between rounded-[18px] border border-[#ffcda0]/45 bg-white/35 p-4 text-left shadow-[0_12px_24px_rgba(72,59,45,0.16)] backdrop-blur-[12px]"
                                    >
                                        <div>
                                            <p className="font-serif text-[18px] text-[#1F1F1F]">{request.type}</p>
                                            <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-slate-400">
                                                Room {request.room} · {request.time}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${getStatusTone(request.status)}`}>
                                                {request.status}
                                            </span>
                                            <ChevronRight className="h-4 w-4 text-slate-400" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="relative overflow-hidden rounded-[22px] border border-[#ffc896]/45 bg-[linear-gradient(150deg,rgba(255,196,138,0.34),rgba(255,151,61,0.2))] p-7 text-center shadow-[0_18px_35px_rgba(68,56,44,0.2)] backdrop-blur-[16px]">
                    <div className="pointer-events-none absolute inset-0 opacity-15">
                        <div className="absolute -right-2 top-6 text-[64px] text-[#d48638]">🛎️</div>
                        <div className="absolute left-3 bottom-5 text-[56px] text-[#ce7f2e]">☕</div>
                    </div>
                    <motion.div
                        animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.08, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#ffc996]/60 bg-white/50"
                    >
                        <Sparkle className="h-7 w-7 text-[#cf7d27]" />
                    </motion.div>
                    <p className="mt-4 font-serif text-[28px] text-[#1F1F1F]">{completionMessage.heading}</p>
                    <p className="mx-auto mt-3 max-w-[240px] text-[14px] leading-6 text-slate-600">
                        {completionMessage.body}
                    </p>
                    <p className="mt-5 text-[12px] uppercase tracking-[0.16em] text-slate-400">
                        {completionMessage.closing}
                    </p>
                    <p className="mt-2 font-serif text-[26px] font-semibold uppercase tracking-[0.04em] text-[#1F1F1F]">
                        {completionMessage.hotel}
                    </p>
                    <div className="mt-7">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                            Need Anything Else?
                        </p>
                        <button
                            type="button"
                            onClick={() => router.push(`/${hotelSlug}/guest/services`)}
                            className="mt-3 inline-flex items-center justify-center rounded-[16px] border border-[#ffbe87]/60 bg-[linear-gradient(145deg,rgba(255,170,96,0.92),rgba(244,130,39,0.88))] px-5 py-3 text-[12px] font-semibold text-white shadow-[0_14px_25px_rgba(105,67,28,0.28)] transition-transform active:scale-95"
                        >
                            Request Service
                        </button>
                    </div>
                </div>
            )}

            {completedRequests.length > 0 && (
                <div className="mt-8">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Completed Today
                    </p>
                    <div className="space-y-3">
                        {completedRequests.map((request) => (
                            <div
                                key={request.id}
                                className="rounded-[18px] border border-[#ffcda0]/45 bg-white/35 px-4 py-3 backdrop-blur-[12px]"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-[#ffcf9e]/60 bg-white/50">
                                            <CheckCircle2 className="h-4 w-4 text-[#cb7b2a]" />
                                        </div>
                                        <div>
                                            <p className="text-[14px] font-semibold text-[#1F1F1F]">
                                                {request.type}{" "}
                                                <span className="font-medium text-slate-500">delivered</span>
                                            </p>
                                            <p className="mt-1 text-[11px] text-slate-400">{request.time}</p>
                                        </div>
                                    </div>
                                    <span className="rounded-full border border-[#ffcf9e]/60 bg-[linear-gradient(145deg,rgba(255,190,127,0.44),rgba(255,150,56,0.35))] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#8f4e12]">
                                        Delivered
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}
