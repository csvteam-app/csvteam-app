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

        // Try direct query first
        let profileData = null;
        const { data: directProfile, error: directError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (directError) {
            console.warn('[Auth] Direct profile query failed:', directError.message);
            // Fallback: use SECURITY DEFINER RPC (bypasses RLS)
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
            console.log('[Auth] signIn profile:', { id: profileData.id, role: profileData.role, email: profileData.email });
            setProfile(profileData);
        } else {
            console.error('[Auth] Could not load profile for user:', data.user.id);
        }

        return { data, profile: profileData || null };
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
