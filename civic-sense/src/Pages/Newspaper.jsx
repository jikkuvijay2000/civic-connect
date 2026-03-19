import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaRegClock, FaGlobe, FaTimes, FaSearch, FaExternalLinkAlt,
    FaChevronRight, FaBookmark, FaRegBookmark, FaMapMarkerAlt, FaTerminal
} from 'react-icons/fa';

const CATEGORIES = ['All', 'Local', 'Politics', 'Environment', 'Infrastructure', 'Community'];

const CAT_META = {
    Local: { color: 'var(--primary-color)', bg: 'rgba(170,0,255,0.1)', border: 'var(--primary-color)' },
    Politics: { color: 'var(--accent-red)', bg: 'rgba(239, 68, 68, 0.1)', border: 'var(--accent-red)' },
    Environment: { color: 'var(--secondary-color)', bg: 'rgba(163, 230, 53, 0.1)', border: 'var(--secondary-color)' },
    Infrastructure: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b' },
    Community: { color: '#00f0ff', bg: 'rgba(0, 240, 255, 0.1)', border: '#00f0ff' },
    'World News': { color: 'var(--primary-color)', bg: 'rgba(170,0,255,0.1)', border: 'var(--primary-color)' },
};
const getCM = (cat) => CAT_META[cat] || { color: '#6b7280', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.2)' };

const FALLBACK_IMGS = [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?q=80&w=600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=600&auto=format&fit=crop'
];

const getMockNews = (city = 'Your City') => [
    { id: 1, title: `CITY COUNCIL APPROVES NEW GREEN SPACE INITIATIVE IN ${city.toUpperCase()}`, description: 'IN A UNANIMOUS VOTE, THE CITY COUNCIL APPROVED A $5 MILLION INITIATIVE TO TRANSFORM ABANDONED LOTS INTO COMMUNITY GARDENS AND PARKS OVER THE NEXT TWO YEARS.', link: '#', pubDate: '09:00 AM', author: 'S. JENKINS', image: FALLBACK_IMGS[0], category: 'Local' },
    { id: 2, title: 'MAJOR ROAD REPAIRS TO BEGIN NEXT WEEK DOWNTOWN', description: 'COMMUTERS SHOULD EXPECT DELAYS AS THE PUBLIC WORKS DEPARTMENT BEGINS A COMPREHENSIVE OVERHAUL OF MAIN STREET INFRASTRUCTURE STARTING MONDAY.', link: '#', pubDate: '10:30 AM', author: 'M. CHANG', image: FALLBACK_IMGS[1], category: 'Infrastructure' },
    { id: 3, title: 'LOCAL HIGH SCHOOL WINS NATIONAL SCIENCE COMPETITION', description: 'A TEAM OF SENIORS HAS TAKEN HOME THE GRAND PRIZE AT THE NATIONAL STEM CHALLENGE WITH THEIR INNOVATIVE WATER PURIFICATION DEVICE.', link: '#', pubDate: '11:45 AM', author: 'E. RODRIGUEZ', image: FALLBACK_IMGS[2], category: 'Community' },
    { id: 4, title: 'NEW PUBLIC TRANSIT ROUTES ANNOUNCED FOR SUBURBAN AREAS', description: 'THE TRANSIT AUTHORITY UNVEILED EXPANDED BUS ROUTES AIMED AT CONNECTING UNDERSERVED SUBURBAN NEIGHBORHOODS TO THE CITY CENTER.', link: '#', pubDate: '01:15 PM', author: 'D. KIM', image: FALLBACK_IMGS[3], category: 'Infrastructure' },
    { id: 5, title: 'ENVIRONMENTAL REPORT SHOWS 20% DROP IN CITY POLLUTION', description: 'THE ANNUAL ENVIRONMENTAL REPORT SHOWS AIR QUALITY HAS IMPROVED SIGNIFICANTLY THANKS TO NEW CLEAN ENERGY POLICIES ADOPTED LAST YEAR.', link: '#', pubDate: '02:00 PM', author: 'P. NAIR', image: FALLBACK_IMGS[4], category: 'Environment' },
];

