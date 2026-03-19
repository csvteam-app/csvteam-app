import { useState, useEffect, useCallback, useRef } from 'react';

export const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);

    const recognitionRef = useRef(null);
    const cumulativeTranscriptRef = useRef('');

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError('Speech recognition not supported in this browser.');
            return;
        }

        let recognition = null;
        try {
            recognition = new SpeechRecognition();
        } catch (err) {
            console.warn("Speech recognition instantiation blocked by browser:", err);
            setError('Riconoscimento vocale bloccato dal browser. Usa la modalità testuale.');
            return;
        }

        // Su iOS continuous=true viene spesso ignorato, ma lo teniamo per Chrome/Android
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'it-IT';

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event) => {
            let sessionFinalTranscript = '';
            let sessionInterimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    sessionFinalTranscript += event.results[i][0].transcript;
                } else {
                    sessionInterimTranscript += event.results[i][0].transcript;
                }
            }

            if (sessionFinalTranscript) {
                cumulativeTranscriptRef.current += sessionFinalTranscript + ' ';
            }

            setTranscript(cumulativeTranscriptRef.current + sessionInterimTranscript);
        };

        recognition.onerror = (event) => {
            console.warn("Speech recognition error:", event.error);
            if (event.error === 'not-allowed') {
                setError('Permesso microfono negato. Abilitalo nelle impostazioni.');
                setIsListening(false);
            } else if (event.error === 'no-speech') {
                // iOS spara no-speech quasi subito se c'è rumore o silenzio
            } else if (event.error === 'network' || event.error === 'aborted') {
                // Se iOS killa brutalmente la sessione, proviamo a riavviarla in background se e solo se isListening era true (cioè l'utente non ha premuto Stop)
                // Ma per evitare loop infiniti che impallano Safari, non lo facciamo. Lo lasciamo morire e l'utente ripremerà il tasto.
                setIsListening(false);
            }
        };

        recognition.onend = () => {
            // Su iOS onend viene chiamato continuamente. Se abbiamo testo o se l'utente ha premuto stop, cambiamo stato.
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    const startListening = useCallback(() => {
        cumulativeTranscriptRef.current = '';
        setTranscript('');
        setError(null);

        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
                // Forza stato a true subito per reattività UI
                setIsListening(true);
            } catch (err) {
                console.warn("Avvio fallito:", err);
            }
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    }, []);

    return {
        isListening,
        transcript,
        error,
        startListening,
        stopListening,
        hasSupport: !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    };
};
