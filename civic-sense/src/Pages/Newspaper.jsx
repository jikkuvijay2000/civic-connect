import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaRegClock, FaGlobe, FaTimes, FaSearch, FaExternalLinkAlt,
    FaUser, FaChevronRight, FaBookmark, FaRegBookmark
} from 'react-icons/fa';

const CATEGORIES = ['All', 'Local', 'Politics', 'Environment', 'Infrastructure', 'Community'];

const CAT_META = {
    Local: { color: '#6366f1', bg: '#eef2ff', border: '#a5b4fc' },
    Politics: { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
    Environment: { color: '#10b981', bg: '#ecfdf5', border: '#6ee7b7' },
    Infrastructure: { color: '#f59e0b', bg: '#fffbeb', border: '#fcd34d' },
    Community: { color: '#8b5cf6', bg: '#f5f3ff', border: '#c4b5fd' },
    'World News': { color: '#3b82f6', bg: '#eff6ff', border: '#93c5fd' },
};
const getCM = (cat) => CAT_META[cat] || { color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' };

const FALLBACK_IMGS = [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=600&auto=format&fit=crop',
];

const getMockNews = () => [
    { id: 1, title: 'City Council Approves New Green Space Initiative', description: 'In a unanimous vote, the city council approved a $5 million initiative to transform abandoned lots into community gardens and parks over the next two years.', link: '#', pubDate: '09:00 AM', author: 'Sarah Jenkins', image: 'https://images.unsplash.com/photo-1542601906990-24ccd54b8606?q=80&w=800&auto=format&fit=crop', category: 'Local' },
    { id: 2, title: 'Major Road Repairs to Begin Next Week Downtown', description: 'Commuters should expect delays as the public works department begins a comprehensive overhaul of main street infrastructure starting Monday.', link: '#', pubDate: '10:30 AM', author: 'Michael Chang', image: 'https://images.unsplash.com/photo-1584985429184-7a9159bf15cb?q=80&w=800&auto=format&fit=crop', category: 'Infrastructure' },
    { id: 3, title: 'Local High School Wins National Science Competition', description: 'A team of seniors has taken home the grand prize at the National STEM challenge with their innovative water purification device.', link: '#', pubDate: '11:45 AM', author: 'Elena Rodriguez', image: 'https://images.unsplash.com/photo-1564069114553-7215e1ff1890?q=80&w=800&auto=format&fit=crop', category: 'Community' },
    { id: 4, title: 'New Public Transit Routes Announced for Suburban Areas', description: 'The transit authority unveiled expanded bus routes aimed at connecting underserved suburban neighborhoods to the city center.', link: '#', pubDate: '01:15 PM', author: 'David Kim', image: FALLBACK_IMGS[2], category: 'Infrastructure' },
    { id: 5, title: 'Environmental Report Shows 20% Drop in City Pollution', description: 'The annual environmental report shows air quality has improved significantly thanks to new clean energy policies adopted last year.', link: '#', pubDate: '02:00 PM', author: 'Priya Nair', image: FALLBACK_IMGS[1], category: 'Environment' },
    { id: 6, title: 'New Community Health Clinic Opens in East Side', description: 'Residents now have access to affordable primary care as a new federally funded community health clinic opens its doors this week.', link: '#', pubDate: '03:30 PM', author: 'James Ford', image: FALLBACK_IMGS[0], category: 'Community' },
];

const Newspaper = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('All');
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [search, setSearch] = useState('');
    const [saved, setSaved] = useState(new Set());
    const [currentDate, setCurrentDate] = useState('');

    useEffect(() => {
        setCurrentDate(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
        fetchNews();
    }, []);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const rssUrl = encodeURIComponent('https://www.theguardian.com/world/rss');
            const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
            const data = await res.json();
            if (data.status === 'ok') {
                setNews(data.items.slice(0, 12).map((item, i) => ({
                    id: i,
                    title: item.title,
                    description: item.description.replace(/<[^>]*>?/gm, '').substring(0, 220) + '…',
                    link: item.link,
                    pubDate: new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    author: item.author || 'Staff Reporter',
                    image: item.enclosure?.link || item.thumbnail || FALLBACK_IMGS[i % FALLBACK_IMGS.length],
                    category: data.feed.title || 'World News',
                })));
            } else throw new Error();
        } catch {
            setNews(getMockNews());
        } finally {
            setLoading(false);
        }
    };

    const filtered = news.filter(n => {
        const matchCat = category === 'All' || n.category === category;
        const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.description.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    const hero = filtered[0];
    const secondary = filtered.slice(1, 4);
    const briefs = filtered.slice(4);

    const toggleSave = (id) => setSaved(prev => {
        const n = new Set(prev);
        n.has(id) ? n.delete(id) : n.add(id);
        return n;
    });

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh' }}>

            {/* ── Masthead / Header ── */}
            <header
                className="border-bottom px-5 pt-5 pb-4"
                style={{ background: 'white', position: 'sticky', top: 0, zIndex: 100 }}
            >
                <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
                    {/* Sub-header row */}
                    <div className="d-flex justify-content-between align-items-center mb-3" style={{ fontSize: '0.77rem', color: '#94a3b8' }}>
                        <span>{currentDate}</span>
                        <span className="fw-medium">Digital Edition · The Civic Chronicle</span>
                    </div>

                    {/* Title + search row */}
                    <div className="d-flex align-items-center justify-content-between gap-4 mb-4">
                        <div>
                            <h1 className="fw-bold text-dark mb-0" style={{ fontFamily: "'Georgia', serif", fontSize: '2rem', letterSpacing: '-0.5px' }}>
                                The Civic Chronicle
                            </h1>
                            <p className="text-muted mb-0 fst-italic" style={{ fontSize: '0.85rem' }}>"Truth and Transparency for Our Community"</p>
                        </div>
                        <div className="d-none d-md-flex align-items-center bg-white rounded-3 border px-3 py-2" style={{ width: '280px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <FaSearch className="text-muted me-2" size={13} />
                            <input
                                type="text"
                                className="form-control border-0 p-0 shadow-none bg-transparent"
                                placeholder="Search stories..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ fontSize: '0.87rem' }}
                            />
                            {search && <button className="btn btn-sm p-0 text-muted ms-1" onClick={() => setSearch('')}>&times;</button>}
                        </div>
                    </div>

                    {/* Category nav */}
                    <div className="d-flex gap-1 flex-wrap">
                        {CATEGORIES.map(cat => {
                            const cm = getCM(cat);
                            const active = category === cat;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className="btn btn-sm fw-medium"
                                    style={{
                                        borderRadius: '10px',
                                        padding: '5px 16px',
                                        background: active ? cm.bg : 'transparent',
                                        color: active ? cm.color : '#64748b',
                                        border: `1.5px solid ${active ? cm.border : '#e2e8f0'}`,
                                        fontSize: '0.82rem',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* ── Main content ── */}
            <div className="px-5 py-5" style={{ maxWidth: '1140px', margin: '0 auto' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-dark" role="status"><span className="visually-hidden">Loading...</span></div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-5 bg-white rounded-4 border">
                        <FaSearch size={36} className="text-muted mb-3" style={{ opacity: 0.3 }} />
                        <h6 className="fw-bold text-dark">No stories found</h6>
                        <p className="text-muted small mb-0">Try a different category or search term.</p>
                    </div>
                ) : (
                    <div className="row g-5">
                        {/* ── Left: hero + secondary ── */}
                        <div className="col-lg-8">
                            {/* Hero article */}
                            {hero && (
                                <motion.article
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-5 cursor-pointer"
                                    onClick={() => setSelectedArticle(hero)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {hero.image && (
                                        <div className="rounded-4 overflow-hidden mb-4 position-relative" style={{ height: '380px' }}>
                                            <img src={hero.image} alt={hero.title} className="w-100 h-100 object-fit-cover" style={{ transition: 'transform 0.4s', }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} />
                                            <div className="position-absolute top-0 start-0 m-3">
                                                {(() => { const cm = getCM(hero.category); return <span className="badge rounded-pill fw-medium px-3 py-2" style={{ background: cm.bg, color: cm.color, border: `1px solid ${cm.border}`, fontSize: '0.75rem', backdropFilter: 'blur(4px)' }}>{hero.category}</span>; })()}
                                            </div>
                                            <button
                                                onClick={e => { e.stopPropagation(); toggleSave(hero.id); }}
                                                className="position-absolute top-0 end-0 m-3 btn btn-sm rounded-circle d-flex align-items-center justify-content-center"
                                                style={{ width: '34px', height: '34px', background: 'rgba(255,255,255,0.9)' }}
                                            >
                                                {saved.has(hero.id) ? <FaBookmark size={13} style={{ color: '#6366f1' }} /> : <FaRegBookmark size={13} className="text-muted" />}
                                            </button>
                                        </div>
                                    )}
                                    <h2 className="fw-bold text-dark mb-3" style={{ fontFamily: "'Georgia', serif", fontSize: '1.75rem', lineHeight: 1.25, letterSpacing: '-0.3px' }}>
                                        {hero.title}
                                    </h2>
                                    <p className="text-secondary mb-3" style={{ fontSize: '0.98rem', lineHeight: 1.7 }}>{hero.description}</p>
                                    <div className="d-flex align-items-center gap-3 text-muted" style={{ fontSize: '0.79rem' }}>
                                        <span className="d-flex align-items-center gap-1"><FaUser size={10} /> {hero.author}</span>
                                        <span>·</span>
                                        <span className="d-flex align-items-center gap-1"><FaRegClock size={10} /> {hero.pubDate}</span>
                                        <span className="ms-auto d-flex align-items-center gap-1 fw-medium" style={{ color: '#6366f1' }}>
                                            Read full story <FaChevronRight size={10} />
                                        </span>
                                    </div>
                                </motion.article>
                            )}

                            {/* Divider */}
                            {secondary.length > 0 && (
                                <div className="d-flex align-items-center gap-3 mb-4">
                                    <span className="fw-bold text-muted text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>More Stories</span>
                                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                                </div>
                            )}

                            {/* Secondary stories */}
                            <div className="row g-4">
                                {secondary.map((item, i) => {
                                    const cm = getCM(item.category);
                                    return (
                                        <div className="col-md-4" key={item.id}>
                                            <motion.article
                                                initial={{ opacity: 0, y: 14 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.08 }}
                                                className="bg-white rounded-4 border overflow-hidden h-100 d-flex flex-column cursor-pointer"
                                                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'all 0.18s' }}
                                                onClick={() => setSelectedArticle(item)}
                                                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                            >
                                                {item.image && (
                                                    <div style={{ height: '140px', overflow: 'hidden' }}>
                                                        <img src={item.image} alt={item.title} className="w-100 h-100 object-fit-cover" />
                                                    </div>
                                                )}
                                                <div className="p-3 d-flex flex-column flex-grow-1">
                                                    <span className="badge rounded-pill fw-medium mb-2 align-self-start" style={{ background: cm.bg, color: cm.color, border: `1px solid ${cm.border}`, fontSize: '0.68rem' }}>{item.category}</span>
                                                    <h6 className="fw-bold text-dark mb-2" style={{ fontFamily: "'Georgia', serif", fontSize: '0.92rem', lineHeight: 1.4 }}>{item.title}</h6>
                                                    <p className="text-muted small mb-0 mt-auto" style={{ fontSize: '0.76rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>
                                                </div>
                                            </motion.article>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Right: briefs sidebar ── */}
                        <div className="col-lg-4">
                            <div className="position-sticky" style={{ top: '160px' }}>
                                <div className="d-flex align-items-center gap-3 mb-4">
                                    <span className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>Civic Briefs</span>
                                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                                </div>

                                <div className="d-flex flex-column gap-3">
                                    {(briefs.length > 0 ? briefs : secondary).map((item, i) => {
                                        const cm = getCM(item.category);
                                        const isSaved = saved.has(item.id);
                                        return (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, x: 12 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.07 }}
                                                className="bg-white rounded-4 border p-3 d-flex gap-3 cursor-pointer"
                                                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'all 0.15s' }}
                                                onClick={() => setSelectedArticle(item)}
                                                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.08)'}
                                                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'}
                                            >
                                                {item.image && (
                                                    <div className="rounded-3 overflow-hidden flex-shrink-0" style={{ width: '64px', height: '64px' }}>
                                                        <img src={item.image} alt="" className="w-100 h-100 object-fit-cover" />
                                                    </div>
                                                )}
                                                <div className="flex-grow-1 min-width-0">
                                                    <span className="badge rounded-pill mb-1" style={{ background: cm.bg, color: cm.color, fontSize: '0.63rem', padding: '2px 7px' }}>{item.category}</span>
                                                    <p className="fw-bold text-dark mb-1" style={{ fontSize: '0.83rem', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</p>
                                                    <small className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.7rem' }}>
                                                        <FaRegClock size={9} /> {item.pubDate}
                                                    </small>
                                                </div>
                                                <button
                                                    onClick={e => { e.stopPropagation(); toggleSave(item.id); }}
                                                    className="btn btn-sm p-0 flex-shrink-0 align-self-start"
                                                    style={{ background: 'none', border: 'none' }}
                                                >
                                                    {isSaved ? <FaBookmark size={12} style={{ color: '#6366f1' }} /> : <FaRegBookmark size={12} className="text-muted" />}
                                                </button>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Article Details Modal ── */}
            <AnimatePresence>
                {selectedArticle && (
                    <div
                        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                        style={{ background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(6px)', zIndex: 9999 }}
                        onClick={e => e.target === e.currentTarget && setSelectedArticle(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 24, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.97 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                            className="bg-white overflow-hidden d-flex flex-column"
                            style={{ width: '90vw', maxWidth: '780px', maxHeight: '88vh', borderRadius: '20px', boxShadow: '0 24px 80px rgba(0,0,0,0.22)' }}
                        >
                            {/* Modal header */}
                            <div className="px-5 py-4 border-bottom d-flex justify-content-between align-items-center" style={{ background: '#f8fafc' }}>
                                {(() => { const cm = getCM(selectedArticle.category); return <span className="badge rounded-pill fw-medium px-3 py-2" style={{ background: cm.bg, color: cm.color, border: `1px solid ${cm.border}`, fontSize: '0.75rem' }}>{selectedArticle.category}</span>; })()}
                                <button
                                    onClick={() => setSelectedArticle(null)}
                                    className="btn btn-sm rounded-circle border d-flex align-items-center justify-content-center"
                                    style={{ width: '34px', height: '34px', background: 'white' }}
                                >
                                    <FaTimes size={13} className="text-secondary" />
                                </button>
                            </div>

                            {/* Modal body */}
                            <div className="overflow-auto px-5 py-4">
                                {selectedArticle.image && (
                                    <div className="rounded-3 overflow-hidden mb-4" style={{ maxHeight: '300px' }}>
                                        <img src={selectedArticle.image} alt={selectedArticle.title} className="w-100 object-fit-cover" style={{ maxHeight: '300px' }} />
                                    </div>
                                )}
                                <h3 className="fw-bold text-dark mb-3" style={{ fontFamily: "'Georgia', serif", lineHeight: 1.3 }}>{selectedArticle.title}</h3>
                                <div className="d-flex align-items-center gap-3 text-muted mb-4 pb-4 border-bottom" style={{ fontSize: '0.8rem' }}>
                                    <span className="d-flex align-items-center gap-1"><FaUser size={11} /> {selectedArticle.author}</span>
                                    <span>·</span>
                                    <span className="d-flex align-items-center gap-1"><FaRegClock size={11} /> {selectedArticle.pubDate}</span>
                                </div>
                                <p className="text-secondary" style={{ fontSize: '1rem', lineHeight: 1.75 }}>{selectedArticle.description}</p>
                                <p className="text-secondary" style={{ fontSize: '0.95rem', lineHeight: 1.75 }}>
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
                                </p>
                                <div className="mt-5 p-4 rounded-3 border" style={{ background: '#f8fafc' }}>
                                    <p className="text-muted small mb-3">This is a snippet preview. Read the full original article on the source website.</p>
                                    <a
                                        href={selectedArticle.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn fw-bold d-inline-flex align-items-center gap-2"
                                        style={{ borderRadius: '10px', background: '#1e293b', color: 'white', border: 'none', padding: '10px 24px', fontSize: '0.88rem' }}
                                    >
                                        <FaExternalLinkAlt size={12} /> Read Original Article
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Newspaper;
