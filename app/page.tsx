"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowRight,
    ArrowUpRight,
    Building2,
    Check,
    Smile,
    Star,
    Users,
    Zap,
    type LucideIcon,
} from "lucide-react";

import {
    LANDING_FEATURES,
    LANDING_ITEM_VARIANT,
    LANDING_NAV_LINKS,
    LANDING_PRICING_PLANS,
    LANDING_PROPERTY_AVATAR_IDS,
    LANDING_STAGGER_VARIANTS,
    LANDING_TRUST_BRANDS,
    useLandingHotels,
} from "@/lib/hotel";

const featureIcons: Record<(typeof LANDING_FEATURES)[number]["icon"], LucideIcon> = {
    Smile,
    Users,
    Zap,
};

export default function LandingPage() {
    const router = useRouter();
    const { hotels, loading } = useLandingHotels();

    const scrollToProperties = () => {
        document.getElementById("properties")?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="min-h-screen overflow-x-hidden bg-[var(--background)] font-sans text-[var(--primary-color)] selection:bg-[#C58B2A]/20 selection:text-[#0F1B2D]">
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-[#C58B2A]/5 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-[#0F1B2D]/5 blur-[120px]" />
            </div>

            <nav className="relative z-50 mx-auto flex max-w-7xl items-center justify-between px-6 py-8">
                <div className="flex items-center space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-color)] shadow-2xl shadow-[#0F1B2D]/20 transition-transform duration-500 hover:rotate-12">
                        <Building2 className="h-7 w-7 text-white" />
                    </div>
                    <span className="text-2xl font-black italic tracking-tight">
                        Antigravity<span className="not-italic text-[#C58B2A]">SaaS</span>
                    </span>
                </div>

                <div className="hidden items-center space-x-10 text-[11px] font-black uppercase tracking-[0.2em] md:flex">
                    {LANDING_NAV_LINKS.map((link) => (
                        <a key={link.href} href={link.href} className="group relative transition-colors hover:text-[#C58B2A]">
                            {link.label}
                            <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-[#C58B2A] transition-all duration-300 group-hover:w-full" />
                        </a>
                    ))}
                </div>

                <button
                    onClick={() => router.push("/register")}
                    className="rounded-2xl bg-[var(--primary-color)] px-8 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-2xl shadow-[#0F1B2D]/20 transition-all hover:bg-black active:scale-95"
                >
                    Add Your Hotel
                </button>
            </nav>

            <main className="mx-auto max-w-7xl px-6 pb-40 pt-24">
                <div className="flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="w-full max-w-5xl"
                    >
                        <div className="mb-12 inline-flex items-center space-x-2 rounded-full border border-[var(--primary-color)]/10 bg-[var(--primary-color)]/5 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                            <Zap className="h-3.5 w-3.5 text-[#C58B2A]" />
                            <span>v2.0 Scale Release</span>
                        </div>

                        <h1 className="mb-12 text-6xl font-black leading-[0.85] tracking-tighter md:text-[9.5rem]">
                            5-Star Digital <br />
                            <span className="text-[#C58B2A]">Experience.</span>
                        </h1>

                        <p className="mx-auto mb-16 max-w-2xl text-xl font-medium leading-relaxed text-[var(--text-muted)] md:text-2xl">
                            The AI-powered concierge platform for modern hotels. Automate guest requests, increase satisfaction, and run your property effortlessly.
                        </p>

                        <div className="flex flex-col items-center justify-center space-y-6 sm:flex-row sm:space-x-8 sm:space-y-0">
                            <button
                                onClick={() => router.push("/register")}
                                className="group flex items-center rounded-[2.5rem] bg-[var(--primary-color)] px-12 py-6 text-xl font-black text-white shadow-2xl shadow-[#0F1B2D]/30 transition-all hover:bg-black active:scale-95"
                            >
                                Start Free Trial
                                <ArrowRight className="ml-3 h-6 w-6 transition-transform duration-300 group-hover:translate-x-2" />
                            </button>
                            <button
                                onClick={scrollToProperties}
                                className="rounded-[2.5rem] border-2 border-transparent px-10 py-6 text-xl font-black transition-all hover:border-[var(--primary-color)]/5 hover:bg-white hover:shadow-xl active:scale-95"
                            >
                                View Live Demo
                            </button>
                        </div>
                    </motion.div>
                </div>
            </main>

            <section className="border-y border-[var(--primary-color)]/5 bg-white py-24">
                <div className="mx-auto max-w-7xl px-6">
                    <p className="mb-16 text-center text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)]">
                        Trusted by World-Class Hospitality Brands
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-12 opacity-40 grayscale transition-all duration-700 hover:opacity-100 hover:grayscale-0 md:gap-24">
                        {LANDING_TRUST_BRANDS.map((brand) => (
                            <div key={brand} className="text-xl font-black tracking-tighter md:text-3xl">
                                {brand}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="properties" className="mx-auto max-w-7xl px-6 py-32">
                <div className="mb-16 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                    <div className="max-w-xl">
                        <h2 className="mb-6 text-sm font-black uppercase tracking-[0.3em] text-[#C58B2A]">Live Properties</h2>
                        <h3 className="text-5xl font-black leading-none tracking-tighter md:text-7xl">
                            Powering Luxury <br /> Stays Worldwide.
                        </h3>
                    </div>

                    <div className="flex -space-x-4">
                        {LANDING_PROPERTY_AVATAR_IDS.map((id) => (
                            <div
                                key={id}
                                className="h-14 w-14 overflow-hidden rounded-full border-4 border-[var(--background)] bg-slate-200 shadow-xl"
                            >
                                <img src={`https://i.pravatar.cc/150?img=${id}`} alt="Guest avatar" />
                            </div>
                        ))}
                        <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-[var(--background)] bg-[#C58B2A] text-xs font-black text-white shadow-xl">
                            +2k
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid gap-8 md:grid-cols-3">
                        {[1, 2, 3].map((value) => (
                            <div key={value} className="h-[400px] rounded-[3rem] bg-white animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        variants={LANDING_STAGGER_VARIANTS}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="grid gap-8 md:grid-cols-3"
                    >
                        {hotels.map((hotel) => (
                            <motion.button
                                key={hotel.id}
                                variants={LANDING_ITEM_VARIANT}
                                onClick={() => router.push(`/${hotel.slug}/guest/dashboard`)}
                                className="group flex h-[320px] flex-col rounded-[3rem] border border-transparent bg-white p-8 text-left shadow-2xl shadow-[#0F1B2D]/5 transition-all hover:-translate-y-2 hover:border-[#C58B2A]/20 hover:shadow-[#0F1B2D]/10"
                            >
                                <div className="mb-8 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-[var(--primary-color)]/5 bg-[var(--background)]">
                                    {hotel.logoImage ? (
                                        <img src={hotel.logoImage} alt={hotel.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <Building2 className="h-8 w-8 text-[#C58B2A]" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <h4 className="mb-3 text-3xl font-black">{hotel.name}</h4>
                                    <div className="flex items-center space-x-1">
                                        {[1, 2, 3, 4, 5].map((value) => (
                                            <Star key={value} className="h-3 w-3 fill-[#C58B2A] text-[#C58B2A]" />
                                        ))}
                                        <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                            Luxury Collection
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center text-xs font-black uppercase tracking-widest text-[#C58B2A] transition-transform group-hover:translate-x-2">
                                    Enter Dashboard
                                    <ArrowUpRight className="ml-2 h-4 w-4" />
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </section>

            <section id="features" className="relative overflow-hidden bg-[var(--primary-color)] py-32 text-white">
                <div className="absolute right-0 top-0 -mr-80 -mt-80 h-[600px] w-[600px] rounded-full bg-[#C58B2A]/10 blur-[150px]" />
                <div className="relative z-10 mx-auto max-w-7xl px-6">
                    <div className="grid items-center gap-24 lg:grid-cols-2">
                        <div>
                            <h2 className="mb-8 text-sm font-black uppercase tracking-[0.3em] text-[#C58B2A]">Product Experience</h2>
                            <h3 className="mb-12 text-5xl font-black leading-[0.9] tracking-tighter md:text-7xl">
                                Seamless Flow. <br /> Effortless Control.
                            </h3>

                            <div className="space-y-12">
                                {LANDING_FEATURES.map((feature) => {
                                    const Icon = featureIcons[feature.icon];

                                    return (
                                        <div key={feature.title} className="flex items-start space-x-6">
                                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-[#C58B2A]">
                                                <Icon className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <h4 className="mb-2 text-2xl font-black">{feature.title}</h4>
                                                <p className="font-medium leading-relaxed text-slate-400">
                                                    {feature.description}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="relative rounded-[3rem] border border-white/5 bg-[#1a283dbb] p-12 shadow-2xl backdrop-blur-3xl">
                                <div className="absolute left-8 top-8 flex items-center space-x-2">
                                    <div className="h-3 w-3 rounded-full bg-red-500/50" />
                                    <div className="h-3 w-3 rounded-full bg-amber-500/50" />
                                    <div className="h-3 w-3 rounded-full bg-green-500/50" />
                                </div>
                                <div className="mt-8 space-y-6">
                                    <div className="h-12 rounded-2xl bg-white/5 animate-pulse" />
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="h-40 rounded-3xl bg-white/5 animate-pulse" />
                                        <div className="h-40 rounded-3xl bg-[#C58B2A]/20" />
                                    </div>
                                    <div className="h-32 rounded-3xl bg-white/5 animate-pulse" />
                                </div>
                                <div className="absolute -bottom-12 -right-12 hidden rounded-[2.5rem] bg-[#C58B2A] p-8 shadow-2xl transition-transform hover:rotate-0 md:block md:rotate-6">
                                    <div className="flex items-center space-x-4 text-white">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                                            <Smile className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Success</p>
                                            <p className="text-lg font-black italic">Guest Satisfied!</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="pricing" className="relative bg-white py-40">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="mb-24 text-center">
                        <h2 className="mb-6 text-sm font-black uppercase tracking-[0.3em] text-[#C58B2A]">Pricing</h2>
                        <h3 className="text-5xl font-black tracking-tighter md:text-8xl">Invest in Perfection.</h3>
                    </div>

                    <div className="grid items-stretch gap-8 md:grid-cols-3">
                        {LANDING_PRICING_PLANS.map((plan) => (
                            <motion.div
                                key={plan.name}
                                whileHover={{ y: -10 }}
                                className={`relative flex flex-col rounded-[3rem] border p-12 ${
                                    plan.accent
                                        ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-white"
                                        : "border-[var(--primary-color)]/5 bg-[var(--background)]"
                                }`}
                            >
                                {plan.popular ? (
                                    <div className="absolute right-12 top-0 -translate-y-1/2 rounded-full bg-[#C58B2A] px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-xl">
                                        Most Popular
                                    </div>
                                ) : null}

                                <div className="mb-12">
                                    <h4 className={`mb-2 text-2xl font-black ${plan.accent ? "text-[#C58B2A]" : ""}`}>
                                        {plan.name}
                                    </h4>
                                    <p className={plan.accent ? "font-medium text-slate-400" : "font-medium text-[var(--text-muted)]"}>
                                        {plan.description}
                                    </p>
                                </div>

                                <div className="mb-12">
                                    <div className="flex items-baseline">
                                        {plan.price !== "Custom" ? (
                                            <span className="mr-1 text-2xl font-black italic">₹</span>
                                        ) : null}
                                        <span className="text-7xl font-black tracking-tighter">{plan.price}</span>
                                        {plan.price !== "Custom" ? (
                                            <span className="ml-2 text-xs font-black uppercase opacity-40">/mo</span>
                                        ) : null}
                                    </div>
                                </div>

                                <ul className="mb-16 flex-1 space-y-6">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center space-x-4 text-sm font-bold">
                                            <div
                                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                                                    plan.accent
                                                        ? "bg-[#C58B2A] text-white"
                                                        : "bg-[var(--primary-color)]/10 text-[var(--primary-color)]"
                                                }`}
                                            >
                                                <Check className="h-3 w-3" />
                                            </div>
                                            <span className={plan.accent ? "text-slate-200" : "text-slate-600"}>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => router.push("/register")}
                                    className={`w-full rounded-[2rem] py-6 text-xs font-black uppercase tracking-widest transition-all ${
                                        plan.accent
                                            ? "bg-[#C58B2A] text-white shadow-xl shadow-[#C58B2A]/20 hover:bg-[#d49a37]"
                                            : "bg-[var(--primary-color)] text-white shadow-xl shadow-[#0F1B2D]/10 hover:bg-black"
                                    }`}
                                >
                                    Choose {plan.name}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-[var(--background)] py-40">
                <div className="mx-auto max-w-7xl px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="mb-8 text-sm font-black uppercase tracking-[0.4em] text-[#C58B2A]">Take the Leap</h2>
                        <h3 className="mb-16 text-6xl font-black leading-none tracking-tighter md:text-[9rem]">
                            Ready for the <br /> <span className="italic">Standard?</span>
                        </h3>
                        <div className="flex flex-col items-center justify-center space-y-6 sm:flex-row sm:space-x-8 sm:space-y-0">
                            <button
                                onClick={() => router.push("/register")}
                                className="group flex items-center rounded-[3rem] bg-[var(--primary-color)] px-16 py-8 text-2xl font-black text-white shadow-2xl shadow-[#0F1B2D]/30 transition-all hover:bg-black active:scale-95"
                            >
                                Get Started Now
                                <ArrowRight className="ml-4 h-7 w-7 transition-transform group-hover:translate-x-3" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            <footer className="border-t border-[var(--primary-color)]/5 bg-white py-24">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 px-6 md:flex-row">
                    <div className="flex items-center space-x-3">
                        <Building2 className="h-8 w-8 text-[#C58B2A]" />
                        <span className="text-xl font-black italic">
                            Antigravity<span className="not-italic text-[#C58B2A]">SaaS</span>
                        </span>
                    </div>
                    <div className="flex items-center space-x-12 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">
                        <a href="#" className="transition-colors hover:text-[#C58B2A]">Twitter</a>
                        <a href="#" className="transition-colors hover:text-[#C58B2A]">LinkedIn</a>
                        <a href="#" className="transition-colors hover:text-[#C58B2A]">Instagram</a>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">
                        © 2026 Antigravity SaaS Labs
                    </p>
                </div>
            </footer>
        </div>
    );
}
