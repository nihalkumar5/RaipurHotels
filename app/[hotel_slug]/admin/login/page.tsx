"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { signIn, useHotelBranding, getUserProfile } from "@/utils/store";
import { Lock, Mail, Loader2, Hotel, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

function LoginContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const hotelSlug = params?.hotel_slug as string;
    const { branding } = useHotelBranding(hotelSlug);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Use effect to handle error from search params
    useEffect(() => {
        const errorType = searchParams.get('error');
        if (errorType === 'unauthorized') {
            setError("Your account is not linked to this hotel. If you need to register a new property, visit the registration page below.");
        }
    }, [searchParams]);

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!email || !password) {
            setError("Please fill in all fields.");
            return;
        }

        console.log("Login attempt started for:", email);
        setLoading(true);
        setError("");

        try {
            console.log("Calling signIn utility...");
            const { data, error: authError } = await signIn(email, password);

            if (authError) {
                console.error("Auth error returned from Supabase:", authError);
                throw authError;
            }

            if (data.user) {
                console.log("Sign-in successful, user ID:", data.user.id);

                // Fetch profile to determine role-based redirection
                const { data: profile } = await getUserProfile(data.user.id);

                console.log("User profile loaded, role:", profile?.role);

                let redirectPath = `/${hotelSlug}/admin/dashboard`;
                if (profile?.role === 'kitchen') {
                    redirectPath = `/${hotelSlug}/admin/kitchen`;
                } else if (profile?.role === 'housekeeping') {
                    redirectPath = `/${hotelSlug}/admin/housekeeping`;
                }

                console.log("Redirecting to:", redirectPath);
                window.location.href = redirectPath;
            }
        } catch (err: any) {
            console.error("Catch block error during login:", err);
            setError(err.message || "Invalid credentials. Please try again.");
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 p-10 border border-slate-100">
                    <div className="flex flex-col items-center mb-10">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl"
                            style={{ backgroundColor: branding?.primaryColor || "#3b82f6" }}
                        >
                            {branding?.logoImage ? (
                                <img src={branding.logoImage} className="w-full h-full object-cover rounded-2xl" alt="Logo" />
                            ) : (
                                <Hotel className="w-8 h-8 text-white" />
                            )}
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 text-center">{branding?.name || "Hotel Admin"}</h1>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 flex items-center">
                            <ShieldCheck className="w-3 h-3 mr-1" /> Secure Staff Portal
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold mb-8 border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="name@hotel.com"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-900 focus:ring-2 transition-all outline-none focus:ring-blue-100"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-900 focus:ring-2 transition-all outline-none focus:ring-blue-100"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => handleLogin()}
                            disabled={loading}
                            className="w-full py-4 rounded-2xl text-white font-black text-sm shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center cursor-pointer"
                            style={{ backgroundColor: branding?.primaryColor || "#3b82f6" }}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "AUTHENTICATE"}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col items-center mt-8 space-y-4">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                        Authorized Personnel Only
                    </p>
                    <button
                        onClick={() => router.push('/register')}
                        className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline cursor-pointer"
                    >
                        Register a New Property
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginContent />
        </Suspense>
    );
}
