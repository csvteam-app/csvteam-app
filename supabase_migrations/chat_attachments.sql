-- Migration per supportare allegati multimediali nella chat (stile WhatsApp)

-- 1. Aggiungiamo le colonne alla tabella chat_messages
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT; -- es: 'image', 'video', 'audio'

-- 2. Creiamo il bucket di storage per gli allegati della chat se non esiste
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat_attachments', 'chat_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Policy per permettere agli utenti autenticati di caricare e leggere dal bucket
DROP POLICY IF EXISTS "Authenticated users can upload chat attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat_attachments');

DROP POLICY IF EXISTS "Public chat attachments are viewable by everyone" ON storage.objects;
CREATE POLICY "Public chat attachments are viewable by everyone"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat_attachments');
