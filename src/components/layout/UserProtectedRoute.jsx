import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PendingApprovalPage from '../../pages/user/PendingApprovalPage';
import ExpiredSubscriptionPage from '../../pages/user/ExpiredSubscriptionPage';

/**
 * Guard for user-facing features.
 *
 * Checks (in order):
 *   1. Authenticated?          → redirect to /auth
 *   2. Coach/superadmin?       → redirect to /admin/dashboard
 *   3. Account approved?       → show PendingApprovalPage
 *   4. Subscription active?    → show ExpiredSubscriptionPage
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

    // 2. Coaches and superadmins → redirect to admin dashboard
    const isPrivileged = ['coach', 'superadmin'].includes(role);
    if (isPrivileged) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    // 3. Account not yet approved by admin
    if (!isApproved) {
        return <PendingApprovalPage />;
    }

    // 4. Subscription expired or inactive
    if (!hasActiveSubscription) {
        return <ExpiredSubscriptionPage />;
    }

    return <Outlet />;
};

export default UserProtectedRoute;
