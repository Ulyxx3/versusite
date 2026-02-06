import { useState } from 'react';
import { ITEM_TYPES, createTournament } from '../utils/tournamentLogic';

export default function Creator({ onStart, onLoad }) {
    const [title, setTitle] = useState('');
    const [items, setItems] = useState([]);
    const [newItemUrl, setNewItemUrl] = useState('');
    const [newItemType, setNewItemType] = useState(ITEM_TYPES.YOUTUBE);
    const [bulkText, setBulkText] = useState('');

    const handleAddItem = () => {
        if (!newItemUrl) return;
        setItems([...items, {
            id: crypto.randomUUID(),
            content: newItemUrl,
            type: newItemType
        }]);
        setNewItemUrl('');
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
                    <button className="btn btn-blue" onClick={handleAddItem}>Add</button>
                </div>

                <PlaylistImporter onImport={(newItems) => setItems(prev => [...prev, ...newItems])} />

                <details style={{ marginTop: '1rem' }}>
                    <summary style={{ cursor: 'pointer', color: '#aaa', marginBottom: '0.5rem' }}>Bulk Add (Copy & Paste URL List)</summary>
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
                                [{item.type}] {item.content}
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
        if (!playlistUrl.includes('list=')) {
            setError('Invalid URL. Must contain "list=" parameter.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Use AllOrigins as a CORS proxy
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(playlistUrl)}`;
            const response = await fetch(proxyUrl);
            const data = await response.json();

            if (!data.contents) throw new Error('No content received from proxy');

            // Find ytInitialData
            const html = data.contents;
            const startStr = 'var ytInitialData = ';
            const startIdx = html.indexOf(startStr);

            if (startIdx === -1) throw new Error('Could not parse YouTube data (ytInitialData not found)');

            // Find end of JSON
            // It usually ends with ;</script>
            let endIdx = html.indexOf(';</script>', startIdx);
            if (endIdx === -1) {
                // Fallback: try finding the first semicolon followed by newline
                endIdx = html.indexOf(';\n', startIdx);
            }
            if (endIdx === -1) {
                // Fallback: simple semicolon check might be risky if JSON contains it, but ytInitialData is usually a single massive line
                endIdx = html.indexOf(';', startIdx + startStr.length + 100);
            }

            if (endIdx === -1) throw new Error('Could not parse YouTube data (JSON end not found)');

            const jsonStr = html.substring(startIdx + startStr.length, endIdx);
            const jsonData = JSON.parse(jsonStr);

            // Traverse to find videos
            // Path: contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].playlistVideoListRenderer.contents
            let videos = [];
            try {
                const tabs = jsonData.contents.twoColumnBrowseResultsRenderer.tabs;
                const tab = tabs.find(t => t.tabRenderer?.selected);
                const contents = tab.tabRenderer.content.sectionListRenderer.contents;
                const itemSection = contents[0].itemSectionRenderer;
                const playlistRenderer = itemSection.contents[0].playlistVideoListRenderer;

                if (playlistRenderer && playlistRenderer.contents) {
                    videos = playlistRenderer.contents
                        .filter(item => item.playlistVideoRenderer) // Filter out continuation tokens
                        .map(item => {
                            const vid = item.playlistVideoRenderer;
                            return {
                                id: crypto.randomUUID(),
                                content: `https://www.youtube.com/watch?v=${vid.videoId}`,
                                type: ITEM_TYPES.YOUTUBE
                            };
                        });
                }
            } catch (e) {
                console.error(e);
                throw new Error('Structure of YouTube page changed, cannot parse.');
            }

            if (videos.length === 0) {
                setError('No videos found. Privacy settings or empty playlist?');
            } else {
                onImport(videos);
                setPlaylistUrl('');
                alert(`Imported ${videos.length} videos!`);
            }

        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to fetch playlist');
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
