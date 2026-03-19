import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Guard for user-facing features.
 * Redirects to /auth (login/register) if user is not authenticated.
 */
const UserProtectedRoute = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
                <div className="animate-pulse" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Caricamento...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    return <Outlet />;
};

export default UserProtectedRoute;
