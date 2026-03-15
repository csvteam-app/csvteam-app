import re
import os

with open('/Users/danielecasavecchia/Desktop/csvteam-app/homepage-v2.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the new quiz code
new_quiz = """<!-- ═══════════════════════════════════════════════════════════════════════
     CSV PHYSIQUE ANALYSIS™ - ELEMENTOR COMPONENT UPDATE (SCALES UPDATED)
     Insert this specific block to replace the existing Section 4 (Quiz).
     ═══════════════════════════════════════════════════════════════════════ -->
<style>
  /* ── SECTION 4: PHYSIQUE ANALYSIS (QUIZ UPDATE) ── */
  .csv-quiz-container { position: relative; width: 100%; margin-top: 24px; }
  
  /* Progress Indicator */
  .quiz-progress { display: flex; justify-content: center; gap: 8px; margin-bottom: 32px; flex-wrap: wrap; }
  .quiz-dot { width: 32px; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.1); transition: background 0.3s, box-shadow 0.3s; }
  .quiz-dot.active { background: #D4AF37; box-shadow: 0 0 8px rgba(212,175,55,0.4); }
  .quiz-dot.completed { background: rgba(212,175,55,0.5); }

  /* Frame Anim & Display */
  .quiz-step { display: none; animation: fadeInForm 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .quiz-step.active { display: block; }
  @keyframes fadeInForm { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

  /* Silhouette Grid Options (Steps 1-4) */
  .quiz-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin: 32px 0; }
  .quiz-card-opt { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 16px 12px; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; text-align: center; }
  .quiz-card-opt:hover { border-color: rgba(212,175,55,0.4); background: rgba(212,175,55,0.05); transform: translateY(-2px); }
  .quiz-card-opt.selected { border-color: #D4AF37; background: rgba(212,175,55,0.08); box-shadow: 0 4px 20px rgba(212,175,55,0.15); }
  .quiz-card-opt img { width: 100%; max-width: 90px; height: 140px; object-fit: contain; margin-bottom: 16px; opacity: 0.6; transition: opacity 0.2s, filter 0.2s; }
  .quiz-card-opt.selected img, .quiz-card-opt:hover img { opacity: 1; filter: drop-shadow(0 0 8px rgba(255,255,255,0.1)); }
  .quiz-opt-title { font-weight: 800; font-size: 0.85rem; margin-bottom: 6px; color: #fff; line-height: 1.2; }
  .quiz-opt-desc { font-size: 0.7rem; color: rgba(255,255,255,0.45); line-height: 1.35; }

  /* Pill Options (Steps 5-6) */
  .quiz-pills { display: flex; flex-direction: column; gap: 12px; margin: 32px auto; max-width: 400px; }
  .quiz-pill { padding: 16px 24px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.7); font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; text-align: center; }
  .quiz-pill:hover { border-color: rgba(212,175,55,0.4); color: #fff; background: rgba(255,255,255,0.06); }
  .quiz-pill.selected { background: linear-gradient(135deg, rgba(212,175,55,0.15), rgba(184,134,11,0.05)); border-color: #D4AF37; color: #D4AF37; box-shadow: 0 4px 15px rgba(212,175,55,0.1); }

  /* Navigation Buttons */
  .quiz-nav { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 24px; }
  .quiz-nav-btn { background: transparent; border: none; color: rgba(255,255,255,0.5); font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: color 0.2s; font-family: 'Inter', sans-serif; }
  .quiz-nav-btn:hover { color: #fff; }
  .quiz-nav-next { background: #D4AF37; color: #000; padding: 12px 28px; border-radius: 12px; font-weight: 800; }
  .quiz-nav-next:hover:not(:disabled) { background: #F5DEB3; box-shadow: 0 4px 15px rgba(212,175,55,0.3); transform: translateY(-2px); }
  .quiz-nav-next:disabled { opacity: 0.3; cursor: not-allowed; box-shadow: none; background: rgba(255,255,255,0.2); color: rgba(255,255,255,0.5); transform: none; }

  /* Success Message */
  .quiz-success-msg { display: none; text-align: center; padding: 40px 20px; }
  .quiz-success-msg.active { display: block; animation: fadeInForm 0.6s ease forwards; }

  /* Extra style state for disabled submit button */
  .quiz-submit-btn:disabled { opacity: 0.3; cursor: not-allowed; box-shadow: none; background: rgba(255,255,255,0.2) !important; color: rgba(255,255,255,0.5) !important; transform: none !important; }

  /* Mobile Wrapping */
  @media (max-width: 768px) {
    .quiz-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; margin: 24px 0; }
    .quiz-card-opt:last-child { grid-column: span 2; max-width: 200px; margin: 0 auto; } /* Center the 5th card */
    .quiz-dot { width: 20px; }
    .quiz-opt-title { font-size: 0.8rem; }
  }
</style>

<section class="csv-quiz" id="physique-analysis">
  <div class="quiz-card glass">
    <p class="section-label" style="text-align:center;">STRUMENTO ESCLUSIVO</p>
    <h2 style="text-align:center;">CSV Physique Analysis™</h2>
    
    <div class="csv-quiz-container" id="csv-quiz-wrap">
      
      <!-- Progress Bar (7 Steps) -->
      <div class="quiz-progress" id="quiz-progress">
        <div class="quiz-dot active"></div>
        <div class="quiz-dot"></div>
        <div class="quiz-dot"></div>
        <div class="quiz-dot"></div>
        <div class="quiz-dot"></div>
        <div class="quiz-dot"></div>
        <div class="quiz-dot"></div>
      </div>

      <form id="physiqueForm" onsubmit="handlePhysiqueFormSubmit(event)">
        <!-- Hidden Inputs for logic -->
        <input type="hidden" id="bf_current" name="bf_current">
        <input type="hidden" id="muscle_current" name="muscle_current">
        <input type="hidden" id="bf_target" name="bf_target">
        <input type="hidden" id="muscle_target" name="muscle_target">
        <input type="hidden" id="training_frequency" name="training_frequency">
        <input type="hidden" id="commitment_level" name="commitment_level">

        <!-- ──────────────────────────────────────────────────────────
             STEP 1: BODY FAT CURRENT
             ────────────────────────────────────────────────────────── -->
        <div class="quiz-step active" data-step="1">
          <h3 style="font-size:1.3rem; font-weight:800; margin-bottom:8px;">Quale livello di grasso corporeo descrive meglio il tuo fisico attuale?</h3>
          <p class="quiz-opt-desc" style="font-size:0.9rem; margin-bottom:16px;">
            Per ricevere una stima attendibile, scegli la situazione che ti rappresenta oggi nel modo più realistico possibile.
          </p>
          
          <div class="quiz-grid">
            <div class="quiz-card-opt" data-input="bf_current" data-value="1" onclick="selectCardOption(this)">
              <img src="/images/bf1.png" alt="Molto alta">
              <div class="quiz-opt-title">Molto alta</div>
              <div class="quiz-opt-desc">accumulo evidente di grasso corporeo</div>
            </div>
            <div class="quiz-card-opt" data-input="bf_current" data-value="2" onclick="selectCardOption(this)">
              <img src="/images/bf2.png" alt="Alta">
              <div class="quiz-opt-title">Alta</div>
              <div class="quiz-opt-desc">condizione di sovrappeso</div>
            </div>
            <div class="quiz-card-opt" data-input="bf_current" data-value="3" onclick="selectCardOption(this)">
              <img src="/images/bf3.png" alt="Leggermente alta">
              <div class="quiz-opt-title">Leggermente alta</div>
              <div class="quiz-opt-desc">presenza di fianchetti o cuscinetti localizzati</div>
            </div>
            <div class="quiz-card-opt" data-input="bf_current" data-value="4" onclick="selectCardOption(this)">
              <img src="/images/bf4.png" alt="Normale">
              <div class="quiz-opt-title">Normale</div>
              <div class="quiz-opt-desc">composizione media ed equilibrata</div>
            </div>
            <div class="quiz-card-opt" data-input="bf_current" data-value="5" onclick="selectCardOption(this)">
              <img src="/images/bf5.png" alt="Bassa">
              <div class="quiz-opt-title">Bassa</div>
              <div class="quiz-opt-desc">fisico già abbastanza asciutto</div>
            </div>
          </div>
          <div class="quiz-nav" style="justify-content: flex-end;">
            <button type="button" class="quiz-nav-btn quiz-nav-next" onclick="navQuiz(1)" disabled>Avanti →</button>
          </div>
        </div>

        <!-- ──────────────────────────────────────────────────────────
             STEP 2: MUSCLE TONE CURRENT
             ────────────────────────────────────────────────────────── -->
        <div class="quiz-step" data-step="2">
          <h3 style="font-size:1.3rem; font-weight:800; margin-bottom:8px;">Quanto tono muscolare descrive meglio il tuo fisico attuale?</h3>
          <p class="quiz-opt-desc" style="font-size:0.9rem; margin-bottom:16px;">
            Per ricevere una stima attendibile, scegli la situazione che ti rappresenta oggi nel modo più realistico possibile.
          </p>
          
          <div class="quiz-grid">
            <div class="quiz-card-opt" data-input="muscle_current" data-value="1" onclick="selectCardOption(this)">
              <img src="/images/muscle1.png" alt="Poco tonico">
              <div class="quiz-opt-title">Poco tonico</div>
              <div class="quiz-opt-desc">poca muscolatura visibile</div>
            </div>
            <div class="quiz-card-opt" data-input="muscle_current" data-value="2" onclick="selectCardOption(this)">
              <img src="/images/muscle2.png" alt="Normale">
              <div class="quiz-opt-title">Normale</div>
              <div class="quiz-opt-desc">struttura media, poco definita</div>
            </div>
            <div class="quiz-card-opt" data-input="muscle_current" data-value="3" onclick="selectCardOption(this)">
              <img src="/images/muscle3.png" alt="Leggermente tonico">
              <div class="quiz-opt-title">Leggermente tonico</div>
              <div class="quiz-opt-desc">primi segni di tono muscolare</div>
            </div>
            <div class="quiz-card-opt" data-input="muscle_current" data-value="4" onclick="selectCardOption(this)">
              <img src="/images/muscle4.png" alt="Tonico">
              <div class="quiz-opt-title">Tonico</div>
              <div class="quiz-opt-desc">muscolatura visibile e atletica</div>
            </div>
            <div class="quiz-card-opt" data-input="muscle_current" data-value="5" onclick="selectCardOption(this)">
              <img src="/images/muscle5.png" alt="Muscoloso">
              <div class="quiz-opt-title">Muscoloso</div>
              <div class="quiz-opt-desc">fisico sviluppato e ben costruito</div>
            </div>
          </div>
          <div class="quiz-nav">
            <button type="button" class="quiz-nav-btn" onclick="navQuiz(-1)">← Indietro</button>
            <button type="button" class="quiz-nav-btn quiz-nav-next" onclick="navQuiz(1)" disabled>Avanti →</button>
          </div>
        </div>

        <!-- ──────────────────────────────────────────────────────────
             STEP 3: DESIRED BODY FAT
             ────────────────────────────────────────────────────────── -->
        <div class="quiz-step" data-step="3">
          <h3 style="font-size:1.3rem; font-weight:800; margin-bottom:8px;">Che percentuale di grasso vuoi raggiungere?</h3>
          <p class="quiz-opt-desc" style="font-size:0.9rem; margin-bottom:16px;">
            Scegli il fisico che ti piacerebbe raggiungere come primo obiettivo.
          </p>
          
          <div class="quiz-grid">
            <div class="quiz-card-opt" data-input="bf_target" data-value="1" onclick="selectCardOption(this)">
              <img src="/images/bf1.png" alt="Leggermente alta">
              <div class="quiz-opt-title">Leggermente alta</div>
              <div class="quiz-opt-desc">fisico morbido ma più ordinato</div>
            </div>
            <div class="quiz-card-opt" data-input="bf_target" data-value="2" onclick="selectCardOption(this)">
              <img src="/images/bf2.png" alt="Normale">
              <div class="quiz-opt-title">Normale</div>
              <div class="quiz-opt-desc">forma equilibrata</div>
            </div>
            <div class="quiz-card-opt" data-input="bf_target" data-value="3" onclick="selectCardOption(this)">
              <img src="/images/bf3.png" alt="Bassa">
              <div class="quiz-opt-title">Bassa</div>
              <div class="quiz-opt-desc">fisico atletico e asciutto</div>
            </div>
            <div class="quiz-card-opt" data-input="bf_target" data-value="4" onclick="selectCardOption(this)">
              <img src="/images/bf4.png" alt="Molto bassa">
              <div class="quiz-opt-title">Molto bassa</div>
              <div class="quiz-opt-desc">fisico molto definito</div>
            </div>
            <div class="quiz-card-opt" data-input="bf_target" data-value="5" onclick="selectCardOption(this)">
              <img src="/images/bf5.png" alt="Estremamente bassa">
              <div class="quiz-opt-title">Estremamente bassa</div>
              <div class="quiz-opt-desc">fisico da gara, difficile da mantenere</div>
            </div>
          </div>
          <div class="quiz-nav">
            <button type="button" class="quiz-nav-btn" onclick="navQuiz(-1)">← Indietro</button>
            <button type="button" class="quiz-nav-btn quiz-nav-next" onclick="navQuiz(1)" disabled>Avanti →</button>
          </div>
        </div>

        <!-- ──────────────────────────────────────────────────────────
             STEP 4: DESIRED MUSCLE TONE
             ────────────────────────────────────────────────────────── -->
        <div class="quiz-step" data-step="4">
          <h3 style="font-size:1.3rem; font-weight:800; margin-bottom:8px;">Quanto tono muscolare vuoi raggiungere?</h3>
          <p class="quiz-opt-desc" style="font-size:0.9rem; margin-bottom:16px;">
            Scegli il fisico che ti piacerebbe raggiungere come primo obiettivo.
          </p>
          
          <div class="quiz-grid">
            <div class="quiz-card-opt" data-input="muscle_target" data-value="1" onclick="selectCardOption(this)">
              <img src="/images/muscle1.png" alt="Normale">
              <div class="quiz-opt-title">Normale</div>
              <div class="quiz-opt-desc">struttura semplice e bilanciata</div>
            </div>
            <div class="quiz-card-opt" data-input="muscle_target" data-value="2" onclick="selectCardOption(this)">
              <img src="/images/muscle2.png" alt="Tonico">
              <div class="quiz-opt-title">Tonico</div>
              <div class="quiz-opt-desc">fisico asciutto e atletico</div>
            </div>
            <div class="quiz-card-opt" data-input="muscle_target" data-value="3" onclick="selectCardOption(this)">
              <img src="/images/muscle3.png" alt="Leggermente muscoloso">
              <div class="quiz-opt-title">Leggermente muscoloso</div>
              <div class="quiz-opt-desc">più massa e presenza muscolare</div>
            </div>
            <div class="quiz-card-opt" data-input="muscle_target" data-value="4" onclick="selectCardOption(this)">
              <img src="/images/muscle4.png" alt="Muscoloso">
              <div class="quiz-opt-title">Muscoloso</div>
              <div class="quiz-opt-desc">fisico sviluppato e ben costruito</div>
            </div>
            <div class="quiz-card-opt" data-input="muscle_target" data-value="5" onclick="selectCardOption(this)">
              <img src="/images/muscle5.png" alt="Estremamente muscoloso">
              <div class="quiz-opt-title">Estremamente muscoloso</div>
              <div class="quiz-opt-desc">livello molto avanzato e molto visibile</div>
            </div>
          </div>
          <div class="quiz-nav">
            <button type="button" class="quiz-nav-btn" onclick="navQuiz(-1)">← Indietro</button>
            <button type="button" class="quiz-nav-btn quiz-nav-next" onclick="navQuiz(1)" disabled>Avanti →</button>
          </div>
        </div>

        <!-- ──────────────────────────────────────────────────────────
             STEP 5: TRAINING FREQUENCY
             ────────────────────────────────────────────────────────── -->
        <div class="quiz-step" data-step="5">
          <h3 style="font-size:1.3rem; font-weight:800; margin-bottom:16px;">Quante volte ti alleni a settimana?</h3>
          
          <div class="quiz-pills">
            <div class="quiz-pill" data-input="training_frequency" data-value="1-2 volte" onclick="selectPillOption(this)">
              1–2 volte
            </div>
            <div class="quiz-pill" data-input="training_frequency" data-value="3-4 volte" onclick="selectPillOption(this)">
              3–4 volte
            </div>
            <div class="quiz-pill" data-input="training_frequency" data-value="5+ volte" onclick="selectPillOption(this)">
              5+ volte
            </div>
          </div>
          <div class="quiz-nav">
            <button type="button" class="quiz-nav-btn" onclick="navQuiz(-1)">← Indietro</button>
            <button type="button" class="quiz-nav-btn quiz-nav-next" onclick="navQuiz(1)" disabled>Avanti →</button>
          </div>
        </div>

        <!-- ──────────────────────────────────────────────────────────
             STEP 6: COMMITMENT LEVEL
             ────────────────────────────────────────────────────────── -->
        <div class="quiz-step" data-step="6">
          <h3 style="font-size:1.3rem; font-weight:800; margin-bottom:16px;">Quanto sei disposto a impegnarti davvero?</h3>
          
          <div class="quiz-pills">
            <div class="quiz-pill" style="font-size:0.85rem; padding:14px 18px;" data-input="commitment_level" data-value="1" onclick="selectPillOption(this)">
              Mi piace allenarmi, ma non voglio fare la dieta
            </div>
            <div class="quiz-pill" style="font-size:0.85rem; padding:14px 18px;" data-input="commitment_level" data-value="2" onclick="selectPillOption(this)">
              Sono disposto a seguire qualche direttiva alimentare, ma prevedo possibili sgarri extra
            </div>
            <div class="quiz-pill" style="font-size:0.85rem; padding:14px 18px;" data-input="commitment_level" data-value="3" onclick="selectPillOption(this)">
              Posso fare una dieta molto facile da gestire, dove uno sgarro di troppo non è un problema
            </div>
            <div class="quiz-pill" style="font-size:0.85rem; padding:14px 18px;" data-input="commitment_level" data-value="4" onclick="selectPillOption(this)">
              Posso fare una dieta con precisione e sgarrare con un pasto a settimana
            </div>
            <div class="quiz-pill" style="font-size:0.85rem; padding:14px 18px;" data-input="commitment_level" data-value="5" onclick="selectPillOption(this)">
              Ho pieno controllo e disciplina, posso stare anche 2 mesi senza sgarrare
            </div>
          </div>
          <div class="quiz-nav">
            <button type="button" class="quiz-nav-btn" onclick="navQuiz(-1)">← Indietro</button>
            <button type="button" class="quiz-nav-btn quiz-nav-next" onclick="navQuiz(1)" disabled>Avanti →</button>
          </div>
        </div>

        <!-- ──────────────────────────────────────────────────────────
             STEP 7: CONTACT METHOD SELECTION & NAME
             ────────────────────────────────────────────────────────── -->
        <div class="quiz-step" data-step="7">
          <h3 style="font-size:1.3rem; font-weight:800; margin-bottom:16px;">La tua analisi preliminare è pronta.</h3>
          <p class="sub" style="text-align:center; margin:0 auto 24px; font-size:0.95rem;">
            Inserisci il tuo nome e scegli dove vuoi ricevere la stima realistica della tua trasformazione.
          </p>

          <input type="hidden" id="contact_method" name="contact_method" value="">

          <!-- Name Input -->
          <div style="max-width: 480px; margin: 0 auto 24px;">
            <input type="text" id="quiz_name" name="name" placeholder="Il tuo nome" style="width: 100%; padding: 14px 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #fff; font-size: 0.92rem; outline: none; font-family: 'Inter', sans-serif; text-align: center;" oninput="checkFinalStepValidity()" required />
          </div>

          <!-- Metodo di Contatto: Cards -->
          <div class="quiz-grid" style="grid-template-columns: repeat(2, 1fr); max-width: 480px; margin: 0 auto 24px;">
            <!-- Option 1: WhatsApp -->
            <div class="quiz-card-opt" data-input="contact_method" data-value="whatsapp" onclick="selectContactMethod(this)" style="padding: 24px 16px; position:relative; overflow:hidden;">
              <div style="position:absolute; top:-1px; left:50%; transform:translateX(-50%); background: linear-gradient(90deg, #D4AF37, #B8860B); color: #000; font-size: 0.65rem; font-weight: 800; padding: 4px 12px; border-radius: 0 0 8px 8px; letter-spacing: 0.08em; text-transform:uppercase;">Consigliato</div>
              <div style="font-size: 2.2rem; margin: 16px 0 12px;">📱</div>
              <div class="quiz-opt-title" style="font-size: 1rem;">Ricevila su WhatsApp</div>
              <div class="quiz-opt-desc" style="font-size: 0.75rem;">Il modo più rapido. Ricevi la tua analisi direttamente su WhatsApp.</div>
            </div>

            <!-- Option 2: Email -->
            <div class="quiz-card-opt" data-input="contact_method" data-value="email" onclick="selectContactMethod(this)" style="padding: 24px 16px;">
              <div style="font-size: 2.2rem; margin: 16px 0 12px;">✉️</div>
              <div class="quiz-opt-title" style="font-size: 1rem;">Ricevila via Email</div>
              <div class="quiz-opt-desc" style="font-size: 0.75rem;">Ricevi la tua analisi direttamente nella tua casella email.</div>
            </div>
          </div>

          <!-- Dynamic Input Fields -->
          <div class="email-row" id="input_whatsapp_row" style="margin-top:24px; display:none; flex-direction: column;">
            <input type="tel" id="whatsapp_number" name="whatsapp_number" placeholder="Il tuo numero WhatsApp" oninput="checkFinalStepValidity()" style="width: 100%; padding: 14px 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #fff; font-size: 0.92rem; outline: none; margin-bottom: 12px;" />
            <button type="button" class="btn-gold quiz-submit-btn" style="width: 100%; white-space:nowrap; padding:14px 28px; font-size:0.92rem; border-radius:12px;" onclick="submitQuizData()" disabled>RICEVI LA TUA ANALISI</button>
          </div>

          <div class="email-row" id="input_email_row" style="margin-top:24px; display:none; flex-direction: column;">
            <input type="email" id="quiz_email" name="email" placeholder="Dove inviamo la tua analisi?" oninput="checkFinalStepValidity()" style="width: 100%; padding: 14px 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); color: #fff; font-size: 0.92rem; outline: none; margin-bottom: 12px;" />
            <button type="button" class="btn-gold quiz-submit-btn" style="width: 100%; white-space:nowrap; padding:14px 28px; font-size:0.92rem; border-radius:12px;" onclick="submitQuizData()" disabled>RICEVI LA TUA ANALISI</button>
          </div>

          <p class="note" style="margin-bottom: 24px; margin-top: 16px;">🔒 Zero spam. Solo il tuo potenziale di trasformazione.</p>

          <div class="quiz-nav" style="border-top:none; padding-top:0;">
            <button type="button" class="quiz-nav-btn" onclick="navQuiz(-1)">← Indietro</button>
            <div style="width:70px;"></div>
          </div>
        </div>
      </form>

      <!-- ──────────────────────────────────────────────────────────
           SUCCESS MESSAGE
           ────────────────────────────────────────────────────────── -->
      <!-- Added output view here for local testing visually -->
      <div id="quiz-success" class="quiz-success-msg">
        <div style="font-size: 3rem; margin-bottom: 16px;">✅</div>
        <h3 style="font-size:1.4rem; font-weight:800; margin-bottom:12px; color:#D4AF37;">Perfetto. La tua analisi è stata registrata correttamente.</h3>
        <div id="resultBox" style="background: rgba(212, 175, 55, 0.1); border: 1px solid #D4AF37; padding: 20px; border-radius: 12px; white-space: pre-wrap; line-height: 1.6; margin-bottom: 20px; text-align:left; font-size: 0.9rem;"></div>
        <div style="font-size: 0.75rem; background: #000; color: #0f0; text-align: left; padding: 12px; overflow-x: auto; font-family: monospace;" id="payloadBox"></div>
      </div>

    </div>
  </div>
</section>

<!-- ──────────────────────────────────────────────────────────
     JAVASCRIPT LOGIC
     ────────────────────────────────────────────────────────── -->
<script>
  let currentStep = 1;

  // Seleziona la Card Immagine (Steps 1-4)
  function selectCardOption(el) {
    const parent = el.closest('.quiz-grid');
    parent.querySelectorAll('.quiz-card-opt').forEach(card => card.classList.remove('selected'));
    el.classList.add('selected');
    
    // Assegna valore all'input invisibile
    const inputName = el.getAttribute('data-input');
    const value = el.getAttribute('data-value');
    document.getElementById(inputName).value = value;
    
    checkStepValidity();
  }

  // Seleziona Testo Pillola (Steps 5-6)
  function selectPillOption(el) {
    const parent = el.closest('.quiz-pills');
    parent.querySelectorAll('.quiz-pill').forEach(pill => pill.classList.remove('selected'));
    el.classList.add('selected');

    // Assegna valore all'input invisibile
    const inputName = el.getAttribute('data-input');
    const value = el.getAttribute('data-value');
    document.getElementById(inputName).value = value;
    
    checkStepValidity();
  }

  function selectContactMethod(el) {
    const parent = el.closest('.quiz-grid');
    parent.querySelectorAll('.quiz-card-opt').forEach(card => card.classList.remove('selected'));
    el.classList.add('selected');

    const method = el.getAttribute('data-value');
    document.getElementById('contact_method').value = method;

    // Show the appropriate input row
    const wappRow = document.getElementById('input_whatsapp_row');
    const emailRow = document.getElementById('input_email_row');
    
    // Per farli comportare come la regola CSS della .email-row (display:flex)
    if (method === 'whatsapp') {
      emailRow.style.display = 'none';
      wappRow.style.display = 'flex';
    } else {
      wappRow.style.display = 'none';
      emailRow.style.display = 'flex';
    }

    checkFinalStepValidity();
  }

  // Controlla validità in tempo reale per lo step 7 abilitando/disabilitando il bottone
  function checkFinalStepValidity() {
    const nameInput = document.getElementById('quiz_name').value.trim();
    const method = document.getElementById('contact_method').value;
    const wappInput = document.getElementById('whatsapp_number').value.trim();
    const emailInput = document.getElementById('quiz_email').value.trim();
    
    const activeBtn = method === 'whatsapp' 
        ? document.querySelector('#input_whatsapp_row .quiz-submit-btn')
        : document.querySelector('#input_email_row .quiz-submit-btn');

    if (!activeBtn) return;

    // Richiede sempre il nome compilato (almeno 2 chars) prima di validare il resto
    if (nameInput.length < 2) {
      activeBtn.setAttribute('disabled', 'true');
      return;
    }

    if (method === 'whatsapp') {
      // Basic phone check (at least 6 digits)
      if (wappInput.length >= 6) {
        activeBtn.removeAttribute('disabled');
      } else {
        activeBtn.setAttribute('disabled', 'true');
      }
    } else if (method === 'email') {
      // Basic email regex
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput);
      if (isValidEmail) {
        activeBtn.removeAttribute('disabled');
      } else {
        activeBtn.setAttribute('disabled', 'true');
      }
    }
  }

  // Controlla se abilitare il tasto Avanti
  function checkStepValidity() {
    const currentStepEl = document.querySelector(`.quiz-step[data-step="${currentStep}"]`);
    const nextBtn = currentStepEl.querySelector('.quiz-nav-next');
    if(!nextBtn || currentStep === 7) return;

    const hasSelection = Array.from(currentStepEl.querySelectorAll('[data-input]')).some(el => el.classList.contains('selected'));
    
    if (hasSelection) {
      nextBtn.removeAttribute('disabled');
    } else {
      nextBtn.setAttribute('disabled', 'true');
    }
  }

  // Cambio schermata Quiz e Smooth Scroll
  function navQuiz(direction) {
    const steps = document.querySelectorAll('.quiz-step');
    const dots = document.querySelectorAll('.quiz-dot');

    steps[currentStep - 1].classList.remove('active');
    currentStep += direction;

    dots.forEach((dot, index) => {
      dot.className = 'quiz-dot';
      if (index < currentStep - 1) dot.classList.add('completed');
      if (index === currentStep - 1) dot.classList.add('active');
    });

    steps[currentStep - 1].classList.add('active');

    // Mantiene l'utente focalizzato sul form
    document.getElementById('physique-analysis').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handlePhysiqueFormSubmit(e) {
    e.preventDefault();
  }

  // Motore di Stima, Realismo e Invio Dati
  function submitQuizData() {
    const method = document.getElementById('contact_method').value;
    const nameInput = document.getElementById('quiz_name').value.trim();
    const wappValue = document.getElementById('whatsapp_number')?.value.trim();
    const emailValue = document.getElementById('quiz_email')?.value.trim();

    // Security Checks Base
    if (nameInput.length < 2 || !method) return;
    if (method === 'whatsapp' && wappValue.length < 6) return;
    if (method === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) return;

    // Recupero Valori Scale (1-5)
    // 1=Peggior condizione, 5=Miglior condizione (Estremamente bassa/Estremamente muscoloso)
    const bf_curr_val = parseInt(document.getElementById('bf_current').value) || 1;
    const bf_targ_val = parseInt(document.getElementById('bf_target').value) || 1;
    const musc_curr_val = parseInt(document.getElementById('muscle_current').value) || 1;
    const musc_targ_val = parseInt(document.getElementById('muscle_target').value) || 1;
    
    const freq = document.getElementById('training_frequency').value; // "1-2 volte", "3-4 volte", "5+ volte"
    const comm = parseInt(document.getElementById('commitment_level').value) || 1; // Da 1 a 5

    /* ─── MOTORE MATEMATICO (SWITCHES & POINTS) ─── */
    
    // Calcolo GAP (Quanti "Salti" richiesti, massimo 4 per scala)
    let bf_switches = Math.max(0, bf_targ_val - bf_curr_val);
    let muscle_switches = Math.max(0, musc_targ_val - musc_curr_val);

    // Assegnazione Punti Base Body Fat
    let bf_points = 0;
    if (bf_switches === 1) bf_points = 3;
    else if (bf_switches === 2) bf_points = 7;
    else if (bf_switches === 3) bf_points = 12;
    else if (bf_switches === 4) bf_points = 18;

    // Assegnazione Punti Base Muscle
    let muscle_points = 0;
    if (muscle_switches === 1) muscle_points = 4;
    else if (muscle_switches === 2) muscle_points = 9;
    else if (muscle_switches === 3) muscle_points = 15;
    else if (muscle_switches === 4) muscle_points = 22;

    /* ─── REALISM CHECK ENGINE ─── */
    let is_realistic = true;

    // --- Controllo Realismo: Body Fat VS Commitment ---
    let comm_multiplier = 1;
    let max_bf_switches = 0;

    if (comm === 1) {
        max_bf_switches = 1;
        comm_multiplier = 2;
        if (bf_targ_val === 5) is_realistic = false; // "Extreme definition" vietata per livello 1
    } else if (comm === 2) {
        max_bf_switches = 2;
        comm_multiplier = 1.6;
        if (bf_targ_val === 5) is_realistic = false; // "Extreme definition" vietata per livello 2
    } else if (comm === 3) {
        max_bf_switches = 3;
        comm_multiplier = 0.9;
        if (bf_targ_val === 5) {
            // Extreme definition richiede partenza bassa (>= 4)
            if (bf_curr_val >= 4) comm_multiplier = 1.2; 
            else is_realistic = false;
        }
    } else if (comm === 4) {
        max_bf_switches = 4;
        comm_multiplier = 0.7;
        if (bf_targ_val === 5 && bf_curr_val < 4) is_realistic = false; // Estremo possibile solo partendo da "Normale"
    } else if (comm === 5) {
        max_bf_switches = 4; // maximum theoretical body fat switches allowed by the scale
        comm_multiplier = 0.4;
    }

    if (bf_switches > max_bf_switches) is_realistic = false; // Troppi salti previsti per quell'impegno

    // --- Controllo Realismo: Muscle VS Frequency ---
    let freq_multiplier = 1;
    let max_muscle_switches = 0;

    if (freq === "1-2 volte") {
        max_muscle_switches = 2;
        if (muscle_switches === 1) freq_multiplier = 1;
        else if (muscle_switches === 2) freq_multiplier = 2;
    } else if (freq === "3-4 volte") {
        max_muscle_switches = 4;
        if (muscle_switches <= 2) freq_multiplier = 1;
        else if (muscle_switches === 3) freq_multiplier = 1.6;
        else if (muscle_switches === 4) freq_multiplier = 2;
    } else if (freq === "5+ volte") {
        max_muscle_switches = 4;
        if (muscle_switches <= 3) freq_multiplier = 0.6;
        else if (muscle_switches === 4) freq_multiplier = 1;
    }

    if (muscle_switches > max_muscle_switches) is_realistic = false; // Troppi salti previsti per l'allenamento

    /* ─── CREAZIONE PAYLOAD & MESSAGGIO FINALE ─── */
    let payload = {
        name: nameInput,
        bf_current: bf_curr_val,
        muscle_current: musc_curr_val,
        bf_target: bf_targ_val,
        muscle_target: musc_targ_val,
        training_frequency: freq,
        commitment_level: comm,
        contact_method: method,
        whatsapp_number: method === 'whatsapp' ? wappValue : '',
        email: method === 'email' ? emailValue : ''
    };

    let messageTemplate = "";

    if (!is_realistic) {
        messageTemplate = `Ciao ${nameInput},\n\nabbiamo analizzato le informazioni che hai inserito.\n\nIl risultato che desideri è molto ambizioso rispetto al livello di impegno e alla frequenza di allenamento che hai indicato.\n\nLa buona notizia è che aumentando leggermente il livello di impegno o la frequenza settimanale, il tuo obiettivo può diventare concretamente raggiungibile.\n\nNella pratica questo non significa stravolgere la tua vita, ma semplicemente seguire un percorso più strutturato e coerente con il risultato che vuoi ottenere.\n\nSe vuoi iniziare il tuo percorso, scarica la nostra app e registrati.\n\nPotrai entrare subito nella realtà CSV e iniziare il programma.\n\nhttps://app.csvteam.com`;

        payload.is_realistic = false;
        payload.generated_message = messageTemplate;
        
    } else {
        // Applica i moltiplicatori matematici per il caso in cui SIA realistico
        let adj_bf_points = bf_points * comm_multiplier;
        
        let adj_muscle_points = muscle_points * freq_multiplier;
        if (muscle_switches > 2) adj_muscle_points *= 1.2; // Esponenziale 1
        if (muscle_switches > 3) adj_muscle_points *= 2.0; // Esponenziale 2 somma
        
        // Calcolo del tempo totale (il processo avviene in parallelo)
        const total_weeks = Math.max(4, Math.round(Math.max(adj_bf_points, adj_muscle_points)));

        // Calcolo Settimane ai primi risultati
        let first_results_fraction = 0.4;
        if (adj_bf_points === adj_muscle_points) first_results_fraction = 0.4; // Ex-aequo
        else if (adj_bf_points > adj_muscle_points) first_results_fraction = 0.3; // Grasso predominate
        else first_results_fraction = 0.5; // Muscolo predominante

        const first_results_weeks = Math.max(1, Math.round(total_weeks * first_results_fraction));

        // Format Target Date
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + (total_weeks * 7));
        const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };
        const formattedTargetDate = targetDate.toLocaleDateString('it-IT', dateOptions);

        // Nomenclatura Goal
        let goalText = "miglioramento generale";
        if (bf_switches > 1 && muscle_switches > 1) goalText = "ricomposizione corporea e trasformazione totale";
        else if (bf_switches > 1) goalText = "definizione profonda e perdita di grasso corporeo";
        else if (muscle_switches > 1) goalText = "costruzione muscolare intensa";
        else if (bf_switches <= 1 && muscle_switches <= 1) goalText = "rifinitura dei dettagli ed eccellenza fisica";

        messageTemplate = `Ciao ${nameInput},\n\nabbiamo analizzato la tua situazione attuale.\n\nDal tuo profilo emerge un obiettivo di ${goalText}.\n\nIn base alle informazioni che hai inserito, i primi cambiamenti visibili potrai notarli già dopo circa ${first_results_weeks} settimane.\n\nIl risultato completo può essere raggiunto in circa ${total_weeks} settimane, quindi indicativamente entro il ${formattedTargetDate}. Molte persone iniziano a notare miglioramenti già nelle prime settimane, soprattutto quando iniziano a seguire il percorso con costanza.\n\nQuesta è una prima stima preliminare basata sul tuo punto di partenza.\n\nSe vuoi iniziare il tuo percorso, scarica la nostra app e registrati.\n\nPotrai entrare subito nella realtà CSV e iniziare il programma.\n\nhttps://app.csvteam.com`;

        payload.is_realistic = true;
        payload.estimated_weeks = total_weeks;
        payload.first_results_weeks = first_results_weeks;
        payload.target_date = formattedTargetDate;
        payload.generated_message = messageTemplate;
    }

    console.log("Physique Analysis Computed Output:", payload);
    document.getElementById('resultBox').innerText = messageTemplate;
    document.getElementById('payloadBox').innerText = JSON.stringify(payload, null, 2);

    // Nascondi il Form ed esponi la UI di Successo
    document.getElementById('physiqueForm').style.display = 'none';
    document.getElementById('quiz-progress').style.display = 'none';
    document.getElementById('quiz-success').classList.add('active');
    document.getElementById('physique-analysis').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
</script>
"""

# Extract the parts to keep and string them around the new_quiz
part1_match = re.search(r'(.*?)<!-- ═══════════════════════════════════════════════════════════ -->\s*<!-- SECTION 4: CSV PHYSIQUE ANALYSIS \(Interactive Quiz\)', content, re.DOTALL)
part3_match = re.search(r'<!-- ═══════════════════════════════════════════════════════════ -->\s*<!-- SECTION 5: PRICING -->(.*)', content, re.DOTALL)

if part1_match and part3_match:
    part1 = part1_match.group(1)
    part3 = "\n<!-- ═══════════════════════════════════════════════════════════ -->\n<!-- SECTION 5: PRICING -->" + part3_match.group(1)
    
    final_content = f"""<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CSV Homepage V2 Preview (Local)</title>
    <!-- Basic site styling loaded directly -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
</head>
<body>
{part1}
{new_quiz}
{part3}
</body>
</html>"""

    # Create the test folder if it does not exist
    test_dir = '/Users/danielecasavecchia/Desktop/physique-test'
    if not os.path.exists(test_dir):
        os.makedirs(test_dir)

    with open(os.path.join(test_dir, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(final_content)
    print("Success: Generated full homepage layout test.")
else:
    print("Error: Could not find split points in homepage-v2.html")
