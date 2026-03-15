"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Bell,
    Car,
    CheckCircle2,
    Clock3,
    Droplets,
    Flame,
    Monitor,
    Plane,
    Send,
    Shield,
    Sparkles,
    ThermometerSnowflake,
    Toilet,
    Tv,
    Wrench,
    Waves,
    Wine,
    Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { RequestButton } from "@/components/RequestButton";
import { addSupabaseRequest, useHotelBranding } from "@/utils/store";
import { useGuestRoom } from "../../GuestAuthWrapper";

type ServiceConfig = {
    title: string;
    subtitle: string;
    requestType: string;
    placeholder: string;
    eta: string;
    icon: React.ReactNode;
    quickNotes: string[];
    theme: {
        page: string;
        overlay: string;
        panel: string;
        chip: string;
        chipText: string;
        iconPanel: string;
    };
};

const SERVICE_CONFIG: Record<string, ServiceConfig> = {
    laundry: {
        title: "Laundry Service",
        subtitle: "Fresh and neatly finished garments, delivered to your room.",
        requestType: "Laundry",
        placeholder: "Share clothing type, quantity, and preferred return time.",
        eta: "Pickup in 8-12 min",
        icon: <Sparkles className="h-6 w-6" />,
        quickNotes: ["Express wash", "Steam press", "Pickup now"],
        theme: {
            page: "bg-[radial-gradient(circle_at_top,_#d3d9de_0%,_#afb7bf_52%,_#9ea7b1_100%)]",
            overlay: "bg-[linear-gradient(160deg,rgba(255,255,255,0.20)_0%,rgba(255,255,255,0.06)_46%,rgba(130,170,255,0.12)_100%)]",
            panel: "bg-[linear-gradient(145deg,rgba(214,230,250,0.42),rgba(176,206,238,0.28))] border-[#b7d6f4]/60",
            chip: "bg-[linear-gradient(145deg,rgba(194,222,250,0.7),rgba(164,203,238,0.55))] border-[#b8d9f6]/70",
            chipText: "text-[#234869]",
            iconPanel: "from-[#c6def7]/80 to-[#9dc4e8]/70 border-[#b5d2ef]",
        },
    },
    "late-checkout": {
        title: "Late Checkout",
        subtitle: "Request a checkout extension and our desk will confirm availability.",
        requestType: "Late Checkout",
        placeholder: "Tell us your preferred checkout time and any special reason.",
        eta: "Decision in 5-10 min",
        icon: <Clock3 className="h-6 w-6" />,
        quickNotes: ["Till 1:00 PM", "Till 2:00 PM", "Need 3+ hours"],
        theme: {
            page: "bg-[radial-gradient(circle_at_top,_#d8d5e5_0%,_#b6b0cb_52%,_#a29ab7_100%)]",
            overlay: "bg-[linear-gradient(160deg,rgba(255,255,255,0.20)_0%,rgba(255,255,255,0.06)_46%,rgba(173,128,255,0.12)_100%)]",
            panel: "bg-[linear-gradient(145deg,rgba(220,209,245,0.42),rgba(191,176,230,0.28))] border-[#cbc1e7]/60",
            chip: "bg-[linear-gradient(145deg,rgba(214,199,242,0.72),rgba(183,163,225,0.55))] border-[#c9bde8]/70",
            chipText: "text-[#4a386b]",
            iconPanel: "from-[#d4c7ef]/80 to-[#b9a7df]/70 border-[#c7bbe4]",
        },
    },
    taxi: {
        title: "Taxi Service",
        subtitle: "Comfort transfer arranged from hotel lobby on your schedule.",
        requestType: "Taxi",
        placeholder: "Pickup time, destination, and number of passengers.",
        eta: "Cab in 6-10 min",
        icon: <Car className="h-6 w-6" />,
        quickNotes: ["Airport drop", "City ride", "Round trip"],
        theme: {
            page: "bg-[radial-gradient(circle_at_top,_#d7d9dd_0%,_#b9bcc3_55%,_#a7abb3_100%)]",
            overlay: "bg-[linear-gradient(160deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.05)_45%,rgba(255,168,83,0.11)_100%)]",
            panel: "bg-[linear-gradient(145deg,rgba(255,215,178,0.38),rgba(255,180,128,0.28))] border-[#ffce9d]/60",
            chip: "bg-[linear-gradient(145deg,rgba(255,206,154,0.72),rgba(255,170,108,0.58))] border-[#ffcf9f]/70",
            chipText: "text-[#6a3d15]",
            iconPanel: "from-[#ffd9af]/75 to-[#ffc185]/70 border-[#ffcc95]",
        },
    },
    support: {
        title: "Maintenance",
        subtitle: "Report any in-room issue and engineering staff will assist quickly.",
        requestType: "Maintenance",
        placeholder: "Share issue details like not working, leaking, low cooling, or noise.",
        eta: "Engineer in 5-12 min",
        icon: <Wrench className="h-6 w-6" />,
        quickNotes: ["Fan", "AC", "TV", "Tap", "Shower", "Toilet", "Lights", "Door Lock"],
        theme: {
            page: "bg-[radial-gradient(circle_at_top,_#d4d7dc_0%,_#aeb6bf_52%,_#9aa4af_100%)]",
            overlay: "bg-[linear-gradient(160deg,rgba(255,255,255,0.21)_0%,rgba(255,255,255,0.05)_46%,rgba(245,151,71,0.11)_100%)]",
            panel: "bg-[linear-gradient(145deg,rgba(255,204,156,0.38),rgba(242,169,102,0.26))] border-[#ffc892]/60",
            chip: "bg-[linear-gradient(145deg,rgba(255,203,150,0.72),rgba(243,169,102,0.58))] border-[#ffc88f]/70",
            chipText: "text-[#603712]",
            iconPanel: "from-[#ffd6aa]/75 to-[#f0b574]/72 border-[#ffc283]",
        },
    },
    maintenance: {
        title: "Maintenance",
        subtitle: "Report any in-room issue and engineering staff will assist quickly.",
        requestType: "Maintenance",
        placeholder: "Share issue details like not working, leaking, low cooling, or noise.",
        eta: "Engineer in 5-12 min",
        icon: <Wrench className="h-6 w-6" />,
        quickNotes: ["Fan", "AC", "TV", "Tap", "Shower", "Toilet", "Lights", "Door Lock"],
        theme: {
            page: "bg-[radial-gradient(circle_at_top,_#d4d7dc_0%,_#aeb6bf_52%,_#9aa4af_100%)]",
            overlay: "bg-[linear-gradient(160deg,rgba(255,255,255,0.21)_0%,rgba(255,255,255,0.05)_46%,rgba(245,151,71,0.11)_100%)]",
            panel: "bg-[linear-gradient(145deg,rgba(255,204,156,0.38),rgba(242,169,102,0.26))] border-[#ffc892]/60",
            chip: "bg-[linear-gradient(145deg,rgba(255,203,150,0.72),rgba(243,169,102,0.58))] border-[#ffc88f]/70",
            chipText: "text-[#603712]",
            iconPanel: "from-[#ffd6aa]/75 to-[#f0b574]/72 border-[#ffc283]",
        },
    },
    cleaning: {
        title: "Cleaning Service",
        subtitle: "Pick your preferred housekeeping time with one tap.",
        requestType: "Cleaning",
        placeholder: "",
        eta: "Housekeeping in 10-15 min",
        icon: <Droplets className="h-6 w-6" />,
        quickNotes: ["Immediate", "12:00 PM", "4:00 PM", "8:00 PM"],
        theme: {
            page: "bg-[radial-gradient(circle_at_top,_#d5dcdf_0%,_#b1bcc2_54%,_#9ca8af_100%)]",
            overlay: "bg-[linear-gradient(160deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.06)_45%,rgba(96,196,206,0.1)_100%)]",
            panel: "bg-[linear-gradient(145deg,rgba(190,232,236,0.4),rgba(145,202,209,0.28))] border-[#b9dfe3]/60",
            chip: "bg-[linear-gradient(145deg,rgba(188,230,233,0.72),rgba(144,201,208,0.56))] border-[#badde2]/70",
            chipText: "text-[#1d4e54]",
            iconPanel: "from-[#bfe8eb]/80 to-[#92c7cf]/72 border-[#b0dde2]",
        },
    },
    "wake-call": {
        title: "Wake Call",
        subtitle: "Personal wake-up call from reception at your chosen time.",
        requestType: "Wake Call",
        placeholder: "Please enter wake-up time and any follow-up reminder.",
        eta: "Scheduled instantly",
        icon: <Bell className="h-6 w-6" />,
        quickNotes: ["6:00 AM", "7:00 AM", "8:00 AM"],
        theme: {
            page: "bg-[radial-gradient(circle_at_top,_#dbd8d2_0%,_#beb8af_55%,_#a8a297_100%)]",
            overlay: "bg-[linear-gradient(160deg,rgba(255,255,255,0.21)_0%,rgba(255,255,255,0.05)_46%,rgba(245,194,94,0.11)_100%)]",
            panel: "bg-[linear-gradient(145deg,rgba(242,227,186,0.42),rgba(228,199,122,0.3))] border-[#e8d4a6]/60",
            chip: "bg-[linear-gradient(145deg,rgba(240,225,182,0.74),rgba(224,194,112,0.58))] border-[#e6d39f]/70",
            chipText: "text-[#61521a]",
            iconPanel: "from-[#f1e3bf]/80 to-[#dec07e]/72 border-[#e7d29b]",
        },
    },
    "mini-bar": {
        title: "Mini Bar",
        subtitle: "Refill beverages and snacks selected for your room.",
        requestType: "Mini Bar",
        placeholder: "Tell us your preferred items for refill.",
        eta: "Delivery in 10-15 min",
        icon: <Wine className="h-6 w-6" />,
        quickNotes: ["Soft drinks", "Snacks", "Premium beverages"],
        theme: {
            page: "bg-[radial-gradient(circle_at_top,_#d9d4de_0%,_#b7afc2_55%,_#a096ab_100%)]",
            overlay: "bg-[linear-gradient(160deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.06)_45%,rgba(191,118,212,0.11)_100%)]",
            panel: "bg-[linear-gradient(145deg,rgba(226,195,238,0.42),rgba(192,150,214,0.3))] border-[#d6b8e3]/60",
            chip: "bg-[linear-gradient(145deg,rgba(224,191,237,0.74),rgba(189,145,212,0.58))] border-[#d4b5e1]/70",
            chipText: "text-[#553263]",
            iconPanel: "from-[#e1c4ee]/80 to-[#bb8fd0]/72 border-[#d2b2df]",
        },
    },
    "airport-transfer": {
        title: "Airport Transfer",
        subtitle: "Smooth transfer planning with premium vehicle options.",
        requestType: "Airport Transfer",
        placeholder: "Flight details, pickup time, and number of bags.",
        eta: "Plan in 5-8 min",
        icon: <Plane className="h-6 w-6" />,
        quickNotes: ["Departure transfer", "Arrival pickup", "Meet & greet"],
        theme: {
            page: "bg-[radial-gradient(circle_at_top,_#d2d7de_0%,_#adb7c5_54%,_#98a5b5_100%)]",
            overlay: "bg-[linear-gradient(160deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.05)_45%,rgba(109,161,230,0.12)_100%)]",
            panel: "bg-[linear-gradient(145deg,rgba(193,217,244,0.42),rgba(154,191,230,0.28))] border-[#bcd5f1]/60",
            chip: "bg-[linear-gradient(145deg,rgba(189,214,242,0.74),rgba(151,188,227,0.58))] border-[#b9d2ef]/70",
            chipText: "text-[#21466c]",
            iconPanel: "from-[#c8def5]/80 to-[#9ac0e6]/72 border-[#b8d1ee]",
        },
    },
    spa: {
        title: "Spa Reservation",
        subtitle: "Book a wellness session and let us prepare your schedule.",
        requestType: "Spa",
        placeholder: "Choose treatment type and ideal appointment time.",
        eta: "Slot update in 10 min",
        icon: <Waves className="h-6 w-6" />,
        quickNotes: ["Massage", "Steam & sauna", "Facial"],
        theme: {
            page: "bg-[radial-gradient(circle_at_top,_#d5d6e0_0%,_#b2b5c6_55%,_#9ca0b2_100%)]",
            overlay: "bg-[linear-gradient(160deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.06)_45%,rgba(145,131,234,0.1)_100%)]",
            panel: "bg-[linear-gradient(145deg,rgba(209,205,248,0.42),rgba(174,169,227,0.3))] border-[#c8c5ed]/60",
            chip: "bg-[linear-gradient(145deg,rgba(206,201,245,0.74),rgba(171,165,224,0.58))] border-[#c7c3ec]/70",
            chipText: "text-[#3e3763]",
            iconPanel: "from-[#cec9f1]/80 to-[#a9a1db]/72 border-[#c2bdea]",
        },
    },
};

