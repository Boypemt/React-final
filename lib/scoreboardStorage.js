const STORAGE_KEY = 'disney-guesser:scoreboard:v1';
const MAX_STORED_ENTRIES = 1000;
const MAX_SCORE = 1000000;

function isValidEntry(entry) {
  return entry &&
    typeof entry.id === 'string' &&
    typeof entry.name === 'string' &&
    ['deduction', 'trivia'].includes(entry.gameMode) &&
    Number.isInteger(entry.score) &&
    entry.score >= 0 &&
    entry.score <= MAX_SCORE &&
    Number.isInteger(entry.timeSpentSeconds) &&
    entry.timeSpentSeconds >= 0 &&
    entry.timeSpentSeconds <= 86400 &&
    typeof entry.submittedAt === 'string' &&
    Number.isFinite(Date.parse(entry.submittedAt));
}

function readStoredEntries() {
  const content = window.localStorage.getItem(STORAGE_KEY);
  if (content === null) return [];

  const entries = JSON.parse(content);
  if (!Array.isArray(entries) || !entries.every(isValidEntry)) {
    throw new Error('ข้อมูลกระดานคะแนนในเบราว์เซอร์ไม่ถูกต้อง');
  }
  return entries;
}

function compareEntries(left, right) {
  return right.score - left.score ||
    left.timeSpentSeconds - right.timeSpentSeconds ||
    Date.parse(right.submittedAt) - Date.parse(left.submittedAt);
}

export function getScoreboardEntries({ mode = 'all', period = 'all' } = {}) {
  const entries = readStoredEntries();
  const now = Date.now();
  const periodMs = period === 'week'
    ? 7 * 86400000
    : period === 'month'
      ? 30 * 86400000
      : null;

  return entries
    .filter((entry) => mode === 'all' || entry.gameMode === mode)
    .filter((entry) => !periodMs || now - Date.parse(entry.submittedAt) <= periodMs)
    .sort(compareEntries)
    .slice(0, 100);
}

export function saveScoreEntry({
  name,
  gameMode,
  score,
  timeSpentSeconds,
  guessesCount,
  correctCount,
  firstClueWins,
}) {
  const normalizedName = name.trim();
  if (normalizedName.length < 2 || normalizedName.length > 24) {
    throw new Error('ชื่อผู้เล่นต้องมีความยาว 2–24 ตัวอักษร');
  }
  if (!['deduction', 'trivia'].includes(gameMode)) {
    throw new Error('โหมดเกมไม่ถูกต้อง');
  }
  if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) {
    throw new Error('คะแนนไม่ถูกต้อง');
  }
  if (!Number.isInteger(timeSpentSeconds) || timeSpentSeconds < 0 || timeSpentSeconds > 86400) {
    throw new Error('เวลาเล่นไม่ถูกต้อง');
  }

  const entry = {
    id: globalThis.crypto.randomUUID(),
    name: normalizedName,
    gameMode,
    score,
    timeSpentSeconds,
    ...(guessesCount !== undefined && { guessesCount }),
    ...(correctCount !== undefined && { correctCount }),
    ...(firstClueWins !== undefined && { firstClueWins }),
    submittedAt: new Date().toISOString(),
  };
  const entries = [...readStoredEntries(), entry]
    .sort((left, right) => Date.parse(right.submittedAt) - Date.parse(left.submittedAt))
    .slice(0, MAX_STORED_ENTRIES);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  return entry;
}
