/*
 * Several utilities for parsing combatantinfo events, intended for use by functional analyzers
 */
import { CombatantInfoEvent } from 'parser/core/Events';

export function hasTalent(combatantInfo: CombatantInfoEvent, spellId: number): boolean {
  return combatantInfo.talents.find(talent => talent.id === spellId) !== undefined;
}

export function hasTrinket(combatantInfo: CombatantInfoEvent, itemId: number): boolean {
  return false; // TODO
}

export function hasLegendaryByBonusId(combatantInfo: CombatantInfoEvent, bonusId: number): boolean {
  return false; // TODO
}

export function hasCovenant(combatantInfo: CombatantInfoEvent, covenantId: number): boolean {
  return combatantInfo.covenantID === covenantId;
}

export function hasConduit(combatantInfo: CombatantInfoEvent, spellId: number): boolean {
  return false; // TODO
}

export function getConduitRank(combatantInfo: CombatantInfoEvent, spellId: number): number {
  return 0; // TODO
}