const Newspaper = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('All');
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [search, setSearch] = useState('');
    const [saved, setSaved] = useState(new Set());
    const [currentDate, setCurrentDate] = useState('');
    const [userLocation, setUserLocation] = useState('ESTABLISHING UPLINK...');

    useEffect(() => {
        setCurrentDate(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase());
        getUserLocationAndNews();
    }, []);

    const getUserLocationAndNews = () => {
        if (!navigator.geolocation) {
            setUserLocation('GLOBAL NETWORK');
            fetchNews('Global');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                    const geoData = await geoRes.json();

                    const city = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.county || 'LOCAL NODE';
                    setUserLocation(city.toUpperCase());
                    fetchNews(city);
                } catch (err) {
                    console.error("Geocoding failed:", err);
                    setUserLocation('GLOBAL NETWORK');
                    fetchNews('Global');
                }
            },
            (err) => {
                console.warn("Geolocation blocked or failed:", err.message);
                setUserLocation('GLOBAL NETWORK');
                fetchNews('Global');
            },
            { timeout: 10000 }
        );
    };

    const fetchNews = async (locationQuery) => {
        setLoading(true);
        try {
            const query = locationQuery === 'Global' ? 'civic OR community OR city' : locationQuery;
            const res = await fetch(`https://content.guardianapis.com/search?q=${encodeURIComponent(query)}&show-fields=thumbnail,trailText,byline&api-key=test&page-size=12`);
            const data = await res.json();

            if (data.response && data.response.results && data.response.results.length > 0) {
                setNews(data.response.results.map((item, i) => {
                    let cat = item.sectionName || 'Local';
                    const text = (item.webTitle + " " + (item.fields?.trailText || "")).toLowerCase();
                    if (text.includes('politic') || text.includes('mayor') || text.includes('council') || text.includes('gov')) cat = 'Politics';
                    else if (text.includes('environment') || text.includes('climate') || text.includes('green') || text.includes('park')) cat = 'Environment';
                    else if (text.includes('road') || text.includes('infrastructure') || text.includes('transit') || text.includes('build')) cat = 'Infrastructure';
                    else if (text.includes('school') || text.includes('community') || text.includes('health')) cat = 'Community';

                    const rawDesc = item.fields?.trailText || 'DATA STREAM AVAILABLE. ACCESS REQUIRED FOR FULL DECRYPTION.';
                    const cleanDesc = rawDesc.replace(/<[^>]*>?/gm, '').toUpperCase();

                    return {
                        id: item.id || i,
                        title: item.webTitle.toUpperCase(),
                        description: cleanDesc,
                        link: item.webUrl,
                        pubDate: new Date(item.webPublicationDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase(),
                        author: (item.fields?.byline || 'SYSADMIN').toUpperCase(),
                        image: item.fields?.thumbnail || FALLBACK_IMGS[i % FALLBACK_IMGS.length],
                        category: cat,
                    };
                }));
            } else {
                throw new Error("No articles returned");
            }
        } catch (err) {
            console.error("News fetch failed, using fallback data:", err);
            setNews(getMockNews(locationQuery === 'Global' ? 'Your City' : locationQuery));
        } finally {
            setLoading(false);
        }
    };

    const filtered = news.filter(n => {
        const matchCat = category === 'All' || n.category === category;
        const matchSearch = !search || n.title.includes(search.toUpperCase()) || n.description.includes(search.toUpperCase());
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
        <div style={{ background: 'transparent', minHeight: '100vh' }}>
            {/* Header */}
            <header className="border-bottom px-4 px-md-5 pt-4 pb-3 glass-card" style={{ position: 'sticky', top: 0, zIndex: 100, borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderRadius: 0 }}>
                <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
                    <div className="d-flex justify-content-between align-items-center mb-3 tech-font text-uppercase fw-bold text-muted" style={{ fontSize: '0.7rem', letterSpacing: '0.15em' }}>
                        <span>{currentDate}</span>
                        <span className="d-flex align-items-center gap-2">
                            <FaMapMarkerAlt size={11} className="text-neon-red" />
                            {userLocation === 'ESTABLISHING UPLINK...' ? userLocation : `NODE: ${userLocation}`}
                        </span>
                    </div>

                    <div className="d-flex align-items-center justify-content-between gap-4 mb-3 flex-wrap">
                        <div className="d-flex align-items-center gap-3">
                            <FaTerminal size={32} className="text-neon-purple d-none d-md-block" />
                            <div>
                                <h1 className="fw-bold mb-0 tech-font text-white text-uppercase" style={{ fontSize: '1.8rem', letterSpacing: '0.2em' }}>
                                    GLOBAL INTEL
                                </h1>
                                <p className="text-muted tech-font mb-0 text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.1em' }}>DECRYPTED NETWORK BROADCASTS</p>
                            </div>
                        </div>
                        <div className="d-none d-md-flex align-items-center rounded border px-3 py-2" style={{ width: '280px', background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
                            <FaSearch className="text-muted me-2" size={13} />
                            <input type="text" className="form-control tech-font text-white border-0 p-0 shadow-none bg-transparent text-uppercase"
                                placeholder="QUERY ARCHIVES..." value={search} onChange={e => setSearch(e.target.value)}
                                style={{ fontSize: '0.8rem', letterSpacing: '0.1em' }} />
                            {search && <button className="btn btn-sm p-0 text-neon-red ms-1" onClick={() => setSearch('')}>&times;</button>}
                        </div>
                    </div>

                    <div className="d-flex gap-2 flex-wrap pb-1">
                        {CATEGORIES.map(cat => {
                            const cm = getCM(cat);
                            const active = category === cat;
                            return (
                                <button key={cat} onClick={() => setCategory(cat)} className="btn tech-font fw-bold text-uppercase"
                                    style={{
                                        borderRadius: '4px', padding: '5px 14px',
                                        background: active ? cm.bg : 'transparent',
                                        color: active ? cm.color : 'var(--text-muted)',
                                        border: `1px solid ${active ? cm.border : 'rgba(255,255,255,0.1)'}`,
                                        fontSize: '0.7rem', letterSpacing: '0.1em', transition: 'all 0.15s'
                                    }}>
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* Main content */}
            <div className="px-4 px-md-5 py-5" style={{ maxWidth: '1140px', margin: '0 auto' }}>
                {loading ? (
                    <div className="text-center py-5">
                        <span className="spinner-border text-neon-purple" role="status" />
                        <p className="tech-font mt-3 text-muted text-uppercase" style={{ letterSpacing: '0.2em', fontSize: '0.8rem' }}>INTERCEPTING SIGNALS FOR {userLocation}...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-5 glass-card">
                        <FaSearch size={36} className="text-muted mb-3" style={{ opacity: 0.3 }} />
                        <h6 className="tech-font fw-bold text-white text-uppercase" style={{ letterSpacing: '0.15em' }}>NO TRANSMISSIONS DECODED</h6>
                        <p className="tech-font text-muted small mb-0 text-uppercase" style={{ letterSpacing: '0.1em' }}>ADJUST FILTERS OR SEARCH PARAMETERS.</p>
                    </div>
                ) : (
                    <div className="row g-5">
                        {/* Left: hero + secondary */}
                        <div className="col-lg-8 border-end border-secondary pe-lg-5" style={{ borderColor: 'rgba(255,255,255,0.1) !important' }}>
                            {hero && (
                                <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-5 cursor-pointer hover-scale" onClick={() => setSelectedArticle(hero)} style={{ cursor: 'pointer' }}>
                                    {hero.image && (
                                        <div className="rounded overflow-hidden mb-4 position-relative border" style={{ height: '380px', background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
                                            <img src={hero.image} alt="Intel" className="w-100 h-100 object-fit-cover" style={{ transition: 'transform 0.4s', filter: 'brightness(0.85) contrast(1.15) sepia(0.2) hue-rotate(220deg)' }}
                                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                onError={(e) => { if (e.currentTarget.src !== FALLBACK_IMGS[0]) e.currentTarget.src = FALLBACK_IMGS[0]; }} />
                                            <div className="position-absolute top-0 start-0 m-3">
                                                {(() => { const cm = getCM(hero.category); return <span className="badge tech-font fw-bold px-3 py-2 text-uppercase" style={{ background: 'rgba(0,0,0,0.6)', color: cm.color, border: `1px solid ${cm.border}`, fontSize: '0.7rem', letterSpacing: '0.1em', backdropFilter: 'blur(4px)' }}>{hero.category}</span>; })()}
                                            </div>
                                            <button onClick={e => { e.stopPropagation(); toggleSave(hero.id); }} className="position-absolute top-0 end-0 m-3 btn btn-sm rounded d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)' }}>
                                                {saved.has(hero.id) ? <FaBookmark size={13} className="text-neon-purple" /> : <FaRegBookmark size={13} className="text-white" />}
                                            </button>
                                        </div>
                                    )}
                                    <h2 className="tech-font fw-bold text-white mb-3 text-uppercase tracking-widest" style={{ fontSize: '1.6rem', lineHeight: 1.3 }}>{hero.title}</h2>
                                    <p className="text-secondary font-monospace mb-3" style={{ fontSize: '0.85rem', lineHeight: 1.7 }}>{hero.description}</p>
                                    <div className="d-flex align-items-center gap-3 text-muted tech-font text-uppercase fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.1em' }}>
                                        <span className="d-flex align-items-center gap-1"><FaGlobe size={10} className="text-neon-green" /> {hero.author}</span>
                                        <span className="d-flex align-items-center gap-1"><FaRegClock size={10} /> {hero.pubDate}</span>
                                        <span className="ms-auto d-flex align-items-center gap-1 text-neon-purple">DECRYPT FULL <FaChevronRight size={10} /></span>
                                    </div>
                                </motion.article>
                            )}

                            {secondary.length > 0 && (
                                <div className="d-flex align-items-center gap-3 mb-4">
                                    <FaTerminal size={14} className="text-secondary" />
                                    <span className="fw-bold text-secondary text-uppercase tech-font" style={{ fontSize: '0.8rem', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}>ADDITIONAL LOGS</span>
                                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                                </div>
                            )}

                            <div className="row g-4 border-top-0">
                                {secondary.map((item, i) => {
                                    const cm = getCM(item.category);
                                    return (
                                        <div className="col-md-6" key={item.id}>
                                            <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                                                className="glass-card overflow-hidden h-100 d-flex flex-column cursor-pointer"
                                                onClick={() => setSelectedArticle(item)}
                                                style={{ borderTop: `2px solid ${cm.border}` }}>
                                                {item.image && (
                                                    <div style={{ height: '160px', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                                        <img src={item.image} alt={item.title} className="w-100 h-100 object-fit-cover" style={{ filter: 'brightness(0.8) sepia(0.3) hue-rotate(200deg)' }}
                                                            onError={(e) => { if (e.currentTarget.src !== FALLBACK_IMGS[(i + 1) % FALLBACK_IMGS.length]) e.currentTarget.src = FALLBACK_IMGS[(i + 1) % FALLBACK_IMGS.length]; }} />
                                                    </div>
                                                )}
                                                <div className="p-4 d-flex flex-column flex-grow-1">
                                                    <span className="badge tech-font fw-bold mb-3 px-3 py-1 align-self-start text-uppercase" style={{ background: cm.bg, color: cm.color, border: `1px solid ${cm.border}`, fontSize: '0.65rem', letterSpacing: '0.1em' }}>{item.category}</span>
                                                    <h6 className="tech-font fw-bold text-white mb-2 text-uppercase tracking-widest" style={{ fontSize: '0.9rem', lineHeight: 1.4 }}>{item.title}</h6>
                                                    <p className="font-monospace text-muted small mb-0 mt-auto" style={{ fontSize: '0.75rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>
                                                </div>
                                            </motion.article>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right: briefs sidebar */}
                        <div className="col-lg-4">
                            <div className="position-sticky" style={{ top: '160px' }}>
                                <div className="d-flex align-items-center gap-3 mb-4">
                                    <span className="fw-bold text-secondary text-uppercase tech-font" style={{ fontSize: '0.8rem', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}>NETWORK BRIEFS</span>
                                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                                </div>

                                <div className="d-flex flex-column gap-3">
                                    {(briefs.length > 0 ? briefs : secondary).map((item, i) => {
                                        const cm = getCM(item.category);
                                        const isSaved = saved.has(item.id);
                                        return (
                                            <motion.div key={item.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                                                className="glass-card p-3 d-flex gap-3 cursor-pointer hover-bg-light"
                                                onClick={() => setSelectedArticle(item)}
                                                style={{ borderLeft: `2px solid ${cm.border}` }}>
                                                {item.image && (
                                                    <div className="rounded overflow-hidden flex-shrink-0 border" style={{ width: '48px', height: '48px', borderColor: 'rgba(255,255,255,0.1)' }}>
                                                        <img src={item.image} alt="Brief" className="w-100 h-100 object-fit-cover" style={{ filter: 'grayscale(0.5)' }} onError={(e) => { if (e.currentTarget.src !== FALLBACK_IMGS[(i + 4) % FALLBACK_IMGS.length]) e.currentTarget.src = FALLBACK_IMGS[(i + 4) % FALLBACK_IMGS.length]; }} />
                                                    </div>
                                                )}
                                                <div className="flex-grow-1 min-width-0">
                                                    <div className="d-flex align-items-center gap-2 mb-1">
                                                        <span className="badge tech-font" style={{ background: cm.bg, color: cm.color, fontSize: '0.55rem', padding: '2px 5px', border: `1px solid ${cm.border}` }}>{item.category.toUpperCase()}</span>
                                                        <small className="text-muted tech-font d-flex align-items-center gap-1" style={{ fontSize: '0.65rem' }}>
                                                            <FaRegClock size={8} /> {item.pubDate}
                                                        </small>
                                                    </div>
                                                    <p className="tech-font fw-bold text-white mb-0 text-uppercase" style={{ fontSize: '0.75rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', letterSpacing: '0.1em' }}>{item.title}</p>
                                                </div>
                                                <button onClick={e => { e.stopPropagation(); toggleSave(item.id); }} className="btn btn-sm p-0 flex-shrink-0 align-self-start" style={{ background: 'none', border: 'none' }}>
                                                    {isSaved ? <FaBookmark size={12} className="text-neon-purple" /> : <FaRegBookmark size={12} className="text-muted" />}
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

            {/* Article Details Modal */}
            <AnimatePresence>
                {selectedArticle && (
                    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999 }}
                        onClick={e => e.target === e.currentTarget && setSelectedArticle(null)}>
                        <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }} transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                            className="glass-card overflow-hidden d-flex flex-column"
                            style={{ width: '90vw', maxWidth: '780px', maxHeight: '88vh', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 0 40px rgba(170,0,255,0.1)' }}>
                            {/* Modal header */}
                            <div className="px-4 py-3 border-bottom d-flex justify-content-between align-items-center" style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.1) !important' }}>
                                {(() => { const cm = getCM(selectedArticle.category); return <span className="badge tech-font fw-bold px-3 py-2 text-uppercase" style={{ background: cm.bg, color: cm.color, border: `1px solid ${cm.border}`, fontSize: '0.7rem', letterSpacing: '0.1em' }}>{selectedArticle.category}</span>; })()}
                                <button onClick={() => setSelectedArticle(null)} className="btn btn-sm d-flex align-items-center justify-content-center rounded" style={{ width: '34px', height: '34px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-red)' }}>
                                    <FaTimes size={13} className="text-neon-red" />
                                </button>
                            </div>

                            {/* Modal body */}
                            <div className="overflow-auto px-4 px-md-5 py-4">
                                {selectedArticle.image && (
                                    <div className="rounded overflow-hidden mb-4 border" style={{ maxHeight: '340px', borderColor: 'rgba(255,255,255,0.1)' }}>
                                        <img src={selectedArticle.image} alt="Intel" className="w-100 object-fit-cover" style={{ maxHeight: '340px', filter: 'brightness(0.8) contrast(1.2)' }}
                                            onError={(e) => { if (e.currentTarget.src !== FALLBACK_IMGS[0]) e.currentTarget.src = FALLBACK_IMGS[0]; }} />
                                    </div>
                                )}
                                <h3 className="tech-font fw-bold text-white mb-3 text-uppercase tracking-widest">{selectedArticle.title}</h3>
                                <div className="d-flex align-items-center gap-3 text-muted tech-font text-uppercase mb-4 pb-4 border-bottom" style={{ fontSize: '0.8rem', letterSpacing: '0.1em', borderColor: 'rgba(255,255,255,0.1) !important' }}>
                                    <span className="d-flex align-items-center gap-1"><FaGlobe size={11} className="text-neon-green" /> {selectedArticle.author}</span>
                                    <span className="d-flex align-items-center gap-1"><FaRegClock size={11} /> {selectedArticle.pubDate}</span>
                                </div>
                                <p className="font-monospace text-secondary" style={{ fontSize: '0.9rem', lineHeight: 1.8 }}>{selectedArticle.description}</p>

                                <div className="mt-5 p-4 rounded border" style={{ background: 'rgba(170,0,255,0.05)', borderColor: 'var(--primary-color) !important' }}>
                                    <p className="tech-font text-neon-purple fw-bold mb-3 text-uppercase" style={{ letterSpacing: '0.15em' }}><FaTerminal size={12} className="me-2" />ACCESS RESTRICTED: PARTIAL LOG DISPLAYED</p>
                                    <p className="text-secondary small font-monospace mb-4">TO DECRYPT THE FULL MESSAGE, PROCEED TO EXTERNAL SECURE NODE.</p>
                                    <a href={selectedArticle.link} target="_blank" rel="noopener noreferrer" className="btn text-uppercase tech-font fw-bold d-inline-flex align-items-center gap-2"
                                        style={{ border: '1px solid var(--primary-color)', background: 'rgba(170,0,255,0.1)', color: 'white', padding: '10px 24px', fontSize: '0.8rem', letterSpacing: '0.2em' }}>
                                        <FaExternalLinkAlt size={12} /> ESTABLISH SECURE LINK
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
