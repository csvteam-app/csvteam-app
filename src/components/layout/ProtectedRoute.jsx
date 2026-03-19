import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = () => {
    const { isAuthenticated, isLoading, role } = useAuth();

    if (isLoading) {
        return (
            <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
                <div className="animate-pulse" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Caricamento...</div>
            </div>
        );
    }

    if (!isAuthenticated || !['coach', 'superadmin'].includes(role)) {
        return <Navigate to="/admin/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
