import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Apple, ChevronRight, Mail, Lock, Eye, EyeOff, User, FileText, MapPin, Map } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import CsvLogo from '../../components/ui/CsvLogo';

const PROVINCES = [
    'Agrigento','Alessandria','Ancona','Aosta','Arezzo','Ascoli Piceno','Asti','Avellino','Bari','Barletta-Andria-Trani','Belluno','Benevento','Bergamo','Biella','Bologna','Bolzano','Brescia','Brindisi','Cagliari','Caltanissetta','Campobasso','Caserta','Catania','Catanzaro','Chieti','Como','Cosenza','Cremona','Crotone','Cuneo','Enna','Fermo','Ferrara','Firenze','Foggia','Forlì-Cesena','Frosinone','Genova','Gorizia','Grosseto','Imperia','Isernia','La Spezia','L\'Aquila','Latina','Lecce','Lecco','Livorno','Lodi','Lucca','Macerata','Mantova','Massa-Carrara','Matera','Messina','Milano','Modena','Monza e della Brianza','Napoli','Novara','Nuoro','Oristano','Padova','Palermo','Parma','Pavia','Perugia','Pesaro e Urbino','Pescara','Piacenza','Pisa','Pistoia','Pordenone','Potenza','Prato','Ragusa','Ravenna','Reggio Calabria','Reggio Emilia','Rieti','Rimini','Roma','Rovigo','Salerno','Sassari','Savona','Siena','Siracusa','Sondrio','Taranto','Teramo','Terni','Torino','Trapani','Trento','Treviso','Trieste','Udine','Varese','Venezia','Verbano-Cusio-Ossola','Vercelli','Verona','Vibo Valentia','Vicenza','Viterbo'
];

