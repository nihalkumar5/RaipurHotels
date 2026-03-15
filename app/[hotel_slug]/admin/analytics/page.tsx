"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import {
    AlertTriangle,
    BarChart3,
    BedDouble,
    Calendar,
    CheckCircle2,
    ClipboardList,
    ConciergeBell,
    Download,
    IndianRupee,
    Loader2,
    Shirt,
    Sparkles,
    Users,
    Utensils,
    Wrench,
    Car,
    type LucideIcon,
} from "lucide-react";

import {
    type HotelRequest,
    type RequestStatus,
    useActiveGuests,
    useHotelBranding,
    useRooms,
    useSupabaseRequests,
} from "@/utils/store";

type DepartmentKey =
    | "Dining"
    | "Laundry"
    | "Housekeeping"
    | "Reception"
    | "Maintenance"
    | "Transport"
    | "Other";

type DepartmentStat = {
    key: DepartmentKey;
    label: string;
    icon: LucideIcon;
    count: number;
    liveCount: number;
    revenue: number;
    outstanding: number;
};

type FocusItem = {
    title: string;
    detail: string;
    tone: "amber" | "rose" | "blue" | "emerald";
};

const ACTIVE_STATUSES = new Set<RequestStatus>(["Pending", "Assigned", "In Progress"]);

const DEPARTMENT_META: Record<
    DepartmentKey,
    {
        label: string;
        icon: LucideIcon;
    }
> = {
    Dining: { label: "Dining", icon: Utensils },
    Laundry: { label: "Laundry", icon: Shirt },
    Housekeeping: { label: "Housekeeping", icon: Sparkles },
    Reception: { label: "Reception", icon: ConciergeBell },
    Maintenance: { label: "Maintenance", icon: Wrench },
    Transport: { label: "Transport", icon: Car },
    Other: { label: "Other", icon: BarChart3 },
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
});

const formatCurrency = (value: number) => currencyFormatter.format(value || 0);

const formatPercent = (value: number) => `${Math.round(value)}%`;

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
    `${count} ${count === 1 ? singular : plural}`;

const getRequestAmount = (request: HotelRequest) => {
    const rawAmount = request.total ?? request.price ?? 0;
    return Number.isFinite(rawAmount) ? Number(rawAmount) : 0;
};

const mapRequestDepartment = (requestType?: string): DepartmentKey => {
    const normalized = (requestType || "").toLowerCase();

    if (
        normalized.includes("dining") ||
        normalized.includes("room service") ||
        normalized.includes("tea") ||
        normalized.includes("coffee") ||
        normalized.includes("water") ||
        normalized.includes("mini bar") ||
        normalized.includes("breakfast")
    ) {
        return "Dining";
    }

    if (normalized.includes("laundry")) {
        return "Laundry";
    }

    if (
        normalized.includes("clean") ||
        normalized.includes("housekeeping") ||
        normalized.includes("luggage")
    ) {
        return "Housekeeping";
    }

    if (
        normalized.includes("reception") ||
        normalized.includes("late checkout") ||
        normalized.includes("wake call") ||
        normalized.includes("concierge")
    ) {
        return "Reception";
    }

    if (
        normalized.includes("maintenance") ||
        normalized.includes("repair") ||
        normalized.includes("tap") ||
        normalized.includes("toilet") ||
        normalized.includes("shower") ||
        normalized.includes("fan") ||
        normalized.includes("ac") ||
        normalized.includes("tv")
    ) {
        return "Maintenance";
    }

    if (
        normalized.includes("taxi") ||
        normalized.includes("airport") ||
        normalized.includes("transfer")
    ) {
        return "Transport";
    }

    return "Other";
};

const formatRequestTime = (request: HotelRequest) => {
    if (typeof request.timestamp === "number" && Number.isFinite(request.timestamp)) {
        return new Intl.DateTimeFormat("en-IN", {
            hour: "numeric",
            minute: "2-digit",
        }).format(new Date(request.timestamp));
    }

    return request.time || "--";
};

