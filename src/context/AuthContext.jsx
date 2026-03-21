import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // We retain the promise cache just in case StrictMode double-invokes the effect
    const fetchProfilePromise = useRef(null);

    const fetchProfile = async (userId) => {
        if (fetchProfilePromise.current) return fetchProfilePromise.current;

        fetchProfilePromise.current = supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()
            .then(({ data, error }) => {
                fetchProfilePromise.current = null;
                if (error) {
                    console.error('[Auth] Profile fetch error:', error.message);
                    return null;
                }
                console.log('[Auth] Profile fetched:', { id: data?.id, role: data?.role, email: data?.email, approval_status: data?.approval_status });
                return data;
            });

        return fetchProfilePromise.current;
    };

    useEffect(() => {
        let mounted = true;

        const initializeSession = async () => {
            const { data: { session: s }, error } = await supabase.auth.getSession();
            if (!mounted) return;

            setSession(s);
            if (s?.user) {
                const p = await fetchProfile(s.user.id);
                if (mounted) {
                    setProfile(p);
                    setIsLoading(false);
                }
            } else {
                if (mounted) {
                    setProfile(null);
                    setIsLoading(false);
                }
            }
        };

        initializeSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, s) => {
                if (!mounted) return;

                // Solo aggiorna se cambia. Evita flickering se il session è lo stesso
                setSession(s);

                if (s?.user) {
                    // Cache promise evita re-fetch doppi simultanei
                    const p = await fetchProfile(s.user.id);
                    if (mounted) setProfile(p);
                } else {
                    if (mounted) setProfile(null);
                }

                if (mounted) setIsLoading(false);
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // Sign in with email + password
    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error };

        // The onAuthStateChange listener will fetch the profile, but AdminLogin
        // needs it synchronously in the return value to check the role.
        // Poll until the profile state is set (max ~3s).
        let loadedProfile = null;
        for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 100));
            // Read the latest profile from the ref-like closure — we need to
            // directly fetch it since React state won't be visible here yet.
            if (i === 0) {
                // Kick off a direct fetch as well, in case the listener is slow
                loadedProfile = await fetchProfile(data.user.id);
                if (loadedProfile) break;
            }
        }

        console.log('[Auth] signIn result:', { userId: data?.user?.id, profileRole: loadedProfile?.role, profileEmail: loadedProfile?.email });
        return { data, profile: loadedProfile };
    };

    // Sign out
    const signOut = async () => {
        // Supabase signout will trigger the SIGNED_OUT event,
        // which clears the profile via the listener.
        await supabase.auth.signOut();
    };

    // Derived status helpers — used by route guards
    const approvalStatus = profile?.approval_status ?? 'pending';
    const subscriptionStatus = profile?.subscription_status ?? 'inactive';
    const isApproved = approvalStatus === 'approved';

    const isSubscriptionActive = (() => {
        if (subscriptionStatus !== 'active') return false;
        if (profile?.subscription_expires_at) {
            return new Date(profile.subscription_expires_at) > new Date();
        }
        return true; // active with no expiry → lifetime / manual
    })();

    const value = {
        session,
        user: session?.user ?? null,
        profile,
        role: profile?.role ?? null,
        isAuthenticated: !!session?.user,
        isLoading,
        signIn,
        signOut,
        logout: signOut,              // alias used by status pages
        approvalStatus,
        subscriptionStatus,
        isApproved,
        hasActiveSubscription: isSubscriptionActive,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
