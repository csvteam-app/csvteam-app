import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGamification } from '../../hooks/useGamification';
import { useShop } from '../../hooks/useShop';
import Button from '../../components/ui/Button';
import { ShoppingBag, Zap, CheckCircle, CreditCard, Users, User, Clock, Gift, Star, TicketPercent, ScrollText, CupSoda, Activity, UtensilsCrossed, Clapperboard, Crown, Briefcase } from 'lucide-react';
import PaymentCheckout from '../../components/gamification/PaymentCheckout';
import CsvCoin from '../../components/ui/CsvCoin';

const IconMap = {
    Gift: <Gift size={48} strokeWidth={1} color="#FFF5E6" />,
    TicketPercent: <TicketPercent size={48} strokeWidth={1} color="#FFF5E6" />,
    ScrollText: <ScrollText size={48} strokeWidth={1} color="#FFF5E6" />,
    CupSoda: <CupSoda size={40} strokeWidth={1} color="#FFF5E6" />,
    Activity: <Activity size={40} strokeWidth={1} color="#FFF5E6" />,
    UtensilsCrossed: <UtensilsCrossed size={40} strokeWidth={1} color="#FFF5E6" />,
    Clapperboard: <Clapperboard size={40} strokeWidth={1} color="#FFF5E6" />,
    Crown: <Crown size={40} strokeWidth={1} color="#FFF5E6" />,
    Briefcase: <Briefcase size={40} strokeWidth={1} color="#FFF5E6" />,
};

const DAILY_DEALS = [
    { id: 'deal_free', name: 'Regalo Giornaliero', price: 0, originalPrice: null, image: 'Gift', claimable: true },
    { id: 'deal_1', name: 'Sconto 10% Coaching', price: 900, originalPrice: 1500, image: 'TicketPercent', claimable: false },
    { id: 'deal_2', name: 'Scheda Allenamento Extra', price: 2500, originalPrice: 4000, image: 'ScrollText', claimable: false },
];

