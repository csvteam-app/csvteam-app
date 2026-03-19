import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Mock dati di Fallback se la tabella shop_products è vuota (prima sync)
const MOCK_SINGLE = [
    { id: 'pk_s1', type: 'singola', amount: 1, name: '1 Lezione Singola', price: 44.90 },
    { id: 'pk_s3', type: 'singola', amount: 3, name: '3 Lezioni Singole', price: 119.90 },
    { id: 'pk_s10', type: 'singola', amount: 10, name: '10 Lezioni Singole', price: 349.90 },
];

const MOCK_PAIR = [
    { id: 'pk_c1', type: 'coppia', amount: 1, name: '1 Lezione Coppia', price: 29.90 },
    { id: 'pk_c3', type: 'coppia', amount: 3, name: '3 Lezioni Coppia', price: 74.90 },
    { id: 'pk_c10', type: 'coppia', amount: 10, name: '10 Lezioni Coppia', price: 219.00 },
];

const MOCK_COACHING = [
    { id: 'coach_3m', type: 'coaching', amount: 3, name: 'Trimestrale', price: 219.00 },
    { id: 'coach_6m', type: 'coaching', amount: 6, name: 'Semestrale', price: 399.00 },
    { id: 'coach_12m', type: 'coaching', amount: 12, name: 'Annuale', price: 649.00 },
];

export function useShop() {
    const [products, setProducts] = useState({
        single: [],
        pair: [],
        coaching: [],
        deals: []
    });
    const [isLoading, setIsLoading] = useState(true);

    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('shop_products')
                .select('*')
                .eq('is_active', true)
                .order('price', { ascending: true });

            if (error) {
                // Se la tabella non esiste ancora, gestiamo l'errore in modo silenzioso
                if (error.code === '42P01') {
                    console.log('Tabella shop_products non ancora creata, uso mock.');
                    setProducts({ single: MOCK_SINGLE, pair: MOCK_PAIR, coaching: MOCK_COACHING, deals: [] });
                    return;
                }
                throw error;
            }

            if (!data || data.length === 0) {
                // Nessun prodotto dal DB, uso i mock per non svuotare il negozio
                console.log('Nessun prodotto in DB, uso mock.');
                setProducts({ single: MOCK_SINGLE, pair: MOCK_PAIR, coaching: MOCK_COACHING, deals: [] });
                return;
            }

            const categorized = { single: [], pair: [], coaching: [], deals: [] };

            data.forEach(p => {
                if (p.type === 'singola') categorized.single.push(p);
                else if (p.type === 'coppia') categorized.pair.push(p);
                else if (p.type === 'coaching') categorized.coaching.push(p);
                else categorized.deals.push(p);
            });

            // Assicuriamoci che l'ordinamento per le lezioni segua l'amount e non solo il prezzo
            categorized.single.sort((a, b) => a.amount - b.amount);
            categorized.pair.sort((a, b) => a.amount - b.amount);
            categorized.coaching.sort((a, b) => a.amount - b.amount);

            setProducts(categorized);
        } catch (err) {
            console.error('Error fetching shop products:', err);
            // Fallback in caso d'errore
            setProducts({ single: MOCK_SINGLE, pair: MOCK_PAIR, coaching: MOCK_COACHING, deals: [] });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    return { products, isLoading, refreshProducts: fetchProducts };
}
