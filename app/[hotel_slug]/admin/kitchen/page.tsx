"use client";

import { useParams } from "next/navigation";
import { StaffDashboard } from "@/components/StaffDashboard";
import { Utensils } from "lucide-react";

export default function KitchenDashboard() {
    const params = useParams();
    const hotelSlug = params?.hotel_slug as string;

    return (
        <StaffDashboard
            hotelSlug={hotelSlug}
            department="kitchen"
            title="Kitchen Board"
            icon={<Utensils className="w-8 h-8 text-amber-500" />}
        />
    );
}
