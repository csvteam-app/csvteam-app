import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, MapPin, CreditCard, ChevronRight, Apple, Smartphone, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import CsvLogo from '../../components/ui/CsvLogo';

const PROVINCES = [
    'Agrigento', 'Alessandria', 'Ancona', 'Aosta', 'Arezzo', 'Ascoli Piceno', 'Asti', 'Avellino', 'Bari', 'Barletta-Andria-Trani', 'Belluno', 'Benevento', 'Bergamo', 'Biella', 'Bologna', 'Bolzano', 'Brescia', 'Brindisi', 'Cagliari', 'Caltanissetta', 'Campobasso', 'Carbonia-Iglesias', 'Caserta', 'Catania', 'Catanzaro', 'Chieti', 'Como', 'Cosenza', 'Cremona', 'Crotone', 'Cuneo', 'Enna', 'Fermo', 'Ferrara', 'Firenze', 'Foggia', 'Forlì-Cesena', 'Frosinone', 'Genova', 'Gorizia', 'Grosseto', 'Imperia', 'Isernia', 'La Spezia', 'L\'Aquila', 'Latina', 'Lecce', 'Lecco', 'Livorno', 'Lodi', 'Lucca', 'Macerata', 'Mantova', 'Massa-Carrara', 'Matera', 'Messina', 'Milano', 'Modena', 'Monza e della Brianza', 'Napoli', 'Novara', 'Nuoro', 'Olbia-Tempio', 'Oristano', 'Padova', 'Palermo', 'Parma', 'Pavia', 'Perugia', 'Pesaro e Urbino', 'Pescara', 'Piacenza', 'Pisa', 'Pistoia', 'Pordenone', 'Potenza', 'Prato', 'Ragusa', 'Ravenna', 'Reggio Calabria', 'Reggio Emilia', 'Rieti', 'Rimini', 'Roma', 'Rovigo', 'Salerno', 'Medio Campidano', 'Sassari', 'Savona', 'Siena', 'Siracusa', 'Sondrio', 'Taranto', 'Teramo', 'Terni', 'Torino', 'Ogliastra', 'Trapani', 'Trento', 'Treviso', 'Trieste', 'Udine', 'Varese', 'Venezia', 'Verbano-Cusio-Ossola', 'Vercelli', 'Verona', 'Vibo Valentia', 'Vicenza', 'Viterbo'
];

