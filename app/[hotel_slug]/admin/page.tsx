"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth, getUserProfile } from "@/utils/store";
import { getRoleHomeRoute, getRoleFromProfile } from "@/lib/hotel/operations";

export default function AdminPage() {
    const router = useRouter();
    const params = useParams();
    const hotelSlug = params?.hotel_slug as string;
    const { user, loading } = useAuth();

    useEffect(() => {
        if (loading) {
            return;
        }

        if (!user) {
            if (process.env.NEXT_PUBLIC_FORCE_DEMO === "true") {
                router.replace(`/${hotelSlug}/admin/dashboard`);
            } else {
                router.replace(`/${hotelSlug}/admin/login`);
            }
            return;
        }

        const resolveRoute = async () => {
            const { data } = await getUserProfile(user.id);
            const nextRole = getRoleFromProfile(data, process.env.NEXT_PUBLIC_FORCE_DEMO === "true");
            router.replace(getRoleHomeRoute(hotelSlug, nextRole));
        };

        void resolveRoute();
    }, [hotelSlug, loading, router, user]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
    );
}
