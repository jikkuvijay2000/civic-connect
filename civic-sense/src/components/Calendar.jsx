import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaPlus, FaTrash, FaStickyNote, FaCalendarDay, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

/* ── Note color options ──────────────────────────────────────────── */
const NOTE_COLORS = [
    { bg: '#fef9c3', border: '#fef08a', text: '#713f12' },   // yellow
    { bg: '#dbeafe', border: '#bfdbfe', text: '#1e3a5f' },   // blue
    { bg: '#dcfce7', border: '#bbf7d0', text: '#14532d' },   // green
    { bg: '#fce7f3', border: '#fbcfe8', text: '#831843' },   // pink
    { bg: '#f3e8ff', border: '#e9d5ff', text: '#581c87' },   // purple
];

const Calendar = () => {
    const [date, setDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [noteText, setNoteText] = useState('');
    const [events, setEvents] = useState([]);
    const [colorIdx, setColorIdx] = useState(0);
    const [deletingId, setDeletingId] = useState(null);
    const [showNoteInput, setShowNoteInput] = useState(false);

    const fetchNotes = async () => {
        try {
            const res = await api.get('/note/usernotes');
            if (res.data.status === 'success') {
                setEvents(res.data.data.map(note => {
                    const d = new Date(note.date);
                    return {
                        ...note,
                        date: d.getDate(),
                        month: d.getMonth(),
                        year: d.getFullYear(),
                        title: note.content,
                        colorIdx: note.colorIdx ?? Math.floor(Math.random() * NOTE_COLORS.length),
                    };
                }));
            }
        } catch (e) { console.error('Error fetching notes:', e); }
    };

    React.useEffect(() => { fetchNotes(); }, []);

    const handleAddNote = async () => {
        if (!noteText.trim()) return;
        try {
            const res = await api.post('/note/add', {
                content: noteText,
                date: selectedDate,
                colorIdx,
            });
            if (res.data.status === 'success') {
                setNoteText('');
                setShowNoteInput(false);
                fetchNotes();
            }
        } catch (e) { console.error('Error adding note:', e); }
    };

    const handleDeleteNote = async (noteId) => {
        setDeletingId(noteId);
        try {
            await api.delete(`/note/delete/${noteId}`);
            setEvents(prev => prev.filter(e => e._id !== noteId));
        } catch (e) { console.error('Error deleting note:', e); }
        finally { setDeletingId(null); }
    };

    /* ── Calendar grid helpers ── */
    const currentYear = date.getFullYear();
    const daysInMonth = new Date(currentYear, date.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentYear, date.getMonth(), 1).getDay();
    const currentMonth = date.toLocaleString('default', { month: 'long' });

    const handlePrevMonth = () => setDate(new Date(currentYear, date.getMonth() - 1, 1));
    const handleNextMonth = () => setDate(new Date(currentYear, date.getMonth() + 1, 1));
    const handleDateClick = (day) => {
        setSelectedDate(new Date(currentYear, date.getMonth(), day));
        setShowNoteInput(false);
    };

    const getEventsForDay = (day) =>
        events.filter(e => e.date === day && e.month === date.getMonth() && e.year === currentYear);

    const selectedDayEvents = getEventsForDay(selectedDate.getDate());
    const today = new Date();

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`e${i}`} className="p-1" />);
    for (let i = 1; i <= daysInMonth; i++) {
        const isToday = i === today.getDate() && date.getMonth() === today.getMonth() && currentYear === today.getFullYear();
        const isSelected = i === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && currentYear === selectedDate.getFullYear();
        const hasEvents = getEventsForDay(i).length > 0;

        days.push(
            <motion.button
                key={i}
                whileTap={{ scale: 0.88 }}
                onClick={() => handleDateClick(i)}
                className="border-0 d-flex align-items-center justify-content-center position-relative"
                style={{
                    width: '32px', height: '32px',
                    borderRadius: '50%',
                    background: isSelected ? '#6366f1' : isToday ? 'transparent' : 'transparent',
                    color: isSelected ? 'white' : isToday ? '#6366f1' : '#374151',
                    fontWeight: isSelected || isToday ? 700 : 400,
                    border: isToday && !isSelected ? '2px solid #6366f1' : 'none',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    outline: 'none',
                    margin: '2px',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#eef2ff'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
            >
                {i}
                {hasEvents && !isSelected && (
                    <span
                        className="position-absolute"
                        style={{ bottom: '3px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', background: '#6366f1' }}
                    />
                )}
            </motion.button>
        );
    }

    const nc = NOTE_COLORS[colorIdx];

    return (
        <div>
            {/* ── Month navigation ── */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h6 className="fw-bold text-dark mb-0">{currentMonth}</h6>
                    <small className="text-muted">{currentYear}</small>
                </div>
                <div className="d-flex gap-1">
                    <button onClick={handlePrevMonth} className="btn btn-sm border d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', borderRadius: '8px', padding: 0, background: 'white' }}>
                        <FaChevronLeft size={10} className="text-muted" />
                    </button>
                    <button onClick={handleNextMonth} className="btn btn-sm border d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', borderRadius: '8px', padding: 0, background: 'white' }}>
                        <FaChevronRight size={10} className="text-muted" />
                    </button>
                </div>
            </div>

            {/* ── Day headers ── */}
            <div className="d-flex justify-content-between mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} style={{ width: '32px', textAlign: 'center', fontSize: '0.68rem', fontWeight: 600, color: '#94a3b8', margin: '2px' }}>
                        {d}
                    </div>
                ))}
            </div>

            {/* ── Grid ── */}
            <div className="d-flex flex-wrap mb-4">
                {days}
            </div>

            {/* ── Selected date + notes ── */}
            <div className="border-top pt-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-2">
                        <FaCalendarDay size={12} style={{ color: '#6366f1' }} />
                        <span className="fw-bold text-dark" style={{ fontSize: '0.82rem' }}>
                            {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                    <button
                        onClick={() => setShowNoteInput(!showNoteInput)}
                        className="btn btn-sm d-flex align-items-center gap-1 fw-medium"
                        style={{ borderRadius: '8px', background: showNoteInput ? '#eef2ff' : 'white', color: '#6366f1', border: '1px solid #a5b4fc', fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                        {showNoteInput ? <><FaTimes size={10} /> Cancel</> : <><FaPlus size={10} /> Add</>}
                    </button>
                </div>

                {/* Note input */}
                <AnimatePresence>
                    {showNoteInput && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden mb-3"
                        >
                            {/* Color picker */}
                            <div className="d-flex gap-1 mb-2">
                                {NOTE_COLORS.map((c, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setColorIdx(i)}
                                        className="border-0 rounded-circle"
                                        style={{
                                            width: '18px', height: '18px',
                                            background: c.bg,
                                            border: `2px solid ${i === colorIdx ? c.text : c.border}`,
                                            cursor: 'pointer',
                                            outline: i === colorIdx ? `2px solid ${c.text}` : 'none',
                                            outlineOffset: '1px',
                                        }}
                                    />
                                ))}
                            </div>

                            <div className="rounded-3 overflow-hidden border" style={{ background: nc.bg, borderColor: nc.border }}>
                                <textarea
                                    className="form-control border-0 shadow-none p-3"
                                    rows={2}
                                    placeholder="Write your note..."
                                    value={noteText}
                                    onChange={e => setNoteText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAddNote()}
                                    autoFocus
                                    style={{ background: 'transparent', color: nc.text, fontSize: '0.82rem', resize: 'none' }}
                                />
                                <div className="d-flex justify-content-end px-3 pb-2">
                                    <button
                                        onClick={handleAddNote}
                                        disabled={!noteText.trim()}
                                        className="btn btn-sm fw-bold"
                                        style={{ borderRadius: '8px', background: nc.text, color: 'white', border: 'none', fontSize: '0.75rem', padding: '4px 14px', opacity: noteText.trim() ? 1 : 0.5 }}
                                    >
                                        Save Note
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Notes list */}
                <div className="d-flex flex-column gap-2" style={{ maxHeight: '220px', overflowY: 'auto', scrollbarWidth: 'none' }}>
                    <AnimatePresence mode="popLayout">
                        {selectedDayEvents.length > 0 ? (
                            selectedDayEvents.map((ev) => {
                                const c = NOTE_COLORS[ev.colorIdx ?? 0];
                                return (
                                    <motion.div
                                        key={ev._id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: 24, scale: 0.94 }}
                                        transition={{ duration: 0.18 }}
                                        className="position-relative overflow-hidden rounded-3"
                                        style={{
                                            background: c.bg,
                                            border: `1px solid ${c.border}`,
                                            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                                        }}
                                    >
                                        {/* Left accent bar */}
                                        <div style={{
                                            position: 'absolute', top: 0, left: 0, bottom: 0,
                                            width: '3px', background: c.text, borderRadius: '3px 0 0 3px',
                                        }} />

                                        <div className="ps-4 pe-3 pt-3 pb-2 d-flex align-items-start gap-2">
                                            {/* Note content */}
                                            <p className="mb-0 flex-grow-1" style={{ fontSize: '0.82rem', color: c.text, lineHeight: 1.6, fontWeight: 500 }}>
                                                {ev.title}
                                            </p>
                                            {/* Delete button */}
                                            <button
                                                onClick={() => handleDeleteNote(ev._id)}
                                                disabled={deletingId === ev._id}
                                                title="Delete note"
                                                className="border-0 d-flex align-items-center justify-content-center flex-shrink-0"
                                                style={{
                                                    width: '24px', height: '24px', borderRadius: '8px',
                                                    background: `${c.text}18`,
                                                    color: c.text, cursor: 'pointer',
                                                    transition: 'background 0.15s',
                                                    marginTop: '1px',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = `${c.text}30`}
                                                onMouseLeave={e => e.currentTarget.style.background = `${c.text}18`}
                                            >
                                                {deletingId === ev._id
                                                    ? <span className="spinner-border" style={{ width: '10px', height: '10px', borderWidth: '1.5px' }} />
                                                    : <FaTrash size={9} />}
                                            </button>
                                        </div>

                                        {/* Faint timestamp */}
                                        <div className="ps-4 pb-2" style={{ fontSize: '0.68rem', color: c.text, opacity: 0.5, fontWeight: 500 }}>
                                            {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-4 rounded-3"
                                style={{ background: '#f8fafc', border: '1.5px dashed #e2e8f0' }}
                            >
                                <FaStickyNote size={20} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                                <p className="mb-0 fw-medium" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No notes for this day</p>
                                <small style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>Click + Add to create one</small>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Calendar;
