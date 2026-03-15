"use client";

import React from "react";
import { Home, Utensils, Layout, Bell } from "lucide-react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { motion } from "framer-motion";

export function BottomNav() {
    const pathname = usePathname();
    const params = useParams();
    const hotelSlug = params?.hotel_slug as string;

    const isActive = (path: string) => pathname?.includes(path);

    const items = [
        { href: `/${hotelSlug}/guest/dashboard`, icon: Home, label: "Home", key: "dashboard" },
        { href: `/${hotelSlug}/guest/restaurant`, icon: Utensils, label: "Dining", key: "restaurant" },
        { href: `/${hotelSlug}/guest/services`, icon: Layout, label: "Order", key: "services" },
        { href: `/${hotelSlug}/guest/status`, icon: Bell, label: "Progress", key: "status" },
    ];

    return (
        <nav className="fixed bottom-5 left-1/2 z-50 flex w-[calc(100%-32px)] max-w-[480px] -translate-x-1/2 items-center justify-between rounded-[28px] border border-white/45 bg-white/72 px-6 py-3.5 font-sans shadow-[0_15px_35px_rgba(0,0,0,0.1)] backdrop-blur-xl">
            {items.map((item) => {
                const active = isActive(item.key);
                return (
                    <Link
                        key={item.key}
                        href={item.href}
                        className="relative flex min-w-[62px] flex-col items-center gap-1.5"
                    >
                        <motion.div whileTap={{ scale: 0.94 }}>
                            <item.icon 
                                className={`h-[22px] w-[22px] transition-all duration-300 ${active ? "text-[#CFA46A] fill-[#CFA46A]/20" : "text-[#1F1F1F] opacity-35"}`} 
                                strokeWidth={active ? 2.5 : 2} 
                            />
                        </motion.div>
                        <span className={`text-[9px] font-black uppercase tracking-[0.18em] transition-all duration-300 ${active ? "text-[#CFA46A]" : "text-slate-500/70"}`}>
                            {item.label}
                        </span>
                        {active && (
                            <motion.div
                                layoutId="nav-dot"
                                className="absolute -bottom-1.5 h-1.5 w-1.5 rounded-full bg-[#CFA46A] shadow-[0_2px_4px_rgba(207,164,106,0.4)]"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
