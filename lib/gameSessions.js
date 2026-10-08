const LAST_SESSION_KEY = 'disney_last_session';
const GAME_HISTORY_KEY = 'disney_game_history';

export function recordCompletedSession(session) {
  if (typeof window === 'undefined') return;

  const completedSession = {
    ...session,
    completedAt: session.completedAt || new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(LAST_SESSION_KEY, JSON.stringify(completedSession));
  } catch (error) {
    console.error('Unable to save the latest game session.', error);
  }

  try {
    const rawHistory = window.localStorage.getItem(GAME_HISTORY_KEY);
    const history = rawHistory ? JSON.parse(rawHistory) : [];
    if (!Array.isArray(history)) {
      throw new TypeError('Saved game history must be an array.');
    }

    history.push(completedSession);
    window.localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Unable to save game history for achievements.', error);
  }
}

export function readGameHistory() {
  if (typeof window === 'undefined') return [];

  const rawHistory = window.localStorage.getItem(GAME_HISTORY_KEY);
  if (!rawHistory) return [];

  const history = JSON.parse(rawHistory);
  if (!Array.isArray(history)) {
    throw new TypeError('Saved game history must be an array.');
  }

  return history.filter((session) =>
    session &&
    (session.gameMode === 'deduction' || session.gameMode === 'trivia') &&
    Number.isFinite(session.score) &&
    Number.isFinite(Date.parse(session.completedAt))
  );
}
