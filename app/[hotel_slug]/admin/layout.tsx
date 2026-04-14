"use client";

import Link from "next/link";
import { LayoutDashboard, Inbox, Hotel, Utensils, Settings, Users, BarChart, Receipt, Shirt, ConciergeBell, ShieldAlert, Loader2, LogOut } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAuth, getUserProfile, UserProfile } from "@/utils/store";
import { motion, AnimatePresence } from "framer-motion";
import { getRoleHomeRoute, getRoleFromProfile } from "@/lib/hotel/operations";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const pathname = usePathname();
    const router = useRouter();
    const hotelSlug = (params?.hotel_slug as string) || '';
    const { user, loading: authLoading } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const isDemoMode = process.env.NEXT_PUBLIC_FORCE_DEMO === 'true';

    // Check if we are on the login page
    const isLoginPage = pathname?.endsWith('/login') || pathname?.includes('/auth/');

    useEffect(() => {
        if (authLoading) return;

        if (!user && !isLoginPage) {
            // In demo mode we might allow it, but generally redirect to login
            if (process.env.NEXT_PUBLIC_FORCE_DEMO !== 'true') {
                router.push(`/${hotelSlug}/admin/login`);
            }
            setProfileLoading(false);
            return;
        }

            if (user) {
                const fetchProfile = async () => {
                    const { data } = await getUserProfile(user.id);
                    setProfile(data);
                    setProfileLoading(false);
            };
            fetchProfile();
        } else {
            setProfileLoading(false);
        }
    }, [user, authLoading, hotelSlug, isLoginPage, router]);

    const navSections = [
        {
            title: "Operations",
            items: [
                { id: 'dashboard', name: "Dashboard", href: `/${hotelSlug}/admin/dashboard`, icon: LayoutDashboard, roles: ['admin'] },
                { id: 'kitchen', name: "Kitchen Board", href: `/${hotelSlug}/admin/kitchen`, icon: Utensils, roles: ['admin', 'kitchen'] },
                { id: 'housekeeping', name: "Housekeeping", href: `/${hotelSlug}/admin/housekeeping`, icon: Shirt, roles: ['admin', 'housekeeping'] },
                { id: 'reception', name: "Reception", href: `/${hotelSlug}/admin/reception`, icon: ConciergeBell, roles: ['admin', 'reception'] },
            ]
        },
        {
            title: "Service Flow",
            items: [
                { id: 'requests', name: "Active Requests", href: `/${hotelSlug}/admin/requests`, icon: Inbox, roles: ['admin'] },
                { id: 'checkout', name: "Billing & Invoices", href: `/${hotelSlug}/admin/checkout`, icon: Receipt, roles: ['admin'] },
                { id: 'rooms', name: "Room Status", href: `/${hotelSlug}/admin/rooms`, icon: Hotel, roles: ['admin'] },
            ]
        },
        {
            title: "Management",
            items: [
                { id: 'menu', name: "Menu Management", href: `/${hotelSlug}/admin/menu`, icon: Utensils, roles: ['admin'] },
                { id: 'analytics', name: "Analytics", href: `/${hotelSlug}/admin/analytics`, icon: BarChart, roles: ['admin'] },
                { id: 'staff', name: "Staff Management", href: `/${hotelSlug}/admin/staff`, icon: Users, roles: ['admin'] },
                { id: 'branding', name: "System Config", href: `/${hotelSlug}/admin/branding`, icon: Settings, roles: ['admin'] },
            ]
        }
    ];

    const userRole = getRoleFromProfile(profile, isDemoMode);
    const accessibleItems = navSections.flatMap((section) => section.items).filter((item) => item.roles.includes(userRole));

    useEffect(() => {
        if (authLoading || profileLoading || isLoginPage || userRole === 'staff') {
            return;
        }

        const isAllowedPath = accessibleItems.some((item) => pathname === item.href);

        if (!isAllowedPath) {
            router.replace(getRoleHomeRoute(hotelSlug, userRole));
        }
    }, [accessibleItems, authLoading, hotelSlug, isLoginPage, pathname, profileLoading, router, userRole]);

    if (isLoginPage) {
        return <main className="min-h-screen bg-slate-50">{children}</main>;
    }

    if (authLoading || profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
                <Loader2 className="w-8 h-8 text-[#C6A25A] animate-spin" />
            </div>
        );
    }

    if (userRole === 'staff') {
        return (
            <main className="min-h-screen bg-[#F8F8F8] flex items-center justify-center px-6">
                <div className="max-w-lg w-full bg-white rounded-[2rem] border border-slate-200 shadow-sm p-10 text-center">
                    <div className="w-14 h-14 bg-[#0F172A] rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <ShieldAlert className="w-7 h-7 text-[#C6A25A]" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900">Role Access Pending</h1>
                    <p className="mt-3 text-sm font-medium text-slate-500">
                        This account is signed in, but no department has been assigned yet. Ask an admin to set your role as Kitchen, Reception, or Housekeeping.
                    </p>
                </div>
            </main>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF9] text-[#1F1F1F] flex font-sans selection:bg-[#CFA46A]/20">
            {/* 1️⃣ SIDEBAR (The Command Center) */}
            <aside className="w-72 bg-[#1F1F1F] text-white flex flex-col sticky top-0 h-screen z-50 border-r border-white/5 noise shadow-2xl">
                <div className="p-8">
                    <div className="flex items-center space-x-3 mb-10">
                        <div className="w-10 h-10 bg-[#CFA46A] rounded-xl flex items-center justify-center shadow-lg shadow-[#CFA46A]/20">
                            <ShieldAlert className="w-6 h-6 text-[#1F1F1F]" />
                        </div>
                        <div>
                            <p className="font-serif font-black text-white text-lg tracking-tight leading-none">MangoH</p>
                            <p className="text-[10px] font-black text-[#CFA46A] uppercase tracking-[0.3em] mt-1">Control</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8 h-[calc(100vh-320px)]">
                        {navSections.map((section, sIdx) => {
                            const filteredItems = section.items.filter(item => item.roles.includes(userRole));
                            if (filteredItems.length === 0) return null;
                            
                            return (
                                <section key={sIdx}>
                                    <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">{section.title}</p>
                                    <nav className="space-y-1">
                                        {filteredItems.map((item) => {
                                            const isActive = pathname === item.href;
                                            return (
                                                <Link
                                                    key={item.id}
                                                    href={item.href}
                                                    className={`w-full flex items-center px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all group ${isActive 
                                                        ? 'bg-[#CFA46A] text-[#1F1F1F] shadow-lg shadow-[#CFA46A]/10' 
                                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                                >
                                                    <item.icon className={`w-4 h-4 mr-3 ${isActive ? 'text-[#1F1F1F]' : 'text-slate-500 group-hover:text-[#CFA46A]'}`} />
                                                    {item.name}
                                                </Link>
                                            );
                                        })}
                                    </nav>
                                </section>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-auto p-8 border-t border-white/5 bg-black/20">
                    <div className="flex flex-col space-y-4">
                        <button
                            onClick={() => router.push(`/${hotelSlug}/guest/dashboard`)}
                            className="w-full flex items-center justify-center px-4 py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-white hover:text-[#1F1F1F] transition-all"
                        >
                            Switch to Guest View
                        </button>
                        
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-[#CFA46A]/30 flex items-center justify-center font-black text-[#CFA46A]">
                                    {profile?.full_name?.[0] || 'A'}
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#CFA46A]">
                                        {profile?.full_name?.split(' ')[0] || "Admin"}
                                    </p>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{userRole}</p>
                                </div>
                            </div>
                            <button
                                onClick={async () => { await router.push(`/${hotelSlug}/admin/login`); }}
                                className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                                title="System Exit"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
            <main className="flex-1 w-full bg-[#FDFBF9] relative min-h-screen">
                {children}
            </main>
        </div>
    );
}
