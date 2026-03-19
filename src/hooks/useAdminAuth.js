import { useAppContext } from '../context/AppContext';

export function useAdminAuth() {
    const { state, adminLogin, adminLogout } = useAppContext();

    return {
        isAuthenticated: !!state.adminAuth,
        admin: state.adminAuth,
        role: state.adminAuth?.role || null,
        isSuperAdmin: state.adminAuth?.role === 'super_admin',
        login: adminLogin,
        logout: adminLogout,
    };
}
