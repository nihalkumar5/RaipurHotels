import { useEffect, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

import { isDemoMode, isMissingTableError } from "@/lib/hotel/helpers";
import type { UserProfile } from "@/lib/hotel/types";
import { supabase } from "@/lib/supabaseClient";

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isActive = true;

        const loadSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!isActive) {
                return;
            }

            setUser(session?.user ?? null);
            setLoading(false);
        };

        void loadSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            if (!isActive) {
                return;
            }

            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            isActive = false;
            subscription.unsubscribe();
        };
    }, []);

    return { user, loading };
}

export function useProfile(userId?: string) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isActive = true;

        const loadProfile = async () => {
            if (!userId) {
                if (isActive) {
                    setLoading(false);
                }
                return;
            }

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", userId)
                .single();

            if (!isActive) {
                return;
            }

            if (!error) {
                setProfile(data as UserProfile);
            }

            setLoading(false);
        };

        void loadProfile();

        return () => {
            isActive = false;
        };
    }, [userId]);

    return { profile, loading };
}

export const getUserProfile = async (userId: string, hotelId?: string): Promise<{ data: UserProfile | null; error: unknown }> => {
    try {
        let query = supabase.from("profiles").select("*").eq("user_id", userId);

        if (hotelId) {
            query = query.eq("hotel_id", hotelId);
        }

        const { data, error } = await query.maybeSingle();
        return { data: (data as UserProfile | null) ?? null, error };
    } catch (error) {
        return { data: null, error };
    }
};

export const getAllHotelStaff = async (hotelId: string): Promise<{ data: UserProfile[] | null; error: unknown }> => {
    try {
        const { data, error } = await supabase.from("profiles").select("*").eq("hotel_id", hotelId);
        return { data: (data as UserProfile[] | null) ?? null, error };
    } catch (error) {
        return { data: null, error };
    }
};

export const updateStaffRole = async (
    profileId: string,
    role: string,
): Promise<{ error: unknown }> => {
    if (isDemoMode()) {
        return {
            error: {
                message: "Application is in Demo Mode. To update staff roles, connect your Supabase database in .env.local.",
                code: "DEMO_MODE",
            },
        };
    }

    try {
        const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId);
        return { error };
    } catch (error) {
        return { error };
    }
};

export const signIn = async (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

export const resetPasswordForEmail = async (email: string, redirectTo: string) =>
    supabase.auth.resetPasswordForEmail(email, { redirectTo });

export const updatePassword = async (password: string) =>
    supabase.auth.updateUser({ password });

export const signOut = async () => supabase.auth.signOut();

export const canUseProfilesTable = (error: unknown) => !isMissingTableError(error);
