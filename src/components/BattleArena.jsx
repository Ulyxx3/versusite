import { useState, useEffect } from 'react';
import { ITEM_TYPES, getNextMatch, resolveMatch } from '../utils/tournamentLogic';

export default function BattleArena({ tournament, onUpdate, onComplete }) {
    const [match, setMatch] = useState(null);
    const [titles, setTitles] = useState({ p1: null, p2: null });
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Track mouse position
    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Calculate match stats
    const totalMatches = tournament ? tournament.items.length - 1 : 0;
    const completedMatches = tournament ? tournament.rounds.reduce((acc, round) => {
        return acc + round.filter(m => m.winner).length;
    }, 0) : 0;
    const remainingMatches = totalMatches - completedMatches;

    // Helper to extract YouTube ID
    const getYoutubeId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    useEffect(() => {
        if (!tournament) return;
        if (tournament.completed) {
            onComplete(tournament);
            return;
        }
        const next = getNextMatch(tournament);
        setMatch(next);
        setTitles({ p1: null, p2: null }); // Reset titles
    }, [tournament, onComplete]);

    // Fetch titles when match changes
    useEffect(() => {
        if (!match) return;

        const fetchTitle = async (item, key) => {
            if (item.type === ITEM_TYPES.YOUTUBE) {
                try {
                    const response = await fetch(`https://noembed.com/embed?url=${item.content}`);
                    const data = await response.json();
                    if (data.title) {
                        setTitles(prev => ({ ...prev, [key]: data.title }));
                    } else {
                        setTitles(prev => ({ ...prev, [key]: 'Watch Video' }));
                    }
                } catch (e) {
                    setTitles(prev => ({ ...prev, [key]: 'Watch Video' }));
                }
            } else if (item.type === ITEM_TYPES.IMAGE) {
                // For images, we might use the filename or just "View Image"
                const name = item.content.split('/').pop();
                setTitles(prev => ({ ...prev, [key]: name || 'View Image' }));
            }
        };

        fetchTitle(match.p1, 'p1');
        fetchTitle(match.p2, 'p2');
    }, [match]);

    const handleVote = (winnerId) => {
        if (!match) return;
        const winnerContent = match.p1.id === winnerId ? match.p1 : match.p2;
        const updated = resolveMatch(tournament, match.id, winnerContent);
        onUpdate(updated);
    };

    if (!match) return <div className="container" style={{ textAlign: 'center' }}>Loading match...</div>;

    const RenderItem = ({ item, side, title }) => {
        const isRed = side === 'left';
        const borderColor = isRed ? 'var(--color-primary-red)' : 'var(--color-primary-blue)';
        const glowColor = isRed ? 'rgba(255, 71, 87, 0.2)' : 'rgba(46, 213, 115, 0.2)';

        // Determine what text to display for the link
        let linkText = item.content;
        if (item.type === ITEM_TYPES.YOUTUBE) linkText = title || 'Loading Title...';
        if (item.type === ITEM_TYPES.IMAGE) linkText = 'Open Image';

        // Truncate long text
        if (linkText.length > 50) linkText = linkText.substring(0, 50) + '...';

        return (
            <div className="vote-card animate-slide-up" style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                border: `1px solid rgba(255,255,255,0.1)`,
                borderRadius: '24px',
                overflow: 'hidden', // changed from hidden to visible for shadow, but hidden needed for inner content. Compromise: overflow hidden on inner
                background: 'var(--color-bg-card)',
                boxShadow: `0 0 40px ${glowColor}`
            }}>
                {/* Media Container */}
                <div style={{
                    flex: 1,
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#000',
                    overflow: 'hidden',
                    minHeight: '200px'
                }}>
                    {item.type === ITEM_TYPES.TEXT && (
                        <h1 style={{ padding: '2rem', textAlign: 'center', fontSize: '3rem', wordBreak: 'break-word' }}>{item.content}</h1>
                    )}
                    {item.type === ITEM_TYPES.IMAGE && (
                        <img src={item.content} alt="Content" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    )}
                    {item.type === ITEM_TYPES.YOUTUBE && (
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${getYoutubeId(item.content)}?autoplay=1&mute=1`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                        />
                    )}
                </div>

                {/* Controls Container */}
                <div style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    borderTop: '1px solid rgba(255,255,255,0.05)'
                }}>
                    {/* Link to source */}
                    {(item.type === ITEM_TYPES.YOUTUBE || item.type === ITEM_TYPES.IMAGE) && (
                        <a
                            href={item.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                color: 'var(--color-text-muted)',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                                textAlign: 'center',
                                display: 'block',
                                transition: 'color 0.2s',
                                marginBottom: '0.5rem'
                            }}
                            onMouseEnter={(e) => e.target.style.color = 'white'}
                            onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}
                        >
                            {linkText} <span style={{ fontSize: '0.8em' }}>↗</span>
                        </a>
                    )}

                    {/* Vote Button */}
                    <button
                        onClick={() => handleVote(item.id)}
                        className={`btn vote-btn-glitch ${isRed ? 'btn-red' : 'btn-blue'}`}
                        style={{
                            width: '100%',
                            padding: '1.2rem',
                            fontSize: '1.5rem',
                            fontWeight: '900',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            boxShadow: `0 4px 20px ${glowColor}`
                        }}
                    >
                        VOTE {isRed ? 'RED' : 'BLUE'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div style={{ height: 'calc(100vh - 120px)', padding: '0 2rem 2rem 2rem', display: 'flex', flexDirection: 'column', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
            {/* Dynamic Background */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, ${mousePos.x < window.innerWidth / 2 ? 'rgba(255, 42, 42, 0.15)' : 'rgba(42, 42, 255, 0.15)'} 0%, rgba(0,0,0,0) 50%)`,
                pointerEvents: 'none',
                transition: 'background 0.2s ease-out'
            }} />

            {/* Info Header */}
            <div className="animate-fade-in" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: '800', letterSpacing: '-1px' }}>
                    Round <span style={{ color: 'var(--color-accent-purple)' }}>{tournament.currentRoundIndex + 1}</span>
                </h2>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
                    {remainingMatches} duels remaining
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', gap: '4rem', alignItems: 'center' }}>
                <RenderItem item={match.p1} side="left" title={titles.p1} />

                <div className="animate-fade-in delay-200" style={{
                    width: '80px',
                    height: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900',
                    fontSize: '2rem',
                    fontStyle: 'italic',
                    background: 'var(--color-bg-card)',
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 0 30px rgba(0,0,0,0.5)',
                    zIndex: 10
                }}>
                    <span className="title-gradient">VS</span>
                </div>

                <RenderItem item={match.p2} side="right" title={titles.p2} />
            </div>
        </div>
    );
}