const Shop = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { gamification, addXpAndPoints, dailyTasks, completeDailyTask } = useGamification();
    const { products, isLoading } = useShop();

    const [toast, setToast] = useState(null);
    const [checkoutOpen, setCheckoutOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [claimedDeals, setClaimedDeals] = useState([]);
    const [infoModalOpen, setInfoModalOpen] = useState(false);


    const handlePurchase = async (itemId, price, name) => {
        // Daily free gift
        if (itemId === 'deal_free') {
            if (dailyTasks.daily_gift) return;
            await addXpAndPoints(25, 10);
            await completeDailyTask('daily_gift');
            showToast('Regalo riscosso! +25 XP, +10 CSV Points', 'success');
            return;
        }

        if (gamification.wallet_balance < price) {
            setToast({ msg: 'CSV Points insufficienti! Completa le sfide per ottenerne di più.', type: 'error' });
            setTimeout(() => setToast(null), 2500);
            return;
        }

        // Deduct points for daily deal purchases
        addXpAndPoints(0, -price);
        setClaimedDeals(prev => [...prev, itemId]);
        showToast(`${name} acquistato con successo! 🎉`, 'success');
    };

    const showToast = (msg, type) => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    }

    const handleBuyPackage = (pkg) => {
        setSelectedPackage(pkg);
        setCheckoutOpen(true);
    };

    const handleCheckoutComplete = (orderId) => {
        showToast('Pagamento confermato! Lezioni aggiunte al tuo account.', 'success');
        setCheckoutOpen(false);
    };


    return (
        <div className="global-container" style={{
            paddingBottom: '120px',
            paddingTop: 'env(safe-area-inset-top)',
            backgroundColor: '#000000',
            backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(255, 215, 170, 0.15) 0%, rgba(255, 215, 170, 0.05) 40%, transparent 70%)',
            minHeight: '100vh',
            paddingLeft: '16px', paddingRight: '16px'
        }}>

            {/* --- SECTION 1: OFFERTE GIORNALIERE (IN STAND BY) --- */}
            {/* 
            <div className="animate-fade-in" style={{ marginBottom: '36px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '4px', height: '18px', borderRadius: '2px', background: '#FFF5E6' }} />
                        <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.2rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Offerte Giornaliere</h2>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '12px' }}>
                        <Clock size={12} /> Scade in 14h
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {DAILY_DEALS.map((deal, idx) => (
                        <div key={deal.id} className="glass-card" style={{
                            minWidth: '135px', flex: '0 0 auto',
                            borderColor: idx === 0 ? 'rgba(255, 215, 170,0.3)' : 'var(--glass-border)',
                            boxShadow: idx === 0 ? '0 0 20px rgba(255, 215, 170,0.1)' : 'var(--glass-shadow)',
                            borderRadius: '16px', padding: '16px 12px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            position: 'relative'
                        }}>
                            {deal.originalPrice && (
                                <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--gradient-primary)', color: '#050508', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '8px', zIndex: 2, whiteSpace: 'nowrap' }}>
                                    - {Math.round((1 - deal.price / deal.originalPrice) * 100)}%
                                </div>
                            )}

                            <div style={{ margin: '8px 0 16px 0', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>
                                {IconMap[deal.image] || <Star size={48} color="#FFF5E6" />}
                            </div>
                            <h4 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.75rem', color: '#fff', textAlign: 'center', marginBottom: '12px', minHeight: '34px', display: 'flex', alignItems: 'center' }}>
                                {deal.name}
                            </h4>

                            {deal.price === 0 ? (
                                <button
                                    onClick={() => handlePurchase(deal.id, 0, deal.name)}
                                    disabled={dailyTasks.daily_gift}
                                    className={`csv-btn csv-btn-sm ${dailyTasks.daily_gift ? 'csv-btn-disabled' : 'csv-btn-primary'}`}
                                    style={{
                                        width: '100%',
                                        marginTop: 'auto',
                                        boxShadow: dailyTasks.daily_gift ? 'none' : '0 0 15px rgba(255, 215, 170,0.2)',
                                        opacity: dailyTasks.daily_gift ? 0.5 : 1,
                                        cursor: dailyTasks.daily_gift ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {dailyTasks.daily_gift ? 'RISCOSSO' : 'GRATIS'}
                                </button>
                            ) : (
                                <div style={{ width: '100%', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.65rem', textDecoration: 'line-through' }}>
                                        <CsvCoin size={12} /> {deal.originalPrice.toLocaleString()}
                                    </div>
                                    <button onClick={() => handlePurchase(deal.id, deal.price, deal.name)} className="csv-btn csv-btn-outline csv-btn-sm" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                        <CsvCoin size={16} /> {deal.price.toLocaleString()}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            */}

            {/* SECTION 2: NEGOZIO (PACCHETTI E ABBONAMENTI) */}
            <div className="animate-fade-in w-full" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '4px', height: '18px', borderRadius: '2px', background: '#FFF5E6' }} />
                    <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.2rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Negozio</h2>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px', paddingLeft: '12px' }}>
                    Acquista slot lezioni o affidati al team CSV per il tuo percorso di trasformazione completo. Offriamo pagamenti rateizzati con Klarna.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[
                        { title: 'Lezioni Singole', type: 'singola', data: products.single, icon: <User size={28} color="#fff" /> },
                        { title: 'Lezioni di Coppia', type: 'coppia', data: products.pair, icon: <Users size={28} color="#fff" /> }
                    ].map(section => (
                        <div key={section.title} style={{
                            padding: '24px',
                            background: 'linear-gradient(135deg, rgba(25, 22, 20, 0.7) 0%, rgba(15, 12, 12, 0.9) 100%)',
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                            borderLeft: '1px solid rgba(255, 255, 255, 0.03)',
                            borderRight: '1px solid rgba(0, 0, 0, 0.3)',
                            borderBottom: '1px solid rgba(0, 0, 0, 0.6)',
                            borderRadius: '24px',
                            boxShadow: '0 12px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.02)'
                        }}>
                            <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.1rem', color: '#fff', marginBottom: '20px', textAlign: 'center', letterSpacing: '0.02em' }}>{section.title}</h3>

                            {section.data.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.85rem' }}>Nessun pacchetto disponibile.</p>}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                {section.data.map((pkg) => (
                                    <div key={pkg.id} onClick={() => handleBuyPackage(pkg)} style={{
                                        background: 'linear-gradient(135deg, rgba(35, 30, 27, 0.7) 0%, rgba(20, 16, 14, 0.9) 100%)',
                                        borderTop: '1px solid rgba(255, 215, 170, 0.1)',
                                        borderLeft: '1px solid rgba(255, 215, 170, 0.03)',
                                        borderRight: '1px solid rgba(0, 0, 0, 0.4)',
                                        borderBottom: '2px solid rgba(0, 0, 0, 0.8)',
                                        borderRadius: '16px', padding: '16px 8px',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                                        cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
                                        boxShadow: '0 8px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 15px 25px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'; }}
                                        onMouseDown={e => { e.currentTarget.style.transform = 'translateY(1px)'; e.currentTarget.style.borderBottomWidth = '1px'; }}
                                        onMouseUp={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderBottomWidth = '2px'; }}
                                    >

                                        {/* Quantità come badge 3D */}
                                        <div style={{ position: 'relative', marginBottom: '16px' }}>
                                            <div style={{ padding: '10px', borderRadius: '50%', background: 'linear-gradient(145deg, rgba(45, 38, 33, 1), rgba(25, 20, 18, 1))', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.05), 0 4px 8px rgba(0,0,0,0.5)', display: 'flex' }}>
                                                {section.icon}
                                            </div>
                                            <div style={{ position: 'absolute', bottom: '-6px', right: '-6px', background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF5E6 100%)', color: '#050508', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, border: '2px solid rgba(20,20,25,1)', boxShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
                                                {pkg.amount}
                                            </div>
                                        </div>

                                        <button style={{ width: '100%', background: 'linear-gradient(145deg, rgba(25, 22, 20, 1), rgba(15, 12, 12, 1))', color: '#fff', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(0,0,0,0.8)', borderLeft: 'none', borderRight: 'none', padding: '8px', borderRadius: '10px', fontWeight: 800, fontSize: '0.8rem', marginTop: 'auto', pointerEvents: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)' }}>
                                            € {Number(pkg.price).toFixed(2)}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div style={{
                        padding: '24px',
                        background: 'linear-gradient(135deg, rgba(25, 22, 20, 0.85) 0%, rgba(15, 12, 12, 0.95) 100%)',
                        borderTop: '1px solid rgba(255, 215, 170, 0.25)',
                        borderLeft: '1px solid rgba(255, 215, 170, 0.08)',
                        borderRight: '1px solid rgba(0, 0, 0, 0.5)',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.8)',
                        borderRadius: '24px',
                        boxShadow: '0 15px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255, 215, 170,0.05)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                            <div style={{ background: 'linear-gradient(90deg, transparent, rgba(255, 215, 170,0.5), transparent)', height: '1px', width: '60%' }} />
                        </div>
                        <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.2rem', color: '#FFF5E6', marginBottom: '20px', textAlign: 'center', letterSpacing: '0.02em', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Abbonamenti Coaching</h3>
                        {products.coaching.length === 0 && <p style={{ color: '#FFF5E6', textAlign: 'center', fontSize: '0.85rem', opacity: 0.7 }}>Nessun abbonamento disponibile.</p>}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            {products.coaching.map((pkg) => (
                                <div key={pkg.id} onClick={() => handleBuyPackage(pkg)} style={{
                                    background: 'linear-gradient(135deg, rgba(35, 30, 27, 0.8) 0%, rgba(20, 16, 14, 0.95) 100%)',
                                    borderTop: '1px solid rgba(255, 215, 170, 0.4)',
                                    borderLeft: '1px solid rgba(255, 215, 170, 0.15)',
                                    borderRight: '1px solid rgba(0, 0, 0, 0.5)',
                                    borderBottom: '2px solid rgba(0, 0, 0, 0.8)',
                                    borderRadius: '16px', padding: '16px 8px',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
                                    boxShadow: '0 10px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255, 215, 170,0.1)'
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255, 215, 170,0.2)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255, 215, 170,0.1)'; }}
                                    onMouseDown={e => { e.currentTarget.style.transform = 'translateY(1px)'; e.currentTarget.style.borderBottomWidth = '1px'; }}
                                    onMouseUp={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderBottomWidth = '2px'; }}
                                >

                                    <div style={{ position: 'relative', marginBottom: '16px' }}>
                                        <div style={{ padding: '10px', borderRadius: '50%', background: 'linear-gradient(145deg, rgba(45, 38, 33, 1), rgba(25, 20, 18, 1))', boxShadow: 'inset 0 2px 4px rgba(255, 215, 170,0.15), 0 4px 8px rgba(0,0,0,0.6)', display: 'flex', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}>
                                            <Crown size={28} color="#FFF5E6" />
                                        </div>
                                        <div style={{ position: 'absolute', bottom: '-6px', right: '-8px', background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF5E6 100%)', color: '#000', borderRadius: '8px', padding: '2px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900, border: '1px solid #FFF5E6', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                            {pkg.amount} M.
                                        </div>
                                    </div>

                                    <h4 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '0.75rem', color: '#fff', textAlign: 'center', marginBottom: '16px', minHeight: '34px', display: 'flex', alignItems: 'center', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                                        {pkg.name}
                                    </h4>

                                    <button style={{ width: '100%', background: 'linear-gradient(145deg, rgba(25, 22, 20, 1), rgba(15, 12, 12, 1))', color: '#FFF5E6', borderTop: '1px solid rgba(255, 215, 170,0.25)', borderBottom: '1px solid rgba(0,0,0,0.8)', borderLeft: 'none', borderRight: 'none', padding: '8px', borderRadius: '10px', fontWeight: 900, fontSize: '0.8rem', marginTop: 'auto', pointerEvents: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)' }}>
                                        € {Number(pkg.price).toFixed(2)}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Modal per CSV Points */}
            {infoModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                    zIndex: 100000, display: 'flex', justifyContent: 'center', alignItems: 'center',
                    padding: '20px'
                }}>
                    <div className="glass-card animate-scale-in" style={{
                        background: 'linear-gradient(180deg, #1A1A24 0%, #0F0F15 100%)',
                        width: '100%', maxWidth: '360px', padding: '32px 24px', borderRadius: '24px',
                        border: '1px solid rgba(255, 215, 170,0.3)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)',
                        position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
                    }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255, 215, 170,0.1)',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px',
                            border: '1px solid rgba(255, 215, 170,0.3)', filter: 'drop-shadow(0 4px 16px rgba(255, 215, 170,0.3))'
                        }}>
                            <CsvCoin size={56} />
                        </div>

                        <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.6rem', color: '#fff', marginBottom: '12px' }}>
                            CSV Points
                        </h2>

                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '28px' }}>
                            I <strong style={{ color: '#FFF5E6' }}>CSV Points</strong> sono l&apos;esclusiva valuta del nostro ecosistema e <strong style={{ color: '#fff' }}>non possono essere acquistati</strong>.
                            <br /><br />
                            Puoi guadagnarli <strong>rispettando la dieta</strong>, completando gli <strong>allenamenti</strong> e superando le <strong>sfide settimanali</strong>.
                        </p>

                        <button onClick={() => setInfoModalOpen(false)} className="csv-btn csv-btn-primary" style={{ width: '100%', height: '50px', fontSize: '1rem' }}>
                            Ho capito
                        </button>
                    </div>
                </div>
            )}

            {/* Native Stripe Checkout Modal */}
            <PaymentCheckout
                isOpen={checkoutOpen}
                onClose={() => setCheckoutOpen(false)}
                selectedPackage={selectedPackage}
                onComplete={handleCheckoutComplete}
            />

            {/* Global Toast */}
            {
                toast && (
                    <div style={{
                        position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
                        background: toast.type === 'success' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'rgba(255,107,107,0.95)',
                        color: '#fff', padding: '12px 24px', borderRadius: '14px',
                        fontWeight: 700, fontSize: '0.85rem', zIndex: 99999,
                        animation: 'fadeInDown 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        {toast.type === 'success' ? <CheckCircle size={18} /> : <Zap size={18} />}
                        {toast.msg}
                    </div>
                )
            }
        </div >
    );
};

export default Shop;
