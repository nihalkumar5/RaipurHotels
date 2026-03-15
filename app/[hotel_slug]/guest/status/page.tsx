"use client";

import React, { useEffect, useRef, useState } from "react";
import {
    ArrowLeft,
    CheckCircle2,
    ChevronRight,
    Phone,
    Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import {
    updateSupabaseRequestStatus,
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
                                            ? "border-[#CFA46A] bg-[#CFA46A]"
                                            : "border-[#DBD4CA] bg-white"
                                    }`}
                                />
                                {!isLast && (
                                    <div
                                        className={`mt-1 h-9 w-px ${
                                            step.active && steps[index + 1]?.active
                                                ? "bg-[#CFA46A]"
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
                className="overflow-hidden rounded-[22px] border border-[#EEE7DC] bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
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

                <div className="mt-6 flex gap-10 rounded-[14px] bg-[#F6F2EC] p-4">
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
                    <div className="mt-5 rounded-[16px] border border-[#F1E7D8] bg-[#FFFDF8] p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Request Note</p>
                        <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{request.notes}</p>
                    </div>
                )}

                <div className="mt-6 rounded-[18px] border border-[#F1E7D8] bg-[#FFFCF6] p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Staff Coming To Your Room</p>
                            <p className="mt-1 text-[15px] font-semibold text-[#1F1F1F]">{staff.team}</p>
                            <p className="mt-1 text-[12px] text-slate-500">{staff.role}</p>
                        </div>
                        <span className="rounded-full bg-[#F3E6D3] px-3 py-1.5 text-[12px] font-semibold text-[#9C6B2E]">
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
                                className="flex items-center justify-center gap-2 rounded-[16px] border border-[#E8DECE] bg-white px-4 py-3 text-[12px] font-semibold text-[#1F1F1F]"
                            >
                                <Phone className="h-4 w-4" />
                                Call Reception
                            </a>
                        ) : (
                            <button
                                type="button"
                                disabled
                                className="flex items-center justify-center gap-2 rounded-[16px] border border-[#E8DECE] bg-[#F8F5EF] px-4 py-3 text-[12px] font-semibold text-slate-400"
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
        <div className="min-h-screen bg-[#F8F5EF] px-5 pb-40 pt-8 text-slate-900">
            <div className="mb-8 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white bg-white shadow-sm transition-transform active:scale-95"
                    >
                        <ArrowLeft className="h-5 w-5 text-[#1F1F1F]" />
                    </button>
                    <div>
                        <h1 className="font-serif text-[24px] font-semibold text-[#1F1F1F]">Live Request</h1>
                    </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FDECEC] px-3 py-1.5 text-[12px] font-black uppercase tracking-[0.12em] text-[#E5484D]">
                    <span className="h-2 w-2 rounded-full bg-[#E5484D] animate-[pulse_2s_infinite]" />
                    Live
                </span>
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
                                        className="flex w-full items-center justify-between rounded-[18px] border border-[#EEE7DC] bg-white p-4 text-left shadow-[0_10px_25px_rgba(0,0,0,0.04)]"
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
                <div className="rounded-[24px] border border-[#EEE7DC] bg-white p-8 text-center shadow-[0_10px_25px_rgba(0,0,0,0.05)]">
                    <Sparkles className="mx-auto h-12 w-12 text-[#CFA46A]" />
                    <p className="mt-4 font-serif text-[24px] text-[#1F1F1F]">All Clear</p>
                    <p className="mt-2 text-[12px] uppercase tracking-[0.16em] text-slate-400">
                        No active requests right now
                    </p>
                </div>
            )}

            {completedRequests.length > 0 && (
                <div className="mt-8">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                        Completed Requests
                    </p>
                    <div className="space-y-3">
                        {completedRequests.map((request) => (
                            <div
                                key={request.id}
                                className="flex items-center justify-between rounded-[18px] border border-[#EEE7DC] bg-white px-4 py-3 opacity-85"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7F1E5]">
                                        <CheckCircle2 className="h-5 w-5 text-[#B98945]" />
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-semibold text-[#1F1F1F]">{request.type}</p>
                                        <p className="text-[11px] text-slate-400">
                                            {request.time} · Room {request.room}
                                        </p>
                                    </div>
                                </div>
                                <span className="rounded-full bg-[#ECF9F1] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#1C8B57]">
                                    Delivered
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
