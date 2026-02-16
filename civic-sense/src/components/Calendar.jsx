import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';

const Calendar = () => {
    const [date, setDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [note, setNote] = useState("");

    const [events, setEvents] = useState([]);

    const fetchNotes = async () => {
        try {
            const response = await api.get('/note/usernotes');
            if (response.data.status === "success") {
                const fetchedNotes = response.data.data.map(note => {
                    const noteDate = new Date(note.date);
                    return {
                        ...note,
                        date: noteDate.getDate(),
                        month: noteDate.getMonth(),
                        year: noteDate.getFullYear(),
                        title: note.content,
                        type: "personal",
                        color: "text-info"
                    };
                });
                setEvents(fetchedNotes);
            }
        } catch (error) {
            console.error("Error fetching notes:", error);
        }
    };

    React.useEffect(() => {
        fetchNotes();
    }, []);

    const handleAddNote = async () => {
        if (!note.trim()) return;
        try {
            const response = await api.post('/note/add', {
                content: note,
                date: selectedDate
            });
            if (response.data.status === "success") {
                setNote("");
                fetchNotes(); // Refresh notes
            }
        } catch (error) {
            console.error("Error adding note:", error);
        }
    };
    const currentMonth = date.toLocaleString('default', { month: 'long' });
    const currentYear = date.getFullYear();
    const daysInMonth = new Date(currentYear, date.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentYear, date.getMonth(), 1).getDay();

    const handlePrevMonth = () => setDate(new Date(currentYear, date.getMonth() - 1, 1));
    const handleNextMonth = () => setDate(new Date(currentYear, date.getMonth() + 1, 1));

    const handleDateClick = (day) => {
        setSelectedDate(new Date(currentYear, date.getMonth(), day));
    };

    const getEventsForDay = (day) => {
        return events.filter(e => e.date === day && e.month === date.getMonth() && e.year === date.getFullYear());
    };

    const days = [];
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const isToday = i === new Date().getDate() && date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear();
        const isSelected = i === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();
        const dayEvents = getEventsForDay(i);
        const hasEvents = dayEvents.length > 0;

        days.push(
            <motion.div
                key={i}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDateClick(i)}
                className={`position-relative p-2 text-center rounded-circle cursor-pointer transition-fast
                    ${isSelected ? 'bg-primary-custom text-white shadow-custom-md' : 'text-main hover-bg-light'}
                    ${isToday && !isSelected ? 'border border-2 border-primary text-primary-custom fw-bold' : ''}`}
                style={{ width: '36px', height: '36px', lineHeight: '20px', fontSize: '14px', margin: '2px' }}
            >
                {i}
                {hasEvents && !isSelected && (
                    <div className="position-absolute bottom-0 start-50 translate-middle-x mb-1 d-flex gap-1 justify-content-center">
                        <div className="rounded-circle bg-primary-custom" style={{ width: '4px', height: '4px' }}></div>
                    </div>
                )}
            </motion.div>
        );
    }

    const selectedDayEvents = getEventsForDay(selectedDate.getDate());

    return (
        <div className="bg-surface rounded-custom-xl shadow-custom-sm p-4 sticky-top border border-light">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold mb-0 text-dark text-capitalize ls-wide">{currentMonth} <span className="fw-light">{currentYear}</span></h5>
                <div className="d-flex gap-2">
                    <button onClick={handlePrevMonth} className="btn btn-light rounded-circle p-2 shadow-sm border-0 hover-scale"><FaChevronLeft size={12} /></button>
                    <button onClick={handleNextMonth} className="btn btn-light rounded-circle p-2 shadow-sm border-0 hover-scale"><FaChevronRight size={12} /></button>
                </div>
            </div>

            {/* Days Header */}
            <div className="d-flex justify-content-between text-muted small mb-3 fw-bold text-uppercase opacity-50" style={{ fontSize: '0.75rem' }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} style={{ width: '36px', textAlign: 'center' }}>{d}</div>
                ))}
            </div>

            {/* Grid */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
                {days}
            </div>

            {/* Selected Date Details */}
            <div className="border-top pt-4">
                <h6 className="fw-bold text-dark mb-3 d-flex align-items-center justify-content-between">
                    <span>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                    {selectedDayEvents.length > 0 &&
                        <span className="badge bg-primary-light text-primary-custom rounded-pill px-3 py-1 fw-medium" style={{ fontSize: '11px' }}>
                            {selectedDayEvents.length} Events
                        </span>
                    }
                </h6>

                <div className="d-flex flex-column gap-3 mb-3 max-vh-20 overflow-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {selectedDayEvents.length > 0 ? (
                            selectedDayEvents.map((ev, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="p-3 rounded-custom bg-body border-start border-4 border-primary shadow-sm hover-scale cursor-default"
                                >
                                    <div className={`fw-bold small mb-1 ${ev.color}`}>{ev.title}</div>
                                    <div className="text-muted extra-small text-uppercase" style={{ fontSize: '10px', letterSpacing: '1px' }}>{ev.type}</div>
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="text-center py-4 text-muted small bg-light rounded-custom border border-dashed"
                            >
                                No events scheduled for this day.
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Quick Add */}
                <div className="bg-body p-2 rounded-custom border">
                    <div className="input-group input-group-sm">
                        <input
                            type="text"
                            className="form-control border-0 bg-transparent shadow-none ps-3"
                            placeholder="Add a quick note..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                        />
                        <button onClick={handleAddNote} className="btn text-primary-custom shadow-none hover-scale"><FaPlus /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calendar;
