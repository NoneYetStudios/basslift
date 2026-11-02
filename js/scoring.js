/**
 * Bass Shoplifting Championship — Deterministic Scoring & Validation (Shared Client + Server)
 */

import { RARITIES, FISH_SPECIES, DISCIPLINES, DIVISIONS } from './data.js';

export const VALID_CATEGORIES = new Set([
  'overall',
  'discipline',
  'heaviest_lift',
  'largest_catch',
  'victories'
]);

export const VALID_DISCIPLINES = new Set(DISCIPLINES.map((d) => d.id));
export const VALID_DIVISIONS = new Set(DIVISIONS.map((d) => d.id));

const BLOCKED_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'nigger', 'nigga', 'faggot',
  'retard', 'whore', 'slut', 'nazi', 'hitler', 'cock', 'dick', 'pussy'
];

/**
 * Validates and normalizes a player nickname.
 */
export function validateNickname(raw) {
  if (typeof raw !== 'string') {
    return { ok: false, error: 'Nickname must be a text string.' };
  }
  const cleaned = raw.trim().replace(/\s+/g, ' ');
  if (cleaned.length < 2) {
    return { ok: false, error: 'Nickname must be at least 2 characters.' };
  }
  if (cleaned.length > 18) {
    return { ok: false, error: 'Nickname must be 18 characters or fewer.' };
  }
  if (!/^[A-Za-z0-9 _.\-!]+$/.test(cleaned)) {
    return { ok: false, error: 'Nickname can only use letters, numbers, spaces, and - _ . !' };
  }
  const lower = cleaned.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const word of BLOCKED_WORDS) {
    if (lower.includes(word)) {
      return { ok: false, error: 'Please choose a family-friendly championship nickname.' };
    }
  }
  return { ok: true, nickname: cleaned };
}

/**
 * Computes the score for a single lift attempt.
 *
 * @param {object} params
 * @param {number} params.fishWeight - Primary fish weight in lbs
 * @param {number} [params.secondFishWeight=0] - Secondary fish weight (for dumbbell lift)
 * @param {number} params.executionQuality - 0 to 100
 * @param {string} params.disciplineId
 * @param {string} params.divisionId
 * @param {string} [params.rarity='common']
 * @param {number} [params.equipmentScoreBonus=1.0]
 */
export function calculateLiftScore({
  fishWeight,
  secondFishWeight = 0,
  executionQuality,
  disciplineId,
  divisionId,
  rarity = 'common',
  equipmentScoreBonus = 1.0
}) {
  const quality = Math.max(0, Math.min(100, Number(executionQuality) || 0));
  if (quality < 50) {
    return {
      success: false,
      score: 0,
      effectiveWeight: 0,
      qualityRounded: Math.round(quality * 10) / 10,
      grade: 'NO LIFT'
    };
  }

  const primaryW = Math.max(1, Math.min(1500, Number(fishWeight) || 12));
  const secondaryW = disciplineId === 'dumbbell'
    ? Math.max(1, Math.min(1500, Number(secondFishWeight) || primaryW))
    : 0;

  // For dumbbell lift, total effective weight is primary + 0.65 * secondary (balanced pair bonus)
  const effectiveWeight = disciplineId === 'dumbbell'
    ? Math.round((primaryW + secondaryW * 0.65) * 10) / 10
    : primaryW;

  const discipline = DISCIPLINES.find((d) => d.id === disciplineId) || DISCIPLINES[0];
  const division = DIVISIONS.find((d) => d.id === divisionId) || DIVISIONS[0];
  const rarityObj = RARITIES[rarity] || RARITIES.common;
  const gearMult = Math.max(1.0, Math.min(1.4, Number(equipmentScoreBonus) || 1.0));

  // Base formula: (effectiveWeight * 3.2 + 85) * qualityFactor * disciplineMult * divisionMult * rarityBonus * gearMult
  const qualityFactor = 0.55 + (quality / 100) * 0.75; // 0.925 at 50%, 1.30 at 100%
  const rawScore =
    (effectiveWeight * 3.2 + 85) *
    qualityFactor *
    discipline.multiplier *
    division.multiplier *
    rarityObj.scoreBonus *
    gearMult;

  const score = Math.round(rawScore);

  let grade = 'VALID LIFT';
  if (quality >= 93) grade = 'WORLD-CLASS LOCKOUT';
  else if (quality >= 82) grade = 'CLEAN WHITE LIGHTS';
  else if (quality >= 68) grade = 'SOLID GRIND';

  return {
    success: true,
    score,
    effectiveWeight,
    qualityRounded: Math.round(quality * 10) / 10,
    grade
  };
}

