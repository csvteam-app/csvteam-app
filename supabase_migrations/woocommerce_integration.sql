-- =============================================================
-- INTEGRAZIONE WOOCOMMERCE — SQL Migration
-- CSV Team App · Supabase/PostgreSQL
-- =============================================================
-- Tabelle: shop_products
-- =============================================================

CREATE TABLE IF NOT EXISTS public.shop_products (
    id TEXT PRIMARY KEY, -- id di WooCommerce o id custom (es. 'wc_123', 'pk_s1')
    woo_id BIGINT UNIQUE, -- ID numerico reale da WooCommerce
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    type TEXT NOT NULL, -- 'singola', 'coppia', 'coaching', 'deal'
    amount INTEGER NOT NULL DEFAULT 1, -- numero di crediti lezione O numero di mesi di abbonamento
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

-- Lettura pubblica per gli utenti autenticati
CREATE POLICY "Anyone can read active shop products" ON public.shop_products
    FOR SELECT USING (is_active = true);

-- Modifica riservata agli admin
CREATE POLICY "Only admins can modify shop products" ON public.shop_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
