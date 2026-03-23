import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AccessGatePage from '../../pages/user/AccessGatePage';

/**
 * Guard for user-facing features.
 *
 * Access granted if ANY of these is true:
 *   - User is coach/superadmin (privileged)
 *   - User is approved by coach (approval_status === 'approved')
 *   - User has active subscription/package
 *
 * Otherwise → AccessGatePage (unified blocked screen)
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

    // 2. Coaches/admins bypass all checks
    const isPrivileged = ['coach', 'superadmin'].includes(role);
    if (isPrivileged) {
        return <Outlet />;
    }

    // 3. OR gate: approved by coach OR active package → access granted
    if (isApproved || hasActiveSubscription) {
        return <Outlet />;
    }

    // 4. Neither approved nor subscribed → show unified gate page
    return <AccessGatePage />;
};

export default UserProtectedRoute;
