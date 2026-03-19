import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CsvLogo from '../../components/ui/CsvLogo';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { LogIn, AlertCircle } from 'lucide-react';

const AdminLogin = () => {
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await signIn(email, password);
            if (result.error) {
                setError('Credenziali non valide. Riprova.');
            } else {
                const role = result.profile?.role;
                if (role === 'coach' || role === 'superadmin') {
                    navigate('/admin/dashboard');
                } else {
                    setError('Accesso non autorizzato. Solo coach e admin possono accedere.');
                }
            }
        } catch (err) {
            setError('Si è verificato un errore. Riprova.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: '100dvh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-color)',
                padding: '20px',
            }}
        >
            <div
                className="glass-card animate-fade-in"
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '40px 32px',
                    borderColor: 'rgba(212,175,55,0.08)',
                }}
            >
                {/* Logo */}
                <div className="flex-col items-center gap-3" style={{ marginBottom: '36px' }}>
                    <CsvLogo size={56} />
                    <div style={{ textAlign: 'center' }}>
                        <p className="text-label" style={{ marginBottom: '4px' }}>Portale Amministrazione</p>
                        <h1 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.3rem', color: '#fff' }}>Accesso Coach</h1>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-col gap-4">
                    <Input
                        label="Email"
                        type="email"
                        placeholder="coach@csvteam.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {error && (
                        <div
                            className="flex-row gap-2 items-center"
                            style={{
                                padding: '10px 14px',
                                borderRadius: 'var(--border-radius-sm)',
                                background: 'rgba(255,107,107,0.06)',
                                border: '1px solid rgba(255,107,107,0.12)',
                                color: '#ff6b6b',
                                fontSize: '0.82rem',
                            }}
                        >
                            <AlertCircle size={15} strokeWidth={1.5} /> {error}
                        </div>
                    )}

                    <Button type="submit" fullWidth size="lg" disabled={loading} style={{ marginTop: '8px' }}>
                        <LogIn size={18} strokeWidth={1.5} />
                        {loading ? 'Accesso in corso...' : 'Accedi'}
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
