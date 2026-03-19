-- ============================================================
-- FIX: Coach non vede gli atleti
-- Problema: RLS su "profiles" blocca la lettura cross-utente
-- Soluzione: permettere a tutti gli utenti autenticati di LEGGERE i profili
-- ============================================================

-- 1. Rimuovi le vecchie policy restrittive su profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_all_access" ON profiles;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;

-- 2. Abilita RLS (potrebbe essere già attiva)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Crea policy corrette:
--    SELECT: tutti gli utenti autenticati possono leggere TUTTI i profili (necessario per il coach)
CREATE POLICY "Authenticated users can read all profiles"
    ON profiles FOR SELECT
    TO authenticated
    USING (true);

--    INSERT: tutti possono inserire il proprio profilo
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

--    UPDATE: ogni utente può aggiornare SOLO il proprio profilo
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. Correggi i profili esistenti: imposta full_name dove è NULL
UPDATE profiles
SET full_name = COALESCE(full_name, name, email, 'Atleta')
WHERE full_name IS NULL OR full_name = '';

-- 5. Assicurati che tutti gli account senza ruolo diventino atleti
UPDATE profiles
SET role = 'athlete'
WHERE role IS NULL;

-- 6. Il default per nuovi utenti
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'athlete';

-- ============================================================
-- DONE! Ora il coach potra vedere tutti gli atleti.
-- ============================================================
