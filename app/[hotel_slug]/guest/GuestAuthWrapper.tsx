"use client";

import { useEffect, useState, Suspense, createContext, useContext } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { verifyBookingPin, useHotelBranding } from "@/utils/store";
import { Key, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GuestContextType {
    roomNumber: string;
    checkoutDate?: string;
    checkoutTime?: string;
    numGuests?: number;
    checkedInAt?: number | null;
    logout: () => void;
}

const GuestContext = createContext<GuestContextType>({ 
    roomNumber: "",
    logout: () => {} 
});

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
    const [numGuests, setNumGuests] = useState<number>(1);
    const [checkedInAt, setCheckedInAt] = useState<number | null>(null);
    
    // Improved PIN state management
    const [pinArray, setPinArray] = useState<string[]>(["", "", "", ""]);
    const pin = pinArray.join("");
    
    const [error, setError] = useState<string>("");
    const [isVerifying, setIsVerifying] = useState(false);

    const syncGuestSession = (roomData: {
        checkout_date?: string | null;
        checkout_time?: string | null;
        num_guests?: number | null;
        checked_in_at?: number | null;
    }) => {
        const nextCheckoutDate = roomData.checkout_date || "";
        const nextCheckoutTime = roomData.checkout_time || "";
        const nextNumGuests = roomData.num_guests || 1;
        const nextCheckedInAt = roomData.checked_in_at ?? null;

        setCheckoutDate(nextCheckoutDate);
        setCheckoutTime(nextCheckoutTime);
        setNumGuests(nextNumGuests);
        setCheckedInAt(nextCheckedInAt);

        if (nextCheckoutDate) {
            localStorage.setItem(`hotel_checkout_date_${hotelSlug}`, nextCheckoutDate);
        } else {
            localStorage.removeItem(`hotel_checkout_date_${hotelSlug}`);
        }

        if (nextCheckoutTime) {
            localStorage.setItem(`hotel_checkout_time_${hotelSlug}`, nextCheckoutTime);
        } else {
            localStorage.removeItem(`hotel_checkout_time_${hotelSlug}`);
        }

        localStorage.setItem(`hotel_num_guests_${hotelSlug}`, nextNumGuests.toString());

        if (nextCheckedInAt) {
            localStorage.setItem(`hotel_checked_in_at_${hotelSlug}`, nextCheckedInAt.toString());
        } else {
            localStorage.removeItem(`hotel_checked_in_at_${hotelSlug}`);
        }
    };

    useEffect(() => {
        const timestamp = new Date().toLocaleTimeString();
        if (brandingLoading || !hotelSlug) return;

        if (!branding?.id) {
            setIsVerified(false);
            return;
        }

        const urlRoom = searchParams?.get("room");
        const urlPin = searchParams?.get("pin");
        const storedRoom = localStorage.getItem(`hotel_room_${hotelSlug}`);
        const storedPin = localStorage.getItem(`hotel_pin_${hotelSlug}`);
        const storedCheckoutDate = localStorage.getItem(`hotel_checkout_date_${hotelSlug}`);
        const storedCheckoutTime = localStorage.getItem(`hotel_checkout_time_${hotelSlug}`);
        const storedNumGuests = localStorage.getItem(`hotel_num_guests_${hotelSlug}`);
        const storedCheckedInAt = localStorage.getItem(`hotel_checked_in_at_${hotelSlug}`);

        const effectiveRoom = urlRoom || storedRoom;
        let effectivePin = urlPin || storedPin;

        if (urlRoom && urlRoom !== storedRoom) {
            effectivePin = urlPin || "";
        }

        if (effectiveRoom) {
            setRoomNumber(effectiveRoom);
            if (storedCheckoutDate) setCheckoutDate(storedCheckoutDate);
            if (storedCheckoutTime) setCheckoutTime(storedCheckoutTime);
            if (storedNumGuests) setNumGuests(parseInt(storedNumGuests));
            if (storedCheckedInAt) setCheckedInAt(parseInt(storedCheckedInAt));

            if (effectivePin) {
                // Pre-fill pin array if auto-verifying or stored
                const pinChars = effectivePin.split("").slice(0, 4);
                const newPinArray = ["", "", "", ""];
                pinChars.forEach((char, i) => newPinArray[i] = char);
                setPinArray(newPinArray);

                setIsVerifying(true);
                verifyBookingPin(branding.id, effectiveRoom, effectivePin).then(res => {
                    if (res.success && res.data) {
                        setIsVerified(true);
                        localStorage.setItem(`hotel_room_${hotelSlug}`, effectiveRoom);
                        localStorage.setItem(`hotel_pin_${hotelSlug}`, effectivePin!);
                        syncGuestSession(res.data);
                    } else {
                        if (res.success === false && effectiveRoom === storedRoom) {
                            localStorage.removeItem(`hotel_room_${hotelSlug}`);
                            localStorage.removeItem(`hotel_pin_${hotelSlug}`);
                        }
                        setIsVerified(false);
                    }
                    setIsVerifying(false);
                }).catch(() => {
                    setIsVerifying(false);
                    setIsVerified(false);
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

        if (!branding?.id || !roomNumber || pin.length < 4) {
            setError("Please enter Room Number and 4-digit PIN.");
            return;
        }

        setIsVerifying(true);
        try {
            const res = await verifyBookingPin(branding.id, roomNumber, pin);

            if (res.success) {
                localStorage.setItem(`hotel_room_${hotelSlug}`, roomNumber);
                localStorage.setItem(`hotel_pin_${hotelSlug}`, pin);
                syncGuestSession(res.data);
                setIsVerified(true);
            } else {
                setError("Invalid details. Please check with reception.");
                setPinArray(["", "", "", ""]);
            }
        } catch (err) {
            setError("Connection error. Please try again.");
        }
        setIsVerifying(false);
    };

    useEffect(() => {
        if (!branding?.id || !hotelSlug || !isVerified || !roomNumber) return;

        const storedPin = localStorage.getItem(`hotel_pin_${hotelSlug}`);
        if (!storedPin) return;

        let cancelled = false;

        const refreshGuestSession = async () => {
            const res = await verifyBookingPin(branding.id, roomNumber, storedPin);

            if (!cancelled && res.success && res.data) {
                syncGuestSession(res.data);
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                void refreshGuestSession();
            }
        };

        void refreshGuestSession();
        const intervalId = window.setInterval(() => {
            void refreshGuestSession();
        }, 30000);

        window.addEventListener("focus", refreshGuestSession);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
            window.removeEventListener("focus", refreshGuestSession);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [branding?.id, hotelSlug, isVerified, roomNumber]);

    if (isVerified === null || brandingLoading) {
        return (
            <div className="fixed inset-0 min-h-screen w-full flex items-center justify-center bg-[#050505] z-[9999]">
                <div 
                    className="absolute inset-0 w-full h-full opacity-30"
                    style={{ 
                        backgroundImage: `url('/images/hotel-bg.png')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-[#CFA46A] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Loading Portal</p>
                </div>
            </div>
        );
    }

    if (!isVerified) {
        return (
            <div className="fixed inset-0 min-h-screen w-full flex items-center justify-center p-6 z-[2000] overflow-y-auto bg-black">
                {/* 2. Background Layer (Real Hotel Photography) */}
                <div 
                    className="absolute inset-0 w-full h-full -z-10 scale-105"
                    style={{ 
                        backgroundImage: `url('/images/hotel-bg.png')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(3px) brightness(0.8)'
                    }}
                />
                
                {/* 3. Luxury Overlay (Cinematic Feel) */}
                <div 
                    className="absolute inset-0 -z-10"
                    style={{ 
                        background: 'linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.65))'
                    }}
                />

                {/* 4. Center Glass Card (Refined) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        y: [30, 0],
                    }}
                    whileInView={{
                        y: [0, -4, 0], // Subtle floating animation
                        transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                    }}
                    transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                    className="w-full max-w-[420px] backdrop-blur-[22px] bg-white/[0.08] border border-white/15 p-[36px] rounded-[28px] shadow-[0_25px_60px_rgba(0,0,0,0.45),0_0_40px_rgba(255,200,120,0.15)] flex flex-col items-center text-center text-white relative overflow-hidden"
                >
                    {/* Glossy highlight effect */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

                    {/* 5. Icon Section (Keycard Icon) */}
                    <div className="w-[70px] height-[70px] bg-white/10 rounded-[20px] flex items-center justify-center mb-8 border border-white/10 shadow-inner relative group" style={{ height: '70px' }}>
                        <div className="absolute inset-0 bg-[#D4A373]/20 blur-xl rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                        <Key className="w-8 h-8 text-[#D4A373] relative z-10 -rotate-12" />
                    </div>

                    {/* 6. Typography (Playfair Display) */}
                    <h1 className="text-[32px] font-bold tracking-tight mb-2 font-serif text-white">{branding?.name || "The Grand Royale"}</h1>
                    <p className="text-[12px] font-black uppercase tracking-[3px] opacity-80 mb-10">Guest Access</p>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full bg-red-500/15 text-red-100 p-4 rounded-2xl text-[11px] font-bold mb-8 border border-red-500/20 backdrop-blur-xl"
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Form Section */}
                    <form onSubmit={handleVerify} className="w-full space-y-8 relative z-10">
                        {/* 7. Room Input */}
                        <div className="text-left">
                            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-3 ml-2">Room Number</label>
                            <input
                                type="text"
                                value={roomNumber}
                                onChange={(e) => setRoomNumber(e.target.value)}
                                className="w-full h-[54px] bg-white/10 border border-white/2 rounded-[16px] px-4 focus:outline-none focus:border-white/40 focus:bg-white/[0.15] font-bold text-lg text-white transition-all placeholder:text-white/10"
                                readOnly={!!searchParams?.get("room")}
                                placeholder="e.g. 101"
                            />
                        </div>

                        {/* 8. PIN Input */}
                        <div className="text-left">
                            <label className="block text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-3 ml-2">Secure PIN</label>
                            <div className="flex justify-between gap-[12px]">
                                {[0, 1, 2, 3].map((i) => (
                                    <input
                                        key={i}
                                        id={`pin-${i}`}
                                        type="password"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={1}
                                        value={pinArray[i]}
                                        onChange={(e) => {
                                            const val = e.target.value.slice(-1).replace(/[^0-9]/g, "");
                                            if (val) {
                                                const newArray = [...pinArray];
                                                newArray[i] = val;
                                                setPinArray(newArray);
                                                if (i < 3) {
                                                    document.getElementById(`pin-${i + 1}`)?.focus();
                                                }
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Backspace") {
                                                if (pinArray[i]) {
                                                    const newArray = [...pinArray];
                                                    newArray[i] = "";
                                                    setPinArray(newArray);
                                                } else if (i > 0) {
                                                    const newArray = [...pinArray];
                                                    newArray[i-1] = "";
                                                    setPinArray(newArray);
                                                    document.getElementById(`pin-${i - 1}`)?.focus();
                                                }
                                            }
                                        }}
                                        className="w-[56px] h-[56px] bg-white/10 border border-white/[0.25] rounded-[16px] text-center font-black text-2xl text-white transition-all focus:outline-none focus:border-[#D4A373]/50 focus:bg-white/[0.15] focus:scale-[1.08] focus:shadow-[0_0_20px_rgba(212,163,115,0.3)]"
                                        autoComplete="off"
                                    />
                                ))}
                            </div>
                        </div>

                        {/* 9. Button (Luxury Gold Gradient) */}
                        <button
                            type="submit"
                            disabled={isVerifying || pin.length < 4}
                            className="w-full h-[56px] rounded-[18px] text-white font-semibold text-sm uppercase tracking-[0.2em] transition-all active:scale-[0.98] shadow-2xl shadow-[#D4A373]/20 disabled:opacity-20 mt-4 flex items-center justify-center overflow-hidden relative group"
                            style={{ 
                                background: 'linear-gradient(to bottom, #D4A373, #B88952)',
                             }}
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                            {isVerifying ? (
                                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                "Access Portal"
                            )}
                        </button>
                    </form>

                    {/* 10. Bottom Trust Line */}
                    <div className="mt-12 space-y-2">
                        <p className="text-[12px] font-bold text-white uppercase tracking-[0.1em] opacity-80">Verified Guest Identity</p>
                        <p className="text-[10px] font-medium opacity-50 uppercase tracking-[0.05em]">Secure hotel access</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    const logout = () => {
        localStorage.removeItem(`hotel_room_${hotelSlug}`);
        localStorage.removeItem(`hotel_pin_${hotelSlug}`);
        localStorage.removeItem(`hotel_checkout_date_${hotelSlug}`);
        localStorage.removeItem(`hotel_checkout_time_${hotelSlug}`);
        localStorage.removeItem(`hotel_num_guests_${hotelSlug}`);
        localStorage.removeItem(`hotel_checked_in_at_${hotelSlug}`);
        setIsVerified(false);
        setRoomNumber("");
        setPinArray(["", "", "", ""]);
    };

    return (
        <GuestContext.Provider value={{ roomNumber, checkoutDate, checkoutTime, numGuests, checkedInAt, logout }}>
            {children}
        </GuestContext.Provider>
    );
}

export function GuestAuthWrapper({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={
            <div className="fixed inset-0 min-h-screen w-full flex items-center justify-center bg-[#050505] z-[9999]">
                <div className="w-16 h-16 border-4 border-[#CFA46A] border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <AuthLogic>{children}</AuthLogic>
        </Suspense>
    );
}
