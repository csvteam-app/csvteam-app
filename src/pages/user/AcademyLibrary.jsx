import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { PlayCircle } from 'lucide-react';
import Input from '../../components/ui/Input';
import CsvLogo from '../../components/ui/CsvLogo';
import VideoThumbnail from '../../components/ui/VideoThumbnail';


/* ═══════════════════════════════════════════════════
   VIDEO TITLE MAP — Maps WP filenames to correct
   human-readable Italian titles. This is the single
   source of truth for what each video actually shows.
   ═══════════════════════════════════════════════════ */
const VIDEO_TITLE_MAP = {
    // PETTO
    'PANCA-PIANA_CHEST-PRESS.mp4': 'Panca Piana / Chest Press',
    'CHEST-PRESS-INCLINATA_BILANCIERE.mp4': 'Chest Press Inclinata',
    'SUPER-INCLINE-PRESS.mp4': 'Super Incline Press',
    'CROCI-CAVI-BASSI_MANUBRI-4K.mp4': 'Croci ai Cavi Bassi / Manubri',
    'CROCI-CAVI-ALTI.mp4': 'Croci ai Cavi Alti',
    'FLY-MACHINE_CROCI-CAVI-SU-PANCA.mp4': 'Fly Machine / Pectoral Machine',
    'DIP-PETTO-4K.mp4': 'Dip Petto',
    'SPINTE-PRESA-STRETTA.mp4': 'Spinte Presa Stretta',
    // SCHIENA
    'LAT-MACHINE.mp4': 'Lat Machine',
    'PULLDOWN.mp4': 'Pulldown',
    'ILIAC.mp4': 'Iliac Pulldown',
    'ILIAC_PULLDOWN-MONO.mp4': 'Iliac Pulldown Mono',
    'LOW-ROW.mp4': 'Low Row / Pulley',
    'ROW.mp4': 'Row',
    'ROW-PRONA.mp4': 'Row Prona',
    'REMATORE-MANUBRIO.mp4': 'Rematore con Manubrio',
    'REMATORE-FOCUS-DORSALE_UPPERBACK.mp4': 'Rematore Focus Dorsale',
    'PULLEY-.mp4': 'Pulley',
    'PULLEY-FOCUS-DORSALE.mp4': 'Pulley Focus Dorsale',
    'LAT-MACHINE-FOCUS-UPPERBACK.mp4': 'Lat Machine Focus Upper Back',
    'HYPER-EXT.mp4': 'Hyperextension',
    'STACCO-BIL.mp4': 'Stacco con Bilanciere',
    'RDL-MAN.mp4': 'RDL con Manubri',
    // SPALLE
    'SHOULDER-PRESS-MAN.mp4': 'Shoulder Press con Manubri',
    'SHOULDER-PRES.mp4': 'Shoulder Press',
    'Alzate-Laterali.mp4': 'Alzate Laterali',
    'Alzate-Laterali-Cavo-Basso.mp4': 'Alzate Laterali al Cavo Basso',
    'Alzate-Laterali-a-Y-con-Panca-Inclinata.mp4': 'Alzate Laterali a Y su Panca Inclinata',
    'ALZATE-LATER.mp4': 'Alzate Laterali',
    'ALZATE-LATER-SDRAIATO.mp4': 'Alzate Laterali da Sdraiato',
    'LATERAL-RAISE.mp4': 'Lateral Raise',
    'Face-Pull.mp4': 'Face Pull',
    'FACE-PULL.mp4': 'Face Pull',
    'REAR-DELT_APERTURE-DA-PRONO-4K.mp4': 'Rear Delt / Aperture da Prono',
    // GAMBE
    'SQUAT-CULO.mp4': 'Squat',
    'SQUAT-SUMO.mp4': 'Squat Sumo',
    'HACK-SQUAT.mp4': 'Hack Squat',
    'LEG-PRESS-45.mp4': 'Leg Press 45°',
    'SISSY-SQUAT.mp4': 'Sissy Squat',
    'LEG-EXTENSION.mp4': 'Leg Extension',
    'LEG-CURL-SDRAIATO.mp4': 'Leg Curl Sdraiato',
    'LEG-CURL.mp4': 'Leg Curl',
    'LEG-CURL-IN-PIEDI.mp4': 'Leg Curl in Piedi',
    'AFFONDI-INDIETRO.mp4': 'Affondi Indietro',
    'AFFONDI-IN-CAMMINATA_INDIETRO.mp4': 'Affondi in Camminata',
    'AFFONDO-BULGARO.mp4': 'Affondo Bulgaro',
    'STEP-UP-MANUBRIO-4K.mp4': 'Step Up con Manubrio',
    'ADDUCTOR-MACHINE.mp4': 'Adductor Machine',
    'ABDUCTOR-MACHINE.mp4': 'Abductor Machine',
    'PENDULUM.mp4': 'Pendulum Squat',
    // GLUTEI
    'HIP-THRUST.mp4': 'Hip Thrust',
    // BICIPITI
    'CURL-BILANCIER_MANUBRI_SBARRA.mp4': 'Curl Bilanciere / Manubri',
    'CURL-A-MARTELLO.mp4': 'Curl a Martello',
    'CURL-SEDUTO-SU-PANCA-60°_CAVI-BASSI.mp4': 'Curl su Panca 60° ai Cavi',
    'BAYESIAN-CURL.mp4': 'Bayesian Curl',
    // TRICIPITI
    'PUSHDOWN-FUNE_SBARRA.mp4': 'Push Down con Fune / Sbarra',
    'PUSH-DOWN-CAVI-INCROCIATI.mp4': 'Push Down Cavi Incrociati',
    'FRENCH-PRESS-CAVO-ALTO.mp4': 'French Press al Cavo Alto',
    'FRENCH-PRESS-CAVO-BASSO.mp4': 'French Press al Cavo Basso',
    'FRENCH-PRESS-MANUBRI_CAVO-BASSO-SU-PANCA.mp4': 'French Press Manubri su Panca',
    'KICKBACK-CAVO_MANUBRIOmp4.mp4': 'Kick Back al Cavo / Manubrio',
    'DIP.mp4': 'Dip Tricipiti',
    'INCROCIATI.mp4': 'Cavi Incrociati',
    // ADDOMINALI / CORE
    'MOB-SCHIENA.mp4': 'Mobilità Schiena',
    'CAVI.mp4': 'Cavi',
    'MOB-CAVIGLIE.mp4': 'Mobilità Caviglie',
    'MOB-GAMBE.mp4': 'Mobilità Gambe',
    'MOB-SPALLE.mp4': 'Mobilità Spalle',
    // EXTRA / REEL
    'Aperture-a-Cavo-Alto.mp4': 'Aperture al Cavo Alto',
    'gambe-reel.mp4': 'Gambe Reel',
    'schiena-reel.mp4': 'Schiena Reel',
    'spalla-reel.mp4': 'Spalla Reel',
    'RPE.mp4': 'RPE',
    'CAVI-BASS.mp4': 'Cavi Bassi',
};

