"use client";

import React, { useState } from "react";
import { ArrowLeft, Copy, CheckCircle2, Wifi, Compass } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useHotelBranding } from "@/utils/store";
import { motion } from "framer-motion";

export default function WifiPage() {
    const router = useRouter();
    const params = useParams();
    const hotelSlug = params?.hotel_slug as string;
    const { branding } = useHotelBranding(hotelSlug);

    const [copied, setCopied] = useState(false);

    const wifiNetwork = branding?.wifiName || (branding?.name ? `${branding.name.replace(/\s+/g, '')}_Guest` : "Hotel_Guest");
    const wifiPassword = branding?.wifiPassword || "RelaxAndUnwind";

    const handleCopy = () => {
        if (!wifiPassword) return;
        navigator.clipboard.writeText(wifiPassword);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="pb-40 px-5 pt-10 min-h-screen bg-slate-50/50 text-slate-900 max-w-[520px] mx-auto">
            <button onClick={() => router.back()} className="mb-10 flex items-center text-slate-400 hover:text-slate-600 font-bold transition-all group">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3 shadow-sm group-hover:shadow-md transition-all border border-slate-100">
                    <ArrowLeft className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Back to Dashboard</span>
            </button>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-[1px] bg-amber-500/50"></div>
                    <p className="text-amber-600 font-black uppercase tracking-[0.25em] text-[10px]">Digital Concierge</p>
                </div>
                <h1 className="text-4xl font-serif text-slate-900 leading-tight tracking-tight italic">Digital<br />Connectivity</h1>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative overflow-hidden bg-white rounded-[2.5rem] p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)] border border-slate-100 mb-8"
            >
                {/* Decorative Pattern Background */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12 pointer-events-none">
                    <Wifi className="w-40 h-40 text-slate-900" />
                </div>

                <div className="flex items-center mb-10 relative z-10">
                    <div className="w-14 h-14 bg-slate-900 rounded-2xl mr-5 flex items-center justify-center shadow-lg border border-slate-800">
                        <Wifi className="w-7 h-7 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Network Access</p>
                        <p className="text-2xl font-serif text-slate-900 tracking-tight">{wifiNetwork}</p>
                    </div>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Security Key</p>
                        {copied && (
                            <motion.span
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-[9px] font-black uppercase tracking-widest text-emerald-500 flex items-center"
                            >
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Copied to Clip
                            </motion.span>
                        )}
                    </div>

                    <div className="flex items-center justify-between bg-slate-50 p-5 rounded-[2rem] border border-slate-100 group hover:border-amber-200 transition-colors duration-500">
                        <span className="font-sans font-black italic text-xl tracking-tight text-slate-900 overflow-hidden text-ellipsis mr-4 select-all">
                            {wifiPassword}
                        </span>
                        <button
                            onClick={handleCopy}
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-sm relative overflow-hidden group ${copied ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-slate-900 text-white shadow-slate-200'}`}
                        >
                            <span className="relative z-10">
                                {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5 text-amber-500" />}
                            </span>
                            {!copied && (
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-amber-50/50 backdrop-blur-sm p-6 rounded-[2rem] border border-amber-100/50 shadow-sm relative overflow-hidden"
            >
                {/* Accent line */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/20" />

                <div className="relative z-10">
                    <div className="flex items-center mb-3">
                        <Compass className="w-3 h-3 text-amber-600 mr-2" />
                        <p className="font-black uppercase tracking-widest text-amber-600/60 text-[9px]">Connectivity Protocol</p>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-500 font-medium italic">
                        Connect to the network and when prompted, click <span className="text-slate-900 font-black">"Accept Terms"</span> via the portal. If you experience issues, please contact Reception by dialing <span className="text-amber-700 font-black">0</span> from your landline.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
