export interface GameSession {
  id?: string;
  timeSurvived: number;
  maxAnxiety: number;
  coinsCollected: number;
  result: 'VITORIA' | 'DERROTA';
  timestamp: string;
}

const HISTORY_KEY = '@sobrecarga:history';
const COINS_KEY = '@sobrecarga:coins';

export const getHistorySessionsLocal = (): GameSession[] => {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Error reading history from localStorage", e);
    return [];
  }
};

export const saveGameSessionLocal = (session: Omit<GameSession, 'timestamp'>): GameSession[] => {
  try {
    const history = getHistorySessionsLocal();
    const newSession: GameSession = {
      ...session,
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString()
    };
    
    // Save new session at the beginning, limit to 50 entries to avoid bloating cookies/storage
    const updatedHistory = [newSession, ...history].slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    return updatedHistory;
  } catch (e) {
    console.error("Error saving history to localStorage", e);
    return getHistorySessionsLocal();
  }
};

export const getTotalCoinsLocal = (): number => {
  try {
    const data = localStorage.getItem(COINS_KEY);
    if (!data) {
      localStorage.setItem(COINS_KEY, '50');
      return 50;
    }
    return parseInt(data, 10);
  } catch (e) {
    return 50;
  }
};

export const addTotalCoinsLocal = (amount: number): number => {
  try {
    const current = getTotalCoinsLocal();
    const next = Math.max(0, current + amount);
    localStorage.setItem(COINS_KEY, next.toString());
    return next;
  } catch (e) {
    return 0;
  }
};

import { PlayerSkills } from '../types';

const SKILLS_KEY = '@sobrecarga:skills';

export const getPlayerSkillsLocal = (): PlayerSkills => {
  try {
    const data = localStorage.getItem(SKILLS_KEY);
    const parsed = data ? JSON.parse(data) : {};
    return {
      doubleJump: parsed.doubleJump || false,
      shield: parsed.shield || false,
      magnet: parsed.magnet || false,
      resilience: parsed.resilience || 0,
      betterShoes: parsed.betterShoes || false,
      hoodie: parsed.hoodie || false,
      hoodieColor: parsed.hoodieColor || '#dc2626',
      cap: parsed.cap || false,
      capColor: parsed.capColor || '#ef4444',
      bicycle: parsed.bicycle || false,
      skate: parsed.skate || false,
      patinete: parsed.patinete || false,
      soccerKit: parsed.soccerKit || false,
      calmingTea: parsed.calmingTea || false,
      breathingBand: parsed.breathingBand || false,
      activeVehicle: parsed.activeVehicle || 'none',
      activeShoes: parsed.activeShoes || 'basic',
      ownedShoes: parsed.ownedShoes || ['basic'],
    };
  } catch {
    return { doubleJump: false, shield: false, magnet: false, resilience: 0, betterShoes: false, hoodie: false, hoodieColor: '#dc2626', cap: false, capColor: '#ef4444', bicycle: false, skate: false, patinete: false, soccerKit: false, calmingTea: false, breathingBand: false, activeVehicle: 'none', activeShoes: 'basic', ownedShoes: ['basic'] };
  }
};

export const savePlayerSkillsLocal = (skills: PlayerSkills) => {
  try {
    localStorage.setItem(SKILLS_KEY, JSON.stringify(skills));
  } catch (e) {
    console.error("Error saving skills", e);
  }
};
