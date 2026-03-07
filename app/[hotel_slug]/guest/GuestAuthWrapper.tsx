"use client";

import { useEffect, useState, Suspense, createContext, useContext } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { verifyBookingPin, useHotelBranding } from "@/utils/store";
import { Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GuestContextType {
    roomNumber: string;
    checkoutDate?: string;
    checkoutTime?: string;
}

const GuestContext = createContext<GuestContextType>({ roomNumber: "" });

export const useGuestRoom = () => useContext(GuestContext);


function AuthLogic({ children }: { children: React.ReactNode }) {
    const searchParams = useSearchParams();
    const params = useParams();
    const hotelSlug = params?.hotel_slug as string;
    const { branding, loading: brandingLoading } = useHotelBranding(hotelSlug);

    const [isVerified, setIsVerified] = useState<boolean | null>(null);
    const [roomNumber, setRoomNumber] = useState<string>("");
    const [checkoutDate, setCheckoutDate] = useState<string>("");
    const [checkoutTime, setCheckoutTime] = useState<string>("");
    const [pin, setPin] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        if (!branding?.id || brandingLoading) return;

        const urlRoom = searchParams?.get("room");
        const urlPin = searchParams?.get("pin");
        const storedRoom = localStorage.getItem(`hotel_room_${hotelSlug}`);
        const storedPin = localStorage.getItem(`hotel_pin_${hotelSlug}`);
        const storedCheckoutDate = localStorage.getItem(`hotel_checkout_date_${hotelSlug}`);
        const storedCheckoutTime = localStorage.getItem(`hotel_checkout_time_${hotelSlug}`);

        // 1. Determine which room we are dealing with. URL always wins.
        const effectiveRoom = urlRoom || storedRoom;

        // 2. If room changed (URL room != stored room), we must re-verify PIN
        // unless the URL itself contains a valid PIN (re-enabled for scanning ease)
        let effectivePin = storedPin;
        if (urlRoom && urlRoom !== storedRoom) {
            effectivePin = urlPin || ""; // Reset PIN if room changed and no new PIN in URL
        } else if (!urlRoom && storedRoom) {
            effectivePin = storedPin;
        }

        if (effectiveRoom) {
            setRoomNumber(effectiveRoom);

            if (effectivePin) {
                setPin(effectivePin);
                setIsVerifying(true);
                verifyBookingPin(branding.id, effectiveRoom, effectivePin).then(res => {
                    if (res.success) {
                        setIsVerified(true);
                        setCheckoutDate(res.data.checkout_date || "");
                        setCheckoutTime(res.data.checkout_time || "");
                        localStorage.setItem(`hotel_room_${hotelSlug}`, effectiveRoom);
                        localStorage.setItem(`hotel_pin_${hotelSlug}`, effectivePin);
                        if (res.data.checkout_date) localStorage.setItem(`hotel_checkout_date_${hotelSlug}`, res.data.checkout_date);
                        if (res.data.checkout_time) localStorage.setItem(`hotel_checkout_time_${hotelSlug}`, res.data.checkout_time);
                    } else {
                        // Cleanup if stored session is invalid
                        if (effectiveRoom === storedRoom) {
                            localStorage.removeItem(`hotel_room_${hotelSlug}`);
                            localStorage.removeItem(`hotel_pin_${hotelSlug}`);
                            localStorage.removeItem(`hotel_checkout_date_${hotelSlug}`);
                            localStorage.removeItem(`hotel_checkout_time_${hotelSlug}`);
                        }
                        setIsVerified(false);
                    }
                    setIsVerifying(false);
                });
            } else {
                setIsVerified(false);
            }
        } else {
            setIsVerified(false);
        }
    }, [branding?.id, hotelSlug, searchParams, brandingLoading]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!branding?.id || !roomNumber || !pin) {
            setError("Please enter both Room Number and PIN.");
            return;
        }

        setIsVerifying(true);
        const res = await verifyBookingPin(branding.id, roomNumber, pin);

        if (res.success) {
            localStorage.setItem(`hotel_room_${hotelSlug}`, roomNumber);
            localStorage.setItem(`hotel_pin_${hotelSlug}`, pin);
            if (res.data.checkout_date) localStorage.setItem(`hotel_checkout_date_${hotelSlug}`, res.data.checkout_date);
            if (res.data.checkout_time) localStorage.setItem(`hotel_checkout_time_${hotelSlug}`, res.data.checkout_time);

            setCheckoutDate(res.data.checkout_date || "");
            setCheckoutTime(res.data.checkout_time || "");
            setIsVerified(true);
        } else {
            setError("Invalid Room Number or PIN. Please check with reception.");
            setPin("");
        }
        setIsVerifying(false);
    };

    if (isVerified === null || brandingLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div
                    className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"
                    style={{
                        borderLeftColor: branding?.primaryColor,
                        borderRightColor: branding?.primaryColor,
                        borderBottomColor: branding?.primaryColor,
                        borderTopColor: 'transparent'
                    }}
                ></div>
            </div>
        );
    }

    if (!isVerified) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
                <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-from),_transparent_50%)] from-blue-50/50 to-transparent"></div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100"
                >
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600" style={{ backgroundColor: branding?.primaryColor ? `${branding.primaryColor}20` : undefined, color: branding?.primaryColor }}>
                        <Key className="w-8 h-8" />
                    </div>

                    <h1 className="text-3xl font-black text-slate-900 mb-2">Welcome</h1>
                    <p className="text-slate-500 font-medium mb-8">Please enter your room details to access the digital compendium and ordering system.</p>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold mb-6 border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleVerify} className="space-y-5">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Room Number</label>
                            <input
                                type="text"
                                value={roomNumber}
                                onChange={(e) => setRoomNumber(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-500 font-bold text-lg text-slate-900 transition-colors"
                                readOnly={!!searchParams?.get("room")}
                                placeholder="E.g. 101"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Booking PIN</label>
                            <input
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-500 font-black text-2xl tracking-[0.5em] text-center text-slate-900 transition-colors placeholder:text-slate-300 placeholder:tracking-normal placeholder:font-medium placeholder:text-lg"
                                placeholder="4-digit PIN"
                                maxLength={6}
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isVerifying}
                            className="w-full mt-4 py-4 rounded-2xl text-white font-black text-lg disabled:opacity-50 flex justify-center items-center group overflow-hidden transition-all shadow-lg active:scale-95"
                            style={{ backgroundColor: branding?.primaryColor || '#2563eb' }}
                        >
                            {isVerifying ? (
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                "Unlock Menu"
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <GuestContext.Provider value={{ roomNumber, checkoutDate, checkoutTime }}>
            {children}
        </GuestContext.Provider>
    );
}

export function GuestAuthWrapper({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-12 h-12 border-4 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <AuthLogic>{children}</AuthLogic>
        </Suspense>
    );
}
