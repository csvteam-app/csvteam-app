import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Users, FileText, LogOut, Database, CalendarDays, MessageSquare, Eye, CreditCard } from 'lucide-react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { useAuth } from '../../context/AuthContext';
import CsvLogo from '../ui/CsvLogo';

const AdminLayout = () => {
    const { logout, admin } = useAdminAuth();
    const { isAuthenticated: hasSupabaseSession, role } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Show "Vista Atleta" only for coaches logged in via Supabase auth
    const canViewAsAthlete = hasSupabaseSession && ['coach', 'superadmin'].includes(role);

    const isChat = location.pathname.includes('/admin/chat');

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    return (
        <div className="admin-container" style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
            {/* Sidebar — Glass Luxury */}
            <aside
                className="admin-sidebar"
                style={{
                    width: '260px',
                    background: 'rgba(255,255,255,0.02)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderRight: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    flexShrink: 0,
                }}
            >
                <div className="sidebar-header" style={{ padding: '28px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex-row gap-3 items-center">
                        <CsvLogo size={30} showText={false} />
                        <div>
                            <h1 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2 }}>
                                <span style={{ color: 'var(--accent-gold)' }}>CSV</span> Coach
                            </h1>
                            <p className="text-small" style={{ fontSize: '0.68rem', opacity: 0.5 }}>{admin?.email || 'Sistema di Gestione'}</p>
                        </div>
                    </div>
                </div>

                <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
                    {[
                        { name: 'Pannello Atleti', path: '/admin/dashboard', icon: <Users size={18} strokeWidth={1.5} /> },
                        { name: 'Supporto & Inbox', path: '/admin/chat', icon: <MessageSquare size={18} strokeWidth={1.5} /> },
                        { name: 'Gestione Lezioni', path: '/admin/lessons', icon: <CalendarDays size={18} strokeWidth={1.5} /> },
                        { name: 'Programmi', path: '/admin/programs', icon: <FileText size={18} strokeWidth={1.5} /> },
                        { name: 'Libreria Esercizi', path: '/admin/exercises', icon: <Database size={18} strokeWidth={1.5} /> },
                        { name: 'Abbonamenti', path: '/admin/subscriptions', icon: <CreditCard size={18} strokeWidth={1.5} /> },
                    ].map(item => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px 14px',
                                borderRadius: '12px',
                                color: isActive ? '#050508' : 'var(--text-muted)',
                                background: isActive ? 'var(--gradient-primary)' : 'transparent',
                                transition: 'all 0.25s ease-out',
                                fontWeight: isActive ? 700 : 400,
                                fontSize: '0.85rem',
                                fontFamily: 'Outfit, sans-serif',
                            })}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer" style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {canViewAsAthlete && (
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex-row gap-2 items-center"
                            style={{
                                color: 'var(--accent-teal, #2dd4bf)',
                                width: '100%',
                                padding: '12px 14px',
                                fontSize: '0.82rem',
                                background: 'rgba(45,212,191,0.04)',
                                border: '1px solid rgba(45,212,191,0.12)',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontFamily: 'Outfit, sans-serif',
                                transition: 'all 0.25s ease-out',
                            }}
                        >
                            <Eye size={16} strokeWidth={1.5} />
                            <span>Vista Atleta</span>
                        </button>
                    )}
                    <button
                        onClick={handleLogout}
                        className="flex-row gap-2 items-center"
                        style={{
                            color: '#ff6b6b',
                            width: '100%',
                            padding: '12px 14px',
                            fontSize: '0.82rem',
                            background: 'rgba(255,107,107,0.04)',
                            border: '1px solid rgba(255,107,107,0.08)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontFamily: 'Outfit, sans-serif',
                            transition: 'all 0.25s ease-out',
                        }}
                    >
                        <LogOut size={16} strokeWidth={1.5} />
                        <span>Esci dal Portale</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-color)', padding: isChat ? '0' : '32px' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
