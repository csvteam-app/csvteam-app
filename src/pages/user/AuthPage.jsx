import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, MapPin, CreditCard, Apple, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import CsvLogo from '../../components/ui/CsvLogo';

const PROVINCES = [
    'Agrigento', 'Alessandria', 'Ancona', 'Aosta', 'Arezzo', 'Ascoli Piceno', 'Asti', 'Avellino', 'Bari', 'Barletta-Andria-Trani', 'Belluno', 'Benevento', 'Bergamo', 'Biella', 'Bologna', 'Bolzano', 'Brescia', 'Brindisi', 'Cagliari', 'Caltanissetta', 'Campobasso', 'Caserta', 'Catania', 'Catanzaro', 'Chieti', 'Como', 'Cosenza', 'Cremona', 'Crotone', 'Cuneo', 'Enna', 'Fermo', 'Ferrara', 'Firenze', 'Foggia', 'Forlì-Cesena', 'Frosinone', 'Genova', 'Gorizia', 'Grosseto', 'Imperia', 'Isernia', 'La Spezia', 'L\'Aquila', 'Latina', 'Lecce', 'Lecco', 'Livorno', 'Lodi', 'Lucca', 'Macerata', 'Mantova', 'Massa-Carrara', 'Matera', 'Messina', 'Milano', 'Modena', 'Monza e della Brianza', 'Napoli', 'Novara', 'Nuoro', 'Oristano', 'Padova', 'Palermo', 'Parma', 'Pavia', 'Perugia', 'Pesaro e Urbino', 'Pescara', 'Piacenza', 'Pisa', 'Pistoia', 'Pordenone', 'Potenza', 'Prato', 'Ragusa', 'Ravenna', 'Reggio Calabria', 'Reggio Emilia', 'Rieti', 'Rimini', 'Roma', 'Rovigo', 'Salerno', 'Sassari', 'Savona', 'Siena', 'Siracusa', 'Sondrio', 'Taranto', 'Teramo', 'Terni', 'Torino', 'Trapani', 'Trento', 'Treviso', 'Trieste', 'Udine', 'Varese', 'Venezia', 'Verbano-Cusio-Ossola', 'Vercelli', 'Verona', 'Vibo Valentia', 'Vicenza', 'Viterbo'
];

