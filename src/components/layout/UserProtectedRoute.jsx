import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PendingApprovalPage from '../../pages/user/PendingApprovalPage';
import ExpiredSubscriptionPage from '../../pages/user/ExpiredSubscriptionPage';

/**
 * Guard for user-facing features.
 *
 * Checks (in order):
 *   1. Authenticated?          → redirect to /auth
 *   2. Account approved?       → show PendingApprovalPage
 *   3. Subscription active?    → show ExpiredSubscriptionPage
 *
 * Coach / superadmin users bypass steps 2–3 (they use the admin panel).
 */
const UserProtectedRoute = () => {
    const {
        isAuthenticated,
        isLoading,
        role,
        isApproved,
        hasActiveSubscription,
    } = useAuth();

    if (isLoading) {
        return (
            <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
                <div className="animate-pulse" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Caricamento...</div>
            </div>
        );
    }

    // 1. Not logged in → login page
    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    // Coaches and superadmins skip approval/subscription gates
    const isPrivileged = ['coach', 'superadmin'].includes(role);

    // 2. Account not yet approved by admin
    if (!isPrivileged && !isApproved) {
        return <PendingApprovalPage />;
    }

    // 3. Subscription expired or inactive
    if (!isPrivileged && !hasActiveSubscription) {
        return <ExpiredSubscriptionPage />;
    }

    return <Outlet />;
};

export default UserProtectedRoute;
