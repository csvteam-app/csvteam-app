import React, { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Return YYYY-MM-DD in local timezone (avoids UTC shift from toISOString) */
function toLocalDateStr(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

/**
 * FatSecret-style horizontal date strip.
 * Shows 7 days centered on current selection (3 back + today + 3 forward).
 */
const DateStrip = ({ selectedDate, onDateChange }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = toLocalDateStr(today);

    // Build +/- 3 days from selectedDate
    const selected = new Date(selectedDate + 'T12:00:00'); // noon to avoid DST edge
    const days = [];
    for (let i = -3; i <= 3; i++) {
        const d = new Date(selected);
        d.setDate(d.getDate() + i);
        const dStr = toLocalDateStr(d);
        days.push({
            date: dStr,
            dayName: d.toLocaleDateString('it-IT', { weekday: 'short' }).replace('.', ''),
            dayNum: d.getDate(),
            isToday: dStr === todayStr,
            isSelected: dStr === selectedDate,
        });
    }

    const goBack = () => {
        const d = new Date(selectedDate + 'T12:00:00');
        d.setDate(d.getDate() - 1);
        onDateChange(toLocalDateStr(d));
    };

    const goForward = () => {
        const d = new Date(selectedDate + 'T12:00:00');
        d.setDate(d.getDate() + 1);
        onDateChange(toLocalDateStr(d));
    };

    const goToToday = () => {
        onDateChange(todayStr);
    };

    // Format header label
    const getHeaderLabel = () => {
        if (selectedDate === todayStr) return 'Oggi';
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (selectedDate === toLocalDateStr(yesterday)) return 'Ieri';
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (selectedDate === toLocalDateStr(tomorrow)) return 'Domani';
        return selected.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
    };

    return (
        <div style={{ marginBottom: '20px' }}>
            {/* Navigation row: arrows + label */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
            }}>
                <button
                    onClick={goBack}
                    style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        width: '36px', height: '36px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'rgba(255,255,255,0.6)',
                        transition: 'all 0.2s',
                    }}
                >
                    <ChevronLeft size={18} />
                </button>

                <button
                    onClick={goToToday}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                    }}
                >
                    <span style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 700,
                        fontSize: '1.05rem',
                        color: '#fff',
                        letterSpacing: '0.02em',
                    }}>
                        {getHeaderLabel()}
                    </span>
                    <span style={{
                        fontSize: '0.68rem',
                        color: 'rgba(255,255,255,0.35)',
                        fontWeight: 500,
                        letterSpacing: '0.04em',
                    }}>
                        {selected.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                </button>

                <button
                    onClick={goForward}
                    style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        width: '36px', height: '36px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'rgba(255,255,255,0.6)',
                        transition: 'all 0.2s',
                    }}
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Day pills strip */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '4px',
                    padding: '4px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.04)',
                }}
            >
                {days.map((day) => (
                    <button
                        key={day.date}
                        onClick={() => onDateChange(day.date)}
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '8px 0 6px',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            border: 'none',
                            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            background: day.isSelected
                                ? 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)'
                                : 'transparent',
                            boxShadow: day.isSelected
                                ? '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                                : 'none',
                            position: 'relative',
                        }}
                    >
                        {/* Day abbreviation */}
                        <span style={{
                            fontSize: '0.6rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            color: day.isSelected
                                ? 'var(--accent-gold, #FFDCA0)'
                                : 'rgba(255,255,255,0.35)',
                            transition: 'color 0.3s',
                        }}>
                            {day.dayName}
                        </span>

                        {/* Day number */}
                        <span style={{
                            fontSize: '1rem',
                            fontWeight: day.isSelected ? 800 : 600,
                            color: day.isSelected ? '#fff' : 'rgba(255,255,255,0.5)',
                            transition: 'all 0.3s',
                            fontFamily: 'Outfit, sans-serif',
                        }}>
                            {day.dayNum}
                        </span>

                        {/* Today indicator dot */}
                        {day.isToday && (
                            <div style={{
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                background: 'var(--accent-gold, #FFDCA0)',
                                boxShadow: '0 0 6px rgba(255,220,160,0.6)',
                                position: 'absolute',
                                bottom: '3px',
                            }} />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DateStrip;