const AuthPage = () => {
    const navigate = useNavigate();
    const { signIn } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        taxCode: '',
        address: '',
        province: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                const result = await signIn(formData.email, formData.password);
                if (result.error) {
                    setError('Credenziali non valide. Riprova.');
                } else {
                    // Route based on role
                    const role = result.profile?.role;
                    if (role === 'coach' || role === 'superadmin') {
                        navigate('/admin/dashboard');
                    } else {
                        navigate('/dashboard');
                    }
                }
            } else {
                // Registration via Supabase
                if (!formData.name || !formData.email || !formData.password || !formData.taxCode || !formData.address || !formData.province) {
                    setError('Tutti i campi sono obbligatori.');
                    setLoading(false);
                    return;
                }

                // Directly call Supabase Auth
                import('../../lib/supabase').then(async ({ supabase }) => {
                    const { data, error: signUpError } = await supabase.auth.signUp({
                        email: formData.email,
                        password: formData.password,
                        options: {
                            data: {
                                name: formData.name,
                                taxCode: formData.taxCode,
                                address: formData.address,
                                province: formData.province,
                                role: 'athlete' // Default role for standard registration
                            }
                        }
                    });

                    if (signUpError) {
                        setError(`Errore registrazione: ${signUpError.message}`);
                    } else {
                        // Optimistically create the profile since RLS might block if triggers take too long
                        if (data?.user) {
                            await supabase.from('profiles').upsert({
                                id: data.user.id,
                                email: formData.email,
                                full_name: formData.name, // Make sure full_name is set correctly
                                role: 'athlete'
                            });
                        }
                        setError('Registrazione riuscita! Ora puoi accedere.');
                        setIsLogin(true);
                    }
                    setLoading(false);
                });
                return; // Prevent finally from running too early
            }
        } catch (err) {
            setError('Si è verificato un errore. Riprova.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="global-container items-center justify-center min-vh-100" style={{ background: 'radial-gradient(circle at top right, rgba(240,165,0,0.05), transparent 40%), radial-gradient(circle at bottom left, rgba(45,212,191,0.05), transparent 40%)' }}>

            <div className="animate-fade-in flex-col gap-8" style={{ width: '100%', maxWidth: '420px' }}>

                {/* Header */}
                <div className="flex-col items-center gap-3">
                    <CsvLogo size={60} />
                    <h1 className="text-h1" style={{ fontSize: '2rem' }}>{isLogin ? 'Bentornato' : 'Unisciti a CSV Team'}</h1>
                    <p className="text-label" style={{ opacity: 0.6 }}>
                        {isLogin ? 'Inserisci le tue credenziali per accedere' : 'Crea il tuo profilo elite per iniziare'}
                    </p>
                </div>

                {/* Social Options */}
                <div className="flex-row gap-3">
                    <Button
                        variant="outline"
                        fullWidth
                        disabled
                        style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', opacity: 0.4 }}
                    >
                        <Smartphone size={18} /> Google
                    </Button>
                    <Button
                        variant="outline"
                        fullWidth
                        disabled
                        style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', opacity: 0.4 }}
                    >
                        <Apple size={18} /> Apple
                    </Button>
                </div>

                <div className="flex-row items-center gap-4">
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                    <span className="text-label" style={{ fontSize: '0.65rem' }}>O CONTINUA CON EMAIL</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                </div>

                {/* Auth Card */}
                <Card glass style={{ padding: '32px' }}>
                    <form className="flex-col gap-5" onSubmit={handleSubmit}>
                        {!isLogin && (
                            <Input
                                label="Nome e Cognome"
                                name="name"
                                placeholder="Mario Rossi"
                                icon={<User size={18} />}
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        )}

                        <Input
                            label="Email"
                            name="email"
                            type="email"
                            placeholder="atleta@csvteam.com"
                            icon={<Mail size={18} />}
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />

                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            icon={<Lock size={18} />}
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />

                        {!isLogin && (
                            <>
                                <Input
                                    label="Codice Fiscale"
                                    name="taxCode"
                                    placeholder="RSSMRA80A01H501Z"
                                    icon={<CreditCard size={18} />}
                                    value={formData.taxCode}
                                    onChange={handleChange}
                                    required
                                />

                                <Input
                                    label="Indirizzo di Residenza"
                                    name="address"
                                    placeholder="Via delle Vittorie, 12"
                                    icon={<MapPin size={18} />}
                                    value={formData.address}
                                    onChange={handleChange}
                                    required
                                />

                                <div className="flex-col gap-2">
                                    <label className="text-label">Provincia</label>
                                    <select
                                        name="province"
                                        className="csv-input"
                                        value={formData.province}
                                        onChange={handleChange}
                                        style={{ background: 'var(--surface-color-2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px', color: 'var(--text-primary)', appearance: 'none' }}
                                        required
                                    >
                                        <option value="">Seleziona...</option>
                                        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </>
                        )}

                        {error && (
                            <p className="text-small" style={{ color: 'var(--accent-coral)', textAlign: 'center', background: 'rgba(255,107,107,0.1)', padding: '10px', borderRadius: '8px' }}>
                                {error}
                            </p>
                        )}

                        <Button size="lg" fullWidth loading={loading} type="submit">
                            {isLogin ? <><LogIn size={18} /> Accedi</> : <><UserPlus size={18} /> Registrati</>}
                        </Button>
                    </form>
                </Card>

                {/* Toggle */}
                <div className="flex-row justify-center gap-2">
                    <p className="text-label" style={{ opacity: 0.6 }}>
                        {isLogin ? 'Non hai un account?' : 'Hai già un account?'}
                    </p>
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent-warm)', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                    >
                        {isLogin ? 'Registrati ora' : 'Accedi qui'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AuthPage;