const AuthPage = () => {
    const navigate = useNavigate();
    const { signIn } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        name: '', email: '', password: '',
        taxCode: '', address: '', province: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
        setSuccess('');
    };

    /* ── OAuth ── */
    const handleOAuth = async (provider) => {
        setOauthLoading(provider);
        setError('');
        try {
            const { error: oauthError } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/dashboard`,
                },
            });
            if (oauthError) setError(oauthError.message);
        } catch {
            setError('Errore di connessione. Riprova.');
        } finally {
            setOauthLoading(null);
        }
    };

    /* ── Email/Password ── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (isLogin) {
                const result = await signIn(formData.email, formData.password);
                if (result.error) {
                    setError('Credenziali non valide. Riprova.');
                } else {
                    const role = result.profile?.role;
                    navigate(role === 'coach' || role === 'superadmin' ? '/admin/dashboard' : '/dashboard');
                }
            } else {
                if (!formData.name || !formData.email || !formData.password || !formData.taxCode || !formData.address || !formData.province) {
                    setError('Tutti i campi sono obbligatori.');
                    setLoading(false);
                    return;
                }

                const { data, error: signUpError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            name: formData.name,
                            full_name: formData.name,
                            taxCode: formData.taxCode,
                            address: formData.address,
                            province: formData.province,
                            role: 'athlete',
                        }
                    }
                });

                if (signUpError) {
                    setError(`Errore registrazione: ${signUpError.message}`);
                } else {
                    if (data?.user) {
                        await supabase.from('profiles').upsert({
                            id: data.user.id,
                            email: formData.email,
                            full_name: formData.name,
                            role: 'athlete',
                            approval_status: 'pending',
                            subscription_status: 'inactive',
                        });
                    }
                    setSuccess('Registrazione riuscita! Il coach esaminerà la tua richiesta.');
                    setIsLogin(true);
                }
            }
        } catch {
            setError('Si è verificato un errore. Riprova.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            {/* Ambient glow */}
            <div style={styles.glowTop} />
            <div style={styles.glowBottom} />

            <div style={styles.container} className="animate-fade-in">

                {/* ── Logo + Brand ── */}
                <div style={styles.logoSection}>
                    <div style={styles.logoGlow}>
                        <CsvLogo size={72} showText={false} />
                    </div>
                    <h1 style={styles.brandTitle}>
                        CSV <span style={{ color: 'var(--accent-gold, #D4AF37)' }}>TEAM</span>
                    </h1>
                    <p style={styles.brandSub}>ELITE COACHING</p>
                    <p style={styles.tagline}>
                        {isLogin ? 'Bentornato nel tuo percorso' : 'Inizia il tuo percorso elite'}
                    </p>
                </div>

                {/* ── OAuth Buttons ── */}
                <div style={styles.oauthRow}>
                    <button
                        style={styles.oauthBtn}
                        onClick={() => handleOAuth('google')}
                        disabled={!!oauthLoading}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        {oauthLoading === 'google' ? 'Connessione...' : 'Google'}
                    </button>
                    <button
                        style={styles.oauthBtn}
                        onClick={() => handleOAuth('apple')}
                        disabled={!!oauthLoading}
                    >
                        <Apple size={18} />
                        {oauthLoading === 'apple' ? 'Connessione...' : 'Apple'}
                    </button>
                </div>

                {/* ── Divider ── */}
                <div style={styles.divider}>
                    <div style={styles.dividerLine} />
                    <span style={styles.dividerText}>O CONTINUA CON EMAIL</span>
                    <div style={styles.dividerLine} />
                </div>

                {/* ── Login / Register Card ── */}
                <Card glass style={{ padding: '28px', width: '100%' }}>
                    <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={handleSubmit}>
                        {!isLogin && (
                            <Input
                                label="Nome e Cognome" name="name" placeholder="Mario Rossi"
                                icon={<User size={18} />} value={formData.name}
                                onChange={handleChange} required
                            />
                        )}

                        <Input
                            label="Email" name="email" type="email" placeholder="atleta@csvteam.com"
                            icon={<Mail size={18} />} value={formData.email}
                            onChange={handleChange} required
                        />

                        <Input
                            label="Password" name="password" type="password" placeholder="••••••••"
                            icon={<Lock size={18} />} value={formData.password}
                            onChange={handleChange} required
                        />

                        {!isLogin && (
                            <>
                                <Input
                                    label="Codice Fiscale" name="taxCode" placeholder="RSSMRA80A01H501Z"
                                    icon={<CreditCard size={18} />} value={formData.taxCode}
                                    onChange={handleChange} required
                                />
                                <Input
                                    label="Indirizzo di Residenza" name="address" placeholder="Via delle Vittorie, 12"
                                    icon={<MapPin size={18} />} value={formData.address}
                                    onChange={handleChange} required
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={styles.selectLabel}>Provincia</label>
                                    <select
                                        name="province" value={formData.province}
                                        onChange={handleChange} style={styles.select} required
                                    >
                                        <option value="">Seleziona...</option>
                                        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </>
                        )}

                        {error && <p style={styles.errorMsg}>{error}</p>}
                        {success && <p style={styles.successMsg}>{success}</p>}

                        <Button size="lg" fullWidth loading={loading} type="submit" style={{ marginTop: '4px' }}>
                            {isLogin ? 'Accedi' : 'Crea Account'}
                        </Button>
                    </form>
                </Card>

                {/* ── Toggle Login/Register ── */}
                <div style={styles.toggleRow}>
                    <span style={styles.toggleLabel}>
                        {isLogin ? 'Non hai un account?' : 'Hai già un account?'}
                    </span>
                    <button
                        type="button"
                        onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
                        style={styles.toggleBtn}
                    >
                        {isLogin ? 'Registrati ora' : 'Accedi qui'}
                    </button>
                </div>

                {/* ── Shop CTA (below everything) ── */}
                <div style={styles.shopSection}>
                    <div style={styles.shopDivider} />
                    <p style={styles.shopLabel}>Non sei ancora abbonato?</p>
                    <button
                        onClick={() => navigate('/shop')}
                        style={styles.shopBtn}
                    >
                        Entra e fai parte di CSV
                        <ChevronRight size={18} />
                    </button>
                </div>

            </div>
        </div>
    );
};

/* ── Styles ── */
const styles = {
    page: {
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-color, #050508)',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
    },
    glowTop: {
        position: 'absolute', top: '-120px', right: '-80px',
        width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 65%)',
        pointerEvents: 'none',
    },
    glowBottom: {
        position: 'absolute', bottom: '-100px', left: '-60px',
        width: '350px', height: '350px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(45,212,191,0.04) 0%, transparent 65%)',
        pointerEvents: 'none',
    },
    container: {
        width: '100%', maxWidth: '420px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '20px', position: 'relative', zIndex: 1,
    },

    /* Logo */
    logoSection: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '4px', marginBottom: '4px',
    },
    logoGlow: {
        position: 'relative',
        padding: '16px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
    },
    brandTitle: {
        fontFamily: "'Outfit', sans-serif", fontWeight: 800,
        fontSize: '1.6rem', letterSpacing: '0.08em', color: '#fff',
        marginTop: '8px',
    },
    brandSub: {
        fontFamily: "'Outfit', sans-serif", fontWeight: 600,
        fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--text-muted, #888)',
        marginTop: '-2px',
    },
    tagline: {
        fontFamily: "'Inter', sans-serif", fontSize: '0.88rem',
        color: 'var(--text-secondary, #aaa)', marginTop: '12px', textAlign: 'center',
    },

    /* OAuth */
    oauthRow: {
        display: 'flex', gap: '12px', width: '100%',
    },
    oauthBtn: {
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '10px', padding: '13px 16px', borderRadius: '14px',
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        color: '#fff', fontFamily: "'Inter', sans-serif", fontWeight: 600,
        fontSize: '0.88rem', cursor: 'pointer',
        transition: 'all 0.2s ease',
    },

    /* Divider */
    divider: {
        display: 'flex', alignItems: 'center', gap: '16px', width: '100%',
    },
    dividerLine: {
        flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)',
    },
    dividerText: {
        fontFamily: "'Outfit', sans-serif", fontWeight: 600,
        fontSize: '0.6rem', letterSpacing: '0.12em',
        color: 'var(--text-muted, #666)',
    },

    /* Select */
    selectLabel: {
        fontFamily: "'Outfit', sans-serif", fontWeight: 600,
        fontSize: '0.75rem', letterSpacing: '0.05em',
        color: 'var(--text-muted, #888)', textTransform: 'uppercase',
    },
    select: {
        background: 'var(--surface-color-2, #111)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px', padding: '12px 14px', color: '#fff',
        fontSize: '0.92rem', appearance: 'none', outline: 'none',
    },

    /* Messages */
    errorMsg: {
        fontSize: '0.82rem', color: 'var(--accent-coral, #ff6b6b)',
        textAlign: 'center', background: 'rgba(255,107,107,0.08)',
        padding: '10px 14px', borderRadius: '10px', margin: 0,
    },
    successMsg: {
        fontSize: '0.82rem', color: '#4ade80',
        textAlign: 'center', background: 'rgba(74,222,128,0.08)',
        padding: '10px 14px', borderRadius: '10px', margin: 0,
    },

    /* Toggle */
    toggleRow: {
        display: 'flex', alignItems: 'center', gap: '8px',
    },
    toggleLabel: {
        fontFamily: "'Inter', sans-serif", fontSize: '0.82rem',
        color: 'var(--text-muted, #888)',
    },
    toggleBtn: {
        background: 'none', border: 'none',
        color: 'var(--accent-warm, #F0A500)', fontWeight: 700,
        fontSize: '0.82rem', cursor: 'pointer', padding: 0,
        fontFamily: "'Inter', sans-serif",
    },

    /* Shop CTA */
    shopSection: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '12px', width: '100%', marginTop: '8px',
    },
    shopDivider: {
        width: '60px', height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)',
    },
    shopLabel: {
        fontFamily: "'Inter', sans-serif", fontSize: '0.82rem',
        color: 'var(--text-muted, #888)', margin: 0,
    },
    shopBtn: {
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.04) 100%)',
        border: '1px solid rgba(212,175,55,0.25)',
        borderRadius: '14px', padding: '14px 28px',
        color: 'var(--accent-gold, #D4AF37)',
        fontFamily: "'Outfit', sans-serif", fontWeight: 700,
        fontSize: '0.92rem', letterSpacing: '0.02em',
        cursor: 'pointer', transition: 'all 0.3s ease',
    },
};

export default AuthPage;
