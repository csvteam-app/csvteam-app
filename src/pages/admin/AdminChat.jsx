import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Send, Search, MessageSquare, ArrowLeft, Image as ImageIcon, Mic, Square } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCoachData } from '../../hooks/useCoachData';

// eslint-disable-next-line react/prop-types
const TimeAgo = ({ date }) => {
    const [text, setText] = useState('');

    useEffect(() => {
        const updateText = () => {
            if (!date) return;
            const diffMs = new Date() - new Date(date);
            const diffMins = Math.floor(diffMs / 60000);

            if (diffMins < 60) {
                setText(`${diffMins} min`);
            } else {
                const diffHrs = Math.floor(diffMins / 60);
                const remMins = diffMins % 60;
                if (diffHrs < 24) {
                    setText(`${diffHrs}h ${remMins > 0 ? remMins + 'm' : ''}`);
                } else {
                    const days = Math.floor(diffHrs / 24);
                    setText(`${days}g`);
                }
            }
        };

        updateText();
        const interval = setInterval(updateText, 60000);
        return () => clearInterval(interval);
    }, [date]);

    return <span>{text}</span>;
};

const AdminChat = () => {
    const { user } = useAuth();
    const { athletes } = useCoachData(); // Get all assigned athletes
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [presenceChannel, setPresenceChannel] = useState(null);
    const [inboxMap, setInboxMap] = useState({});

    // Svuota Inbox States
    const [isSvuotaMode, setIsSvuotaMode] = useState(false);
    const [svuotaQueue, setSvuotaQueue] = useState([]);
    const [svuotaIndex, setSvuotaIndex] = useState(0);

    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Media States
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);
    const fileInputRef = useRef(null);
    const timerRef = useRef(null);

    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const athleteIdsStr = athletes.map(a => a.id).sort().join(',');

    // Fetch global inbox summary and listen for new messages across all athletes
    useEffect(() => {
        if (!athleteIdsStr) return;

        const fetchInboxSummaries = async () => {
            const map = {};
            const chunkSize = 10;
            for (let i = 0; i < athletes.length; i += chunkSize) {
                const chunk = athletes.slice(i, i + chunkSize);
                await Promise.all(chunk.map(async (a) => {
                    const { data } = await supabase
                        .from('chat_messages')
                        .select('sender_id, created_at, text, media_type')
                        .eq('athlete_id', a.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    if (data) {
                        const isAthlete = data.sender_id === a.id;
                        let snippet = data.text;
                        if (data.media_type) {
                            if (data.media_type.startsWith('image/')) snippet = '📷 Immagine';
                            else if (data.media_type.startsWith('video/')) snippet = '🎥 Video';
                            else if (data.media_type.startsWith('audio/')) snippet = '🎵 Nota Vocale';
                            else snippet = '📎 Allegato';
                        }

                        map[a.id] = {
                            last_message_at: data.created_at,
                            last_message_sender_role: isAthlete ? 'athlete' : 'coach',
                            is_waiting_for_coach: isAthlete,
                            waiting_since: isAthlete ? data.created_at : null,
                            last_text: snippet
                        };
                    }
                }));
            }
            setInboxMap(map);
        };

        fetchInboxSummaries();

        // Global realtime listener for ALL chat messages (to update the sidebar immediately)
        const globalSub = supabase
            .channel('admin_global_chat')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages'
            }, (payload) => {
                const msg = payload.new;
                setInboxMap(prev => {
                    // Only care if it belongs to an assigned athlete
                    if (!athletes.find(a => a.id === msg.athlete_id)) return prev;

                    const athleteId = msg.athlete_id;
                    const isAthlete = msg.sender_id === athleteId;

                    let snippet = msg.text;
                    if (msg.media_type) {
                        if (msg.media_type.startsWith('image/')) snippet = '📷 Immagine';
                        else if (msg.media_type.startsWith('video/')) snippet = '🎥 Video';
                        else if (msg.media_type.startsWith('audio/')) snippet = '🎵 Nota Vocale';
                        else snippet = '📎 Allegato';
                    }

                    return {
                        ...prev,
                        [athleteId]: {
                            last_message_at: msg.created_at,
                            last_message_sender_role: isAthlete ? 'athlete' : 'coach',
                            is_waiting_for_coach: isAthlete,
                            waiting_since: isAthlete ? msg.created_at : null,
                            last_text: snippet
                        }
                    };
                });
            })
            .subscribe();

        return () => supabase.removeChannel(globalSub);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [athleteIdsStr]); // Only re-run if the assigned athletes list actually changes

    // Fetch base messages for the selected athlete
    useEffect(() => {
        if (!selectedUserId) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            const { data } = await supabase
                .from('chat_messages')
                .select(`id, text, is_read, created_at, sender_id, sender:profiles!sender_id ( full_name, role )`)
                .eq('athlete_id', selectedUserId)
                .order('created_at', { ascending: true });

            if (data) {
                setMessages(data);

                // Mark unread messages as read
                const unreadIds = data.filter(m => !m.is_read && m.sender_id !== user?.id).map(m => m.id);
                if (unreadIds.length > 0) {
                    await supabase.from('chat_messages').update({ is_read: true }).in('id', unreadIds);
                }
            }
        };

        fetchMessages();

        // Subscribe to real-time events for this athlete's chat
        const subscription = supabase
            .channel(`admin_chat:${selectedUserId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `athlete_id=eq.${selectedUserId}`
            }, (payload) => {
                supabase.from('profiles').select('full_name, role').eq('id', payload.new.sender_id).single()
                    .then(({ data: senderProfile }) => {
                        setMessages(prev => [...prev, { ...payload.new, sender: senderProfile }]);
                        if (payload.new.sender_id !== user?.id) {
                            supabase.from('chat_messages').update({ is_read: true }).eq('id', payload.new.id);
                        }
                    });
            })
            .subscribe();

        const channel = supabase.channel(`presence:chat_${selectedUserId}`, {
            config: { presence: { key: user?.id } }
        });

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                setPresenceChannel(channel);
            }
        });

        return () => {
            supabase.removeChannel(subscription);
            supabase.removeChannel(channel);
            setPresenceChannel(null);
            clearTimeout(typingTimeoutRef.current);
        };
    }, [selectedUserId, user?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, selectedUserId]);

    const handleSend = async (mediaOverrides = null) => {
        const textToSend = inputValue.trim();
        if ((!textToSend && !mediaOverrides) || !selectedUserId || !user || isSending) return;

        setIsSending(true);

        if (!mediaOverrides) setInputValue('');

        if (presenceChannel) {
            presenceChannel.track({ role: 'coach', isTyping: false });
        }

        const payload = {
            athlete_id: selectedUserId,
            sender_id: user.id,
            text: mediaOverrides?.text || textToSend,
            is_read: false,
            media_url: mediaOverrides?.mediaUrl || null,
            media_type: mediaOverrides?.mediaType || null
        };

        const { data: insertedMsg, error } = await supabase.from('chat_messages').insert(payload).select(`id, text, is_read, created_at, sender_id, media_url, media_type, sender:profiles!sender_id ( full_name, role )`).single();

        if (error) {
            console.error('[AdminChat] Send error:', error);
            if (!mediaOverrides) setInputValue(textToSend);
        } else if (insertedMsg) {
            // Optimistic update to avoid waiting for realtime
            setMessages(prev => {
                if (prev.some(m => m.id === insertedMsg.id)) return prev;
                return [...prev, insertedMsg];
            });

            // -- Svuota Inbox Auto-Advance Logic --
            if (isSvuotaMode) {
                setSvuotaQueue(prevQueue => {
                    const newQueue = prevQueue.filter(a => a.id !== selectedUserId);
                    if (newQueue.length === 0) {
                        setIsSvuotaMode(false);
                        setSelectedUserId(null);
                        setSvuotaIndex(0);
                        alert('Inbox svuotata!');
                        return [];
                    }
                    const nextIdx = svuotaIndex >= newQueue.length ? newQueue.length - 1 : svuotaIndex;
                    setSvuotaIndex(nextIdx);
                    setSelectedUserId(newQueue[nextIdx].id);
                    return newQueue;
                });
            }
        }
        setIsSending(false);
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

            const fileName = `${selectedUserId}_${Date.now()}_coach.${fileExt}`;
            const filePath = `${selectedUserId}/${fileName}`;

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
        e.target.value = ''; // Reset input
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
            return <img src={msg.media_url} alt="Allegato" style={{ width: '100%', borderRadius: '8px', marginBottom: msg.text ? '8px' : '0' }} />;
        }
        if (msg.media_type === 'video') {
            return <video src={msg.media_url} controls style={{ width: '100%', borderRadius: '8px', marginBottom: msg.text ? '8px' : '0' }} />;
        }
        if (msg.media_type === 'audio') {
            return <audio src={msg.media_url} controls style={{ width: '100%', minWidth: '220px', height: '40px', marginBottom: msg.text ? '8px' : '0' }} />;
        }
        return null;
    };

    const filteredAthletes = athletes.filter(a => a.full_name?.toLowerCase().includes(searchQuery.toLowerCase()));

    // Sort priority inbox logic
    const sortedAthletes = [...filteredAthletes].sort((a, b) => {
        const inboxA = inboxMap[a.id];
        const inboxB = inboxMap[b.id];

        const aWaiting = inboxA?.is_waiting_for_coach || false;
        const bWaiting = inboxB?.is_waiting_for_coach || false;

        if (aWaiting && !bWaiting) return -1;
        if (!aWaiting && bWaiting) return 1;

        if (aWaiting && bWaiting) {
            // Oldest waiting first
            const timeA = new Date(inboxA.waiting_since).getTime();
            const timeB = new Date(inboxB.waiting_since).getTime();
            return timeA - timeB;
        }

        // Newest handled first
        const timeA = inboxA ? new Date(inboxA.last_message_at).getTime() : 0;
        const timeB = inboxB ? new Date(inboxB.last_message_at).getTime() : 0;
        return timeB - timeA;
    });

    const waitingAthletes = sortedAthletes.filter(a => inboxMap[a.id]?.is_waiting_for_coach);
    const handledAthletes = sortedAthletes.filter(a => !inboxMap[a.id]?.is_waiting_for_coach);

    // --- Svuota Inbox Handlers ---
    const startSvuotaInbox = () => {
        if (waitingAthletes.length === 0) {
            alert("Nessuna chat in attesa!");
            return;
        }
        setSvuotaQueue(waitingAthletes);
        setSvuotaIndex(0);
        setIsSvuotaMode(true);
        setSelectedUserId(waitingAthletes[0].id);
    };

    const exitSvuotaInbox = () => {
        setIsSvuotaMode(false);
        setSvuotaQueue([]);
        setSvuotaIndex(0);
        setSelectedUserId(null);
    };

    const nextSvuotaChat = () => {
        if (svuotaIndex < svuotaQueue.length - 1) {
            const nextIdx = svuotaIndex + 1;
            setSvuotaIndex(nextIdx);
            setSelectedUserId(svuotaQueue[nextIdx].id);
        } else {
            alert('Hai visionato tutte le chat nella coda attuale.');
        }
    };

    const prevSvuotaChat = () => {
        if (svuotaIndex > 0) {
            const prevIdx = svuotaIndex - 1;
            setSvuotaIndex(prevIdx);
            setSelectedUserId(svuotaQueue[prevIdx].id);
        }
    };

    const renderAthleteListItem = (client, isWaiting) => {
        const inboxData = inboxMap[client.id];
        return (
            <div
                key={client.id}
                onClick={() => setSelectedUserId(client.id)}
                style={{
                    padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.02)',
                    cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '16px',
                    background: isWaiting ? 'rgba(0, 92, 75, 0.1)' : 'transparent',
                    borderLeft: isWaiting ? '4px solid #00cc88' : '4px solid transparent'
                }}
                onMouseEnter={e => e.currentTarget.style.background = isWaiting ? 'rgba(0, 92, 75, 0.2)' : 'rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background = isWaiting ? 'rgba(0, 92, 75, 0.1)' : 'transparent'}
            >
                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    {client.avatar_url ? (
                        <img src={client.avatar_url} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--surface-color-3)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '1.2rem', fontWeight: 600 }}>
                            {client.full_name?.charAt(0)}
                        </div>
                    )}
                    {isWaiting && (
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, background: '#00cc88', borderRadius: '50%', border: '3px solid var(--bg-main)' }} />
                    )}
                </div>

                {/* Info Text */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '1.1rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {client.full_name}
                        </span>
                        {/* Time */}
                        <span style={{ fontSize: '0.8rem', color: isWaiting ? '#00cc88' : 'var(--text-muted)' }}>
                            {inboxData?.last_message_at ? new Date(inboxData.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {/* Snippet */}
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {inboxData?.last_message_sender_role === 'coach' && (
                                <span style={{ color: 'var(--accent-gold)' }}>Tu: </span>
                            )}
                            {inboxData?.last_text || "Nessun messaggio"}
                        </span>

                        {/* Waiting Badge */}
                        {isWaiting && (
                            <span style={{ fontSize: '0.75rem', background: '#00cc88', color: '#000', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                Da <TimeAgo date={inboxData.waiting_since} />
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="admin-chat-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0 }}>
            {/* Header Finale - Nascondiamo se siamo in Dettaglio Chat per dare priorità all'header dedicato */}
            {!selectedUserId && (
                <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <span className="text-label" style={{ color: 'var(--accent-gold)', letterSpacing: '0.1em' }}>SUPPORTO</span>
                        <h1 className="text-h1" style={{ marginTop: '8px' }}>Coach Inbox</h1>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {!selectedUserId ? (
                    /* VISTA 1: Lista Inbox Stile WhatsApp */
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ padding: '24px 32px', display: 'flex', gap: '16px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                {isSearchOpen ? (
                                    <div style={{ flex: 1, maxWidth: '400px', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '0 16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <Search size={18} color="var(--text-muted)" />
                                        <input
                                            autoFocus
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            type="text"
                                            placeholder="Cerca atleta..."
                                            disabled={isSvuotaMode}
                                            style={{ background: 'transparent', border: 'none', color: '#fff', padding: '12px 16px', flex: 1, outline: 'none', fontSize: '1rem', fontFamily: 'Outfit' }}
                                        />
                                        <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsSearchOpen(true)}
                                        disabled={isSvuotaMode}
                                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', padding: '14px', cursor: isSvuotaMode ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'all 0.2s' }}
                                    >
                                        <Search size={20} />
                                    </button>
                                )}
                            </div>
                            {waitingAthletes.length > 0 && !isSvuotaMode && (
                                <button
                                    onClick={startSvuotaInbox}
                                    style={{
                                        padding: '12px 24px', borderRadius: '12px',
                                        background: 'var(--accent-gold)', color: '#000', fontWeight: 600, border: 'none',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                        transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(212,175,55,0.2)', whiteSpace: 'nowrap'
                                    }}
                                >
                                    <MessageSquare size={18} /> SVUOTA INBOX ({waitingAthletes.length})
                                </button>
                            )}
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', pointerEvents: isSvuotaMode ? 'none' : 'auto', opacity: isSvuotaMode ? 0.5 : 1 }}>
                            {waitingAthletes.length > 0 && (
                                <>
                                    <div style={{ padding: '12px 32px', background: 'rgba(0, 92, 75, 0.2)', fontSize: '0.75rem', fontWeight: 600, color: '#00cc88', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        In Attesa ({waitingAthletes.length})
                                    </div>
                                    {waitingAthletes.map(a => renderAthleteListItem(a, true))}
                                </>
                            )}

                            {(handledAthletes.length > 0 || waitingAthletes.length === 0) && (
                                <>
                                    <div style={{ padding: '12px 32px', background: 'rgba(255,255,255,0.02)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Gestiti ({handledAthletes.length})
                                    </div>
                                    {handledAthletes.map(a => renderAthleteListItem(a, false))}
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    /* VISTA 2: Dettaglio Chat Schermo Intero */
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', animation: 'fadeIn 0.2s ease-out' }}>
                        {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*,video/*"
                            onChange={handleFileSelect}
                        />

                        {/* Chat Header con Back Button ed (eventualmente) Controlli Svuota Inbox combinati */}
                        <div style={{ padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: isSvuotaMode ? 'var(--accent-gold)' : 'rgba(255,255,255,0.02)', color: isSvuotaMode ? '#000' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', transition: 'all 0.3s', flexWrap: 'wrap' }}>
                            <div className="flex-row items-center gap-3" style={{ flexWrap: 'nowrap' }}>
                                {!isSvuotaMode && (
                                    <button
                                        onClick={() => setSelectedUserId(null)}
                                        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', color: '#fff', padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s', marginRight: '6px' }}
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                )}
                                {athletes.find(a => a.id === selectedUserId)?.avatar_url ? (
                                    <img src={athletes.find(a => a.id === selectedUserId)?.avatar_url} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: isSvuotaMode ? 'rgba(0,0,0,0.1)' : 'var(--surface-color-3)', border: isSvuotaMode ? 'none' : '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {athletes.find(a => a.id === selectedUserId)?.full_name?.charAt(0)}
                                    </div>
                                )}
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <h2 className="text-h3" style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{athletes.find(a => a.id === selectedUserId)?.full_name}</h2>
                                    {isSvuotaMode ? (
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(0,0,0,0.6)', marginTop: '2px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            <span>Inbox {svuotaIndex + 1}/{svuotaQueue.length}</span>
                                            <span style={{ opacity: 0.5 }}>•</span>
                                            <span>Attesa: <TimeAgo date={inboxMap[selectedUserId]?.waiting_since} /></span>
                                        </div>
                                    ) : (
                                        inboxMap[selectedUserId]?.is_waiting_for_coach && (
                                            <div style={{ fontSize: '0.8rem', color: '#00cc88', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                In attesa da <TimeAgo date={inboxMap[selectedUserId]?.waiting_since} />
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Svuota Inbox Controls - Right Side */}
                            {isSvuotaMode && (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <button onClick={prevSvuotaChat} disabled={svuotaIndex === 0} style={{ padding: '6px 14px', border: '1px solid rgba(0,0,0,0.2)', background: 'transparent', borderRadius: '12px', color: '#000', cursor: svuotaIndex === 0 ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: svuotaIndex === 0 ? 0.3 : 1 }}>
                                        Indietro
                                    </button>
                                    <button onClick={nextSvuotaChat} disabled={svuotaIndex === svuotaQueue.length - 1} style={{ padding: '6px 14px', border: '1px solid rgba(0,0,0,0.2)', background: 'transparent', borderRadius: '12px', color: '#000', cursor: svuotaIndex === svuotaQueue.length - 1 ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: svuotaIndex === svuotaQueue.length - 1 ? 0.3 : 1 }}>
                                        Salta
                                    </button>
                                    <button onClick={exitSvuotaInbox} style={{ padding: '6px 14px', border: 'none', background: 'rgba(0,0,0,0.8)', color: 'var(--accent-gold)', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, marginLeft: '8px' }}>
                                        Esci
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Messages List - Layout Full Width */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {messages.length === 0 && (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
                                        Nessun messaggio con questo atleta.
                                    </div>
                                )}
                                {messages.map(msg => {
                                    const isCoach = msg.sender_id === user?.id;
                                    return (
                                        <div key={msg.id} style={{ alignSelf: isCoach ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                                            {isCoach && (
                                                <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', marginBottom: '4px', textAlign: 'right', fontWeight: 600, letterSpacing: '0.05em' }}>
                                                    {msg.sender?.full_name}
                                                </div>
                                            )}
                                            <div style={{
                                                padding: '12px 16px',
                                                borderRadius: isCoach ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                                background: isCoach ? 'var(--surface-color-3)' : 'var(--accent-teal)',
                                                color: isCoach ? '#fff' : '#000',
                                                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                            }}>
                                                {renderMedia(msg)}
                                                {msg.text && (
                                                    <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: isCoach ? 'right' : 'left' }}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Input Area - Full Width - Multi Media WhatsApp Style (Adapted) */}
                        <div style={{ padding: '24px 32px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'var(--surface-color)' }}>
                            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>

                                {/* Attachement Button */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isSending || isRecording}
                                    style={{ background: 'var(--surface-color-2)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', borderRadius: '50%', padding: '14px', cursor: (isSending || isRecording) ? 'not-allowed' : 'pointer', display: 'flex', transition: 'all 0.2s', opacity: (isSending || isRecording) ? 0.4 : 1 }}
                                >
                                    <ImageIcon size={22} />
                                </button>

                                {/* Text Input vs Recording Status */}
                                <div style={{ flex: 1, background: 'var(--surface-color-2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '12px 24px', display: 'flex', alignItems: 'center' }}>
                                    {isRecording ? (
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', color: '#ff4c4c', fontWeight: 500, animation: 'pulse 1.5s infinite' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff4c4c', marginRight: '10px' }} />
                                            Registrazione in corso... {formatTime(recordingTime)}
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={e => {
                                                setInputValue(e.target.value);
                                                if (presenceChannel) {
                                                    presenceChannel.track({ role: 'coach', isTyping: true });
                                                    clearTimeout(typingTimeoutRef.current);
                                                    typingTimeoutRef.current = setTimeout(() => {
                                                        presenceChannel.track({ role: 'coach', isTyping: false });
                                                    }, 3000);
                                                }
                                            }}
                                            onKeyPress={e => e.key === 'Enter' && handleSend()}
                                            disabled={isSending}
                                            placeholder="Scrivi una risposta..."
                                            style={{
                                                flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '1rem', fontFamily: 'Outfit', outline: 'none'
                                            }}
                                        />
                                    )}
                                </div>

                                {/* Send vs Mic/Stop Button */}
                                {inputValue.trim() || isSending ? (
                                    <button
                                        onClick={() => handleSend()}
                                        disabled={isSending}
                                        style={{ background: inputValue.trim() ? 'var(--accent-gold)' : 'var(--surface-color-3)', border: 'none', color: '#000', cursor: isSending ? 'not-allowed' : 'pointer', padding: '16px', borderRadius: '50%', display: 'flex', transition: 'background 0.2s', opacity: isSending ? 0.5 : 1 }}>
                                        <Send size={24} />
                                    </button>
                                ) : isRecording ? (
                                    <button
                                        onClick={stopRecording}
                                        style={{ background: '#ff4c4c', border: 'none', color: '#fff', cursor: 'pointer', padding: '16px', borderRadius: '50%', display: 'flex', transition: 'all 0.2s', animation: 'pulseGlow 2s infinite' }}>
                                        <Square size={20} fill="currentColor" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={startRecording}
                                        style={{ background: 'var(--accent-gold)', border: 'none', color: '#000', cursor: 'pointer', padding: '16px', borderRadius: '50%', display: 'flex', transition: 'background 0.2s' }}>
                                        <Mic size={24} />
                                    </button>
                                )}

                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminChat;