const isTodayDate = (value?: string) => {
    if (!value) {
        return false;
    }

    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);
    if (value.slice(0, 10) === todayKey) {
        return true;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return false;
    }

    return parsed.toISOString().slice(0, 10) === todayKey;
};

const focusToneStyles: Record<FocusItem["tone"], string> = {
    amber: "border-amber-200 bg-amber-50 text-amber-950",
    rose: "border-rose-200 bg-rose-50 text-rose-950",
    blue: "border-blue-200 bg-blue-50 text-blue-950",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-950",
};

export default function AnalyticsPage() {
    const params = useParams();
    const hotelSlug = params?.hotel_slug as string;
    const { branding, loading: brandingLoading } = useHotelBranding(hotelSlug);
    const requests = useSupabaseRequests(branding?.id);
    const { rooms, loading: roomsLoading } = useRooms(branding?.id);
    const { guests, loading: guestsLoading } = useActiveGuests(branding?.id);

    const analytics = useMemo(() => {
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const hasThirtyDayData = requests.some((request) => request.timestamp >= thirtyDaysAgo);
        const scopedRequests = hasThirtyDayData
            ? requests.filter((request) => request.timestamp >= thirtyDaysAgo)
            : requests;

        const activeRequests = scopedRequests.filter((request) => ACTIVE_STATUSES.has(request.status));
        const completedRequests = scopedRequests.filter((request) => request.status === "Completed");
        const billableRequests = scopedRequests.filter((request) => getRequestAmount(request) > 0);
        const paidRequests = billableRequests.filter((request) => request.is_paid);
        const outstandingRequests = billableRequests.filter((request) => !request.is_paid);

        const collectedRevenue = paidRequests.reduce((sum, request) => sum + getRequestAmount(request), 0);
        const outstandingRevenue = outstandingRequests.reduce((sum, request) => sum + getRequestAmount(request), 0);

        const occupiedRooms = rooms.filter((room) => room.is_occupied);
        const totalRooms = rooms.length;
        const occupiedRoomCount = occupiedRooms.length;
        const occupancyRate = totalRooms ? (occupiedRoomCount / totalRooms) * 100 : 0;
        const guestHeadcountFromRooms = occupiedRooms.reduce(
            (sum, room) => sum + (room.num_guests && room.num_guests > 0 ? room.num_guests : 1),
            0,
        );
        const activeGuestCount = Math.max(guests.length, guestHeadcountFromRooms, occupiedRoomCount);
        const checkoutTodayRooms = rooms.filter((room) => isTodayDate(room.checkout_date));

        const departmentAccumulator = Object.keys(DEPARTMENT_META).reduce<Record<DepartmentKey, DepartmentStat>>(
            (accumulator, key) => {
                const typedKey = key as DepartmentKey;
                accumulator[typedKey] = {
                    key: typedKey,
                    label: DEPARTMENT_META[typedKey].label,
                    icon: DEPARTMENT_META[typedKey].icon,
                    count: 0,
                    liveCount: 0,
                    revenue: 0,
                    outstanding: 0,
                };
                return accumulator;
            },
            {} as Record<DepartmentKey, DepartmentStat>,
        );

        const roomStats = new Map<
            string,
            { room: string; requestCount: number; liveCount: number; collected: number; outstanding: number }
        >();

        scopedRequests.forEach((request) => {
            const department = mapRequestDepartment(request.type);
            const amount = getRequestAmount(request);
            const departmentStat = departmentAccumulator[department];

            departmentStat.count += 1;
            departmentStat.liveCount += ACTIVE_STATUSES.has(request.status) ? 1 : 0;
            departmentStat.revenue += request.is_paid ? amount : 0;
            departmentStat.outstanding += request.is_paid ? 0 : amount;

            const roomKey = request.room || "Unknown";
            const existingRoom = roomStats.get(roomKey) || {
                room: roomKey,
                requestCount: 0,
                liveCount: 0,
                collected: 0,
                outstanding: 0,
            };

            existingRoom.requestCount += 1;
            existingRoom.liveCount += ACTIVE_STATUSES.has(request.status) ? 1 : 0;
            existingRoom.collected += request.is_paid ? amount : 0;
            existingRoom.outstanding += request.is_paid ? 0 : amount;
            roomStats.set(roomKey, existingRoom);
        });

        const departmentStats = Object.values(departmentAccumulator)
            .filter((stat) => stat.count > 0)
            .sort((left, right) => right.count - left.count)
            .slice(0, 5);

        const followUpRooms = Array.from(roomStats.values())
            .sort((left, right) => {
                if (right.outstanding !== left.outstanding) {
                    return right.outstanding - left.outstanding;
                }

                if (right.liveCount !== left.liveCount) {
                    return right.liveCount - left.liveCount;
                }

                return right.requestCount - left.requestCount;
            })
            .slice(0, 5);

        const focusItems: FocusItem[] = [];

        if (outstandingRevenue > 0) {
            focusItems.push({
                tone: "rose",
                title: `Collect ${formatCurrency(outstandingRevenue)}`,
                detail: `${pluralize(followUpRooms.filter((room) => room.outstanding > 0).length, "room")} still have unpaid service bills.`,
            });
        }

        if (activeRequests.length > 0) {
            focusItems.push({
                tone: "amber",
                title: `Close ${pluralize(activeRequests.length, "open request")}`,
                detail: "These guest requests are still waiting for the team to finish action.",
            });
        }

        if (checkoutTodayRooms.length > 0) {
            focusItems.push({
                tone: "blue",
                title: `Prepare ${pluralize(checkoutTodayRooms.length, "checkout")}`,
                detail: "Front desk and housekeeping should coordinate these rooms today.",
            });
        }

        if (focusItems.length === 0) {
            focusItems.push({
                tone: "emerald",
                title: "Everything looks under control",
                detail: "No open backlog or unpaid service amount is currently showing in this reporting window.",
            });
        }

        return {
            scopedRequests,
            hasThirtyDayData,
            collectedRevenue,
            outstandingRevenue,
            occupiedRoomCount,
            totalRooms,
            occupancyRate,
            activeGuestCount,
            activeRequestCount: activeRequests.length,
            completedRequestCount: completedRequests.length,
            completionRate: scopedRequests.length ? (completedRequests.length / scopedRequests.length) * 100 : 0,
            checkoutTodayCount: checkoutTodayRooms.length,
            departmentStats,
            followUpRooms,
            focusItems,
            recentRequests: scopedRequests.slice(0, 6),
        };
    }, [guests, requests, rooms]);

    const exportToCSV = () => {
        if (!analytics.scopedRequests.length) {
            return;
        }

        const headers = ["Request ID", "Room", "Type", "Department", "Status", "Notes", "Amount", "Paid", "Time"];
        const rows = analytics.scopedRequests.map((request) => [
            request.id,
            request.room,
            `"${request.type}"`,
            mapRequestDepartment(request.type),
            request.status,
            `"${(request.notes || "").replace(/"/g, '""')}"`,
            getRequestAmount(request),
            request.is_paid ? "PAID" : "PENDING",
            request.time,
        ]);

        const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${hotelSlug}_simple_owner_snapshot_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (brandingLoading && !branding) {
        return (
            <div className="p-12 flex items-center justify-center text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin mr-3" />
                Loading owner snapshot...
            </div>
        );
    }

    const metricCards = [
        {
            label: "Money Collected",
            value: formatCurrency(analytics.collectedRevenue),
            note: "Paid service amount",
            icon: IndianRupee,
        },
        {
            label: "Money Pending",
            value: formatCurrency(analytics.outstandingRevenue),
            note: "Still to collect",
            icon: AlertTriangle,
        },
        {
            label: "Rooms Occupied",
            value: analytics.totalRooms
                ? `${analytics.occupiedRoomCount}/${analytics.totalRooms}`
                : analytics.occupiedRoomCount.toString(),
            note: analytics.totalRooms ? `${formatPercent(analytics.occupancyRate)} occupied` : "No rooms added yet",
            icon: BedDouble,
        },
        {
            label: "Open Requests",
            value: analytics.activeRequestCount.toString(),
            note: `${analytics.completedRequestCount} completed in this period`,
            icon: ClipboardList,
        },
    ];

    return (
        <div className="p-8 max-w-[1280px] mx-auto pb-32 space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div>
                    <div
                        className="inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.22em] border mb-4"
                        style={{
                            color: branding?.primaryColor || "#0f172a",
                            backgroundColor: `${branding?.primaryColor || "#0f172a"}12`,
                            borderColor: `${branding?.primaryColor || "#0f172a"}20`,
                        }}
                    >
                        Owner Snapshot
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-950 mb-3">
                        Easy daily view for {branding?.name || "your hotel"}
                    </h1>
                    <p className="text-base text-slate-500 max-w-3xl">
                        Simple numbers only: money, occupied rooms, open guest issues, and where you may need to follow up.
                    </p>
                </div>

                <div className="flex flex-wrap gap-4">
                    <div className="px-5 py-4 bg-white border border-slate-200 rounded-[1.5rem] shadow-sm">
                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 mb-1">
                            Showing
                        </div>
                        <div className="text-sm font-black text-slate-900 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {analytics.hasThirtyDayData ? "Last 30 days" : "All available data"}
                        </div>
                    </div>
                    <button
                        onClick={exportToCSV}
                        className="px-5 py-4 rounded-[1.5rem] text-white font-black text-sm shadow-lg transition-transform active:scale-95 flex items-center gap-3"
                        style={{
                            backgroundImage: `linear-gradient(135deg, ${branding?.primaryColor || "#0f172a"}, ${branding?.accentColor || "#3b82f6"})`,
                        }}
                    >
                        <Download className="w-5 h-5" />
                        Download CSV
                    </button>
                </div>
            </div>

            {(roomsLoading || guestsLoading) && (
                <div className="px-5 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-sm text-slate-500 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Refreshing live hotel data...
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {metricCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={card.label}
                            className="bg-white rounded-[1.75rem] border border-slate-200 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                                    {card.label}
                                </div>
                                <div
                                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                                    style={{
                                        backgroundColor: `${branding?.primaryColor || "#0f172a"}10`,
                                        color: branding?.primaryColor || "#0f172a",
                                    }}
                                >
                                    <Icon className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="text-3xl font-black text-slate-950 tracking-tight mb-2">{card.value}</div>
                            <div className="text-sm text-slate-500">{card.note}</div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                <div className="mb-5">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-2">
                        Focus Today
                    </div>
                    <h2 className="text-2xl font-black text-slate-950 mb-1">What needs your attention</h2>
                    <p className="text-sm text-slate-500">
                        These are the clearest action items based on current room and service data.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {analytics.focusItems.map((item) => (
                        <div
                            key={item.title}
                            className={`rounded-[1.5rem] border p-5 ${focusToneStyles[item.tone]}`}
                        >
                            <div className="text-lg font-black mb-2">{item.title}</div>
                            <div className="text-sm leading-6 opacity-80">{item.detail}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                    <div className="mb-5">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-2">
                            Team Load
                        </div>
                        <h2 className="text-2xl font-black text-slate-950 mb-1">Which team is busiest</h2>
                        <p className="text-sm text-slate-500">
                            Simple request counts so you can see where most guest demand is landing.
                        </p>
                    </div>

                    {analytics.departmentStats.length ? (
                        <div className="space-y-3">
                            {analytics.departmentStats.map((stat) => {
                                const Icon = stat.icon;
                                return (
                                    <div
                                        key={stat.key}
                                        className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 flex items-center justify-between gap-4"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-950">{stat.label}</div>
                                                <div className="text-sm text-slate-500">
                                                    {pluralize(stat.count, "request")} total
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-slate-950">{stat.liveCount} open</div>
                                            <div className="text-xs text-slate-500">{formatCurrency(stat.revenue)} collected</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-[1.5rem] border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                            No guest requests yet, so there is no team load to show.
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                    <div className="mb-5">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-2">
                            Room Follow-up
                        </div>
                        <h2 className="text-2xl font-black text-slate-950 mb-1">Which rooms need attention</h2>
                        <p className="text-sm text-slate-500">
                            Rooms with unpaid services or live requests should usually be checked first.
                        </p>
                    </div>

                    {analytics.followUpRooms.length ? (
                        <div className="space-y-3">
                            {analytics.followUpRooms.map((room) => (
                                <div
                                    key={room.room}
                                    className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 flex items-center justify-between gap-4"
                                >
                                    <div>
                                        <div className="font-black text-slate-950">Room {room.room}</div>
                                        <div className="text-sm text-slate-500">
                                            {room.liveCount} open · {room.requestCount} total requests
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-rose-600">
                                            {room.outstanding ? formatCurrency(room.outstanding) : "No pending bill"}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            Collected {formatCurrency(room.collected)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-[1.5rem] border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                            No rooms currently need follow-up.
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
                <div className="mb-5">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-2">
                        Quick Summary
                    </div>
                    <h2 className="text-2xl font-black text-slate-950 mb-1">Simple hotel health</h2>
                    <p className="text-sm text-slate-500">
                        The most useful daily context for an owner without needing to read charts.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {[
                        {
                            label: "Guests in house",
                            value: analytics.activeGuestCount.toString(),
                            note: "Based on active guests and occupied rooms",
                            icon: Users,
                        },
                        {
                            label: "Checkouts today",
                            value: analytics.checkoutTodayCount.toString(),
                            note: "Useful for front desk and housekeeping planning",
                            icon: Calendar,
                        },
                        {
                            label: "Completion rate",
                            value: formatPercent(analytics.completionRate),
                            note: "Share of requests already closed",
                            icon: CheckCircle2,
                        },
                    ].map((item) => {
                        const Icon = item.icon;
                        return (
                            <div key={item.label} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-9 h-9 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="text-sm font-black text-slate-950">{item.label}</div>
                                </div>
                                <div className="text-2xl font-black text-slate-950 mb-1">{item.value}</div>
                                <div className="text-xs text-slate-500">{item.note}</div>
                            </div>
                        );
                    })}
                </div>

                <div>
                    <div className="text-sm font-black text-slate-950 mb-3">Latest guest activity</div>
                    {analytics.recentRequests.length ? (
                        <div className="space-y-3">
                            {analytics.recentRequests.map((request) => (
                                <div
                                    key={request.id}
                                    className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 flex items-center justify-between gap-4"
                                >
                                    <div>
                                        <div className="font-black text-slate-950">
                                            Room {request.room} · {request.type}
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            {formatRequestTime(request)}
                                            {request.notes ? ` · ${request.notes}` : ""}
                                        </div>
                                    </div>
                                    <div className="text-right min-w-fit">
                                        <div
                                            className={`text-xs font-black uppercase tracking-[0.18em] ${
                                                ACTIVE_STATUSES.has(request.status)
                                                    ? "text-amber-600"
                                                    : request.status === "Completed"
                                                        ? "text-emerald-600"
                                                        : "text-slate-500"
                                            }`}
                                        >
                                            {request.status}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {getRequestAmount(request) ? formatCurrency(getRequestAmount(request)) : "No charge"}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-[1.5rem] border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                            No guest activity yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
