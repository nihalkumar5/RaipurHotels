"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Bell,
    Car,
    CheckCircle2,
    Clock3,
    Plane,
    Send,
    Shield,
    Sparkles,
    Waves,
    Wine,
    Wrench,
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
    },
    "late-checkout": {
        title: "Late Checkout",
        subtitle: "Request a checkout extension and our desk will confirm availability.",
        requestType: "Late Checkout",
        placeholder: "Tell us your preferred checkout time and any special reason.",
        eta: "Decision in 5-10 min",
        icon: <Clock3 className="h-6 w-6" />,
        quickNotes: ["Till 1:00 PM", "Till 2:00 PM", "Need 3+ hours"],
    },
    taxi: {
        title: "Taxi Service",
        subtitle: "Comfort transfer arranged from hotel lobby on your schedule.",
        requestType: "Taxi",
        placeholder: "Pickup time, destination, and number of passengers.",
        eta: "Cab in 6-10 min",
        icon: <Car className="h-6 w-6" />,
        quickNotes: ["Airport drop", "City ride", "Round trip"],
    },
    support: {
        title: "Maintenance",
        subtitle: "Report any in-room issue and engineering staff will assist quickly.",
        requestType: "Maintenance",
        placeholder: "Share issue details like not working, leaking, low cooling, or noise.",
        eta: "Engineer in 5-12 min",
        icon: <Wrench className="h-6 w-6" />,
        quickNotes: ["Fan", "AC", "TV", "Tap", "Shower", "Toilet", "Lights", "Door Lock"],
    },
    cleaning: {
        title: "Cleaning Service",
        subtitle: "Housekeeping refresh tailored to your preferred timing.",
        requestType: "Cleaning",
        placeholder: "Mention area priority and your preferred cleaning window.",
        eta: "Housekeeping in 10-15 min",
        icon: <Wrench className="h-6 w-6" />,
        quickNotes: ["Quick refresh", "Deep clean", "Bathroom first"],
    },
    "wake-call": {
        title: "Wake Call",
        subtitle: "Personal wake-up call from reception at your chosen time.",
        requestType: "Wake Call",
        placeholder: "Please enter wake-up time and any follow-up reminder.",
        eta: "Scheduled instantly",
        icon: <Bell className="h-6 w-6" />,
        quickNotes: ["6:00 AM", "7:00 AM", "8:00 AM"],
    },
    "mini-bar": {
        title: "Mini Bar",
        subtitle: "Refill beverages and snacks selected for your room.",
        requestType: "Mini Bar",
        placeholder: "Tell us your preferred items for refill.",
        eta: "Delivery in 10-15 min",
        icon: <Wine className="h-6 w-6" />,
        quickNotes: ["Soft drinks", "Snacks", "Premium beverages"],
    },
    "airport-transfer": {
        title: "Airport Transfer",
        subtitle: "Smooth transfer planning with premium vehicle options.",
        requestType: "Airport Transfer",
        placeholder: "Flight details, pickup time, and number of bags.",
        eta: "Plan in 5-8 min",
        icon: <Plane className="h-6 w-6" />,
        quickNotes: ["Departure transfer", "Arrival pickup", "Meet & greet"],
    },
    spa: {
        title: "Spa Reservation",
        subtitle: "Book a wellness session and let us prepare your schedule.",
        requestType: "Spa",
        placeholder: "Choose treatment type and ideal appointment time.",
        eta: "Slot update in 10 min",
        icon: <Waves className="h-6 w-6" />,
        quickNotes: ["Massage", "Steam & sauna", "Facial"],
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

    const handleSubmit = async () => {
        if (!branding?.id || isLoading) return;
        setIsLoading(true);
        setError(null);

        const response = await addSupabaseRequest(branding.id, {
            room: roomNumber,
            type: config.requestType,
            notes: notes.trim() || `${config.title} requested via guest portal`,
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
            <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#d6d7db_0%,_#b9bcc3_55%,_#aeb1b8_100%)] px-6 py-14 text-[#1f1f1f]">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.05)_45%,rgba(255,145,58,0.08)_100%)]" />
                <div className="relative mx-auto flex min-h-[78vh] max-w-[560px] flex-col items-center justify-center text-center">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mb-7 flex h-24 w-24 items-center justify-center rounded-[28px] border border-[#ffb26b]/50 bg-[linear-gradient(145deg,rgba(255,180,110,0.35),rgba(255,132,41,0.2))] shadow-[0_18px_35px_rgba(98,66,38,0.22)] backdrop-blur-[14px]"
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
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#d6d7db_0%,_#b9bcc3_55%,_#aeb1b8_100%)] pb-36 pt-10 text-[#1f1f1f]">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.05)_45%,rgba(255,145,58,0.08)_100%)]" />
            <div className="relative mx-auto w-full max-w-[620px] px-6">
                <header className="mb-10 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#ffc896]/55 bg-white/45 shadow-[0_10px_20px_rgba(97,77,58,0.2)] backdrop-blur-[10px]"
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

                <section className="overflow-hidden rounded-[26px] border border-[#ffc896]/45 bg-[linear-gradient(145deg,rgba(255,199,143,0.35),rgba(255,156,71,0.2))] p-6 shadow-[0_16px_32px_rgba(70,59,49,0.2)] backdrop-blur-[18px]">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#8f4e12]">Premium Service</p>
                            <p className="mt-2 text-[14px] leading-6 text-slate-700">{config.subtitle}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#ffcf9f]/70 bg-[linear-gradient(145deg,rgba(255,200,145,0.55),rgba(255,158,86,0.45))] text-[#8f4e12]">
                            {config.icon}
                        </div>
                    </div>

                    <div className="mt-6 rounded-[14px] border border-white/35 bg-white/35 p-4 backdrop-blur-[8px]">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Estimated Response</p>
                        <p className="mt-1 text-[15px] font-semibold text-[#2f2218]">{config.eta}</p>
                    </div>

                    <div className="mt-6">
                        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Quick Notes</p>
                        <div className="flex flex-wrap gap-2">
                            {config.quickNotes.map((note) => (
                                <button
                                    key={note}
                                    type="button"
                                    onClick={() => setNotes((prev) => (prev ? `${prev}, ${note}` : note))}
                                    className="rounded-full border border-[#ffc896]/60 bg-white/45 px-3 py-1.5 text-[11px] font-semibold text-[#2f2218] backdrop-blur-[8px]"
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
                            className="h-40 w-full resize-none rounded-[16px] border border-[#ffd4ae]/70 bg-white/45 p-4 text-[14px] leading-6 text-slate-900 outline-none transition-all placeholder:text-slate-500/60 focus:border-[#f18f33]"
                        />
                    </div>

                    {error && <p className="mt-4 text-[12px] font-semibold text-red-700">{error}</p>}

                    <RequestButton
                        onClick={handleSubmit}
                        loading={isLoading}
                        className="mt-6 flex w-full items-center justify-center rounded-[16px] border-none bg-[linear-gradient(145deg,rgba(255,168,93,0.92),rgba(244,130,39,0.9))] py-4 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-[0_16px_30px_rgba(109,66,20,0.28)]"
                    >
                        <Send className="mr-2 h-4 w-4" />
                        Send Request
                    </RequestButton>
                </section>
            </div>
        </div>
    );
}
