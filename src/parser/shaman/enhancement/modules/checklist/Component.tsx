import React from 'react';
import PropTypes from 'prop-types';

import Checklist from 'parser/shared/modules/features/Checklist';
import PreparationRule from 'parser/shared/modules/features/Checklist/PreparationRule';
import Rule from 'parser/shared/modules/features/Checklist/Rule';
import Requirement from 'parser/shared/modules/features/Checklist/Requirement';
import SPELLS from 'common/SPELLS';
import SpellLink from 'common/SpellLink';
import GenericCastEfficiencyRequirement from 'parser/shared/modules/features/Checklist/GenericCastEfficiencyRequirement';

const EnhancementShamanChecklist = ({ castEfficiency, combatant, thresholds }: any) => {
  const AbilityRequirement = (props: any) => (
    <GenericCastEfficiencyRequirement
      isMaxCasts
      castEfficiency={castEfficiency.getCastEfficiencyForSpellId(props.spell)}
      {...props}
    />
  );

  AbilityRequirement.propTypes = {
    spell: PropTypes.number.isRequired,
  };

  return (
    <Checklist>
      <Rule
        name="Always be casting"
        description={<>You should try to avoid doing nothing during the fight. If you have to move, try casting something instant with range like <SpellLink id={SPELLS.FLAMETONGUE.id} /> or <SpellLink id={SPELLS.ROCKBITER.id} /></>}
      >
        <Requirement name="Downtime" thresholds={thresholds.alwaysBeCasting} />
      </Rule>
      <Rule
        name="Use your offensive cooldowns as often as possible"
        description={(
          <>
            You should aim to use your offensive cooldowns as often as you can to maximize your damage output.{' '}
            <a href="https://www.wowhead.com/enhancement-shaman-rotation-guide#offensive-defensive-cooldowns" target="_blank" rel="noopener noreferrer">More info.</a>
          </>
        )}
      >
        <AbilityRequirement spell={SPELLS.FERAL_SPIRIT.id} />
        <AbilityRequirement spell={SPELLS.EARTH_ELEMENTAL.id} />
        {combatant.hasTalent(SPELLS.ASCENDANCE_TALENT_ENHANCEMENT.id) &&
        <AbilityRequirement spell={SPELLS.ASCENDANCE_TALENT_ENHANCEMENT.id} />}
        {combatant.hasTalent(SPELLS.EARTHEN_SPIKE_TALENT.id) &&
        <AbilityRequirement spell={SPELLS.EARTHEN_SPIKE_TALENT.id} />}
      </Rule>

      <Rule
        name="Maintain your buffs"
        description="You should maintain your buffs in order to passively increase your damage done to targets without refreshing them too early."
      >
        <Requirement name={<> <SpellLink id={SPELLS.LIGHTNING_SHIELD.id} /> uptime</>} thresholds={thresholds.lightningShieldUptime} />

        <Requirement name={<> <SpellLink id={SPELLS.FLAMETONGUE.id} /> uptime</>} thresholds={thresholds.flametongueUptime} />
        {!combatant.hasTalent(SPELLS.SEARING_ASSAULT_TALENT.id) &&
        <Requirement name={<> <SpellLink id={SPELLS.FLAMETONGUE.id} /> early refreshes</>} thresholds={thresholds.flametongueEarlyRefreshes} />}

        {combatant.hasTalent(SPELLS.HAILSTORM_TALENT.id) &&
        <Requirement name={<> <SpellLink id={SPELLS.FROSTBRAND.id} /> uptime</>} thresholds={thresholds.frostbrandUptime} />}
      </Rule>
      <PreparationRule thresholds={thresholds} />
    </Checklist>
  );
};

EnhancementShamanChecklist.propTypes = {
  castEfficiency: PropTypes.object.isRequired,
  combatant: PropTypes.shape({
    hasTalent: PropTypes.func.isRequired,
  }).isRequired,
  thresholds: PropTypes.object.isRequired,
};

export default EnhancementShamanChecklist;
