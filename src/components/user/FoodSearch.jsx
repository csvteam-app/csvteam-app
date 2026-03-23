import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, X, Plus, ChevronRight, ScanBarcode, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import BarcodeScanner from './BarcodeScanner';

/* Map Supabase row → internal food shape */
const mapFood = (row) => ({
    id: row.id,
    name: row.name,
    kcal: Number(row.calories_per_100g) || 0,
    p: Number(row.protein_per_100g) || 0,
    c: Number(row.carbs_per_100g) || 0,
    f: Number(row.fat_per_100g) || 0,
    unit: row.serving_type || 'g',
    category: row.category,
});

const FoodSearch = ({ meal, onSelect, onClose }) => {
    const [search, setSearch] = useState('');
    const [selectedFood, setSelectedFood] = useState(null);
    const [grams, setGrams] = useState(100);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isScanningApi, setIsScanningApi] = useState(false);
    const [foods, setFoods] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    /* Fetch foods from Supabase on search change */
    useEffect(() => {
        let cancelled = false;

        async function fetchFoods() {
            setIsSearching(true);
            let query = supabase
                .from('food_items')
                .select('id, name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, serving_type')
                .eq('is_core', true)
                .order('name', { ascending: true });

            if (search.trim()) {
                query = query.ilike('name', `%${search.trim()}%`);
            }

            query = query.limit(search.trim() ? 30 : 10);

            const { data, error } = await query;
            if (!cancelled) {
                setFoods(error ? [] : (data || []).map(mapFood));
                setIsSearching(false);
            }
        }

        const debounce = setTimeout(fetchFoods, search ? 200 : 0);
        return () => { cancelled = true; clearTimeout(debounce); };
    }, [search]);

    const calculateMacros = useCallback((food, g) => {
        if (!food) return { kcal: 0, p: 0, c: 0, f: 0 };
        const ratio = (g || 0) / 100;
        return {
            kcal: Math.round((food.kcal || 0) * ratio),
            p: Math.round((food.p || 0) * ratio),
            c: Math.round((food.c || 0) * ratio),
            f: Math.round((food.f || 0) * ratio)
        };
    }, []);

    const handleAdd = () => {
        if (!selectedFood) return;
        onSelect(selectedFood, grams);
        onClose();
    };

    const handleScanSuccess = async (barcode) => {
        setIsScannerOpen(false);
        setIsScanningApi(true);
        try {
            const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
            const data = await res.json();

            if (data.status === 1 && data.product) {
                const p = data.product;
                const newFood = {
                    id: `off_${barcode}`,
                    name: p.product_name || p.generic_name || 'Prodotto Sconosciuto',
                    kcal: Math.round(p.nutriments?.['energy-kcal_100g'] || 0),
                    p: Math.round(p.nutriments?.proteins_100g || 0),
                    c: Math.round(p.nutriments?.carbohydrates_100g || 0),
                    f: Math.round(p.nutriments?.fat_100g || 0),
                    unit: 'g'
                };
                setSelectedFood(newFood);
                setGrams(100);
            } else {
                alert("Prodotto non trovato nel database OpenFoodFacts. Prova a inserirlo manualmente.");
            }
        } catch (err) {
            console.error("OFF API Error:", err);
            alert("Errore di connessione al database alimentare.");
        } finally {
            setIsScanningApi(false);
        }
    };

    const preview = useMemo(() => {
        if (!selectedFood) return null;
        return calculateMacros(selectedFood, grams);
    }, [selectedFood, grams]);

    return (
        <div
            className="animate-slide-up"
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
                background: 'linear-gradient(145deg, rgba(20,20,25,0.98), rgba(10,10,15,1))',
                backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                display: 'flex', flexDirection: 'column',
                padding: '0',
                overscrollBehavior: 'none' /* Prevents bouncy scrolling on iOS */
            }}
        >
            {/* INTESTAZIONE STICKY (Full Screen Luxury Layout) */}
            <div style={{ padding: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="flex-row justify-between items-center">
                    <h2 className="text-h1" style={{ fontSize: '1.8rem', letterSpacing: '-0.02em', margin: 0 }}>
                        <span style={{ opacity: 0.5, fontWeight: 500 }}>Aggiungi a</span><br />
                        {meal.charAt(0).toUpperCase() + meal.slice(1)}
                    </h2>
                    <Button variant="ghost" size="icon" onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '50%', width: '40px', height: '40px' }}>
                        <X size={20} color="#fff" />
                    </Button>
                </div>

                {!selectedFood && (
                    <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                        <div style={{ flex: 1 }}>
                            <Input
                                icon={<Search size={20} color="rgba(255,255,255,0.5)" />}
                                placeholder="Cerca un alimento..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                                style={{
                                    background: 'linear-gradient(135deg, rgba(10,10,12,0.8) 0%, rgba(20,20,25,0.6) 100%)',
                                    borderTop: '1px solid rgba(0, 0, 0, 0.8)',
                                    borderLeft: '1px solid rgba(0, 0, 0, 0.4)',
                                    borderRight: '1px solid rgba(255, 255, 255, 0.02)',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                    color: '#fff',
                                    fontSize: '1.1rem', padding: '16px', borderRadius: '16px',
                                    boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.6), inset 0 2px 4px rgba(0,0,0,0.4)',
                                    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)'
                                }}
                            />
                        </div>
                        <Button variant="outline" size="icon" onClick={() => setIsScannerOpen(true)}
                            style={{
                                height: '56px', width: '56px', borderRadius: '16px',
                                background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.9), rgba(15, 15, 20, 1))',
                                border: 'none',
                                borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                                borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
                                borderRight: '1px solid rgba(0, 0, 0, 0.4)',
                                borderBottom: '2px solid rgba(0, 0, 0, 0.6)',
                                boxShadow: '0 8px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.15)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)'; }}
                            onMouseDown={e => { e.currentTarget.style.transform = 'translateY(1px)'; e.currentTarget.style.borderBottomWidth = '1px'; }}
                            onMouseUp={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderBottomWidth = '2px'; }}
                        >
                            <ScanBarcode size={24} color="#FFDCA0" />
                        </Button>
                    </div>
                )}
            </div>

            {/* AREA CONTENUTO CENTRALE SCROLLABILE */}
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 24px 24px 24px' }}>
                {!selectedFood ? (
                    <>
                        {(isScanningApi || isSearching) && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '12px' }}>
                                <Loader className="animate-spin" size={24} color="#FFDCA0" />
                                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', letterSpacing: '0.02em' }}>
                                    {isScanningApi ? 'Ricerca nel database...' : 'Caricamento...'}
                                </span>
                            </div>
                        )}

                        {!isScanningApi && !isSearching && (
                            <div className="flex-col gap-2" style={{ paddingTop: '16px' }}>
                                {foods.map(f => (
                                    <div
                                        key={f.id}
                                        onClick={() => setSelectedFood(f)}
                                        className="flex-row justify-between items-center"
                                        style={{
                                            padding: '16px 20px', cursor: 'pointer',
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
                                            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                                            borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
                                            borderRight: '1px solid rgba(255, 255, 255, 0.02)',
                                            borderBottom: '1px solid rgba(0, 0, 0, 0.4)',
                                            borderRadius: '16px',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                                            transition: 'all 0.2s ease',
                                            marginBottom: '8px'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'; }}
                                    >
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: '1.1rem', color: '#fff', letterSpacing: '0.01em', marginBottom: '4px' }}>{f.name}</p>
                                            <p style={{ color: '#FFDCA0', fontSize: '0.9rem', fontWeight: 500 }}>
                                                {f.kcal} kcal <span style={{ color: 'rgba(255,255,255,0.4)' }}>/ 100{f.unit || 'g'}</span> · <span style={{ color: 'rgba(255,255,255,0.6)' }}>{f.p}P {f.c}C {f.f}F</span>
                                            </p>
                                        </div>
                                        <ChevronRight size={20} color="rgba(255,255,255,0.2)" />
                                    </div>
                                ))}
                                {foods.length === 0 && search.trim() !== '' && (
                                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                            <Search size={28} color="rgba(255,255,255,0.2)" />
                                        </div>
                                        <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600 }}>Nessun alimento trovato</p>
                                        <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>Prova a cercare un nome diverso o usa lo scanner.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex-col gap-6 animate-fade-in" style={{ paddingTop: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>

                        <div style={{
                            borderTop: '1px solid rgba(255,255,255,0.15)',
                            borderLeft: '1px solid rgba(255,255,255,0.05)',
                            borderRight: '1px solid rgba(0,0,0,0.3)',
                            borderBottom: '1px solid rgba(0,0,0,0.6)',
                            borderRadius: '24px', padding: '24px',
                            background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.7) 0%, rgba(15, 15, 20, 0.9) 100%)',
                            boxShadow: '0 12px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
                        }}>
                            <div className="flex-row justify-between items-start" style={{ marginBottom: '8px' }}>
                                <p className="text-label" style={{ color: '#FFDCA0' }}>Alimento selezionato</p>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedFood(null)} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '50%', width: '32px', height: '32px', marginTop: '-8px', marginRight: '-8px' }}>
                                    <X size={16} color="rgba(255,255,255,0.5)" />
                                </Button>
                            </div>
                            <h3 style={{ fontWeight: 800, fontSize: '1.4rem', color: '#fff', lineHeight: 1.2, marginBottom: '8px' }}>{selectedFood.name}</h3>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>{selectedFood.kcal} kcal ogni 100{selectedFood.unit || 'g'}</p>
                        </div>

                        <div className="flex-col gap-3">
                            <label style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Quantità ({selectedFood.unit || 'g'})
                            </label>
                            <Input
                                type="number"
                                value={grams}
                                onChange={e => setGrams(parseInt(e.target.value) || 0)}
                                autoFocus
                                style={{
                                    fontSize: '2.5rem', fontWeight: 800, textAlign: 'center', height: '90px',
                                    background: 'linear-gradient(135deg, rgba(8,8,10,0.9) 0%, rgba(15,15,20,0.8) 100%)',
                                    borderTop: '1px solid rgba(0, 0, 0, 0.9)',
                                    borderLeft: '1px solid rgba(0, 0, 0, 0.5)',
                                    borderRight: '1px solid rgba(255, 255, 255, 0.03)',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: '#fff',
                                    borderRadius: '24px',
                                    boxShadow: 'inset 0 6px 20px rgba(0,0,0,0.8), inset 0 2px 5px rgba(0,0,0,0.5)'
                                }}
                            />
                        </div>

                        <div className="flex-row gap-4" style={{ marginTop: '8px' }}>
                            {[
                                { label: 'KCAL', val: preview?.kcal, color: '#fff' },
                                { label: 'PRO', val: (preview?.p || 0) + 'g', color: '#FFDCA0' },
                                { label: 'CHO', val: (preview?.c || 0) + 'g', color: 'rgba(255,255,255,0.8)' },
                                { label: 'FAT', val: (preview?.f || 0) + 'g', color: 'rgba(255,255,255,0.4)' },
                            ].map(item => (
                                <div key={item.label} style={{
                                    flex: 1, textAlign: 'center',
                                    background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.4) 0%, rgba(15, 15, 20, 0.6) 100%)',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderLeft: '1px solid rgba(255, 255, 255, 0.03)',
                                    borderRight: '1px solid rgba(0, 0, 0, 0.2)',
                                    borderBottom: '1px solid rgba(0, 0, 0, 0.5)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
                                    padding: '16px 0', borderRadius: '16px'
                                }}>
                                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '4px' }}>{item.label}</p>
                                    <p style={{ fontWeight: 800, color: item.color, fontSize: '1.2rem' }}>{item.val}</p>
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: 'auto', paddingTop: '24px', paddingBottom: '72px' }}>
                            <button
                                className="csv-btn-food-glow"
                                onClick={handleAdd}
                                style={{
                                    width: '100%', height: '64px', borderRadius: '20px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                    fontSize: '1.1rem'
                                }}
                            >
                                <Plus size={22} color="#FFDCA0" /> Aggiungi Diario
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isScannerOpen && (
                <BarcodeScanner
                    onScanSuccess={handleScanSuccess}
                    onClose={() => setIsScannerOpen(false)}
                />
            )}
        </div>
    );
};

export default FoodSearch;
