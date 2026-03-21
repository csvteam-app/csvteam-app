import "jsr:@supabase/functions-js/edge-runtime.api.d.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import OpenAI from "https://deno.land/x/openai@v4.28.0/mod.ts";

const apiKey = Deno.env.get("OPENAI_API_KEY");

const openai = new OpenAI({
  apiKey: apiKey,
});

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req.headers.get('Origin'));

  // Gestione OPTIONS per CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    // ──────────────────────────────────────────────────────────────────
    // 🔒 AUTENTICAZIONE: verifica JWT Supabase
    // ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const jwt = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ──────────────────────────────────────────────────────────────────
    // Parsing e validazione input
    // ──────────────────────────────────────────────────────────────────
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return new Response(JSON.stringify({ error: "Transcript mancante o invalido" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Limita la lunghezza del transcript (evita abuse, max ~2000 caratteri)
    if (transcript.length > 2000) {
      return new Response(JSON.stringify({ error: "Transcript troppo lungo. Massimo 2000 caratteri." }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OpenAI API Key mancante sul server." }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Facciamo la chiamata ad OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Veloce ed economico
      messages: [
        {
          role: "system",
          content: `Sei un eccellente assistente nutrizionista. Il tuo compito è estrarre in modo chirurgico gli alimenti e le relative quantità in grammi partendo da testi naturali trascritti da voce (solitamente in italiano).

REGOLE CRITICHE:
1. Restituisci SOLO un JSON valido, senza testo introduttivo o markup code block (niente \`\`\`json).
2. L'output deve essere un array di oggetti. Ogni oggetto rappresenta un singolo ingrediente/alimento.
3. Se l'utente usa misure generiche (es. "un panino", "una fetta di manzo", "un cucchiaio di olio", "un misurino di whey"), stima tu il peso in grammi basandoti su porzioni medie standard da nutrizionista. Esempio: un panino vuoto standard pesa circa 80g; una fetta di carne 120g; un cucchiaio d'olio 10g-15g; un misurino di whey 30g; una mela 150g.
4. Pulisci il nome del cibo rimuovendo frasi di contorno (es: "ho mangiato una mela" -> "mela").
5. Assicurati che il nome sia ottimizzato per cercare poi nel database (es. stringa semplice e chiave).

FORMATO JSON ATTESO:
[
  { "food_name": "petto di pollo", "grams": 200, "original_query": "200 grammi di petto di pollo" },
  { "food_name": "olio extravergine di oliva", "grams": 15, "original_query": "un cucchiaio d'olio evo" }
]

ESEMPIO 1: "ho mangiato un panino con una fettina di manzo e un po di ketchup" -> Estrai pane (es. 80g), manzo fetta (es. 120g), ketchup (es. 15g).
ESEMPIO 2: "due uova strapazzate" -> uovo intero (es. 120g poiché 1 uovo = 60g).
`
        },
        {
          role: "user",
          content: transcript
        }
      ],
      temperature: 0.1, // Bassa temperatura per risposte deterministiche e precise
    });

    const aiMessage = response.choices[0].message.content;
    let parsedResult;
    
    try {
        parsedResult = JSON.parse(aiMessage!);
    } catch(_e) {
        // Se per qualche motivo ha messo markup o ha failato
        const cleanedStr = aiMessage!.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        parsedResult = JSON.parse(cleanedStr);
    }

    return new Response(
      JSON.stringify({ results: parsedResult }),
      {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      }
    );

  } catch (err: unknown) {
    const cors = getCorsHeaders();
    console.error("Error calling OpenAI:", err);
    const errorMessage = err instanceof Error ? err.message : "Sconosciuto";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
