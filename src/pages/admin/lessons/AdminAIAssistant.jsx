import { useState, useRef, useEffect } from 'react';
import { useAdminLessons } from '../../../hooks/useAdminLessons';
import { useAdminAuth } from '../../../hooks/useAdminAuth';
import { Bot, Send, Loader, Sparkles, Calendar, Users, Package, AlertTriangle } from 'lucide-react';

const QUICK_ACTIONS = [
    { label: 'Trova buchi agenda', prompt: 'Analizza la mia agenda di questa settimana e dimmi dove ho buchi da riempire.', icon: Calendar },
    { label: 'Coppie compatibili', prompt: 'Quali coppie di atleti sono compatibili per lezioni di coppia?', icon: Users },
    { label: 'Ottimizza settimana', prompt: 'Suggeriscimi come ottimizzare la mia agenda per la prossima settimana: riempi i buchi, proponi coppie e suggerisci orari migliori.', icon: Sparkles },
    { label: 'Crediti atleti', prompt: 'Mostrami lo stato dei crediti di tutti gli atleti che ne hanno attivi.', icon: Package },
];

const AdminAIAssistant = () => {
    const { admin } = useAdminAuth();
    const { askAI } = useAdminLessons();
    const coachId = admin?.id;

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    const handleSend = async (text) => {
        const msg = text || input.trim();
        if (!msg || !coachId) return;

        setMessages(prev => [...prev, { role: 'user', content: msg }]);
        setInput('');
        setIsThinking(true);

        const result = await askAI(msg, coachId);

        setIsThinking(false);

        if (result.error) {
            setMessages(prev => [...prev, { role: 'error', content: result.error }]);
        } else {
            setMessages(prev => [...prev, { role: 'assistant', content: result.response }]);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex-col" style={{ height: '100%', minHeight: '500px' }}>
            {/* Header */}
            <div className="flex-row items-center gap-3" style={{ marginBottom: '16px' }}>
                <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))',
                    border: '1px solid rgba(212,175,55,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Bot size={20} color="var(--accent-gold)" />
                </div>
                <div>
                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', color: '#fff', margin: 0 }}>
                        Assistente Agenda AI
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
                        Chiedi qualsiasi cosa sulla tua agenda
                    </p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="glass-card" style={{
                flex: 1, padding: '16px', overflow: 'auto',
                display: 'flex', flexDirection: 'column', gap: '12px',
                minHeight: '300px', maxHeight: '500px'
            }}>
                {messages.length === 0 && !isThinking && (
                    <div className="flex-col items-center justify-center" style={{ flex: 1, gap: '20px' }}>
                        <Sparkles size={36} color="rgba(212,175,55,0.3)" />
                        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                            <p style={{ color: '#fff', fontWeight: 600, fontSize: '1rem', marginBottom: '8px' }}>
                                Come posso aiutarti?
                            </p>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                Posso cercare slot, creare lezioni, trovare coppie compatibili, analizzare buchi, controllare crediti e spostare appuntamenti.
                            </p>
                        </div>

                        {/* Quick Actions */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', maxWidth: '400px' }}>
                            {QUICK_ACTIONS.map((qa, idx) => {
                                const Icon = qa.icon;
                                return (
                                    <button key={idx} onClick={() => handleSend(qa.prompt)} style={{
                                        padding: '12px', borderRadius: '12px', cursor: 'pointer',
                                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                        color: '#fff', fontFamily: 'Outfit', fontSize: '0.8rem', fontWeight: 500,
                                        display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left',
                                        transition: 'all 0.2s'
                                    }}>
                                        <Icon size={14} color="var(--accent-gold)" />
                                        {qa.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className="animate-fade-in" style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%'
                    }}>
                        <div style={{
                            padding: '12px 16px',
                            borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            background: msg.role === 'user'
                                ? 'rgba(212,175,55,0.15)'
                                : msg.role === 'error'
                                    ? 'rgba(255,100,100,0.1)'
                                    : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${msg.role === 'user' ? 'rgba(212,175,55,0.2)'
                                    : msg.role === 'error' ? 'rgba(255,100,100,0.2)'
                                        : 'rgba(255,255,255,0.06)'
                                }`,
                            color: msg.role === 'error' ? '#ff6464' : '#fff',
                            fontSize: '0.9rem',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap'
                        }}>
                            {msg.role === 'error' && (
                                <div className="flex-row items-center gap-2" style={{ marginBottom: '6px', color: '#ff6464', fontWeight: 600, fontSize: '0.8rem' }}>
                                    <AlertTriangle size={14} /> Errore
                                </div>
                            )}
                            {msg.role === 'assistant' && (
                                <div className="flex-row items-center gap-2" style={{ marginBottom: '6px', color: 'var(--accent-gold)', fontWeight: 600, fontSize: '0.8rem' }}>
                                    <Bot size={14} /> Assistente AI
                                </div>
                            )}
                            {msg.content}
                        </div>
                    </div>
                ))}

                {isThinking && (
                    <div className="flex-row items-center gap-2 animate-fade-in" style={{
                        padding: '12px 16px', borderRadius: '16px 16px 16px 4px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        alignSelf: 'flex-start',
                        color: 'var(--accent-gold)', fontSize: '0.85rem'
                    }}>
                        <Loader size={16} className="spin" /> Analizzo la tua agenda...
                    </div>
                )}

                <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="flex-row gap-2" style={{ marginTop: '12px' }}>
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Es: Trova uno slot per Marco venerdì pomeriggio..."
                    disabled={isThinking}
                    style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '14px',
                        padding: '14px 18px',
                        color: '#fff',
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '0.95rem',
                        outline: 'none'
                    }}
                />
                <button
                    onClick={() => handleSend()}
                    disabled={isThinking || !input.trim()}
                    style={{
                        width: 48, height: 48, borderRadius: '14px', cursor: 'pointer',
                        background: input.trim() ? 'var(--accent-gold)' : 'rgba(255,255,255,0.04)',
                        border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                        opacity: isThinking ? 0.5 : 1
                    }}
                >
                    <Send size={20} color={input.trim() ? '#000' : 'var(--text-muted)'} />
                </button>
            </div>
        </div>
    );
};

export default AdminAIAssistant;
