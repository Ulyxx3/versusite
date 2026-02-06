export const ITEM_TYPES = {
    TEXT: 'TEXT',
    IMAGE: 'IMAGE',
    YOUTUBE: 'YOUTUBE'
};

export const createTournament = (title, items) => {
    // 1. Shuffle items
    const shuffled = [...items].sort(() => Math.random() - 0.5);

    // 2. Pad to nearest power of 2 with "BYE"s if needed, or handle in matchmaking.
    // For simplicity, we'll just queue them up. 
    // Better approach: Standard single elimination bracket.

    const bracket = generateBracket(shuffled);

    return {
        id: crypto.randomUUID(),
        title,
        items: shuffled,
        rounds: bracket, // Array of arrays of matches
        currentRoundIndex: 0,
        currentMatchIndex: 0,
        history: [], // For undo functionality
        completed: false,
        winner: null
    };
};

const generateBracket = (items) => {
    let matches = [];
    // Basic pairs for Round 1
    // If odd, one item gets a bye (automatically advances).
    // Ideally we want power of 2.
    // We will fill with dummy "BYE" items that auto-lose? 
    // No, standard way is to give top seeds byes. Here random seeds.

    // Let's just create the first round. Subsequent rounds are generated from winners.
    const round1 = [];
    const count = items.length;

    // Find nearest power of 2 >= count
    const size = Math.pow(2, Math.ceil(Math.log2(count)));
    const byes = size - count;

    // Logic: The first 'byes' items get a pass? 
    // Or we just pair them up and handle validation.

    // Simpler approach for version 1:
    // Just pair them up. If one left over, it waits for next round (or gets a bye).

    for (let i = 0; i < items.length; i += 2) {
        if (i + 1 < items.length) {
            round1.push({
                id: crypto.randomUUID(),
                p1: items[i],
                p2: items[i + 1],
                winner: null
            });
        } else {
            // Bye
            round1.push({
                id: crypto.randomUUID(),
                p1: items[i],
                p2: null, // Indicates auto-win
                winner: items[i] // Auto-advance
            });
        }
    }

    return [round1];
};

export const resolveMatch = (tournament, matchId, winnerItem) => {
    // Deep clone to avoid mutation issues
    const newTournament = JSON.parse(JSON.stringify(tournament));

    const currentRound = newTournament.rounds[newTournament.currentRoundIndex];
    const matchIndex = currentRound.findIndex(m => m.id === matchId);

    if (matchIndex === -1) return newTournament;

    currentRound[matchIndex].winner = winnerItem;

    // advanced logic to check if round is complete
    const roundComplete = currentRound.every(m => m.winner);

    if (roundComplete) {
        if (currentRound.length === 1) {
            // Tournament Over
            newTournament.completed = true;
            newTournament.winner = currentRound[0].winner;
        } else {
            // Generate Next Round
            const nextRound = [];
            for (let i = 0; i < currentRound.length; i += 2) {
                const m1 = currentRound[i];
                if (i + 1 < currentRound.length) {
                    const m2 = currentRound[i + 1];
                    nextRound.push({
                        id: crypto.randomUUID(),
                        p1: m1.winner,
                        p2: m2.winner,
                        winner: null
                    });
                } else {
                    // Should not happen if power of 2 logic was perfect, but just in case
                    nextRound.push({
                        id: crypto.randomUUID(),
                        p1: m1.winner,
                        p2: null,
                        winner: m1.winner
                    });
                }
            }
            newTournament.rounds.push(nextRound);
            newTournament.currentRoundIndex++;
            newTournament.currentMatchIndex = 0;
        }
    } else {
        // Determine next match index (skip already played ones)
        // Actually, usually we play specific order. 
        // We'll just increment index logic in the helper, or UI finds first non-played match.
        // For now, let's just use the helper to find next.
    }

    return newTournament;
};

export const getNextMatch = (tournament) => {
    if (!tournament || tournament.completed) return null;
    const currentRound = tournament.rounds[tournament.currentRoundIndex];
    return currentRound.find(m => !m.winner);
};

export const getRankings = (tournament) => {
    if (!tournament || !tournament.winner) return [];

    const rankings = [];

    // Rank 1: The Winner
    rankings.push({ rank: 1, item: tournament.winner });

    // Process rounds in reverse (Finals -> Semis -> Quarters -> ...)
    // The losers of each round get the next available rank.
    // e.g., Final loser = Rank 2
    // Semis losers = Rank 3
    // Quarters losers = Rank 5

    let currentRank = 2;

    // Use a Set to keep track of who has been ranked to avoid duplicates if something goes wrong,
    // though conceptually the winner is the only one 'advancing' without losing.
    const rankedIds = new Set([tournament.winner.id]);

    for (let i = tournament.rounds.length - 1; i >= 0; i--) {
        const round = tournament.rounds[i];
        const roundLosers = [];

        round.forEach(match => {
            if (match.winner) {
                // Identify the loser
                const loser = match.winner.id === match.p1.id ? match.p2 : match.p1;
                if (loser && !rankedIds.has(loser.id)) {
                    roundLosers.push(loser);
                    rankedIds.add(loser.id);
                }
            }
        });

        if (roundLosers.length > 0) {
            roundLosers.forEach(loser => {
                rankings.push({ rank: currentRank, item: loser });
            });
            // The next rank is determined by how many people were ranked above + this batch
            // Equivalent to: current rank + count of losers in this round
            currentRank += roundLosers.length;
        }
    }

    return rankings;
};
