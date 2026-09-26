export interface GameProgress {
  version: 1;
  knowledgePoints: number;
  skillPoints: number;
  inventory: string[];
  codes: string[];
  achievements: string[];
  unlockedAreas: string[];
}

const STORAGE_KEY = 'invert61-progress-v1';

export const DEFAULT_PROGRESS: GameProgress = {
  version: 1,
  knowledgePoints: 0,
  skillPoints: 0,
  inventory: [],
  codes: [],
  achievements: [],
  unlockedAreas: [],
};

export function loadGameProgress(): GameProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<GameProgress>;
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      knowledgePoints: Number.isFinite(parsed.knowledgePoints) ? Math.max(0, parsed.knowledgePoints!) : 0,
      skillPoints: Number.isFinite(parsed.skillPoints) ? Math.max(0, parsed.skillPoints!) : 0,
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
      codes: Array.isArray(parsed.codes) ? parsed.codes : [],
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
      unlockedAreas: Array.isArray(parsed.unlockedAreas) ? parsed.unlockedAreas : [],
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveGameProgress(progress: GameProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Private browsing / storage restrictions should never stop the game.
  }
}

export function addInventoryItem(progress: GameProgress, item: string): GameProgress {
  const normalized = item.trim();
  if (!normalized || progress.inventory.includes(normalized)) return progress;
  return { ...progress, inventory: [...progress.inventory, normalized] };
}

export function discoverCode(progress: GameProgress, code: string): GameProgress {
  const normalized = code.trim();
  if (!normalized || progress.codes.includes(normalized)) return progress;
  return { ...progress, codes: [...progress.codes, normalized] };
}

export function awardKnowledge(progress: GameProgress, amount = 1): GameProgress {
  return {
    ...progress,
    knowledgePoints: Math.max(0, progress.knowledgePoints + Math.max(0, amount)),
  };
}


export function awardSkill(progress: GameProgress, amount = 1): GameProgress {
  return {
    ...progress,
    skillPoints: Math.max(0, progress.skillPoints + Math.max(0, amount)),
  };
}

export function unlockAchievement(progress: GameProgress, id: string): GameProgress {
  if (!id || progress.achievements.includes(id)) return progress;
  return { ...progress, achievements: [...progress.achievements, id] };
}

export function unlockArea(progress: GameProgress, id: string): GameProgress {
  if (!id || progress.unlockedAreas.includes(id)) return progress;
  return { ...progress, unlockedAreas: [...progress.unlockedAreas, id] };
}
