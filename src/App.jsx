import { useState, useEffect } from 'react'
import Creator from './components/Creator';
import BattleArena from './components/BattleArena';
import { ITEM_TYPES, getRankings } from './utils/tournamentLogic';
import logo from './assets/logo.svg';

function App() {
  const [view, setView] = useState('LANDING'); // LANDING, CREATOR, BATTLE, RESULTS
  const [tournament, setTournament] = useState(null);

  const startTournament = (t) => {
    setTournament(t);
    setView('BATTLE');
  };

  const updateTournament = (t) => {
    setTournament(t);
    if (t.completed) {
      setView('RESULTS');
    }
  };

  // Extract ID for thumbnail
  const getContentPreview = (item) => {
    if (item.type === ITEM_TYPES.YOUTUBE) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = item.content.match(regExp);
      const id = (match && match[2].length === 11) ? match[2] : null;
      return <img src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`} alt="Preview" style={{ height: '100px' }} />;
    }
    if (item.type === ITEM_TYPES.IMAGE) {
      return <img src={item.content} alt="Preview" style={{ height: '100px' }} />;
    }
    return <span>{item.content}</span>;
  }

  return (
    <div className="min-h-screen">
      <header className="container" style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <img
          src={logo}
          alt="Versusite"
          className="title-gradient animate-fade-in"
          style={{ height: '4rem', cursor: 'pointer' }}
          onClick={() => {
            if (window.confirm('Return to home? Current progress may be lost.')) setView('LANDING');
          }}
        />
      </header>

      <main className="container">
        {view === 'LANDING' && (
          <div className="animate-slide-up" style={{ textAlign: 'center', marginTop: '6rem' }}>
            <h2 style={{ fontSize: '5rem', marginBottom: '1.5rem', fontWeight: '900', letterSpacing: '-3px', lineHeight: '1' }}>
              THE ULTIMATE <br />
              <span className="title-gradient">VERSUS</span> ARENA
            </h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '4rem', fontSize: '1.5rem', maxWidth: '700px', margin: '0 auto 4rem', lineHeight: '1.6' }}>
              Create tournaments. Rank everything. Decide the winner.<br />
              Support for Images, YouTube Videos, and Text.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
              <button
                className="btn btn-red"
                style={{ fontSize: '1.3rem', padding: '1.2rem 3rem' }}
                onClick={() => setView('CREATOR')}
              >
                CREATE TOURNAMENT
              </button>
            </div>
          </div>
        )}

        {view === 'CREATOR' && (
          <Creator onStart={startTournament} onLoad={startTournament} />
        )}

        {view === 'BATTLE' && tournament && (
          <BattleArena
            tournament={tournament}
            onUpdate={updateTournament}
            onComplete={(t) => { setTournament(t); setView('RESULTS'); }}
          />
        )}

        {view === 'RESULTS' && tournament && tournament.winner && (
          <ResultsView tournament={tournament} onHome={() => setView('LANDING')} />
        )}
      </main>
    </div>
  )
}

function ResultsView({ tournament, onHome }) {
  const [winnerTitle, setWinnerTitle] = useState(null);
  const [rankings, setRankings] = useState([]);

  // Fetch winner title
  useEffect(() => {
    if (!tournament.winner) return;

    // Calculate rankings immediately
    setRankings(getRankings(tournament));

    const fetchTitle = async () => {
      const item = tournament.winner;
      if (item.type === ITEM_TYPES.YOUTUBE) {
        try {
          const response = await fetch(`https://noembed.com/embed?url=${item.content}`);
          const data = await response.json();
          setWinnerTitle(data.title || 'Watch Video');
        } catch (e) {
          setWinnerTitle('Watch Video');
        }
      } else if (item.type === ITEM_TYPES.IMAGE) {
        const name = item.content.split('/').pop();
        setWinnerTitle(name || 'View Image');
      } else {
        setWinnerTitle(item.content);
      }
    };
    fetchTitle();
  }, [tournament]);

  // Extract ID for thumbnail (helper duplicated or moved to scope, let's redefine locally or pass down)
  const getPreview = (item, large = false) => {
    if (item.type === ITEM_TYPES.YOUTUBE) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = item.content.match(regExp);
      const id = (match && match[2].length === 11) ? match[2] : null;
      return <img src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`} alt="Preview" style={{ height: large ? '300px' : '60px', borderRadius: '8px', objectFit: 'cover' }} />;
    }
    if (item.type === ITEM_TYPES.IMAGE) {
      return <img src={item.content} alt="Preview" style={{ height: large ? '300px' : '60px', borderRadius: '8px', objectFit: 'contain' }} />;
    }
    return <span style={{ fontSize: large ? '2rem' : '1rem' }}>{item.content}</span>;
  }

  return (
    <div className="glass-panel animate-slide-up" style={{ textAlign: 'center', padding: '3rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: '900' }} className="title-gradient">WINNER</h2>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
        <div style={{
          padding: '1rem',
          background: 'var(--color-bg-dark)',
          borderRadius: '20px',
          border: '2px solid var(--color-primary-blue)',
          boxShadow: '0 0 50px rgba(43, 110, 235, 1)'
        }}>
          {getPreview(tournament.winner, true)}
        </div>

        <h3 style={{ fontSize: '2rem', marginTop: '1rem' }}>
          {winnerTitle || 'Loading...'}
        </h3>

        {(tournament.winner.type === ITEM_TYPES.YOUTUBE || tournament.winner.type === ITEM_TYPES.IMAGE) && (
          <a
            href={tournament.winner.content}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-blue"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            OPEN LINK <span>↗</span>
          </a>
        )}
      </div>

      <div style={{ textAlign: 'left', marginTop: '4rem' }}>
        <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
          Tournament Rankings
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '1rem' }}>
          {rankings.map(({ rank, item }) => (
            <div key={item.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: rank === 1 ? 'var(--color-primary-blue)' : 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '1.2rem',
                color: rank === 1 ? '#000' : '#fff'
              }}>
                #{rank}
              </div>
              <div style={{ width: '80px', display: 'flex', justifyContent: 'center' }}>
                {getPreview(item, false)}
              </div>
              <div style={{ flex: 1, fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.label || item.content}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '3rem' }}>
        <button className="btn btn-primary" onClick={onHome} style={{ padding: '1rem 3rem', fontSize: '1.2rem' }}>Return Home</button>
      </div>
    </div>
  );
}


export default App
