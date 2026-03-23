import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Send, Image as ImageIcon, Mic, Square, Shield, Clock } from 'lucide-react';
import { perfTrackMount, perfTrackRender } from '../../components/debug/perfTracker';

const Chat = () => {
    perfTrackRender('Chat');
    useEffect(() => { perfTrackMount('Chat'); }, []);
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCoachTyping, setIsCoachTyping] = useState(false);
    const [fetchError, setFetchError] = useState(null);

    // Media States
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);
    const fileInputRef = useRef(null);
    const timerRef = useRef(null);

    const messagesEndRef = useRef(null);
    const chatAreaRef = useRef(null);
    const textareaRef = useRef(null);

    // Calculate next response window
    const getNextResponseWindow = () => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();
        const currentTime = currentHour + currentMin / 60;

        if (currentTime < 9.5) return '09:30 Oggi';
        if (currentTime < 13.5) return '13:30 Oggi';
        if (currentTime < 18.5) return '18:30 Oggi';
        if (currentTime < 22) return '22:00 Oggi';
        return '09:30 Domani';
    };

    // 1. Fetch historical messages
    useEffect(() => {
        if (!user?.id) return;

        const fetchMessages = async () => {
            setFetchError(null);
            const { data, error } = await supabase
                .from('chat_messages')
                .select(`
                    id, text, is_read, created_at, sender_id, media_url, media_type,
                    sender:profiles!sender_id ( full_name, role )
                `)
                .eq('athlete_id', user.id)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('[Chat] Fetch messages error:', error.message);
                setFetchError('Impossibile caricare i messaggi. Riprova più tardi.');
                return;
            }

            if (data) {
                setMessages(data);
            }
        };

        fetchMessages();

        // 2. Subscribe to realtime new messages
        const subscription = supabase
            .channel(`athlete_chat:${user.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `athlete_id=eq.${user.id}`
            }, (payload) => {
                supabase.from('profiles').select('full_name, role').eq('id', payload.new.sender_id).single()
                    .then(({ data: senderProfile }) => {
                        const completeMsg = {
                            ...payload.new,
                            sender: senderProfile
                        };
                        setMessages(prev => [...prev, completeMsg]);
                    });
            })
            .subscribe();

        // 3. Presence for Typing Indicator
        const presenceChannel = supabase.channel(`presence:chat_${user.id}`, {
            config: { presence: { key: user.id } }
        });

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState();
                let typing = false;
                for (const key in state) {
                    if (state[key][0]?.isTyping && state[key][0]?.role === 'coach') {
                        typing = true;
                        break;
                    }
                }
                setIsCoachTyping(typing);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
            supabase.removeChannel(presenceChannel);
        };
    }, [user?.id]);

    // Scroll to bottom on new messages — use scrollTop instead of scrollIntoView
    // to avoid scrolling parent carousel horizontally
    useEffect(() => {
        if (chatAreaRef.current) {
            chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
        }
    }, [messages, showFeedback]);

    const handleSend = async (mediaOverrides = null) => {
        const textToSend = inputValue.trim();
        if ((!textToSend && !mediaOverrides) || !user || isSending) return;

        setIsSending(true);
        if (!mediaOverrides) setInputValue('');

        const payload = {
            athlete_id: user.id,
            sender_id: user.id,
            text: mediaOverrides?.text || textToSend,
            is_read: false,
            media_url: mediaOverrides?.mediaUrl || null,
            media_type: mediaOverrides?.mediaType || null
        };

        const { data: insertedMsg, error } = await supabase.from('chat_messages').insert(payload).select(`
            id, text, is_read, created_at, sender_id, media_url, media_type,
            sender:profiles!sender_id ( full_name, role )
        `).single();

        if (error) {
            console.error('Error sending message:', error);
            if (!mediaOverrides) setInputValue(textToSend);
            alert("Errore durante l'invio del messaggio.");
        } else if (insertedMsg) {
            setMessages(prev => {
                if (prev.some(m => m.id === insertedMsg.id)) return prev;
                return [...prev, insertedMsg];
            });
            setShowFeedback(true);
            setTimeout(() => setShowFeedback(false), 5000);
        }
        setIsSending(false);
        // Re-focus textarea to keep keyboard open (like WhatsApp)
        setTimeout(() => textareaRef.current?.focus(), 50);
    };

    // --- Media Upload Logic ---
    const uploadFile = async (file, typePrefix) => {
        try {
            // Determine extension and content type
            let fileExt, contentType;
            if (file.name) {
                fileExt = file.name.split('.').pop().toLowerCase();
                contentType = file.type || 'application/octet-stream';
            } else if (typePrefix === 'audio') {
                fileExt = 'webm';
                contentType = file.type || 'audio/webm';
            } else {
                fileExt = 'bin';
                contentType = file.type || 'application/octet-stream';
            }

            // iOS HEIC → treat as jpeg for compatibility
            if (fileExt === 'heic' || fileExt === 'heif') {
                fileExt = 'jpg';
                contentType = 'image/jpeg';
            }

            const fileName = `${user.id}_${Date.now()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            // Convert File/Blob to ArrayBuffer for Capacitor iOS compatibility
            const arrayBuffer = await file.arrayBuffer();

            const { error } = await supabase.storage
                .from('chat_attachments')
                .upload(filePath, arrayBuffer, {
                    contentType,
                    upsert: false
                });

            if (error) {
                console.error('Upload Error:', error.message, error);
                alert("Errore caricamento media: " + error.message);
                return null;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('chat_attachments')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (err) {
            console.error('Upload exception:', err);
            alert("Errore caricamento media: " + (err.message || 'errore sconosciuto'));
            return null;
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsSending(true);

        const isVideo = file.type.startsWith('video');
        const mediaType = isVideo ? 'video' : 'image';

        const publicUrl = await uploadFile(file, mediaType);

        if (publicUrl) {
            await handleSend({
                text: '',
                mediaUrl: publicUrl,
                mediaType: mediaType
            });
        }
        setIsSending(false);
        e.target.value = '';
    };

    // --- Audio Recording Logic ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);

            mediaRecorder.current.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.current.push(e.data);
            };

            mediaRecorder.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                audioChunks.current = [];
                setIsSending(true);

                const publicUrl = await uploadFile(audioBlob, 'audio');
                if (publicUrl) {
                    await handleSend({
                        text: '',
                        mediaUrl: publicUrl,
                        mediaType: 'audio'
                    });
                }
                setIsSending(false);
                setRecordingTime(0);
                clearInterval(timerRef.current);
            };

            audioChunks.current = [];
            mediaRecorder.current.start();
            setIsRecording(true);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Mic access denied:", err);
            alert("Permesso microfono negato.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
            mediaRecorder.current.stop();
            mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
        }
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // --- Render Media ---
    const renderMedia = (msg) => {
        if (!msg.media_url) return null;
        if (msg.media_type === 'image') {
            return <img src={msg.media_url} alt="Allegato" style={{ width: '100%', borderRadius: '10px', marginBottom: msg.text ? '8px' : '0' }} />;
        }
        if (msg.media_type === 'video') {
            return <video src={msg.media_url} controls playsInline style={{ width: '100%', borderRadius: '10px', marginBottom: msg.text ? '8px' : '0' }} />;
        }
        if (msg.media_type === 'audio') {
            return <audio src={msg.media_url} controls style={{ width: '100%', height: '40px', marginBottom: msg.text ? '8px' : '0', filter: 'sepia(0.3) saturate(1.5) hue-rotate(10deg)' }} />;
        }
        return null;
    };

    // --- Group messages by date ---
    const getDateLabel = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Oggi';
        if (date.toDateString() === yesterday.toDateString()) return 'Ieri';
        return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: '100%',
            backgroundColor: '#000000',
            backgroundImage: 'radial-gradient(ellipse at 15% 5%, rgba(255, 120, 0, 0.30) 0%, rgba(255, 90, 0, 0.10) 35%, transparent 70%), radial-gradient(circle at 50% 100%, rgba(255, 120, 0, 0.08) 0%, transparent 40%)',
            boxShadow: 'inset 0 0 120px rgba(0,0,0,1)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* ═══ PREMIUM HEADER ═══ */}
            <div style={{
                paddingTop: '0',
                background: 'rgba(20, 20, 20, 0.65)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    padding: '16px 20px 10px',
                }}>
                    {/* Coach Avatar */}
                    <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        fontFamily: 'Outfit',
                        flexShrink: 0,
                    }}>
                        DC
                    </div>
                    <div>
                        <h1 style={{
                            fontFamily: 'Outfit',
                            fontSize: '1.15rem',
                            fontWeight: 700,
                            color: '#fff',
                            margin: 0,
                            letterSpacing: '0.03em',
                        }}>
                            Coach <span style={{ color: '#ffffff' }}>Daniele</span>
                        </h1>
                        <p style={{
                            fontSize: '0.72rem',
                            color: 'rgba(255,255,255,0.45)',
                            margin: 0,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                        }}>
                            Canale Privato CSV Team
                        </p>
                    </div>
                </div>

                {/* Response Window Pill */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '6px 14px 10px',
                }}>
                    <Clock size={12} color="rgba(255, 255, 255, 0.4)" />
                    <span style={{
                        fontSize: '0.7rem',
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontWeight: 500,
                        letterSpacing: '0.02em',
                    }}>
                        Prossima risposta: <strong style={{ color: '#ffffff' }}>{getNextResponseWindow()}</strong>
                    </span>
                </div>
            </div>

            {/* ═══ CHAT MESSAGES AREA ═══ */}
            <div ref={chatAreaRef} style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                paddingBottom: '16px',
                overscrollBehaviorY: 'contain',
                WebkitOverflowScrolling: 'touch',
            }}>
                {/* Schedule Pill */}
                <div style={{
                    alignSelf: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '10px 18px',
                    borderRadius: '20px',
                    marginBottom: '8px',
                    marginTop: '4px',
                }}>
                    <Shield size={14} color="rgba(255, 255, 255, 0.4)" />
                    <span style={{
                        fontSize: '0.73rem',
                        color: 'rgba(255,255,255,0.5)',
                        lineHeight: 1.4,
                        textAlign: 'center',
                    }}>
                        Finestre di risposta: <span style={{ color: '#ffffff', fontWeight: 600 }}>09:30 · 13:30 · 18:30 · 22:00</span>
                    </span>
                </div>

                {fetchError && (
                    <div style={{
                        textAlign: 'center',
                        color: '#ff6b6b',
                        marginTop: '20px',
                        background: 'rgba(255,107,107,0.08)',
                        padding: '14px 20px',
                        borderRadius: '16px',
                        alignSelf: 'center',
                        border: '1px solid rgba(255,107,107,0.15)',
                        fontSize: '0.85rem',
                    }}>
                        ⚠️ {fetchError}
                    </div>
                )}

                {!fetchError && messages.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.35)',
                        marginTop: '40px',
                        padding: '24px',
                        alignSelf: 'center',
                        maxWidth: '280px',
                    }}>
                        <Shield size={32} color="rgba(255, 255, 255, 0.2)" style={{ marginBottom: '12px' }} />
                        <p style={{ fontSize: '0.82rem', lineHeight: 1.5, margin: 0 }}>
                            I messaggi sono protetti con crittografia end-to-end.
                        </p>
                    </div>
                )}

                {messages.map((msg, index) => {
                    const isMine = msg.sender_id === user?.id;
                    const showDate = index === 0 || getDateLabel(msg.created_at) !== getDateLabel(messages[index - 1].created_at);

                    return (
                        <div key={msg.id} style={{ display: 'flex', flexDirection: 'column' }}>
                            {/* Date Separator */}
                            {showDate && (
                                <div style={{
                                    textAlign: 'center',
                                    margin: '16px 0 8px',
                                }}>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        color: 'rgba(255,255,255,0.35)',
                                        background: 'rgba(255,255,255,0.04)',
                                        padding: '4px 16px',
                                        borderRadius: '12px',
                                        fontWeight: 500,
                                        letterSpacing: '0.03em',
                                        textTransform: 'uppercase',
                                    }}>
                                        {getDateLabel(msg.created_at)}
                                    </span>
                                </div>
                            )}

                            <div style={{
                                alignSelf: isMine ? 'flex-end' : 'flex-start',
                                maxWidth: '82%',
                                display: 'flex',
                                flexDirection: 'column',
                            }}>
                                {/* Coach Name Badge */}
                                {!isMine && msg.sender?.full_name && (
                                    <div style={{
                                        fontSize: '0.68rem',
                                        color: '#ffffff',
                                        marginBottom: '3px',
                                        marginLeft: '12px',
                                        fontWeight: 600,
                                        letterSpacing: '0.04em',
                                        textTransform: 'uppercase',
                                        opacity: 0.8,
                                    }}>
                                        {msg.sender.full_name}
                                    </div>
                                )}

                                {/* ── Premium Message Bubble ── */}
                                <div style={{
                                    padding: msg.media_url ? '6px' : '10px 14px',
                                    borderRadius: isMine
                                        ? '16px 4px 16px 16px'
                                        : '4px 16px 16px 16px',
                                    background: isMine
                                        ? 'linear-gradient(135deg, rgba(255, 255, 255,0.15) 0%, rgba(255, 255, 255, 0.04) 100%)'
                                        : 'linear-gradient(135deg, rgba(255, 215, 170, 0.15) 0%, rgba(255, 195, 140, 0.05) 100%)',
                                    border: isMine
                                        ? '1px solid rgba(255,255,255,0.15)'
                                        : '1px solid rgba(255, 215, 170, 0.20)',
                                    boxShadow: isMine
                                        ? 'none'
                                        : '0 4px 15px rgba(255, 180, 100, 0.05)',
                                    color: '#e8e8e8',
                                    position: 'relative',
                                    minWidth: '80px',
                                    backdropFilter: 'blur(10px)',
                                    WebkitBackdropFilter: 'blur(10px)',
                                }}>
                                    {renderMedia(msg)}
                                    {msg.text && (
                                        <p style={{
                                            margin: 0,
                                            fontSize: '0.92rem',
                                            lineHeight: 1.45,
                                            wordBreak: 'break-word',
                                            whiteSpace: 'pre-wrap',
                                            paddingBottom: '14px',
                                            paddingRight: '50px',
                                            ...(msg.media_url ? { padding: '6px 50px 14px 8px' } : {}),
                                        }}>
                                            {msg.text}
                                        </p>
                                    )}

                                    {/* Timestamp + Read Receipt */}
                                    <div style={{
                                        fontSize: '0.62rem',
                                        color: 'rgba(255,255,255,0.35)',
                                        position: 'absolute',
                                        bottom: '5px',
                                        right: '10px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                    }}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {isMine && (
                                            <svg viewBox="0 0 16 15" width="14" height="13" fill="currentColor" style={{ color: msg.is_read ? '#FFFFFF' : 'rgba(255,255,255,0.3)' }}>
                                                <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.32.32 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Sent Feedback */}
                {showFeedback && (
                    <div style={{
                        alignSelf: 'center',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '20px',
                        padding: '10px 20px',
                        marginTop: '8px',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        textAlign: 'center',
                        maxWidth: '85%',
                        animation: 'fadeInUp 0.3s ease-out',
                        letterSpacing: '0.01em',
                    }}>
                        ✓ Messaggio inviato — risposta nella prossima finestra
                    </div>
                )}

                {/* Typing Indicator */}
                {isCoachTyping && (
                    <div style={{
                        alignSelf: 'flex-start',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        color: '#ffffff',
                        padding: '10px 18px',
                        borderRadius: '4px 18px 18px 18px',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        fontStyle: 'italic',
                        animation: 'fadeIn 0.3s ease-out',
                    }}>
                        <span style={{ opacity: 0.7 }}>Daniele sta scrivendo</span>
                        <span style={{ animation: 'pulse 1.2s infinite' }}> ···</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*,video/*"
                onChange={handleFileSelect}
            />

            {/* ═══ PREMIUM INPUT FOOTER (In-flow Dock) ═══ */}
            <div style={{
                flexShrink: 0,
                padding: '8px 12px',
                paddingBottom: '8px',
                background: 'linear-gradient(180deg, rgba(30,32,36,0.7) 0%, rgba(10,12,16,0.9) 100%)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                borderRadius: '24px 24px 0 0',
                display: 'flex',
                alignItems: 'flex-end',
                gap: '10px',
                borderTop: '1px solid rgba(255,255,255,0.08)',
            }}>
                {/* Input Container */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'flex-end',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '24px',
                    padding: '6px 6px 6px 14px',
                    minHeight: '46px',
                    transition: 'border-color 0.3s',
                }}>
                    {/* Image Attach Button */}
                    <button
                        style={{
                            color: 'rgba(255,255,255,0.35)',
                            padding: '4px 6px',
                            display: 'flex',
                            alignItems: 'center',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'color 0.2s',
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSending || isRecording}
                        onMouseEnter={e => e.currentTarget.style.color = '#FFFFFF'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                    >
                        <ImageIcon size={20} />
                    </button>

                    {isRecording ? (
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 8px',
                            color: '#ef4444',
                            fontWeight: 600,
                            fontSize: '0.88rem',
                            fontFamily: 'Outfit',
                        }}>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#ef4444',
                                marginRight: '10px',
                                animation: 'pulse 1.2s ease-in-out infinite',
                                boxShadow: '0 0 8px rgba(239,68,68,0.5)',
                            }} />
                            {formatTime(recordingTime)}
                        </div>
                    ) : (
                        <textarea
                            ref={textareaRef}
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyPress={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            disabled={isSending}
                            placeholder="Scrivi un messaggio..."
                            rows={1}
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                color: '#e0e0e0',
                                fontSize: '0.95rem',
                                fontFamily: 'Inter, system-ui',
                                padding: '6px 8px',
                                resize: 'none',
                                outline: 'none',
                                maxHeight: '100px',
                                lineHeight: '1.3',
                            }}
                        />
                    )}
                </div>

                {/* Action Button: Send / Stop / Mic */}
                {inputValue.trim() || isSending ? (
                    <button
                        onMouseDown={(e) => e.preventDefault()}
                        onTouchEnd={(e) => { e.preventDefault(); handleSend(); }}
                        onClick={() => handleSend()}
                        disabled={isSending}
                        style={{
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(200, 200, 200, 0.9) 100%)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#000',
                            minWidth: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 12px rgba(255, 255, 255, 0.2)',
                            opacity: isSending ? 0.5 : 1,
                            cursor: isSending ? 'not-allowed' : 'pointer',
                            flexShrink: 0,
                            WebkitTapHighlightColor: 'transparent',
                            touchAction: 'manipulation',
                        }}
                    >
                        <Send size={18} style={{ marginLeft: '2px' }} />
                    </button>
                ) : isRecording ? (
                    <button
                        onClick={stopRecording}
                        style={{
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            border: 'none',
                            color: '#fff',
                            minWidth: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.2s',
                            boxShadow: '0 2px 12px rgba(239,68,68,0.3)',
                            animation: 'pulseGlow 2s infinite',
                            cursor: 'pointer',
                            flexShrink: 0,
                        }}
                    >
                        <Square size={16} fill="currentColor" />
                    </button>
                ) : (
                    <button
                        onClick={startRecording}
                        style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.5)',
                            minWidth: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                            flexShrink: 0,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                    >
                        <Mic size={20} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Chat;
