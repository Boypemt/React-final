import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SCOREBOARD_PATH = process.env.SCOREBOARD_FILE_PATH ||
  path.join(process.cwd(), 'lib', 'data', 'scoreboard.json');
let writeQueue = Promise.resolve();

async function readEntries() {
  try {
    const content = await readFile(SCOREBOARD_PATH, 'utf8');
    const entries = JSON.parse(content);
    if (!Array.isArray(entries)) {
      throw new TypeError('Scoreboard data must be a JSON array.');
    }
    return entries;
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function getScoreboardEntries({ mode = 'all', period = 'all' } = {}) {
  const entries = await readEntries();
  const now = Date.now();
  const periodMs = period === 'week'
    ? 7 * 86400000
    : period === 'month'
      ? 30 * 86400000
      : null;

  return entries
    .filter((entry) => mode === 'all' || entry.gameMode === mode)
    .filter((entry) => !periodMs || now - Date.parse(entry.submittedAt) <= periodMs)
    .sort((left, right) =>
      right.score - left.score ||
      left.timeSpentSeconds - right.timeSpentSeconds ||
      Date.parse(right.submittedAt) - Date.parse(left.submittedAt)
    )
    .slice(0, 100);
}

export async function saveScoreEntry(entry) {
  const operation = writeQueue.then(async () => {
    const entries = await readEntries();
    const savedEntry = {
      ...entry,
      id: randomUUID(),
      submittedAt: new Date().toISOString(),
    };
    const nextEntries = [...entries, savedEntry];
    const directory = path.dirname(SCOREBOARD_PATH);
    const temporaryPath = `${SCOREBOARD_PATH}.${randomUUID()}.tmp`;

    await mkdir(directory, { recursive: true });
    await writeFile(temporaryPath, JSON.stringify(nextEntries, null, 2), 'utf8');
    await rename(temporaryPath, SCOREBOARD_PATH);
    return savedEntry;
  });

  writeQueue = operation.catch(() => undefined);
  return operation;
}
