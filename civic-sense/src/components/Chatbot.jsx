import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCommentDots, FaTimes, FaRegPaperPlane, FaRobot, FaUser } from 'react-icons/fa';
import api from '../api/axios'; // Adjust path if needed
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify'; // Important for safely rendering markdown

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hi there! I'm Civic AI. How can I assist you with your community today?", sender: 'bot', timestamp: new Date() }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const toggleChat = () => setIsOpen(!isOpen);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen, isTyping]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessageText = input.trim();
        const newUserMessage = { id: Date.now(), text: userMessageText, sender: 'user', timestamp: new Date() };

        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsTyping(true);

        try {
            // Prepare history for API
            // Format needed by our backend: array of { role: 'user' | 'model', text: string }
            const history = messages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                text: msg.text
            }));

            // Call the backend API
            const response = await api.post('/api/chat', {
                prompt: userMessageText,
                history: history
            });

            if (response.data.success) {
                const botMessage = {
                    id: Date.now() + 1,
                    text: response.data.response,
                    sender: 'bot',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, botMessage]);
            } else {
                throw new Error(response.data.message || "Unknown error from server");
            }
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage = {
                id: Date.now() + 1,
                text: "Sorry, I'm having trouble connecting to my servers right now. Please try again later.",
                sender: 'bot',
                isError: true,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    // Formatter for time
    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessageContent = (msg) => {
        if (msg.sender === 'user') {
            return <span>{msg.text}</span>;
        } else {
            const cleanHtml = DOMPurify.sanitize(msg.text);
            return (
                <div className="markdown-body" style={{ fontSize: '0.9rem' }}>
                    <ReactMarkdown>{cleanHtml}</ReactMarkdown>
                </div>
            );
        }
    }

    return (
        <div className="position-fixed z-3" style={{ bottom: '30px', right: '30px' }}>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9, transition: { duration: 0.2 } }}
                        className="bg-white rounded-4 shadow-lg d-flex flex-column overflow-hidden border border-light"
                        style={{ width: '380px', height: '600px', maxHeight: '80vh', marginBottom: '80px', right: '0', position: 'absolute', bottom: '0' }}
                    >
                        {/* Header */}
                        <div className="bg-primary text-white p-3 d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, var(--primary-color), #2563eb)' }}>
                            <div className="d-flex align-items-center gap-2">
                                <div className="bg-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                                    <FaRobot className="text-primary" size={20} />
                                </div>
                                <div>
                                    <h6 className="mb-0 fw-bold m-0" style={{ letterSpacing: '0.5px' }}>Civic AI Assistant</h6>
                                    <small className="opacity-75" style={{ fontSize: '11px' }}>Powered by Gemini</small>
                                </div>
                            </div>
                            <button onClick={toggleChat} className="btn btn-sm text-white hover-bg-white hover-bg-opacity-25 rounded-circle p-2 transition-fast">
                                <FaTimes size={16} />
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-grow-1 p-3 overflow-auto d-flex flex-column gap-3 bg-light" style={{ scrollBehavior: 'smooth' }}>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`d-flex ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                                >
                                    <div className={`d-flex gap-2 max-w-75 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`} style={{ maxWidth: '85%' }}>
                                        <div className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${msg.sender === 'user' ? 'bg-primary-subtle text-primary' : 'bg-white shadow-sm text-primary'}`} style={{ width: '28px', height: '28px' }}>
                                            {msg.sender === 'user' ? <FaUser size={12} /> : <FaRobot size={14} />}
                                        </div>
                                        <div>
                                            <div
                                                className={`p-3 rounded-4 shadow-sm ${msg.sender === 'user'
                                                        ? 'bg-primary text-white'
                                                        : msg.isError
                                                            ? 'bg-danger-subtle text-danger border border-danger-subtle'
                                                            : 'bg-white text-dark border border-light'
                                                    }`}
                                                style={{
                                                    borderTopRightRadius: msg.sender === 'user' ? '4px' : '16px',
                                                    borderTopLeftRadius: msg.sender === 'bot' ? '4px' : '16px',
                                                    fontSize: '0.95rem',
                                                    lineHeight: '1.5'
                                                }}
                                            >
                                                {renderMessageContent(msg)}
                                            </div>
                                            <div className={`text-muted mt-1 px-1 ${msg.sender === 'user' ? 'text-end' : 'text-start'}`} style={{ fontSize: '10px' }}>
                                                {formatTime(msg.timestamp)}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Typing Indicator */}
                            {isTyping && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="d-flex justify-content-start">
                                    <div className="d-flex gap-2" style={{ maxWidth: '85%' }}>
                                        <div className="bg-white rounded-circle shadow-sm text-primary d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '28px', height: '28px' }}>
                                            <FaRobot size={14} />
                                        </div>
                                        <div className="bg-white p-3 rounded-4 shadow-sm border border-light d-flex align-items-center gap-1" style={{ borderTopLeftRadius: '4px' }}>
                                            <motion.div className="bg-secondary rounded-circle" style={{ width: '6px', height: '6px' }} animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                                            <motion.div className="bg-secondary rounded-circle" style={{ width: '6px', height: '6px' }} animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                                            <motion.div className="bg-secondary rounded-circle" style={{ width: '6px', height: '6px' }} animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="p-3 bg-white border-top border-light shadow-sm z-1">
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control rounded-pill px-4 py-2 bg-light border-0 shadow-none focus-ring-primary"
                                    placeholder="Type a message..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={isTyping}
                                    style={{ fontSize: '0.95rem' }}
                                />
                                <button
                                    type="submit"
                                    className="btn btn-primary rounded-circle ms-2 d-flex align-items-center justify-content-center shadow-sm hover-scale transition-fast"
                                    style={{ width: '42px', height: '42px' }}
                                    disabled={isTyping || !input.trim()}
                                >
                                    <FaRegPaperPlane size={16} style={{ marginLeft: '-2px' }} />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Action Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleChat}
                className="btn btn-primary rounded-circle shadow-lg d-flex align-items-center justify-content-center"
                style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, var(--primary-color), #2563eb)' }}
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div key="close" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
                            <FaTimes size={24} color="white" />
                        </motion.div>
                    ) : (
                        <motion.div key="open" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }}>
                            <FaCommentDots size={28} color="white" style={{ marginTop: '2px' }} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
};

export default Chatbot;
