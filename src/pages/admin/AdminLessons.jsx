import { useState } from 'react';
import { List, Users, PlusCircle, Settings, CreditCard, Bot, Clock } from 'lucide-react';

// Sotto-componenti
import AdminLessonsRegistro from './lessons/AdminLessonsRegistro';
import AdminLessonCreate from './lessons/AdminLessonCreate';
import AdminLessonsMatch from './lessons/AdminLessonsMatch';
import AdminCoachAvailability from './lessons/AdminCoachAvailability';
import AdminPackages from './lessons/AdminPackages';
import AdminAIAssistant from './lessons/AdminAIAssistant';

const AdminLessons = () => {
    const [activeTab, setActiveTab] = useState('registro');

    const tabs = [
        { id: 'registro', label: 'Registro', icon: <List size={16} strokeWidth={1.5} /> },
        { id: 'nuova', label: 'Nuova', icon: <PlusCircle size={16} strokeWidth={1.5} /> },
        { id: 'matching', label: 'Coppie', icon: <Users size={16} strokeWidth={1.5} /> },
        { id: 'disponibilita', label: 'I Miei Orari', icon: <Clock size={16} strokeWidth={1.5} /> },
        { id: 'pacchetti', label: 'Crediti', icon: <CreditCard size={16} strokeWidth={1.5} /> },
        { id: 'ai', label: 'AI', icon: <Bot size={16} strokeWidth={1.5} /> },
    ];

    return (
        <div className="global-container" style={{ margin: '0 auto' }}>
            {/* Header & Tabs */}
            <div className="flex-col gap-3 animate-fade-in" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '24px' }}>
                <div>
                    <p className="text-label" style={{ marginBottom: '8px' }}>Gestione Calendario</p>
                    <h1 className="text-h1" style={{ color: '#fff' }}>Lezioni & Appuntamenti</h1>
                </div>

                <div className="flex-row gap-1" style={{ overflowX: 'auto', paddingBottom: '8px' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="flex-row gap-1 items-center"
                            style={{
                                padding: '8px 14px',
                                borderRadius: '12px',
                                background: activeTab === tab.id
                                    ? tab.id === 'ai' ? 'rgba(147,112,219,0.12)' : 'rgba(212,175,55,0.1)'
                                    : 'transparent',
                                color: activeTab === tab.id
                                    ? tab.id === 'ai' ? '#9370DB' : 'var(--accent-gold)'
                                    : 'var(--text-muted)',
                                border: `1px solid ${activeTab === tab.id
                                    ? tab.id === 'ai' ? 'rgba(147,112,219,0.25)' : 'rgba(212,175,55,0.2)'
                                    : 'transparent'}`,
                                fontWeight: activeTab === tab.id ? 600 : 500,
                                fontSize: '0.85rem',
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                fontFamily: 'Outfit, sans-serif',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="animate-fade-in" style={{ minHeight: '500px', paddingTop: '24px' }}>
                {activeTab === 'registro' && <AdminLessonsRegistro />}
                {activeTab === 'nuova' && <AdminLessonCreate />}
                {activeTab === 'matching' && <AdminLessonsMatch />}
                {activeTab === 'disponibilita' && <AdminCoachAvailability />}
                {activeTab === 'pacchetti' && <AdminPackages />}
                {activeTab === 'ai' && <AdminAIAssistant />}
            </div>
        </div>
    );
};

export default AdminLessons;
