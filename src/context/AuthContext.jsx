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

    // ── Core: sync session + profile from whatever Supabase gives us ──
    const syncSession = useCallback(async () => {
        try {
            const { data: { session: s } } = await supabase.auth.getSession();

            if (!mounted.current) return;

            if (s?.user) {
                setSession(s);
                const p = await fetchProfile(s.user.id);
                if (mounted.current) {
                    setProfile(p);
                    setIsLoading(false);
                }
            } else {
                // No valid session — but DON'T clear profile if we had one.
                // Only clear on explicit SIGNED_OUT event (manual logout).
                // This prevents the "half logged in" state where profile shows
                // but session is null due to a transient token refresh failure.
                
                // Try to refresh the session before giving up
                const { data: { session: refreshed } } = await supabase.auth.refreshSession();
                if (mounted.current) {
                    if (refreshed?.user) {
                        setSession(refreshed);
                        const p = await fetchProfile(refreshed.user.id);
                        if (mounted.current) setProfile(p);
                    }
                    // If refresh also fails, keep whatever state we have.
                    // Only signOut() clears everything.
                    setIsLoading(false);
                }
            }
        } catch (err) {
            console.error('[Auth] syncSession error:', err);
            if (mounted.current) setIsLoading(false);
        }
    }, [fetchProfile]);

    useEffect(() => {
        mounted.current = true;

        // 1. Initial session sync
        syncSession();

        // 2. Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, s) => {
                if (!mounted.current) return;

                console.log('[Auth] event:', event);

                if (event === 'SIGNED_OUT') {
                    // ONLY clear on explicit sign out
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

        // 3. Re-validate session when app comes back to foreground (iOS!)
        //    This handles: tab switch, app resume from background, screen wake
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('[Auth] App resumed — re-syncing session');
                syncSession();
            }
        };

        // Also handle iOS-specific events
        const handleAppResume = () => {
            console.log('[Auth] App focus — re-syncing session');
            syncSession();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleAppResume);

        return () => {
            mounted.current = false;
            subscription.unsubscribe();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleAppResume);
        };
    }, [syncSession, fetchProfile]);

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