/**
 * Validates a leaderboard score submission payload on the server.
 */
export function validateScoreSubmission(payload) {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Malformed submission payload.' };
  }

  const nickCheck = validateNickname(payload.nickname);
  if (!nickCheck.ok) {
    return { ok: false, error: nickCheck.error };
  }

  const category = String(payload.category || 'overall').trim();
  if (!VALID_CATEGORIES.has(category)) {
    return { ok: false, error: 'Invalid leaderboard category.' };
  }

  const discipline = String(payload.discipline || 'clean_jerk').trim();
  if (discipline !== 'all' && !VALID_DISCIPLINES.has(discipline)) {
    return { ok: false, error: 'Invalid lifting discipline.' };
  }

  const division = String(payload.division || 'lightweight').trim();
  if (!VALID_DIVISIONS.has(division)) {
    return { ok: false, error: 'Invalid competition division.' };
  }

  const speciesId = String(payload.fishSpeciesId || 'starter_hatchery_bass').trim();
  const species = FISH_SPECIES.find((s) => s.speciesId === speciesId);
  if (!species) {
    return { ok: false, error: 'Unrecognized fish species identifier.' };
  }

  const fishWeight = Number(payload.fishWeight);
  if (!Number.isFinite(fishWeight) || fishWeight < 5 || fishWeight > 1500) {
    return { ok: false, error: 'Implausible fish weight submitted.' };
  }

  // Verify weight is within species bounds (allowing 1.75x for dual dumbbell fish effective weight or slight variance)
  const minAllowed = species.minWeight * 0.85;
  const maxAllowed = species.maxWeight * 1.75;
  if (fishWeight < minAllowed || fishWeight > maxAllowed) {
    return { ok: false, error: 'Submitted fish weight does not match species biological bounds.' };
  }

  const executionQuality = Number(payload.executionQuality ?? 85);
  if (!Number.isFinite(executionQuality) || executionQuality < 0 || executionQuality > 100) {
    return { ok: false, error: 'Invalid execution quality percentage.' };
  }

  const rawValue = Number(payload.score);
  if (!Number.isFinite(rawValue) || rawValue <= 0 || rawValue > 150000) {
    return { ok: false, error: 'Score value is out of valid bounds.' };
  }

  // Category-specific plausibility checks
  let normalizedScore = Math.round(rawValue * 10) / 10;
  if (category === 'heaviest_lift' || category === 'largest_catch') {
    if (Math.abs(normalizedScore - fishWeight) > 1.0) {
      return { ok: false, error: 'Weight record submission must match verified fish weight.' };
    }
  } else if (category === 'victories') {
    normalizedScore = Math.round(rawValue);
    if (normalizedScore < 1 || normalizedScore > 500) {
      return { ok: false, error: 'Invalid championship victory count.' };
    }
  } else {
    // 'overall' (3-lift championship total or single competition score) or 'discipline' (single lift)
    normalizedScore = Math.round(rawValue);
    const maxSingleLift = calculateLiftScore({
      fishWeight: species.maxWeight,
      secondFishWeight: species.maxWeight,
      executionQuality: 100,
      disciplineId: discipline === 'all' ? 'overhead' : discipline,
      divisionId: division,
      rarity: species.rarity,
      equipmentScoreBonus: 1.4
    }).score;

    const maxAllowedScore = category === 'overall' ? maxSingleLift * 3.5 : maxSingleLift * 1.15;
    if (normalizedScore < 20 || normalizedScore > maxAllowedScore) {
      return { ok: false, error: 'Submitted competition score exceeds plausible physics bounds.' };
    }
  }

  return {
    ok: true,
    entry: {
      nickname: nickCheck.nickname,
      category,
      discipline,
      division,
      fishSpeciesId: species.speciesId,
      fishName: species.name,
      fishRarity: species.rarity,
      fishWeight: Math.round(fishWeight * 10) / 10,
      executionQuality: Math.round(executionQuality * 10) / 10,
      score: normalizedScore
    }
  };
}
