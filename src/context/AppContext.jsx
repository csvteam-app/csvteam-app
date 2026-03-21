import { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext();

/**
 * AppContext — SLIM VERSION
 * ────────────────────────
 * All persistent data now lives in Supabase.
 * This context retains ONLY:
 *   1. Admin auth session (transient, in-memory)
 *   2. Reward / League popups (transient UI state)
 */
export const AppProvider = ({ children }) => {
    /* ── Admin Auth (transient session) ── */
    const [adminAuth, setAdminAuth] = useState(null);

    const adminLogin = (email, password) => {
        // Simple mock admin login — will be replaced by Supabase auth
        if (email === 'admin@csvteam.com' && password === 'admin123') {
            setAdminAuth({ id: 'adm1', email, role: 'super_admin' });
            return true;
        }
        return false;
    };

    const adminLogout = () => setAdminAuth(null);

    /* ── Reward & League Popup (transient UI) ── */
    const [rewardPopup, setRewardPopup] = useState(null);   // { xp, points }
    const [leaguePopup, setLeaguePopup] = useState(null);   // league object

    const claimLeagueReward = useCallback((leagueId) => {
        // In the future this could write to Supabase; for now just dismiss popup
        setLeaguePopup(null);
    }, []);

    /* ── Context Value ── */
    const value = {
        // Admin auth
        state: { adminAuth },
        adminLogin,
        adminLogout,

        // Transient popups
        rewardPopup,
        setRewardPopup,
        leaguePopup,
        setLeaguePopup,
        claimLeagueReward,
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);
export default AppContext;