/* ═══ Correct muscle group mapping for videos ═══ */
const VIDEO_MUSCLE_OVERRIDE = {
    'PENDULUM.mp4': 'legs',
    'MOB-SCHIENA.mp4': 'mobility',
    'MOB-CAVIGLIE.mp4': 'mobility',
    'MOB-GAMBE.mp4': 'mobility',
    'MOB-SPALLE.mp4': 'mobility',
    'CAVI.mp4': 'chest',
    'RPE.mp4': 'education',
    'gambe-reel.mp4': 'legs',
    'schiena-reel.mp4': 'back',
    'spalla-reel.mp4': 'shoulders',
};

/* ═══ Gradient backgrounds per muscle group (for instant thumbnails) ═══ */
const MUSCLE_GRADIENT = {
    chest: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    back: 'linear-gradient(135deg, #1a1a2e 0%, #2d1b3d 50%, #1b2838 100%)',
    shoulders: 'linear-gradient(135deg, #1a1a2e 0%, #1e3a3a 50%, #0d2b2b 100%)',
    legs: 'linear-gradient(135deg, #1a1a2e 0%, #2b1a1a 50%, #3d1616 100%)',
    glutes: 'linear-gradient(135deg, #1a1a2e 0%, #3d2b1a 50%, #2e1f0f 100%)',
    biceps: 'linear-gradient(135deg, #1a1a2e 0%, #1a2e1a 50%, #0f3d1a 100%)',
    triceps: 'linear-gradient(135deg, #1a1a2e 0%, #2e2e1a 50%, #3d3d0f 100%)',
    abs: 'linear-gradient(135deg, #1a1a2e 0%, #1a1a3d 50%, #2b1a3d 100%)',
    mobility: 'linear-gradient(135deg, #1a1a2e 0%, #1e2e3e 50%, #1a3d3d 100%)',
    education: 'linear-gradient(135deg, #1a1a2e 0%, #2e1a2e 50%, #3d1a2e 100%)',
    default: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
};