const FALLBACK_SERVICE: ServiceConfig = {
    title: "Premium Service",
    subtitle: "Share your request and our concierge will coordinate it.",
    requestType: "Reception",
    placeholder: "Tell us what you need from the hotel team.",
    eta: "Response in 5 min",
    icon: <Shield className="h-6 w-6" />,
    quickNotes: ["Need support", "General request", "Please call me"],
    theme: {
        page: "bg-[radial-gradient(circle_at_top,_#d7d9dd_0%,_#b9bcc3_55%,_#a7abb3_100%)]",
        overlay: "bg-[linear-gradient(160deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.05)_45%,rgba(255,168,83,0.11)_100%)]",
        panel: "bg-[linear-gradient(145deg,rgba(255,215,178,0.38),rgba(255,180,128,0.28))] border-[#ffce9d]/60",
        chip: "bg-[linear-gradient(145deg,rgba(255,206,154,0.72),rgba(255,170,108,0.58))] border-[#ffcf9f]/70",
        chipText: "text-[#6a3d15]",
        iconPanel: "from-[#ffd9af]/75 to-[#ffc185]/70 border-[#ffcc95]",
    },
};

export default function ServiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const hotelSlug = params?.hotel_slug as string;
    const serviceSlug = params?.service_slug as string;
    const { roomNumber } = useGuestRoom();
    const { branding } = useHotelBranding(hotelSlug);

    const config = useMemo(
        () => SERVICE_CONFIG[serviceSlug] ?? FALLBACK_SERVICE,
        [serviceSlug],
    );

    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCleaningTime, setSelectedCleaningTime] = useState<string | null>(null);
    const [selectedMaintenanceIssue, setSelectedMaintenanceIssue] = useState<string | null>(null);
    const [selectedAirportPlan, setSelectedAirportPlan] = useState<string | null>(null);

    const isCleaningPage = serviceSlug === "cleaning";
    const isMaintenancePage = serviceSlug === "maintenance" || serviceSlug === "support";
    const isAirportPage = serviceSlug === "airport-transfer";

    const airportCharges = [
        { label: "Sedan", value: branding?.airportTransferCharge1?.trim() || "" },
        { label: "SUV", value: branding?.airportTransferCharge2?.trim() || "" },
        { label: "Luxury", value: branding?.airportTransferCharge3?.trim() || "" },
    ].filter((plan) => plan.value.length > 0);
    const airportComingSoon = isAirportPage && airportCharges.length === 0;

    const maintenanceQuickIssues = [
        { label: "Fan", icon: <Flame className="h-4 w-4" /> },
        { label: "AC", icon: <ThermometerSnowflake className="h-4 w-4" /> },
        { label: "TV", icon: <Tv className="h-4 w-4" /> },
        { label: "Tap", icon: <Droplets className="h-4 w-4" /> },
        { label: "Shower", icon: <Zap className="h-4 w-4" /> },
        { label: "Toilet", icon: <Toilet className="h-4 w-4" /> },
    ];

    const handleSubmit = async () => {
        if (!branding?.id || isLoading) return;
        if (airportComingSoon) return;
        setIsLoading(true);
        setError(null);

        const autoNotes = (() => {
            if (isCleaningPage && selectedCleaningTime) {
                return `Cleaning requested at ${selectedCleaningTime}`;
            }
            if (isMaintenancePage && selectedMaintenanceIssue) {
                return `Maintenance issue: ${selectedMaintenanceIssue}`;
            }
            if (isAirportPage && selectedAirportPlan) {
                return `Airport transfer plan selected: ${selectedAirportPlan}`;
            }
            return "";
        })();

        const response = await addSupabaseRequest(branding.id, {
            room: roomNumber,
            type: config.requestType,
            notes: notes.trim() || autoNotes || `${config.title} requested via guest portal`,
            status: "Pending",
            price: 0,
            total: 0,
        });

        setIsLoading(false);

        if (response?.error) {
            setError(response.error.message || "Unable to send request right now.");
            return;
        }

        setIsSubmitted(true);
    };

    if (isSubmitted) {
        return (
            <div className={`relative min-h-screen overflow-hidden px-6 py-14 text-[#1f1f1f] ${config.theme.page}`}>
                <div className={`pointer-events-none absolute inset-0 ${config.theme.overlay}`} />
                <div className="relative mx-auto flex min-h-[78vh] max-w-[560px] flex-col items-center justify-center text-center">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`mb-7 flex h-24 w-24 items-center justify-center rounded-[28px] border bg-gradient-to-br ${config.theme.iconPanel} shadow-[0_18px_35px_rgba(98,66,38,0.22)] backdrop-blur-[14px]`}
                    >
                        <CheckCircle2 className="h-12 w-12 text-[#8f4e12]" />
                    </motion.div>
                    <h1 className="font-serif text-[34px] leading-none text-[#181818]">Service Confirmed</h1>
                    <p className="mt-4 max-w-[320px] text-[15px] leading-7 text-slate-700">
                        {config.title} request has been sent. Our team is now coordinating this for room {roomNumber}.
                    </p>
                    <div className="mt-9 flex w-full max-w-[360px] flex-col gap-3">
                        <button
                            type="button"
                            onClick={() => router.push(`/${hotelSlug}/guest/status`)}
                            className="rounded-[16px] border border-[#ffbe87]/60 bg-[linear-gradient(145deg,rgba(255,170,96,0.92),rgba(244,130,39,0.88))] px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_14px_25px_rgba(105,67,28,0.28)]"
                        >
                            Track Request
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push(`/${hotelSlug}/guest/dashboard`)}
                            className="rounded-[16px] border border-[#ffc896]/60 bg-white/45 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#2f2218] backdrop-blur-[10px]"
                        >
                            Back To Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative min-h-screen overflow-hidden pb-36 pt-10 text-[#1f1f1f] ${config.theme.page}`}>
            <div className={`pointer-events-none absolute inset-0 ${config.theme.overlay}`} />
            <div className="relative mx-auto w-full max-w-[620px] px-6">
                <header className="mb-10 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl border bg-white/45 shadow-[0_10px_20px_rgba(97,77,58,0.2)] backdrop-blur-[10px] ${config.theme.panel.split(" ").find((token) => token.startsWith("border-")) ?? "border-white/35"}`}
                    >
                        <ArrowLeft className="h-5 w-5 text-[#1f1f1f]" />
                    </button>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-600">
                            {branding?.name || "Hotel Concierge"}
                        </p>
                        <h1 className="mt-1 font-serif text-[30px] leading-none text-[#191919]">{config.title}</h1>
                    </div>
                </header>

                <section className={`overflow-hidden rounded-[26px] border p-6 shadow-[0_16px_32px_rgba(70,59,49,0.2)] backdrop-blur-[18px] ${config.theme.panel}`}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8f4e12]">Premium Service</p>
                            <p className="mt-2 text-[14px] leading-6 text-slate-700">{config.subtitle}</p>
                        </div>
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl border bg-gradient-to-br text-[#8f4e12] ${config.theme.iconPanel}`}>
                            {config.icon}
                        </div>
                    </div>

                    <div className="mt-6 rounded-[14px] border border-white/35 bg-white/35 p-4 backdrop-blur-[8px]">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Estimated Response</p>
                        <p className="mt-1 text-[15px] font-semibold text-[#2f2218]">{config.eta}</p>
                    </div>

                    {isMaintenancePage && (
                        <div className="mt-6">
                            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Issue Buttons</p>
                            <div className="grid grid-cols-2 gap-2">
                                {maintenanceQuickIssues.map((issue) => (
                                    <button
                                        key={issue.label}
                                        type="button"
                                        onClick={() => setSelectedMaintenanceIssue(issue.label)}
                                        className={`flex items-center justify-center gap-2 rounded-[14px] border px-3 py-3 text-[12px] font-semibold backdrop-blur-[8px] ${selectedMaintenanceIssue === issue.label ? `${config.theme.chip} ${config.theme.chipText}` : "border-white/40 bg-white/35 text-[#2f2218]"}`}
                                    >
                                        {issue.icon}
                                        {issue.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {isCleaningPage ? (
                        <div className="mt-6">
                            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Choose Cleaning Time</p>
                            <div className="grid grid-cols-2 gap-3">
                                {config.quickNotes.map((timeSlot) => (
                                    <button
                                        key={timeSlot}
                                        type="button"
                                        onClick={() => setSelectedCleaningTime(timeSlot)}
                                        className={`rounded-[14px] border px-3 py-3 text-[12px] font-semibold backdrop-blur-[8px] ${selectedCleaningTime === timeSlot ? `${config.theme.chip} ${config.theme.chipText}` : "border-white/40 bg-white/35 text-[#2f2218]"}`}
                                    >
                                        {timeSlot}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {isAirportPage && (
                                <div className="mt-6">
                                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Airport Transfer Charges</p>
                                    {airportComingSoon ? (
                                        <div className="rounded-[16px] border border-white/35 bg-white/35 p-5 text-center backdrop-blur-[10px]">
                                            <p className="font-serif text-[22px] text-[#1f1f1f]">Coming Soon</p>
                                            <p className="mt-2 text-[13px] text-slate-600">Airport transfer pricing is not configured for this hotel yet.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3">
                                            {airportCharges.map((plan) => (
                                                <button
                                                    key={plan.label}
                                                    type="button"
                                                    onClick={() => setSelectedAirportPlan(`${plan.label} - ${plan.value}`)}
                                                    className={`flex items-center justify-between rounded-[14px] border px-4 py-3 text-left backdrop-blur-[8px] ${selectedAirportPlan?.startsWith(plan.label) ? `${config.theme.chip} ${config.theme.chipText}` : "border-white/40 bg-white/35 text-[#2f2218]"}`}
                                                >
                                                    <span className="text-[13px] font-semibold">{plan.label}</span>
                                                    <span className="text-[13px] font-black">{plan.value}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {!airportComingSoon && (
                                <>
                                    <div className="mt-6">
                                        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Quick Notes</p>
                                        <div className="flex flex-wrap gap-2">
                                            {config.quickNotes.map((note) => (
                                                <button
                                                    key={note}
                                                    type="button"
                                                    onClick={() => setNotes((prev) => (prev ? `${prev}, ${note}` : note))}
                                                    className="rounded-full border border-white/45 bg-white/38 px-3 py-1.5 text-[11px] font-semibold text-[#2f2218] backdrop-blur-[8px]"
                                                >
                                                    {note}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                                            Request Details
                                        </label>
                                        <textarea
                                            value={notes}
                                            onChange={(event) => setNotes(event.target.value)}
                                            placeholder={config.placeholder}
                                            className="h-40 w-full resize-none rounded-[16px] border border-white/45 bg-white/38 p-4 text-[14px] leading-6 text-slate-900 outline-none transition-all placeholder:text-slate-500/70 focus:border-[#f18f33]"
                                        />
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {error && <p className="mt-4 text-[12px] font-semibold text-red-700">{error}</p>}

                    {!airportComingSoon && (
                        <RequestButton
                            onClick={handleSubmit}
                            loading={isLoading}
                            disabled={
                                (isCleaningPage && !selectedCleaningTime) ||
                                (isMaintenancePage && !selectedMaintenanceIssue) ||
                                (isAirportPage && airportCharges.length > 0 && !selectedAirportPlan)
                            }
                            className="mt-6 flex w-full items-center justify-center rounded-[16px] border-none bg-[linear-gradient(145deg,rgba(255,168,93,0.92),rgba(244,130,39,0.9))] py-4 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-[0_16px_30px_rgba(109,66,20,0.28)] disabled:opacity-50"
                        >
                            <Send className="mr-2 h-4 w-4" />
                            Send Request
                        </RequestButton>
                    )}
                </section>
            </div>
        </div>
    );
}
