import { useState } from 'react';
import { ITEM_TYPES, createTournament } from '../utils/tournamentLogic';

export default function Creator({ onStart, onLoad }) {
    const [title, setTitle] = useState('');
    const [items, setItems] = useState([]);
    const [newItemUrl, setNewItemUrl] = useState('');
    const [newItemLabel, setNewItemLabel] = useState('');
    const [newItemType, setNewItemType] = useState(ITEM_TYPES.YOUTUBE);
    const [bulkText, setBulkText] = useState('');

    const handleAddItem = () => {
        if (!newItemUrl) return;
        setItems([...items, {
            id: crypto.randomUUID(),
            id: crypto.randomUUID(),
            content: newItemUrl,
            label: newItemLabel,
            type: newItemType
        }]);
        setNewItemUrl('');
        setNewItemLabel('');
    };

    const handleBulkAdd = () => {
        // Simple parser: split by newlines, detect type
        const lines = bulkText.split('\n').filter(l => l.trim().length > 0);
        const newItems = lines.map(line => {
            let type = ITEM_TYPES.TEXT;
            if (line.includes('youtube.com') || line.includes('youtu.be')) type = ITEM_TYPES.YOUTUBE;
            else if (line.match(/\.(jpeg|jpg|gif|png)$/)) type = ITEM_TYPES.IMAGE;

            return {
                id: crypto.randomUUID(),
                content: line.trim(),
                type
            };
        });
        setItems([...items, ...newItems]);
        setBulkText('');
    };

    const handleStart = () => {
        if (items.length < 2) return alert('Need at least 2 items!');
        const tournament = createTournament(title || 'Untitled Tournament', items);
        onStart(tournament);
    };

    const handleExport = () => {
        if (items.length === 0) return;
        const data = JSON.stringify({ title, items }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'versusite-tournament.json';
        a.click();
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.items) {
                    setTitle(data.title || '');
                    setItems(data.items);
                }
            } catch (err) {
                alert('Invalid JSON');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Create Tournament</h2>

            <div style={{ marginBottom: '2rem' }}>
                <input
                    type="text"
                    placeholder="Tournament Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem', fontSize: '1.2rem', marginBottom: '1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: 'white' }}
                />

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <select
                        value={newItemType}
                        onChange={(e) => setNewItemType(e.target.value)}
                        style={{ padding: '0.5rem', background: '#222', color: 'white', border: '1px solid #444' }}
                    >
                        <option value={ITEM_TYPES.YOUTUBE}>YouTube</option>
                        <option value={ITEM_TYPES.IMAGE}>Image</option>
                        <option value={ITEM_TYPES.TEXT}>Text</option>
                    </select>
                    <input
                        type="text"
                        placeholder="URL or Text content"
                        value={newItemUrl}
                        onChange={(e) => setNewItemUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                        style={{ flex: 1, padding: '0.5rem', background: '#222', color: 'white', border: '1px solid #444' }}
                    />
                    <input
                        type="text"
                        placeholder="Label (Optional)"
                        value={newItemLabel}
                        onChange={(e) => setNewItemLabel(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                        style={{ width: '150px', padding: '0.5rem', background: '#222', color: 'white', border: '1px solid #444' }}
                    />
                    <button className="btn btn-blue" onClick={handleAddItem}>Add</button>
                </div>

                {newItemType === ITEM_TYPES.YOUTUBE && (
                    <PlaylistImporter onImport={(newItems) => setItems(prev => [...prev, ...newItems])} />
                )}

                {newItemType === ITEM_TYPES.IMAGE && (
                    <TopListImporter onImport={(newItems) => setItems(prev => [...prev, ...newItems])} />
                )}

                <details style={{ marginTop: '1rem' }}>
                    <summary style={{ cursor: 'pointer', color: '#aaa', marginBottom: '0.5rem' }}>+100 Add (Copy & Paste URL List with <a href="https://www.youtubeplaylistanalyzer.com" target="_blank">Youtube Playlist Analyzer</a>)</summary>
                    <textarea
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder="Paste URLs one per line..."
                        style={{ width: '100%', height: '100px', background: '#222', color: 'white', border: '1px solid #444', padding: '0.5rem' }}
                    />
                    <button className="btn btn-primary" style={{ marginTop: '0.5rem' }} onClick={handleBulkAdd}>Add URL List</button>
                </details>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <h3>Items ({items.length})</h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '1rem', marginTop: '0.5rem' }}>
                    {items.map((item, idx) => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid #333' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                                [{item.type}] {item.label || item.content}
                            </span>
                            <button onClick={() => setItems(items.filter((_, i) => i !== idx))} style={{ color: 'red' }}>&times;</button>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button className="btn btn-red" style={{ flex: 1 }} onClick={handleStart}>Start Battle</button>
                <button className="btn btn-primary" onClick={handleExport}>Save JSON</button>
                <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                    Import JSON
                    <input type="file" hidden accept=".json" onChange={handleImport} />
                </label>
            </div>
        </div>
    );
}

function PlaylistImporter({ onImport }) {
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchPlaylist = async () => {
        const listParam = playlistUrl.match(/[?&]list=([^&]+)/);
        if (!listParam) {
            setError('Invalid URL. Must contain "list=" parameter.');
            return;
        }
        const listId = listParam[1];
        const targetUrl = `https://m.youtube.com/playlist?list=${listId}`;

        setLoading(true);
        setError('');

        const strategies = [
            {
                name: 'CodeTabs Proxy',
                fetch: async () => {
                    const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`);
                    if (!res.ok) throw new Error(res.statusText);
                    return await res.text();
                }
            },
            {
                name: 'AllOrigins',
                fetch: async () => {
                    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`);
                    if (!res.ok) throw new Error(res.statusText);
                    const data = await res.json();
                    return data.contents;
                }
            },
            {
                name: 'CorsProxy',
                fetch: async () => {
                    const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
                    if (!res.ok) throw new Error(res.statusText);
                    return await res.text();
                }
            }
        ];

        let html = '';
        let success = false;

        for (const strategy of strategies) {
            try {
                console.log(`Attempting fetch via ${strategy.name}...`);
                html = await strategy.fetch();
                if (html && html.length > 1000) {
                    success = true;
                    break;
                }
            } catch (e) {
                console.warn(`${strategy.name} failed:`, e);
            }
        }

        if (!success) {
            setLoading(false);
            setError('Failed to load playlist. Network or Proxy blocked.');
            return;
        }

        try {
            // Find ytInitialData
            const startStr = 'var ytInitialData = ';
            const startIdx = html.indexOf(startStr);

            if (startIdx === -1) throw new Error('ytInitialData not found. YouTube structure might have changed.');

            let endIdx = html.indexOf(';</script>', startIdx);
            if (endIdx === -1) endIdx = html.indexOf(';\n', startIdx);
            if (endIdx === -1) endIdx = html.indexOf(';', startIdx + startStr.length + 10000);

            if (endIdx === -1) throw new Error('JSON end not found');

            const jsonStr = html.substring(startIdx + startStr.length, endIdx);
            const jsonData = JSON.parse(jsonStr);

            // Traverse to find videos (supports desktop and mobile structures)
            let videos = [];

            const extractVideos = (root) => {
                let items = [];
                // Helper to find key recursively (limited depth)
                // But structure is somewhat known.
                // Mobile: contents.twoColumnBrowseResultsRenderer... or sectionListRenderer
                // Let's try standard paths first.

                try {
                    // Standard Desktop/Mobile path
                    const tabs = root.contents?.twoColumnBrowseResultsRenderer?.tabs ||
                        root.contents?.singleColumnBrowseResultsRenderer?.tabs;

                    if (tabs) {
                        const tab = tabs.find(t => t.tabRenderer?.selected);
                        const contents = tab?.tabRenderer?.content?.sectionListRenderer?.contents;
                        if (contents) {
                            // Iterating sections
                            contents.forEach(section => {
                                const list = section.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents;
                                if (list) items = list;
                            });
                        }
                    }
                } catch (e) { }

                return items;
            };

            const rawItems = extractVideos(jsonData);

            if (rawItems.length > 0) {
                videos = rawItems
                    .filter(item => item.playlistVideoRenderer)
                    .map(item => {
                        const vid = item.playlistVideoRenderer;
                        return {
                            id: crypto.randomUUID(),
                            content: `https://www.youtube.com/watch?v=${vid.videoId}`,
                            type: ITEM_TYPES.YOUTUBE
                        };
                    });
            }

            if (videos.length === 0) {
                setError('No videos found in parsed data. Empty playlist?');
            } else {
                onImport(videos);
                setPlaylistUrl('');
                alert(`Imported ${videos.length} videos!`);
            }
        } catch (err) {
            console.error(err);
            setError(`Parse Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Import from YouTube Playlist</h4>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text"
                    placeholder="https://www.youtube.com/playlist?list=..."
                    value={playlistUrl}
                    onChange={(e) => setPlaylistUrl(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem', background: '#222', color: 'white', border: '1px solid #444' }}
                />
                <button
                    className="btn btn-blue"
                    onClick={fetchPlaylist}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Import'}
                </button>
            </div>
            {error && <p style={{ color: '#ff6b6b', marginTop: '0.5rem', fontSize: '0.9rem' }}>{error}</p>}
            <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                Note: Fetches up to 100 first videos.
            </p>
        </div>
    );
}


function TopListImporter({ onImport }) {
    const [loading, setLoading] = useState(false);
    const [importCount, setImportCount] = useState(32);

    const importJikanTopAnime = async () => {
        setLoading(true);
        try {
            // Fetch top 50 (2 pages)
            const p1 = await fetch('https://api.jikan.moe/v4/top/anime?page=1').then(r => r.json());
            let allAnime = p1.data || [];

            if (importCount > 25) {
                const p2 = await fetch('https://api.jikan.moe/v4/top/anime?page=2').then(r => r.json());
                allAnime = [...allAnime, ...(p2.data || [])];
            }

            const items = allAnime.slice(0, importCount).map(anime => ({
                id: crypto.randomUUID(),
                content: anime.images.jpg.image_url,
                label: `${anime.title} (${anime.year || '?'})`,
                type: ITEM_TYPES.IMAGE
            }));

            onImport(items);
            alert(`Imported ${items.length} Anime!`);
        } catch (e) {
            console.error(e);
            alert('Failed to fetch Anime: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    const importMockGames = () => {
        // Mock Top Games
        const games = [
            { name: "The Legend of Zelda: Ocarina of Time", year: 1998 },
            { name: "Grand Theft Auto IV", year: 2008 },
            { name: "SoulCalibur", year: 1998 },
            { name: "Super Mario Galaxy", year: 2007 },
            { name: "Super Mario Galaxy 2", year: 2010 },
            { name: "Red Dead Redemption 2", year: 2018 },
            { name: "Grand Theft Auto V", year: 2013 },
            { name: "Disco Elysium", year: 2019 },
            { name: "The Legend of Zelda: Breath of the Wild", year: 2017 },
            { name: "Tony Hawk's Pro Skater 2", year: 2000 },
            { name: "Metroid Prime", year: 2002 },
            { name: "Resident Evil 4", year: 2005 },
            { name: "Perfect Dark", year: 2000 },
            { name: "Halo: Combat Evolved", year: 2001 },
            { name: "Half-Life 2", year: 2004 },
            { name: "BioShock", year: 2007 },
            { name: "GoldenEye 007", year: 1997 },
            { name: "Uncharted 2: Among Thieves", year: 2009 },
            { name: "Batman: Arkham City", year: 2011 },
            { name: "Elden Ring", year: 2022 }
        ];

        let targetList = [...games];
        // If requested more than we have names for, generate generics
        if (importCount > games.length) {
            const needed = importCount - games.length;
            for (let i = 0; i < needed; i++) {
                targetList.push({ name: `Top Game #${games.length + i + 1}`, year: 2000 + (i % 24) });
            }
        }

        const items = targetList.slice(0, importCount).map((game, i) => ({
            id: crypto.randomUUID(),
            content: `https://placehold.co/300x400/png?text=${encodeURIComponent(game.name)}`,
            label: `${game.name} (${game.year})`,
            type: ITEM_TYPES.IMAGE
        }));
        onImport(items);
        alert(`Imported ${items.length} Mock Games (IGDB requires API Key)`);
    }

    const importMockMovies = () => {
        const movies = [
            { name: "The Shawshank Redemption", year: 1994 },
            { name: "The Godfather", year: 1972 },
            { name: "The Dark Knight", year: 2008 },
            { name: "The Godfather Part II", year: 1974 },
            { name: "12 Angry Men", year: 1957 },
            { name: "Schindler's List", year: 1993 },
            { name: "The Lord of the Rings: The Return of the King", year: 2003 },
            { name: "Pulp Fiction", year: 1994 },
            { name: "The Lord of the Rings: The Fellowship of the Ring", year: 2001 },
            { name: "The Good, the Bad and the Ugly", year: 1966 },
            { name: "Forrest Gump", year: 1994 },
            { name: "Fight Club", year: 1999 },
            { name: "Inception", year: 2010 },
            { name: "The Lord of the Rings: The Two Towers", year: 2002 },
            { name: "Star Wars: Episode V - The Empire Strikes Back", year: 1980 },
            { name: "The Matrix", year: 1999 },
            { name: "Goodfellas", year: 1990 },
            { name: "One Flew Over the Cuckoo's Nest", year: 1975 },
            { name: "Se7en", year: 1995 },
            { name: "It's a Wonderful Life", year: 1946 }
        ];

        let targetList = [...movies];
        if (importCount > movies.length) {
            const needed = importCount - movies.length;
            for (let i = 0; i < needed; i++) {
                targetList.push({ name: `Top Movie #${movies.length + i + 1}`, year: 1950 + (i % 70) });
            }
        }

        const items = targetList.slice(0, importCount).map((movie, i) => ({
            id: crypto.randomUUID(),
            content: `https://placehold.co/300x400/png?text=${encodeURIComponent(movie.name)}`,
            label: `${movie.name} (${movie.year})`,
            type: ITEM_TYPES.IMAGE
        }));
        onImport(items);
        alert(`Imported ${items.length} Mock Movies (IMDb requires API Key)`);
    }

    return (
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Import Top Lists</h4>

            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ color: '#ccc' }}>Item Count:</label>
                <input
                    type="number"
                    min="2"
                    max="100"
                    value={importCount}
                    onChange={(e) => setImportCount(Number(e.target.value))}
                    style={{ width: '80px', padding: '0.3rem', background: '#222', color: 'white', border: '1px solid #444', textAlign: 'center' }}
                />
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                    className="btn btn-blue"
                    onClick={importJikanTopAnime}
                    disabled={loading}
                    style={{ background: '#2e51a2' }} // MAL Color
                >
                    {loading ? 'Loading...' : 'MAL Top Anime (Real)'}
                </button>
                <button
                    className="btn btn-primary"
                    onClick={importMockGames}
                    style={{ background: '#9147ff' }} // Twitch/IGDB Color
                >
                    IGDB Top Games (Mock)
                </button>
                <button
                    className="btn btn-primary"
                    onClick={importMockMovies}
                    style={{ background: '#f5c518', color: 'black' }} // IMDb Color
                >
                    IMDb Top Movies (Mock)
                </button>
            </div>
            <p style={{ color: '#888', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                Note: MAL uses Jikan API. IGDB/IMDb require keys, showing mock data.
            </p>
        </div>
    );
}
