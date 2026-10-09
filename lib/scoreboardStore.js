import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SCOREBOARD_PATH = process.env.SCOREBOARD_FILE_PATH ||
  path.join(process.cwd(), 'lib', 'data', 'scoreboard.json');
const REDIS_KEY = 'disney-guesser:scoreboard:v1';
const REDIS_SAVE_SCRIPT = "return redis.call('ZADD', KEYS[1], ARGV[1], ARGV[2])";
let writeQueue = Promise.resolve();

export class ScoreboardStorageConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ScoreboardStorageConfigurationError';
  }
}

export class ScoreboardStorageUnavailableError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'ScoreboardStorageUnavailableError';
  }
}

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url && !token) {
    if (process.env.NODE_ENV === 'production') {
      throw new ScoreboardStorageConfigurationError(
        'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production.'
      );
    }
    return null;
  }

  if (!url || !token) {
    throw new ScoreboardStorageConfigurationError(
      'Both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be configured.'
    );
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new ScoreboardStorageConfigurationError('UPSTASH_REDIS_REST_URL must be a valid HTTPS URL.');
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new ScoreboardStorageConfigurationError('UPSTASH_REDIS_REST_URL must use HTTPS.');
  }

  return { url: parsedUrl.toString().replace(/\/$/, ''), token };
}

async function executeRedisCommand(config, command) {
  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new ScoreboardStorageUnavailableError(
        `Upstash Redis request failed with status ${response.status}.`
      );
    }

    const payload = await response.json();
    if (payload.error) {
      throw new ScoreboardStorageUnavailableError('Upstash Redis rejected the scoreboard request.');
    }

    return payload.result;
  } catch (error) {
    if (error instanceof ScoreboardStorageUnavailableError) throw error;
    throw new ScoreboardStorageUnavailableError('Upstash Redis request failed.', { cause: error });
  }
}

async function readFileEntries() {
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

async function readRedisEntries(config) {
  const members = await executeRedisCommand(config, [
    'ZREVRANGE',
    REDIS_KEY,
    '0',
    '-1',
  ]);

  if (!Array.isArray(members)) {
    throw new TypeError('Upstash Redis returned invalid scoreboard data.');
  }

  return members.map((member) => {
    if (typeof member !== 'string') {
      throw new TypeError('Upstash Redis returned an invalid scoreboard entry.');
    }
    const separatorIndex = member.indexOf('|');
    if (separatorIndex < 0) {
      throw new TypeError('Upstash Redis returned an invalid scoreboard entry.');
    }
    return JSON.parse(member.slice(separatorIndex + 1));
  });
}

async function readEntries(config) {
  return config ? readRedisEntries(config) : readFileEntries();
}

export async function getScoreboardEntries({ mode = 'all', period = 'all' } = {}) {
  const entries = await readEntries(getRedisConfig());
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

async function saveFileEntry(savedEntry) {
  const entries = await readFileEntries();
  const nextEntries = [...entries, savedEntry];
  const directory = path.dirname(SCOREBOARD_PATH);
  const temporaryPath = `${SCOREBOARD_PATH}.${randomUUID()}.tmp`;

  await mkdir(directory, { recursive: true });
  try {
    await writeFile(temporaryPath, JSON.stringify(nextEntries, null, 2), 'utf8');
    await rename(temporaryPath, SCOREBOARD_PATH);
  } catch (error) {
    await unlink(temporaryPath).catch((cleanupError) => {
      if (cleanupError.code !== 'ENOENT') throw cleanupError;
    });
    throw error;
  }
}

async function saveRedisEntry(config, savedEntry) {
  const invertedTime = String(86400 - savedEntry.timeSpentSeconds).padStart(5, '0');
  const submittedAt = String(Date.parse(savedEntry.submittedAt)).padStart(13, '0');
  const member = `${invertedTime}:${submittedAt}:${savedEntry.id}|${JSON.stringify(savedEntry)}`;

  await executeRedisCommand(config, [
    'EVAL',
    REDIS_SAVE_SCRIPT,
    '1',
    REDIS_KEY,
    String(savedEntry.score),
    member,
  ]);
}

export async function saveScoreEntry(entry) {
  const config = getRedisConfig();
  const savedEntry = {
    ...entry,
    id: randomUUID(),
    submittedAt: new Date().toISOString(),
  };

  if (config) {
    await saveRedisEntry(config, savedEntry);
    return savedEntry;
  }

  const operation = writeQueue.then(() => saveFileEntry(savedEntry));
  writeQueue = operation.catch(() => undefined);
  await operation;
  return savedEntry;
}
