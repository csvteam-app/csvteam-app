import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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

    const fetchProfilePromise = useRef(null);
    const mounted = useRef(true);

    // ── Fetch profile with dedup ──
    const fetchProfile = useCallback(async (userId) => {
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
                return data;
            });

        return fetchProfilePromise.current;
    }, []);

    // ── Core: initial session load (runs ONCE at startup) ──
    const initSession = useCallback(async () => {
        try {
            const { data: { session: s } } = await supabase.auth.getSession();
            if (!mounted.current) return;

            if (s?.user) {
                setSession(s);
                const p = await fetchProfile(s.user.id);
                if (mounted.current) setProfile(p);
            }
            // No session = not logged in. That's fine. No retry needed.
        } catch (err) {
            console.error('[Auth] initSession error:', err);
        }
        if (mounted.current) setIsLoading(false);
    }, [fetchProfile]);

    // ── Silent refresh: update session WITHOUT flashing loading state ──
    const silentRefresh = useCallback(async () => {
        try {
            const { data: { session: s } } = await supabase.auth.getSession();
            if (!mounted.current) return;
            if (s?.user) {
                setSession(s);
                // Only refetch profile if user changed
                const p = await fetchProfile(s.user.id);
                if (mounted.current) setProfile(p);
            }
            // If no session on resume, keep existing state. 
            // Only explicit SIGNED_OUT clears.
        } catch (err) {
            console.error('[Auth] silentRefresh error:', err);
        }
    }, [fetchProfile]);

    useEffect(() => {
        mounted.current = true;

        // 1. Initial session — single network call
        initSession();

        // 2. Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, s) => {
                if (!mounted.current) return;

                if (event === 'SIGNED_OUT') {
                    setSession(null);
                    setProfile(null);
                    setIsLoading(false);
                    return;
                }

                if (s?.user) {
                    setSession(s);
                    const p = await fetchProfile(s.user.id);
                    if (mounted.current) setProfile(p);
                }
                if (mounted.current) setIsLoading(false);
            }
        );

        // 3. Silent refresh on resume — NO isLoading flash
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                silentRefresh();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            mounted.current = false;
            subscription.unsubscribe();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [initSession, silentRefresh, fetchProfile]);

    // Sign in with email + password
    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error };

        let profileData = null;
        const { data: directProfile, error: directError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (directError) {
            console.warn('[Auth] Direct profile query failed:', directError.message);
            const { data: rpcProfile, error: rpcError } = await supabase
                .rpc('get_my_profile')
                .single();
            if (rpcError) {
                console.error('[Auth] RPC fallback also failed:', rpcError.message);
            } else {
                profileData = rpcProfile;
            }
        } else {
            profileData = directProfile;
        }

        if (profileData) {
            setProfile(profileData);
        }

        return { data, profile: profileData || null };
    };

    // Sign out — the ONLY way to clear the session
    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            // Force clear even if signOut API fails
            console.error('[Auth] signOut error, force clearing:', err);
            setSession(null);
            setProfile(null);
        }
    };

    // Derived status helpers
    const approvalStatus = profile?.approval_status ?? 'pending';
    const subscriptionStatus = profile?.subscription_status ?? 'inactive';
    const isApproved = approvalStatus === 'approved';

    const isSubscriptionActive = (() => {
        if (subscriptionStatus !== 'active') return false;
        if (profile?.subscription_expires_at) {
            return new Date(profile.subscription_expires_at) > new Date();
        }
        return true;
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
        logout: signOut,
        approvalStatus,
        subscriptionStatus,
        isApproved,
        hasActiveSubscription: isSubscriptionActive,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
