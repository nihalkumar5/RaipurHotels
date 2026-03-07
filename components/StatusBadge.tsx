import React from "react";
import { CheckCircle2, Clock, Loader2, PlayCircle } from "lucide-react";

export type RequestStatus = "Pending" | "Assigned" | "In Progress" | "Completed";

export function StatusBadge({ status }: { status: RequestStatus }) {
    const statusConfig = {
        Pending: { color: "bg-amber-100/50 text-amber-600 border-amber-200", icon: <Clock className="w-3.5 h-3.5 mr-1.5" /> },
        Assigned: { color: "bg-blue-100/50 text-blue-600 border-blue-200", icon: <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> },
        "In Progress": { color: "bg-[#E31837]/10 text-[#E31837] border-red-200", icon: <PlayCircle className="w-3.5 h-3.5 mr-1.5" /> },
        Completed: { color: "bg-emerald-100/50 text-emerald-600 border-emerald-200", icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> },
    };

    const config = statusConfig[status];

    return (
        <span className={`inline-flex items-center px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-tight border ${config.color} shadow-sm transition-all duration-300 backdrop-blur-sm`}>
            {config.icon}
            {status}
        </span>
    );
}