/**
 * Get a human-readable title from a video URL.
 * Uses VIDEO_TITLE_MAP first, then cleans the filename.
 */
function getVideoTitle(url) {
    if (!url) return 'Video';
    const filename = url.split('/').pop();
    if (VIDEO_TITLE_MAP[filename]) return VIDEO_TITLE_MAP[filename];
    // Fallback: clean filename
    return filename
        .replace(/\.mp4$/i, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
        .trim();
}

/**
 * Get the correct muscle group for a video, using overrides or the exercise data.
 */
function getVideoMuscle(url, exerciseMuscle) {
    if (!url) return exerciseMuscle;
    const filename = url.split('/').pop();
    return VIDEO_MUSCLE_OVERRIDE[filename] || exerciseMuscle;
}

const AcademyLibrary = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [academy, setAcademy] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchExercises = async () => {
            setIsLoading(true);
            const { data } = await supabase
                .from('exercises')
                .select('id, name, primary_muscle_group, video_url')
                .not('video_url', 'is', null)
                .order('name', { ascending: true });

            if (data) {
                const validVideos = data.filter(ex => ex.video_url && ex.video_url.trim() !== '' && !ex.video_url.includes('youtube.com'));

                // Deduplicate by video_url → each unique video appears once with correct title
                const seenUrls = new Set();
                const deduped = [];
                for (const ex of validVideos) {
                    if (seenUrls.has(ex.video_url)) continue;
                    seenUrls.add(ex.video_url);
                    deduped.push({
                        id: ex.id,
                        name: getVideoTitle(ex.video_url),
                        primary_muscle_group: getVideoMuscle(ex.video_url, ex.primary_muscle_group),
                        video_url: ex.video_url,
                    });
                }
                setAcademy(deduped);
            }
            setIsLoading(false);
        };
        fetchExercises();
    }, []);

    const muscleTranslation = {
        'chest': 'Petto', 'back': 'Schiena', 'shoulders': 'Spalle', 'legs': 'Gambe',
        'glutes': 'Glutei', 'biceps': 'Bicipiti', 'triceps': 'Tricipiti', 'abs': 'Addominali',
        'calves': 'Polpacci', 'hamstrings': 'Femorali', 'quadriceps': 'Quadricipiti',
        'core': 'Core', 'forearms': 'Avambracci', 'mobility': 'Mobilità', 'education': 'Educazione',
    };

    /* Order categories in a logical bodybuilding order */
    const categoryOrder = ['chest', 'back', 'shoulders', 'legs', 'glutes', 'biceps', 'triceps', 'abs', 'mobility', 'education'];

    const filteredVideos = academy.filter(v => {
        const primaryGrp = (v.primary_muscle_group || '').toLowerCase();
        const translatedGrp = muscleTranslation[primaryGrp] || primaryGrp;
        return v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            translatedGrp.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const availableCategories = [...new Set(filteredVideos.map(v => v.primary_muscle_group).filter(Boolean))]
        .sort((a, b) => {
            const ia = categoryOrder.indexOf(a);
            const ib = categoryOrder.indexOf(b);
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        });

    return (
        <div className="global-container" style={{ padding: 0 }}>
            {/* Academy Hero */}
            <div
                style={{
                    padding: '32px 24px 32px',
                    background: 'var(--gradient-hero)',
                    textAlign: 'center',
                }}
            >
                <CsvLogo size={40} color="var(--accent-icy)" showText={false} />
                <h1 className="text-hero" style={{
                    marginTop: '16px',
                    fontFamily: 'Outfit, sans-serif',
                    color: '#ffffff',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    /* Effetto neon esatto basato sulla foto: bianco centrale con bagliore azzurro saturo */
                    textShadow: `
                        0 0 8px rgba(90, 156, 248, 0.8),
                        0 0 16px rgba(90, 156, 248, 0.6),
                        0 0 32px rgba(90, 156, 248, 0.4),
                        0 0 60px rgba(90, 156, 248, 0.3),
                        0 0 100px rgba(90, 156, 248, 0.2)
                    `
                }}>
                    CSV <span style={{ color: '#ffffff' }}>Academy</span>
                </h1>
                <p className="text-body" style={{ marginTop: '8px', color: 'rgba(255,255,255,0.7)' }}>
                    Libreria tecnica d'élite. Impara dai professionisti.
                </p>
                <div style={{ marginTop: '24px', maxWidth: '100%', marginLeft: 'auto', marginRight: 'auto' }}>
                    <Input placeholder="Cerca esercizi..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {!isLoading && academy.length === 0 && (
                <div style={{ padding: '24px' }}>
                    <div style={{ padding: '16px', background: 'rgba(234, 179, 8, 0.2)', border: '1px solid #eab308', borderRadius: '12px', color: '#fef08a', textAlign: 'center' }}>
                        Nessun video trovato nel database.
                    </div>
                </div>
            )}

            <div style={{ padding: '0 0 96px 0' }} className="flex-col gap-8 stagger-children">
                {availableCategories.map((category) => {
                    const normalizedCat = (category || '').toLowerCase();
                    const displayCategory = muscleTranslation[normalizedCat] || category;
                    const catVideos = filteredVideos.filter(v => v.primary_muscle_group === category);
                    if (catVideos.length === 0) return null;

                    return (
                        <div key={category} className="animate-fade-in">
                            <h2 className="text-h3 flex-row gap-2 items-center" style={{ marginBottom: '16px', paddingLeft: '24px' }}>
                                <div style={{ width: '4px', height: '16px', borderRadius: '2px', background: 'var(--gradient-primary)' }} />
                                {displayCategory}
                            </h2>

                            <div className="flex-row gap-3 hide-scrollbar" style={{ overflowX: 'auto', paddingBottom: '12px', paddingLeft: '24px', paddingRight: '24px' }}>
                                {catVideos.map(video => (
                                    <VideoThumbnail
                                        key={video.video_url}
                                        videoUrl={video.video_url}
                                        title={video.name}
                                        muscleGradient={MUSCLE_GRADIENT[normalizedCat] || MUSCLE_GRADIENT.default}
                                        onClick={() => setSelectedVideo(video)}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Video Player Modal */}
            {selectedVideo && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', padding: '20px' }}
                    onClick={() => setSelectedVideo(null)}
                >
                    <div className="flex-col gap-4" style={{ width: '100%', maxWidth: '800px', background: 'var(--surface-color-1)', padding: '24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
                        <div className="flex-row justify-between items-center">
                            <h2 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.2rem', color: '#fff' }}>{selectedVideo.name}</h2>
                            <button onClick={() => setSelectedVideo(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        </div>
                        <video
                            src={selectedVideo.video_url}
                            controls
                            autoPlay
                            playsInline
                            style={{ width: '100%', borderRadius: '12px', maxHeight: '60vh', background: '#000' }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademyLibrary;
