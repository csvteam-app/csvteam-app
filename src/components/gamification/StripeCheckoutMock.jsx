import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, CheckCircle, Smartphone, Lock, X, RefreshCw } from 'lucide-react';

const StripeCheckoutMock = ({ isOpen, onClose, selectedPackage, onComplete }) => {
    const { user } = useAuth();
    const [step, setStep] = useState(1); // 1: Loading, 2: Form, 3: Processing, 4: Success
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [autoRenew, setAutoRenew] = useState(false);

    // Fake start loading
    React.useEffect(() => {
        if (isOpen) {
            setStep(1);
            setPaymentMethod('card');
            setAutoRenew(false);
            const t = setTimeout(() => setStep(2), 800);
            return () => clearTimeout(t);
        }
    }, [isOpen]);

    if (!isOpen || !selectedPackage) return null;

    const finalPrice = autoRenew ? selectedPackage.price * 0.9 : selectedPackage.price;

    const handlePay = (e) => {
        e.preventDefault();
        setStep(3);

        // Simula chiamata ad API Stripe/Klarna
        setTimeout(() => {
            const orderId = 'or_' + Date.now();

            setStep(4);
            setTimeout(() => {
                onComplete(orderId);
                onClose();
            }, 2500);
        }, 2000);
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
                {/* Header Header */}
                <div className="flex-row justify-between items-center" style={{ padding: '24px', borderBottom: '1px solid #eee' }}>
                    <div className="flex-col">
                        <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>CSV Team Store</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.4rem' }}>{finalPrice.toFixed(2)} €</span>
                            {autoRenew && (
                                <span style={{ textDecoration: 'line-through', color: '#bbb', fontSize: '0.9rem' }}>{selectedPackage.price.toFixed(2)} €</span>
                            )}
                        </div>
                    </div>
                    {step === 2 && (
                        <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px' }}>
                            <X size={20} color="#666" />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div style={{ padding: '24px', minHeight: '350px', position: 'relative' }}>

                    {step === 1 && (
                        <div className="flex-col items-center justify-center gap-4" style={{ height: '280px' }}>
                            <div className="spinner" style={{ borderTopColor: '#000', width: '30px', height: '30px', borderWidth: '3px' }}></div>
                            <span style={{ color: '#666', fontSize: '0.9rem', fontWeight: 500 }}>Caricamento checkout sicuro...</span>
                        </div>
                    )}

                    {step === 2 && (
                        <form onSubmit={handlePay} className="flex-col gap-4 animate-fade-in">
                            <div style={{ padding: '12px', background: '#f8f8f8', borderRadius: '8px', marginBottom: '8px' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: '4px' }}>Prodotto</div>
                                <div style={{ fontSize: '1rem', fontWeight: 800 }}>{selectedPackage.name}</div>
                            </div>

                            {/* Auto-Renew Toggle for Subscriptions */}
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'rgba(212,175,55,0.08)', padding: '12px', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(212,175,55,0.3)' }}>
                                <input
                                    type="checkbox"
                                    checked={autoRenew}
                                    onChange={(e) => setAutoRenew(e.target.checked)}
                                    style={{ marginTop: '4px', width: '18px', height: '18px', accentColor: '#D4AF37' }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#000', fontSize: '0.9rem' }}>
                                        <RefreshCw size={14} color="#D4AF37" /> Rinnovo Automatico
                                        <span style={{ background: '#D4AF37', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' }}>-10% SCONTO</span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', lineHeight: 1.3 }}>
                                        Risparmia il 10% attivando l'addebito ricorrente. Puoi disdire in qualsiasi momento dalle impostazioni.
                                    </div>
                                </div>
                            </label>

                            <div className="flex-col gap-2" style={{ marginBottom: '8px', marginTop: '8px' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#333' }}>Metodo di pagamento</span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <div
                                        onClick={() => setPaymentMethod('card')}
                                        style={{ flex: 1, padding: '12px', border: paymentMethod === 'card' ? '2px solid #000' : '1px solid #ddd', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', background: paymentMethod === 'card' ? '#fcfcfc' : '#fff' }}
                                    >
                                        <CreditCard size={18} color="#000" /> <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#000' }}>Carta</span>
                                    </div>
                                    <div
                                        onClick={() => setPaymentMethod('klarna')}
                                        style={{ flex: 1, padding: '12px', border: paymentMethod === 'klarna' ? '2px solid #ffb3c7' : '1px solid #ddd', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', background: paymentMethod === 'klarna' ? '#fff5f7' : '#fff' }}
                                    >
                                        <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#000', letterSpacing: '-0.5px' }}>Klarna.</span>
                                    </div>
                                </div>
                            </div>

                            {paymentMethod === 'card' && (
                                <div className="animate-fade-in" style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                                    <input type="text" placeholder="Numero Carta" value="•••• •••• •••• 4242" readOnly style={{ width: '100%', padding: '12px', border: 'none', borderBottom: '1px solid #e0e0e0', fontSize: '1rem', outline: 'none', color: '#000' }} />
                                    <div className="flex-row" style={{ width: '100%' }}>
                                        <input type="text" placeholder="MM/AA" value="12/28" readOnly style={{ flex: 1, padding: '12px', border: 'none', borderRight: '1px solid #e0e0e0', fontSize: '1rem', outline: 'none', color: '#000' }} />
                                        <input type="text" placeholder="CVC" value="123" readOnly style={{ flex: 1, padding: '12px', border: 'none', fontSize: '1rem', outline: 'none', color: '#000' }} />
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'klarna' && (
                                <div className="animate-fade-in" style={{ padding: '16px', border: '1px solid #ffb3c7', borderRadius: '8px', background: '#fff5f7', textAlign: 'center' }}>
                                    <p style={{ fontSize: '0.85rem', color: '#000', fontWeight: 500, lineHeight: 1.4, margin: 0 }}>
                                        Verrai reindirizzato a Klarna per completare l'acquisto.<br />
                                        <strong style={{ color: '#ff6699' }}>Paga in 3 comode rate a tasso zero.</strong>
                                    </p>
                                </div>
                            )}

                            <div className="flex-col gap-2" style={{ marginTop: '16px' }}>
                                <button type="submit" style={{
                                    width: '100%', padding: '14px', background: paymentMethod === 'klarna' ? '#ffb3c7' : '#000', color: paymentMethod === 'klarna' ? '#000' : '#fff',
                                    borderRadius: '8px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
                                    border: 'none', transition: 'transform 0.1s'
                                }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                                    Paga {finalPrice.toFixed(2)} € {paymentMethod === 'klarna' && 'con Klarna'}
                                </button>
                                <div className="flex-row justify-center items-center gap-1" style={{ width: '100%', opacity: 0.5, marginTop: '8px' }}>
                                    <Lock size={12} color="#000" />
                                    <span style={{ fontSize: '0.75rem', color: '#000', fontWeight: 600 }}>Pagamento sicuro tramite Stripe</span>
                                </div>
                            </div>
                        </form>
                    )}

                    {step === 3 && (
                        <div className="flex-col items-center justify-center gap-4 animate-fade-in" style={{ height: '280px' }}>
                            <div className="spinner" style={{ borderTopColor: paymentMethod === 'klarna' ? '#ffb3c7' : '#000', width: '40px', height: '40px', borderWidth: '4px' }}></div>
                            <span style={{ color: '#000', fontSize: '1rem', fontWeight: 600 }}>
                                {paymentMethod === 'klarna' ? 'Connessione a Klarna...' : 'Elaborazione del pagamento...'}
                            </span>
                            <span style={{ color: '#666', fontSize: '0.85rem' }}>Non chiudere questa finestra</span>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="flex-col items-center justify-center gap-4 animate-fade-in" style={{ height: '280px' }}>
                            <div className="animate-scale-up" style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckCircle size={32} color="#fff" />
                            </div>
                            <div className="flex-col items-center gap-1 text-center">
                                <span style={{ color: '#000', fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit' }}>Pagamento Riuscito!</span>
                                <span style={{ color: '#666', fontSize: '0.9rem' }}>Pacchetto aggiunto al tuo account.</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StripeCheckoutMock;
