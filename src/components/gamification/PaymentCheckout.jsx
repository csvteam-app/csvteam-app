import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { CheckCircle, Lock, X, RefreshCw } from 'lucide-react';

const PaymentCheckout = ({ isOpen, onClose, selectedPackage }) => {
    const { state } = useAppContext();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen || !selectedPackage) return null;

    const isCoaching = selectedPackage.type === 'coaching';
    const finalPrice = selectedPackage.price;

    const handleCheckout = async () => {
        setIsProcessing(true);
        setError(null);

        // Fallback per test locale se non abbiamo Stripe Key impostata (ma l'utente l'avrà)
        const isMockMode = !import.meta.env.VITE_STRIPE_PUBLIC_KEY || import.meta.env.VITE_STRIPE_PUBLIC_KEY.includes('mock');

        if (isMockMode) {
            setError("Modo test locale: aggiungi VITE_STRIPE_PUBLIC_KEY in .env per abilitare Checkout");
            setIsProcessing(false);
            return;
        }

        try {
            const { data, error: fnError } = await supabase.functions.invoke('create-checkout-session', {
                body: {
                    amount: selectedPackage.price,
                    productId: selectedPackage.id,
                    productName: selectedPackage.name,
                    successUrl: `${window.location.origin}/shop?success=true&session_id={CHECKOUT_SESSION_ID}`,
                    cancelUrl: `${window.location.origin}/shop`,
                    metadata: {
                        user_id: state.userAuth?.id || 'guest',
                        type: selectedPackage.type,
                        amount_credits: selectedPackage.amount
                    }
                }
            });

            if (fnError) throw fnError;

            if (data?.url) {
                // Redirect al Checkout di Stripe
                window.location.href = data.url;
            } else {
                throw new Error("Nessun URL restituito da Stripe.");
            }
        } catch (err) {
            console.error("Errore Checkout:", err);
            setError(err.message || 'Errore durante la creazione della sessione di pagamento.');
            setIsProcessing(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
            <div className="glass-card animate-scale-up" style={{
                width: '100%', maxWidth: '420px', padding: 0, overflow: 'hidden',
                background: '#fff', color: '#000', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}>
                <div className="flex-row justify-between items-center" style={{ padding: '24px', borderBottom: '1px solid #eee' }}>
                    <div className="flex-col">
                        <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>CSV Team Store</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.4rem' }}>{finalPrice.toFixed(2)} €</span>
                            {isCoaching && <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>/ {selectedPackage.amount > 1 ? `${selectedPackage.amount} mesi` : 'mese'}</span>}
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#333' }}>{selectedPackage.name}</span>
                    </div>
                    <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }} disabled={isProcessing}>
                        <X size={20} color="#666" />
                    </button>
                </div>

                <div className="flex-col" style={{ padding: '24px' }}>

                    {isCoaching && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'rgba(212,175,55,0.08)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.3)', marginBottom: '24px' }}>
                            <RefreshCw size={20} color="#D4AF37" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: '#000', fontSize: '0.95rem', marginBottom: '4px' }}>
                                    Abbonamento con Rinnovo Automatico
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#555', lineHeight: '1.4' }}>
                                    Questo pacchetto si rinnoverà automaticamente alla scadenza per garantirti l'accesso continuo. Riceverai uno <strong>sconto esclusivo del 10%</strong> su tutti i rinnovi futuri!
                                </div>
                            </div>
                        </div>
                    )}

                    {!isCoaching && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'rgba(0,0,0,0.03)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                            <CheckCircle size={20} color="#000" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, color: '#000', fontSize: '0.95rem', marginBottom: '4px' }}>
                                    Pagamento Singolo
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#555', lineHeight: '1.4' }}>
                                    Acquisti {selectedPackage.amount} {selectedPackage.amount === 1 ? 'lezione' : 'lezioni'} in via definitiva. Nessun rinnovo automatico.
                                </div>
                            </div>
                        </div>
                    )}

                    {error && <div style={{ color: '#e11d48', fontSize: '0.85rem', marginBottom: '16px', padding: '12px', background: 'rgba(225, 29, 72, 0.1)', borderRadius: '8px' }}>{error}</div>}

                    <button
                        onClick={handleCheckout}
                        disabled={isProcessing}
                        style={{
                            width: '100%', padding: '16px', background: '#000', color: '#fff',
                            borderRadius: '12px', fontWeight: 600, fontSize: '1rem', cursor: isProcessing ? 'wait' : 'pointer',
                            border: 'none', transition: 'all 0.2s', opacity: isProcessing ? 0.7 : 1, marginTop: '8px'
                        }}
                        className="hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isProcessing ? 'Reindirizzamento...' : `Paga con Checkout Sicuro`}
                    </button>

                    <div className="flex-row justify-center items-center gap-1" style={{ width: '100%', opacity: 0.5, marginTop: '16px' }}>
                        <Lock size={12} color="#000" />
                        <span style={{ fontSize: '0.75rem', color: '#000', fontWeight: 600 }}>I tuoi dati saranno protetti da Stripe</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentCheckout;
