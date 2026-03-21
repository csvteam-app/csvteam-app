import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for admin subscription management.
 * Provides CRUD for subscriptions + user approval.
 */
export function useAdminSubscriptions() {
    const [users, setUsers] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    /* ── Fetch all users with their subscription data ── */
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error: err } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (err) throw err;
            setUsers(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    /* ── Fetch all subscriptions ── */
    const fetchSubscriptions = useCallback(async () => {
        try {
            const { data, error: err } = await supabase
                .from('subscriptions')
                .select('*')
                .order('created_at', { ascending: false });

            if (err) throw err;
            setSubscriptions(data || []);
        } catch (err) {
            console.error('[AdminSubs] fetch error:', err.message);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
        fetchSubscriptions();
    }, [fetchUsers, fetchSubscriptions]);

    /* ── Approve User ── */
    const approveUser = async (userId) => {
        const { error: err } = await supabase
            .from('profiles')
            .update({ approval_status: 'approved', updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (err) throw err;
        await fetchUsers();
    };

    /* ── Reject User ── */
    const rejectUser = async (userId) => {
        const { error: err } = await supabase
            .from('profiles')
            .update({ approval_status: 'rejected', updated_at: new Date().toISOString() })
            .eq('id', userId);

        if (err) throw err;
        await fetchUsers();
    };

    /* ── Assign Subscription ── */
    const assignSubscription = async (userId, { packageType, durationMonths, startDate, notes }) => {
        const start = startDate || new Date().toISOString().split('T')[0];
        const endDate = new Date(start);
        endDate.setMonth(endDate.getMonth() + durationMonths);
        const end = endDate.toISOString().split('T')[0];

        const { data: session } = await supabase.auth.getSession();
        const adminId = session?.session?.user?.id;

        const { error: err } = await supabase
            .from('subscriptions')
            .insert({
                user_id: userId,
                package_type: packageType,
                duration_months: durationMonths,
                start_date: start,
                end_date: end,
                status: 'active',
                source: 'manual_admin',
                assigned_by: adminId,
                notes: notes || null,
            });

        if (err) throw err;

        // Log the event
        await supabase.from('subscription_events').insert({
            user_id: userId,
            event_type: 'created',
            new_status: 'active',
            performed_by: adminId,
            metadata: { package_type: packageType, duration_months: durationMonths },
        });

        await fetchUsers();
        await fetchSubscriptions();
    };

    /* ── Update Subscription ── */
    const updateSubscription = async (subId, changes) => {
        const { error: err } = await supabase
            .from('subscriptions')
            .update({ ...changes, updated_at: new Date().toISOString() })
            .eq('id', subId);

        if (err) throw err;
        await fetchUsers();
        await fetchSubscriptions();
    };

    /* ── Revoke (cancel) Subscription ── */
    const revokeSubscription = async (subId) => {
        await updateSubscription(subId, { status: 'cancelled' });
    };

    /* ── Derived lists ── */
    const pendingUsers = users.filter(u => u.approval_status === 'pending');
    const approvedUsers = users.filter(u => u.approval_status === 'approved');
    const rejectedUsers = users.filter(u => u.approval_status === 'rejected');

    return {
        users,
        subscriptions,
        pendingUsers,
        approvedUsers,
        rejectedUsers,
        isLoading,
        error,
        approveUser,
        rejectUser,
        assignSubscription,
        updateSubscription,
        revokeSubscription,
        refresh: () => { fetchUsers(); fetchSubscriptions(); },
    };
}
