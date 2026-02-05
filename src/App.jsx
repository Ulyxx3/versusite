import { useState } from 'react'
import Creator from './components/Creator';
import BattleArena from './components/BattleArena';
import { ITEM_TYPES } from './utils/tournamentLogic';

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
        <h1
          className="title-gradient animate-fade-in"
          style={{ fontSize: '3rem', cursor: 'pointer', letterSpacing: '-2px' }}
          onClick={() => {
            if (window.confirm('Return to home? Current progress may be lost.')) setView('LANDING');
          }}
        >
          VERSUSITE
        </h1>
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
          <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>WINNER</h2>
            <div style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '2rem', color: 'var(--color-primary-red)' }}>
              {tournament.winner.content}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '2rem' }}>
              {getContentPreview(tournament.winner)}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => setView('LANDING')}>Home</button>
              {/* Replay or Share features could go here */}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
