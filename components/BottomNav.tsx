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
        <nav className="fixed bottom-0 left-1/2 z-50 flex h-[68px] w-[96%] max-w-[520px] -translate-x-1/2 items-center justify-around rounded-t-[28px] border border-white/70 bg-white/85 font-sans shadow-[0_20px_40px_rgba(0,0,0,0.15)] backdrop-blur-[20px] pb-[env(safe-area-inset-bottom)]">
            {items.map((item) => {
                const active = isActive(item.key);
                return (
                    <Link
                        key={item.key}
                        href={item.href}
                        className="relative flex w-1/4 flex-col items-center justify-center"
                    >
                        <motion.div
                            whileTap={{ scale: 0.94 }}
                            className={`flex h-[40px] w-[40px] items-center justify-center rounded-full transition-all duration-300 ${active ? "bg-[#CFA46A] shadow-[0_8px_20px_rgba(207,164,106,0.35)]" : "bg-transparent"}`}
                        >
                            <item.icon 
                                className={`h-[22px] w-[22px] transition-all duration-300 ${active ? "text-[#1F1F1F]" : "text-[#8A93A2]"}`} 
                                strokeWidth={active ? 2.5 : 2} 
                            />
                        </motion.div>
                    </Link>
                );
            })}
        </nav>
    );
}
