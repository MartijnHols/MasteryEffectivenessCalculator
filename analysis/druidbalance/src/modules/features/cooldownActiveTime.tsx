import SPELLS from 'common/SPELLS';
import metric, { Info } from 'parser/core/metric';
import { AnyEvent } from 'parser/core/Events';
import coreCooldownActiveTime from 'parser/shared/metrics/cooldownActiveTime';
import { SuggestionImportance, WIPSuggestionFactory } from 'parser/core/CombatLogParser';
import { NumberThreshold, ThresholdStyle } from 'parser/core/ParseResults';
import { SpellLink } from 'interface';
import { cooldownAbilityFn } from '../../constants';
import COVENANTS from 'game/shadowlands/COVENANTS';
import React from 'react';
import { hasCovenant } from 'parser/core/combatantInfoUtils';

const MAJOR_COOLDOWN_IDS: number[] = [
  SPELLS.CELESTIAL_ALIGNMENT.id,
  SPELLS.INCARNATION_CHOSEN_OF_ELUNE_TALENT.id,
  SPELLS.RAVENOUS_FRENZY.id,
];

const MINOR = 0.02;
const AVERAGE = 0.04;
const MAJOR = 0.08;

/** Gets the percentage of time the player was active during major cooldowns. */
const cooldownActiveTime = metric((events: AnyEvent[], info: Info): number => {
  return coreCooldownActiveTime(events, info, MAJOR_COOLDOWN_IDS);
});

// TODO how to feed this into the checklist?
export const cooldownActiveTimeThresholds = (
  events: AnyEvent[],
  info: Info,
): NumberThreshold => {
  return {
    actual: cooldownActiveTime(events, info),
    isLessThan: {
      minor: MINOR,
      average: AVERAGE,
      major: MAJOR,
    },
    style: ThresholdStyle.PERCENTAGE,
  };
};

// TODO handling of thresholds less manual
export const cooldownActiveTimeSuggestion = (): WIPSuggestionFactory => (events, info) => {
  const { selectedCombatant } = info;
  const activeTime = cooldownActiveTime(events, info);
  let importance;
  if (activeTime > MINOR) {
    return [];
  } else if (activeTime > AVERAGE) {
    importance = SuggestionImportance.Minor;
  } else if (activeTime > MAJOR) {
    importance = SuggestionImportance.Regular;
  } else {
    importance = SuggestionImportance.Major;
  }
  return {
    text: (<>
      You had downtime during <SpellLink id={cooldownAbilityFn(selectedCombatant).id} />
      {hasCovenant(selectedCombatant, COVENANTS.VENTHYR.id) && (<> and <SpellLink id={SPELLS.RAVENOUS_FRENZY.id} /></>)}.
      Making full use of your major damage cooldowns is extremely important towards doing good DPS,
      making any downtime at all very bad. Where the encounter requires, you should plan the timing
      of your cooldowns to ensure you won't be interrupted by mechanics.
    </>),
    importance,
    icon: 'spell_mage_altertime',
    actual: activeTime,
    recommended: '100%',
  };
};
