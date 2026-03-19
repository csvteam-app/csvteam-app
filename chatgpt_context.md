# Progetto: CSV Team App (Elite Bodybuilding Coaching App)
Ti sto fornendo l'intera architettura, il design system e la logica di backend dell'app "CSV Team". Sei l'IA di supporto incaricata di aiutarmi a espandere il frontend React (Vite + Tailwind/CSS Modules) e comprendere l'ecosistema Supabase che abbiamo già costruito.

Di seguito trovi tutte le specifiche. **Leggile attentamente e memorizzale. Quando hai finito, rispondimi solo con: "Ho letto e memorizzato l'intera architettura CSV Team. Pronto per iniziare."**

---

## 1. VISION & CORE PHILOSOPHY
L'app è un sistema di Online Coaching premium (non un generico tracker fitness). 
- **Stile UI:** "Dark Luxury Glassmorphism". Fondo scuro (`#0f0f11`), bordi traslucidi in rgba bianco, riflessi, palette accenti oro, rosso corallo e acquamarina.
- **Micro-interazioni:** Ogni click, completamento e interazione deve sembrare premium, fluido (spring physics p.es. con Framer Motion) e dare feedback aptico/visivo.
- **Workflow Coach-Atleta:** Il coach non deve perdere tempo. Tutto è monitorato tramite **Semafori (Traffic Lights)** e percentuali di aderenza. Il client (Atleta) viene guidato gamificando il suo percorso.

---

## 2. DESIGN SYSTEM & TOKENS (CSS)
Tutti i componenti UI (Card, Input, Button) utilizzano i seguenti token globali definiti nel nostro `index.css`:
- **Colori Primari:** `--bg-color: #0f0f11`; `--surface-color-1: rgba(255,255,255,0.03)`; `--accent-gold: rgba(212, 175, 55, 1)`.
- **Status Tokens (Importantissimi per UI Backend-driven):**
  - Green: `--status-green: #22c55e`, `--status-green-soft: rgba(34, 197, 94, 0.15)`, `--status-green-text: #bbf7d0`
  - Yellow: `--status-yellow: #eab308`, `--status-yellow-soft: rgba(234, 179, 8, 0.15)`, `--status-yellow-text: #fef08a`
  - Red: `--status-red: #ef4444`, `--status-red-soft: rgba(239, 68, 68, 0.15)`, `--status-red-text: #fecaca`
  - Gray: `--status-gray: #71717a`, `--status-gray-soft: rgba(113, 113, 122, 0.15)`, `--status-gray-text: #e4e4e7`

---

## 3. ARCHITETTURA DI BACKEND (Supabase / Postgres)
Abbiamo strutturato il DB per essere "Smart". Il frontend leggerà View pre-calcolate, senza fare logica pesante.

### A. Profiles & Auth
- Tabella `profiles`: Gestisce id, user (atleta o coach), tier, `csv_points` (moneta virtuale).
- Relazioni: `coach_athlete_assignments` unisce coach e atleti (`status = 'active'`).

### B. Nutrition & Diet (Phases 2-4)
- `food_items`: Database di ~250 alimenti iper-curati per il bodybuilding. Niente calorie vuote. Usiamo `searchable_aliases` per ricerca semantica.
- `nutrition_targets`: Obiettivi (Kcal, Pro, Cho, Fat) assegnati dal coach. Ha uno storico (`start_date`, `end_date`).
- `daily_logs` e `log_meal_items`: Istantanea reale dei macro loggati dall'atleta in un dato giorno. Scatta uno "snapshot" dei target giornalieri per blindare lo storico (se il coach cambia i macro oggi, i log di ieri non si corrompono).

### C. Training & Logbook
- Programmazione: `programs` -> `program_days` -> `program_exercises`.
- Logbook Reale: `workout_logs` (una transazione per intero WO completato) ed `exercise_logs` (ogni singola serie, kg sollevati e RPE/RIR).

### D. Analytics & Smart Alerts (Phase 5-7 - Il cuore per il Coach)
Abbiamo creato delle Supabase Views e Tabelle magiche per la Coach Dashboard:
- `nutrition_alert_rules`: Regole tipo "Se i log calano sotto l'80% per 7 giorni, attiva alert ROSSO per Low Logging".
- `client_nutrition_daily_metrics`: Vista con l'aderenza Giorno-per-Giorno (es. "Ha colpito 95% delle Pro, 102% dei CHO").
- **`api_coach_dashboard`**: LA SINGOLA VISTA DA CHIAMARE A FRONTEND. Ritorna il *Traffic Light System*. Espone ogni cliente con il suo "overall_status_code" (red/yellow/green), i token UI CSS pronti per React (es. `overall_bg_token`), i label ("Critical", "On Track", "Da riallineare" per l'atleta) e lo *Score Composito* del coach (40% nutrizione, 35% allenamento, 25% performance).

---

## 4. SISTEMA DI GAMIFICATION (Shop & "CSV Points")
Al posto dei classici punti noiosi, abbiamo creato una vera economia interna:
- Valuta: I `csv_points` vengono guadagnati completando sfide e aderendo al piano.
- Rappresentazione Visiva: Abbiamo creato un `<Coin3D />` React Component usando tecniche avanzate JS/CSS Masking (non una semplice immagine png, la moneta ruota e reagisce al mouse in stile Apple/Vercel).
- **Lo Shop (`/shop`)**: Strutturato in 3 schede:
  1. *Pacchetti Negozio*: Premium shop per servizi offline (Pacchetti Check-in, Personal Training, Eventi).
  2. *My Boosts (Inventario)*: Items a consumo stile Videogioco per "hackerare" l'aderenza (es. "Cheat Meal Pass" immunità al calo punteggio x 1 pasto, oppure "Skip Leg Day Pass" umoristico). I boost hanno durata limitata o stack.

---

## 5. UI COMPONENTS DA USARE
Per costruire i layout React, hai a disposizione i seguenti wrapper già creati in `/src/components/ui/`:
- `<Card glass>`: Base per il 90% degli elementi in pagina. Traslucida, bordo 1px chiaro, blur.
- `<Button variant="primary|ghost|outline|secondary">`: Primario accentuato (gold o brand), secondary grigio vetro, ghost no-bg in hover.
- `<Input>`, `<Badge>`, e icone prese da `lucide-react`.

---
**Queste sono le fondamenta. Ogni nuovo modulo React che scriveremo (o query SQL) deve rigorosamente innestarsi su queste fondamenta senza violare la UI lussuosa e i contratti backend.**
**Rispondimi solo: "Ho letto e memorizzato l'intera architettura CSV Team. Pronto per iniziare."**
