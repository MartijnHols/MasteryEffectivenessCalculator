import SPELLS from 'common/SPELLS';
import Spell from 'common/SPELLS/Spell';
import Combatant from 'parser/core/Combatant';
import { CombatantInfoEvent } from 'parser/core/Events';
import { hasTalent } from 'parser/core/combatantInfoUtils';

export const DAMAGING_ABILITIES = [
  SPELLS.STARSURGE_MOONKIN.id,
  SPELLS.STARSURGE_AFFINITY.id,
  SPELLS.STARFIRE.id,
  SPELLS.WRATH_MOONKIN.id,
  SPELLS.WRATH.id,
  SPELLS.SUNFIRE_CAST.id,
  SPELLS.MOONFIRE_CAST.id,
  SPELLS.STARFALL_CAST.id,
  SPELLS.FULL_MOON.id,
  SPELLS.HALF_MOON.id,
];

// Celestial Alignment buff or the talented version of it (Incarnation)
export const CA_BUFF = [SPELLS.CELESTIAL_ALIGNMENT, SPELLS.INCARNATION_CHOSEN_OF_ELUNE_TALENT];

export function cooldownAbility(combatant: Combatant): Spell {
  return combatant.hasTalent(SPELLS.INCARNATION_CHOSEN_OF_ELUNE_TALENT)
    ? SPELLS.INCARNATION_CHOSEN_OF_ELUNE_TALENT
    : SPELLS.CELESTIAL_ALIGNMENT;
}

// version for use with functional
export function cooldownAbilityFn(combatantInfo: CombatantInfoEvent): Spell {
  return hasTalent(combatantInfo, SPELLS.INCARNATION_CHOSEN_OF_ELUNE_TALENT)
    ? SPELLS.INCARNATION_CHOSEN_OF_ELUNE_TALENT
    : SPELLS.CELESTIAL_ALIGNMENT;
}
