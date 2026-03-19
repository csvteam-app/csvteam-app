#!/bin/bash
# Extract JPEG thumbnails from all exercise videos
# Frame at t=8s, scaled to 360px width, quality 4 (good enough, small file)

OUTDIR="/Users/danielecasavecchia/Desktop/csvteam-app/public/thumbnails"
mkdir -p "$OUTDIR"

VIDEOS=(
"https://www.csvteam.com/wp-content/uploads/2025/07/LEG-PRESS-45.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/ILIAC.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/SUPER-INCLINE-PRESS.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/CROCI-CAVI-BASSI_MANUBRI-4K.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/CROCI-CAVI-ALTI.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/PANCA-PIANA_CHEST-PRESS.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/DIP-PETTO-4K.mp4"
"https://www.csvteam.com/wp-content/uploads/2026/02/LAT-MACHINE.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/PULLDOWN.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/REMATORE-MANUBRIO.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/LOW-ROW.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/CHEST-PRESS-INCLINATA_BILANCIERE.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/FLY-MACHINE_CROCI-CAVI-SU-PANCA.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/REMATORE-FOCUS-DORSALE_UPPERBACK.mp4"
"https://www.csvteam.com/wp-content/uploads/2026/02/HYPER-EXT.mp4"
"https://www.csvteam.com/wp-content/uploads/2026/02/SHOULDER-PRESS-MAN.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/12/Alzate-Laterali.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/12/Alzate-Laterali-Cavo-Basso.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/12/Alzate-Laterali-a-Y-con-Panca-Inclinata.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/12/Face-Pull.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/HACK-SQUAT.mp4"
"https://www.csvteam.com/wp-content/uploads/2026/02/SQUAT-SUMO.mp4"
"https://www.csvteam.com/wp-content/uploads/2026/02/SQUAT-CULO.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/SISSY-SQUAT.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/LEG-EXTENSION.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/LEG-CURL-SDRAIATO.mp4"
"https://www.csvteam.com/wp-content/uploads/2026/02/LEG-CURL.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/06/LEG-CURL-IN-PIEDI.mp4"
"https://www.csvteam.com/wp-content/uploads/2026/02/STACCO-BIL.mp4"
"https://www.csvteam.com/wp-content/uploads/2026/02/AFFONDI-INDIETRO.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/AFFONDI-IN-CAMMINATA_INDIETRO.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/AFFONDO-BULGARO.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/STEP-UP-MANUBRIO-4K.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/ADDUCTOR-MACHINE.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/ABDUCTOR-MACHINE.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/ROW.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/PUSHDOWN-FUNE_SBARRA.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/PUSH-DOWN-CAVI-INCROCIATI.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/FRENCH-PRESS-CAVO-ALTO.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/KICKBACK-CAVO_MANUBRIOmp4.mp4"
"https://www.csvteam.com/wp-content/uploads/2026/02/HIP-THRUST.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/FRENCH-PRESS-MANUBRI_CAVO-BASSO-SU-PANCA.mp4"
"https://www.csvteam.com/wp-content/uploads/2026/02/MOB-SCHIENA.mp4"
"https://www.csvteam.com/wp-content/uploads/2026/02/CAVI.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/CURL-BILANCIER_MANUBRI_SBARRA.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/CURL-A-MARTELLO.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/FRENCH-PRESS-CAVO-BASSO.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/CURL-SEDUTO-SU-PANCA-60°_CAVI-BASSI.mp4"
"https://www.csvteam.com/wp-content/uploads/2025/07/BAYESIAN-CURL.mp4"
"https://www.csvteam.com/wp-content/uploads/2026/02/PENDULUM.mp4"
)

TOTAL=${#VIDEOS[@]}
COUNT=0
FAIL=0

for url in "${VIDEOS[@]}"; do
    COUNT=$((COUNT + 1))
    FILENAME=$(basename "$url" .mp4).jpg
    OUTPATH="$OUTDIR/$FILENAME"
    
    if [ -f "$OUTPATH" ]; then
        echo "⏩ [$COUNT/$TOTAL] $FILENAME - already exists"
        continue
    fi
    
    echo -n "🎬 [$COUNT/$TOTAL] $FILENAME..."
    
    # Try t=8s first, fall back to t=1s
    ffmpeg -ss 8 -i "$url" -vframes 1 -q:v 4 -vf "scale=360:-1" "$OUTPATH" -y 2>/dev/null
    
    if [ ! -f "$OUTPATH" ]; then
        ffmpeg -ss 1 -i "$url" -vframes 1 -q:v 4 -vf "scale=360:-1" "$OUTPATH" -y 2>/dev/null
    fi
    
    if [ -f "$OUTPATH" ]; then
        SIZE=$(du -h "$OUTPATH" | cut -f1)
        echo " ✅ ($SIZE)"
    else
        echo " ❌ FAILED"
        FAIL=$((FAIL + 1))
    fi
done

echo ""
echo "═══════════════════════"
echo "Done! $((COUNT - FAIL))/$TOTAL thumbnails generated"
echo "Failed: $FAIL"
echo "═══════════════════════"
