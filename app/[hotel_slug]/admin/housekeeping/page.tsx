"use client";

import { useParams } from "next/navigation";
import { StaffDashboard } from "@/components/StaffDashboard";
import { Shirt } from "lucide-react";

export default function HousekeepingDashboard() {
    const params = useParams();
    const hotelSlug = params?.hotel_slug as string;

    return (
        <StaffDashboard
            hotelSlug={hotelSlug}
            department="housekeeping"
            title="Housekeeping"
            icon={<Shirt className="w-8 h-8 text-purple-500" />}
        />
    );
}
