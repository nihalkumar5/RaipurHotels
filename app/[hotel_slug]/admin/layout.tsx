"use client";

import Link from "next/link";
import { LayoutDashboard, Inbox, Hotel, Utensils, Settings, Users, BarChart, Receipt, Shirt, ConciergeBell, ShieldAlert, Loader2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useAuth, getUserProfile, UserProfile } from "@/utils/store";
import { motion, AnimatePresence } from "framer-motion";

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

    const navItems = [
        { id: 'dashboard', name: "Main Dashboard", href: `/${hotelSlug}/admin/dashboard`, icon: <LayoutDashboard className="w-5 h-5" />, roles: ['admin'] },
        { id: 'kitchen', name: "Kitchen Board", href: `/${hotelSlug}/admin/kitchen`, icon: <Utensils className="w-5 h-5" />, roles: ['admin', 'kitchen'] },
        { id: 'housekeeping', name: "Housekeeping", href: `/${hotelSlug}/admin/housekeeping`, icon: <Shirt className="w-5 h-5" />, roles: ['admin', 'housekeeping'] },
        { id: 'reception', name: "Reception Board", href: `/${hotelSlug}/admin/reception`, icon: <ConciergeBell className="w-5 h-5" />, roles: ['admin', 'reception'] },
        { id: 'requests', name: "All Requests", href: `/${hotelSlug}/admin/requests`, icon: <Inbox className="w-5 h-5" />, roles: ['admin', 'reception'] },
        { id: 'checkout', name: "Billing & Checkout", href: `/${hotelSlug}/admin/checkout`, icon: <Receipt className="w-5 h-5" />, roles: ['admin', 'reception'] },
        { id: 'rooms', name: "Rooms & QR", href: `/${hotelSlug}/admin/rooms`, icon: <Hotel className="w-5 h-5" />, roles: ['admin', 'reception'] },
        { id: 'menu', name: "Menu Management", href: `/${hotelSlug}/admin/menu`, icon: <Utensils className="w-5 h-5" />, roles: ['admin', 'kitchen'] },
        { id: 'analytics', name: "Data Analytics", href: `/${hotelSlug}/admin/analytics`, icon: <BarChart className="w-5 h-5" />, roles: ['admin'] },
        { id: 'staff', name: "Staff Management", href: `/${hotelSlug}/admin/staff`, icon: <Users className="w-5 h-5" />, roles: ['admin'] },
        { id: 'branding', name: "Hotel Branding", href: `/${hotelSlug}/admin/branding`, icon: <Settings className="w-5 h-5" />, roles: ['admin'] },
    ];

    // Filtered nav items based on role
    const userRole = profile?.role || (process.env.NEXT_PUBLIC_FORCE_DEMO === 'true' ? 'admin' : 'staff');
    const filteredNavItems = navItems.filter(item => item.roles.includes(userRole));

    // Check if current path is allowed
    const isPathAllowed = () => {
        if (userRole === 'admin') return true;
        const currentItem = navItems.find(item => pathname === item.href);
        if (!currentItem) return true; // Internal or unknown routes
        return currentItem.roles.includes(userRole);
    };

    if (isLoginPage) {
        return <main className="min-h-screen bg-slate-50">{children}</main>;
    }

    if (authLoading || profileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!isPathAllowed()) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl border border-red-50 text-center">
                    <div className="w-20 h-20 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 mb-2">Access Restricted</h1>
                    <p className="text-slate-500 font-medium mb-8">You do not have permission to access this department. Please return to your assigned dashboard.</p>
                    <button
                        onClick={() => router.back()}
                        className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold transition-transform active:scale-95"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 flex">
            <aside className="w-72 bg-white border-r hidden md:flex flex-col h-screen sticky top-0 shadow-sm transition-all duration-300">
                <div className="p-8 border-b">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter">
                        Hotel <span className="text-blue-600">Admin</span>
                    </h1>
                    <div className="flex items-center mt-2 px-3 py-1 bg-slate-100 rounded-full w-fit">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{userRole}</span>
                    </div>
                </div>

                <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
                    {filteredNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 group ${isActive
                                    ? 'bg-blue-50 text-blue-600 shadow-sm shadow-blue-100'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <div className={`mr-3.5 transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-900'}`}>
                                    {isActive ? React.cloneElement(item.icon, { className: "w-5 h-5" }) : item.icon}
                                </div>
                                {item.name}
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t bg-slate-50/50">
                    <button
                        onClick={() => router.push(`/${hotelSlug}/guest/dashboard`)}
                        className="w-full flex items-center justify-center px-4 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-[0.98]"
                    >
                        Switch to Guest View
                    </button>
                </div>
            </aside>
            <main className="flex-1 overflow-x-hidden w-full bg-slate-50/30">
                {children}
            </main>
        </div>
    );
}
