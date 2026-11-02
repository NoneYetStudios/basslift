/**
 * Bass Shoplifting Championship — Persistent SQLite Global Leaderboard API
 *
 * Uses Node's built-in `node:sqlite` (DatabaseSync) with parameterized SQL queries,
 * server-side score & biological bounds validation, duplicate-submission protection,
 * and per-IP rate limiting.
 */

import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  validateScoreSubmission,
  VALID_CATEGORIES,
  VALID_DISCIPLINES,
  VALID_DIVISIONS
} from '../js/scoring.js';

export const LIMITS = {
  MAX_BODY_BYTES: 8192,
  PAGE_SIZE_DEFAULT: 25,
  PAGE_SIZE_MAX: 50
};

export function createLeaderboardApi(options = {}) {
  const dbPath = options.dbPath || path.resolve(process.cwd(), 'data', 'leaderboard.sqlite');
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS leaderboard_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT NOT NULL,
      category TEXT NOT NULL,
      discipline TEXT NOT NULL,
      division TEXT NOT NULL,
      fish_species_id TEXT NOT NULL,
      fish_name TEXT NOT NULL,
      fish_rarity TEXT NOT NULL,
      fish_weight REAL NOT NULL,
      execution_quality REAL NOT NULL,
      score REAL NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_lb_cat_score
      ON leaderboard_entries (category, score DESC, created_at ASC);

    CREATE INDEX IF NOT EXISTS idx_lb_cat_disc_score
      ON leaderboard_entries (category, discipline, score DESC);

    CREATE INDEX IF NOT EXISTS idx_lb_cat_div_score
      ON leaderboard_entries (category, division, score DESC);
  `);

  const insertStmt = db.prepare(`
    INSERT INTO leaderboard_entries (
      nickname, category, discipline, division,
      fish_species_id, fish_name, fish_rarity,
      fish_weight, execution_quality, score, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const checkRecentDuplicateStmt = db.prepare(`
    SELECT id, created_at FROM leaderboard_entries
    WHERE nickname = ? AND category = ? AND discipline = ? AND division = ?
      AND ABS(score - ?) < 0.05 AND created_at >= ?
    LIMIT 1
  `);

  const countHigherStmt = db.prepare(`
    SELECT COUNT(*) AS higher FROM leaderboard_entries
    WHERE category = ? AND score > ?
  `);

  const countHigherDiscStmt = db.prepare(`
    SELECT COUNT(*) AS higher FROM leaderboard_entries
    WHERE category = ? AND discipline = ? AND score > ?
  `);

  // Rate limiting state
  const ipBuckets = new Map();
  const maxPerMinute = options.maxRequestsPerMinute || 30;
  const nowFn = options.now || (() => Date.now());

  function checkRateLimit(ip) {
    const now = nowFn();
    const bucket = ipBuckets.get(ip) || [];
    const recent = bucket.filter((t) => now - t < 60_000);
    if (recent.length >= maxPerMinute) {
      return false;
    }
    recent.push(now);
    ipBuckets.set(ip, recent);
    return true;
  }

  function getClientIp(req) {
    if (options.trustProxy && req.headers['x-forwarded-for']) {
      return String(req.headers['x-forwarded-for']).split(',')[0].trim();
    }
    return req.socket?.remoteAddress || '127.0.0.1';
  }

  function sendJson(res, status, data) {
    const body = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    };
    if (options.allowedOrigin) {
      headers['Access-Control-Allow-Origin'] = options.allowedOrigin;
    }
    res.writeHead(status, headers);
    res.end(body);
  }

  function readJsonBody(req) {
    return new Promise((resolve, reject) => {
      let total = 0;
      const chunks = [];
      req.on('data', (chunk) => {
        total += chunk.length;
        if (total > LIMITS.MAX_BODY_BYTES) {
          reject(new Error('Payload too large'));
          req.destroy();
          return;
        }
        chunks.push(chunk);
      });
      req.on('end', () => {
        try {
          const raw = Buffer.concat(chunks).toString('utf8');
          resolve(raw ? JSON.parse(raw) : {});
        } catch {
          reject(new Error('Invalid JSON payload'));
        }
      });
      req.on('error', reject);
    });
  }

  function queryLeaderboard({ category = 'overall', discipline = 'all', division = 'all', limit = 25 }) {
    const safeCategory = VALID_CATEGORIES.has(category) ? category : 'overall';
    const safeDiscipline = VALID_DISCIPLINES.has(discipline) ? discipline : 'all';
    const safeDivision = VALID_DIVISIONS.has(division) ? division : 'all';
    const safeLimit = Math.max(1, Math.min(LIMITS.PAGE_SIZE_MAX, Number(limit) || LIMITS.PAGE_SIZE_DEFAULT));

    const clauses = ['category = ?'];
    const params = [safeCategory];

    if (safeDiscipline !== 'all') {
      clauses.push('discipline = ?');
      params.push(safeDiscipline);
    }
    if (safeDivision !== 'all') {
      clauses.push('division = ?');
      params.push(safeDivision);
    }

    const whereSql = clauses.join(' AND ');
    const sql = `
      SELECT
        id, nickname, category, discipline, division,
        fish_species_id AS fishSpeciesId,
        fish_name AS fishName,
        fish_rarity AS fishRarity,
        fish_weight AS fishWeight,
        execution_quality AS executionQuality,
        score,
        created_at AS createdAt
      FROM leaderboard_entries
      WHERE ${whereSql}
      ORDER BY score DESC, id ASC
      LIMIT ?
    `;

    const rows = db.prepare(sql).all(...params, safeLimit);
    const entries = rows.map((row, idx) => ({
      rank: idx + 1,
      ...row
    }));

    // Also fetch top-1 highlights across key categories for Hall of Fame
    const getTopOne = (cat) =>
      db
        .prepare(
          `SELECT nickname, discipline, division, fish_name AS fishName, fish_rarity AS fishRarity,
                  fish_weight AS fishWeight, score, created_at AS createdAt
           FROM leaderboard_entries WHERE category = ? ORDER BY score DESC, id ASC LIMIT 1`
        )
        .get(cat) || null;

    return {
      ok: true,
      category: safeCategory,
      discipline: safeDiscipline,
      division: safeDivision,
      entries,
      highlights: {
        topOverall: getTopOne('overall'),
        heaviestLift: getTopOne('heaviest_lift'),
        largestCatch: getTopOne('largest_catch'),
        mostVictories: getTopOne('victories')
      }
    };
  }

  function submitSingleRecord(rawItem) {
    const validation = validateScoreSubmission(rawItem);
    if (!validation.ok) {
      return { ok: false, error: validation.error };
    }
    const e = validation.entry;
    const nowIso = new Date(nowFn()).toISOString();
    const tenSecAgoIso = new Date(nowFn() - 10_000).toISOString();

    const dup = checkRecentDuplicateStmt.get(
      e.nickname,
      e.category,
      e.discipline,
      e.division,
      e.score,
      tenSecAgoIso
    );

    let insertedId;
    if (dup) {
      insertedId = dup.id;
    } else {
      const info = insertStmt.run(
        e.nickname,
        e.category,
        e.discipline,
        e.division,
        e.fishSpeciesId,
        e.fishName,
        e.fishRarity,
        e.fishWeight,
        e.executionQuality,
        e.score,
        nowIso
      );
      insertedId = Number(info.lastInsertRowid);
    }

    const rankRow =
      e.category === 'discipline' && e.discipline !== 'all'
        ? countHigherDiscStmt.get(e.category, e.discipline, e.score)
        : countHigherStmt.get(e.category, e.score);

    const rank = Number(rankRow?.higher || 0) + 1;

    return {
      ok: true,
      id: insertedId,
      rank,
      entry: {
        ...e,
        createdAt: nowIso
      }
    };
  }

  async function handle(req, res) {
    const urlObj = new URL(req.url || '/', 'http://localhost');
    const pathname = urlObj.pathname;

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end();
      return;
    }

    if (pathname === '/api/health' && req.method === 'GET') {
      sendJson(res, 200, {
        ok: true,
        engine: 'sqlite',
        timestamp: new Date(nowFn()).toISOString()
      });
      return;
    }

    if (pathname === '/api/leaderboard' && req.method === 'GET') {
      const category = urlObj.searchParams.get('category') || 'overall';
      const discipline = urlObj.searchParams.get('discipline') || 'all';
      const division = urlObj.searchParams.get('division') || 'all';
      const limit = urlObj.searchParams.get('limit') || '25';
      const result = queryLeaderboard({ category, discipline, division, limit });
      sendJson(res, 200, result);
      return;
    }

    if (pathname === '/api/leaderboard' && req.method === 'POST') {
      const ip = getClientIp(req);
      if (!checkRateLimit(ip)) {
        sendJson(res, 429, {
          ok: false,
          error: 'Too many score submissions. Catch your breath for a minute!'
        });
        return;
      }

      let body;
      try {
        body = await readJsonBody(req);
      } catch (err) {
        sendJson(res, 400, { ok: false, error: err.message || 'Invalid JSON body.' });
        return;
      }

      // Support either a single submission or a batch `{ submissions: [...] }` from one lift/meet
      if (Array.isArray(body?.submissions)) {
        if (body.submissions.length === 0 || body.submissions.length > 5) {
          sendJson(res, 400, { ok: false, error: 'Invalid submission batch size.' });
          return;
        }
        const results = [];
        for (const item of body.submissions) {
          const r = submitSingleRecord(item);
          if (!r.ok) {
            sendJson(res, 400, { ok: false, error: r.error });
            return;
          }
          results.push(r);
        }
        sendJson(res, 201, {
          ok: true,
          results,
          primary: results[0]
        });
        return;
      }

      const singleResult = submitSingleRecord(body);
      if (!singleResult.ok) {
        sendJson(res, 400, { ok: false, error: singleResult.error });
        return;
      }

      sendJson(res, 201, singleResult);
      return;
    }

    sendJson(res, 404, { ok: false, error: 'API endpoint not found.' });
  }

  return {
    db,
    handle,
    queryLeaderboard,
    submitSingleRecord,
    close: () => db.close()
  };
}
