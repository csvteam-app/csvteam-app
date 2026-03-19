import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Loader, Check, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import Button from '../ui/Button';

const mapFood = (row) => ({
    id: row.id,
    name: row.name,
    kcal: Number(row.calories_per_100g) || 0,
    p: Number(row.protein_per_100g) || 0,
    c: Number(row.carbs_per_100g) || 0,
    f: Number(row.fat_per_100g) || 0,
    unit: row.serving_type || 'g',
});

const VoiceLoggerModal = ({ meal, onAddMultiple, onClose }) => {
    const { isListening, transcript, error, startListening, stopListening, hasSupport } = useSpeechRecognition();
    const [parsedMatchedFoods, setParsedMatchedFoods] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [hasStartedManuelly, setHasStartedManually] = useState(false);
    const [fallbackText, setFallbackText] = useState('');

    const handleManualStopAndProcess = () => {
        stopListening();
        if (transcript.trim().length > 0) {
            processTranscript(transcript);
        }
    };

    const processTranscript = async (finalText) => {
        setIsProcessing(true);

        try {
            const openAiKey = import.meta.env.VITE_OPENAI_API_KEY;

            if (!openAiKey) {
                throw new Error("Chiave OpenAI mancante nel file .env.local");
            }

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openAiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: `Sei un eccellente assistente nutrizionista d'élite ("stile Apple"). Il tuo compito è estrarre chirurgicamente gli alimenti e le quantità in grammi partendo da testi naturali trascritti da voce (in italiano).

REGOLE CRITICHE:
1. Restituisci SOLO un JSON valido (un array di oggetti), senza markdown, senza backtick, senza saluti.
2. Identifica sia cibi singoli che pasti composti (es: "pasta al sugo" -> "pasta" e "sugo al pomodoro", oppure solo "pasta al pomodoro" se è un piatto unico).
3. STIMA LE QUANTITÀ: se l'utente usa misure generiche, traduci IN GRAMMI usando queste medie italiane:
   - "Un panino" (vuoto) = 80g
   - "Un panino con X" = panino 80g + X (es. fetta carne 150g, fetta formaggio 30g)
   - "Una fettina di carne / petto di pollo" = 150g
   - "Una mela / un frutto" = 150g
   - "Un cucchiaio d'olio" = 10g
   - "Un bicchiere di vino/succo" = 150g
   - "Una tazzina di caffè" = 30g
   - "Un piatto di pasta" = 100g cruda (ma restituisci sempre il nome pulito senza specificare cruda a meno che non richiesto).
   - "Una pizza" = 1 pizza (traducilo come 300g per default) 
4. PULIZIA DEL NOME: Il nome del cibo restituito deve essere SEMPLICE e PULITO, perché poi sarà usato per fare una ricerca nel database.
   - SBAGLIATO: "una fettina di manzo" -> CORRETTO: "manzo"
   - SBAGLIATO: "un po' di parmigiano" -> CORRETTO: "parmigiano reggiano"
   - SBAGLIATO: "un uovo" -> CORRETTO: "uovo intero" (e stima 50g)
   - SBAGLIATO: "100g di pasta" -> CORRETTO: "pasta"
5. IGNORA CHIACCHIERE: Ignora frasi come "ho mangiato", "per finire", "oggi a pranzo".
6. CIBI COMPOSTI NASCOSTI: Se dice "Cappuccino e cornetto", restituisci 2 oggetti separati. 

FORMATO JSON ATTESO:
[
  { "food_name": "petto di pollo", "grams": 200, "original_query": "200 grammi di pezzetti di pollo" },
  { "food_name": "olio extravergine", "grams": 10, "original_query": "un filo d'olio" }
]`
                        },
                        {
                            role: "user",
                            content: finalText
                        }
                    ],
                    temperature: 0.1
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || "Errore di rete con OpenAI");
            }

            const dataObj = await response.json();
            const aiMessage = dataObj.choices[0].message.content;

            let queries = [];
            try {
                const cleanedStr = aiMessage.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
                queries = JSON.parse(cleanedStr);
            } catch (e) {
                throw new Error("Formato risposta AI non valido.");
            }

            let matches = [];

            for (const item of queries) {
                const { data } = await supabase
                    .from('food_items')
                    .select('id, name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, serving_type')
                    .ilike('name', `%${item.food_name}%`)
                    .limit(1);

                if (data && data.length > 0) {
                    matches.push({
                        food: mapFood(data[0]),
                        grams: item.grams,
                        originalQuery: item.original_query || item.food_name
                    });
                } else {
                    const words = item.food_name.split(' ');
                    if (words.length > 1) {
                        const { data: fallbackData } = await supabase
                            .from('food_items')
                            .select('id, name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, serving_type')
                            .ilike('name', `%${words[0]}%`)
                            .limit(1);

                        if (fallbackData && fallbackData.length > 0) {
                            matches.push({
                                food: mapFood(fallbackData[0]),
                                grams: item.grams,
                                originalQuery: item.original_query || item.food_name
                            });
                        }
                    }
                }
            }
            setParsedMatchedFoods(matches);
        } catch (err) {
            console.error("Errore durante il parsing AI:", err);
            alert("Errore AI: " + err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmAll = () => {
        onAddMultiple(parsedMatchedFoods.map(m => ({ food: m.food, grams: m.grams })));
        onClose();
    };

    const handleFallbackSubmit = (e) => {
        e.preventDefault();
        if (fallbackText.trim()) {
            processTranscript(fallbackText);
        }
    };

    if (!hasSupport) {
        return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', padding: '20px' }} onClick={onClose}>
                <div className="flex-col gap-4 text-center" style={{ background: 'rgba(18, 18, 18, 0.98)', border: '1px solid rgba(255,255,255,0.12)', padding: '32px 24px', borderRadius: '16px', maxWidth: '420px', width: '100%' }} onClick={e => e.stopPropagation()}>
                    <h3 className="text-h3 w-full text-left" style={{ marginBottom: '-8px' }}>Log Rapido ({meal})</h3>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', textAlign: 'left', marginBottom: '8px' }}>
                        Il microfono non è supportato qui (iOS/Safari). Descrivi il pasto:
                    </p>

                    {isProcessing ? (
                        <div className="flex-col gap-4 items-center justify-center p-8 text-center" style={{ minHeight: '150px' }}>
                            <Loader className="animate-spin" size={32} color="var(--accent-gold)" />
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Elaborazione e ricerca alimenti in corso...</p>
                        </div>
                    ) : parsedMatchedFoods.length > 0 ? (
                        <div className="flex-col gap-4 animate-fade-in text-left">
                            <p className="text-label" style={{ color: 'var(--accent-gold)' }}>Trovati {parsedMatchedFoods.length} alimenti</p>
                            <div className="flex-col gap-3 max-h-[40vh] overflow-y-auto hide-scrollbar">
                                {parsedMatchedFoods.map((match, i) => (
                                    <div key={i} className="flex-row justify-between items-center" style={{ background: 'var(--surface-color-2)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                        <div className="flex-col">
                                            <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{match.food.name}</p>
                                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Rilevato da "{match.originalQuery}"</p>
                                        </div>
                                        <div className="flex-col items-end">
                                            <p style={{ fontWeight: 800, color: 'var(--accent-gold)', fontSize: '1.1rem' }}>{match.grams}g</p>
                                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>{Math.round((match.food.kcal * match.grams) / 100)} kcal</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex-row gap-3 pt-4 border-t border-white/10">
                                <Button variant="ghost" onClick={() => { setParsedMatchedFoods([]); setFallbackText(''); }} style={{ flex: 1 }}>Annulla</Button>
                                <Button variant="primary" onClick={handleConfirmAll} style={{ flex: 2 }}><Check size={18} /> Conferma</Button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleFallbackSubmit} className="flex-col gap-4">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <input
                                    type="text"
                                    value={fallbackText}
                                    onChange={(e) => setFallbackText(e.target.value)}
                                    placeholder="Es: 150g petto di pollo e 50g riso basmati"
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#fff',
                                        fontSize: '1rem',
                                        outline: 'none'
                                    }}
                                    autoFocus
                                />
                            </div>
                            <div className="flex-row gap-3 mt-2">
                                <Button variant="ghost" onClick={onClose} type="button" style={{ flex: 1 }}>Chiudi</Button>
                                <Button variant="primary" type="submit" disabled={!fallbackText.trim()} style={{ flex: 2 }}>Elabora Testo</Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', padding: '20px' }}
            onClick={onClose}
        >
            <div
                className="animate-fade-in flex-col gap-5"
                style={{ background: 'rgba(18, 18, 18, 0.98)', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 24px 48px rgba(0,0,0,0.5)', borderRadius: 'var(--border-radius-lg)', padding: '24px', width: '100%', maxWidth: '420px', maxHeight: '85vh', overflowY: 'auto' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex-row justify-between items-center">
                    <h3 className="text-h2">Aggiunta Vocale ({meal})</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
                </div>

                {isListening ? (
                    <div className="flex-col gap-6 items-center justify-center p-6 text-center">
                        <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div className="dopamine-glow" style={{ position: 'absolute', inset: 0, borderRadius: '50%', animation: 'breathe 1.5s ease-in-out infinite alternate', background: 'rgba(255,215,0,0.2)' }} />
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, boxShadow: '0 0 20px rgba(255,215,0,0.4)', animation: 'pulse 1s infinite alternate' }} onClick={stopListening}>
                                <Mic size={28} color="#000" />
                            </div>
                        </div>
                        <div className="flex-col gap-2">
                            <p style={{ color: '#fff', fontWeight: 600 }}>In ascolto...</p>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', fontStyle: 'italic', minHeight: '40px' }}>
                                {transcript || 'Parla ora... (es: "200g di pollo")'}
                            </p>
                        </div>
                        {error && (
                            <div style={{ padding: '8px 12px', background: 'rgba(255,100,100,0.1)', border: '1px solid var(--accent-coral)', borderRadius: '8px', marginTop: '8px' }}>
                                <p style={{ color: 'var(--accent-coral)', fontSize: '0.8rem', fontWeight: 600 }}>{error}</p>
                            </div>
                        )}
                        <Button variant="primary" onClick={handleManualStopAndProcess} fullWidth>Analizza Pasto</Button>
                    </div>
                ) : isProcessing ? (
                    <div className="flex-col gap-4 items-center justify-center p-8 text-center">
                        <Loader className="animate-spin" size={32} color="var(--accent-gold)" />
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Elaborazione vocale e ricerca alimenti in corso...</p>
                    </div>
                ) : parsedMatchedFoods.length > 0 ? (
                    <div className="flex-col gap-4 animate-fade-in">
                        <p className="text-label" style={{ color: 'var(--accent-gold)' }}>Trovati {parsedMatchedFoods.length} alimenti</p>
                        <div className="flex-col gap-3 max-h-[40vh] overflow-y-auto hide-scrollbar">
                            {parsedMatchedFoods.map((match, i) => (
                                <div key={i} className="flex-row justify-between items-center" style={{ background: 'var(--surface-color-2)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div className="flex-col">
                                        <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{match.food.name}</p>
                                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Rilevato da "{match.originalQuery}"</p>
                                    </div>
                                    <div className="flex-col items-end">
                                        <p style={{ fontWeight: 800, color: 'var(--accent-gold)', fontSize: '1.1rem' }}>{match.grams}g</p>
                                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>{Math.round((match.food.kcal * match.grams) / 100)} kcal</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex-row gap-3 pt-2">
                            <Button variant="ghost" onClick={startListening} style={{ flex: 1 }}>Riprova</Button>
                            <Button variant="primary" onClick={handleConfirmAll} style={{ flex: 2 }}><Check size={18} /> Conferma Pasto</Button>
                        </div>
                    </div>
                ) : !hasStartedManuelly ? (
                    <div className="flex-col gap-4 items-center justify-center p-6 text-center">
                        <Mic size={32} color="var(--accent-gold)" />
                        <p style={{ color: '#fff', fontWeight: 600, fontSize: '1rem' }}>Tocca Avvia e parla</p>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Safari chiuderà il microfono dopo le pause.<br />Se succede, tocca "Analizza Pasto" per processare quello che ha sentito finora.</p>
                        <Button variant="primary" onClick={() => { setHasStartedManually(true); startListening(); }} fullWidth><Mic size={18} /> Avvia Registrazione</Button>
                    </div>
                ) : (
                    <div className="flex-col gap-4 items-center justify-center p-6 text-center">
                        <Info size={32} color="rgba(255,255,255,0.4)" />
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Non ho riconosciuto nessun alimento valido dal tuo audio.</p>
                        <p style={{ fontWeight: 500, color: '#fff', fontSize: '0.85rem' }}>"{transcript}"</p>
                        <Button variant="primary" onClick={() => { setHasStartedManually(true); startListening(); }} fullWidth>Riprova a registrare</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoiceLoggerModal;
