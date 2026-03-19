-- ============================================================
-- CSV TEAM — STEP 1: CREATE TABLE + INDEXES + RLS
-- Run this FIRST in Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS food_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    brand TEXT,
    serving_type TEXT DEFAULT 'g',
    grams_per_serving NUMERIC(5,1) DEFAULT 100,
    calories_per_100g NUMERIC(6,1) NOT NULL,
    protein_per_100g NUMERIC(5,1) NOT NULL,
    carbs_per_100g NUMERIC(5,1) NOT NULL,
    fat_per_100g NUMERIC(5,1) NOT NULL,
    fiber_per_100g NUMERIC(5,1),
    raw_or_cooked TEXT DEFAULT 'na',
    verified BOOLEAN DEFAULT true,
    is_core BOOLEAN DEFAULT true,
    searchable_aliases TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_name ON food_items(name);
CREATE INDEX IF NOT EXISTS idx_food_category ON food_items(category);
CREATE INDEX IF NOT EXISTS idx_food_aliases ON food_items USING GIN(searchable_aliases);

ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read food_items" ON food_items;
CREATE POLICY "Anyone can read food_items" ON food_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anon can insert food_items" ON food_items;
CREATE POLICY "Anon can insert food_items" ON food_items FOR INSERT WITH CHECK (true);
