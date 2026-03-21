import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Users, FileText, LogOut, Database, CalendarDays, MessageSquare, Eye, Menu, X } from 'lucide-react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { useAuth } from '../../context/AuthContext';
import CsvLogo from '../ui/CsvLogo';

const AdminLayout = () => {
    const { logout, admin } = useAdminAuth();
    const { isAuthenticated: hasSupabaseSession, role } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Show "Vista Atleta" only for coaches logged in via Supabase auth
    const canViewAsAthlete = hasSupabaseSession && ['coach', 'superadmin'].includes(role);

    const isChat = location.pathname.includes('/admin/chat');

    // Close sidebar on route change (mobile)
    useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    const navItems = [
        { name: 'Pannello Atleti', path: '/admin/dashboard', icon: <Users size={20} strokeWidth={1.5} /> },
        { name: 'Supporto & Inbox', path: '/admin/chat', icon: <MessageSquare size={20} strokeWidth={1.5} /> },
        { name: 'Gestione Lezioni', path: '/admin/lessons', icon: <CalendarDays size={20} strokeWidth={1.5} /> },
        { name: 'Programmi', path: '/admin/programs', icon: <FileText size={20} strokeWidth={1.5} /> },
        { name: 'Libreria Esercizi', path: '/admin/exercises', icon: <Database size={20} strokeWidth={1.5} /> },
    ];

    // Find current page name for mobile header
    const currentPage = navItems.find(item => location.pathname.startsWith(item.path))?.name || 'Coach';

    return (
        <div className="admin-container" style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>

            {/* ═══ MOBILE TOP BAR ═══ */}
            <div className="admin-mobile-bar" style={{
                display: 'none', /* shown via CSS media query */
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
                height: '56px', padding: '0 16px',
                background: 'rgba(10,10,12,0.95)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                alignItems: 'center', justifyContent: 'space-between',
            }}>
                <button onClick={() => setSidebarOpen(true)} style={{
                    background: 'none', border: 'none', color: '#fff', padding: '10px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                }}>
                    <Menu size={24} />
                </button>
                <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                    {currentPage}
                </span>
                <div style={{ width: '44px' }} /> {/* spacer for centering */}
            </div>

            {/* ═══ SIDEBAR BACKDROP (mobile) ═══ */}
            {sidebarOpen && (
                <div
                    className="admin-sidebar-backdrop"
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        display: 'none', /* shown via CSS */
                        position: 'fixed', inset: 0, zIndex: 299,
                        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                    }}
                />
            )}

            {/* ═══ SIDEBAR ═══ */}
            <aside
                className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar-open' : ''}`}
                style={{
                    width: '260px',
                    background: 'rgba(10,10,12,0.98)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    flexShrink: 0,
                    zIndex: 300,
                }}
            >
                <div className="sidebar-header" style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="flex-row gap-3 items-center">
                        <CsvLogo size={30} showText={false} />
                        <div>
                            <h1 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2 }}>
                                <span style={{ color: 'var(--accent-gold)' }}>CSV</span> Coach
                            </h1>
                            <p className="text-small" style={{ fontSize: '0.7rem', opacity: 0.5 }}>{admin?.email || 'Sistema di Gestione'}</p>
                        </div>
                    </div>
                    {/* Close button - mobile only */}
                    <button className="admin-sidebar-close" onClick={() => setSidebarOpen(false)} style={{
                        display: 'none', /* shown via CSS */
                        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', padding: '8px', cursor: 'pointer',
                    }}>
                        <X size={20} />
                    </button>
                </div>

                <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
                    {navItems.map(item => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px 16px',
                                borderRadius: '12px',
                                color: isActive ? 'var(--accent-gold)' : 'rgba(255,255,255,0.5)',
                                background: isActive ? 'rgba(212,175,55,0.08)' : 'transparent',
                                borderLeft: isActive ? '3px solid var(--accent-gold)' : '3px solid transparent',
                                transition: 'all 0.2s ease-out',
                                fontWeight: isActive ? 700 : 500,
                                fontSize: '0.92rem',
                                fontFamily: 'Outfit, sans-serif',
                                textDecoration: 'none',
                                minHeight: '48px',
                            })}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer" style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {canViewAsAthlete && (
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex-row gap-2 items-center"
                            style={{
                                color: 'var(--accent-teal, #2dd4bf)',
                                width: '100%',
                                padding: '14px 16px',
                                fontSize: '0.85rem',
                                background: 'rgba(45,212,191,0.06)',
                                border: '1px solid rgba(45,212,191,0.15)',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontFamily: 'Outfit, sans-serif',
                                transition: 'all 0.2s',
                                minHeight: '48px',
                            }}
                        >
                            <Eye size={18} strokeWidth={1.5} />
                            <span>Vista Atleta</span>
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        className="flex-row gap-2 items-center"
                        style={{
                            color: '#ff6b6b',
                            width: '100%',
                            padding: '14px 16px',
                            fontSize: '0.85rem',
                            background: 'rgba(255,107,107,0.06)',
                            border: '1px solid rgba(255,107,107,0.1)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontFamily: 'Outfit, sans-serif',
                            transition: 'all 0.2s',
                            minHeight: '48px',
                        }}
                    >
                        <LogOut size={18} strokeWidth={1.5} />
                        <span>Esci dal Portale</span>
                    </button>
                </div>
            </aside>

            {/* ═══ MAIN CONTENT ═══ */}
            <main className="admin-main" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)', padding: isChat ? '0' : '32px' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
