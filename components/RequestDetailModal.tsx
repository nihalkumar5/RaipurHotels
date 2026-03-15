"use client";

import React from "react";
import { X, MapPin, Clock, Info, Utensils, Bell } from "lucide-react";
import { StatusBadge, RequestStatus } from "./StatusBadge";
import { HotelRequest } from "@/utils/store";
import { motion, AnimatePresence } from "framer-motion";

interface RequestDetailModalProps {
    request: HotelRequest | null;
    onClose: () => void;
    onApprove?: (id: string, room: string) => void;
    onReject?: (id: string) => void;
}

export function RequestDetailModal({ request, onClose, onApprove, onReject }: RequestDetailModalProps) {
    if (!request) return null;

    const isRestaurant = request.type.toLowerCase().includes("restaurant") || request.type.toLowerCase().includes("room service");

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100"
                >
                    <div className={`p-6 flex justify-between items-center ${isRestaurant ? 'bg-amber-50' : 'bg-blue-50'}`}>
                        <div className="flex items-center">
                            <div className={`p-3 rounded-2xl mr-4 ${isRestaurant ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                {isRestaurant ? <Utensils className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{isRestaurant ? "Dining Order" : "Service Request"}</h2>
                                <p className="text-sm text-gray-500">#{request.id.split('_').pop()}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200/50 rounded-full transition-colors text-gray-500">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="flex items-start">
                                <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Location</p>
                                    <p className="text-lg font-bold text-gray-900">Room {request.room}</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <Clock className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Requested At</p>
                                    <p className="text-lg font-bold text-gray-900">{request.time}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Status</p>
                            <StatusBadge status={request.status} />
                        </div>

                        <div className={`p-6 rounded-2xl border ${isRestaurant ? 'bg-amber-50/30 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
                            <div className="flex items-center mb-4 text-gray-900 font-bold">
                                <Info className="w-5 h-5 mr-2 text-primary" />
                                {isRestaurant ? "Order Details" : "Notes / Requirements"}
                            </div>
                            <div className="text-gray-700 leading-relaxed text-lg">
                                {request.notes ? (
                                    isRestaurant ? (
                                        <ul className="list-disc list-inside space-y-2">
                                            {request.notes.split(',').map((item, i) => (
                                                <li key={i} className="font-medium capitalize">{item.trim()}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        request.notes
                                    )
                                ) : (
                                    <span className="text-gray-400 italic">No additional details provided.</span>
                                )}
                            </div>
                        </div>

                        {isRestaurant && (
                            <div className="flex items-center justify-between text-sm py-4 border-t border-gray-100">
                                <span className="text-gray-500">Priority Level</span>
                                <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full font-bold">HIGH</span>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
                        <div className="flex gap-3">
                            {onReject && (request.status === "Pending" || request.status === "Assigned") && (
                                <button
                                    onClick={() => {
                                        onReject(request.id);
                                        onClose();
                                    }}
                                    className="px-6 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all border border-red-100 active:scale-95"
                                >
                                    Reject
                                </button>
                            )}
                            
                            {onApprove && request.type === "Late Checkout" && request.status !== "Completed" && request.status !== "Rejected" && (
                                <button
                                    onClick={() => {
                                        onApprove(request.id, request.room);
                                        onClose();
                                    }}
                                    className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100 active:scale-95"
                                >
                                    Approve Extension
                                </button>
                            )}
                        </div>

                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg active:scale-95"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