const AuthPage = () => {
    const navigate = useNavigate();
    const { signIn } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
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
                options: { redirectTo: `${window.location.origin}/dashboard` },
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

    /* ── Icon for input field ── */
    const InputIcon = ({ icon: Icon }) => (
        <div style={s.inputIcon}>
            <Icon size={16} strokeWidth={1.8} />
        </div>
    );

    return (
        <div style={s.page}>
            {/* ── Ambient glows ── */}
            <div style={s.glowOrb1} />
            <div style={s.glowOrb2} />

            <div style={s.container} className="animate-fade-in">

                {/* ═══ Logo Section — identical to Dashboard ═══ */}
                <div style={s.logoSection}>
                    <div
                        className="csv-logo-coin-3d"
                        style={{ width: '140px', cursor: 'pointer' }}
                    >
                        <CsvLogo size="100%" showText={false} />
                    </div>
                    <h1 style={s.brandTitle}>
                        CSV <span style={{ color: '#FFF3E0' }}>TEAM</span>
                    </h1>
                    <p style={s.brandSub}>ELITE COACHING</p>
                </div>

                {/* ═══ Headline ═══ */}
                <div style={s.headlineSection}>
                    <h2 style={s.headline}>
                        {isLogin
                            ? "Bentornato nell'esperienza CSV Team"
                            : 'Inizia il tuo percorso elite'}
                    </h2>
                    <p style={s.subheadline}>
                        {isLogin
                            ? 'Accesso riservato agli atleti attivi e ai membri approvati dal coach.'
                            : 'Registrati e richiedi l\'accesso al tuo coaching personalizzato.'}
                    </p>
                </div>

                {/* ═══ Glass Card ═══ */}
                <div style={s.glassCard}>

                    {/* ── OAuth Row ── */}
                    <div style={s.oauthRow}>
                        <button
                            type="button"
                            style={s.oauthBtn}
                            onClick={() => handleOAuth('google')}
                            disabled={!!oauthLoading}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            {oauthLoading === 'google' ? '...' : 'Google'}
                        </button>
                        <button
                            type="button"
                            style={s.oauthBtn}
                            onClick={() => handleOAuth('apple')}
                            disabled={!!oauthLoading}
                        >
                            <Apple size={18} />
                            {oauthLoading === 'apple' ? '...' : 'Apple'}
                        </button>
                    </div>

                    {/* ── Divider ── */}
                    <div style={s.divider}>
                        <div style={s.dividerLine} />
                        <span style={s.dividerText}>O CONTINUA CON EMAIL</span>
                        <div style={s.dividerLine} />
                    </div>

                    {/* ── Form ── */}
                    <form onSubmit={handleSubmit} style={s.form}>
                        {!isLogin && (
                            <div style={s.inputWrap}>
                                <InputIcon icon={User} />
                                <input
                                    name="name" type="text" placeholder="Nome e Cognome"
                                    value={formData.name} onChange={handleChange}
                                    required style={s.input}
                                />
                            </div>
                        )}

                        <div style={s.inputWrap}>
                            <InputIcon icon={Mail} />
                            <input
                                name="email" type="email" placeholder="La tua email"
                                value={formData.email} onChange={handleChange}
                                required autoComplete="email" style={s.input}
                            />
                        </div>

                        <div style={s.inputWrap}>
                            <InputIcon icon={Lock} />
                            <input
                                name="password" type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                value={formData.password} onChange={handleChange}
                                required autoComplete={isLogin ? 'current-password' : 'new-password'}
                                style={{ ...s.input, paddingRight: '44px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={s.eyeBtn}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>

                        {!isLogin && (
                            <>
                                <div style={s.inputWrap}>
                                    <InputIcon icon={FileText} />
                                    <input
                                        name="taxCode" type="text" placeholder="Codice Fiscale"
                                        value={formData.taxCode} onChange={handleChange}
                                        required style={s.input}
                                    />
                                </div>
                                <div style={s.inputWrap}>
                                    <InputIcon icon={MapPin} />
                                    <input
                                        name="address" type="text" placeholder="Indirizzo di Residenza"
                                        value={formData.address} onChange={handleChange}
                                        required style={s.input}
                                    />
                                </div>
                                <div style={s.inputWrap}>
                                    <InputIcon icon={Map} />
                                    <select
                                        name="province" value={formData.province}
                                        onChange={handleChange} style={s.select} required
                                    >
                                        <option value="">Provincia...</option>
                                        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </>
                        )}

                        {/* ── Messages ── */}
                        {error && <p style={s.errorMsg}>{error}</p>}
                        {success && <p style={s.successMsg}>{success}</p>}

                        {/* ── Submit ── */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                ...s.submitBtn,
                                opacity: loading ? 0.7 : 1,
                                cursor: loading ? 'not-allowed' : 'pointer',
                            }}
                        >
                            {loading ? (
                                <span style={s.spinner} />
                            ) : (
                                isLogin ? 'Accedi' : 'Crea Account'
                            )}
                        </button>
                    </form>
                </div>

                {/* ═══ Toggle Login/Register ═══ */}
                <div style={s.toggleRow}>
                    <span style={s.toggleLabel}>
                        {isLogin ? 'Non hai un account?' : 'Hai già un account?'}
                    </span>
                    <button
                        type="button"
                        onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
                        style={s.toggleBtn}
                    >
                        {isLogin ? 'Registrati ora' : 'Accedi qui'}
                    </button>
                </div>

                {/* ═══ Premium CTA ═══ */}
                <div style={s.ctaSection}>
                    <div style={s.ctaDivider} />
                    <p style={s.ctaLabel}>Non sei ancora un atleta CSV Team?</p>
                    <button
                        type="button"
                        onClick={() => window.open('https://csvteam.com', '_blank')}
                        style={s.ctaBtn}
                    >
                        Attiva il tuo percorso
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ════════════════════════════════════════════
   STYLES — Luxury Dark Premium
   ════════════════════════════════════════════ */
const s = {
    /* ── Page ── */
    page: {
        height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#050508',
        padding: '12px 16px',
        position: 'relative', overflow: 'hidden',
        boxSizing: 'border-box',
    },
    glowOrb1: {
        position: 'absolute', top: '-160px', right: '-120px',
        width: '500px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,120,0,0.05) 0%, transparent 60%)',
        pointerEvents: 'none',
    },
    glowOrb2: {
        position: 'absolute', bottom: '-140px', left: '-100px',
        width: '450px', height: '450px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,120,0,0.03) 0%, transparent 60%)',
        pointerEvents: 'none',
    },
    container: {
        width: '100%', maxWidth: '420px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '10px', position: 'relative', zIndex: 1,
    },

    /* ── Logo ── */
    logoSection: {
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0px',
    },
    logoGlow: {
        position: 'relative', padding: '20px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)',
        boxShadow: '0 0 60px rgba(212,175,55,0.08)',
    },
    brandTitle: {
        fontFamily: "'Outfit', sans-serif", fontWeight: 800,
        fontSize: '1.4rem', letterSpacing: '0.1em', color: '#fff',
        marginTop: '4px', marginBottom: '0',
    },
    brandSub: {
        fontFamily: "'Outfit', sans-serif", fontWeight: 600,
        fontSize: '0.58rem', letterSpacing: '0.25em',
        color: 'rgba(255,243,224,0.5)', marginTop: '-2px',
    },

    /* ── Headline ── */
    headlineSection: {
        textAlign: 'center', maxWidth: '360px',
    },
    headline: {
        fontFamily: "'Outfit', sans-serif", fontWeight: 700,
        fontSize: '1.05rem', color: '#fff', lineHeight: 1.3,
        margin: '0 0 2px',
    },
    subheadline: {
        fontFamily: "'Inter', sans-serif", fontSize: '0.78rem',
        color: 'rgba(255,255,255,0.45)', lineHeight: 1.4, margin: 0,
    },

    /* ── Glass Card ── */
    glassCard: {
        width: '100%',
        background: 'rgba(8,8,12,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,243,224,0.1)',
        borderRadius: '20px',
        padding: '20px 20px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,243,224,0.04)',
        display: 'flex', flexDirection: 'column', gap: '14px',
    },

    /* ── OAuth ── */
    oauthRow: { display: 'flex', gap: '12px' },
    oauthBtn: {
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '10px', padding: '11px 16px', borderRadius: '12px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.8)',
        fontFamily: "'Inter', sans-serif", fontWeight: 600,
        fontSize: '0.88rem', cursor: 'pointer',
        transition: 'border-color 0.2s, background 0.2s',
    },

    /* ── Divider ── */
    divider: {
        display: 'flex', alignItems: 'center', gap: '14px',
    },
    dividerLine: {
        flex: 1, height: '1px',
        background: 'rgba(255,255,255,0.06)',
    },
    dividerText: {
        fontFamily: "'Outfit', sans-serif", fontWeight: 600,
        fontSize: '0.58rem', letterSpacing: '0.14em',
        color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap',
    },

    /* ── Form ── */
    form: {
        display: 'flex', flexDirection: 'column', gap: '10px',
    },
    inputWrap: {
        position: 'relative',
    },
    inputIcon: {
        position: 'absolute', left: '14px', top: '50%',
        transform: 'translateY(-50%)',
        color: 'rgba(255,255,255,0.3)',
        display: 'flex', alignItems: 'center',
        pointerEvents: 'none',
    },
    input: {
        width: '100%', padding: '14px 14px 14px 42px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px', color: '#fff',
        fontSize: '0.9rem', fontFamily: "'Inter', sans-serif",
        outline: 'none', transition: 'border-color 0.2s',
        boxSizing: 'border-box',
    },
    select: {
        width: '100%', padding: '14px 14px 14px 42px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px', color: '#fff',
        fontSize: '0.9rem', fontFamily: "'Inter', sans-serif",
        appearance: 'none', outline: 'none',
        boxSizing: 'border-box',
    },
    eyeBtn: {
        position: 'absolute', right: '14px', top: '50%',
        transform: 'translateY(-50%)',
        background: 'none', border: 'none',
        color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
        display: 'flex', alignItems: 'center',
    },

    /* ── Submit ── */
    submitBtn: {
        width: '100%', padding: '13px',
        background: 'linear-gradient(135deg, #FFF3E0, #E8D5B0)',
        border: 'none', borderRadius: '14px',
        color: '#050508', fontFamily: "'Outfit', sans-serif",
        fontWeight: 700, fontSize: '1rem', letterSpacing: '0.02em',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 24px rgba(255,120,0,0.15)',
        marginTop: '4px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '46px',
    },
    spinner: {
        width: '20px', height: '20px', borderRadius: '50%',
        border: '2px solid transparent', borderTopColor: '#050508',
        animation: 'spin 0.6s linear infinite', display: 'inline-block',
    },

    /* ── Messages ── */
    errorMsg: {
        fontSize: '0.82rem', color: '#ff6b6b',
        textAlign: 'center', background: 'rgba(255,107,107,0.08)',
        border: '1px solid rgba(255,107,107,0.12)',
        padding: '10px 14px', borderRadius: '10px', margin: 0,
    },
    successMsg: {
        fontSize: '0.82rem', color: '#4ade80',
        textAlign: 'center', background: 'rgba(74,222,128,0.08)',
        border: '1px solid rgba(74,222,128,0.12)',
        padding: '10px 14px', borderRadius: '10px', margin: 0,
    },

    /* ── Toggle ── */
    toggleRow: {
        display: 'flex', alignItems: 'center', gap: '8px',
    },
    toggleLabel: {
        fontFamily: "'Inter', sans-serif", fontSize: '0.82rem',
        color: 'rgba(255,255,255,0.4)',
    },
    toggleBtn: {
        background: 'none', border: 'none',
        color: '#FFF3E0', fontWeight: 700,
        fontSize: '0.82rem', cursor: 'pointer', padding: 0,
        fontFamily: "'Inter', sans-serif",
    },

    /* ── Premium CTA ── */
    ctaSection: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '8px', width: '100%', marginTop: '0px',
    },
    ctaDivider: {
        width: '60px', height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(255,243,224,0.2), transparent)',
    },
    ctaLabel: {
        fontFamily: "'Inter', sans-serif", fontSize: '0.82rem',
        color: 'rgba(255,255,255,0.4)', margin: 0,
    },
    ctaBtn: {
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'rgba(255,243,224,0.04)',
        border: '1px solid rgba(255,243,224,0.12)',
        borderRadius: '12px', padding: '11px 24px',
        color: '#FFF3E0',
        fontFamily: "'Outfit', sans-serif", fontWeight: 700,
        fontSize: '0.92rem', letterSpacing: '0.02em',
        cursor: 'pointer', transition: 'all 0.3s ease',
        boxShadow: '0 2px 16px rgba(255,120,0,0.06)',
    },
};

export default AuthPage;
