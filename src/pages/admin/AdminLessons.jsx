import { useState } from 'react';
import { List, Users, PlusCircle, CreditCard, Bot, Clock } from 'lucide-react';

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
                            className="flex-row gap-2 items-center"
                            style={{
                                padding: '10px 16px',
                                borderRadius: '12px',
                                background: activeTab === tab.id
                                    ? 'rgba(212,175,55,0.1)'
                                    : 'transparent',
                                color: activeTab === tab.id
                                    ? 'var(--accent-gold)'
                                    : 'var(--text-muted)',
                                border: `1px solid ${activeTab === tab.id
                                    ? 'rgba(212,175,55,0.2)'
                                    : 'transparent'}`,
                                fontWeight: activeTab === tab.id ? 600 : 500,
                                fontSize: '0.88rem',
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                fontFamily: 'Outfit, sans-serif',
                                whiteSpace: 'nowrap',
                                minHeight: '44px',
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
